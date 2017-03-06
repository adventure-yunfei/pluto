<!--
author: yunfei
head:
date: 2017-03-06
title: Webpack 真正的持久缓存实现
tags: web, webpack
images:
category: log analysis
status: publish
summary:
-->

说现在 webpack 是目前最流行的前端依赖打包工具，应该没人会有异议吧？不过为了在这个开放的工具上达成自己的最优目的，还是要花不少心思的。这里来讲讲在 webpack 里怎么做到真正的持久缓存。

持久缓存，也就是说在相关代码内容没有变化的时候，尽可能的使浏览器利用缓存而不是发送静态资源请求。方法也很简单：

- 同样的文件内容对应同样的名字，同时设置最大缓存失效期。这样在需要同一份代码时，浏览器总是使用本地缓存（连304请求都不需要）
- 尽可能将很少变动的代码提取成单独的一份文件，使得这部分代码几乎总是被缓存，从而提高整体缓存利用率

webpack 文档里有一篇非常简单的关于如何做到[持久缓存（Long-term Caching）](https://webpack.github.io/docs/long-term-caching.html)，有多简单？它就只告诉了你一件事：记得在文件名里用 chunkhash。

对此，我无力吐槽。。。在实际的场景里，光用 chunkhash 基本上来说并没有什么卵用，因为还有一堆的情况会导致即使实际上相关代码没变， chunkhash 还是变了。

更新：最新的 [webpack 2 的相关文档](https://webpack.js.org/guides/caching/) 已经提及了大部分内容，不过还有一些细节没有说到，这篇文章还是有用的。

# webpack 里怎么提高缓存利用率？

通常来说，我们都会在 webpack 里面定义 common chunk 提取公共代码，使这部分代码可以在多个页面以及多次编译之间保持一致，得以缓存。但这部分公共代码，在一次编译里多个页面共享缓存是没什么问题的，多次编译之间还能利用缓存就没想的那么容易了，然而这在快速迭代上线的项目里，没有多次编译之间的一致缓存，几乎等于没有缓存。

# webpack 编译中会导致缓存失效的因素

在一个 webpack 编译出的分块 (chunk) 文件中，内容分为三部分：

- a. 项目源代码 (即模块的内容)
- b. webpack 生成的模块 id (module id)
- c. webpack 用于启动运行的 bootstrap runtime

这三部分任意一部分发生变化，生成的分块文件就不一样了，缓存当然也没用了。

具体的呢，有这么一些情况会导致缓存失效：

### a. 源代码变动

这是废话

### b. webpack 生成的模块 id 变动

webpack 默认使用数字类型的模块 id，比如下面这样的编译结果：

```javascript
(function (modules) { // webpackBootstrap
    // ...
})([
/* 0 */
/***/ function(module, exports, __webpack_require__) {
	__webpack_require__(1);
	var entry_1 = true;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {
	__webpack_require__(2);
	var test_1 = true;
/***/ },
/* 2 */
/***/ function(module, exports) {
	var test_2 = true;
/***/ }
/******/ ])
```

一看就知道，这样的模块 id 跟模块引入的顺序有关。假设新增/删除一个模块引用，或者依赖的顺序变一下，计算结果就可能变化，导致一些模块 id 发生变化，最终导致输出 chunk 变化，缓存失效。

### c. webpack bootstrap runtime 变动

上面的代码里 `/* 0 */ ... /* 1 */ ...` 对应的都是模块定义，要让程序运行起来还需要一小段启动代码，这个就是 webpack bootstrap runtime，它长这样：

```
(function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/build/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })(/* modules */)
```

其他的都是配置项，启动程序的代码在这一个函数的最后一行：`return __webpack_require__(0);`，立即执行 id 为0的模块。`id === 0` 在 webpack 中叫做入口模块 (entry module)，也就是程序执行的入口。

这么看好像每次编译的时候这个 runtime 不会有什么变化，然而实际项目中往往为了缓存利用率以及按需加载引入了多个分块 (chunk)，包括公共分块和按需加载的分块。

在存在这些分块时，webpack runtime 需要在执行程序时可以找到对应的分块代码，因而会引入分块的文件信息，在 runtime 中体现为多了两个函数：一个额外模块引入的函数，一个按需加载函数：

```javascript
/******/ 	// install a JSONP callback for chunk loading
/******/ 	var parentJsonpFunction = window["webpackJsonp"];
/******/ 	window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules) {
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, callbacks = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId])
/******/ 				callbacks.push.apply(callbacks, installedChunks[chunkId]);
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			modules[moduleId] = moreModules[moduleId];
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
/******/ 		while(callbacks.length)
/******/ 			callbacks.shift().call(null, __webpack_require__);
/******/ 		if(moreModules[0]) {
/******/ 			installedModules[0] = 0;
/******/ 			return __webpack_require__(0);
/******/ 		}
/******/ 	};

/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId, callback) {
/******/ 		// "0" is the signal for "already loaded"
/******/ 		if(installedChunks[chunkId] === 0)
/******/ 			return callback.call(null, __webpack_require__);

/******/ 		// an array means "currently loading".
/******/ 		if(installedChunks[chunkId] !== undefined) {
/******/ 			installedChunks[chunkId].push(callback);
/******/ 		} else {
/******/ 			// start chunk loading
/******/ 			installedChunks[chunkId] = [callback];
/******/ 			var head = document.getElementsByTagName('head')[0];
/******/ 			var script = document.createElement('script');
/******/ 			script.type = 'text/javascript';
/******/ 			script.charset = 'utf-8';
/******/ 			script.async = true;

/******/ 			script.src = __webpack_require__.p + "" + chunkId + "." + ({"0":"e_1","1":"e_2"}[chunkId]||chunkId) + "." + {"0":"d0c1831ff024c3aeb47a","1":"50dc9cf2b5e52bc9e61a"}[chunkId] + ".js";
/******/ 			head.appendChild(script);
/******/ 		}
/******/ 	};
```

这里最后一行 `{"0":"e_1","1":"e_2"}[chunkId]||chunkId) + "." + {"0":"d0c1831ff024c3aeb47a","1":"50dc9cf2b5e52bc9e61a"}` 就是分块文件名映射表。

新的启动代码就在上面这个新增的 `webpackJsonpCallback` 函数末尾：`if(moreModules[0]) {/*...*/ return __webpack_require__(0);}`，当 entry module 引入时，立即执行。

一个分块引入 webpack runtime 的问题，就是一旦其中任何其他的分块发生了改动，runtime 中的文件名映射就跟着改了，这个分块也就被修改了。也就是说，即便不分块对应的模块源文件发生了变化，它也会变。

这里对缓存的影响分两种情况：

##### 1. 引入的是公共分块 (common chunk)

webpack runtime 从入口分块 (entry chunk) 中移到公共分块，使用时先加载公共分块 (runtime 所在分块)，再加载入口分块 (这时仅包含模块定义)。

由于公共分块的模块是从多个入口分块中分离出来的，其中的文件名映射包含了所有这些入口分块。也就是说，几乎任何文件发生变化，公共分开也会跟着变化。也就是说，每一次上线公共代码的缓存都会失效。

##### 2. 引入的是按需加载分块

假设是通过类似 `require.ensure()` 引入的按需加载的分块，对应的分块文件映射只存在对应的入口分块 runtime 中，按需加载代码的修改会导致引入它的文件缓存失效。

### d. `extract-text-webpack-plugin` 带来的 js/css 改动互相影响

这算是这个插件额外附带的一个问题。

webpack 中只存在 js 模块，不存在 css 或其他模块依赖，所以实际上 css 被转换成了 js 模块引入到 webpack 中。这个插件只是最后人为的将 css 分离了出来。然而计算 chunkhash 的时候 webpack 可不管你有没有分离 css，它照样按照 js 和 css 合在一起的情况计算 chunkhash，所以 js 和 css 输出的文件用的是同一个 chunkhash。这就导致了一个结果：仅有 css 文件的修改，也会导致对应的 js 打包文件名修改，哪怕文件内容一模一样；反过来也是一样。

# 怎么改？

咱们来针对上面说的这些一条一条的解决。

### a. 源代码变动？

不改。没法改。改了就错了。

### b. webpack 生成的模块 id 变动？

弄个固定的 id 计算方式。一个模块文件有什么信息是固定的？—— 文件路径。

webpack 已经内置了这个把文件路径当做 id 的插件: `NamedModulesPlugin`，直接用就好了。

```javascript
// webpack.config.js
{
    plugins: [new webpack.NamedModulesPlugin()]
}
```

### c. webpack bootstrap runtime 变动？

变动的就是其中的文件名信息，这部分信息是运行时必须的，并且编译的时候它要变动也没办法的。

解决方式就是把这总是变动的部分单独拎出来，不要让它影响公共分块或者入口分块 —— 这两部分的文件体积通常都很大，必须保证缓存高利用率。

拎出来的就是一个映射表了，这部分体积很小，可以通过普通 js 请求引入，更好的选择是在编译时直接内联到 html 中。

这里有两种方法：

##### 1. 简便点的，直接再创建一个只有 webpack runtime 的空的公共分块

```
When CommonsChunkPlugin is used, the runtime code is moved to the last common entry.
```

在定义一个或多个公共分块时，runtime 放在最后一个公共分块里面，然后可以强制定义它不包含任何其他的模块代码：

```javascript
// webpack.config.js
{
    plugins: [
        new CommonsChunkPlugin({name: 'common'}),
        new CommonsChunkPlugin({name: 'webpack_runtime', minChunks: Infinity}) // Infinity 使其不包含任何模块
    ]
}
```
``` html
<!-- index.html -->
<!-- 先引入runtime代码，可通过其他方法直接内联 -->
<script src="<webpack_runtime.[hash].js>"></script>
<script src="<common.[hash].js>"></script>
<script src="<entry.[hash].js>"></script>
```

##### 2. 仅把映射表导出为一个 JSON 文件，然后再内联到 html

简单来说，就是保持 runtime 位置不变，提取其中文件名映射表。可以通过 `chunk-manifest-webpack-plugin` 完成。

```javascript
// webpack.config.js
var ChunkManifestPlugin = requir('chunk-manifest-webpack-plugin');
{
    plugins: [
        new ChunkManifestPlugin({filename: 'chunk-manifest.json', manifestVariable: 'webpackManifest'})
    ]
}
```
```html
<!-- index.html -->
<script>
window.webpackManifest = {...};// 内联 chunk-manifest.json
</script>
```

可以看下新的 runtime 代码，里面引用文件名映射的地方发生了修改：

```javascript
/******/ 	__webpack_require__.e = function requireEnsure(chunkId, callback) {
                    // ...
/******/ 			script.src = __webpack_require__.p + window["webpackManifest"][chunkId];
/******/ 			head.appendChild(script);
/******/ 		}
```

### d. `extract-text-webpack-plugin` 带来的 js/css 改动互相影响？

对于 css，`extract-text-webpack-plugin` 提供了 `contenthash` 的文件名选项，按输出的 css 内容独立计算 hash，这就没啥问题了。

换到 js 呢？也差不多，咱们可以通过 `webpack-md5-hash` 插件，替换默认的 hash 计算方式，改为按模块内容计算 hash。但实际上没这么容易，之前说过，不同于 css 输出，js 打包后一部分是模块源代码内容，一部分是模块 id，一部分是 webpack runtime。这个插件只能考虑到模块内容这一条，很容易出现错误，也就是打包内容不一致，但 hash 一致，所以**使用起来一定要慎重**，考虑周全：

- 模块 id 部分：咱们之前提到了 `NamedModulesPlugin` 可以固定 id，跟这个插件搭配简直完美。这一条解决
- webpack runtime 部分 (针对引入了文件名映射导致 runtime 会变动的情况)：这个没办法，对于会引入可变 runtime 的 chunk 绝不能依赖于这个插件生成的 hash。不过我们之前把 runtime 可变信息提出来内联到 html 了，所以这一条也不是问题。（**注：用了这个插件，待文件名信息的 runtime 必须内联**）

# 总结一下最后的 webpack 配置

这里对于 runtime 文件名信息部分直接使用 `CommonsChunkPlugin` 提取，不采用 `chunk-manifest-webpack-plugin`。

```javascript
// webpack.config.js
{
    plugins: [
        // 单独提取 webpack runtime
        new CommonsChunkPlugin({name: 'webpack_runtime', minChunks: Infinity}),

        // 用文件路径当 id，固定模块 id
        new NamedModulesPlugin(),

        // css 输出按实际内容计算 hash
        new ExtractTextWebpackPlugin({filename: '[name].[contenthash].css'}),

        // 按实际内容计算 hash
        new WebpackMD5Hash()
    ]
}
```

# 引用参考

- [`webpack`](https://github.com/webpack/webpack)
- [`extract-text-webpack-plugin`](https://github.com/webpack-contrib/extract-text-webpack-plugin)
- [`chunk-manifest-webpack-plugin`](https://github.com/soundcloud/chunk-manifest-webpack-plugin)
- [`webpack-md5-hash`](https://github.com/erm0l0v/webpack-md5-hash)
