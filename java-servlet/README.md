# 部署 java-servlet 工程

### Couchdb 备份与恢复

直接通过备份文件的方式备份数据库。各个文件路径可在配置文件 `local.ini` 中查找。

* 配置文件  示例: `/etc/couchdb/local.ini`
* 数据库文件 `[couchdb]`: `database_dir` `view_index_dir` `index_dir`. 示例: `/var/lib/couchdb`
* 日志文件  `[log]`: `file`. 示例: `/var/log/couchdb/couch.log`

详见<a href="https://wiki.apache.org/couchdb/How_to_make_filesystem_backups">Couchdb文件备份</a>。