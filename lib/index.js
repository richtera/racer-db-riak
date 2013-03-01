var EventEmitter = require('events').EventEmitter
  , url = require('url')
  , riak = require('nodiak')
  , createQueryCtor = require('./query')
  , util = require('./util')
  , fixId = util.fixId
  , lookup

  , DISCONNECTED  = 1
  , CONNECTING    = 2
  , CONNECTED     = 3
  , DISCONNECTING = 4;

exports = module.exports = plugin;

function plugin (racer) {
  lookup = racer['protected'].path.lookup
  DbRiak.prototype.Query = createQueryCtor(racer);
  racer.registerAdapter('db', 'Riak', DbRiak);
}

// Make this a racer plugin. This tells `derby.use(...)` to use the plugin on
// racer, not derby.
exports.decorate = 'racer';

exports.useWith = { server: true, browser: false };

// Examples:
// new DbRiak({uri: 'riak://localhost:port/database'});
// new DbRiak({
//     host: 'localhost'
//   , port: 27017
//   , database: 'example'
// });
function DbRiak (options) {
  EventEmitter.call(this);
  this.options = options;

  // TODO Make version scale beyond 1 db
  //      by sharding and with a vector
  //      clock with each member the
  //      version of a shard
  // TODO Initialize the version properly upon web server restart
  //      so it's synced with the STM server (i.e., Redis) version
  this.version = undefined;
}

DbRiak.prototype.__proto__ = EventEmitter.prototype;

DbRiak.prototype.connect = function connect (options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || this.options || {};

  // TODO: Review the options parsing here
  var self = this
    , uri = options.uri || options.host + ':' + options.port + '/' + options.database
    , info = url.parse(uri)
  console.log(info);
  if (info.protocol === 'http:')
    options.protocol = 'http';
  else if (info.protocol === 'https:')
    options.protocol = 'https';
  else
    throw new Error('Invalid protocol for Riak adapter (http or https)');
  options.port = info.port || 8098;
  options.host = info.host || 'localhost';
  options.protocol = info.protocol
  if (info.pathname) {
    var items = info.pathname.split('/');
    var itemsNew = [];
    items.forEach(function (item) {
      if (item !== '')
        itemsNew.push(item);
    });
    this.prefix = itemsNew.join('.');
    if (this.prefix !== '')
      this.prefix += '.';
  } else {
    this.prefix = '';
  }

  // Allowed values of [true | false | {j:true} | {w:n, wtimeout:n} | {fsync:true}]
  // The default value is false which means the driver receives does not
  // return the information of the success/error of the insert/update/remove
  if (!('safe' in options)) options.safe = false;

  if (callback) this.once('open', callback);
  this.driver = riak.getClient(options.protocol, options.host, options.port);

  this.driver.ping(function(err) {
    if (err) console.error(err);
    self.emit('open', err);
  });
}

DbRiak.prototype.disconnect = function disconnect (callback) {
  if (callback) process.nextTick(callback);
};

DbRiak.prototype.flush = function flush (cb) {
  if (cb) {
    process.nextTick(function () {
      cb(new Error('flush not yet supported by racer-db-riak, unable to figure out all the buckets to clear.'));
    });
  }
};

// Mutator methods called via CustomDataSource.prototype.applyOps
// DbRiak.prototype.update = function update (collection, conds, op, opts, cb) {
//   this.driver.collection(collection).update(conds, op, opts, cb);
// };

DbRiak.prototype.findAndModify = function findAndModify (collection) {
  var args = Array.prototype.slice.call(arguments, 1);
  var coll = this.driver.bucket(this.prefix + collection);
//  coll.objects.get(
  coll.findAndModify.apply(coll, args);
}

DbRiak.prototype.insert = function insert (collection, json, opts, cb) {
  // TODO Leverage pkey flag; it may not be _id
  var toInsert = Object.create(json);
  toInsert._id || (toInsert._id = new NativeObjectId);
  var coll = this.driver.collection(collection);
  coll.insert(toInsert, opts, function insertCb (err) {
    if (err) return cb(err);
    cb(null, {_id: toInsert._id});
  });
};

DbRiak.prototype.remove = function remove (collection, conds, cb) {
  this.driver.collection(collection).remove(conds, cb);
};

DbRiak.prototype.findOne = function findOne (collection) {
  var args = Array.prototype.slice.call(arguments, 1);
  var coll = this.driver.collection(collection);
  coll.findOne.apply(coll, args);
};

DbRiak.prototype.find = function find (collection, conds, opts, cb) {
  this.driver.collection(collection).find(conds, opts, function findCb (err, cursor) {
    if (err) return cb(err);
    cursor.toArray( function toArrayCb (err, docs) {
      if (err) return cb(err);
      return cb(null, docs);
    });
  });
};

DbRiak.prototype.count = function count (collection, conds, opts, cb) {
  this.driver.collection(collection).count(conds, opts, function findCb (err, count) {
    if (err) return cb(err);
    return cb(null, count);
  });
};

DbRiak.prototype.setVersion = function setVersion (ver) {
  this.version = Math.max(this.version, ver);
};

DbRiak.prototype.setupRoutes = function setupRoutes (store) {
  var adapter = this;

  store.route('get', '*.*.*', -1000, function (collection, id, relPath, done, next) {
    var fields = { _id: 0 };
    if (relPath === 'id') relPath = '_id';
    fields[relPath] = 1;
    adapter.findOne(collection, {_id: id}, fields, function findOneCb (err, doc) {
      if (err) return done(err);
      if (!doc) return done(null, undefined, adapter.version);
      fixId(doc);
      var curr = doc;
      var parts = relPath.split('.');
      for (var i = 0, l = parts.length; i < l; i++) {
        curr = curr[parts[i]];
      }
      done(null, curr, adapter.version);
    });
  });

  store.route('get', '*.*', -1000, function (collection, id, done, next) {
    adapter.findOne(collection, {_id: id}, function findOneCb (err, doc) {
      if (err) return done(err);
      if (!doc) return done(null, undefined, adapter.version);
      fixId(doc);
      done(null, doc, adapter.version);
    });
  });

  store.route('get', '*', -1000, function (collection, done, next) {
    adapter.find(collection, {}, {}, function findCb (err, docList) {
      if (err) return done(err);
      var docs = {}, doc;
      for (var i = docList.length; i--; ) {
        doc = docList[i];
        fixId(doc);
        docs[doc.id] = doc;
      }
      return done(null, docs, adapter.version);
    });
  });

  function createCb (ver, done) {
    return function findAndModifyCb (err, origDoc) {
      if (err) return done(err);
      adapter.setVersion(ver);
      if (origDoc) fixId(origDoc);
      done(null, origDoc);
    };
  }

  function setCb (collection, id, relPath, val, ver, done, next) {
    if (relPath === 'id') relPath = '_id';
    var setTo = {};
    setTo[relPath] = val;
    var op = { $set: setTo };

    // Patch-up implicit creation of arrays in a path, since Mongo
    // will create an object if not already an array
    var cb = /\.[0-9]+(?=\.|$)/.test(relPath) ?
      function (err, origDoc) {
        if (err) return done(err);
        var re = /\.[0-9]+(?=\.|$)/g
          , root;
        while (match = re.exec(relPath)) {
          root = relPath.slice(0, match.index);
          if (lookup(root, origDoc) == null) {
            setCb(collection, id, root, [], ver, function() {
              setCb(collection, id, relPath, val, ver, done, next);
            });
            return;
          }
        }
        createCb(ver, done)(err, origDoc);
      } : createCb(ver, done);

    adapter.findAndModify(collection
      , {_id: id}     // Conditions
      , []             // Empty sort
      , op             // Modification
      , {upsert: true} // If not found, insert the object represented by op
      , cb
    );
  }
  store.route('set', '*.*.*', -1000, setCb);

  store.route('set', '*.*', -1000, function (collection, id, doc, ver, done, next) {
    var findAndModifyCb = createCb(ver, done);

    if (!id) {
      return adapter.insert(collection, doc, cb);
    }

    // Don't use `delete doc.id` so we avoid side-effects in tests
    var docCopy = {};
    for (var k in doc) {
      if (k === 'id') docCopy._id = id
      else docCopy[k] = doc[k];
    }
    adapter.findAndModify(collection, {_id: id}, [], docCopy, {upsert: true}, createCb(ver, done));
  });

  store.route('del', '*.*.*', -1000, function delCb (collection, id, relPath, ver, done, next) {
    if (relPath === 'id') {
      throw new Error('Cannot delete an id');
    }

    var unsetConf = {};
    unsetConf[relPath] = 1;
    var op = { $unset: unsetConf };
    var findAndModifyCb = createCb(ver, done);
    adapter.findAndModify(collection, {_id: id}, [], op, findAndModifyCb);
  });

  store.route('del', '*.*', -1000, function delCb (collection, id, ver, done, next) {
    adapter.findAndModify(collection, {_id: id}, [], {}, {remove: true}, createCb(ver, done));
  });

  function createPushPopFindAndModifyCb (ver, done) {
    return function findAndModifyCb (err, origDoc) {
      if (err) {
        if (/non-array/.test(err.message)) {
          err = new Error('Not an Array');
        }
        if (err) return done(err);
      }
      createCb(ver, done)(err, origDoc);
    }
  }

  // pushCb(collection, id, relPath, vals..., ver, done, next);
  store.route('push', '*.*.*', -1000, function pushCb (collection, id, relPath) {
    var arglen = arguments.length;
    var vals = Array.prototype.slice.call(arguments, 3, arglen-3);
    var ver  = arguments[arglen-3]
    var done = arguments[arglen-2];
    var next = arguments[arglen-1];
    var op = {};
    if (vals.length === 1) (op.$push = {})[relPath] = vals[0];
    else (op.$pushAll = {})[relPath] = vals;

    adapter.findAndModify(collection, {_id: id}, [], op, {upsert: true}, createPushPopFindAndModifyCb(ver, done));
  });

  store.route('pop', '*.*.*', -1000, function popCb (collection, id, relPath, ver, done, next) {
    var popConf = {};
    popConf[relPath] = 1;
    var op = { $pop: popConf };
    adapter.findAndModify(collection, {_id: id}, [], op, {upsert: true}, createPushPopFindAndModifyCb(ver, done));
  });

  function createFindOneCb (collection, id, relPath, ver, done, extra, genNewArray) {
    if (arguments.length === createFindOneCb.length-1) {
      genNewArray = extra;
      extra = null;
    }
    return function cb (err, found) {
      if (err) return done(err);
//      if (!found) {
//        return done(null);
//      }
      var arr = found && found[relPath];
      if (!arr) arr = [];
      if (! Array.isArray(arr)) {
        return done(new Error('Not an Array'));
      }

      arr = genNewArray(arr, extra);

      var setTo = {};
      setTo[relPath] = arr;

      var op = { $set: setTo };

      adapter.findAndModify(collection, {_id: id}, [], op, {upsert: true}, createCb(ver, done));
    };
  }

  // unshiftCb(collection, id, relPath, vals..., ver, done, next);
  store.route('unshift', '*.*.*', -1000, function unshiftCb (collection, id, relPath) {
    var arglen = arguments.length;
    var vals = Array.prototype.slice.call(arguments, 3, arglen-3);
    var ver = arguments[arglen-3];
    var done = arguments[arglen-2];
    var next = arguments[arglen-1];

    var fields = {_id: 0};
    fields[relPath] = 1;
    var cb = createFindOneCb(collection, id, relPath, ver, done, {vals: vals}, function (arr, extra) {
      return extra.vals.concat(arr.slice());
    });
    adapter.findOne(collection, {_id: id}, fields, cb);
  });

  store.route('insert', '*.*.*', -1000, function insertCb (collection, id, relPath, index) {
    var arglen = arguments.length;
    var vals = Array.prototype.slice.call(arguments, 4, arglen-3);
    var ver = arguments[arglen-3];
    var done = arguments[arglen-2];
    var next = arguments[arglen-1];

    var fields = {_id: 0};
    fields[relPath] = 1;
    var cb = createFindOneCb(collection, id, relPath, ver, done, {vals: vals, index: index}, function (arr, extra) {
      var index = extra.index
        , vals = extra.vals;
      return arr.slice(0, index).concat(vals).concat(arr.slice(index));
    });
    adapter.findOne(collection, {_id: id}, fields, cb);
  });

  store.route('shift', '*.*.*', -1000, function shiftCb (collection, id, relPath, ver, done, next) {
    var fields = { _id: 0 };
    fields[relPath] = 1;
    adapter.findOne(collection, {_id: id}, fields, createFindOneCb(collection, id, relPath, ver, done, function (arr) {
      var copy = arr.slice();
      copy.shift();
      return copy;
    }));
  });

  store.route('remove', '*.*.*', -1000, function removeCb (collection, id, relPath, index, count, ver, done, next) {
    var fields = { _id: 0 };
    fields[relPath] = 1;
    adapter.findOne(collection, {_id: id}, fields
      , createFindOneCb(collection, id, relPath, ver, done, {index: index, count: count}, function (arr, extra) {
          var copy = arr.slice();
          var index = extra.index;
          var count = extra.count;
          copy.splice(index, count);
          return copy;
        })
    );
  });

  store.route('move', '*.*.*', -1000, function moveCb (collection, id, relPath, from, to, count, ver, done, next) {
    var fields = { _id: 0 };
    fields[relPath] = 1;
    adapter.findOne(collection, {_id: id}, fields
      , createFindOneCb(collection, id, relPath, ver, done, {to: to, from: from, count: count}, function (arr, extra) {
          var copy = arr.slice();
          var to = extra.to
            , from = extra.from
            , count = extra.count;
          if (to < 0) to += copy.length;
          var values = arr.splice(from, count);
          var args = [to, 0].concat(values);
          arr.splice.apply(arr, args);
          return arr;
        })
    );
  });
};
