const script = document.createElement('script');


function core(e) {
  console.log("inject start!",e)

  if (e["config-hook-debugger"]) {
    var oldFunctionConstructor = Function.prototype.constructor;
    Function.prototype.constructor = function (code) {
      code = code.replace(/debugger/g, "");
      return oldFunctionConstructor.call(this, code)
    }
    //fix native function
    Function.prototype.constructor.toString = oldFunctionConstructor.toString.bind(oldFunctionConstructor);
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
  script.text = `(${core.toString()})(${JSON.stringify(result)})`;
  script.onload = () => {
    script.parentNode.removeChild(script);
  };
  (document.head || document.documentElement).appendChild(script);
})