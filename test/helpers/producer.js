var util = require('util');
var Readable = require('readable-stream');

var Producer = function (arr) {
	Readable.call(this, {
		objectMode: true
	});
	this._arr = arr;
	this._pos = 0;
};
util.inherits(Producer, Readable);

Producer.prototype._read = function () {
	if (this._pos >= this._arr.length) {
		this.push(null);
	} else {
		this.push(this._arr[this._pos]);
		this._pos += 1;
	}
};

exports = module.exports = Producer;
