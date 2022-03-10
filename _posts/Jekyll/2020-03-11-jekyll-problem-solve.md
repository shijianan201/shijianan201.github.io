---
layout: post
title: "Jekyll常见问题及解决方案"
tagline: ""
description: ""
category: Jekyll
tags: [Jekyll]
last_updated: 2020-03-11 15:00
---

## 启动错误

问题描述：在博客项目根目录执行```bundle exec jekyll serve```命令时，出现``` Could not find nokogiri-1.10.9-x64-mingw32 in any of the sources (Bundler::GemNotFound)```错误。

出现原因：因为没有安装或更新nokogiri库

解决方案：

```javascript
博客项目根目录执行bundle install命令
```

参考文章：[Could not find nokogiri-1.7.0.1 in any of the sources](https://github.com/rubygems/bundler/issues/6006)



问题描述：在博客项目根目录执行```bundle exec jekyll serve```命令时，出现``` Error:  Permission denied - bind(2) for 127.0.0.1:4000```错误。

出现原因：有其他程序占用了4000端口

解决方案：

```javascript
找到占用4000端口的应用并杀死此应用进程，重新启动jekyll
```

参考文章：[jekyll serve启动报错,error:permission denied -bind(2)](https://segmentfault.com/q/1010000010483290)

