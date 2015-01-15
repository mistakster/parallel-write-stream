parallel-write-stream
=====================

[![Build Status](https://travis-ci.org/mistakster/parallel-write-stream.svg?branch=master)](https://travis-ci.org/mistakster/parallel-write-stream)

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

## Benchmark

As an example how parallel writes can speed up some tasks, I created benchmark which update items in MongoDB.

![Update 200 000 items in MongoDB](https://raw.githubusercontent.com/mistakster/parallel-write-stream/master/benchmark/mongo-update-chart.png)

| Concurrency level | Time in seconds |
|------------------:|----------------:|
|                 1 |            57.0 |
|                 3 |            47.0 |
|                10 |            44.0 |
|                30 |            42.2 |
|               100 |            41.7 |

The task was pretty simple. The benchmark test filled DB with required number of documents.
Then it replaced content of each document with new content.

To run benchmark in your local environment use following command:

```bash
$ node benchmark/mongo-update.js
```

## License

MIT © 2015 [Vladimir Kuznetsov](http://noteskeeper.ru/about/)
