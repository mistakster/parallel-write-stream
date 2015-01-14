var should = require('should');
var util = require('util');
var ParallelWriteStream = require('../index');
var async = require('async');
var mongoose = require('mongoose');

var TEST_COLLECTION = 'test';
var ITEMS_COUNT = 3e5;


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
		value = generateRandomString(50);
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
			var newKey = generateRandomString(10);
			updatedDoc[newKey] = doc[key];
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




describe('Benchmark', function () {

	this.timeout(150000);

	before(function (done) {
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
	});

	after(function (done) {
		var collection = new mongoose.Collection(TEST_COLLECTION, mongoose.connection);
		collection.drop(function (err) {
			if (err) throw err;
			mongoose.disconnect(done);
		});
	});



	function task(concurrency, done) {
		var collection = new mongoose.Collection(TEST_COLLECTION, mongoose.connection);
		var timer = process.hrtime();

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
				var diff = process.hrtime(timer);
				util.log(util.format('benchmark took %d seconds', diff[0] + diff[1] * 10e-9));
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
		], done);
	}


	it('1.1', function (done) {
		task(1, done);
	});
	it('1.2', function (done) {
		task(1, done);
	});
	it('1.3', function (done) {
		task(1, done);
	});
	it('1.4', function (done) {
		task(1, done);
	});
	it('1.5', function (done) {
		task(1, done);
	});
	it('10.1', function (done) {
		task(10, done);
	});
	it('10.2', function (done) {
		task(10, done);
	});
	it('10.3', function (done) {
		task(10, done);
	});
	it('10.4', function (done) {
		task(10, done);
	});
	it('10.5', function (done) {
		task(10, done);
	});
	it('100.1', function (done) {
		task(100, done);
	});
	it('100.2', function (done) {
		task(100, done);
	});
	it('100.3', function (done) {
		task(100, done);
	});
	it('100.4', function (done) {
		task(100, done);
	});
	it('100.5', function (done) {
		task(100, done);
	});

});