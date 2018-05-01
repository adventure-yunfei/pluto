---
title: Web 安全
date: 2016-02-19
categories:
- web
tags:
- web
- security
---

# XSS 跨站脚本攻击

XSS（Cross Site Scripting），指攻击者在网页中嵌入恶意脚本，以窃取用户cookie、导航到恶意网站等。

### XSS是如何发生的？

假设有一个社交网站的用户详情页，展示用户地址，jsp代码如下：

```jsp
<div class="user-address">userData.get('address')</div>
```

同时有一个用户详情编辑页，其中包含一个输入框，可以用来提交用户地址，代码如下：

```jsp
<input name="user-address"/>
```

当用户在输入框中提交这样的输入：`<script>alert("XSS injected!")</script>`，再次打开用户详情页时这段“地址”被当作了js脚本执行，弹出alert弹窗`XSS injected!`。此时就发生了XSS跨站脚本攻击。任何访问这一个看似正常的页面的用户都会被窃取信息。

### XSS防护

XSS之所以发生，是因为用户的输入被当成了代码，解决方案是不相信用户的输入。

- 总是对用户的输入作html encode处理
- 将重要的cookie标记为http only，这样js就不能获取到这些cookie


# CSRF 跨站请求伪造

CSRF（Cross-Site Request Forgery），指攻击者伪装成用户的身份向用户服务器发送请求进行攻击，由于浏览器在发送请求时会自动带上对应网站的session cookie等信息，服务器会认为这是用户的合法请求。

### CSRF是如何发生的？

1. 用户访问并登录正常网站A。登录成功后，生成网站A的session cookie信息
2. 用户访问恶意网站B
3. 恶意网站B页面的代码向网站A发送任意请求，这些请求会自动带上步骤2中生成的cookie，网站A会认为这些用户请求合法，完成CSRF攻击

### CSRF防护

CSRF利用了http请求自动带上cookie的行为，防护方式则是在服务器端加入非cookie验证：

- **Token 验证**。服务器在生成页面时产生一个特定的token，客户端发送请求时带上这个token，服务器接到请求时验证token合法即可。
- **Referer 验证**。对一些内部的API请求，仅允许当前域名的referer请求。

# Clickjacking 点击劫持

Clickjacking 点击劫持，指攻击者在网站中嵌入一个指向其他用户网站的透明iframe，诱导用户点击，进而操作用户网站。类似于CSRF攻击，但这种方法完全模拟了用户操作，任何该用户网站提供的功能都可以被诱导完成，比如微博的关注、支付宝的转账等等。

### Clickjacking是如何发生的？

1. 用户访问并登录了正常网站A
2. 用户访问了恶意网站B
3. 恶意网站B内嵌了一个指向网站A的完全透明的iframe，并在下方构建网页样式，诱导用户去点击指定位置，该点击实际上是点中了网站A中的一个操作按钮等等，达到诱导用户操作网站A的目的

比如有如下恶意网站页面代码：

```html
<button>点我有惊喜！</button>
<iframe style="opacity:0" src="http://site.of.a"/>
```

其中iframe显示内容是：

![](/images/web_security/invisible_iframe.png)

最终恶意网站显示内容是：

![](/images/web_security/clickjacking_site.png)

用户以为点击的是网站B上的按钮，实际上点击的是网站A上的转账按钮。

### Clickjacking防护

Clickjacking利用透明iframe的欺骗，可以通过禁止这种情况下的iframe加载来防护。

1 . `X-Frame-Options` HTTP响应头可以控制浏览器是否显示该iframe，可选值为：

- DENY - 禁止显示为iframe
- SAMEORIGIN - 允许在与其相同的来源的网站中显示为iframe，禁止在其他网站中显示
- ALLOW-FROM ... - 仅允许指定的uri页面中显示为iframe

2 . 通过JS脚本检查，如果页面以iframe形式内嵌于其他页面，则通过跳转上一级url等操作阻止。

仅仅跳转链接的js防御很容易被绕过，比如这样的不推荐的防御代码：

```javascript
<script>if (top!=self) top.location.href=self.location.href;</script>
```

这样的防御代码可通过以下方式绕过：

- 双重iframe嵌套。将目标页面嵌套于更深层的iframe中，会违法一些浏览器所采用的**descendant frame navigation policy**规则（仅允许重定向后代iframe），从而跳转失败。（这个规则不适用于最顶层的窗口，因而单层iframe可以被成功防御）
- onBeforeUnload事件，其返回的字符串会用于提示用户是否确认跳转。攻击者可以借此诱导用户取消跳转。
- 无内容页请求。同样通过onBeforeUnload事件阻止跳转，但是同时页面加载后重复的请求跳转至某一个返回204的无内容网页，浏览器接到这个返回码不做任何处理，但是刷新了请求流，于是之前的跳转确认自动取消，不需要用户手动确认就能停留在当前页。代码如下：

```javascript
window.onbeforeunload = function() { return 'any thing...'; }
setInterval( function() {
  window.top.location = 'http://nocontent204.com';
}, 1);
```

- 利用浏览器 XSS filters，在url中添加如``的字段，浏览器XSS过滤器生效后会禁用内联脚本，包括Clickjacking防御代码

更好的js防御代码：

```html
<style id="antiClickjack">body{display:none !important;}</style>
<script type="text/javascript">
   if (self === top) {
       var antiClickjack = document.getElementById("antiClickjack");
       antiClickjack.parentNode.removeChild(antiClickjack);
   } else {
       top.location = self.location;
   }
</script>
```
