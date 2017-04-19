<!--
author: yunfei
head:
date: 2016-04-19
title: ELK 日志管理方案介绍及使用
tags: log, Elasticsearch
images:
category: log analysis
status: publish
summary: ELK - Elasticsearch，Logstash，Kibana 是一整套开源日志管理方案。具有分布式、高效检索、适配性强等优点。三者功能相互独立，Logstash 负责文本数据的收集、处理、存储；Elasticsearch 负责数据的检索；Kibana 负责数据的可视化。但相互支持性良好，可很容易的配套使用。
-->

# 首先动机是啥？

分析日志。

以现在自己的情况为例，开了一个Nginx服务器，但有时候总会碰到服务器出错，直接去查日志太累，一大篇日志记录完全看不懂。这时候就需要一个日志分析查询工具来找出问题所在。除去查看错误日志外，还可以分析其他的日志得到一些有趣的信息。
可以运用的地方有：

- Nginx错误日志、个人错误日志 —— 故障排除
- Nginx访问日志，得到的信息比如哪些站点访问更多，访问的人群地理分布如何——这些当然有部分是可以通过百度/Goggle统计获得，但自己动手丰衣足食，定制性更强
- 手动引入的请求及API调用记录、调用时间日志，查看性能瓶颈
- 系统信息，包括CPU、内存、网络消耗等，完整掌握软件运行状态

简单点的可以用Graylog等简便工具查看，不过功能太弱，扩展性更弱，完全不能满足需求。这时就需要一个更好的解决方案。

# ELK - Elasticsearch, Logstash, Kibana

Elasticsearch，Logstash，Kibana 是一整套开源日志管理方案，通常配套使用，并且都先后并入 elastic 公司名下，因而常常合并简称 ELK。
但是三者都是相互独立的，具有各自的功能：

- Logstash 负责文本数据的收集、处理、存储
- Elasticsearch 负责数据的检索
- Kibana 负责数据的可视化

配套使用时，Logstash收集并处理日志，产生结构化数据，传入Elasticsearch作为其索引输入；Elasticsearch针对这些Logstash数据提供检索功能；Kibana则基于Elasticsearch的检索功能提供WEB界面以展示数据。


# Logstash

Logstash 是分析、处理、导出/存储文本数据(如日志)的工具 —— 简而言之, 在ELK中Logstash提供数据来源。

### Logstash 工作方式: pipeline

Logstash 以 **pipeline** 的形式工作, 类似如 node.js 的 stream 流程, 上一操作的输出作为下一操作的输入。主要分为 输入(input) -> 过滤(filter) -> 输出(output) 三部分。

以同样作为 node.js stream 方式工作的 gulp task 作为对比:

- `input` 对应 `gulp.src`, 负责接收输入文件, 产生初始输入流
- `filter` 对应 `gulp` 中间处理的 `pipe` 操作, 层层传递更改流数据
- `output` 对应 `gulp.dest`, 负责接收处理后的流数据, 并存储到文件中

当然Logstash的输入和输出不局限于文件, 比如接收控制台输入`stdin`, 输出到控制台`stdout`, 或者输出到Elasticsearch作为其索引输入。

当前的 Logstash pipeline 实现为多个流同时批量处理(micro-batching)，可以减少线程数降低资源竞争，提高线程活性(thread liveness)，以提升效率。

### Logstash 特点

- 分布式集群，可以收集任何地方的数据
- 扩展性强，自带的各类input、filter、output插件可以适配不同的输入、输出源，并且可以方便的自定义插件以支持新的数据源
- 性能配置性强，可以根据机器性能配置更高的效率(如batch数量, worker数量)，更可以搭配消息队列(Message Queue)避免数据源过高频率事件输入的阻塞(结构类似 datasource => logstash shipping node(仅传递事件) => message queue => logstash indexing node => elasticsearch)

### 安装示例 - 使用Logstash分析纪录Nginx服务器访问及错误日志

整个ELK配置启动中，仅Logstash需要配置，以处理日志提供数据源。数据源格式确定后，通过对应的Elasticsearch及Kibana

- 编写配置文件, 从 Nginx access.log, error.log 中解析日志数据

```
# nginx-logstash-pipeling.conf

# 输入
input {
    file {
        type => "nginx-access"
        path => "/var/nginx/access.log"
        start_position => beginning  # 从开始位置读取文件，而非默认的从结尾开始仅仅读取新加内容
        ignore_older => 0            # 不忽略旧文件
    }
    file {
        type => "nginx-error"
        path => "/var/nginx/error.log"
        start_position => beginning
        ignore_older => 0
    }
}

# 过滤: 指定对输入的处理
filter {
    # Nginx访问和错误日志分开解析
    if [type] == "nginx-access" {
        # grok是Logstash常用的默认插件之一, 指定输入文本格式, 返回解析后的json数据
        # 此处使用grok内置的格式(pattern)解析同格式的Nginx访问日志
        grok {
            match => { "message" => "%{COMBINEDAPACHELOG}+%{GREEDYDATA:extra_fields}" }
        }
    } else if [type] == "nginx-error" {
        grok {
            match => [ "message" , "(?<timestamp>%{YEAR}[./-]%{MONTHNUM}[./-]%{MONTHDAY}[- ]%{TIME}) \[%{LOGLEVEL:severity}\] %{POSINT:pid}#%{NUMBER}: %{GREEDYDATA:errormessage}(?:, client: (?<clientip>%{IP}|%{HOSTNAME}))(?:, server: %{IPORHOST:server}?)(?:, request: %{QS:request})?(?:, upstream: (?<upstream>\"%{URI}\"|%{QS}))?(?:, host: %{QS:request_host})?(?:, referrer: \"%{URI:referrer}\")?"]
        }
    }

    # geoip，另一个插件，为之前处理好的结构化数据中添加额外的地理位置信息
    geoip {
        source => "clientip"
    }
}

output {
    # 输出目标1: 默认传入本地Elasticsearch服务器作为索引文档(index document)，并按类型和时间导出到不同的索引中 (如果没有启动Elasticsearch则不必填写)
    elasticsearch {
        index => "%{type}-%{+YYYY.MM.dd}"
    }
    # 输出目标2: 写入本地文件
    file {
        path => "~/nginx-logstash.output"
    }
}
```

- 以指定配置文件方式启动: `logstash -f nginx-logstash-pipeling.conf`

### 问题解决

- 检查文件权限！Logstash以service形式启动时，其默认用户为`logstash`，访问nginx日志文件被拒。但是其启动时并不会提示文件权限不足！
    - 解决方案1: `chmod` 更改目标文件权限
    - 解决方案2: `/etc/default/logstash` => `LS_USER` 更改Logstash服务运行的用户
- 同时检查文件夹权限! Logstash 在使用通配符访问文件时, 需要该目录的执行权限(-x)
- `input.start_position => beginning` 仅在Logstash第一次读取文件时生效，之后Logstash将自己记录文件读取位置。想让Logstash重新从头开始读文件，删除对应的`$HOME/.sincedb...`读取位置记录文件即可


# Elasticsearch

Elasticsearch 提供了强大的数据检索功能，即便数据量相当庞大，也能非常快的查询结果。
可以搭配Logstash作为日志查询，但也可以独立运用于其他的数据检索，比如为淘宝/京东这样的网上商城提供商品查询，为博客网站提供文章查询。

Elasticsearch 的主要特点有：

- 实时 (real-time)
- 分布式集群 (distributed / cluster)，同Logstash一样
- 高效的查询功能
- 面向文档 (document oriented)，类似NoSQL的Couchdb，无需提前构建schema
- RESTFUL API，简单易用


# Kibana

这货没什么好介绍的。就是一个图形化界面，但是内置了插件，对Elasticsearch支持友好。
除了Kibana之外，也可以使用Grafana、Zoomdata等作为Elasticsearch的可视化工具。
