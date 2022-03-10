---
layout: post
title: "Git常见问题及解决方案"
tagline: ""
description: ""
category: Git
tags: [Git]
last_updated: 2020-03-11 15:00
---

## pull

问题描述：在新项目的本地执行```git pull```命令时，出现```fatal: refusing to merge unrelated histories```错误。

出现原因：因为本地库和远端库是两个根本不相干的 git 库，然后本地要去推送到远端， 远端觉得这个本地库跟自己不相干， 所以告知无法合并

解决方案：

```javascript
git pull origin master --allow-unrelated-histories
```

参考文章：[git 出现 fatal: refusing to merge unrelated histories 错误](https://www.centos.bz/2018/03/git-出现-fatal-refusing-to-merge-unrelated-histories-错误/)