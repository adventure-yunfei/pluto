<!--
author: yunfei
head:
date: 2017-04-25
title: CSS 方法论 —— 模块化、命名、重用性
tags: css
images:
category: web
status: publish
summary:
-->

前端的技术发展真是越来越快，JS 框架和概念层出不穷，模块化、组件化等等理念带来更好的复杂前端工程的可维护性。作为前端关键技术栈的一部分，CSS 的规范化也有了新的理念，这些理念有助于实现 CSS 的模块化，提高可重用性以及可维护性。

# CSS 方法论介绍

在这次要介绍的技术里，我不认为有任何其他方式比官方网站更能解释清楚：

- [BEM - CSS以及普适的组件化理念](https://en.bem.info/methodology/quick-start/)
- [CSS Modules - CSS的真正模块化](https://github.com/css-modules/css-modules)，（除此之外，也许[这一篇介绍](https://glenmaddern.com/articles/css-modules)能更让你明白 CSS Modules 的意义）
- [SUITCSS - 还是CSS组件化](https://github.com/suitcss/suit/blob/master/doc/README.md)，除了理念之外，它也内置了一些组件实现
- [SMACSS - CSS分类来提供可重用性](https://smacss.com/book/)
- [AMCSS - 用 attribute 而非 class 构建更易理解的组件化样式](https://amcss.github.io/)
- Inline Style。因React的流行而发展出来的新方式。其中一个代表：[Radium](https://github.com/FormidableLabs/radium)

推荐阅读 **BEM**, **CSS Modules** 以及 **Inline Style**。

- BEM 以一个简单的 Block, Element, Modifier 的基础概念，延伸到整个项目的组件化、重用性，算是 CSS 组件化里比较有代表性的理念
- CSS Modules 则是真正提出了一套 CSS 的模块化方案，好比于 JS 中的 AMD/CMD 模块化
- Inline Style 作为一个革新的理念，有它的不少优势——（比如样式模块化、无用样式清理、样式合并以提高效率等等），值得了解。但作为一个新的方式，还有不少缺陷（比如动画、hover等伪类状态）

# 各种方式的比较

**BEM** 提出的组件化更像是一种思考方式而非工具，如果只谈CSS，对于实际代码约束来说只有简单的 Block, Element, Modifier 的命名规范，对代码的侵入性约等于无，可以随时应用。（如果整个项目所有类型的代码（JS,HTML等）都使用BEM理念，那就基本是排斥性的框架了）

**SUITCSS** 和 BEM 的目的类似，只不过提出的规范更多一些，并且自带了一部分组件化工具，本质并无不同。相较而言，我更欣赏 BEM 的简单理念。

前两种都是利用 class 实现组件化，**AMCSS** 提供了一个新的思路 —— 利用 attribute ，可以更直观的实现组件化，比如 Button 组件，BEM 方式是: `<div class="button button_warn"><div>`，AMCSS 方式则是: `<div am-Button="warn"></div>`。看上去的确更直观了，不过与传统CSS方式不一致，推广也就没那么容易了。

**SMACSS** 的关键理念又有不同，着重于按样式的目的分类，比如将布局和主题颜色的样式分离，以此达成更好的样式重用和维护。这一理念同 BEM 一样更像是一种思考方式，也能够方便的随时应用到项目中。

**CSS Modules** 如之前所说，提出的是一套 CSS 的模块化方案，而模块化可以带来诸多好处。虽然还是用的是 CSS，它还是与以前的 CSS 使用方式有很大不同，最直接的一点，模块化之后，内部样式以及类名都不再对外暴露，当重用一个组件却想定制其中的某些样式时不再那么方便了（不过这种定制的确违反了模块化理念，因为它必然依赖于模块的内部实现，不值得推荐）。

**Inline Style** 则提出了与传统 CSS 完全不同的使用方式，侵入性更强。这是一个随着 React 的流行而发展起来的使用方式，也是一个广义的概念。在这个概念的基础上，可以实现比如 CSS 模块化、继承、重用等等有助于项目维护的特性。但是，它和传统 CSS 几乎没法配合使用，我的建议是，在现在尚不成熟的时候，不要轻易在团队内推这个技术。
