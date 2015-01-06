var util = require('util');
var Writable = require('readable-stream').Writable;

var Consumer = function () {
	Writable.call(this, {
		objectMode: true
	});
	this._storage = [];
};
util.inherits(Consumer, Writable);

Consumer.prototype._write = function (doc, encoding, callback) {
	this._storage.push(doc);
	callback();
};

Consumer.prototype.getStorage = function () {
	return this._storage;
};

exports = module.exports = Consumer;
