---
title: Javascript 类系统
date: 2016-01-28
categories:
- javascript
tags:
- javascript
- class
---

# Javascript Class Investigation

### 已有的JS模拟类系统


##### - Dojo.js

实现:

 - 利用 [C3 MRO algorithm](http://www.python.org/download/releases/2.3/mro/) 序列化多继承
 - 定义类时，拷贝父类的 prototype 原型来生成新类的原型链（但是会尽可能重用）
 - 为查找 super 调用，定义类时，在成员函数上标记其在类中的属性名
 - 运行中需要调用 super 函数时，根据当前调用函数所标记的属性名，在类的原型链中查找上一个被覆盖的函数

优势:

- 多继承
- 类创建时耗时少

劣势:

- 多继承使用频繁时，类原型链需不断拷贝生成，并且为了查找super函数，原型链无法合并，导致占用更多空间
- 依赖成员函数属性标记，函数无法在多个类中重用

##### - Prototype.js

实现:

 - 使用原生prototype的单继承
 - 根据成员函数首参数 `$super` 关键字判断是否有 super 调用，如果有，则包装函数以首参数传入被覆盖的 super 函数

优势:

 - 类创建时耗时少
 - super调用耗时少（无需查找步骤）

劣势:

 - 依赖于函数参数名 `$super` 关键字，js文件压缩后无效，无法用于production生产模式

##### - ExtJS

实现:

 - 基于原生prototype的单继承 + mixin混入模式
 - super调用实现与Dojo一致，创建类时标记成员函数名，调用时根据函数名在原型链中查找

优势:

 - super实现同Dojo，因而类创建和super调用查找均耗时少

劣势:

 - 同Dojo，原型链占用更多空间，函数无法在多个类中重用

###### - [John Resig's Simple Javascript Inheritance](http://ejohn.org/blog/simple-javascript-inheritance/)

实现:

 - 基于原生prototype的单继承 + mixin混入模式
 - 创建类时，以正则表达式匹配查找函数内容中的 `_super` 关键字判断是否有 super 调用，如果有，则包装函数，使其在调用时修改实例属性 `_super` 指向被覆盖的函数，调用结束后恢复原始值。函数中通过 `this._super(...)` 调用 super 函数

优势:

 - 强大的动态性支持，例如mixin继承mixin，在已有实例上继续添加额外mixin功能等
 - super调用耗时少（无需查找步骤）

 劣势:

 - 确定super调用的正则表达式耗时多，因而类创建时间（页面加载时间）长

### 如何构建JS类系统

javascript原生支持的prototype原型链已支持属性继承，缺失的是函数的super调用。

解决super调用的方案分为两类:

- 在类创建时确定函数是否有super调用（Prototypes.js中的`$super`参数关键字，John Resig中的`_super`关键字），然后封装super函数，无需在调用super函数时查找。
- 在类创建时仅标记函数信息，在调用时根据标记查找super函数

这其中功能最强大的是 John Resig's Simple Javascript Inheritance，实例创建时及创建后依然可以动态的添加额外mixin，但效率最低。

前者消耗加载速度，提升运行时速度；后者消耗运行时速度（在链中查找super函数），提升加载速度。

前者super调用预先确定的方法有限，不能有效改进；后者标记法现有的问题是原型链过长，消耗内存，同时函数名标记具有排斥性，无法被多个类使用并标记，且动态性差，不能灵活使用。

因而改进的方向是采用标记法，避免加载时间过长，减小原型链的内存消耗，并解决函数标记的排斥性。

### [自定义JS类系统](https://github.com/adventure-yunfei/javascript-class)

实现:

- 基于原生prototype的单继承 + mixin混入模式
- 类创建时，仅在类继承链上创建对应的prototype原型链，mixin属性直接写入当前类的prototype上
- 类创建时，成员函数上直接标记被覆盖的函数，以类名为关键字，记录 类名-super函数 的映射
- 调用super函数时，根据类继承链信息查找当前函数对应的被覆盖的super函数
- 类名区分后能解决绝大部分的标记冲突，在其他特殊情况的标记冲突时，封装函数以避开冲突
- 在需要做如实例动态mixin，mixin相互继承之类的无类信息的覆盖时，同样采用封装函数的方法支持

优势: 融合已有类系统的效率和功能的优势

 - 类创建时耗时少
 - 原型链缩短，内存消耗少
 - super查找因查找链缩短，耗时略微减少
 - 动态性支持，例如mixin继承mixin，在已有实例上继续添加额外mixin功能等
