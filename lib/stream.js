var util = require('util');
var async = require('async');
var Writable = require('readable-stream').Writable;

/**
 * @param {Object} options
 * @param {Number} [options.concurrency]
 * @constructor
 */
function ParallelWriteStream(options) {

	options = options || {};
	this._concurrency = typeof options.concurrency == 'undefined' ? 1 : options.concurrency;
	this._storage = [];

	delete options.concurrency;
	options.highWaterMark = options.highWaterMark || this._concurrency;
	options.objectMode = true;

	Writable.call(this, options);

}
util.inherits(ParallelWriteStream, Writable);

ParallelWriteStream.prototype._write = function (doc, encoding, callback) {

	this._storage.push(doc);
	if (this._storage.length >= this._concurrency || this._writableState.ending || this._writableState.ended) {
		this._flush(callback);
	} else {
		callback(null);
	}
};

ParallelWriteStream.prototype._flush = function (callback) {
	var storage = this._storage;
	this._storage = [];
	async.each(storage, this._task.bind(this), function (err) {
		process.nextTick(function () {
			callback(err);
		});
	});
};

ParallelWriteStream.prototype._task = function (doc, callback) {
	callback(new Error('_task method is not implemented yet.'));
};

module.exports = exports = ParallelWriteStream;
