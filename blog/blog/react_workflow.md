<!--
author: yunfei
head:
date: 2017-03-05
title: React 代码流程梳理
tags: web, react
images:
category: web
status: publish
summary:  通过 React 源代码, 梳理一下 React 整个渲染流程, 咱们来了解一下实际的 Virtual DOM 实现, 同时也当个个人的 React 备忘录。
-->


之前介绍过 [Virtual DOM的原理](http://blog.yunfei.me/blog/virtual_dom.html), 里面将 Virtual DOM 实现流程分为了三步:

- Virtual DOM 的表示方式
- 两颗 VDOM Tree 的差异比较 (diff 阶段)
- 差异应用到实际 DOM 的更新 (patch 阶段)

这样的例子里, diff 操作和 patch 操作是两个阶段, 先 diff 再 patch, 对 Virtual DOM 的原理可以解释的更清楚, 但实际的实现中, 为了达到组件化和 Virtual DOM 的通用性, diff 阶段和 patch 阶段往往是融合在一起的. 这里通过源代码梳理一下 React 实现的流程, 了解实际的VDOM实现, 同时也当个备忘录.

# React 渲染代码流程

```
                                        开始渲染 (ReactDOM.render)
                                                |
                                                ↓
                                        当前渲染根组件和上次根组件类型/key是否相同? (首次渲染时, 上次节点为空) (shouldUpdateReactComponent.js)
                                                |
                                                ↓
                     --------------------------   --------------------------
                     |                                                      |
                     ↓                                                      ↓
                    不同?                                                  相同?
                     |                                                      |
                     ↓                                                      ↓
           移除上次根组件 (ReactMount.unmountComponentAtNode)            开始更新根组件 (ReactMount._updateRootComponent)
                     |                                                      |
                     ↓                                                      ↓
           渲染新的根组件 (ReactMount._renderNewRootComponent)           更新组件起点 (通用方法, ReactReconciler.receiveComponent)
                                                                            |
                                                                            ↓
                                                                        开始组件自身更新流程 (Component.receiveComponent -> Component.updateComponent)
                                                                            |
                                                                            ↓
                                                 --------------------------   --------------------------
                                                 |                                                      |
                                                 ↓                                                      ↓
                                自定义组件? (ReactCompositeComponent)                       浏览器 DOM 内置节点组件? (ReactDOMComponent)
                                         |                                                      |
                                         ↓                                                      ↓
                                调用更新前接收数据 hook: inst.willReceiveProps               更新 DOM 属性 (_updateDOMProperties)
                                         |                                                      |
                                         ↓                                                      ↓
                                调用更新检查hook: inst.shouldComponentUpdate                 开始更新子组件 (子组件可能为多个)
                                         |                                                  (_updateDOMChildren -> ReactMultiChild._updateChildren)
                                         ↓                                                      ↓
        ---------------------------------                                         按key匹配每一对新旧子组件 (key可指定, 默认由index计算)
        |                                |                                                      |
        ↓                                ↓                                                      ↓
    无需更新?                          需要更新?                                                   -------------------------------
        |                                |                                                      |                               |
        ↓                                ↓                                                      ↓                               ↓
设置新的props等数据, 结束         开始执行更新 (_performComponentUpdate)             不存在key配对或匹配的组件类型不同?       存在key配对且类型相同的新旧子组件?
                                         |                                                      |                               |
                                         ↓                                                      ↓                               ↓
                                调用即将更新前的 hook: inst.componentWillUpdate     删除旧组件/插入新组件         递归更新子组件 (ReactReconciler.receiveComponent)
                                         |                                                      |                               |
                                         ↓                                                      |                               ↓
                                开始执行组件更新 (_updateRenderedComponent)                       -------------------------------
                                         |                                                                                      |
                                         ↓                                                                                      ↓
                                展开组件的内容组件 (inst.render) (render仅返回单个组件)                      子组件自身更新完毕后, 处理子组件DOM节点的实际添加/移动/删除
                                         |                                                                       (DOM节点移动的位置也是通过key匹配简单得出的)
                                         ↓                                                                                      ↓
                                新旧内容组件类型/key是否相同 (shouldUpdateReactComponent.js)                                   结束更新
                                         |
                                         ↓
        ---------------------------------
        |                                |
        ↓                                ↓
      不同?                             相同?
        |                                |
        ↓                                ↓
替换旧组件为新组件                递归更新组件 (ReactReconciler.receiveComponent)
(ReactReconciler.unmountComponent)       |
(ReactReconciler.mountComponent)         ↓
(_replaceNodeWithMarkup)                ...


```

# React 部分函数/代码解释

##### `ReactReconciler.mountComponent`

注册添加一个新的组件, 并返回组件对应的DOM节点的html字符串.

注意, 这个操作只注册了组件 (组件-子组件树, 以及事件函数), **并没有实际添加DOM**.

##### `ReactReconciler.unmountComponent`

同上, 注销一个组件 (组件树, 对应的事件函数, 以及父组件对其的ref引用). 该操作**不会删除对应DOM**.

##### `ReactInjection`, `ReactDefaultInjection`

React 依赖注入, 用于提供特定的逻辑实现

##### `Transaction`

React 实现的一套函数调用流程, 简单来说, 通过 `Transaction.perform(method, ...args)`, 会先调用 `.initialize`, 然后调用指定的方法, 最后调用 `.close`. 前后调用的两个hook通过 `getTransactionWrappers` 提供

##### `ReactUpdates.batchedUpdates`

React 批量更新方法, 简单来说, 进入批量处理过程中后, 调用指定函数中造成的额外修改不触发实际更新, 结束之后统一触发实现更新. 实现方法是:

1. 初次进入 `batchedUpdates` 时, 置标记, 通过定义的 `Transaction` 调用指定函数
2. 执行指定函数过程中, 再次进入 `batchedUpdates` 时, 直接调用函数
3. `Transaction` 调用结束后, 执行 `.close` hook, 调用 `flushBatchedUpdates`, 触发更新开始操作
4. `flushBatchedUpdates` 会检查 dirtyComponents, 存在则更新; 该值由 `enqueueUpdate` 函数添加

**注意:** `batchedUpdates` 会在React绑定的浏览器事件触发时调用, 因而在浏览器事件响应函数中, 多次调用 `setState(...)` 仅触发一次合并的 `render`; 但是自定义回调 (比如 eventemitter) 中, 每次调用 `setState(...)`, 都会立即触发一次 `render`

# 结论

在 React 实现中:

- diff 操作严格来说只存在于内置DOM组件的更新上 (即 ReactDOMComponent). 对于自定义组件(ReactCompositeComponent), 只有单个内容组件(由 render 函数返回), 其中更深的复杂内容作为 props.children 传递给内容组件处理, 所以在自定义组件上更新操作实际委托给了内容组件, 并没有 diff 操作
- diff 和 patch 阶段没有严格区分, 两者互相融合 (在每个内置DOM组件(ReactDOMComponent)自身更新完毕后, 实际的DOM已经更新, 不会等到整个VDOM Tree对比完成)
- 同上, diff 和 patch 阶段不区分, 整体更新是个简单的递归逻辑, 每个组件依次更新自己的内容组件/子组件, 相对于 diff / patch 分离, 逻辑清晰易懂 (好比递归实现和非递归实现的对比)
- 在内置DOM组件中, 差异的比较是通过key实现的, key可以手动传, 默认与顺序相关, 同时仅对比了第一层子组件, 更深层次靠接下来的递归逻辑完成. 逻辑也很简单, 整个组件树的对比复杂度为 O(M+N) - M 为组件数, N 为DOM节点数 (通常来说就是DOM节点数的线性复杂度, 除非在奇葩代码里, 组件数远大于DOM节点数)
- React/ReactNative 跨平台可行性的具体实现点在于平台特定内置组件的定制. 在浏览器里, 组件分为了两类, 一类是自定义(通用)组件 ReactCompositeComponent, 一类就是浏览器平台特定的内置 DOM 组件 ReactDOMComponent (创建时类型为字符串的对应内置DOM组件). ReactCompositeComponent 不限定平台, 实现的是通用性的组件逻辑. 所以在另一个平台中, 只需定义平台特定的终端显示组件逻辑即可 (也就是重写一个类似的 ReactDOMComponent, 大概1000多行...)


# 相关引用

- [React源代码](https://github.com/facebook/react)
