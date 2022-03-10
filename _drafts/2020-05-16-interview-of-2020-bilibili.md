---
layout: post
title: "2020年5月份bilibili面试总结"
tagline: ""
description: "这是一个悲伤的故事"
category: 面试
tags: [Android,Java,bilibili]
last_updated: 2020-05-16 21:00
---

这篇文章主要记录本人2020年5月面试bilibili安卓开发工程师岗位的经历，以供后期翻阅。

### 面试问题

本章主要记录下面试时面试官提的问题

1. 自我介绍
2. [HashMap原理](../04/HashMap.html)，如果只重写hashCode不重写equals会发生什么？
3. 为什么不能在子线程更新UI？
4. 如何检测卡顿？
5. 如何定位OOM？
6. 性能优化如何做？
7. LiveData原理
8. Retrofit原理，除了使用动态代理还有什么办法可以生成接口类的对象？
9. SparseArray和ArrayMap的原理
10. LeakCanary原理
11. Java有几种锁？（问到这个问题我就懵了，面试也就没进行下去）

### 面试总结

1. bilibili面试时比较注重OOM、性能优化和多线程
2. 一定要熟悉多线程