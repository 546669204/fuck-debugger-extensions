# fuck-debugger-extensions

简体中文 | [English](README.md)

## 简介
这个拓展是一个 反反反调试框架 

当看到一段漂亮代码的时候 发现有反调试 卡浏览器 死机 这个时候就很不爽了。

拥有这个插件 就可以解决问题于无形之中。


## 主要解决问题
1. 基于console的devtool检测
2. 基于pushState的卡浏览器
3. 基于debugger的卡浏览器 检测devtool
4. 基于regexp的代码风格检测
   


## 安装和使用

### 下载
```
cd ~
git clone https://github.com/546669204/fuck-debugger-extensions.git

```

### 安装  

```markdown  
1. Navigate to chrome://extensions in your browser. You can also access this page by clicking on the Chrome menu on the top right side of the Omnibox, hovering over   **More Tools** and selecting **Extensions**.  
2. Check the box next to **Developer Mode**.  
3. Click **Load Unpacked Extension** and select the directory for your "Hello Extensions" extension.

Congratulations! 
```
### 使用  

地址栏右侧找到拓展 点击 配置 功能选项 刷新即可

快捷键 **Alt+Shift+D** 开启请求拦截功能 



## 原理详解

### `使用console.log来判断是否打开开发者工具`
```javascript
//方法1
var x = document.createElement('div');
Object.defineProperty(x, 'id', {
    get:function(){
        // 开发者工具被打开
    }
});
console.log(x);
//方法2
var c = new RegExp("1");
c.toString = function(){
  // 开发者工具被打开
}
console.log(c);
```
直接hook console 对象 让所有输出失效  


-----
### `使用debugger语句判断是否打开开发者工具 和 无限循环debugger卡机`
```javascript
var startTime = new Date();
debugger;
var endTime = new Date();
var isDev = endTime - startTime >100;

while(true){
  debugger;
}

// debugger 的另一种实现方式
(function(){}).constructor("debugger")()

```
静态debugger  
使用chrome protocol 拦截所有请求 修改返回值

动态debugger  
hook 了 Function.protype.constructor 替换所有的debugger 字符

---
### `基于regexp的代码格式化检测`
```javascript
new RegExp(`\\w+ *\\(\\) *{\\w+ *['|"].+['|"];? *}`).test((function(){return "dev"}).toString())
```
目前的解决方案是 hook regexp 当触发apply函数的时候 参数等于给定值 返回空regexp  

----

### chrome protocol

大概流程
1. chrome.debugger.attach 注入指定tabId
2. 监听chrome.debugger.onEvent 获取返回值
3. 发送 Fetch.enable 开启请求拦截器
4. 在事件 Fetch.requestPaused 中修改 response 返回结果
5. OK！
   
该功能使用了chrome **实验特性** 需要新版chrome

利用 **chrome protocol** 还能做到更多

## 其他


如果在使用中遇到问题和建议可以提issuse与我们进行联系; 

如果有更好的想法可以参与进来。  

---


该项目不倡导去破解他人项目来谋取利益。仅做学术研究使用。

毕竟代码运行在客户端。如果有价值，只要花功夫。都是可以被人攻破的。

建议把不重要的代码放在客户端。


## 参考文献

https://developer.chrome.com/extensions

https://chromedevtools.github.io/devtools-protocol/tot/Browser