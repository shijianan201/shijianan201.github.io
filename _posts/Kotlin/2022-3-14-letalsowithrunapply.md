---
layout: post
title: "let、with、run、apply、also函数的用法"
tagline: ""
description: ""
category: Kotlin
tags: [内联函数]
last_updated: 2022-03-14 21:00
---

本文主要记录Kotlin中let、with、run、apply和also这几个内联函数的使用方法和底层原理。以下代码都以下列的User类的对象user为例。

```kotlin
class User(var name: String, var age: Int)
```

### let

let源码如下

```Kotlin
@kotlin.internal.InlineOnly
public inline fun <T, R> T.let(block: (T) -> R): R {
    contract {
        callsInPlace(block, InvocationKind.EXACTLY_ONCE)
    }
    return block(this)
}
```

通过源码可以看出let函数是类型T的扩展函数，参数需要传入一个闭包，闭包内返回R类型，最后整个let函数返回R类型对象。

使用方法如下

```kotlin
val res: String = user.let {
        it.name = "越活越年轻"
        it.age = 27
        "123" //处理完后返回的值，可以是任意类型，如果不写默认是Unit对象
    }
 val res1:Unit = user.let { } // 默认返回Unit对象
```

通过例子可看出let函数内部可以通过``it.``的方式设置属性，最后还可以选择返回一个值（如果不返回值则默认是unit对象）

### with

with源码如下

```kotlin
@kotlin.internal.InlineOnly
public inline fun <T, R> with(receiver: T, block: T.() -> R): R {
    contract {
        callsInPlace(block, InvocationKind.EXACTLY_ONCE)
    }
    return receiver.block()
}
```

源码中with是个顶层函数，参数有两个，第一个参数需要传入我们需要处理的对象，第二个参数是一个T的扩展函数的闭包，闭包返回R类型，最后整个函数返回R类型。

使用方法如下

```kotlin
val with = with(user){
        this.name = "with来了"
        this.age = 26
        "1234" //处理完后返回的值，可以是任意类型，如果不写默认是Unit对象
    }
val with1:Unit = with(user){ } //默认返回Unit对象
```

通过例子看出with函数和let功能差不多，但是with是一个顶层函数，可以直接调用。

### run

源码如下

```kotlin
@kotlin.internal.InlineOnly
public inline fun <T, R> T.run(block: T.() -> R): R {
    contract {
        callsInPlace(block, InvocationKind.EXACTLY_ONCE)
    }
    return block()
}
```

run方法是T的一个扩展函数，参数需要传入一个T类型的闭包，闭包内需要返回R类型，最后整个run返回R类型。

用法如下

```Kotlin
val run = user.run {
        this.name = "run run run"
        this.age = 3
        "123455" //处理完后返回的值，可以是任意类型，如果不写默认是Unit对象
    }
val run1:Unit = user.run {  } //默认返回Unit对象
```

run方法基本与let差不多，区别在于run方法传入的参数是T的扩展函数的闭包，而let传入的是参数为T的闭包。

### apply

apply源码如下

```kotlin
@kotlin.internal.InlineOnly
public inline fun <T> T.apply(block: T.() -> Unit): T {
    contract {
        callsInPlace(block, InvocationKind.EXACTLY_ONCE)
    }
    block()
    return this
}
```

apply方法是T的一个扩展函数，需要传入一个T的扩展函数的闭包，闭包返回Unit类型，最后apply方法返回T类型。

apply的使用方法如下

```Kotlin
val apply = user.apply {
        this.name = "apply apply apply"
        this.age = 5
    }
val apply1 = user.apply {  } //返回的还是当前调用的User对象
```

apply返回的还是自身对象

### also

源码如下

```kotlin
@kotlin.internal.InlineOnly
@SinceKotlin("1.1")
public inline fun <T> T.also(block: (T) -> Unit): T {
    contract {
        callsInPlace(block, InvocationKind.EXACTLY_ONCE)
    }
    block(this)
    return this
}
```

also方法是T的一个扩展函数，需要传入一个参数为T的闭包，闭包返回Unit对象，also函数最后返回的还是调用对象。

用法如下

```Kotlin
    val also = user.also {
        it.name = "also also alse "
        it.age = 7
    }
```

also返回的和apply一样，都是调用者自身

### 使用场景

[Kotlin系列之let、with、run、apply、also函数的使用](https://blog.csdn.net/u013064109/article/details/78786646)

[Kotlin 操作符：run、with、let、also、apply 的差异与选择](https://juejin.cn/post/6844903517023387662)

