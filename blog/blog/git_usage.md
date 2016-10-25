<!--
author: yunfei
head:
date: 2016-03-24
title: git 使用指南
tags: git
images:
category: git
status: publish
summary:
-->

# 进阶功能

### 保留本地开发改动 - `git update-index --skip-worktree`

仓库代码在不同地方执行时，有可能需要不同的配置文件，这些不同环境导致的配置更改又不能提交到仓库中，于是总是在本地临时修改，并让git忽略这些改动以避免不小心提交。

`git update-index`提供两种方式忽略文件改动：

- `--assume-unchanged` git忽略文件改动，但是当切换分支（checkout）、重置分支（reset --hard）包含该文件改动时，本地改动将被覆盖！这条命令的正确使用场景是通知git用户**不会修改**这些文件，比如SDK文件，以**提升git性能**。
- `--skip-worktre` 通知git忽略文件改动，因为用户**会修改**这些本地文件。在切换分支包含该文件改动时，git尝试合并改动而非覆盖（或者提示冲突而拒绝），重置分支也不会修改文件。这条命令才适合于本地修改配置文件。


### 从git仓库中彻底删除文件 - `git filter-branch`

有时由于不小心，将敏感的文件如access key，或者不必要的大文件如编译结果文件提交到了git仓库，即便下一次提交删除了这些文件，git作为一个版本管理工具依然会在仓库中保存这些被删除的文件，导致了安全问题，以及git仓库体积变大。

git提供filter-branch指令从仓库中删除文件（注意：仓库修改后历史丢失，不可回退！）：

```
$ git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch PATH-TO-YOUR-FILE-WITH-SENSITIVE-DATA' \
--prune-empty --tag-name-filter cat -- --all

// produce something like:
// > Rewrite 48dc599c80e20527ed902928085e7861e6b3cbe6 (266/266)
// > Ref 'refs/heads/master' was rewritten
```

然后对每一个被修改的分支使用 `git push --force` 强制更新远程仓库。

# 引用参考

- [git filter-branch](https://help.github.com/articles/remove-sensitive-data/)