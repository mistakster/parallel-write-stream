var util = require('util');
var async = require('async');
var Transform = require('readable-stream').Transform;

/**
 * @param {Object} options
 * @param {Number} options.concurrency
 * @param {Boolean} options.passthrough
 * @constructor
 */
function ParallelWriteStream(options) {

	options = options || {};
	this._concurrency = typeof options.concurrency == 'undefined' ? 1 : options.concurrency;
	this._storage = [];

	delete options.concurrency;
	options.highWaterMark = this._concurrency;
	options.objectMode = true;

	Transform.call(this, options);

	this.once('pipe', function () {
		this.resume();
	}.bind(this));

}
util.inherits(ParallelWriteStream, Transform);

ParallelWriteStream.prototype._transform = function (doc, encoding, callback) {
	this.push(doc);
	this._storage.push(doc);

	if (this._storage.length >= this._concurrency) {
		this._doUpdate(callback);
	} else {
		callback(null);
	}
};

ParallelWriteStream.prototype._flush = function (callback) {
	this._doUpdate(callback);
};

ParallelWriteStream.prototype._doUpdate = function (callback) {
	var storage = this._storage;
	this._storage = [];
	async.each(storage, this._save.bind(this), function (err) {
		process.nextTick(function () {
			callback(err);
		});
	});
};

ParallelWriteStream.prototype._save = function (doc, callback) {
	callback(new Error('_save method is not implemented yet.'));
};

module.exports = exports = ParallelWriteStream;
