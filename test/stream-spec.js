var should = require('should');
var util = require('util');
var ParallelWriteStream = require('../index');
var Producer = require('./helpers/producer');
var Consumer = require('./helpers/consumer');
var DataLogger = require('./helpers/data-logger');
var eventLogger = require('./helpers/event-logger');


describe('Parallel write stream', function () {

	it('should work', function (done) {

		var documentsCount = 0;
		var checkSum = 0;

		var TestStream = function () {
			ParallelWriteStream.call(this);
		};
		util.inherits(TestStream, ParallelWriteStream);
		TestStream.prototype._task = function (doc, callback) {
			process.nextTick(function () {
				documentsCount += 1;
				checkSum = checkSum * 2 + doc;
				callback();
			});
		};

		var testStream = new TestStream();

		testStream.on('unpipe', function () {
			documentsCount.should.be.equal(25);
			checkSum.should.be.equal(67108837);
			done();
		});

		var producer = new Producer([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
			11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
			21, 22, 23, 24, 25
		]);

		producer.pipe(testStream);

	});

	it('should do jobs in parallel', function (done) {

		var storage = {};
		var documentsCount = 0;
		var concurrentJobsCount = [];

		var TestStream = function () {
			ParallelWriteStream.call(this, {
				concurrency: 10
			});
		};
		util.inherits(TestStream, ParallelWriteStream);
		TestStream.prototype._task = function (doc, callback) {
			storage[doc] = true;
			setTimeout(function () {
				documentsCount += 1;
				delete storage[doc];
				callback();
			}, 10 + 100 * Math.random());
			var keysLength = Object.keys(storage).length;
			keysLength.should.not.be.greaterThan(10);
			keysLength.should.be.greaterThan(0);
			concurrentJobsCount.push(keysLength);
		};

		var testStream = new TestStream();

		testStream.on('unpipe', function () {
			documentsCount.should.be.equal(25);
			concurrentJobsCount.should.be.eql([1,2,3,4,5,6,7,8,9,10,1,2,3,4,5,6,7,8,9,10,1,2,1,1,1]);
			done();
		});

		var producer = new Producer([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
			11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
			21, 22, 23, 24, 25
		]);

		producer.pipe(testStream);

	});

	it('should do jobs in parallel with bigger buffer', function (done) {

		var storage = {};
		var documentsCount = 0;

		var TestStream = function () {
			ParallelWriteStream.call(this, {
				concurrency: 10,
				highWaterMark: 15
			});
		};
		util.inherits(TestStream, ParallelWriteStream);
		TestStream.prototype._task = function (doc, callback) {
			storage[doc] = true;
			setTimeout(function () {
				documentsCount += 1;
				delete storage[doc];
				callback();
			}, 10 + 100 * Math.random());
			var keysLength = Object.keys(storage).length;
			keysLength.should.not.be.greaterThan(10);
			keysLength.should.be.greaterThan(0);
		};

		var testStream = new TestStream();

		testStream.on('unpipe', function () {
			documentsCount.should.be.equal(25);
			done();
		});

		var producer = new Producer([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
			11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
			21, 22, 23, 24, 25
		]);

		producer.pipe(testStream);

	});

	it('should not pass through data', function () {

		var TestStream = function () {
			ParallelWriteStream.call(this);
		};
		util.inherits(TestStream, ParallelWriteStream);

		var testStream = new TestStream();
		var producer = new Producer([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		var consumer = new Consumer();

		(function () {
			producer.pipe(testStream).pipe(consumer);
		}).should.throw('Cannot pipe. Not readable.');

	});

	it('should handle internal errors well', function (done) {

		var documentsCount = 0;

		var TestStream = function () {
			ParallelWriteStream.call(this, {
				concurrency: 10
			});
		};
		util.inherits(TestStream, ParallelWriteStream);
		TestStream.prototype._task = function (doc, callback) {
			process.nextTick(function () {
				documentsCount += 1;
				if (doc >= 5) {
					callback(new Error('document #' + doc));
				} else {
					callback();
				}
			});
		};

		var testStream = new TestStream();

		testStream.on('end', function () {
			done(new Error('unexpected end event'));
		});

		testStream.on('unpipe', function () {
			documentsCount.should.be.equal(10);
			process.nextTick(function () {
				done();
			});
		});

		testStream.on('error', function (err) {
			err.should.be.an.Error;
			err.message.should.be.equal('document #5');
		});

		var producer = new Producer([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
			11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
			21, 22, 23, 24, 25
		]);

		producer.pipe(testStream);

	});


	it('should handle source stream errors well', function (done) {

		var documentsCount = 0;

		var TestStream = function () {
			ParallelWriteStream.call(this, {
				concurrency: 1
			});
		};
		util.inherits(TestStream, ParallelWriteStream);
		TestStream.prototype._task = function (doc, callback) {
			process.nextTick(function () {
				documentsCount += 1;
				if (doc >= 15) {
					callback(new Error('document #' + doc));
				} else {
					callback();
				}
			});
		};

		var testStream = new TestStream();

		testStream.on('unpipe', function () {
			documentsCount.should.be.equal(2);
			process.nextTick(function () {
				done();
			});
		});

		var producer = new Producer([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3);

		producer.on('error', function () {
			// suppress error
		});

		producer.pipe(testStream);

	});

});
