let { Cc, Ci, Cu } = require('chrome');
let { WebRequest } = Cu.import("resource://gre/modules/WebRequest.jsm", {});
let { setTimeout } = require("sdk/timers");
let tabs = require("sdk/tabs");

var wait = function (condition, callback) {
  if (!condition()) {
    setTimeout(function () {
      wait(condition, callback);
    }, 1000);
  } else {
    callback();
  }
};

var Browser = function () {
  this._init();
};

Browser.prototype._init = function () {
  var self = this;
  self._tab = tabs.activeTab;
  self._resources = {};
  self._orphanResources = [];
  WebRequest.onBeforeRequest.addListener(function (e) { self._onBeforeRequest(e); }, {}, ["blocking"]);
  WebRequest.onResponseStarted.addListener(function (e) { self._onResponseStarted(e); }, {});
  WebRequest.onCompleted.addListener(function (e) { self._onCompleted(e); }, {});
  self.runningRequests = {};
};

Browser.prototype._onBeforeRequest = function (e) {
  var self = this;
  if (e.url.indexOf("http") !== 0) {
    return { cancel: true };
  }
  self._resources[e.url] = {
      request: e,
      response: null,
      blocking: Date.now() - self._time,
      waiting: -1,
      receiving: -1,
      time: Date.now()
    };
  self._orphanResources.push(e.url);
  //console.log("REQUEST PREPARED:", e.url);
};

Browser.prototype._onResponseStarted = function (e) {
  var self = this;
  if (!self._resources[e.url]) {
    return;
  }
  if (self._resources[e.url].response) {
    return;
  }
  self._resources[e.url].waiting = Date.now() - self._resources[e.url].time;
  self._orphanResources.splice(self._orphanResources.indexOf(e.url), 1);
  self._resources[e.url].response = e;
  //console.log("RESPONSE STARTED:", e.url, self._resources[e.url].waiting);
};

Browser.prototype._onCompleted = function (e) {
  var self = this;
  if (!self._resources[e.url]) {
    return;
  }
  self._resources[e.url].receiving = (Date.now() - self._resources[e.url].time)// - self._resources[e.url].waiting;
  self._orphanResources.splice(self._orphanResources.indexOf(e.url), 1);
  self._resources[e.url].response = e;
  console.log("RESPONSE COMPLETED:", e.url, self._resources[e.url].waiting, self._resources[e.url].receiving);
};

Browser.prototype.open = function (data, callback) {
  var self = this;
  var url = data.url;

  if (!self._tab) {
      self._tab = tabs.activeTab;
  }

  self._tab.url = url;
  var func = function () { return self._tab.readyState === "complete"; };
  setTimeout(function () {
    wait(func, callback);
  }, 2000);
};

exports.Browser = Browser;
