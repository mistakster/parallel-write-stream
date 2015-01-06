var should = require('should');
var util = require('util');
var ParallelWriteStream = require('../index');
var Producer = require('./helpers/producer');
var Consumer = require('./helpers/consumer');


describe('Parallel write stream', function () {

	it('should work', function (done) {

		var documentsCount = 0;
		var checkSum = 0;

		var TestStream = function () {
			ParallelWriteStream.call(this);
		};
		util.inherits(TestStream, ParallelWriteStream);
		TestStream.prototype._save = function (doc, callback) {
			process.nextTick(function () {
				documentsCount += 1;
				checkSum = checkSum * 2 + doc;
				callback();
			});
		};

		var testStream = new TestStream();

		testStream.on('end', function () {
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
		TestStream.prototype._save = function (doc, callback) {
			storage[doc] = true;
			process.nextTick(function () {
				documentsCount += 1;
				delete storage[doc];
				callback();
			});
			var keysLength = Object.keys(storage).length;
			keysLength.should.not.be.greaterThan(10);
			keysLength.should.be.greaterThan(0);
			concurrentJobsCount.push(keysLength);
		};

		var testStream = new TestStream();

		testStream.on('end', function () {
			documentsCount.should.be.equal(25);
			concurrentJobsCount.should.be.eql([1,2,3,4,5,6,7,8,9,10,1,2,3,4,5,6,7,8,9,10,1,2,3,4,5]);
			done();
		});

		var producer = new Producer([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
			11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
			21, 22, 23, 24, 25
		]);

		producer.pipe(testStream);

	});

	it('should pass through data', function (done) {

		var documentsCount = 0;

		var TestStream = function () {
			ParallelWriteStream.call(this, {
				concurrency: 10
			});
		};
		util.inherits(TestStream, ParallelWriteStream);
		TestStream.prototype._save = function (doc, callback) {
			process.nextTick(function () {
				documentsCount += 1;
				callback();
			});
		};

		var testStream = new TestStream();

		testStream.on('end', function () {
			documentsCount.should.be.equal(25);
			consumer.getStorage().should.be.eql([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]);
			done();
		});

		var producer = new Producer([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
			11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
			21, 22, 23, 24, 25
		]);

		var consumer = new Consumer();

		producer.pipe(testStream).pipe(consumer);
	});

	it('should handle errors well', function (done) {

		var documentsCount = 0;

		var TestStream = function () {
			ParallelWriteStream.call(this, {
				concurrency: 10
			});
		};
		util.inherits(TestStream, ParallelWriteStream);
		TestStream.prototype._save = function (doc, callback) {
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

});
