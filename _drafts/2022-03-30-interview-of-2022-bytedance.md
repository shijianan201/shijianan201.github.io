---
layout: post
title: "2022年字节跳动Android面试总结"
tagline: ""
description: "这是一个悲伤的故事"
category: 面试
tags: [Android,Java]
last_updated: 2022-04-13 21:00
---

本文记录2022年字节跳动国际化产品高级安卓研发工程师职位的面试过程，总共进行了三面，最后三面后收到问卷调查了（三面自我感觉最好、一面二面我都觉得挂了，不知为啥一直面到三面了）。

### 一面题目

一面问的题目是最多的而且都挺考验大脑的灵活性的，大部分都是我这个菜鸡没处理过的（哈哈），基本都是现场想出来再说的。

#### 线上OOM如何定位

OOM一般发生在JVM内存中，当堆、栈、方法区无法分配内存时都会抛出这个Error

1. 在APP里启动一个在另外一个进程运行的后台service
2. 通过Thread.setDefaultUncaughtExceptionHandler()方法捕获OOM异常
3. 当发生了OOM时，通过这个service把当前app的内存堆栈dump出来并上传云端
4. 同时对四大组件的生命周期和一些容易出现内存抖动的地方打上日志

#### 线上ANR如何定位

ANR的常见原因

1. 输入事件（例如按键或屏幕轻触事件等）在 5 秒内没有响应；

2. BroadcastReceiver 在 10 秒内没有执行完成。

ANR的特性

1. 当系统的 **system_server** 进程在检测到 App 出现 ANR 后，会向出现 ANR 的进程发送 **SIGQUIT (signal 3)** 信号。正常情况下，系统的 libart.so 会收到该信号，并调用 Java 虚拟机的 dump 方法生成 traces。

2. SIGQUIT信号是可以被拦截的，拦截完后在交回给系统处理。

解决办法

1. 使用Handler的特性，设置主线程中Looper的Printer为自己的Printer，判断执行时间时候超过5秒
2. 拦截SIGQUIT信号

#### 多线程下载文件是如何实现的？

1. 首先通过HttpUrlConnection获取到文件总体的size
2. 根据size大小进行切片，譬如1G的可以100M切一次
3. 对于每个切片使用一个线程对文件进行下载，下载过程中用一个临时文件存储进度，譬如第一行存储总大小，之后的每隔一行存储一个线程的进度，当然存储过程中操作这个文件对象时必须加锁。
4. 如果中途连接断开了则下次需要从断掉的位置继续下载，此时需要在header里传输Range字段（此时返回码也改为206了），并且使用RandomAccessFile进行接下来的文件操作。
5. 下载完毕后最好对文件进行完整性校验（通过比对本地和服务端的MD5值确认）。

#### 线程池的execute方法和submit方法有什么区别？

先来看看源码：

execute方法

```Java
void execute(Runnable command);//返回值是void，参数只有个Runnable对象
```

submit方法

```java
 <T> Future<T> submit(Callable<T> task);
 <T> Future<T> submit(Runnable task, T result);
 Future<?> submit(Runnable task);
```

submit方法返回值是Future，当调用Future.get()方法时可以拿到最后的值，同时这个get方法也会阻塞调用线程。

#### 对RN做过什么优化

1. 分包
2. 增量包
3. 抽离公共common包和业务包，内置通用的bundle，动态下发业务bundle
4. 应用开启时开启独立的线程加载common包，页面启动后并行加载bundle资源的方式
5. 使用CDN保存图片资源，动态下发，减少包体积
6. 使用PureComponent替换Component，减少由于调用setState造成的不必要的更新（Component中每调用一次setState会触发一次更新）

[快问快答setState方法](https://fe.azhubaby.com/React/%E5%BF%AB%E9%97%AE%E5%BF%AB%E7%AD%94setState.html)

#### 100X100的Bitmap如何显示左上角30X30区域

```java
canvas.drawBitmap(Bitmap,RectF,Paint)
```

#### Drawable的mutate方法

[Android：关于Drawable的缓存机制应该了解的知识](https://www.heqiangfly.com/2017/06/15/android-knowledge-point-drawable-cache/)

#### 算法题

删除字符串里的所有```b```和连续的```ac```

譬如：aabcc在执行完后就成了空字符串

思考：其实一开始看到题目的时候第一反应是先删除b，然后再用栈操作，但是当时前面面完后有点懵逼第一时间没考虑到该怎么用栈去做，当时没想出来，下来后想想其实思路也很简单，遍历字符串，碰到除了b和c的字符直接进栈，当碰到c则判断栈顶是不是a，是a则栈顶出栈，否则c进栈。

```kotlin
fun delete(text:String):String{
  val stack = Stack<Char>()
  text.forEach{ch->
		if(ch == 'b'){
      
    }else if(ch == 'c'){
      if(stack.isEmpty()){
        stack.push(ch)
      }else{
        val top = stack.peek()
        if(top == 'a'){
          stack.pop()
        }else{
          stack.push(ch)
        }
      }
    }else{
      stack.push(ch)
    }             
  }
  var res = ""
  stack.forEach{
    res = "${res}it"
  }
  return res
}
```

### 二面题目

二面面试官看着好年轻，看上去岁数比我还小，但二面问题对比一面其实还更简单。

#### 协程原理，suspend函数

[Kotlin协程原理](/post/2022/04/coroutine-launch-suspend)

#### 性能优化怎么做的，为什么要做

#### ReactNative虚拟dom的真实意义，Diff算法及复杂度

#### 权限申请源码（AMS）

#### 算法题

判断一棵二叉树是否是平衡二叉树及后续优化

#### 二面总结

二面给我的整体感觉不是很好，有下面几个点没做好：

1. 协程原理没讲好，只讲了几个关键函数和状态机，当时作为第一个题目有点紧张，瞎几把答的
2. dom树理解不够，当时说的dom树的意义是性能优化（其实深入思考下dom树其实就是真实dom的一层封装，方便我们后续更灵活的操作真实dom，从而实现一些优化操作）
3. 平衡二叉树写的先序遍历（效率最差的一种），这个用后序遍历会好很多，平时刷LeetCode还是要多看看优化思路，面试官还提示了使用BFS（我给出了相关思路，可能二面没挂是因为这）

### 三面题目

三面是他们业务端的Leader来面的，其实整个过程给我的感觉比一面二面都要好，反问环节面试官说要和前两位面试官商量一下然后再让HR再找我，但面完第三天收到感谢信了。

#### app做过哪些优化

网络优化

1. DNS优化方案（HTTPDNS）
2. 使用缓存

启动项优化

1. 不必要的启动项实行懒加载
2. 使用子线程进行初始化（如何解决同步问题？？？）

内存优化

1. 解决内存泄漏
2. 内存溢出处理

布局优化

1. 减少层级（使用ConstraintLayout或者merge标签）
2. ViewStub进行懒加载

#### 朋友圈功能如何实现

#### Android新版本的特性

#### 算法题

整数转文字，譬如**120345**转化后为**十二万零三百四十五**

具体可看[整数转文字](/post/2022/04/int-to-string)

#### 三面总结

三面可能挂的问题有这几个：

1. 对app的优化经验不足
2. 项目大都是B端，没有大型C端项目经验，被面试官嫌弃了
3. 开放性题目只给出了基础的数据库设计，没有发散思维（譬如自己对于朋友圈的功能的一些想法没多思考）
4. 算法做的不行，主体逻辑虽然都实现了，但是对于零和一些特殊情况的处理不够（做算法题前先至少思考三分钟，考虑清楚所有情况再做）

### 反思

1. 太紧张了、有点毛躁，写算法没考虑清楚就开始写，导致很多异常的情况没考虑到
2. 协程提前看了源码，以为懂了，但是到要说的时候说的乱七八糟，还是要好好总结下
3. 优化经验必须要懂，没做过也要去网上找案例然后说成是自己做的
4. 对于开放性的题目可以多发散思维
5. **对问题不要处于一知半解的状态，必须全部搞懂，否则就不要去了解**
