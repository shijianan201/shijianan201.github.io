---
layout: post
title: "Kotlin协程的使用以及launch源码解读"
tagline: ""
description: ""
category: Kotlin
tags: [协程]
last_updated: 2022-04-03 17:00
---

本文主要记录Kotlin中协程的使用以及launch方法的源码解读。

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

1. Main end为什么会最先打印？
2. 为什么协程能实现asyncJob中的异步调用一定在job中的异步调用执行完毕后再开始执行呢？
3. 为什么协程最后的scope end打印一定会在asyncJob调用await完毕后再执行？

为了搞懂这几个问题我们先看下launch源码里是怎么实现的

### launch函数

```kotlin
public fun CoroutineScope.launch(
    context: CoroutineContext = EmptyCoroutineContext,
    start: CoroutineStart = CoroutineStart.DEFAULT,
    block: suspend CoroutineScope.() -> Unit
): Job {
    val newContext = newCoroutineContext(context)//协程上下文，注意这里默认会使用Dispatchs.default作为分发器
    val coroutine = if (start.isLazy)
        LazyStandaloneCoroutine(newContext, block) else
        StandaloneCoroutine(newContext, active = true)
    coroutine.start(start, coroutine, block)
    return coroutine
}
```

从源码可知以下几点：

1. launch是**CoroutineScope**的扩展函数，在参数里可以设置协程运行时的上下文、协程启动类型以及协程体（就是我们写的那段代码）
2. 我们写的代码块默认封装在CoroutineScope扩展的一个suspend函数内
3. launch时会调用```start```函数启动协程

按默认情况走的话launch函数使用```CoroutineStart.DEFAULT```，下面看看start函数里做了啥

```kotlin
public abstract class AbstractCoroutine<in T>(
    parentContext: CoroutineContext,
    initParentJob: Boolean,
    active: Boolean
) : JobSupport(active), Job, Continuation<T>, CoroutineScope {

    /**
     * Completes execution of this with coroutine with the specified result.
     */
    public final override fun resumeWith(result: Result<T>) {
        val state = makeCompletingOnce(result.toState())
        if (state === COMPLETING_WAITING_CHILDREN) return
        afterResume(state)
    }
   
    /**
     * Starts this coroutine with the given code [block] and [start] strategy.
     * This function shall be invoked at most once on this coroutine.
     * 
     * * [DEFAULT] uses [startCoroutineCancellable].
     * * [ATOMIC] uses [startCoroutine].
     * * [UNDISPATCHED] uses [startCoroutineUndispatched].
     * * [LAZY] does nothing.
     */
    public fun <R> start(start: CoroutineStart, receiver: R, block: suspend R.() -> T) {
        start(block, receiver, this)
    }
}
```

start方法调用了CoroutineStart里的方法

```kotlin
public operator fun <R, T> invoke(block: suspend R.() -> T, receiver: R, completion: Continuation<T>): Unit =
        when (this) {
            DEFAULT -> block.startCoroutineCancellable(receiver, completion)
            ATOMIC -> block.startCoroutine(receiver, completion)
            UNDISPATCHED -> block.startCoroutineUndispatched(receiver, completion)
            LAZY -> Unit // will start lazily
        }
```

之后调用block的扩展函数```startCoroutineCancellable```

```kotlin
/**
 * Use this function to start coroutine in a cancellable way, so that it can be cancelled
 * while waiting to be dispatched.
 */
internal fun <R, T> (suspend (R) -> T).startCoroutineCancellable(
    receiver: R, completion: Continuation<T>,
    onCancellation: ((cause: Throwable) -> Unit)? = null
) =
    runSafely(completion) {
        createCoroutineUnintercepted(receiver, completion).intercepted().resumeCancellableWith(Result.success(Unit), onCancellation)
    }
```

在startCoroutineCancellable里会调用createCoroutineUnintercepted和intercepted方法

```kotlin
public actual fun <R, T> (suspend R.() -> T).createCoroutineUnintercepted(
    receiver: R,
    completion: Continuation<T>
): Continuation<Unit> {
  	//probeCoroutineCreated直接返回completion
    val probeCompletion = probeCoroutineCreated(completion)
    return if (this is BaseContinuationImpl)
  			//launch函数的代码体默认会生成SuspendLambda对象，SuspendLambda继承自BaseContinuationImpl，所以会调用到这里
        create(receiver, probeCompletion)
    else {
        createCoroutineFromSuspendFunction(probeCompletion) {
            (this as Function2<R, Continuation<T>, Any?>).invoke(receiver, it)
        }
    }
}
```

SuspendLambda类如下

```kotlin
//注意这里实现了ContinuationImpl和FunctionBase接口
internal abstract class SuspendLambda(
    public override val arity: Int,
    completion: Continuation<Any?>?
) : ContinuationImpl(completion), FunctionBase<Any?>, SuspendFunction {
    constructor(arity: Int) : this(arity, null)
}
```

这里可以看到SuspendLambda里是没有create方法的，往上找到**BaseContinuationImpl**类里有create方法

```kotlin
internal abstract class BaseContinuationImpl(
    public open fun create(completion: Continuation<*>): Continuation<Unit> {
        throw UnsupportedOperationException("create(Continuation) has not been overridden")
    }

    public open fun create(value: Any?, completion: Continuation<*>): Continuation<Unit> {
        throw UnsupportedOperationException("create(Any?;Continuation) has not been overridden")
    }
}
```

这里create方法直接抛出异常，其实这里create方法用的是字节码里的create方法，再看看字节码里launch是咋样的

```kotlin
BuildersKt.launch$default((CoroutineScope)GlobalScope.INSTANCE, (CoroutineContext)null, (CoroutineStart)null, (Function2)(new Function2((Continuation)null) {
         // $FF: synthetic field
         private Object L$0;
         int label;

         @Nullable
         public final Object invokeSuspend(@NotNull Object $result) {
            //省略其他代码
         }

         @NotNull
         public final Continuation create(@Nullable Object value, @NotNull Continuation completion) {
            Intrinsics.checkNotNullParameter(completion, "completion");
            Function2 var3 = new <anonymous constructor>(completion);//这里生成的是SuspendLambda对象
            var3.L$0 = value;
            return var3;
         }

         public final Object invoke(Object var1, Object var2) {
            return ((<undefinedtype>)this.create(var1, (Continuation)var2)).invokeSuspend(Unit.INSTANCE);
         }
      }), 3, (Object)null);
```

这里会生成一个新的Function2函数（前面说过SuspendLambda继承自FunctionBase）并传入Continuation对象，在launch中这个completion对象就是一开始调用协程时生成的StandaloneCoroutine对象，到这里createCoroutineUnintercepted方法就算完事了，接下来看看intercepted方法是咋回事

```kotlin
//默认是ContinuationImpl，所以调用ContinuationImpl里的intercepted方法
public actual fun <T> Continuation<T>.intercepted(): Continuation<T> =
    (this as? ContinuationImpl)?.intercepted() ?: this
```

再看看intercepted方法

```kotlin
internal abstract class ContinuationImpl(
    completion: Continuation<Any?>?,
    private val _context: CoroutineContext?
) : BaseContinuationImpl(completion) {
    constructor(completion: Continuation<Any?>?) : this(completion, completion?.context)

    private var intercepted: Continuation<Any?>? = null

    public fun intercepted(): Continuation<Any?> =
        intercepted
            ?: (context[ContinuationInterceptor]?.interceptContinuation(this) ?: this)
                .also { intercepted = it }

}
```

interceptContinuation方法在**CoroutineDispatcher**类里，interceptContinuation最后会用DispatchedContinuation包装一下生成一个新的Continuation对象，到这里intercepted方法执行完毕

```kotlin
public final override fun <T> interceptContinuation(continuation: Continuation<T>): Continuation<T> =
        DispatchedContinuation(this, continuation)
```

intercepted调用完后接着会调用```Continuation的resumeCancellableWith```函数

```kotlin
public fun <T> Continuation<T>.resumeCancellableWith(
    result: Result<T>,
    onCancellation: ((cause: Throwable) -> Unit)? = null
): Unit = when (this) {
    is DispatchedContinuation -> resumeCancellableWith(result, onCancellation) //默认是走这里
    else -> resumeWith(result)
}
```

这里由于前面的层层包装最后调用的是```DispatchedContinuation```中的```resumeCancellableWith```方法

```kotlin
internal class DispatchedContinuation<in T>(
    @JvmField val dispatcher: CoroutineDispatcher,
    @JvmField val continuation: Continuation<T>
) : DispatchedTask<T>(MODE_UNINITIALIZED), CoroutineStackFrame, Continuation<T> by continuation {
  
  inline fun resumeCancellableWith(
        result: Result<T>,
        noinline onCancellation: ((cause: Throwable) -> Unit)?
    ) {
        val state = result.toState(onCancellation)
  			//launch方法默认的是Dispatchers.Default，这里isDispatchNeeded默认是true
        if (dispatcher.isDispatchNeeded(context)) {
          //需要切换线程
            _state = state
            resumeMode = MODE_CANCELLABLE
            dispatcher.dispatch(context, this)//这里可以看成是把block传入线程里去运行
        } else {
          //不需要切换线程
            executeUnconfined(state, MODE_CANCELLABLE) {
                if (!resumeCancelled(state)) {
                  //这里直接调用continuation.resumeWith(result)方法
                    resumeUndispatchedWith(result)
                }
            }
        }
    }
  
}
```

这里会判断当前的任务是否需要**切换线程再进行分发**，如果需要分发则进入线程池的分发流程（线程池具体实现可以看[Kotlin协程中的线程池](https://juejin.cn/post/6901194242635333645)这篇文章），否则直接调用resumeWith方法。在线程池里最后会调用DispatchedContinuation中的run方法，DispatchedContinuation本身没重写run方法，所以往上找到DispatchedTask类，DispatchedTask的run方法如下：

```kotlin
internal abstract class DispatchedTask<in T>(
    @JvmField public var resumeMode: Int
) : SchedulerTask() {
  
   public final override fun run() {
        assert { resumeMode != MODE_UNINITIALIZED } // should have been set before dispatching
        val taskContext = this.taskContext
        var fatalException: Throwable? = null
        try {
            val delegate = delegate as DispatchedContinuation<T>
            val continuation = delegate.continuation
            withContinuationContext(continuation, delegate.countOrElement) {
                val context = continuation.context
                val state = takeState() // NOTE: Must take state in any case, even if cancelled
                val exception = getExceptionalResult(state)
                /*
                 * Check whether continuation was originally resumed with an exception.
                 * If so, it dominates cancellation, otherwise the original exception
                 * will be silently lost.
                 */
                val job = if (exception == null && resumeMode.isCancellableMode) context[Job] else null
                if (job != null && !job.isActive) {
                    val cause = job.getCancellationException()
                    cancelCompletedResult(state, cause)
                    continuation.resumeWithStackTrace(cause)
                } else {
                    if (exception != null) {
                        continuation.resumeWithException(exception)
                    } else {
                        continuation.resume(getSuccessfulResult(state))
                    }
                }
            }
        } catch (e: Throwable) {
            // This instead of runCatching to have nicer stacktrace and debug experience
            fatalException = e
        } finally {
            val result = runCatching { taskContext.afterTask() }
            handleFatalException(fatalException, result.exceptionOrNull())
        }
    }

}
```

执行run方法时最后一定会调用resumeWith函数，所以不管是需要切换线程还是不需要切换线程最后走的都是resumeWith方法，下面看看resumeWith里是如何实现的

```kotlin
internal abstract class BaseContinuationImpl(
    // This is `public val` so that it is private on JVM and cannot be modified by untrusted code, yet
    // it has a public getter (since even untrusted code is allowed to inspect its call stack).
    public val completion: Continuation<Any?>?
) : Continuation<Any?>, CoroutineStackFrame, Serializable {
    // This implementation is final. This fact is used to unroll resumeWith recursion.
    public final override fun resumeWith(result: Result<Any?>) {
        // This loop unrolls recursion in current.resumeWith(param) to make saner and shorter stack traces on resume
        var current = this
        var param = result
        while (true) {
            // Invoke "resume" debug probe on every resumed continuation, so that a debugging library infrastructure
            // can precisely track what part of suspended callstack was already resumed
            probeCoroutineResumed(current)
            with(current) {
                val completion = completion!! // fail fast when trying to resume continuation without completion
                val outcome: Result<Any?> =
                    try {
                        val outcome = invokeSuspend(param)
                        if (outcome === COROUTINE_SUSPENDED) return
                        Result.success(outcome)
                    } catch (exception: Throwable) {
                        Result.failure(exception)
                    }
                releaseIntercepted() // this state machine instance is terminating
                if (completion is BaseContinuationImpl) {
                    // unrolling recursion via loop
                    current = completion
                    param = outcome
                } else {
                    // top-level completion reached -- invoke and return
                    completion.resumeWith(outcome)
                    return
                }
            }
        }
    }
}
```

这里会用一个循环去调用invokeSuspend函数，invokeSuspend函数是在字节码里重写了的，内部会有一个状态机，当碰到```COROUTINE_SUSPENDED```时invokeSuspend函数就会return，此时**整个launch函数不再运行，等同于被挂起了**，此时调用launch的线程就可以往下运行，这就是**非阻塞挂起**。这里也解释了开篇第一个问题，Main end第一个打印的原因是因为launch默认使用的Dispatchs.default去进行分发，此时我们写的block会分发到Dispatchs.default中的线程池里运行，所以理所应当Main end第一个打印。

剩余的两个问题由于篇幅原因放到下回[Kotlin中suspend和async源码解读](/post/2022/04/coroutine-suspend-async.html)中去解释

### 参考文章

[Kotlin协程实现原理:挂起与恢复](https://www.rousetime.com/2020/11/23/Kotlin%E5%8D%8F%E7%A8%8B%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86-%E6%8C%82%E8%B5%B7%E4%B8%8E%E6%81%A2%E5%A4%8D/)
