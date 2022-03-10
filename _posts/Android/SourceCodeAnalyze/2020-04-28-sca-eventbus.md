---
layout: post
title: "EventBus的使用与源码解析"
tagline: ""
description: ""
category: 源码解析
tags: [源码,发布/订阅模式,观察者模式]
last_updated: 2019-11-22 10:13
---

本文主要介绍[EventBus](https://github.com/greenrobot/EventBus)在android下的使用和对关键源码的解析。

### 介绍以及用法

根据官网的描述我们可以知道EventBus是一个实现了**发布/订阅**[^1]模式的库，并且这个库是在Android和Java中使用的，整个流程如下：

![EventBus流程](/images/blog/third/third_eventbus_flow.png)

使用EventBus的好处有主要有以下几点：

1. 简化了组件的通信
2. 简化代码
3. 快速
4. jar包小
5. ......

下面先来看看EventBus的使用方法：

步骤一：定义一个Event类（直接用包装类也行，但一般会定义一个Event类，**直接用基本类型是不行的**[^2]）

```java
public class Event { 
}
```

步骤二：在订阅者类中使用`@Subscribe`注解观察Event的方法，在合适的地方注册订阅者并且在合适的地方取消注册，以Android中的Activity为例（随便一个类都行）：

```java
public class Activity extends AppCompatActivity{
  
  @Override
  public void onCreate(Bundle savedInstanceState){
    super.onCreate(savedInstanceState);
    EventBus.getDefault().register(this);//注册订阅者
  }
  
  /*
  * 必须只有一个参数，并且方法访问权限必须是public的，返回值必须是void
  */
  @Subscribe
  public void onEvent(Event event){
    //后续逻辑
  }
  
  @Override
  public void onDestroy(){
    super.onDestroy();
    EventBus.getDefault().unregister(this);//取消当前Activity的订阅，不取消会内存泄漏
  }
  
}
```

步骤三：在合适的地方发送Event

```java
EventBus.getDefault().post(new Event());//步骤二中的onEvent方法将会被调用
```

我在看完源码后对EventBus的总体理解是：**EventBus就是一辆车，车上的司机会发送一些通知，当你没上车时，你是收不到这些通知的，当你上车了之后（register后），你就可以收到想要的（@Subscribe注解过的）通知，当你下车了之后（unregister后）你就再也收不到车上发的通知了**。

### 源码解析

从上面的用法以及介绍可以知道EventBus有三个重要的方法register、post、unregister，我们先从几个重要的概念和构造函数开始，然后一一讲解一下这三个方法的实现原理，首先先看看`ThreadMode`和`@Subscribe`注解。

#### ThreadMode

ThreadMode用在@Subscribe中，代表**订阅者收到注册的事件后的onEvent方法将运行在哪个线程上**，默认的情况是事件在哪个线程发送就在哪个线程运行

```java
public enum ThreadMode{
  //在哪个线程post的的就在哪个线程运行
  POSTING,
  //如果当前运行环境是Android，则运行在主线程，并且onEvent方法运行时会阻塞主线程；如果运行环境是Java则和POSTING一样
  MAIN,
  //运行在主线程，并且按顺序运行
  MAIN_ORDERED,
  //如果当前post时是主线程则运行在后台线程，否则的话运行在当前线程上
  BACKGROUND,
  //总是运行在异步线程
  ASYNC
}
```

#### @Subscribe注解

@Subscribe注解用在订阅者类中需要收到Event的方法上，有了@Subscribe注解的方法代表这个方法可以收到EventBus发过来的事件，@Subscribe源码如下：

```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD})//只用于方法上
public @interface Subscribe{
  
  //代表注解的方法运行在哪个线程，默认是那个线程发送的事件那么就在哪个线程运行
  ThreadMode threadMode() default ThreadMode.POSTING;
  
  //是否是粘滞事件，默认不是
  boolean sticky() default false;
  
  //事件优先级
  int priority() default 0;
  
}
```

#### SubscriberMethod

SubscriberMethod用于封装@Subscribe的方法，当使用register方法时会把订阅者类中所有@Subscribe注解的方法都封装成SubscriberMethod对象，并且把SubscriberMethod对象和订阅者对象一起存入Subscription中：

```java
public class SubscriberMethod{
  final Method method;//通过反射获取的方法
  final Class<?> eventType;//事件类型
  final ThreadMode threadMode;
  final boolean sticky;
  final int priority;
}
```

#### Subscription

Subscription用于封装订阅信息，内部持有订阅者对象和订阅方法对象的实例，方便post后通过反射调用方法

```java
public class Subscription{
  final Object subscriber;//订阅者对象
  final SubscriberMethod subscriberMethod;//订阅方法对象
}
```

#### 构造函数

```java
public class EventBus{
  
  //单例对象
  static volatile EventBus defaultInstance;
  //默认建造者
  private static final EventBusBuilder DEFAULT_BUILDER = new EventBusBuilder();
  //存储Event的类和注册此类型的订阅信息列表的map对象
  private final Map<Class<?>,CopyOnWriteArrayList<Subscription>> subscriptionsByEventType;
  //存储订阅者和订阅者注册的所有event的class的map对象，用于取消订阅
  private final Map<Object,List<Class<?>>> typesBySubscriber;
  //粘滞事件（一注册就会收到的那种）
  private final Map<Class<?>,Object> stickyEvents;
  
  public static EventBus getDefault(){
    if(defaultInstance == null){
      synchronized(EventBus.class){
        if(defaultInstance == null){
          defaultInstance = new EventBus();
        }
      }
    }
    return defaultInstance;
  }
  
  public EventBus(){
    this(DEFAULT_BUILDER);
  }
  
}
```

从构造函数可以看出EventBus使用了建造者模式和**伪单例模式**（构造函数是public的）进行初始化，这里可以把EventBus看作一辆车，如果你想上默认的车就必须使用getDefault方法提供的EventBus实例，如果不想的话就可以使用EventBusBuilder自己构造一个EventBus然后上车。

#### register方法

#### post方法

#### unregister方法

[^1]: [观察者模式 vs 发布/订阅模式](https://juejin.im/post/5a14e9edf265da4312808d86)
[^2]: 反射不支持自动装箱机制（自动装箱是在编译期间的，而反射在运行期间）