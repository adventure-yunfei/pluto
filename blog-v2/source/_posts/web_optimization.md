---
title: Web性能优化
date: 2016-02-18
categories:
- web
tags:
- web
- optimization
---

整理一下对浏览器性能优化影响比较大的几块知识。

<!-- more -->

# 网络请求优化

### 减少网络请求连接数

浏览器对并发网络请求数有限制（普遍在2～6个）。请求数过多时后续的请求必须等待前面的请求完成之后才能发起，使得资源加载时间延长。

减少网络请求的方法为尽可能合并文件：

- 合并js和css文件。
- 内联小尺寸图片
- 合并多个图片，制作sprite

### 尽可能使用缓存

- js和css模块化，按功能分块加载，尽可能重用公用模块缓存
- 设置http头字段(expire, max-age, ETag)，延长缓存有效期。同时通过更改文件资源名更新缓存：
    - query string 如 ?v=123, ?hash=4b99ce6e3f。优点是容易实现，缺点是线上动态替换不够好（同时更新了两个互相依赖的文件时，有先后更新的时间差），并且可能受到CDN缓存攻击（遍历?v=1.0.0, ?v=1.0.1, ...）
    - hash文件名 如 fileA_4b99ce6e3f.js。避免上面两个问题，但是实现麻烦些

### 减少网络请求内容大小

- 压缩js和css文件
- 压缩图片尺寸。（Google提出的webP图片格式也可以有效减少图片大小）
- 启用GZIP网络传输

# 页面渲染优化

### 页面渲染流程

```
    DOM Tree
             \
               --> Render Tree --> Paint
             /
Style Sheets
```

1. 浏览器解析html生成节点树 **DOM Tree**。每一个html节点和节点内文字段都对应DOM Tree上的一个节点。

2. 浏览器解析css生成样式表 **Style Sheets**。css样式按来源区分优先级：浏览器样式（browser defaults）、用户样式（user stylesheets）、作者样式（author stylesheets）、作者重要样式（auther important）、用户重要样式（user important）。

3. 根据Dom Tree和Style Sheets生成 **Render Tree**。Render Tree中的每个节点对应于一个矩形盒模型（css box），整体结构类似于DOM Tree，但并不是一一对应关系。有些DOM节点不在Render Tree中出现，Render Tree会过滤掉不可见的DOM，比如`<head>`或者通过css隐藏`display: none`（但不会过滤`visibility: none`的DOM，因为这样的节点不可见，但是占据空间）；有些DOM对应多个Render节点，比如一个文字节点，每一行都对应一个Render节点，比如select元素，按钮和下拉菜单有各自的Render节点；有些DOM对应在Render Tree中的位置发生了变化，如`position: absolute`或`float`等非正常文档流布局元素。

4. 根据Render Tree计算布局 － **Layout/Reflow**。Render Tree构建完成时，仅包括了需要渲染的节点和对应的css样式。这一步根据这些信息计算出每一个Render节点的大小和位置。HTML的流式布局结构可以保证大部分情况下计算仅需一次遍历，即按Render Tree的顺序从上到下，从左到右的顺序，之后的Render节点不会影响之前的节点的布局，所以仅需按此顺序一次遍历计算。少部分——如Table——需要多次计算。

5. 将布局过的Render Tree渲染到页面上 － **Paint**。

### 页面更新操作

 - **Restyle**。重新计算节点样式。在样式更新时触发。js中获取节点css样式时会同步触发此计算（如果有样式更新）。
 - **Reflow/Layout**。重新计算布局信息。在布局样式更新、节点增删移动、窗口大小变化等会影响节点大小的信息改变时触发。js中获取节点的位置／大小时会同步触发此计算（如果有更新）。
 - **Repaint**。重绘需要更新的部分页面，通常在Restyle和Reflow后执行，但也有可能不执行，比如对`display:none`的节点更新样式，则无需重绘。

### 浏览器的更新优化

改动发生时浏览器并不会立即触发Restyle或Reflow，而是将所有改动存在队列中，然后定时批量更新。但是如果在过程中访问相关属性，为了得到正确结果，浏览器将立即同步触发计算。因而代码上的性能优化就是为了避开这一点导致的多次计算的时间浪费。同时在Reflow/Repaint中，浏览器并不会每次对整个页面做计算，而是仅计算被影响的局部页面。

### 页面渲染优化：最小化Restyle和Reflow次数

- 读写属性时，先做所有的读取，再做所有的写入。

```javascript
// Bad! Two restyle & two reflow & one paint
el.style.top = (el.offsetTop + 100) + 'px';
el.style.left = (el.offsetLeft + 100) + 'px';

// Good. One restyle & one reflow & one paint
var top = el.offsetTop,
	left = el.offsetLeft;
el.style.top = (top + 100) + 'px';
el.style.left = (left + 100) + 'px';
```

- 添加多个新节点时，用`documentFragment`批量添加
- 滚动时，禁用复杂的hover效果。滚动中的hover效果会导致大量且无用的Restyle和Reflow计算

### 页面渲染优化：最小化Reflow和Repaint范围

一些特定的规则可以限制Reflow/Layout和Repaint范围：

- **Layout Boundary**。`position: absolute`、非`overflow:visible`、设置了固定大小的容器内，内部节点更新后Reflow/Layout范围仅限于该容器节点。

![](/images/web_optimization/layout_boundary.png)

### 页面渲染优化：没什么事不要碰DOM

众所周之，DOM操作的效率比你想象的要低。。。

### 其他页面优化

- 尽可能快的展示可用部分 - 视觉上的效率提升
    - style前置，js后置
    - 功能组件按需加载，初始不使用的东西就不要挤进去了
- 利用浏览器空闲时间提前加载内容。如 `<link rel="prefetch" href="/images/big.jpeg">` 提前加载图片，`<link rel="dns-prefetch" href="http://www.spreadfirefox.com/">` 提前解析DNS

# CSS优化

### CSS Selector 匹配查找规则

当匹配查找一条CSS选择器时，浏览器按从右到左的顺序查找。找到最右选择规则的节点后，在往上遍历父节点检查其他规则的匹配。

其次，浏览器为优化查找，以最右的选择规则为关键字建立缓存映射，包括id映射、class映射、标签映射和以上类型外的通用映射。比如选择器：

```css
div.has-error .container {
    ...
}
```

将以`container`为关键字加到class映射中，所有的`class="container"`的节点都会通过class映射找到这条规则，然后匹配选择器其他部分。这些缓存映射涵盖了绝大部分的选择器，能有效提升查找性能。

这两点都导致了最右的选择规则会影响最终的匹配效率。

优化方法为：

- css选择器最右的规则尽可能特殊（id > class > tag > *）。尽量使用id和class选择器，避免标签名选择器。

[不同css选择器的效率差异测试结果。](http://jsperf.com/css-selector2)

# JS优化

### JS 局部变量查找优化

JS中存在作用域，嵌套的作用域构成作用域链，内层作用域访问变量时遍历作用域链查找最近的声明变量。查找作用域链需要额外消耗时间，这些消耗在循环中因累积而变得显著，因而应当尽可能的使用局部变量。

作用域链查找性能测试代码：（将这些代码复制到js环境中执行就能看出明显的效率区别）

```javascript
// 效率低！变量'i'存于全局作用域，访问'i'需要往上查找作用域链
var i;
for (i = 0; i < 500000000; i++) {}

// 效率低！变量'i'存于上层作用域，访问'i'需要往上查找作用域链
(function () {
	var i;

	(function () {
		for (var i = 0; i < 500000000; i++) {}
	};)();
})();

// 效率高！变量'i'存于局部作用域，访问'i'不需要查找作用域链
(function () {
	var i;
	for (var i = 0; i < 500000000; i++) {}
})();
```

[测试结果。](http://jsperf.com/scope-variable-visiting/4)

# 引用参考

- [Layout Boundary](http://wilsonpage.co.uk/introducing-layout-boundaries/)
- [Rendering: repaint, reflow/layout, restyle](http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/)
- [How browsers work](http://taligarsiel.com/Projects/howbrowserswork1.htm#Dynamic_changes)
