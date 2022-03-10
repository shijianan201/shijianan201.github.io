---
layout: post
title: "Java异常Throwable总结"
tagline: ""
description: ""
category: Java
tags: [Throwable,Exception,Error]
last_updated: 2021-04-05 19:00
---

本文记录个人关于Java异常机制的理解和总结。

首先先看Java关于异常的类结构图

![异常机制类图](/images/blog/java/java_exception.jpeg)

### 用法

```kotlin
fun main() {
    try{
			
    }catch (e:Exception){
        e.printStackTrace()
    }finally {
			  //finally语句一定会执行，并且优先于return执行（就算天皇老子来了也会执行）
    }
}
```

方法抛出异常

