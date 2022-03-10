---
layout: post
title: "startActivity原理"
tagline: ""
description: ""
category: 源码解析
tags: [源码,Activity]
last_updated: 2020-11-20 14:08
---

本文主要从源码角度解析Android中调用startActivity方法启动新页面时的原理。

先贴下源码关键类路径：

```java
/core/java/android/app/ContextImpl.java
/core/java/android/app/Instrumentation.java
/core/java/android/app/ActivityThread.java
/core/java/android/app/ActivityTaskManager.java
/core/java/android/app/IActivityTaskManager.aidl
```

### 使用方法

在安卓中要启动一个新页面时一般采用下面的方法：

```java
context.startActivity(new Intent(context,XXXActivity.class));//XXXActivity是新页面的类名
```

这里的context一般是Activity也可以是Application或者其他的四大组件（BroadCastReceiver、Service、ContentProvider），但是如果在**targetSdkVersion大于或者等于9.0或者targetSdkVersion小于7.0**并且**context不是Activity**的话需要使用`Intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)`或者`Intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)`设置flag，不然系统会抛出一个运行时异常如下：

> Calling startActivity() from outside of an Activity  context requires the FLAG_ACTIVITY_NEW_TASK flag. Is this really what you want?

这个异常的意思是在非Activity类型的Context中调用startActivity方法必须设置`Intent.FLAG_ACTIVITY_NEW_TASK`flag，而Activity不用加这个flag的原因是因为Activity重写了startActivity方法，而其他的组件使用的都是ContextImpl里的startActivity方法（其他组件都间接或者直接继承了ContextImpl），下面先来看看ContextImpl中的startActivity方法的调用

### 源码分析

本章主要根据源码分析startActivity调用过程

#### ContextImpl启动Activity

源码如下：

```java
public void startActivity(Intent intent, Bundle options) {
        warnIfCallingFromSystemProcess();
        // Calling start activity from outside an activity without FLAG_ACTIVITY_NEW_TASK is
        // generally not allowed, except if the caller specifies the task id the activity should
        // be launched in. A bug was existed between N and O-MR1 which allowed this to work. We
        // maintain this for backwards compatibility.
        final int targetSdkVersion = getApplicationInfo().targetSdkVersion;

        if ((intent.getFlags() & Intent.FLAG_ACTIVITY_NEW_TASK) == 0
                && (targetSdkVersion < Build.VERSION_CODES.N
                        || targetSdkVersion >= Build.VERSION_CODES.P)
                && (options == null
                        || ActivityOptions.fromBundle(options).getLaunchTaskId() == -1)) {
            throw new AndroidRuntimeException(
                    "Calling startActivity() from outside of an Activity "
                            + " context requires the FLAG_ACTIVITY_NEW_TASK flag."
                            + " Is this really what you want?");
        }
  			//mMainThread是ActivityThread的实例，getInstrumentation得到的是Instrumentation的实例
        mMainThread.getInstrumentation().execStartActivity(
                getOuterContext(), mMainThread.getApplicationThread(), null,
                (Activity) null, intent, -1, options);
}
```

由源码可知**ContextImpl中的startActivity方法最后调用的是Instrumentation类的execStartActivity方法**，再继续看看Activity中的startActivity方法是怎么实现的。

#### Activity启动Activity

Activity中经过一系列调用后都会走到`startActivityForResult(@RequiresPermission Intent intent, int requestCode,@Nullable Bundle options)` 方法中，此方法的源码如下：

```java
public void startActivityForResult(@RequiresPermission Intent intent, int requestCode,
            @Nullable Bundle options) {
  			//mParent也是Activity的实例
        if (mParent == null) {
            //......省略无关代码
          	//调用的还是Instrumentation的execStartActivity方法
            Instrumentation.ActivityResult ar =
                mInstrumentation.execStartActivity(
                    this, mMainThread.getApplicationThread(), mToken, this,
                    intent, requestCode, options);
						//......省略无关代码
        } else {
          	//startActivityFromChild方法最后也会调用到当前方法中
            if (options != null) {
                mParent.startActivityFromChild(this, intent, requestCode, options);
            } else {
                // Note we want to go through this method for compatibility with
                // existing applications that may have overridden it.
                mParent.startActivityFromChild(this, intent, requestCode);
            }
        }
}
```

由源码得出Activity中也是调用的Instrumentation中的`execStartActivity`方法，所以所有的startActivity方法调用底层都是通过Instrumentation类中的execStartActivity实现的，下面再来看看execStartActivity方法

#### Instrumentation.execStartActivity方法解析

```java
public ActivityResult execStartActivity(
            Context who, IBinder contextThread, IBinder token, Activity target,
            Intent intent, int requestCode, Bundle options) {
        IApplicationThread whoThread = (IApplicationThread) contextThread;
       	//......省略
        try {
            intent.migrateExtraStreamToClipData();
            intent.prepareToLeaveProcess(who);
            int result = ActivityTaskManager.getService()
                .startActivity(whoThread, who.getBasePackageName(), intent,
                        intent.resolveTypeIfNeeded(who.getContentResolver()),
                        token, target != null ? target.mEmbeddedID : null,
                        requestCode, 0, null, options);
            checkStartActivityResult(result, intent);
        } catch (RemoteException e) {
            throw new RuntimeException("Failure from system", e);
        }
        return null;
}
```

execStartActivity最后调用的是`ActivityTaskManager.getService().startActivity`，继续查看

ActivityTaskManager中的实现。

#### ActivityTaskManager

```java
public class ActivityTaskManager{
  
  	......
  
		/*
		* 通过单例模式获取实例
		*/
    public static IActivityTaskManager getService() {
        return IActivityTaskManagerSingleton.get();
    }

    @UnsupportedAppUsage(trackingBug = 129726065)
    private static final Singleton<IActivityTaskManager> IActivityTaskManagerSingleton =
            new Singleton<IActivityTaskManager>() {
                @Override
                protected IActivityTaskManager create() {
                    final IBinder b = ServiceManager.getService(Context.ACTIVITY_TASK_SERVICE);
                    return IActivityTaskManager.Stub.asInterface(b);
                }
            };
  
  	.......
}
```

IActivityTaskManager是一个AIDL文件，这里通过IPC调用到了system_server进程中，system_server进程中的ActivityTaskManagerService类对startActivity请求做处理[^问题1]，下面来看看ActivityTaskManagerService是怎么处理的。

#### ActivityTaskManagerService



[^问题1]: 暂时还不清楚IActivityTaskManager和ActivityTaskManagerService是怎么关联的

