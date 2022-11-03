---
layout: post
title: "Retrofit的使用与源码解析"
tagline: ""
description: ""
category: 源码解析
tags: [源码,Retrofit]
last_updated: 2019-11-22 10:13
---

本文主要介绍Retrofit在android下的使用和对关键源码的解析。

### 使用方法

假设后端接口规定返回数据如下所示：

```json
{
	code: 200,
	msg: "",
	data: {} //data可以是任何数据，对象、数组、null都行
}
```

我们现在要通过userId查询用户信息，首先要定义模型User

```kotlin
data class BaseResponse<T>(val code: Int, val msg: String? = null, val data: T? = null)

data class User(val name: String, val age: Int)
```

然后要定义接口Service，假设我们现在有一个获取用户信息的接口，接口完整路径为```http://www.jianan.com/user```，那么在Retrofit中```http://www.jianan.com/```就是这个接口的baseUrl，```user```就是接口的路径。

定义UserService如下：

```kotlin
interface UserService {

    @GET("user")
    suspend fun getUserInfo(@Query("userId") userId:String): Response<BaseResponse<User>>

}
```

接下来创建Retrofit对象，调用Service中的方法开始请求

```kotlin
fun getUserInfo(){
        scope.launch {
            val retrofit = Retrofit.Builder()
                .baseUrl("http://www.jianan.com/")
                .addConverterFactory()
                .addCallAdapterFactory()
                .build()
            val resp = withContext(Dispatchers.IO){
                retrofit.create(UserService::class.java)
                    .getUserInfo("123")
            }
          //这里已经拿到了resp，可以进行ui刷新了
        }
    }
```

上面是一个最简单的请求过程，没对异常什么的进行处理，通过代码可以看出Retrofit第一步通过Builder模式创建了Retrofit的对象，**创建过程中哪些参数有什么意义呢？**接下来调用create方法创建了Service的对象，我们知道UserService是一个接口，并没有实现类，**Retrofit是如何创建Service的对象呢？**带着这两个问题探寻一番Retrofit的源码。

### Retrofit实例是如何创建的



### Retrofit是如何创建Service对象的

先来看看create方法源码

```kotlin
public <T> T create(final Class<T> service) {
    validateServiceInterface(service);
    return (T)
        Proxy.newProxyInstance(
            service.getClassLoader(),
            new Class<?>[] {service},
            new InvocationHandler() {
              private final Platform platform = Platform.get();
              private final Object[] emptyArgs = new Object[0];

              @Override
              public @Nullable Object invoke(Object proxy, Method method, @Nullable Object[] args)
                  throws Throwable {
                // If the method is a method from Object then defer to normal invocation.
                if (method.getDeclaringClass() == Object.class) {
                  return method.invoke(this, args);
                }
                args = args != null ? args : emptyArgs;
                return platform.isDefaultMethod(method)
                    ? platform.invokeDefaultMethod(method, service, proxy, args)
                    : loadServiceMethod(method).invoke(args);
              }
            });
  }
```

这里使用了Java中的[动态代理](/post/2022/04/proxy.html)模式创建了UserService的对象，在Android中默认会调用到**loadServiceMethod(method).invoke(args)**这行，接下来看下loadServiceMethod做了啥，

```kotlin
/*
* 从缓存中拿方法，拿不到就通过静态方法parseAnnotations进行解析
*/
ServiceMethod<?> loadServiceMethod(Method method) {
    ServiceMethod<?> result = serviceMethodCache.get(method);
    if (result != null) return result;

    synchronized (serviceMethodCache) {
      result = serviceMethodCache.get(method);
      if (result == null) {
        result = ServiceMethod.parseAnnotations(this, method);
        serviceMethodCache.put(method, result);
      }
    }
    return result;
  }
```

ServiceMethod是对我们Service接口里定义的方法（例子中是getUser方法）的一个封装，parseAnnotations方法如下：

```kotlin
static <T> ServiceMethod<T> parseAnnotations(Retrofit retrofit, Method method) {
    RequestFactory requestFactory = RequestFactory.parseAnnotations(retrofit, method);
		//获取请求方法的返回类型，包含内部泛型，例子里这里就是Response<BaseResponse<User>>
    Type returnType = method.getGenericReturnType();
    if (Utils.hasUnresolvableType(returnType)) {
      throw methodError(
          method,
          "Method return type must not include a type variable or wildcard: %s",
          returnType);
    }
    if (returnType == void.class) {
      throw methodError(method, "Service methods cannot return void.");
    }
		//如果返回值合法就转化为HttpServiceMethod对象
    return HttpServiceMethod.parseAnnotations(retrofit, method, requestFactory);
  }
```

RequestFactory用来对请求方法的参数、注解啥的进行一次封装，后续可以通过RequestFactory的实例拿到对应的数据，RequestFactory是HttpServiceMethod中的一个属性，接下来看看HttpServiceMethod是如何创建的？解答这个问题前要先理解一下kotlin中的```suspend```关键字的[原理](/post/2022/04/coroutine-suspend-async.html)。

```kotlin
static <ResponseT, ReturnT> HttpServiceMethod<ResponseT, ReturnT> parseAnnotations(
      Retrofit retrofit, Method method, RequestFactory requestFactory) {
    boolean isKotlinSuspendFunction = requestFactory.isKotlinSuspendFunction;//是否是kotlin suspend函数
    boolean continuationWantsResponse = false;
    boolean continuationBodyNullable = false;

    Annotation[] annotations = method.getAnnotations();//拿到方法的所有注解
    Type adapterType;
    if (isKotlinSuspendFunction) {
      //如果是suspend函数则需要特殊处理，因为suspend函数编译后会加上一个Continuaton参数，返回值会变为Any
      Type[] parameterTypes = method.getGenericParameterTypes();
      //在这个例子里responseType拿到的是Response<BaseResponse<User>>
      Type responseType =
          Utils.getParameterLowerBound(
              0, (ParameterizedType) parameterTypes[parameterTypes.length - 1]);
      if (getRawType(responseType) == Response.class && responseType instanceof ParameterizedType) {
        // Unwrap the actual body type from Response<T>.
        // 在这个例子里responseType拿到的是BaseResponse<User>
        responseType = Utils.getParameterUpperBound(0, (ParameterizedType) responseType);
        continuationWantsResponse = true;
      } else {
        // TODO figure out if type is nullable or not
        // Metadata metadata = method.getDeclaringClass().getAnnotation(Metadata.class)
        // Find the entry for method
        // Determine if return type is nullable or not
      }
			// 包装为Call<BaseResponse<User>>的形式，之所以这么包装是因为Retrofit定义Service方法时必须使用Call类型作为返回值，如果不包装的话就要自己定义CallAdapter
      adapterType = new Utils.ParameterizedTypeImpl(null, Call.class, responseType);
      annotations = SkipCallbackExecutorImpl.ensurePresent(annotations);
    } else {
      adapterType = method.getGenericReturnType();
    }
		// 从一开始创建Retrofit时注册的CallAdapter中取一个来处理这个请求
    CallAdapter<ResponseT, ReturnT> callAdapter =
        createCallAdapter(retrofit, method, adapterType, annotations);
    Type responseType = callAdapter.responseType();
    if (responseType == okhttp3.Response.class) {
      throw methodError(
          method,
          "'"
              + getRawType(responseType).getName()
              + "' is not a valid response body type. Did you mean ResponseBody?");
    }
    if (responseType == Response.class) {
      throw methodError(method, "Response must include generic type (e.g., Response<String>)");
    }
    // TODO support Unit for Kotlin?
    if (requestFactory.httpMethod.equals("HEAD") && !Void.class.equals(responseType)) {
      throw methodError(method, "HEAD method must use Void as response type.");
    }

    Converter<ResponseBody, ResponseT> responseConverter =
        createResponseConverter(retrofit, method, responseType);

    okhttp3.Call.Factory callFactory = retrofit.callFactory;
    if (!isKotlinSuspendFunction) {
      return new CallAdapted<>(requestFactory, callFactory, responseConverter, callAdapter);
    } else if (continuationWantsResponse) {
      //noinspection unchecked Kotlin compiler guarantees ReturnT to be Object.
      return (HttpServiceMethod<ResponseT, ReturnT>)
          new SuspendForResponse<>(
              requestFactory,
              callFactory,
              responseConverter,
              (CallAdapter<ResponseT, Call<ResponseT>>) callAdapter);
    } else {
      //noinspection unchecked Kotlin compiler guarantees ReturnT to be Object.
      return (HttpServiceMethod<ResponseT, ReturnT>)
          new SuspendForBody<>(
              requestFactory,
              callFactory,
              responseConverter,
              (CallAdapter<ResponseT, Call<ResponseT>>) callAdapter,
              continuationBodyNullable);
    }
  }
```



