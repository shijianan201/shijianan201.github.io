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

Java的异常都继承自**Throwable**，异常分两个大类**Exception**和**Error**

1. Exception代表普通的异常，譬如常见的NullPointerException、ArrayIndexOutOfBoundsException等，Exception使用```try{}catch}{}finally{}```语句块进行处理
   1. Exception又分**运行时异常**和**非运行时异常**。运行时异常是指写代码时可处理也可不处理的那种异常，写代码时不会报错，但是运行时就会崩溃；非运行时异常指的是那些编码过程中如果不使用trycatch捕获ide就会报错的那种异常，譬如IOException。
   2. 非运行时异常又称为受检异常（**checked exception**）
2. Error代表错误，一般是由系统抛出的，譬如StackOverFlowError、OutOfMemoryError，Error一般不建议捕获，因为一般来说程序发生了Error系统就无法继续往下运行（但某些情况下实际上也可以通过trycatch机制捕获）

### 用法

```kotlin
fun tryCatch():Int{
    var i = 0
    try{
        i++
        //这里如果发生异常或抛出异常整个结果为3
        throw NullPointerException("asdas")
        return i
    }catch (e:NullPointerException){
        i++
        return i
    }finally {
        //finally语句一定会执行，并且优先于return执行（就算天皇老子来了也会执行）
        i++
        return i // 去除这句会导致返回值少1，加上后try和catch中的return语句都失效
    }
}
```

1. 如果不去掉finally中的return语句那么这个函数返回2，执行try和fnally的i++，最后finally中的return语句执行
2. 如果去掉finally中的return那么这个函数返回1，首先执行try语句的i++，然后缓存try语句里i的值作为返回值，最后finally的i++也会执行，但是finally语句的结果不作为返回值返回。**对于基本类型是这样处理的，但是引用类型就不一样了，finally的改动也会映射到对象上**，**finally如果有return语句会导致try和catch中的return无效。**
3. 如果try语句里i++后发生了异常，那么这里返回值为3

### 异常原理

JVM使用异常表来处理异常的逻辑，异常表里分别会记录try、catch和finally三个语句块的指令的开始和结束位置，然后如果发生异常的话就跳到指定位置进行执行，这里具体可以看一下**深入理解Java虚拟机**那本书里虚拟机执行子系统这章看看。

