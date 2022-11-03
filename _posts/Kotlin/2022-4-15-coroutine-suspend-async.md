---
layout: post
title: "Kotlin中suspend和async源码解读"
tagline: ""
description: ""
category: Kotlin
tags: [协程]
last_updated: 2022-04-03 17:00
---

本文主要记录Kotlin中**suspend**关键字和**async**函数的使用及源码解读

书接上回[Kotlin协程的使用以及launch源码解读](/post/2022/04/coroutine-launch.html)

### 前置知识

对于suspend函数系统会自动为其生成一个```Continuation```参数，```Continuation```参数里会携带函数原来定义的返回值，```Continuation```接口定义如下：

```kotlin
public interface Continuation<in T> {
    /**
     * The context of the coroutine that corresponds to this continuation.
     */
    public val context: CoroutineContext

    /**
     * Resumes the execution of the corresponding coroutine passing a successful or failed [result] as the
     * return value of the last suspension point.
     */
    public fun resumeWith(result: Result<T>)
}
```

```resumeWith```函数用于在合适的时机调用，然后恢复协程运行

譬如定义如下testSuspend函数

```kotlin
fun testSuspend():String{
	delay(400)
	return ""
}
```

这个函数在编译后会变为

```kotlin
public static Object testSuspend(Continuation $complete){
	 //....
}
```

$complete里会携带String信息，这里由于泛型擦除导致泛型被擦除掉。

### suspend关键字和withContext函数

suspend和withContext最常见的用法如下：

```kotlin
fun main(args: Array<String>) {
     println("Main Start")
    GlobalScope.launch {
        val startStamp = System.currentTimeMillis()
        println("scope start")
        val userId = getUser()
        println("userid：$userId，当前时间：${System.currentTimeMillis()}，耗时：${System.currentTimeMillis()-startStamp}")
        val avatarUrl = getAvatarUrl(userId)
        println("avatar：$avatarUrl，当前时间：${System.currentTimeMillis()}，耗时：${System.currentTimeMillis()-startStamp}")
    }
    println("Main end")
    Thread.sleep(4000)
}

suspend fun getUser():Int = withContext(Dispatchers.IO){
    delay(1000)
    1
}

suspend fun getAvatarUrl(userId:Int):String = withContext(Dispatchers.IO){
    delay(2000)
    "https://avatar"
}

输出结果为：
Main Start
Main end
scope start
userid：1，当前时间：1649999052854，耗时：1015
avatar：https://avatar，当前时间：1649999054861，耗时：3022
```

通过输出结果可以看出getAvatarUrl是在getUser执行完毕后才开始执行的，按Java常理异步请求如果用这种同步的方法去写异步请求那请求是会同时启动的，那协程是如何实现这种同步的方式代码串联异步请求的呢？通过把Kotlin代码转换为字节码我们来研究一下getUser函数是如何实现的，getUser字节码如下：

```kotlin
public static final Object getUser(@NotNull Continuation $completion) {
      return BuildersKt.withContext((CoroutineContext)Dispatchers.getIO(), (Function2)(new Function2((Continuation)null) {
         int label;//状态机流转的标签，初始为0

         @Nullable
         public final Object invokeSuspend(@NotNull Object $result) {
            Object var2 = IntrinsicsKt.getCOROUTINE_SUSPENDED();
            switch(this.label) {
            case 0:
               ResultKt.throwOnFailure($result);
               this.label = 1;
               if (DelayKt.delay(1000L, this) == var2) {
                  return var2;
               }
               break;
            case 1:
               ResultKt.throwOnFailure($result);
               break;
            default:
               throw new IllegalStateException("call to 'resume' before 'invoke' with coroutine");
            }

            return Boxing.boxInt(1);
         }

         @NotNull
         public final Continuation create(@Nullable Object value, @NotNull Continuation completion) {
            Intrinsics.checkNotNullParameter(completion, "completion");
            Function2 var3 = new <anonymous constructor>(completion);
            return var3;
         }

         public final Object invoke(Object var1, Object var2) {
            return ((<undefinedtype>)this.create(var1, (Continuation)var2)).invokeSuspend(Unit.INSTANCE);
         }
      }), $completion);
   }
```

通过字节码和源码对比可以看出

1. 虚拟机**自动**为getUser方法加上了一个名为$completion的**Continuation**参数
2. 把源码中的分发器作为参数传给了BuildersKt.withContext方法
3. 虚拟机自动生成了Function2的对象，Function2中有一个label

所以关键要看BuildersKt.withContext里做了啥，withContext源码如下：

```kotlin
public suspend fun <T> withContext(
    context: CoroutineContext,
    block: suspend CoroutineScope.() -> T
): T {
    return suspendCoroutineUninterceptedOrReturn sc@ { uCont ->
        // compute new context
        val oldContext = uCont.context
        val newContext = oldContext + context
        // always check for cancellation of new context
        newContext.ensureActive()
        // FAST PATH #1 -- new context is the same as the old one
        if (newContext === oldContext) {
            val coroutine = ScopeCoroutine(newContext, uCont)
            return@sc coroutine.startUndispatchedOrReturn(coroutine, block)
        }
        // FAST PATH #2 -- the new dispatcher is the same as the old one (something else changed)
        // `equals` is used by design (see equals implementation is wrapper context like ExecutorCoroutineDispatcher)
        if (newContext[ContinuationInterceptor] == oldContext[ContinuationInterceptor]) {
            val coroutine = UndispatchedCoroutine(newContext, uCont)
            // There are changes in the context, so this thread needs to be updated
            withCoroutineContext(newContext, null) {
                return@sc coroutine.startUndispatchedOrReturn(coroutine, block)
            }
        }
        // SLOW PATH -- use new dispatcher
        // 在我们的例子中都会调用到这里                                            
        val coroutine = DispatchedCoroutine(newContext, uCont)
        // 会调用Function2中的create方法，然后用拦截器包一层，最后调用resumeWith进行分发                                              
        block.startCoroutineCancellable(coroutine, coroutine)
        // DispatchedCoroutine在resumeWith调用最后会调uCont.intercepted().resumeCancellableWith(recoverResult(state, uCont))恢复上一层的协程                                      
        coroutine.getResult()
    }
}
```

block.startCoroutineCancellable(coroutine, coroutine)和上书[Kotlin协程的使用以及launch源码解读](/post/2022/04/coroutine-launch.html)中是一样的

### 参考文章

[Kotlin协程实现原理:挂起与恢复](https://www.rousetime.com/2020/11/23/Kotlin%E5%8D%8F%E7%A8%8B%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86-%E6%8C%82%E8%B5%B7%E4%B8%8E%E6%81%A2%E5%A4%8D/)
