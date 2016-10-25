<!--
author: yunfei
head:
date: 2016-04-05
title: iptables 实现流量配额控制，以及仅开放22和80端口
tags: script, iptables
images:
category: script
status: publish
summary:
-->

# iptables

iptables 是linux中的一个包过滤框架，通过设置一系列的匹配规则，自定义包的处理，可以达到各种各样的功能，如限制ip连接数、限速、限流量等。

这里使用的是限制总流量配额的功能，因为所使用的服务器流量是按量付费，需要限制使用量。


# iptables 流量配额控制设置

当所用的服务器是按量付费时，就需要限制流量使用量以避免大额的流量费。

如下两行命令，即可启动流量配额上限设置：

```
$ iptables -A OUTPUT -p tcp -m quota --quota 1024000 -j ACCEPT
$ iptables -A OUTPUT -p tcp -j DROP
```

# iptables 仅对外开放22和80端口设置

安全起见，内部使用的端口不必暴露给外部访问，可以设置仅允许外部访问 22（ssh连接）和 80（http连接）端口。
运行多个占用不同端口的服务时可以使用反向代理转发请求。

```
// 以下四条规则开放22和80端口的流入和流出
$ iptables -A INPUT -p tcp --dport 22 -j ACCEPT
$ iptables -A OUTPUT -p tcp --sport 22 -j ACCEPT
$ iptables -A INPUT -p tcp --dport 80 -j ACCEPT
$ iptables -A OUTPUT -p tcp --sport 80 -j ACCEPT

// 以下规则允许本地之间的其他端口的通信，比如反向代理在内部将80端口请求转发到其他端口
$ iptables -A INPUT -s 127.0.0.1 -d 127.0.0.1 -j ACCEPT

// 以下规则禁止所有其他形式的访问
$ iptables -P INPUT DROP
$ iptables -P FORWARD DROP
$ iptables -P OUTPUT DROP
```

在其间可以加入规则，允许本地之间的其他端口的通信：

```
iptables -A INPUT -s 127.0.0.1 -d 127.0.0.1 -j ACCEPT
```

# iptables 命令详解

### iptables 结构总览

```
Table {
    Chain {
        Rule {
            (match, match, ...)
            target
        }
    }
}
```

### iptables 规则语法

```
$ iptables <指定链和操作-chain> <指定匹配规则-match> <指定匹配后的操作-target>
// 示例：
$ iptables -A OUTPUT          -m tcp -dport 80   -j ACCEPT
```

### iptables 结构解释

以上面的流量配额限制的命令为例做解释：

```
$ iptables -A OUTPUT -p tcp -m quota --quota 1024000 -j ACCEPT
$ iptables -A OUTPUT -p tcp -j DROP
```

- `-A OUTPUT` 代表在`OUTPUT`链中添加一条规则，`OUTPUT`是iptables规则中的一个链(Chain)，代表流出的流量包，总共有三个(INPUT, FORWARD, OUTPUT)，区分不同场景的规则
- `-p tcp` 是iptables的协议参数（`--protocol``）。匹配规则的一部分
- `-m quota --quota 1024000` 是该条规则的另一匹配规则(match)，匹配通过则执行后面指定的操作(target)。这里用quota做匹配，限制1M流量(1024000 Bytes)
- `-j ACCEPT` 指定匹配成功后的执行操作，`ACCEPT`代表接受，`DROP`代表丢弃包

这两条规则合起来：
- 第一条指定：对于流出的tcp协议包，如果流量没有超过限制，则允许通过。
- 当第一条规则匹配失败，即流量超过后，顺序第二条规则生效。第二条规则指定：拒绝所有的tcp协议流出包。

两者合起来，流量限制内通过，流量超出后拒绝，达到控制流量的目的。

另，针对tcp端口匹配有两种：--sport, --dport，其区别是包的连接两段的方向
- `--sport`，source port，指定连接的来源段
- `--dport`，destination port，指定链接的目的端
