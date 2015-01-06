var should = require('should');
var util = require('util');
var ParallelWriteStream = require('../index');
var Producer = require('./helpers/producer');


describe('Parallel write stream', function () {

	it('should work', function (done) {

		var documentsCount = 0;
		var checkSum = 0;

		var TestStream = function () {
			ParallelWriteStream.call(this);
		};
		util.inherits(TestStream, ParallelWriteStream);
		TestStream.prototype._save = function (doc, callback) {
			documentsCount += 1;
			checkSum = checkSum * 2 + doc;
			callback();
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

});
