self.importScripts("babel.min.js","crypto-js/core.js","crypto-js/enc-base64.js");



function removeDebugger(babel) {
  const {
    types: t
  } = babel;
  return {
    visitor: {
      DebuggerStatement(path) {
        path.replaceWith(t.identifier("/*debugger*/"))
      },
    }
  }
}

Babel.registerPlugin("transform-remove-debugger", removeDebugger)
var l = [];
var runing = false;
self.addEventListener("message", function (e) {
  if (e.data.base64Encoded) {
    e.data.body = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(e.data.body));
  }
  l.push(e.data);
  c()
})

function c() {
  if (l.length > 0 && !runing) {
    h(l.shift());
  }
}

function h(e) {
  runing = true;
  var result = Babel.transform(e.body, {
    code: true,
    ast: false,
    sourceMaps: false,
    retainLines:true,
    plugins: ["transform-remove-debugger"]
  })
  e.body = result.code;
  if (e.base64Encoded) {
    e.body = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(e.body));
  }
  self.postMessage(e)
  runing = false;
  setTimeout(c)
}