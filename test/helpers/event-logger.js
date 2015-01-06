var util = require('util');

exports = module.exports = function (emitter, name) {
	var emit = emitter.emit;
	var format = name ? util.format('%s - %%s', name) : '%s';
	emitter.emit = function () {
		util.log(util.format(format, arguments[0]));
		return emit.apply(this, arguments);
	};
	return emitter;
};
