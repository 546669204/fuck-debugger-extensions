const script = document.createElement('script');


function core(e,window) {
  var globalConfig = e;
  console.log("inject start!", e)

  if (e["config-hook-debugger"]) {

    function Closure(injectFunction) {
      return function () {
        if (!arguments.length) return injectFunction.apply(this, arguments)
        arguments[arguments.length - 1] = arguments[arguments.length - 1].replace(/debugger/g, "");
        return injectFunction.apply(this, arguments)
      }
    }


    var oldFunctionConstructor = window.Function.prototype.constructor;
    window.Function.prototype.constructor = Closure(oldFunctionConstructor)
    //fix native function
    window.Function.prototype.constructor.toString = oldFunctionConstructor.toString.bind(oldFunctionConstructor);

    var oldFunction = Function;
    window.Function = Closure(oldFunction)
    //fix native function
    window.Function.toString = oldFunction.toString.bind(oldFunction);

    var oldEval = eval;
    window.eval = Closure(oldEval)
    //fix native function
    window.eval.toString = oldEval.toString.bind(oldEval);


    // hook GeneratorFunction
    var oldGeneratorFunctionConstructor = Object.getPrototypeOf(function* () {}).constructor
    var newGeneratorFunctionConstructor = Closure(oldGeneratorFunctionConstructor)
    newGeneratorFunctionConstructor.toString = oldGeneratorFunctionConstructor.toString.bind(oldGeneratorFunctionConstructor);
    Object.defineProperty(oldGeneratorFunctionConstructor.prototype, "constructor", {
      value: newGeneratorFunctionConstructor,
      writable: false,
      configurable: true
    })

    // hook Async Function 
    var oldAsyncFunctionConstructor = Object.getPrototypeOf(async function () {}).constructor
    var newAsyncFunctionConstructor = Closure(oldAsyncFunctionConstructor)
    newAsyncFunctionConstructor.toString = oldAsyncFunctionConstructor.toString.bind(oldAsyncFunctionConstructor);
    Object.defineProperty(oldAsyncFunctionConstructor.prototype, "constructor", {
      value: newAsyncFunctionConstructor,
      writable: false,
      configurable: true
    })

    // hook dom
    var oldSetAttribute = window.Element.prototype.setAttribute;
    window.Element.prototype.setAttribute = function (name, value) {
      if(typeof value == "string")value = value.replace(/debugger/g, "")
      // 向上调用
      oldSetAttribute.call(this,name,value)
    };
    var oldContentWindow = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,"contentWindow").get
    Object.defineProperty(window.HTMLIFrameElement.prototype,"contentWindow",{
      get(){
        var newV = oldContentWindow.call(this)
        if(!newV.inject){
          newV.inject = true;
          core.call(newV, globalConfig,newV);
        }
        return newV
      }
    })

  }
  if (e["config-hook-pushState"]) {
    // hook pushState
    var oldHistoryPushState = history.pushState;
    var pushState = {};

    history.pushState = function () {
      // anti-shake filtering high frequency operation
      if (new Date() - pushState.lastTime > 200) {
        pushState.count = 0;
      }
      pushState.count++;
      if (pushState.count > 3) return;
      return oldHistoryPushState.apply(this, arguments)
    };
    history.pushState.toString = oldHistoryPushState.toString.bind(oldHistoryPushState)
  }
  if (e["config-hook-regExp"]) {
    // hook RegExp
    var oldRegExp = RegExp;
    RegExp = new Proxy(RegExp, {
      apply(target, thisArgument, argumentsList) {
        // prevent detection of formatting
        if (argumentsList[0] == `\\w+ *\\(\\) *{\\w+ *['|"].+['|"];? *}`) {
          return Reflect.apply(target, thisArgument, [""])
        }
        return Reflect.apply(target, thisArgument, argumentsList)
      }
    });
    RegExp.toString = oldRegExp.toString.bind(oldRegExp)
  }

  if (e["config-hook-console"]) {
    // hook console
    var oldConsole = ["debug", "error", "info", "log", "warn", "dir", "dirxml", "table", "trace", "group", "groupCollapsed", "groupEnd", "clear", "count", "countReset", "assert", "profile", "profileEnd", "time", "timeLog", "timeEnd", "timeStamp", "context", "memory"].map(key => {
      var old = console[key];
      console[key] = function () {};
      console[key].toString = old.toString.bind(old)
      return old;
    })
  }


}
chrome.storage.sync.get(["config-hook-console", "config-hook-debugger", "config-hook-regExp", "config-hook-pushState"], function (result) {
  script.text = `(${core.toString()})(${JSON.stringify(result)},window)`;
  script.onload = () => {
    script.parentNode.removeChild(script);
  };
  (document.head || document.documentElement).appendChild(script);
})