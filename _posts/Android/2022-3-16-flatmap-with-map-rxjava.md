---
layout: post
title: "RxJava的原理以及flatMap和map的使用"
tagline: ""
description: ""
category: Android
tags: [RxJava]
last_updated: 2022-03-16 15:00
---

本文主要记录RxJava中flatMap和map操作符的使用以及RxJava切换线程的底层原理。

### flatMap和map操作符

map的使用方法

```kotlin
Flowable.just("a","ab")
            .map {
                it.length
            }
            .subscribe {

            }
```

map在这里的作用是把一个String类型的Flowable转化为Int类型的Flowable。

map源码

```kotlin
public final <@NonNull R> Flowable<R> map(@NonNull Function<? super T, ? extends R> mapper) {
        Objects.requireNonNull(mapper, "mapper is null");
        return RxJavaPlugins.onAssembly(new FlowableMap<>(this, mapper));
}
```

源码中可以看出map把```Flowable<T>```转化为```Flowable<R>```，这个R也可以是Flowable类型，**在map的方法体内我们必须直接返回R类型的对象**，而flatMap则不一样。

flatMap的使用方法

```kotlin
Flowable.just("a","b")
            .flatMap {
                Flowable.just(it.length)
            }
            .subscribe {
            }
```

flatMap在这里的作用也是把String类型的Flowable转化为Int类型的Flowable，但它与map又有些区别。

flatMap源码

```
public final <@NonNull R> Flowable<R> flatMap(@NonNull Function<? super T, @NonNull ? extends Publisher<? extends R>> mapper) {
        return flatMap(mapper, false, bufferSize(), bufferSize());
}
```

源码中可以看出flatMap把```Flowable<T>```转化为```Flowable<R>```，这个R也可以是Flowable类型，**在flatMap的方法体内我们必须直接返回一个Flowable<R>类型的对象**。

### RxJava原理以及其是如何切换线程的

RxJava切换线程主要依靠```subscribeOn(Scheduler)```和```observeOn(Scheduler)```两个操作符实现，举个例子：

```kotlin
Flowable.just("a","ab")
            .map {
              	// 运行在io线程
                it.length
            }
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe {
            	//运行在主线程
            }
```

通过查阅源码可知RxJava**在组装事件时是通过装饰者模式嵌套对象来组装的**，譬如上述例子中在```subscribe```函数调用前就组装了个：

```kotlin
FlowableObserveOn(FlowableSubscribeOn(FlowableMap(FlowableFromArray)))
```

类型的对象，其中FlowableObserveOn、FlowableSubscribeOn、FlowableMap、FlowableFromArray都是接口 ```Publisher```的实现类（**Flowable的子类**），Publisher的源码如下：

```kotlin
public interface Publisher<T> {
    public void subscribe(Subscriber<? super T> s);
}
```

Publisher就是被观察者（发布者），专门用来发布事件的。事件组装完毕后调用subscribe方法进行订阅，subscribe方法的源码在Flowable里，核心逻辑如下：

```kotlin
public final void subscribe(@NonNull FlowableSubscriber<? super T> subscriber) {
        try {
            Subscriber<? super T> flowableSubscriber = RxJavaPlugins.onSubscribe(this, subscriber);//这行是为了RxJava中一个hook方法，如果不调用RxJavaPlugins.setOnFlowableSubscribe方法默认返回subscriber自身
            subscribeActual(flowableSubscriber);//抽象方法，此时走到子类具体调用中
        } catch (NullPointerException e) { // NOPMD
            throw e;
        } catch (Throwable e) {
            throw npe;
        }
    }
```

以上面的例子为例，FlowableObserveOn中的subscribeActual如下所示：

```kotlin
public void subscribeActual(Subscriber<? super T> s) {
        Worker worker = scheduler.createWorker();//在observeOn中定义的工作线程，在这里是主线程

        if (s instanceof ConditionalSubscriber) {
            source.subscribe(new ObserveOnConditionalSubscriber<>(
                    (ConditionalSubscriber<? super T>) s, worker, delayError, prefetch));
        } else {
            //默认会走到这里，source是它的上游，在例子中是FlowableSubscribeOn
            source.subscribe(new ObserveOnSubscriber<>(s, worker, delayError, prefetch));
        }
    }
```

再来看看FlowableSubscribeOn中的subscribe方法（其实也是看subscribeActual方法）：

```kotlin
public void subscribeActual(final Subscriber<? super T> s) {
        Scheduler.Worker w = scheduler.createWorker();//subscribeOn定义的工作线程，这里指io线程
        final SubscribeOnSubscriber<T> sos = new SubscribeOnSubscriber<>(s, w, source, nonScheduledRequests);
        s.onSubscribe(sos);//直接执行ObserveOnSubscriber的onSubscribe方法

    		w.schedule(sos);//工作线程处理sos的内容，会调用SubscribeOnSubscriber中的run方法
    }
```



### 尾

1. RxJava在组装事件流时使用的装饰者模式（俗称套娃）
2. 在进行订阅和发布事件时则是用的观察者模式
3. observeOn处理下游事件的线程，每用一次会切一次，subscribeOn处理上游事件的线程，只有第一个会生效