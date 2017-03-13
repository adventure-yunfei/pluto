<!--
author: yunfei
head:
date: 2017-02-27
title: HappyPack - Webpack 的加速器
tags: web,webpack
images:
category: web
status: publish
summary:
-->

# HappyPack - Webpack 的加速器

最近组内前端使用的 Webpack 工具引入了一个 HappyPack 的插件，编译效率有显著提升。为此特意查看了 Webpack 和 HappyPack 的源代码，弄清楚效率提升的具体细节。

现在前端行业里模块化已经相当普遍了，模块打包工具也变得必不可少。Webpack 虽然起初只是一个人开发出来的打包工具，但它的流程设计带来的强大的扩展性使其越来越流行，为之开发的三方插件几乎已经囊括了前端所需的一切资源类型。

在我看来，React 这类富应用框架的流行推动了 Webpack 的发展。然而当初第一个 React + Webpack 开发的项目才进行不到一半的时候，Webpack 就有了很明显的性能问题。React 整个框架代码量680+KB，加上业务代码，文件模块数量庞大，Webpack 根本吃不消，动则编译一分钟多，内存占用也大。好在想想办法也能改善一下效率，典型的比如移除不必要的大型库文件的编译。

而这时，有了 HappyPack，编译速度一下子提高了不少，而且可以支持大部分常用的 Loader，绝对可以说是 Webpack 的加速器 —— 虽然内存占用依然很高。来看看 HappyPack 是怎么做到的。

# HappyPack 加速第一招：多进程

Webpack 是个守旧的 js 工具，跟其他大部分 js 工具一样，是个单线程程序。js 执行效率本来就有一定的不足，又限定了单线程，速度自然快不到哪儿去。

然而 Webpack 这个工具强就强在流程设计的扩展性如此之强，可以人为的加上多进程处理。

### Webpack 多进程可行性的关键：Loader 的并发可行性

读了读源代码，Webpack 在编译文件部分的流程大致如下：

```doc
    a. 开始编译 (Compiler#run)
    ...
    b. 开始编译入口文件 (Compilation#addEntry)
        b.1 开始编译文件 (Compilation#buildModule => NormalModule#build)
        b.2 执行 Loader 得到文件结果 (NormalModule#runLoaders)
        b.3 根据结果解析依赖 (NormalModule#parser.parse)
        b.4 处理依赖文件列表 (Compilation#processModuleDependencies)
        b.5 开始编译每个依赖文件 (异步，从这里开始递归操作: 编译文件->解析依赖->编译依赖文件->解析深层依赖...)
    ...
```

这里的关键在于递归操作 `b.5 开始编译每个依赖文件` 这一步是异步设计，每个依赖文件的编译彼此之间互不影响。不过虽然是异步的，但还是跑在一个线程里。但是这样的设计却带来了多进程的可行性。

编译文件中主要的耗时操作在于 Loader 对源文件的转换操作，而 Loader 的可异步的设计使得转换操作的执行并不被限制在同一线程内。下面对 Loader 进行改造，使其支持多进程并发：

```doc
    ...
    b.2 执行 Loader 得到文件结果
        LoaderWrapper 作为新的 Loader 入口接收文件输入信息
        LoaderWrapper 创建一个子进程 (child_process#fork) (这一步可维护一个进程池)
        子进程中，通过调用原始 Loader，转换输入文件，然后把最终结果传递给父进程
        父进程将收到的结果作为 Loader 结果传递给 Webpack
    ...
```

HappyPack 的实现就是这个流程，代码参考 [HappyLoader#apply](https://github.com/amireh/happypack/blob/master/lib/HappyLoader.js), [HappyThread#open](https://github.com/amireh/happypack/blob/master/lib/HappyThread.js)。

作为介绍，这里做了个简单的[多进程并发实现的Demo](https://github.com/adventure-yunfei/webpack-multi-thread-loader-demo)。

### 并发实现后一定就能提升效率吗？

不一定。

不过这是个相当相当罕见的情况 —— 你绝对不会在正常的开发中遇到。

看了上面 Webpack 的编译流程，可以知道，并发的起点是 `b.5 开始编译每个依赖文件`，假设这一步有多个依赖文件，才有并发的可能；父文件和它的依赖文件之间不可以并发，因为只有编译完父文件之后，才能知道它的依赖文件列表。

那么，假设有一个项目代码，从入口文件开始，每一个文件只依赖了一个其他的模块，这样每次编译完一个文件，只能有一个依赖文件可以编译，于是只能编译完这个依赖文件，才能获取下一个依赖并编译。这一个过程里，文件编译只能一个一个顺序执行，没有并发可行性。

不过谁能开发出这样的项目？

正常情况下，一个文件引入多个依赖，多个依赖之间可以并发；同时每个依赖引入多个子依赖，这些依赖和子依赖之间，只要没有直接的依赖链，都可以并发。比如有如下文件：

```javascript
// a.js
require('./a-b.js');
require('./a-c.js');

// a-b.js
require('./a-b-d.js');
require('./a-b-e.js');

// a-c.js
require('./a-c-f.js');
require('./a-c-g.js');
```

- `a.js` 和任何其他文件都不可以并发，因为有依赖链，(`a.js`和`a-b.js`，或者`a.js`和`a-b-d.js`);
- `a-b.js` 和 `a-c-f.js` 可以并发

于是一分二，二分四，分出来的无数依赖之间大部分都是可以并发的，除了刚开始编译的几个偏入口的文件，基本都可以保持高并发，效率自然大大提升。

# HappyPack 加速第二招：缓存

HappyPack 实现了一个基本文件修改时间戳的缓存。在每次编译的同时会将每个源文件对应的编译结果缓存下来，同时记录下源文件的修改时间戳。下次编译时，先读取源文件的修改时间戳，跟之前的缓存信息做对比，时间戳没有变化，则直接读取缓存文件作为 Loader 结果返回。就是这么简单。

源代码在 [HappyPlugin#compileInBackground](https://github.com/amireh/happypack/blob/master/lib/HappyPlugin.js) 以及 [HappyFSCache#hasChanged](https://github.com/amireh/happypack/blob/master/lib/HappyFSCache.js) 里，逻辑简洁清楚，就不一一列出来了。


# 总结

逻辑上 HappyPack 相对清晰，容易理解，多进程支持和缓存实现看上去也很很容易实现，然而多进程支持这一块并不是看上去那么简单，主要是针对 [Webpack Loader API](https://webpack.js.org/api/loaders/) 的支持。

Loader 可能会通过这些 API 将一些信息通知给 Webpack 编译器，比如 `emitFile` 通知 Webpack 生成文件，`addDependency` 通知相关依赖。然而 HappyPack 中 Loader 实际执行在另一个子进程中，无法调用主进程中的 Webpack API，所以 HappyPack 需要在 Loader 子进程上下文中自己伪造 Loader API，然后通过进程间通信传递到主进程的 HappyLoader，进而通知主进程的 Webpack 编译器。（代码参考 [HappyFakeCompiler](https://github.com/amireh/happypack/blob/master/lib/HappyFakeCompiler.js), [HappyFakeLoaderContext](https://github.com/amireh/happypack/blob/master/lib/HappyFakeLoaderContext.js), 以及主进程中与其通信响应的 [HappyRPCHandler](https://github.com/amireh/happypack/blob/master/lib/HappyRPCHandler.js)）

这就是为什么 HappyPack 不能支持所有的 Loader，因为 HappyPack 只实现了[一部分 Loader API](https://github.com/amireh/happypack/wiki/Webpack-Loader-API-Support)，调用未实现的 API 的 Loader 不能被支持。

HappyPack 是一个非常好的插件，然而我更加钦佩 Webpack 的扩展性设计。虽然它自己的功能可能让人不满意，但是高扩展性可以让其他模块来填补不足，并且可以让使用者自由选择合适自己的模块。也许这会让刚入门的以及选择恐惧症患者感到很烦，但我更烦的就是那些大而全的框架。大而全的框架入门门槛是低，可是出门门槛高啊，一旦其设计有什么不合理的地方，你根本没办法替换成另一个方案，而一个项目在长期的开发之后，你基本上总会遇到一些不满意的地方，这时候你就只能忍着了；自由组合就好多了，虽然有可能一不小心选错了一个模块，至少到时候你还有机会仅仅只付出替换这一个模块的代价，来让项目可以继续往前走。

# 引用参考

- [Webpack 代码库](https://github.com/webpack/webpack/tree/master/lib)
- [HappyPack 代码库](https://github.com/amireh/happypack/tree/master/lib)
