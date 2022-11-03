---
layout: post
title: "Kotlin中异常的处理和传播"
tagline: ""
description: ""
category: Kotlin
tags: [协程,异常]
last_updated: 2022-04-015 17:00
---

本文主要记录Kotlin中suspend关键字和async函数的使用及源码解读

书接上回[Kotlin协程的使用以及launch源码解读](/post/2022/04/coroutine-launch.html)

### 代码示例

下文中代码均以此示例为例，不再赘述。

初始源码为：

```kotlin
fun main(args: Array<String>) {
    GlobalScope.launch {
        println("scope start")
        val job = withContext(Dispatchers.IO) {
            delay(1000)
            println("with end")
            "1"
        }
        val asyncJob  = async{
            println("async start")
            delay(2000)
            "async end"
        }
        val res = asyncJob.await()
        println("scope end $res")
    }
    println("Main end")
}

输出结果：
Main end
scope start
with end
async start
scope end async end
```

这里有几个问题：

1. Main end为什么会最先打印？（launch源码中已经解释了为啥）
2. 为什么协程能实现asyncJob中的异步调用一定在job中的异步调用执行完毕后再开始执行呢？
3. 为什么协程最后的scope end打印一定会在asyncJob调用await完毕后再执行？

为了搞懂第2个问题我们先看下suspend源码里是怎么实现的

### suspend源码



### 参考文章

[Kotlin协程实现原理:挂起与恢复](https://www.rousetime.com/2020/11/23/Kotlin%E5%8D%8F%E7%A8%8B%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86-%E6%8C%82%E8%B5%B7%E4%B8%8E%E6%81%A2%E5%A4%8D/)
