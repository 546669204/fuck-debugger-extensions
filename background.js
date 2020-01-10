var attached = false;

var worker = new Worker("babel.worker.js");
worker.addEventListener("error", console.error);

function onWorkerMessage(e) {
  chrome.storage.local.set({[e.data._url]: e.data.body}, function() {
    // console.log('Value is set to ' + value);
  });
  console.log("xmFetch","Fetch.fulfillRequest",e.data._url)
  sendCommand("Fetch.fulfillRequest", e.data, e.data._source);
}

// navigator.serviceWorker.register('sdf.js').then(x=>console.log('done', x))
var sendCommand = (method, params, source) => new Promise((res, err) => {
  chrome.debugger.sendCommand(source, method, params, result => {
    if (chrome.runtime.lastError) {
      err(chrome.runtime.lastError);
    } else {
      res(result);
    }
    console.log('sendCommand', source, method, params);
  });
});
chrome.commands.onCommand.addListener(function (command) {
  console.log("adding listener to " + command);
  toggleAttachDebugger();
});
var frameList = new Set();
chrome.debugger.onEvent.addListener(async (source, method, params) => {
  console.log('onEvent', source, method, params);
  try {
    switch (method) {
      case "Page.frameAttached":
        frameList.add(params.frameId)
        break
      case "Page.frameStoppedLoading":
        if (frameList.has(params.frameId)) {
          chrome.debugger.attach({
            targetId: params.frameId
          }, "1.2", async function () {
            await sendCommand("Fetch.enable", {
              patterns: [{
                urlPattern: "*",
                requestStage: "Response",
                resourceType: "Script"
              }]
            }, {
              targetId: params.frameId
            });
            await sendCommand("Page.enable", {}, {
              targetId: params.frameId
            });
            await sendCommand("Debugger.enable", {},{
              targetId: params.frameId
            });
          })

          frameList.delete(params.frameId)
        }

        break
      case "Debugger.scriptParsed":
        if(!params.isLiveEdit){
          var res = await sendCommand("Debugger.getScriptSource", {scriptId: params.scriptId}, source);
          console.log("getScriptSource",params.scriptId,res)
        }
        break
      case "Fetch.requestPaused":
        console.log("xmFetch","Fetch.requestPaused",params.request.url)
        var item;
        if (item = params.responseHeaders.find(v => v.name == "Location")) {
          await sendCommand("Fetch.continueRequest", {
            requestId: params.requestId,
            url: item.value
          }, source);
          break;
        }
        if ((params.responseStatusCode || params.responseErrorReason)) {
          var res = await sendCommand("Fetch.getResponseBody", {
            requestId: params.requestId
          }, source);
          if (params.responseErrorReason) {
            await sendCommand("Fetch.failRequest", {
              requestId: params.requestId,
              errorReason: params.responseErrorReason
            }, source);
            break;
          }
          chrome.storage.local.get([params.request.url], function(result) {
            if(result[params.request.url]){
              sendCommand("Fetch.fulfillRequest", {
                requestId: params.requestId,
                responseCode: params.responseStatusCode,
                responseHeaders: params.responseHeaders,
                body: result[params.request.url],
                base64Encoded: res.base64Encoded,
              },source);
              console.log("xmFetch","Fetch.fulfillRequest",params.request.url)
            }else{
              worker.postMessage({
                requestId: params.requestId,
                responseCode: params.responseStatusCode,
                responseHeaders: params.responseHeaders,
                body: res.body,
                base64Encoded: res.base64Encoded,
                _source: source,
                _url:params.request.url
              })
            }
          });
          
          break;
        }
    }
  } catch (error) {
    console.error(error)
  }

});

function toggleAttachDebugger() {
  console.log("toggleAttachedDebugger was " + attached);
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    if (tabs.length != 1) {
      console.warn("expected exactly one tab match, got " + tabs.length);
      return;
    }
    var tab = {
      tabId: tabs[0].id
    };
    console.log("Current tab is " + tab.tabId);

    if (attached) {
      chrome.debugger.detach(tab, function () {
        console.log("toggleAttachedDebugger detached");
        attached = false;
      });
      worker.removeEventListener("message", onWorkerMessage)
    } else {
      chrome.debugger.attach(tab, "1.2", async function () {
        console.log("toggleAttachedDebugger atached", arguments);
        attached = true;
        await sendCommand("Fetch.enable", {
          patterns: [{
            urlPattern: "*",
            requestStage: "Response",
            resourceType: "Script"
          }]
        },tab);
        await sendCommand("Page.enable", {},tab);
        await sendCommand("Debugger.enable", {},tab);
        worker.addEventListener("message", onWorkerMessage)
      });
    }
  });
}