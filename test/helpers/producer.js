var util = require('util');
var Readable = require('readable-stream');

var Producer = function (arr, errorDoc) {
	Readable.call(this, {
		objectMode: true
	});
	this._arr = arr;
	this._pos = 0;
	this._errorDoc = errorDoc;
};
util.inherits(Producer, Readable);

Producer.prototype._read = function () {
	if (this._pos >= this._arr.length) {
		this.push(null);
	} else {
		var doc = this._arr[this._pos++];
		if (this._errorDoc && this._errorDoc === doc) {
			this.emit('error', new Error('document with error'));
			this.push(null);
		} else {
			this.push(doc);
		}
	}
};

exports = module.exports = Producer;
