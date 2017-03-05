<!--
author: yunfei
head:
date: 2016-09-19
title: Virtual DOM 介绍及简单实现
tags: web, virtual_dom
images:
category: web
status: publish
summary:
-->

# 什么是 Virtual DOM 虚拟节点树技术？

React风行一时，其核心技术 Virtual DOM 也引起关注。虽然 React（或是一些其他框架） 的 Virtual DOM 实现非常复杂，但实际上这项技术本身的原理很简单。这篇文章来做个非常粗略的介绍。

首先，Virtual DOM 是什么：

- Virtual DOM 是对应实际DOM树的映射（不限表达形式，但通常情况下是跟实际DOM树类似的树状结构表达形式）
- 任何更新操作在到达实际DOM前首先更新 Virtual DOM 树，然后通过对比更新前后两棵树的差别，仅将差异部分应用到实际DOM

然后，为什么要用 Virtual DOM：

- 在浏览器运行环境下，操作DOM是非常耗时的，相比之下纯粹的Javascript代码执行更加高效。因此，可以利用 Virtual DOM 技术消耗少部分JS执行时间（用于查找 Virtual DOM 的更新差异），来避免不必要且耗时的DOM操作。

# 如何实现 Virtual DOM？

对应上面对 Virtual DOM 的两点定义，实现包含两个部分：

- Virtual DOM 映射实际DOM的表达数据结构
- 将 Virtual DOM 渲染为实际DOM，以及差异查找和应用

### Virtual DOM 表示方式

类似实际DOM，可以用树状数据结构表示：

```javascript
{
    type: "<element type>"
    attributes: "<element attributes map>",
    children: "<element child nodes>"
}
```

比如：

```html
<div class="container">
    <span>text</span>
    another text
    <a src="some.src"/>
</div>
```

表示为：

```javascript
{
    type: "div",
    attributes: {class: "container"},
    children: [
        {
            type: "span",
            children: ["text"]
        },
        "another text",
        {
            type: "a",
            attributes: {src: "some.src"}
        }
    ]
}
```

这里包含了两种节点类型，一类用 `{type: ...}` 表示普通DOM节点，一类用字符串表示文字节点。

### Virtual DOM 转换为实际DOM

##### 首先，Virtual DOM 初次渲染为实际DOM

初次渲染不考虑差异，整棵树重新渲染，仅包含创建节点，递归调用，较为简单，示例代码如下：

```javascript
function createDOM(vdomNode) {
    if (typeof vdomNode === "string") {
        return document.createTextNode(vdomNode);
    } else {
        const {type, attributes, children} = vdomNode,
            dom = document.createElement(type);

        if (attributes) {
            forEach(attributes, (val, key) => {
                dom.setAttribute(key, val);
            });
        }

        if (children) {
            forEach(children, (childVDOMNode, idx) => {
                dom.appendChild(createDOM(childVDOMNode));
            });
        }

        return dom;
    }
}
```

### Virtual DOM 差异更新

当首次渲染之后，Virtual DOM 发生更新时，需要找出前后 Virtual DOM 相同位置的差异部分：

- 之前节点不存在，之后节点存在：调用 `appendChild(...)` 新增新节点

```javascript
if (oldVNode == null && newVNode != null) {
    dom.appendChild(createDOM(newVNode)); // dom 为上层实际DOM容器节点
}
```

- 之前节点存在，之前节点不存在：调用 `removeChild(...)` 移除旧节点

```javascript
if (oldVNode != null && newNode == null) {
    dom.removeChild(dom.childNodes[idx]); // idx 为节点在children中的索引
}
```

- 前后节点均存在，但节点类型不同：调用 `replaceChild(...)` 替换为新节点

```javascript
function getType(vdomNode) {
    return typeof vdomNode === 'string' ? ('_text_'+vdomNode) : vdomNode.type;
}
if (getType(oldVNode) !== getType(newVNode)) {
    dom.replaceChild(createDOM(newVNode), dom.childNodes[idx]);
}
```

- 前后节点均存在，但节点类型相同：更新节点属性，然后递归查找子树差异

```javascript
if (getType(oldVNode) === getType(newVNode)) {
    var targetDOM = dom.childNodes[idx];
    updateDOMAttribute(targetDOM, oldVNode.attributes, newVNode.attributes);
    updateDOMChildren(targetDOM, oldVNode.children, newVNode.children);
}
```

具体代码在 [个人 Virtual DOM 实现代码 (Github)](https://github.com/adventure-yunfei/virtual-dom)


好了，这就是 Virtual DOM 的非常简单的实现，原理很简单。React 实现更为复杂，但是基本逻辑是一样的（比如查找子节点差异时也是对比相同索引值的子节点，因而同样内容的子节点顺序发生改变是视为整个更新，只不过加入了可选的`key`作为辅助）。

当然还有更多的 Virtual DOM 实现细节并没有在这里提出来：

- 同级子节点差异比较时，依赖key提取出节点顺序移动的差异（而不只是傻傻的比较同索引的节点）
- 差异查找(findDiff)和差异应用(applyDiff)的分离（例子中两者是同时进行的）
- 事件绑定
- 自定义组件的节点类型（就像React的Component一样）
- ...

# Virtual DOM 真的有那么高效吗？

React 宣称自己使用了 Virtual DOM，所以渲染效率很快。实际上除非合理使用，否则渲染效率反而可能下降，因为 Virtual DOM 的差异对比在大型应用中是有消耗的。

举个例子，假如 Virtual DOM 中有1000个节点，而用户仅仅只是在输入框里敲了一行字，如果直接更新实际DOM，消耗非常少，然而有了 Virtual DOM 之后，需要先对比整棵1000个节点的树之后再去更新输入框，带来了额外的消耗。

所以React引入了 `shouldUpdateComponent`、`immutable.js`、Pure Render 等方法减少 Virtual DOM 差异对比的消耗。

个人的理解，Virtual DOM 的意义不在于仅仅为了提升渲染效率，而是在依然保留不慢的渲染效率的情况下提升工程代码质量，使得大型应用更容易维护。

有了 Virtual DOM 之后，在使用上变成了好像每次都整个界面重新渲染。这样的好处就是可以数据驱动界面更新，开发者仅仅需要更新数据源，然后数据源整个扔给渲染框架让它每次都根据数据源渲染出新的 Virtual DOM，然后差异更新应用到实际DOM上。仅关注数据源的更新而不再考虑界面的更新，逻辑更清晰，代码质量更容易得到保障。
