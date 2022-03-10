---
layout: post
title: "Mac电脑常用快捷键和设置"
tagline: ""
description: "mac电脑常用快捷键和设置"
category: Mac
tags: [快捷键]
last_updated: 2020-04-16 9:00
---

这篇文章主要记录下Mac电脑下常用的一些快捷键和设置的方法

* [mac创建桌面快捷方式](https://blog.csdn.net/IDOshi201109/article/details/48912119)

  ```markdown
  Option+Command+拖动文件夹或者应用程序图标
  ```

* [mac通过命令行启动模拟器](https://juejin.im/post/5bcfe1e7518825779a41fa5e)

  ```markdown
  1、找到android sdk安装目录（一般是/Users/用户名/Library/Android/sdk）
  2、进入tools文件夹
  3、emulator -list-avds //列出所有模拟器
  4、emulator -avd 想要启动的模拟器名称
  ```

* [mac下.zshrc和.bash_profile同时生效](https://blog.csdn.net/themagickeyjianan/article/details/80239710)

  ```markdown
  在.zshrc文件最末尾加上source ~/.bash_profile命令
  ```

* [mac查看android签名文件信息](https://blog.csdn.net/emptoney/article/details/59544060)

  ```markdown
  keytool -list -v -keystore 签名文件路径
  ```

  