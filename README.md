parallel-write-stream
=====================

Parallel Write Stream is an abstract class which helps create kind of passthrough stream.
Your have to implement `_save` method and operate with the object streams only.

Regardless of how data will flow into your writable stream, the batch of tasks will be
processed in parallel.

## Install

$ npm install --save parallel-write-stream

## Usage

To implement parallel write stream, follow the pattern:

```js
var util = require('util');
var ParallelWriteStream = require('parallel-write-stream');

var Updater = function () {
  ParallelWriteStream.call(this);
};
util.inherits(Updater, ParallelWriteStream);

Updater.prototype._save = function (doc, callback) {
  // implement procedure to save doc here
  // invoke callback then save will be done
  callback();
};
```

The size of the batch is specified in the options passed to constructor.

```js
var update = new Updater({
  concurrency: 5
});
```

## API

### _save(doc, callback)

#### doc

The document you want to store, update or process in other way.

#### callback(err)

A function which is called when the processing is finished. First argument is the error.

## License

MIT © 2015 [Vladimir Kuznetsov](http://noteskeeper.ru/about/)
