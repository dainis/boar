var fs = require('fs'),
  Utils = require('../utils.js');

var IScroll = function (page) {
  'use strict';
  this.init(page);
};

IScroll.prototype.init = function (page) {
  'use strict';
  var self = this;
  self.name = "old-iScroll-check";
  self.res = {};
  self._page = page;
};

IScroll.prototype.onLoadStarted = function () {
	var self = this;
	var linkrellist = document.querySelectorAll('link[rel*=\"icon\"]');
	var data = [];
	for (var i = 0, link; link = linkrellist[i]; i++) { 
		data.push({});
		var relvalues = {};
		relvalues = link.rel.trim().split(/\\s+/);
		data[i].relvalue = relvalues;
		if (link.getAttribute('sizes')) { 
			var sizevalues = {}; 
			sizevalues = link.getAttribute('sizes').trim().split(/\\s+/);
			data[i].sizes = sizevalues;
		}
	}
	self.res = JSON.stringify(data);
};

IScroll.prototype.getResult = function () {
  var self = this;
  return self.res;
};

try {
  if (exports) {
    exports.Plugin = IScroll;
  }
} catch (ex) {
  IconLink = module.exports;
}

