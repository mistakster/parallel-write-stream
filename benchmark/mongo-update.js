var should = require('should');
var util = require('util');
var ParallelWriteStream = require('../index');
var async = require('async');
var mongoose = require('mongoose');

var TEST_COLLECTION = 'test';
var ITEMS_COUNT = 2e5;


function generateRandomString(len) {
	var ALPHABET = '0123456789' +
		'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
		'abcdefghijklmnopqrstuvwxyz';
	var out = [], i;
	for (i = 0; i < len; i++) {
		out.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
	}
	return out.join('');
}

function createRandomDocument() {
	var i, j, key, value, doc = {_v: 0};
	for (i = 0; i < 10; i++) {
		key = generateRandomString(10);
		value = Math.random();
		doc[key] = value;
	}
	return doc;
}


var UpdateStream = function (collection, opts) {
	ParallelWriteStream.call(this, opts);
	this._collection = collection;
};
util.inherits(UpdateStream, ParallelWriteStream);

UpdateStream.prototype._save = function (doc, callback) {
	var updatedDoc = {
		_id: doc._id,
		_v: doc._v + 1
	};
	Object.keys(doc)
		.filter(function (key) { return key != '_id' && key != '_v'; })
		.forEach(function (key) {
			updatedDoc[key] = Math.sin(doc[key]);
		});
	this._collection.update(
		{
			_id: doc._id
		},
		updatedDoc,
		{
			upsert: true
		},
		callback
	);
};


function task(concurrency, done) {
	var collection = new mongoose.Collection(TEST_COLLECTION, mongoose.connection);
	var timer = process.hrtime();
	var diff;

	async.series([
		function (next) {
			collection.find({}, function (err, cursor) {
				var updater = new UpdateStream(collection, {concurrency: concurrency});
				updater.once('end', function () {
					updater.removeListener('error', next);
					next();
				});
				updater.once('error', function (err) {
					update.removeListener('end', next);
					next(err);
				});
				cursor.stream().pipe(updater);
			});
		},
		function (next) {
			diff = process.hrtime(timer);
			next();
		},
		function (next) {
			var i = 0;
			collection.find({}, function (err, cursor) {
				var stream = cursor.stream();
				stream.on('data', function (doc) {
					doc.should.have.properties('_id', '_v');
					i++;
				});
				stream.on('end', function () {
					i.should.be.equal(ITEMS_COUNT);
					next();
				});
				stream.resume();
			});
		}
	], function (err) {
		if (err) {
			done(err);
		} else {
			done(null, diff[0] + diff[1] * 1e-9);
		}
	});
}


async.series([
	function (done) {
		mongoose.connect('mongodb://localhost/parallel-write-stream', function (err) {
			if (err) throw err;

			// fill collection with fixtures
			var collection = new mongoose.Collection(TEST_COLLECTION, mongoose.connection);
			async.series([
				function (next) {
					collection.remove({}, next);
				},
				function (next) {
					var i = 0;
					async.until(
						function () { return i >= ITEMS_COUNT; },
						function (callback) {
							i++;
							collection.insert(createRandomDocument(), callback);
						},
						next
					);
				},
				function (next) {
					async.waterfall([
						function (next) {
							collection.find({}, next);
						},
						function (cursor, next) {
							cursor.count(next);
						},
						function (count, next) {
							count.should.be.equal(ITEMS_COUNT);
							next();
						}
					], next);
				}
			], done);

		});
	},

	function (done) {

		async.mapSeries([1,3,10,30,100],
			function (n, nextTest) {
				util.log(util.format('Concurrency = %d', n));
				async.mapSeries([1,2,3,4,5],
					function (attempt, nextAttempt) {
						task(n, function (err, diff) {
							if (!err) {
								util.log(util.format('Benchmark took %d seconds', diff));
							}
							nextAttempt(err, diff);
						});
					},
					function (err, results) {
						var sum = results.reduce(function (memo, v) { return memo + v; }, 0);
						nextTest(err, {n: n, time: sum / results.length});
					}
				);
			},
			function (err, results) {
				util.log('=====');
				results.forEach(function (r) {
					util.log(util.format('Concurrency: %d, Average time: %d', r.n, r.time));
				});
				done();
			}
		);

	},

	function (done) {
		var collection = new mongoose.Collection(TEST_COLLECTION, mongoose.connection);
		collection.drop(function (err) {
			if (err) throw err;
			mongoose.disconnect(done);
		});
	}

]);
