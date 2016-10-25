<!--
author: yunfei
head:
date: 2016-10-12
title: Angular 脏检查机制研究
tags: web, Angular
images:
category: log analysis
status: publish
summary: 前端发展到现在, 新的数据驱动框架层出不穷。虽然大体上都是数据更新自动映射为DOM更新, 不同框架的具体实现思想差别还是挺大的。这篇文章主要就是来学习研究一下 Angular 的脏检查具体是怎么做的。
-->

# 数据驱动的视图框架 —— Angular、React、Vue

前端发展到现在, 复杂度越来越大, 已经不再像以前用 jQuery 库就能很好的解决问题了 (不过得益于公司, 我其实也没写过太多的抛弃框架的原生JS应用)。

新的数据驱动框架, 虽然执行效率不一定有提升, 但是让开发者仅考虑数据层更新忽略视图更新, 代码维护性大大提高, 在现在变得越来越流行。

虽然大体上都是数据更新自动映射为DOM更新, 不同框架的具体实现思想差别还是挺大的。像 React, 并不引入任何数据观察机制, 而是利用虚拟节点树 (Virtual DOM), 做到每次都重绘整个界面 (同时保证最小的DOM差异更新); Vue 还没有仔细研究过, 大致是通过JS setter, 将某个数据的更新绑定到对应的DOM上 (于是区别于 Angular, Vue 并不会每次遍历所有的 watcher)。

而 Angular 的实现核心是一个听了无数遍的名称: **脏检查(Dirty Check)**。这篇文章主要就是来学习研究一下 Angular 的脏检查具体是怎么做的。


# Angular 脏检查(Dirty Check)更新机制

在 Angular 视图模板里, 读取数据有一个叫 `$scope` 的上下文, 可以就认为它是一个存储数据的JS对象, 里面放了各种视图模板需要访问的数据/函数。`$scope` 里面的值可以自由更改 (比如说在 Angular 的控制器(Controller)里面)。

比如说有这样一个非常简单的 Angular 应用 (模板中引用了 `$scope` 里的 `title` 数据, 同时绑定了 `onclick` 事件修改 `title` 数据):

```html
<script>
    var testApp = angular.module('testApp', []);
    testApp.controller('TestController', function ($scope) {
        $scope.title = 'test title';
        $scope.onDIVClick = function () {
            $scope.title = 'another title';
        };
    });
</script>
<div ng-app="testApp" ng-controller="TestController" ng-click="onDIVClick()">
    {{title}}  <!-- 显示为: test title -->
</div>
```

然后点击 div 触发事件, 就会调用 `$scope.onDIVClick`, 修改了 `title` 数据, 然后视图就更新了 (内容变为了 `another title`)。

这一步DOM更新是怎么做到的? 仅仅只是更新了一个JavaScript对象的属性值, 但ES5版本下的JavaScript中并没有监听对象属性变更的方法, 没办法通过事件触发更新; 修改的属性名是任意的, 更不可能提前设置对象的 `setter` 嵌入数据更新操作。

答案是, Angular 不监听数据更新, 数据发生任何改变时 Angular 都不理睬, 它只是找了一个恰当的时机, 遍历所有的DOM更新方法, 从被修改过任意次的 `$scope` 数据中尝试更新DO (这里这个"恰当的时机"就是click事件处理结束时)。

一步步来, 看看这里面每一项是怎么做的:

### Angular 脏检查实现

- 首先, `$watch`: Angular 在解析视图模板时, 会找出其中的数据绑定, 以及对应的更新DOM的方式, (比如说这里的 `{{title}}`, 解析出值表达式为 `$scope.title`, 更新DOM方式为添加表达式的结果到文字内容区), 然后通过 `$scope.$watch` 将这一绑定注册到当前`$scope`上下文的更新响应操作里
- 然后, `$apply`: 可能更新数据时(比如事件响应函数里), Angular 调用 `$scope.$apply(expression)` 处理操作函数, `$apply(...)` 会在处理完成后调用 `$scope.$digest()`
- `$digest`: 在这一函数里, Angular 正式执行数据到视图的查找以及更新操作:
    - `$digest` 每一个循环里会从根作用域(`$rootScope`)开始(以深度优先方式)遍历**所有的** `$scope` 注册的 `$watch` 响应操作。对每一个`$watch`响应, 取出数据绑定的值表达式, 求出值, 与上一次的求值作比较, **求值不一样** 则取出DOM更新函数, 更新视图
    - 上一步里, 循环开始时置 `dirty = false`。只要有任何一个`$watch`响应的值发生了更新, 则当前 `$digest` 循环置 `dirty = true`
    - 每次循环结束后, 只要 `dirty === true` 依然成立, 重新开始新的一轮 `$digest` 检查循环, 直到 `dirty === false` (这就是为什么这个实现机制叫做**脏检查(Dirty Check)**)

### 脏检查会执行几次?

从上面的 `$digest` 脏检查循环描述里就看得出, 脏检查循环有可能会执行不止一遍。`$watch`注册的响应被执行时有可能更新某个 `$scope` 中的值, 而这个值就可能导致某个 `$watch` 响应执行结果又发送了更新, 使得 `dirty` 值仍然为 `true`, 又进入下一次脏检查循环。

即便 `$watch` 响应里没有更新任何数据, 通常来说脏检查循环也会执行两次, 比如在这个例子里面就是的:

- 首先, 在执行 `$digest` 开始脏检查循环前, click事件触发调用的 `onDIVClick` 中已经更新了 `title` 数据
- 进入第一遍脏检查循环后, `{{title}}` 对应的`$watch`响应中, 值表达式之前的结果是 `'test title'`, 现在由于数据已经发生了改变, 新的结果变成了 `'another title'`, 第一遍循环, `dirty` 置为 `true`, 进入下一遍循环
- 进入第二便脏检查循环后, 值表达式两次结果均为 `'another title'`, 没有变化, `dirty` 为 `false`。结束脏检查

所以什么时候脏检查循环只会执行一遍呢? 就是 `$apply(...)` 处理的操作中没有数据更新操作 (这里描述并不准确, 实际上是否有数据更新跟脏循环执行次数不一定相关, 等会再说)。也就是说, 移除 `onDIVClick` 里的 `title` 赋值操作, 脏检查循环就只会执行一次。

那么, 什么时候脏检查会执行无数次呢? 很简单, 在`$watch`响应的值表达式中中每次都返回新的数据。

可以是每次都修改了数据:

```html
<script>
    var testApp = angular.module('testApp', []);
    testApp.controller('TestController', function ($scope) {
        $scope.title = 'test title';
        $scope.getName = function () {
            // 每次调用时都更改 "title" 属性值
            $scope.title = $scope.title + ' more... ';
            return 'name';
        };
    });
</script>
<div ng-app="testApp" ng-controller="TestController">
    {{getName()}}
    {{title}}
</div>
```

初始渲染时会有一次初始的`$apply`调用, 以及对应的`$digest`调用。每一次`$digest`脏检查循环中, `getName()` 表达式求值时都会更新`"title"`数据, 导致 `{{title}}` 求值时每次都会使得 `dirty = true`, 进入脏检查死循环。

除此之外, 也可以是函数形式的值表达式每次都直接返回了新的数据:

```html
<script>
    var testApp = angular.module('testApp', []);
    testApp.controller('TestController', function ($scope) {
        $scope.title = 'test title';
        $scope.getName = function () {
            // 每次调用时都随机返回结果
            return 'name' + Math.random();
        };
    });
</script>
<div ng-app="testApp" ng-controller="TestController" ng-click="onDIVClick()">
    {{getName()}}
</div>
```

这里我们并没有更新任何数据, 然而脏检查循环还是执行了无数遍。所以, 没有数据更新并不一定代表脏检查循环中止。(当然, 如果把函数返回值也当成数据的一部分那就另说了。。)

当然, 实际场景中要是脏检查执行了无数次, 页面就挂了。所以实际上 Angular 配了个 `TTL = 10`, 默认最多执行10次脏检查循环, 超过了还稳定不了就直接放弃了, 毕竟每一次循环都要遍历所有的`$watch`响应,代价不小。

### 脏检查只看结果, 不看原因和过程

上面说了, 没有数据更新不一定意味着脏检查循环中止, 可能值表达式的**结果**不一样而导致脏检查循环继续。

同样, 有数据更新也并不一定代表需要再一次脏循环, 前面在脏循环实现里面说道了, **值表达式求值不一样** 才会设置 `dirty = true`。很简单的说明, 在最开始的例子中, 假设click事件函数`onDIVClick`只是设置了一个完全不相关的数据, 比如说 `$scope.foo = "bar";'`, 当然不会导致多一次的脏循环, 也不会更新任何DOM。

这其实就已经说明了, Angular 的脏检查并不关心 `$scope` 是否发生变化, 或者发生了什么样的变化, 或者通过一次设置还是多次设置发生的变化, 它只关心在最终执行脏检查时, `$watch` 响应的结果是否发生了变化。Angular 的脏检查并不会监听 `$scope` 数据的任何变化。

### 脏检查何时开始?

既然 Angular 并不监听数据变化, 那它怎么知道该什么时候调用 `$digest` 检查更新呢?

Angular 假设只有在有用户操作或者触发事件的时候, 数据才会发生更新 (实际上也是的, 如果用户键盘鼠标什么都没动, 也没什么像http请求返回之类的事件, 谁去更新数据呢?)。所以 Angular 在DOM事件、xhr事件、timeout事件、浏览器地址变更等事件中做了处理, 自动调用`$rootScope.$digest`执行所有数据作用域的检查。

同样的, 开发者也可以手动调用 `$scope.$digest()` 执行执行数据作用域的检查。

# 脏检查有什么好处?

之前有许多框架是通过提供 `setter` 来响应数据更新。数据赋值时调用了预定的属性 `setter` 方法, 通知框架数据发生了更新。这样做有个问题, 就是得预先设置属性的`setter`, 也就是说预先知道哪些属性会被修改 (Vue就采用了这种方式, 当然它也提供其他方式处理非预定属性的赋值); 要么就得通过框架提供的`.set(...)`函数来统一更新数据。总之就是没那么方便了。

而脏检查不监听数据变化, 只是做最终变化之后的结果的检查, 这样既不局限于数据存储的格式, 也不限定你更新数据的方式, 脏检查之前做什么样处理都是可以的。

当然这一点其他的数据驱动框架大多也是一样的, 比如 React, 虽然为了性能考虑官方推荐使用 immutable.js 作为数据源, 但实际上也是可以用任意的数据格式, 以及任意的数据更新方式。

# 脏检查有哪些坑? 怎么避免踩坑?

现在来说 Angular 好像已经有点迟了。这两年黑的最惨的前端框架是什么? ———— Angular。脏检查的坑已经让 Angular 的爸爸都放弃它了, 转而开发新的 Angular 2.0 去了。

脏检查为什么坑? 每一次脏检查循环都要遍历所有注册的`$watch`响应, 代价高昂; 而假如其中有一次响应又不小心修改了数据引起的新一轮的脏检查循环, 又得费时费力重新遍历一遍。而这两个结合起来, 在应用越来越复杂的时候, 简直就是相互助力: 100个`$watch`响应中保证联动变化引起的脏检查循环在10次以内可能还没那么难, 10000个`$watch`里面呢? 并且这1/10000发生了变化, 却又要导致重新遍历10000遍??

所以你说为什么被黑? 效率太难保证啊!

那么怎么避免踩坑呢? 就像刚才说的那样反过来, 没事不要在数据绑定里面做任何数据更新操作, 这是为了减少脏检查循环的次数; 数据绑定取值要简单高效, 不要动不动就数组排个序什么的, 这是为了减少单次脏检查循环的执行时间。

但是, 可惜的是, 在这个神一般的脏检查机制里面, 你处于一个囚徒困境的难题里面。你也许可以严格约束自己, 多花点时间写点质量高的代码, 避免触发额外的脏检查, 可是在越来越复杂的应用里面, 你怎么保证别人也做到跟你一样的严格约束呢? 只要有一个人偷懒了, 新一轮的脏检查就来了, 你所做的严格自我约束有什么用呢?

