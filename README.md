# fuck-debugger-extensions

English | [简体中文](README.zh-CN.md)

## Introduction
This extension is an anti-anti-debugging framework

When I saw a beautiful piece of code, I found that an anti-debugging.

crashed!!!

Having this plugin can solve the problem invisibly.


## Main problem solving
1. Console devtool detection
2. PushState crash browser
3. debugger crash browser and detects devtool
4. regexp code style detection
   


## install and use

### download
```
cd ~
git clone https://github.com/546669204/fuck-debugger-extensions.git

```

### install

```markdown
1. Navigate to chrome://extensions in your browser. You can also access this page by clicking on the Chrome menu on the top right side of the Omnibox, hovering over   **More Tools** and selecting **Extensions**.  
2. Check the box next to **Developer Mode**.  
3. Click **Load Unpacked Extension** and select the directory for your "Hello Extensions" extension.

Congratulations! 
```
### use  

Find the extension on the right side of the address bar. Click Configure.

Shortcut **Alt + Shift + D** Enable request interception



## Detailed explanation

### `Use console.log to determine whether to open the developer tools`
```javascript
//method 1
var x = document.createElement ('div');
Object.defineProperty (x, 'id', {
    get: function () {
        // developer tools are opened
    }
});
console.log (x);
// Method 2
var c = new RegExp ("1");
c.toString = function () {
  // developer tools are opened
}
console.log (c);
```
Hook the console object directly to invalidate all output


-----
### `Use the debugger statement to determine whether to open the developer tools and the infinite loop debugger crash machine`
```javascript
var startTime = new Date ();
debugger;
var endTime = new Date ();
var isDev = endTime-startTime> 100;// developer tools are opened

while (true) {
  debugger;
}

// Another implementation of debugger
(function () {}). constructor ("debugger") ()

```
Static debugger
Use the chrome protocol to intercept all requests, modify the return value.

Dynamic debugger
Hooked Function.protype.constructor to replace all debugger characters

---
### `Regexp code format detection`
```javascript
new RegExp(`\\w+ *\\(\\) *{\\w+ *['|"].+['|"];? *}`).test((function(){return "dev"}).toString())
```
The current solution is to hook regexp when the apply function is triggered, the parameter is equal to the given value and return an empty regexp

----

### chrome protocol

Approximate process
1. chrome.debugger.attach injects the specified tabId
2. Listen for chrome.debugger.onEvent to get the return value
3. Send Fetch.enable to enable the request interceptor
4. Modify the response in the event Fetch.requestPaused to return the result
5. OK!
   
This feature uses chrome **experimental features** requires a new version of chrome

You can do more with the chrome protocol


## other


If you encounter problems and suggestions during use, you can contact us with issuse;

If there are better ideas, you can get involved.

---


The project does not advocate cracking others' projects for profit. For academic research use only.

After all the code runs on the client. If it's valuable, just work hard. All can be broken.

It is recommended to put unimportant code on the client.


## references

https://developer.chrome.com/extensions

https://chromedevtools.github.io/devtools-protocol/tot/Browser