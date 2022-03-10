---
layout: post
title: "ReactNative常见BUG以及解决方案"
tagline: ""
description: ""
category: ReactNative
tags: [BUG]
last_updated: 2019-11-11 17:09
---

这篇文章主要记录ReactNative开发过程中碰到的一些BUG以及对应的解决方案。

### ScrollView与TextInput控件共存导致切换输入框时需要点两下输入框才会显示软键盘

现象描述：当ScrollView中有多个TextInput时，用户想切换输入框时需要**点击两次**第二个输入框才能弹出软键盘并且第一次点击时软键盘会消失

解决办法：给ScrollView加上**keyboardShouldPersistTaps**属性并且设置属性的值为**handled**

```
<ScrollView keyboardShouldPersistTaps={'handled'}>...</ScrollView>
```

原因：待考究源码

参考网址：

[react-native开发总结之TextInput失去焦点触发事件和TextInput间切换](https://blog.csdn.net/weixin_41717785/article/details/81318212)

[官方中文ScrollView文档](https://reactnative.cn/docs/0.45/scrollview/)

###　React Native 错误 Module does not exist in the module map

现象描述：自己写了个View想在RN使用，确认原生代码无任何问题的情况下RN控制台报错

解决办法：参考下面网址

原因：待考究RN加载module的机制

参考网址：

[React Native 错误 Module does not exist in the module map](https://www.cnblogs.com/wukong1688/p/10939453.html)