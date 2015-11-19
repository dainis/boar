let Browser = require("./tab.js").Browser,
  tabs = require("sdk/tabs"),
  windows = require("sdk/windows").browserWindows,
  { Cc, Ci, Cu } = require('chrome'),
  { modelFor } = require("sdk/model/core"),
  { viewFor } = require("sdk/view/core"),
  { open } = require('sdk/window/utils'),
  { startServerAsync } = require("./httpd.js"),
  { Services } = Cu.import("resource://gre/modules/Services.jsm"),
  doneInitializing = false,
  chromeWindow = null;

// Make sure no other tab is to be opened
tabs.on('open', function onOpen(tab) {
  tab.close();
});

let setScreenSize = function (data, callback) {
  chromeWindow.resizeTo(
    data.width,
    data.height
    );
};

let addCookie = function (data, callback) {
  Services.cookies.add(data.domain, data.path, data.name, data.value,
    data.secure, data.httponly, data.session, data.expires);
  callback();
};

let setUserAgent = function (data, callback) {
  chromeWindow.navigator.userAgent = data.userAgent;
  callback();
};

function init(done) {
  for (let window of windows) {
    window.close();
  }
  windows.open({
    url: "",
    onOpen: function () {
      chromeWindow = viewFor(windows.activeWindow);
      done(new Browser());
    },
    features: {
      chrome: false
    }
  });
}

function start(tab) {
  let paths = {};
  paths["/open"] = tab.open;
  paths["/addCookie"] = addCookie;
  paths["/setUserAgent"] = setUserAgent;
  paths["/setScreenSize"] = setScreenSize;
  let server = startServerAsync(7331, "/");

  server.registerPrefixHandler("/", function (request, response) {
    let path = request._path;

    let success = function (data) {
      console.log("DONE");
      response.setStatusLine(request.httpVersion, 200, "OK");
      if (data) {
        response.write(JSON.stringify(data));
      }
      response.finish();
    };

    let error = function () {
      response.setStatusLine(request.httpVersion, 500, "Error");
      response.finish();
    };

    if (!paths[path]) {
      response.setStatusLine(request.httpVersion, 404, "Invalid Path");
      response.write(JSON.stringify("Bad Request"));
      response.finish();
      return;
    }

    response.processAsync();

    var data = {};
    try {
      data = JSON.parse(request.body);
    } catch (ex) { }

    paths[path](data, success);
  });

  server.start();
}

init(start)
