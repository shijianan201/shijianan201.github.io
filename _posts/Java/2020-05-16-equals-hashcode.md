---
layout: post
title: "Java中的equals、==和hashCode"
tagline: ""
description: ""
category: Java
tags: [源码]
last_updated: 2020-05-16 22:00
---

面试时总会被问到equals和==有什么区别，今天来总结下。

### 前言

首先先定义Person类，下面都会以Person类举例

```java
//未重写equals版本
public class Person{}

//重写equals版本
public class Person{
    
    private String name;
    
    public Person(String name){
        this.name = name;
    }
    
    public String getName(){
        return name;
    }
    
    public boolean equals(Object obj){
        if(this == obj){
            return true;
        }
        if(!(obj instanceof Person)){
            return false;
        }
        return Objects.equals(name,obj.getName());
    }
    
}
```

### ==相关

双等号在Java中用来判断两个数据是否相等或者两个对象是否是同一个对象。

#### 用法

比较基本类型

```java
int a = 1;
int b = 2;
int c = 1;
System.out.println(a == b);//输出false
System.out.println(a == c);//输出true
```

比较引用类型（譬如Person类）

```java
Person p1 = new Person();
Person p2 = new Person();
Person p3 = p1;
System.out.println(p1 == p2);//输出false
System.out.println(p1 == p3);//输出true
```

#### 总结

对于基本类型来说，==比较的是他们的值是否一样，而对于引用类型来说，==比较的是引用类型指向的对象是否是同一个对象。

### equals相关

首先看看Object类里的equals方法

```java
public class Object{
    
    ...
    
	public boolean equals(Object obj) {
        return (this == obj);
    }
}
```

所以**对于Object类来说，equals和==其实是没有区别的，判断的都是两个引用是否指向同一个对象，对于没有重写equals方法的类来说它两也是没有区别的**，但是对于重写了equals方法的类来说那就有区别了，equals方法此时走的是我们重写的逻辑，以上面重写了equals方法的Person类来举个例子：

```java
Person p1 = new Person("小强");
Person p2 = new Person("小强");
Person p3 = new Person("光头强");
System.out.println(p1 == p2);//输出false
System.out.println(p1.equals(p2));//输出true
System.out.println(p1 == p3);//输出false
System.out.println(p1.equals(p3));//输出false
```

从输出结果可以看出，对于不指向同一个对象的引用用==比较后肯定返回false，而用equals比较返回的值走的是equals方法里的逻辑。

#### equals的特性：

1. 对于不是null的两个对象A和B，如果A.equals(B)返回true那么B.equals(A)也必须返回true
2. 对于不是null的对象A，A.equals(A)必须返回true
3. 对于不是null的三个对象A、B和C，如果A.equals(B)返回true并且B.equals(C)返回true那么A.equals(C)也必须返回true
4. 对于没有修改过的不是null的两个对象A和B，A.equals(B)一定返回相同的结果
5. 对于不是null的对象A，A.equals(null)必须返回false

#### 基本类型的equals

对于基本类型的equals方法要找基本类型对应的包装类

Byte

```java
 public boolean equals(Object obj) {
        if (obj instanceof Byte) {
            return value == ((Byte)obj).byteValue();
        }
        return false;
 }
```

Integer

```java
 public boolean equals(Object obj) {
        if (obj instanceof Integer) {
            return value == ((Integer)obj).intValue();
        }
        return false;
 }
```

Float

```java
public boolean equals(Object obj) {
        return (obj instanceof Float)
               && (floatToIntBits(((Float)obj).value) == floatToIntBits(value));
}
```

Double

```java
public boolean equals(Object obj) {
        return (obj instanceof Double)
               && (doubleToLongBits(((Double)obj).value) ==
                      doubleToLongBits(value));
}
```

其他几个就不一一列举了，基本和Integer差不多，Float和Double的equals方法比较有意思，它是先把Float转化为32位的int类型再比较转化后int的值，Double则是转化为64位long类型再比较转化后long的值。

### hashCode

先来看看Object底层hashCode方法是怎么实现的

```java
public class Object{
    
    ...
    
    /**
     * Returns a hash code value for the object. This method is
     * supported for the benefit of hash tables such as those provided by
     * {@link java.util.HashMap}.
     * <p>
  	 */   
	public native int hashCode();
}
```

从英文注释可以看出hashCode方法会返回对象的hash值（默认返回的是对象在堆里的地址），并且hashCode方法是为了支持Java中的哈希表（例如HashMap）而设计的。

hashCode有以下几个特性

1. 同一个对象的hashCode在应用的生命周期的任何时候都一样
2. 如果两个对象equals那么hashCode也必须一样
3. hashCode一样的两个对象不一定equals

### 总结

1. 对于基本类型而言，==和equals方法可以看作是没有区别的，比较的都是基本类型的值
2. 对于引用类型而言，如果没有重写equals方法，==和equals是没有区别的，比较的是对象的地址，如果重写了equals方法那么走的就是equals方法的逻辑

