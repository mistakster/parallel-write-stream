function hook(stream, name, callback) {
	var emit = stream.emit;
	stream.emit = function (eventName) {
		if (eventName == name) {
			callback.apply(this, arguments);
		}
		emit.apply(this, arguments);
	}
}

var DataLogger = function (streamRead, streamWrite) {
	var type, i = 0, log = [];

	function push() {
		var rec = {};
		rec[type] = i;
		log.push(rec);
	}

	function handleEvent(streamType) {
		if (type == streamType) {
			i++;
		} else {
			if (type) {
				push();
			}
			type = streamType;
			i = 1;
		}
	}

	hook(streamRead, 'data', function () {
		handleEvent('read');
	});
	hook(streamWrite, 'data', function () {
		handleEvent('write');
	});

	this.finish = function () {
		push();
	};
	this.getLog = function () {
		return log;
	}
};


exports = module.exports = DataLogger;
