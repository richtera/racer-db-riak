/*! Socket.IO.js build:0.9.6, development. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * IO namespace.
   *
   * @namespace
   */

  var io = exports;

  /**
   * Socket.IO version
   *
   * @api public
   */

  io.version = '0.9.6';

  /**
   * Protocol implemented.
   *
   * @api public
   */

  io.protocol = 1;

  /**
   * Available transports, these will be populated with the available transports
   *
   * @api public
   */

  io.transports = [];

  /**
   * Keep track of jsonp callbacks.
   *
   * @api private
   */

  io.j = [];

  /**
   * Keep track of our io.Sockets
   *
   * @api private
   */
  io.sockets = {};


  /**
   * Manages connections to hosts.
   *
   * @param {String} uri
   * @Param {Boolean} force creation of new socket (defaults to false)
   * @api public
   */

  io.connect = function (host, details) {
    var uri = io.util.parseUri(host)
      , uuri
      , socket;

    if (global && global.location) {
      uri.protocol = uri.protocol || global.location.protocol.slice(0, -1);
      uri.host = uri.host || (global.document
        ? global.document.domain : global.location.hostname);
      uri.port = uri.port || global.location.port;
    }

    uuri = io.util.uniqueUri(uri);

    var options = {
        host: uri.host
      , secure: 'https' == uri.protocol
      , port: uri.port || ('https' == uri.protocol ? 443 : 80)
      , query: uri.query || ''
    };

    io.util.merge(options, details);

    if (options['force new connection'] || !io.sockets[uuri]) {
      socket = new io.Socket(options);
    }

    if (!options['force new connection'] && socket) {
      io.sockets[uuri] = socket;
    }

    socket = socket || io.sockets[uuri];

    // if path is different from '' or /
    return socket.of(uri.path.length > 1 ? uri.path : '');
  };

})('object' === typeof module ? module.exports : (this.io = {}), this);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * Utilities namespace.
   *
   * @namespace
   */

  var util = exports.util = {};

  /**
   * Parses an URI
   *
   * @author Steven Levithan <stevenlevithan.com> (MIT license)
   * @api public
   */

  var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

  var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password',
               'host', 'port', 'relative', 'path', 'directory', 'file', 'query',
               'anchor'];

  util.parseUri = function (str) {
    var m = re.exec(str || '')
      , uri = {}
      , i = 14;

    while (i--) {
      uri[parts[i]] = m[i] || '';
    }

    return uri;
  };

  /**
   * Produces a unique url that identifies a Socket.IO connection.
   *
   * @param {Object} uri
   * @api public
   */

  util.uniqueUri = function (uri) {
    var protocol = uri.protocol
      , host = uri.host
      , port = uri.port;

    if ('document' in global) {
      host = host || document.domain;
      port = port || (protocol == 'https'
        && document.location.protocol !== 'https:' ? 443 : document.location.port);
    } else {
      host = host || 'localhost';

      if (!port && protocol == 'https') {
        port = 443;
      }
    }

    return (protocol || 'http') + '://' + host + ':' + (port || 80);
  };

  /**
   * Mergest 2 query strings in to once unique query string
   *
   * @param {String} base
   * @param {String} addition
   * @api public
   */

  util.query = function (base, addition) {
    var query = util.chunkQuery(base || '')
      , components = [];

    util.merge(query, util.chunkQuery(addition || ''));
    for (var part in query) {
      if (query.hasOwnProperty(part)) {
        components.push(part + '=' + query[part]);
      }
    }

    return components.length ? '?' + components.join('&') : '';
  };

  /**
   * Transforms a querystring in to an object
   *
   * @param {String} qs
   * @api public
   */

  util.chunkQuery = function (qs) {
    var query = {}
      , params = qs.split('&')
      , i = 0
      , l = params.length
      , kv;

    for (; i < l; ++i) {
      kv = params[i].split('=');
      if (kv[0]) {
        query[kv[0]] = kv[1];
      }
    }

    return query;
  };

  /**
   * Executes the given function when the page is loaded.
   *
   *     io.util.load(function () { console.log('page loaded'); });
   *
   * @param {Function} fn
   * @api public
   */

  var pageLoaded = false;

  util.load = function (fn) {
    if ('document' in global && document.readyState === 'complete' || pageLoaded) {
      return fn();
    }

    util.on(global, 'load', fn, false);
  };

  /**
   * Adds an event.
   *
   * @api private
   */

  util.on = function (element, event, fn, capture) {
    if (element.attachEvent) {
      element.attachEvent('on' + event, fn);
    } else if (element.addEventListener) {
      element.addEventListener(event, fn, capture);
    }
  };

  /**
   * Generates the correct `XMLHttpRequest` for regular and cross domain requests.
   *
   * @param {Boolean} [xdomain] Create a request that can be used cross domain.
   * @returns {XMLHttpRequest|false} If we can create a XMLHttpRequest.
   * @api private
   */

  util.request = function (xdomain) {

    if (xdomain && 'undefined' != typeof XDomainRequest) {
      return new XDomainRequest();
    }

    if ('undefined' != typeof XMLHttpRequest && (!xdomain || util.ua.hasCORS)) {
      return new XMLHttpRequest();
    }

    if (!xdomain) {
      try {
        return new window[(['Active'].concat('Object').join('X'))]('Microsoft.XMLHTTP');
      } catch(e) { }
    }

    return null;
  };

  /**
   * XHR based transport constructor.
   *
   * @constructor
   * @api public
   */

  /**
   * Change the internal pageLoaded value.
   */

  if ('undefined' != typeof window) {
    util.load(function () {
      pageLoaded = true;
    });
  }

  /**
   * Defers a function to ensure a spinner is not displayed by the browser
   *
   * @param {Function} fn
   * @api public
   */

  util.defer = function (fn) {
    if (!util.ua.webkit || 'undefined' != typeof importScripts) {
      return fn();
    }

    util.load(function () {
      setTimeout(fn, 100);
    });
  };

  /**
   * Merges two objects.
   *
   * @api public
   */
  
  util.merge = function merge (target, additional, deep, lastseen) {
    var seen = lastseen || []
      , depth = typeof deep == 'undefined' ? 2 : deep
      , prop;

    for (prop in additional) {
      if (additional.hasOwnProperty(prop) && util.indexOf(seen, prop) < 0) {
        if (typeof target[prop] !== 'object' || !depth) {
          target[prop] = additional[prop];
          seen.push(additional[prop]);
        } else {
          util.merge(target[prop], additional[prop], depth - 1, seen);
        }
      }
    }

    return target;
  };

  /**
   * Merges prototypes from objects
   *
   * @api public
   */
  
  util.mixin = function (ctor, ctor2) {
    util.merge(ctor.prototype, ctor2.prototype);
  };

  /**
   * Shortcut for prototypical and static inheritance.
   *
   * @api private
   */

  util.inherit = function (ctor, ctor2) {
    function f() {};
    f.prototype = ctor2.prototype;
    ctor.prototype = new f;
  };

  /**
   * Checks if the given object is an Array.
   *
   *     io.util.isArray([]); // true
   *     io.util.isArray({}); // false
   *
   * @param Object obj
   * @api public
   */

  util.isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  /**
   * Intersects values of two arrays into a third
   *
   * @api public
   */

  util.intersect = function (arr, arr2) {
    var ret = []
      , longest = arr.length > arr2.length ? arr : arr2
      , shortest = arr.length > arr2.length ? arr2 : arr;

    for (var i = 0, l = shortest.length; i < l; i++) {
      if (~util.indexOf(longest, shortest[i]))
        ret.push(shortest[i]);
    }

    return ret;
  }

  /**
   * Array indexOf compatibility.
   *
   * @see bit.ly/a5Dxa2
   * @api public
   */

  util.indexOf = function (arr, o, i) {
    
    for (var j = arr.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; 
         i < j && arr[i] !== o; i++) {}

    return j <= i ? -1 : i;
  };

  /**
   * Converts enumerables to array.
   *
   * @api public
   */

  util.toArray = function (enu) {
    var arr = [];

    for (var i = 0, l = enu.length; i < l; i++)
      arr.push(enu[i]);

    return arr;
  };

  /**
   * UA / engines detection namespace.
   *
   * @namespace
   */

  util.ua = {};

  /**
   * Whether the UA supports CORS for XHR.
   *
   * @api public
   */

  util.ua.hasCORS = 'undefined' != typeof XMLHttpRequest && (function () {
    try {
      var a = new XMLHttpRequest();
    } catch (e) {
      return false;
    }

    return a.withCredentials != undefined;
  })();

  /**
   * Detect webkit.
   *
   * @api public
   */

  util.ua.webkit = 'undefined' != typeof navigator
    && /webkit/i.test(navigator.userAgent);

})('undefined' != typeof io ? io : module.exports, this);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.EventEmitter = EventEmitter;

  /**
   * Event emitter constructor.
   *
   * @api public.
   */

  function EventEmitter () {};

  /**
   * Adds a listener
   *
   * @api public
   */

  EventEmitter.prototype.on = function (name, fn) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = fn;
    } else if (io.util.isArray(this.$events[name])) {
      this.$events[name].push(fn);
    } else {
      this.$events[name] = [this.$events[name], fn];
    }

    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  /**
   * Adds a volatile listener.
   *
   * @api public
   */

  EventEmitter.prototype.once = function (name, fn) {
    var self = this;

    function on () {
      self.removeListener(name, on);
      fn.apply(this, arguments);
    };

    on.listener = fn;
    this.on(name, on);

    return this;
  };

  /**
   * Removes a listener.
   *
   * @api public
   */

  EventEmitter.prototype.removeListener = function (name, fn) {
    if (this.$events && this.$events[name]) {
      var list = this.$events[name];

      if (io.util.isArray(list)) {
        var pos = -1;

        for (var i = 0, l = list.length; i < l; i++) {
          if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
            pos = i;
            break;
          }
        }

        if (pos < 0) {
          return this;
        }

        list.splice(pos, 1);

        if (!list.length) {
          delete this.$events[name];
        }
      } else if (list === fn || (list.listener && list.listener === fn)) {
        delete this.$events[name];
      }
    }

    return this;
  };

  /**
   * Removes all listeners for an event.
   *
   * @api public
   */

  EventEmitter.prototype.removeAllListeners = function (name) {
    // TODO: enable this when node 0.5 is stable
    //if (name === undefined) {
      //this.$events = {};
      //return this;
    //}

    if (this.$events && this.$events[name]) {
      this.$events[name] = null;
    }

    return this;
  };

  /**
   * Gets all listeners for a certain event.
   *
   * @api publci
   */

  EventEmitter.prototype.listeners = function (name) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = [];
    }

    if (!io.util.isArray(this.$events[name])) {
      this.$events[name] = [this.$events[name]];
    }

    return this.$events[name];
  };

  /**
   * Emits an event.
   *
   * @api public
   */

  EventEmitter.prototype.emit = function (name) {
    if (!this.$events) {
      return false;
    }

    var handler = this.$events[name];

    if (!handler) {
      return false;
    }

    var args = Array.prototype.slice.call(arguments, 1);

    if ('function' == typeof handler) {
      handler.apply(this, args);
    } else if (io.util.isArray(handler)) {
      var listeners = handler.slice();

      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].apply(this, args);
      }
    } else {
      return false;
    }

    return true;
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Based on JSON2 (http://www.JSON.org/js.html).
 */

(function (exports, nativeJSON) {
  "use strict";

  // use native JSON if it's available
  if (nativeJSON && nativeJSON.parse){
    return exports.JSON = {
      parse: nativeJSON.parse
    , stringify: nativeJSON.stringify
    }
  }

  var JSON = exports.JSON = {};

  function f(n) {
      // Format integers to have at least two digits.
      return n < 10 ? '0' + n : n;
  }

  function date(d, key) {
    return isFinite(d.valueOf()) ?
        d.getUTCFullYear()     + '-' +
        f(d.getUTCMonth() + 1) + '-' +
        f(d.getUTCDate())      + 'T' +
        f(d.getUTCHours())     + ':' +
        f(d.getUTCMinutes())   + ':' +
        f(d.getUTCSeconds())   + 'Z' : null;
  };

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      gap,
      indent,
      meta = {    // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"' : '\\"',
          '\\': '\\\\'
      },
      rep;


  function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

      escapable.lastIndex = 0;
      return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
          var c = meta[a];
          return typeof c === 'string' ? c :
              '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) + '"' : '"' + string + '"';
  }


  function str(key, holder) {

// Produce a string from holder[key].

      var i,          // The loop counter.
          k,          // The member key.
          v,          // The member value.
          length,
          mind = gap,
          partial,
          value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

      if (value instanceof Date) {
          value = date(key);
      }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

      if (typeof rep === 'function') {
          value = rep.call(holder, key, value);
      }

// What happens next depends on the value's type.

      switch (typeof value) {
      case 'string':
          return quote(value);

      case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

          return isFinite(value) ? String(value) : 'null';

      case 'boolean':
      case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

          return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

      case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

          if (!value) {
              return 'null';
          }

// Make an array to hold the partial results of stringifying this object value.

          gap += indent;
          partial = [];

// Is the value an array?

          if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

              length = value.length;
              for (i = 0; i < length; i += 1) {
                  partial[i] = str(i, value) || 'null';
              }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

              v = partial.length === 0 ? '[]' : gap ?
                  '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                  '[' + partial.join(',') + ']';
              gap = mind;
              return v;
          }

// If the replacer is an array, use it to select the members to be stringified.

          if (rep && typeof rep === 'object') {
              length = rep.length;
              for (i = 0; i < length; i += 1) {
                  if (typeof rep[i] === 'string') {
                      k = rep[i];
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          } else {

// Otherwise, iterate through all of the keys in the object.

              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

          v = partial.length === 0 ? '{}' : gap ?
              '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
              '{' + partial.join(',') + '}';
          gap = mind;
          return v;
      }
  }

// If the JSON object does not yet have a stringify method, give it one.

  JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

      var i;
      gap = '';
      indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

      if (typeof space === 'number') {
          for (i = 0; i < space; i += 1) {
              indent += ' ';
          }

// If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === 'string') {
          indent = space;
      }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
              (typeof replacer !== 'object' ||
              typeof replacer.length !== 'number')) {
          throw new Error('JSON.stringify');
      }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

      return str('', {'': value});
  };

// If the JSON object does not yet have a parse method, give it one.

  JSON.parse = function (text, reviver) {
  // The parse method takes a text and an optional reviver function, and returns
  // a JavaScript value if the text is a valid JSON text.

      var j;

      function walk(holder, key) {

  // The walk method is used to recursively walk the resulting structure so
  // that modifications can be made.

          var k, v, value = holder[key];
          if (value && typeof value === 'object') {
              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = walk(value, k);
                      if (v !== undefined) {
                          value[k] = v;
                      } else {
                          delete value[k];
                      }
                  }
              }
          }
          return reviver.call(holder, key, value);
      }


  // Parsing happens in four stages. In the first stage, we replace certain
  // Unicode characters with escape sequences. JavaScript handles many characters
  // incorrectly, either silently deleting them, or treating them as line endings.

      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
          text = text.replace(cx, function (a) {
              return '\\u' +
                  ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          });
      }

  // In the second stage, we run the text against regular expressions that look
  // for non-JSON patterns. We are especially concerned with '()' and 'new'
  // because they can cause invocation, and '=' because it can cause mutation.
  // But just to be safe, we want to reject all unexpected forms.

  // We split the second stage into 4 regexp operations in order to work around
  // crippling inefficiencies in IE's and Safari's regexp engines. First we
  // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
  // replace all simple value tokens with ']' characters. Third, we delete all
  // open brackets that follow a colon or comma or that begin the text. Finally,
  // we look to see that the remaining characters are only whitespace or ']' or
  // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

      if (/^[\],:{}\s]*$/
              .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                  .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                  .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

  // In the third stage we use the eval function to compile the text into a
  // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
  // in JavaScript: it can begin a block or an object literal. We wrap the text
  // in parens to eliminate the ambiguity.

          j = eval('(' + text + ')');

  // In the optional fourth stage, we recursively walk the new structure, passing
  // each name/value pair to a reviver function for possible transformation.

          return typeof reviver === 'function' ?
              walk({'': j}, '') : j;
      }

  // If the text is not JSON parseable, then a SyntaxError is thrown.

      throw new SyntaxError('JSON.parse');
  };

})(
    'undefined' != typeof io ? io : module.exports
  , typeof JSON !== 'undefined' ? JSON : undefined
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Parser namespace.
   *
   * @namespace
   */

  var parser = exports.parser = {};

  /**
   * Packet types.
   */

  var packets = parser.packets = [
      'disconnect'
    , 'connect'
    , 'heartbeat'
    , 'message'
    , 'json'
    , 'event'
    , 'ack'
    , 'error'
    , 'noop'
  ];

  /**
   * Errors reasons.
   */

  var reasons = parser.reasons = [
      'transport not supported'
    , 'client not handshaken'
    , 'unauthorized'
  ];

  /**
   * Errors advice.
   */

  var advice = parser.advice = [
      'reconnect'
  ];

  /**
   * Shortcuts.
   */

  var JSON = io.JSON
    , indexOf = io.util.indexOf;

  /**
   * Encodes a packet.
   *
   * @api private
   */

  parser.encodePacket = function (packet) {
    var type = indexOf(packets, packet.type)
      , id = packet.id || ''
      , endpoint = packet.endpoint || ''
      , ack = packet.ack
      , data = null;

    switch (packet.type) {
      case 'error':
        var reason = packet.reason ? indexOf(reasons, packet.reason) : ''
          , adv = packet.advice ? indexOf(advice, packet.advice) : '';

        if (reason !== '' || adv !== '')
          data = reason + (adv !== '' ? ('+' + adv) : '');

        break;

      case 'message':
        if (packet.data !== '')
          data = packet.data;
        break;

      case 'event':
        var ev = { name: packet.name };

        if (packet.args && packet.args.length) {
          ev.args = packet.args;
        }

        data = JSON.stringify(ev);
        break;

      case 'json':
        data = JSON.stringify(packet.data);
        break;

      case 'connect':
        if (packet.qs)
          data = packet.qs;
        break;

      case 'ack':
        data = packet.ackId
          + (packet.args && packet.args.length
              ? '+' + JSON.stringify(packet.args) : '');
        break;
    }

    // construct packet with required fragments
    var encoded = [
        type
      , id + (ack == 'data' ? '+' : '')
      , endpoint
    ];

    // data fragment is optional
    if (data !== null && data !== undefined)
      encoded.push(data);

    return encoded.join(':');
  };

  /**
   * Encodes multiple messages (payload).
   *
   * @param {Array} messages
   * @api private
   */

  parser.encodePayload = function (packets) {
    var decoded = '';

    if (packets.length == 1)
      return packets[0];

    for (var i = 0, l = packets.length; i < l; i++) {
      var packet = packets[i];
      decoded += '\ufffd' + packet.length + '\ufffd' + packets[i];
    }

    return decoded;
  };

  /**
   * Decodes a packet
   *
   * @api private
   */

  var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;

  parser.decodePacket = function (data) {
    var pieces = data.match(regexp);

    if (!pieces) return {};

    var id = pieces[2] || ''
      , data = pieces[5] || ''
      , packet = {
            type: packets[pieces[1]]
          , endpoint: pieces[4] || ''
        };

    // whether we need to acknowledge the packet
    if (id) {
      packet.id = id;
      if (pieces[3])
        packet.ack = 'data';
      else
        packet.ack = true;
    }

    // handle different packet types
    switch (packet.type) {
      case 'error':
        var pieces = data.split('+');
        packet.reason = reasons[pieces[0]] || '';
        packet.advice = advice[pieces[1]] || '';
        break;

      case 'message':
        packet.data = data || '';
        break;

      case 'event':
        try {
          var opts = JSON.parse(data);
          packet.name = opts.name;
          packet.args = opts.args;
        } catch (e) { }

        packet.args = packet.args || [];
        break;

      case 'json':
        try {
          packet.data = JSON.parse(data);
        } catch (e) { }
        break;

      case 'connect':
        packet.qs = data || '';
        break;

      case 'ack':
        var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
        if (pieces) {
          packet.ackId = pieces[1];
          packet.args = [];

          if (pieces[3]) {
            try {
              packet.args = pieces[3] ? JSON.parse(pieces[3]) : [];
            } catch (e) { }
          }
        }
        break;

      case 'disconnect':
      case 'heartbeat':
        break;
    };

    return packet;
  };

  /**
   * Decodes data payload. Detects multiple messages
   *
   * @return {Array} messages
   * @api public
   */

  parser.decodePayload = function (data) {
    // IE doesn't like data[i] for unicode chars, charAt works fine
    if (data.charAt(0) == '\ufffd') {
      var ret = [];

      for (var i = 1, length = ''; i < data.length; i++) {
        if (data.charAt(i) == '\ufffd') {
          ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
          i += Number(length) + 1;
          length = '';
        } else {
          length += data.charAt(i);
        }
      }

      return ret;
    } else {
      return [parser.decodePacket(data)];
    }
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.Transport = Transport;

  /**
   * This is the transport template for all supported transport methods.
   *
   * @constructor
   * @api public
   */

  function Transport (socket, sessid) {
    this.socket = socket;
    this.sessid = sessid;
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Transport, io.EventEmitter);

  /**
   * Handles the response from the server. When a new response is received
   * it will automatically update the timeout, decode the message and
   * forwards the response to the onMessage function for further processing.
   *
   * @param {String} data Response from the server.
   * @api private
   */

  Transport.prototype.onData = function (data) {
    this.clearCloseTimeout();
    
    // If the connection in currently open (or in a reopening state) reset the close 
    // timeout since we have just received data. This check is necessary so
    // that we don't reset the timeout on an explicitly disconnected connection.
    if (this.socket.connected || this.socket.connecting || this.socket.reconnecting) {
      this.setCloseTimeout();
    }

    if (data !== '') {
      // todo: we should only do decodePayload for xhr transports
      var msgs = io.parser.decodePayload(data);

      if (msgs && msgs.length) {
        for (var i = 0, l = msgs.length; i < l; i++) {
          this.onPacket(msgs[i]);
        }
      }
    }

    return this;
  };

  /**
   * Handles packets.
   *
   * @api private
   */

  Transport.prototype.onPacket = function (packet) {
    this.socket.setHeartbeatTimeout();

    if (packet.type == 'heartbeat') {
      return this.onHeartbeat();
    }

    if (packet.type == 'connect' && packet.endpoint == '') {
      this.onConnect();
    }

    if (packet.type == 'error' && packet.advice == 'reconnect') {
      this.open = false;
    }

    this.socket.onPacket(packet);

    return this;
  };

  /**
   * Sets close timeout
   *
   * @api private
   */
  
  Transport.prototype.setCloseTimeout = function () {
    if (!this.closeTimeout) {
      var self = this;

      this.closeTimeout = setTimeout(function () {
        self.onDisconnect();
      }, this.socket.closeTimeout);
    }
  };

  /**
   * Called when transport disconnects.
   *
   * @api private
   */

  Transport.prototype.onDisconnect = function () {
    if (this.close && this.open) this.close();
    this.clearTimeouts();
    this.socket.onDisconnect();
    return this;
  };

  /**
   * Called when transport connects
   *
   * @api private
   */

  Transport.prototype.onConnect = function () {
    this.socket.onConnect();
    return this;
  }

  /**
   * Clears close timeout
   *
   * @api private
   */

  Transport.prototype.clearCloseTimeout = function () {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  };

  /**
   * Clear timeouts
   *
   * @api private
   */

  Transport.prototype.clearTimeouts = function () {
    this.clearCloseTimeout();

    if (this.reopenTimeout) {
      clearTimeout(this.reopenTimeout);
    }
  };

  /**
   * Sends a packet
   *
   * @param {Object} packet object.
   * @api private
   */

  Transport.prototype.packet = function (packet) {
    this.send(io.parser.encodePacket(packet));
  };

  /**
   * Send the received heartbeat message back to server. So the server
   * knows we are still connected.
   *
   * @param {String} heartbeat Heartbeat response from the server.
   * @api private
   */

  Transport.prototype.onHeartbeat = function (heartbeat) {
    this.packet({ type: 'heartbeat' });
  };
 
  /**
   * Called when the transport opens.
   *
   * @api private
   */

  Transport.prototype.onOpen = function () {
    this.open = true;
    this.clearCloseTimeout();
    this.socket.onOpen();
  };

  /**
   * Notifies the base when the connection with the Socket.IO server
   * has been disconnected.
   *
   * @api private
   */

  Transport.prototype.onClose = function () {
    var self = this;

    /* FIXME: reopen delay causing a infinit loop
    this.reopenTimeout = setTimeout(function () {
      self.open();
    }, this.socket.options['reopen delay']);*/

    this.open = false;
    this.socket.onClose();
    this.onDisconnect();
  };

  /**
   * Generates a connection url based on the Socket.IO URL Protocol.
   * See <https://github.com/learnboost/socket.io-node/> for more details.
   *
   * @returns {String} Connection url
   * @api private
   */

  Transport.prototype.prepareUrl = function () {
    var options = this.socket.options;

    return this.scheme() + '://'
      + options.host + ':' + options.port + '/'
      + options.resource + '/' + io.protocol
      + '/' + this.name + '/' + this.sessid;
  };

  /**
   * Checks if the transport is ready to start a connection.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  Transport.prototype.ready = function (socket, fn) {
    fn.call(this);
  };
})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.Socket = Socket;

  /**
   * Create a new `Socket.IO client` which can establish a persistent
   * connection with a Socket.IO enabled server.
   *
   * @api public
   */

  function Socket (options) {
    this.options = {
        port: 80
      , secure: false
      , document: 'document' in global ? document : false
      , resource: 'socket.io'
      , transports: io.transports
      , 'connect timeout': 10000
      , 'try multiple transports': true
      , 'reconnect': true
      , 'reconnection delay': 500
      , 'reconnection limit': Infinity
      , 'reopen delay': 3000
      , 'max reconnection attempts': 10
      , 'sync disconnect on unload': true
      , 'auto connect': true
      , 'flash policy port': 10843
    };

    io.util.merge(this.options, options);

    this.connected = false;
    this.open = false;
    this.connecting = false;
    this.reconnecting = false;
    this.namespaces = {};
    this.buffer = [];
    this.doBuffer = false;

    if (this.options['sync disconnect on unload'] &&
        (!this.isXDomain() || io.util.ua.hasCORS)) {
      var self = this;

      io.util.on(global, 'unload', function () {
        self.disconnectSync();
      }, false);
    }

    if (this.options['auto connect']) {
      this.connect();
    }
};

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Socket, io.EventEmitter);

  /**
   * Returns a namespace listener/emitter for this socket
   *
   * @api public
   */

  Socket.prototype.of = function (name) {
    if (!this.namespaces[name]) {
      this.namespaces[name] = new io.SocketNamespace(this, name);

      if (name !== '') {
        this.namespaces[name].packet({ type: 'connect' });
      }
    }

    return this.namespaces[name];
  };

  /**
   * Emits the given event to the Socket and all namespaces
   *
   * @api private
   */

  Socket.prototype.publish = function () {
    this.emit.apply(this, arguments);

    var nsp;

    for (var i in this.namespaces) {
      if (this.namespaces.hasOwnProperty(i)) {
        nsp = this.of(i);
        nsp.$emit.apply(nsp, arguments);
      }
    }
  };

  /**
   * Performs the handshake
   *
   * @api private
   */

  function empty () { };

  Socket.prototype.handshake = function (fn) {
    var self = this
      , options = this.options;

    function complete (data) {
      if (data instanceof Error) {
        self.onError(data.message);
      } else {
        fn.apply(null, data.split(':'));
      }
    };

    var url = [
          'http' + (options.secure ? 's' : '') + ':/'
        , options.host + ':' + options.port
        , options.resource
        , io.protocol
        , io.util.query(this.options.query, 't=' + +new Date)
      ].join('/');

    if (this.isXDomain() && !io.util.ua.hasCORS) {
      var insertAt = document.getElementsByTagName('script')[0]
        , script = document.createElement('script');

      script.src = url + '&jsonp=' + io.j.length;
      insertAt.parentNode.insertBefore(script, insertAt);

      io.j.push(function (data) {
        complete(data);
        script.parentNode.removeChild(script);
      });
    } else {
      var xhr = io.util.request();

      xhr.open('GET', url, true);
      xhr.withCredentials = true;
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = empty;

          if (xhr.status == 200) {
            complete(xhr.responseText);
          } else {
            !self.reconnecting && self.onError(xhr.responseText);
          }
        }
      };
      xhr.send(null);
    }
  };

  /**
   * Find an available transport based on the options supplied in the constructor.
   *
   * @api private
   */

  Socket.prototype.getTransport = function (override) {
    var transports = override || this.transports, match;

    for (var i = 0, transport; transport = transports[i]; i++) {
      if (io.Transport[transport]
        && io.Transport[transport].check(this)
        && (!this.isXDomain() || io.Transport[transport].xdomainCheck())) {
        return new io.Transport[transport](this, this.sessionid);
      }
    }

    return null;
  };

  /**
   * Connects to the server.
   *
   * @param {Function} [fn] Callback.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.connect = function (fn) {
    if (this.connecting) {
      return this;
    }

    var self = this;

    this.handshake(function (sid, heartbeat, close, transports) {
      self.sessionid = sid;
      self.closeTimeout = close * 1000;
      self.heartbeatTimeout = heartbeat * 1000;
      self.transports = transports ? io.util.intersect(
          transports.split(',')
        , self.options.transports
      ) : self.options.transports;

      self.setHeartbeatTimeout();

      function connect (transports){
        if (self.transport) self.transport.clearTimeouts();

        self.transport = self.getTransport(transports);
        if (!self.transport) return self.publish('connect_failed');

        // once the transport is ready
        self.transport.ready(self, function () {
          self.connecting = true;
          self.publish('connecting', self.transport.name);
          self.transport.open();

          if (self.options['connect timeout']) {
            self.connectTimeoutTimer = setTimeout(function () {
              if (!self.connected) {
                self.connecting = false;

                if (self.options['try multiple transports']) {
                  if (!self.remainingTransports) {
                    self.remainingTransports = self.transports.slice(0);
                  }

                  var remaining = self.remainingTransports;

                  while (remaining.length > 0 && remaining.splice(0,1)[0] !=
                         self.transport.name) {}

                    if (remaining.length){
                      connect(remaining);
                    } else {
                      self.publish('connect_failed');
                    }
                }
              }
            }, self.options['connect timeout']);
          }
        });
      }

      connect(self.transports);

      self.once('connect', function (){
        clearTimeout(self.connectTimeoutTimer);

        fn && typeof fn == 'function' && fn();
      });
    });

    return this;
  };

  /**
   * Clears and sets a new heartbeat timeout using the value given by the
   * server during the handshake.
   *
   * @api private
   */

  Socket.prototype.setHeartbeatTimeout = function () {
    clearTimeout(this.heartbeatTimeoutTimer);

    var self = this;
    this.heartbeatTimeoutTimer = setTimeout(function () {
      self.transport.onClose();
    }, this.heartbeatTimeout);
  };

  /**
   * Sends a message.
   *
   * @param {Object} data packet.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.packet = function (data) {
    if (this.connected && !this.doBuffer) {
      this.transport.packet(data);
    } else {
      this.buffer.push(data);
    }

    return this;
  };

  /**
   * Sets buffer state
   *
   * @api private
   */

  Socket.prototype.setBuffer = function (v) {
    this.doBuffer = v;

    if (!v && this.connected && this.buffer.length) {
      this.transport.payload(this.buffer);
      this.buffer = [];
    }
  };

  /**
   * Disconnect the established connect.
   *
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.disconnect = function () {
    if (this.connected || this.connecting) {
      if (this.open) {
        this.of('').packet({ type: 'disconnect' });
      }

      // handle disconnection immediately
      this.onDisconnect('booted');
    }

    return this;
  };

  /**
   * Disconnects the socket with a sync XHR.
   *
   * @api private
   */

  Socket.prototype.disconnectSync = function () {
    // ensure disconnection
    var xhr = io.util.request()
      , uri = this.resource + '/' + io.protocol + '/' + this.sessionid;

    xhr.open('GET', uri, true);

    // handle disconnection immediately
    this.onDisconnect('booted');
  };

  /**
   * Check if we need to use cross domain enabled transports. Cross domain would
   * be a different port or different domain name.
   *
   * @returns {Boolean}
   * @api private
   */

  Socket.prototype.isXDomain = function () {

    var port = global.location.port ||
      ('https:' == global.location.protocol ? 443 : 80);

    return this.options.host !== global.location.hostname 
      || this.options.port != port;
  };

  /**
   * Called upon handshake.
   *
   * @api private
   */

  Socket.prototype.onConnect = function () {
    if (!this.connected) {
      this.connected = true;
      this.connecting = false;
      if (!this.doBuffer) {
        // make sure to flush the buffer
        this.setBuffer(false);
      }
      this.emit('connect');
    }
  };

  /**
   * Called when the transport opens
   *
   * @api private
   */

  Socket.prototype.onOpen = function () {
    this.open = true;
  };

  /**
   * Called when the transport closes.
   *
   * @api private
   */

  Socket.prototype.onClose = function () {
    this.open = false;
    clearTimeout(this.heartbeatTimeoutTimer);
  };

  /**
   * Called when the transport first opens a connection
   *
   * @param text
   */

  Socket.prototype.onPacket = function (packet) {
    this.of(packet.endpoint).onPacket(packet);
  };

  /**
   * Handles an error.
   *
   * @api private
   */

  Socket.prototype.onError = function (err) {
    if (err && err.advice) {
      if (err.advice === 'reconnect' && (this.connected || this.connecting)) {
        this.disconnect();
        if (this.options.reconnect) {
          this.reconnect();
        }
      }
    }

    this.publish('error', err && err.reason ? err.reason : err);
  };

  /**
   * Called when the transport disconnects.
   *
   * @api private
   */

  Socket.prototype.onDisconnect = function (reason) {
    var wasConnected = this.connected
      , wasConnecting = this.connecting;

    this.connected = false;
    this.connecting = false;
    this.open = false;

    if (wasConnected || wasConnecting) {
      this.transport.close();
      this.transport.clearTimeouts();
      if (wasConnected) {
        this.publish('disconnect', reason);

        if ('booted' != reason && this.options.reconnect && !this.reconnecting) {
          this.reconnect();
        }
      }
    }
  };

  /**
   * Called upon reconnection.
   *
   * @api private
   */

  Socket.prototype.reconnect = function () {
    this.reconnecting = true;
    this.reconnectionAttempts = 0;
    this.reconnectionDelay = this.options['reconnection delay'];

    var self = this
      , maxAttempts = this.options['max reconnection attempts']
      , tryMultiple = this.options['try multiple transports']
      , limit = this.options['reconnection limit'];

    function reset () {
      if (self.connected) {
        for (var i in self.namespaces) {
          if (self.namespaces.hasOwnProperty(i) && '' !== i) {
              self.namespaces[i].packet({ type: 'connect' });
          }
        }
        self.publish('reconnect', self.transport.name, self.reconnectionAttempts);
      }

      clearTimeout(self.reconnectionTimer);

      self.removeListener('connect_failed', maybeReconnect);
      self.removeListener('connect', maybeReconnect);

      self.reconnecting = false;

      delete self.reconnectionAttempts;
      delete self.reconnectionDelay;
      delete self.reconnectionTimer;
      delete self.redoTransports;

      self.options['try multiple transports'] = tryMultiple;
    };

    function maybeReconnect () {
      if (!self.reconnecting) {
        return;
      }

      if (self.connected) {
        return reset();
      };

      if (self.connecting && self.reconnecting) {
        return self.reconnectionTimer = setTimeout(maybeReconnect, 1000);
      }

      if (self.reconnectionAttempts++ >= maxAttempts) {
        if (!self.redoTransports) {
          self.on('connect_failed', maybeReconnect);
          self.options['try multiple transports'] = true;
          self.transport = self.getTransport();
          self.redoTransports = true;
          self.connect();
        } else {
          self.publish('reconnect_failed');
          reset();
        }
      } else {
        if (self.reconnectionDelay < limit) {
          self.reconnectionDelay *= 2; // exponential back off
        }

        self.connect();
        self.publish('reconnecting', self.reconnectionDelay, self.reconnectionAttempts);
        self.reconnectionTimer = setTimeout(maybeReconnect, self.reconnectionDelay);
      }
    };

    this.options['try multiple transports'] = false;
    this.reconnectionTimer = setTimeout(maybeReconnect, this.reconnectionDelay);

    this.on('connect', maybeReconnect);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.SocketNamespace = SocketNamespace;

  /**
   * Socket namespace constructor.
   *
   * @constructor
   * @api public
   */

  function SocketNamespace (socket, name) {
    this.socket = socket;
    this.name = name || '';
    this.flags = {};
    this.json = new Flag(this, 'json');
    this.ackPackets = 0;
    this.acks = {};
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(SocketNamespace, io.EventEmitter);

  /**
   * Copies emit since we override it
   *
   * @api private
   */

  SocketNamespace.prototype.$emit = io.EventEmitter.prototype.emit;

  /**
   * Creates a new namespace, by proxying the request to the socket. This
   * allows us to use the synax as we do on the server.
   *
   * @api public
   */

  SocketNamespace.prototype.of = function () {
    return this.socket.of.apply(this.socket, arguments);
  };

  /**
   * Sends a packet.
   *
   * @api private
   */

  SocketNamespace.prototype.packet = function (packet) {
    packet.endpoint = this.name;
    this.socket.packet(packet);
    this.flags = {};
    return this;
  };

  /**
   * Sends a message
   *
   * @api public
   */

  SocketNamespace.prototype.send = function (data, fn) {
    var packet = {
        type: this.flags.json ? 'json' : 'message'
      , data: data
    };

    if ('function' == typeof fn) {
      packet.id = ++this.ackPackets;
      packet.ack = true;
      this.acks[packet.id] = fn;
    }

    return this.packet(packet);
  };

  /**
   * Emits an event
   *
   * @api public
   */
  
  SocketNamespace.prototype.emit = function (name) {
    var args = Array.prototype.slice.call(arguments, 1)
      , lastArg = args[args.length - 1]
      , packet = {
            type: 'event'
          , name: name
        };

    if ('function' == typeof lastArg) {
      packet.id = ++this.ackPackets;
      packet.ack = 'data';
      this.acks[packet.id] = lastArg;
      args = args.slice(0, args.length - 1);
    }

    packet.args = args;

    return this.packet(packet);
  };

  /**
   * Disconnects the namespace
   *
   * @api private
   */

  SocketNamespace.prototype.disconnect = function () {
    if (this.name === '') {
      this.socket.disconnect();
    } else {
      this.packet({ type: 'disconnect' });
      this.$emit('disconnect');
    }

    return this;
  };

  /**
   * Handles a packet
   *
   * @api private
   */

  SocketNamespace.prototype.onPacket = function (packet) {
    var self = this;

    function ack () {
      self.packet({
          type: 'ack'
        , args: io.util.toArray(arguments)
        , ackId: packet.id
      });
    };

    switch (packet.type) {
      case 'connect':
        this.$emit('connect');
        break;

      case 'disconnect':
        if (this.name === '') {
          this.socket.onDisconnect(packet.reason || 'booted');
        } else {
          this.$emit('disconnect', packet.reason);
        }
        break;

      case 'message':
      case 'json':
        var params = ['message', packet.data];

        if (packet.ack == 'data') {
          params.push(ack);
        } else if (packet.ack) {
          this.packet({ type: 'ack', ackId: packet.id });
        }

        this.$emit.apply(this, params);
        break;

      case 'event':
        var params = [packet.name].concat(packet.args);

        if (packet.ack == 'data')
          params.push(ack);

        this.$emit.apply(this, params);
        break;

      case 'ack':
        if (this.acks[packet.ackId]) {
          this.acks[packet.ackId].apply(this, packet.args);
          delete this.acks[packet.ackId];
        }
        break;

      case 'error':
        if (packet.advice){
          this.socket.onError(packet);
        } else {
          if (packet.reason == 'unauthorized') {
            this.$emit('connect_failed', packet.reason);
          } else {
            this.$emit('error', packet.reason);
          }
        }
        break;
    }
  };

  /**
   * Flag interface.
   *
   * @api private
   */

  function Flag (nsp, name) {
    this.namespace = nsp;
    this.name = name;
  };

  /**
   * Send a message
   *
   * @api public
   */

  Flag.prototype.send = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.send.apply(this.namespace, arguments);
  };

  /**
   * Emit an event
   *
   * @api public
   */

  Flag.prototype.emit = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.emit.apply(this.namespace, arguments);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.websocket = WS;

  /**
   * The WebSocket transport uses the HTML5 WebSocket API to establish an
   * persistent connection with the Socket.IO server. This transport will also
   * be inherited by the FlashSocket fallback as it provides a API compatible
   * polyfill for the WebSockets.
   *
   * @constructor
   * @extends {io.Transport}
   * @api public
   */

  function WS (socket) {
    io.Transport.apply(this, arguments);
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(WS, io.Transport);

  /**
   * Transport name
   *
   * @api public
   */

  WS.prototype.name = 'websocket';

  /**
   * Initializes a new `WebSocket` connection with the Socket.IO server. We attach
   * all the appropriate listeners to handle the responses from the server.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.open = function () {
    var query = io.util.query(this.socket.options.query)
      , self = this
      , Socket


    if (!Socket) {
      Socket = global.MozWebSocket || global.WebSocket;
    }

    this.websocket = new Socket(this.prepareUrl() + query);

    this.websocket.onopen = function () {
      self.onOpen();
      self.socket.setBuffer(false);
    };
    this.websocket.onmessage = function (ev) {
      self.onData(ev.data);
    };
    this.websocket.onclose = function () {
      self.onClose();
      self.socket.setBuffer(true);
    };
    this.websocket.onerror = function (e) {
      self.onError(e);
    };

    return this;
  };

  /**
   * Send a message to the Socket.IO server. The message will automatically be
   * encoded in the correct message format.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.send = function (data) {
    this.websocket.send(data);
    return this;
  };

  /**
   * Payload
   *
   * @api private
   */

  WS.prototype.payload = function (arr) {
    for (var i = 0, l = arr.length; i < l; i++) {
      this.packet(arr[i]);
    }
    return this;
  };

  /**
   * Disconnect the established `WebSocket` connection.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.close = function () {
    this.websocket.close();
    return this;
  };

  /**
   * Handle the errors that `WebSocket` might be giving when we
   * are attempting to connect or send messages.
   *
   * @param {Error} e The error.
   * @api private
   */

  WS.prototype.onError = function (e) {
    this.socket.onError(e);
  };

  /**
   * Returns the appropriate scheme for the URI generation.
   *
   * @api private
   */
  WS.prototype.scheme = function () {
    return this.socket.options.secure ? 'wss' : 'ws';
  };

  /**
   * Checks if the browser has support for native `WebSockets` and that
   * it's not the polyfill created for the FlashSocket transport.
   *
   * @return {Boolean}
   * @api public
   */

  WS.check = function () {
    return ('WebSocket' in global && !('__addTask' in WebSocket))
          || 'MozWebSocket' in global;
  };

  /**
   * Check if the `WebSocket` transport support cross domain communications.
   *
   * @returns {Boolean}
   * @api public
   */

  WS.xdomainCheck = function () {
    return true;
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('websocket');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   *
   * @api public
   */

  exports.XHR = XHR;

  /**
   * XHR constructor
   *
   * @costructor
   * @api public
   */

  function XHR (socket) {
    if (!socket) return;

    io.Transport.apply(this, arguments);
    this.sendBuffer = [];
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(XHR, io.Transport);

  /**
   * Establish a connection
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.open = function () {
    this.socket.setBuffer(false);
    this.onOpen();
    this.get();

    // we need to make sure the request succeeds since we have no indication
    // whether the request opened or not until it succeeded.
    this.setCloseTimeout();

    return this;
  };

  /**
   * Check if we need to send data to the Socket.IO server, if we have data in our
   * buffer we encode it and forward it to the `post` method.
   *
   * @api private
   */

  XHR.prototype.payload = function (payload) {
    var msgs = [];

    for (var i = 0, l = payload.length; i < l; i++) {
      msgs.push(io.parser.encodePacket(payload[i]));
    }

    this.send(io.parser.encodePayload(msgs));
  };

  /**
   * Send data to the Socket.IO server.
   *
   * @param data The message
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.send = function (data) {
    this.post(data);
    return this;
  };

  /**
   * Posts a encoded message to the Socket.IO server.
   *
   * @param {String} data A encoded message.
   * @api private
   */

  function empty () { };

  XHR.prototype.post = function (data) {
    var self = this;
    this.socket.setBuffer(true);

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;
        self.posting = false;

        if (this.status == 200){
          self.socket.setBuffer(false);
        } else {
          self.onClose();
        }
      }
    }

    function onload () {
      this.onload = empty;
      self.socket.setBuffer(false);
    };

    this.sendXHR = this.request('POST');

    if (global.XDomainRequest && this.sendXHR instanceof XDomainRequest) {
      this.sendXHR.onload = this.sendXHR.onerror = onload;
    } else {
      this.sendXHR.onreadystatechange = stateChange;
    }

    this.sendXHR.send(data);
  };

  /**
   * Disconnects the established `XHR` connection.
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.close = function () {
    this.onClose();
    return this;
  };

  /**
   * Generates a configured XHR request
   *
   * @param {String} url The url that needs to be requested.
   * @param {String} method The method the request should use.
   * @returns {XMLHttpRequest}
   * @api private
   */

  XHR.prototype.request = function (method) {
    var req = io.util.request(this.socket.isXDomain())
      , query = io.util.query(this.socket.options.query, 't=' + +new Date);

    req.open(method || 'GET', this.prepareUrl() + query, true);

    if (method == 'POST') {
      try {
        if (req.setRequestHeader) {
          req.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        } else {
          // XDomainRequest
          req.contentType = 'text/plain';
        }
      } catch (e) {}
    }

    return req;
  };

  /**
   * Returns the scheme to use for the transport URLs.
   *
   * @api private
   */

  XHR.prototype.scheme = function () {
    return this.socket.options.secure ? 'https' : 'http';
  };

  /**
   * Check if the XHR transports are supported
   *
   * @param {Boolean} xdomain Check if we support cross domain requests.
   * @returns {Boolean}
   * @api public
   */

  XHR.check = function (socket, xdomain) {
    try {
      var request = io.util.request(xdomain),
          usesXDomReq = (global.XDomainRequest && request instanceof XDomainRequest),
          socketProtocol = (socket && socket.options && socket.options.secure ? 'https:' : 'http:'),
          isXProtocol = (socketProtocol != global.location.protocol);
      if (request && !(usesXDomReq && isXProtocol)) {
        return true;
      }
    } catch(e) {}

    return false;
  };

  /**
   * Check if the XHR transport supports cross domain requests.
   *
   * @returns {Boolean}
   * @api public
   */

  XHR.xdomainCheck = function () {
    return XHR.check(null, true);
  };

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports['xhr-polling'] = XHRPolling;

  /**
   * The XHR-polling transport uses long polling XHR requests to create a
   * "persistent" connection with the server.
   *
   * @constructor
   * @api public
   */

  function XHRPolling () {
    io.Transport.XHR.apply(this, arguments);
  };

  /**
   * Inherits from XHR transport.
   */

  io.util.inherit(XHRPolling, io.Transport.XHR);

  /**
   * Merge the properties from XHR transport
   */

  io.util.merge(XHRPolling, io.Transport.XHR);

  /**
   * Transport name
   *
   * @api public
   */

  XHRPolling.prototype.name = 'xhr-polling';

  /** 
   * Establish a connection, for iPhone and Android this will be done once the page
   * is loaded.
   *
   * @returns {Transport} Chaining.
   * @api public
   */

  XHRPolling.prototype.open = function () {
    var self = this;

    io.Transport.XHR.prototype.open.call(self);
    return false;
  };

  /**
   * Starts a XHR request to wait for incoming messages.
   *
   * @api private
   */

  function empty () {};

  XHRPolling.prototype.get = function () {
    if (!this.open) return;

    var self = this;

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;

        if (this.status == 200) {
          self.onData(this.responseText);
          self.get();
        } else {
          self.onClose();
        }
      }
    };

    function onload () {
      this.onload = empty;
      this.onerror = empty;
      self.onData(this.responseText);
      self.get();
    };

    function onerror () {
      self.onClose();
    };

    this.xhr = this.request();

    if (global.XDomainRequest && this.xhr instanceof XDomainRequest) {
      this.xhr.onload = onload;
      this.xhr.onerror = onerror;
    } else {
      this.xhr.onreadystatechange = stateChange;
    }

    this.xhr.send(null);
  };

  /**
   * Handle the unclean close behavior.
   *
   * @api private
   */

  XHRPolling.prototype.onClose = function () {
    io.Transport.XHR.prototype.onClose.call(this);

    if (this.xhr) {
      this.xhr.onreadystatechange = this.xhr.onload = this.xhr.onerror = empty;
      try {
        this.xhr.abort();
      } catch(e){}
      this.xhr = null;
    }
  };

  /**
   * Webkit based browsers show a infinit spinner when you start a XHR request
   * before the browsers onload event is called so we need to defer opening of
   * the transport until the onload event is called. Wrapping the cb in our
   * defer method solve this.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  XHRPolling.prototype.ready = function (socket, fn) {
    var self = this;

    io.util.defer(function () {
      fn.call(self);
    });
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('xhr-polling');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
;var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

if (!process.env) process.env = {};
if (!process.argv) process.argv = [];

require.define("path", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "function filter (xs, fn) {\n    var res = [];\n    for (var i = 0; i < xs.length; i++) {\n        if (fn(xs[i], i, xs)) res.push(xs[i]);\n    }\n    return res;\n}\n\n// resolves . and .. elements in a path array with directory names there\n// must be no slashes, empty elements, or device names (c:\\) in the array\n// (so also no leading and trailing slashes - it does not distinguish\n// relative and absolute paths)\nfunction normalizeArray(parts, allowAboveRoot) {\n  // if the path tries to go above the root, `up` ends up > 0\n  var up = 0;\n  for (var i = parts.length; i >= 0; i--) {\n    var last = parts[i];\n    if (last == '.') {\n      parts.splice(i, 1);\n    } else if (last === '..') {\n      parts.splice(i, 1);\n      up++;\n    } else if (up) {\n      parts.splice(i, 1);\n      up--;\n    }\n  }\n\n  // if the path is allowed to go above the root, restore leading ..s\n  if (allowAboveRoot) {\n    for (; up--; up) {\n      parts.unshift('..');\n    }\n  }\n\n  return parts;\n}\n\n// Regex to split a filename into [*, dir, basename, ext]\n// posix version\nvar splitPathRe = /^(.+\\/(?!$)|\\/)?((?:.+?)?(\\.[^.]*)?)$/;\n\n// path.resolve([from ...], to)\n// posix version\nexports.resolve = function() {\nvar resolvedPath = '',\n    resolvedAbsolute = false;\n\nfor (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {\n  var path = (i >= 0)\n      ? arguments[i]\n      : process.cwd();\n\n  // Skip empty and invalid entries\n  if (typeof path !== 'string' || !path) {\n    continue;\n  }\n\n  resolvedPath = path + '/' + resolvedPath;\n  resolvedAbsolute = path.charAt(0) === '/';\n}\n\n// At this point the path should be resolved to a full absolute path, but\n// handle relative paths to be safe (might happen when process.cwd() fails)\n\n// Normalize the path\nresolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {\n    return !!p;\n  }), !resolvedAbsolute).join('/');\n\n  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';\n};\n\n// path.normalize(path)\n// posix version\nexports.normalize = function(path) {\nvar isAbsolute = path.charAt(0) === '/',\n    trailingSlash = path.slice(-1) === '/';\n\n// Normalize the path\npath = normalizeArray(filter(path.split('/'), function(p) {\n    return !!p;\n  }), !isAbsolute).join('/');\n\n  if (!path && !isAbsolute) {\n    path = '.';\n  }\n  if (path && trailingSlash) {\n    path += '/';\n  }\n  \n  return (isAbsolute ? '/' : '') + path;\n};\n\n\n// posix version\nexports.join = function() {\n  var paths = Array.prototype.slice.call(arguments, 0);\n  return exports.normalize(filter(paths, function(p, index) {\n    return p && typeof p === 'string';\n  }).join('/'));\n};\n\n\nexports.dirname = function(path) {\n  var dir = splitPathRe.exec(path)[1] || '';\n  var isWindows = false;\n  if (!dir) {\n    // No dirname\n    return '.';\n  } else if (dir.length === 1 ||\n      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {\n    // It is just a slash or a drive letter with a slash\n    return dir;\n  } else {\n    // It is a full dirname, strip trailing slash\n    return dir.substring(0, dir.length - 1);\n  }\n};\n\n\nexports.basename = function(path, ext) {\n  var f = splitPathRe.exec(path)[2] || '';\n  // TODO: make this comparison case-insensitive on windows?\n  if (ext && f.substr(-1 * ext.length) === ext) {\n    f = f.substr(0, f.length - ext.length);\n  }\n  return f;\n};\n\n\nexports.extname = function(path) {\n  return splitPathRe.exec(path)[3] || '';\n};\n\n//@ sourceURL=path"
));

require.define("/node_modules/racer/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"./lib/racer.js\"}\n//@ sourceURL=/node_modules/racer/package.json"
));

require.define("/node_modules/racer/lib/racer.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar EventEmitter, isServer, mergeAll, plugin, racer, util, _ref;\n\n_ref = util = require('./util'), mergeAll = _ref.mergeAll, isServer = _ref.isServer;\n\nif (!isServer) {\n  require('es5-shim');\n}\n\nEventEmitter = require('events').EventEmitter;\n\nplugin = require('./plugin');\n\nracer = module.exports = new EventEmitter;\n\nmergeAll(racer, plugin, {\n  \"protected\": {\n    Model: require('./Model')\n  },\n  util: util\n});\n\nif (isServer) {\n  racer.use(__dirname + '/racer.server');\n}\n\nracer.use(require('./mutators')).use(require('./refs')).use(require('./pubSub')).use(require('./txns'));\n\nif (isServer) {\n  racer.use(require('./adapters/pubsub-memory'));\n}\n\nif (!isServer) {\n  racer.use(require('./racer.browser'));\n}\n\n//@ sourceURL=/node_modules/racer/lib/racer.js"
));

require.define("/node_modules/racer/lib/util/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar deepCopy, deepEqual, equalsNaN, indexOf, isArguments, isServer, objEquiv, toString,\n  __slice = [].slice;\n\ntoString = Object.prototype.toString;\n\nmodule.exports = {\n  isServer: isServer = typeof window === 'undefined',\n  isProduction: isServer && process.env.NODE_ENV === 'production',\n  isArguments: isArguments = function(obj) {\n    return toString.call(obj) === '[object Arguments]';\n  },\n  mergeAll: function() {\n    var from, froms, key, to, _i, _len;\n    to = arguments[0], froms = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = froms.length; _i < _len; _i++) {\n      from = froms[_i];\n      if (from) {\n        for (key in from) {\n          to[key] = from[key];\n        }\n      }\n    }\n    return to;\n  },\n  merge: function(to, from) {\n    var key;\n    for (key in from) {\n      to[key] = from[key];\n    }\n    return to;\n  },\n  hasKeys: function(obj, ignore) {\n    var key;\n    for (key in obj) {\n      if (key === ignore) {\n        continue;\n      }\n      return true;\n    }\n    return false;\n  },\n  deepEqual: deepEqual = function(actual, expected) {\n    if (actual === expected) {\n      return true;\n    }\n    if (actual instanceof Date && expected instanceof Date) {\n      return actual.getTime() === expected.getTime();\n    }\n    if (typeof actual !== 'object' && typeof expected !== 'object') {\n      return actual === expected;\n    }\n    return objEquiv(actual, expected);\n  },\n  objEquiv: objEquiv = function(a, b) {\n    var i, ka, kb, key;\n    if (a == null || b == null) {\n      return false;\n    }\n    if (a.prototype !== b.prototype) {\n      return false;\n    }\n    if (isArguments(a)) {\n      if (!isArguments(b)) {\n        return false;\n      }\n      a = pSlice.call(a);\n      b = pSlice.call(b);\n      return deepEqual(a, b);\n    }\n    try {\n      ka = Object.keys(a);\n      kb = Object.keys(b);\n    } catch (e) {\n      return false;\n    }\n    if (ka.length !== kb.length) {\n      return false;\n    }\n    ka.sort();\n    kb.sort();\n    i = ka.length;\n    while (i--) {\n      if (ka[i] !== kb[i]) {\n        return false;\n      }\n    }\n    i = ka.length;\n    while (i--) {\n      key = ka[i];\n      if (!deepEqual(a[key], b[key])) {\n        return false;\n      }\n    }\n    return true;\n  },\n  deepCopy: deepCopy = function(obj) {\n    var k, ret, v, _i, _len;\n    if (typeof obj === 'object') {\n      if (Array.isArray(obj)) {\n        ret = [];\n        for (_i = 0, _len = obj.length; _i < _len; _i++) {\n          v = obj[_i];\n          ret.push(deepCopy(v));\n        }\n        return ret;\n      }\n      ret = {};\n      for (k in obj) {\n        v = obj[k];\n        ret[k] = deepCopy(v);\n      }\n      return ret;\n    }\n    return obj;\n  },\n  indexOf: indexOf = function(list, obj, isEqual) {\n    var i, v, _i, _len;\n    for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {\n      v = list[i];\n      if (isEqual(obj, v)) {\n        return i;\n      }\n    }\n    return -1;\n  },\n  deepIndexOf: function(list, obj) {\n    return indexOf(list, obj, deepEqual);\n  },\n  equalsNaN: equalsNaN = function(x) {\n    return x !== x;\n  },\n  equal: function(a, b) {\n    return a === b || (equalsNaN(a) && equalsNaN(b));\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/util/index.js"
));

require.define("/node_modules/racer/node_modules/es5-shim/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"es5-shim.js\"}\n//@ sourceURL=/node_modules/racer/node_modules/es5-shim/package.json"
));

require.define("/node_modules/racer/node_modules/es5-shim/es5-shim.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// vim: ts=4 sts=4 sw=4 expandtab\n// -- kriskowal Kris Kowal Copyright (C) 2009-2011 MIT License\n// -- tlrobinson Tom Robinson Copyright (C) 2009-2010 MIT License (Narwhal Project)\n// -- dantman Daniel Friesen Copyright (C) 2010 XXX TODO License or CLA\n// -- fschaefer Florian Schäfer Copyright (C) 2010 MIT License\n// -- Gozala Irakli Gozalishvili Copyright (C) 2010 MIT License\n// -- kitcambridge Kit Cambridge Copyright (C) 2011 MIT License\n// -- kossnocorp Sasha Koss XXX TODO License or CLA\n// -- bryanforbes Bryan Forbes XXX TODO License or CLA\n// -- killdream Quildreen Motta XXX TODO License or CLA\n// -- michaelficarra Michael Ficarra Copyright (C) 2011 3-clause BSD License\n// -- sharkbrainguy Gerard Paapu Copyright (C) 2011 MIT License\n// -- bbqsrc Brendan Molloy XXX TODO License or CLA\n// -- iwyg XXX TODO License or CLA\n// -- DomenicDenicola Domenic Denicola XXX TODO License or CLA\n// -- xavierm02 Montillet Xavier XXX TODO License or CLA\n// -- Raynos Raynos XXX TODO License or CLA\n// -- samsonjs Sami Samhuri XXX TODO License or CLA\n// -- rwldrn Rick Waldron XXX TODO License or CLA\n// -- lexer Alexey Zakharov XXX TODO License or CLA\n\n/*!\n    Copyright (c) 2009, 280 North Inc. http://280north.com/\n    MIT License. http://github.com/280north/narwhal/blob/master/README.md\n*/\n\n// Module systems magic dance\n(function (definition) {\n    // RequireJS\n    if (typeof define == \"function\") {\n        define(definition);\n    // CommonJS and <script>\n    } else {\n        definition();\n    }\n})(function () {\n\n/**\n * Brings an environment as close to ECMAScript 5 compliance\n * as is possible with the facilities of erstwhile engines.\n *\n * ES5 Draft\n * http://www.ecma-international.org/publications/files/drafts/tc39-2009-050.pdf\n *\n * NOTE: this is a draft, and as such, the URL is subject to change.  If the\n * link is broken, check in the parent directory for the latest TC39 PDF.\n * http://www.ecma-international.org/publications/files/drafts/\n *\n * Previous ES5 Draft\n * http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf\n * This is a broken link to the previous draft of ES5 on which most of the\n * numbered specification references and quotes herein were taken.  Updating\n * these references and quotes to reflect the new document would be a welcome\n * volunteer project.\n *\n * @module\n */\n\n/*whatsupdoc*/\n\n//\n// Function\n// ========\n//\n\n// ES-5 15.3.4.5\n// http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf\n\nif (!Function.prototype.bind) {\n    Function.prototype.bind = function bind(that) { // .length is 1\n        // 1. Let Target be the this value.\n        var target = this;\n        // 2. If IsCallable(Target) is false, throw a TypeError exception.\n        if (typeof target != \"function\")\n            throw new TypeError(); // TODO message\n        // 3. Let A be a new (possibly empty) internal list of all of the\n        //   argument values provided after thisArg (arg1, arg2 etc), in order.\n        // XXX slicedArgs will stand in for \"A\" if used\n        var args = slice.call(arguments, 1); // for normal call\n        // 4. Let F be a new native ECMAScript object.\n        // 9. Set the [[Prototype]] internal property of F to the standard\n        //   built-in Function prototype object as specified in 15.3.3.1.\n        // 10. Set the [[Call]] internal property of F as described in\n        //   15.3.4.5.1.\n        // 11. Set the [[Construct]] internal property of F as described in\n        //   15.3.4.5.2.\n        // 12. Set the [[HasInstance]] internal property of F as described in\n        //   15.3.4.5.3.\n        // 13. The [[Scope]] internal property of F is unused and need not\n        //   exist.\n        var bound = function () {\n\n            if (this instanceof bound) {\n                // 15.3.4.5.2 [[Construct]]\n                // When the [[Construct]] internal method of a function object,\n                // F that was created using the bind function is called with a\n                // list of arguments ExtraArgs the following steps are taken:\n                // 1. Let target be the value of F's [[TargetFunction]]\n                //   internal property.\n                // 2. If target has no [[Construct]] internal method, a\n                //   TypeError exception is thrown.\n                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal\n                //   property.\n                // 4. Let args be a new list containing the same values as the\n                //   list boundArgs in the same order followed by the same\n                //   values as the list ExtraArgs in the same order.\n\n                var F = function(){};\n                F.prototype = target.prototype;\n                var self = new F;\n\n                var result = target.apply(\n                    self,\n                    args.concat(slice.call(arguments))\n                );\n                if (result !== null && Object(result) === result)\n                    return result;\n                return self;\n\n            } else {\n                // 15.3.4.5.1 [[Call]]\n                // When the [[Call]] internal method of a function object, F,\n                // which was created using the bind function is called with a\n                // this value and a list of arguments ExtraArgs the following\n                // steps are taken:\n                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal\n                //   property.\n                // 2. Let boundThis be the value of F's [[BoundThis]] internal\n                //   property.\n                // 3. Let target be the value of F's [[TargetFunction]] internal\n                //   property.\n                // 4. Let args be a new list containing the same values as the list\n                //   boundArgs in the same order followed by the same values as\n                //   the list ExtraArgs in the same order. 5.  Return the\n                //   result of calling the [[Call]] internal method of target\n                //   providing boundThis as the this value and providing args\n                //   as the arguments.\n\n                // equiv: target.call(this, ...boundArgs, ...args)\n                return target.apply(\n                    that,\n                    args.concat(slice.call(arguments))\n                );\n\n            }\n\n        };\n        // XXX bound.length is never writable, so don't even try\n        //\n        // 16. The length own property of F is given attributes as specified in\n        //   15.3.5.1.\n        // TODO\n        // 17. Set the [[Extensible]] internal property of F to true.\n        // TODO\n        // 18. Call the [[DefineOwnProperty]] internal method of F with\n        //   arguments \"caller\", PropertyDescriptor {[[Value]]: null,\n        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:\n        //   false}, and false.\n        // TODO\n        // 19. Call the [[DefineOwnProperty]] internal method of F with\n        //   arguments \"arguments\", PropertyDescriptor {[[Value]]: null,\n        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:\n        //   false}, and false.\n        // TODO\n        // NOTE Function objects created using Function.prototype.bind do not\n        // have a prototype property.\n        // XXX can't delete it in pure-js.\n        return bound;\n    };\n}\n\n// Shortcut to an often accessed properties, in order to avoid multiple\n// dereference that costs universally.\n// _Please note: Shortcuts are defined after `Function.prototype.bind` as we\n// us it in defining shortcuts.\nvar call = Function.prototype.call;\nvar prototypeOfArray = Array.prototype;\nvar prototypeOfObject = Object.prototype;\nvar slice = prototypeOfArray.slice;\nvar toString = call.bind(prototypeOfObject.toString);\nvar owns = call.bind(prototypeOfObject.hasOwnProperty);\n\n// If JS engine supports accessors creating shortcuts.\nvar defineGetter;\nvar defineSetter;\nvar lookupGetter;\nvar lookupSetter;\nvar supportsAccessors;\nif ((supportsAccessors = owns(prototypeOfObject, \"__defineGetter__\"))) {\n    defineGetter = call.bind(prototypeOfObject.__defineGetter__);\n    defineSetter = call.bind(prototypeOfObject.__defineSetter__);\n    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);\n    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);\n}\n\n//\n// Array\n// =====\n//\n\n// ES5 15.4.3.2\nif (!Array.isArray) {\n    Array.isArray = function isArray(obj) {\n        return toString(obj) == \"[object Array]\";\n    };\n}\n\n// The IsCallable() check in the Array functions\n// has been replaced with a strict check on the\n// internal class of the object to trap cases where\n// the provided function was actually a regular\n// expression literal, which in V8 and\n// JavaScriptCore is a typeof \"function\".  Only in\n// V8 are regular expression literals permitted as\n// reduce parameters, so it is desirable in the\n// general case for the shim to match the more\n// strict and common behavior of rejecting regular\n// expressions.\n\n// ES5 15.4.4.18\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/foreach\nif (!Array.prototype.forEach) {\n    Array.prototype.forEach = function forEach(fun /*, thisp*/) {\n        var self = toObject(this),\n            thisp = arguments[1],\n            i = 0,\n            length = self.length >>> 0;\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        while (i < length) {\n            if (i in self) {\n                // Invoke the callback function with call, passing arguments:\n                // context, property value, property key, thisArg object context\n                fun.call(thisp, self[i], i, self);\n            }\n            i++;\n        }\n    };\n}\n\n// ES5 15.4.4.19\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map\nif (!Array.prototype.map) {\n    Array.prototype.map = function map(fun /*, thisp*/) {\n        var self = toObject(this),\n            length = self.length >>> 0,\n            result = Array(length),\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self)\n                result[i] = fun.call(thisp, self[i], i, self);\n        }\n        return result;\n    };\n}\n\n// ES5 15.4.4.20\nif (!Array.prototype.filter) {\n    Array.prototype.filter = function filter(fun /*, thisp */) {\n        var self = toObject(this),\n            length = self.length >>> 0,\n            result = [],\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self && fun.call(thisp, self[i], i, self))\n                result.push(self[i]);\n        }\n        return result;\n    };\n}\n\n// ES5 15.4.4.16\nif (!Array.prototype.every) {\n    Array.prototype.every = function every(fun /*, thisp */) {\n        var self = toObject(this),\n            length = self.length >>> 0,\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self && !fun.call(thisp, self[i], i, self))\n                return false;\n        }\n        return true;\n    };\n}\n\n// ES5 15.4.4.17\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some\nif (!Array.prototype.some) {\n    Array.prototype.some = function some(fun /*, thisp */) {\n        var self = toObject(this),\n            length = self.length >>> 0,\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self && fun.call(thisp, self[i], i, self))\n                return true;\n        }\n        return false;\n    };\n}\n\n// ES5 15.4.4.21\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce\nif (!Array.prototype.reduce) {\n    Array.prototype.reduce = function reduce(fun /*, initial*/) {\n        var self = toObject(this),\n            length = self.length >>> 0;\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        // no value to return if no initial value and an empty array\n        if (!length && arguments.length == 1)\n            throw new TypeError(); // TODO message\n\n        var i = 0;\n        var result;\n        if (arguments.length >= 2) {\n            result = arguments[1];\n        } else {\n            do {\n                if (i in self) {\n                    result = self[i++];\n                    break;\n                }\n\n                // if array contains no values, no initial value to return\n                if (++i >= length)\n                    throw new TypeError(); // TODO message\n            } while (true);\n        }\n\n        for (; i < length; i++) {\n            if (i in self)\n                result = fun.call(void 0, result, self[i], i, self);\n        }\n\n        return result;\n    };\n}\n\n// ES5 15.4.4.22\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight\nif (!Array.prototype.reduceRight) {\n    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {\n        var self = toObject(this),\n            length = self.length >>> 0;\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        // no value to return if no initial value, empty array\n        if (!length && arguments.length == 1)\n            throw new TypeError(); // TODO message\n\n        var result, i = length - 1;\n        if (arguments.length >= 2) {\n            result = arguments[1];\n        } else {\n            do {\n                if (i in self) {\n                    result = self[i--];\n                    break;\n                }\n\n                // if array contains no values, no initial value to return\n                if (--i < 0)\n                    throw new TypeError(); // TODO message\n            } while (true);\n        }\n\n        do {\n            if (i in this)\n                result = fun.call(void 0, result, self[i], i, self);\n        } while (i--);\n\n        return result;\n    };\n}\n\n// ES5 15.4.4.14\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf\nif (!Array.prototype.indexOf) {\n    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {\n        var self = toObject(this),\n            length = self.length >>> 0;\n\n        if (!length)\n            return -1;\n\n        var i = 0;\n        if (arguments.length > 1)\n            i = toInteger(arguments[1]);\n\n        // handle negative indices\n        i = i >= 0 ? i : length - Math.abs(i);\n        for (; i < length; i++) {\n            if (i in self && self[i] === sought) {\n                return i;\n            }\n        }\n        return -1;\n    };\n}\n\n// ES5 15.4.4.15\nif (!Array.prototype.lastIndexOf) {\n    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {\n        var self = toObject(this),\n            length = self.length >>> 0;\n\n        if (!length)\n            return -1;\n        var i = length - 1;\n        if (arguments.length > 1)\n            i = toInteger(arguments[1]);\n        // handle negative indices\n        i = i >= 0 ? i : length - Math.abs(i);\n        for (; i >= 0; i--) {\n            if (i in self && sought === self[i])\n                return i;\n        }\n        return -1;\n    };\n}\n\n//\n// Object\n// ======\n//\n\n// ES5 15.2.3.2\nif (!Object.getPrototypeOf) {\n    // https://github.com/kriskowal/es5-shim/issues#issue/2\n    // http://ejohn.org/blog/objectgetprototypeof/\n    // recommended by fschaefer on github\n    Object.getPrototypeOf = function getPrototypeOf(object) {\n        return object.__proto__ || (\n            object.constructor ?\n            object.constructor.prototype :\n            prototypeOfObject\n        );\n    };\n}\n\n// ES5 15.2.3.3\nif (!Object.getOwnPropertyDescriptor) {\n    var ERR_NON_OBJECT = \"Object.getOwnPropertyDescriptor called on a \" +\n                         \"non-object: \";\n    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {\n        if ((typeof object != \"object\" && typeof object != \"function\") || object === null)\n            throw new TypeError(ERR_NON_OBJECT + object);\n        // If object does not owns property return undefined immediately.\n        if (!owns(object, property))\n            return;\n\n        var descriptor, getter, setter;\n\n        // If object has a property then it's for sure both `enumerable` and\n        // `configurable`.\n        descriptor =  { enumerable: true, configurable: true };\n\n        // If JS engine supports accessor properties then property may be a\n        // getter or setter.\n        if (supportsAccessors) {\n            // Unfortunately `__lookupGetter__` will return a getter even\n            // if object has own non getter property along with a same named\n            // inherited getter. To avoid misbehavior we temporary remove\n            // `__proto__` so that `__lookupGetter__` will return getter only\n            // if it's owned by an object.\n            var prototype = object.__proto__;\n            object.__proto__ = prototypeOfObject;\n\n            var getter = lookupGetter(object, property);\n            var setter = lookupSetter(object, property);\n\n            // Once we have getter and setter we can put values back.\n            object.__proto__ = prototype;\n\n            if (getter || setter) {\n                if (getter) descriptor.get = getter;\n                if (setter) descriptor.set = setter;\n\n                // If it was accessor property we're done and return here\n                // in order to avoid adding `value` to the descriptor.\n                return descriptor;\n            }\n        }\n\n        // If we got this far we know that object has an own property that is\n        // not an accessor so we set it as a value and return descriptor.\n        descriptor.value = object[property];\n        return descriptor;\n    };\n}\n\n// ES5 15.2.3.4\nif (!Object.getOwnPropertyNames) {\n    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {\n        return Object.keys(object);\n    };\n}\n\n// ES5 15.2.3.5\nif (!Object.create) {\n    Object.create = function create(prototype, properties) {\n        var object;\n        if (prototype === null) {\n            object = { \"__proto__\": null };\n        } else {\n            if (typeof prototype != \"object\")\n                throw new TypeError(\"typeof prototype[\"+(typeof prototype)+\"] != 'object'\");\n            var Type = function () {};\n            Type.prototype = prototype;\n            object = new Type();\n            // IE has no built-in implementation of `Object.getPrototypeOf`\n            // neither `__proto__`, but this manually setting `__proto__` will\n            // guarantee that `Object.getPrototypeOf` will work as expected with\n            // objects created using `Object.create`\n            object.__proto__ = prototype;\n        }\n        if (properties !== void 0)\n            Object.defineProperties(object, properties);\n        return object;\n    };\n}\n\n// ES5 15.2.3.6\n\n// Patch for WebKit and IE8 standard mode\n// Designed by hax <hax.github.com>\n// related issue: https://github.com/kriskowal/es5-shim/issues#issue/5\n// IE8 Reference:\n//     http://msdn.microsoft.com/en-us/library/dd282900.aspx\n//     http://msdn.microsoft.com/en-us/library/dd229916.aspx\n// WebKit Bugs:\n//     https://bugs.webkit.org/show_bug.cgi?id=36423\n\nfunction doesDefinePropertyWork(object) {\n    try {\n        Object.defineProperty(object, \"sentinel\", {});\n        return \"sentinel\" in object;\n    } catch (exception) {\n        // returns falsy\n    }\n}\n\n// check whether defineProperty works if it's given. Otherwise,\n// shim partially.\nif (Object.defineProperty) {\n    var definePropertyWorksOnObject = doesDefinePropertyWork({});\n    var definePropertyWorksOnDom = typeof document == \"undefined\" ||\n        doesDefinePropertyWork(document.createElement(\"div\"));\n    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {\n        var definePropertyFallback = Object.defineProperty;\n    }\n}\n\nif (!Object.defineProperty || definePropertyFallback) {\n    var ERR_NON_OBJECT_DESCRIPTOR = \"Property description must be an object: \";\n    var ERR_NON_OBJECT_TARGET = \"Object.defineProperty called on non-object: \"\n    var ERR_ACCESSORS_NOT_SUPPORTED = \"getters & setters can not be defined \" +\n                                      \"on this javascript engine\";\n\n    Object.defineProperty = function defineProperty(object, property, descriptor) {\n        if ((typeof object != \"object\" && typeof object != \"function\") || object === null)\n            throw new TypeError(ERR_NON_OBJECT_TARGET + object);\n        if ((typeof descriptor != \"object\" && typeof descriptor != \"function\") || descriptor === null)\n            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);\n\n        // make a valiant attempt to use the real defineProperty\n        // for I8's DOM elements.\n        if (definePropertyFallback) {\n            try {\n                return definePropertyFallback.call(Object, object, property, descriptor);\n            } catch (exception) {\n                // try the shim if the real one doesn't work\n            }\n        }\n\n        // If it's a data property.\n        if (owns(descriptor, \"value\")) {\n            // fail silently if \"writable\", \"enumerable\", or \"configurable\"\n            // are requested but not supported\n            /*\n            // alternate approach:\n            if ( // can't implement these features; allow false but not true\n                !(owns(descriptor, \"writable\") ? descriptor.writable : true) ||\n                !(owns(descriptor, \"enumerable\") ? descriptor.enumerable : true) ||\n                !(owns(descriptor, \"configurable\") ? descriptor.configurable : true)\n            )\n                throw new RangeError(\n                    \"This implementation of Object.defineProperty does not \" +\n                    \"support configurable, enumerable, or writable.\"\n                );\n            */\n\n            if (supportsAccessors && (lookupGetter(object, property) ||\n                                      lookupSetter(object, property)))\n            {\n                // As accessors are supported only on engines implementing\n                // `__proto__` we can safely override `__proto__` while defining\n                // a property to make sure that we don't hit an inherited\n                // accessor.\n                var prototype = object.__proto__;\n                object.__proto__ = prototypeOfObject;\n                // Deleting a property anyway since getter / setter may be\n                // defined on object itself.\n                delete object[property];\n                object[property] = descriptor.value;\n                // Setting original `__proto__` back now.\n                object.__proto__ = prototype;\n            } else {\n                object[property] = descriptor.value;\n            }\n        } else {\n            if (!supportsAccessors)\n                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);\n            // If we got that far then getters and setters can be defined !!\n            if (owns(descriptor, \"get\"))\n                defineGetter(object, property, descriptor.get);\n            if (owns(descriptor, \"set\"))\n                defineSetter(object, property, descriptor.set);\n        }\n\n        return object;\n    };\n}\n\n// ES5 15.2.3.7\nif (!Object.defineProperties) {\n    Object.defineProperties = function defineProperties(object, properties) {\n        for (var property in properties) {\n            if (owns(properties, property))\n                Object.defineProperty(object, property, properties[property]);\n        }\n        return object;\n    };\n}\n\n// ES5 15.2.3.8\nif (!Object.seal) {\n    Object.seal = function seal(object) {\n        // this is misleading and breaks feature-detection, but\n        // allows \"securable\" code to \"gracefully\" degrade to working\n        // but insecure code.\n        return object;\n    };\n}\n\n// ES5 15.2.3.9\nif (!Object.freeze) {\n    Object.freeze = function freeze(object) {\n        // this is misleading and breaks feature-detection, but\n        // allows \"securable\" code to \"gracefully\" degrade to working\n        // but insecure code.\n        return object;\n    };\n}\n\n// detect a Rhino bug and patch it\ntry {\n    Object.freeze(function () {});\n} catch (exception) {\n    Object.freeze = (function freeze(freezeObject) {\n        return function freeze(object) {\n            if (typeof object == \"function\") {\n                return object;\n            } else {\n                return freezeObject(object);\n            }\n        };\n    })(Object.freeze);\n}\n\n// ES5 15.2.3.10\nif (!Object.preventExtensions) {\n    Object.preventExtensions = function preventExtensions(object) {\n        // this is misleading and breaks feature-detection, but\n        // allows \"securable\" code to \"gracefully\" degrade to working\n        // but insecure code.\n        return object;\n    };\n}\n\n// ES5 15.2.3.11\nif (!Object.isSealed) {\n    Object.isSealed = function isSealed(object) {\n        return false;\n    };\n}\n\n// ES5 15.2.3.12\nif (!Object.isFrozen) {\n    Object.isFrozen = function isFrozen(object) {\n        return false;\n    };\n}\n\n// ES5 15.2.3.13\nif (!Object.isExtensible) {\n    Object.isExtensible = function isExtensible(object) {\n        // 1. If Type(O) is not Object throw a TypeError exception.\n        if (Object(object) === object) {\n            throw new TypeError(); // TODO message\n        }\n        // 2. Return the Boolean value of the [[Extensible]] internal property of O.\n        var name = '';\n        while (owns(object, name)) {\n            name += '?';\n        }\n        object[name] = true;\n        var returnValue = owns(object, name);\n        delete object[name];\n        return returnValue;\n    };\n}\n\n// ES5 15.2.3.14\n// http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation\nif (!Object.keys) {\n\n    var hasDontEnumBug = true,\n        dontEnums = [\n            \"toString\",\n            \"toLocaleString\",\n            \"valueOf\",\n            \"hasOwnProperty\",\n            \"isPrototypeOf\",\n            \"propertyIsEnumerable\",\n            \"constructor\"\n        ],\n        dontEnumsLength = dontEnums.length;\n\n    for (var key in {\"toString\": null})\n        hasDontEnumBug = false;\n\n    Object.keys = function keys(object) {\n\n        if ((typeof object != \"object\" && typeof object != \"function\") || object === null)\n            throw new TypeError(\"Object.keys called on a non-object\");\n\n        var keys = [];\n        for (var name in object) {\n            if (owns(object, name)) {\n                keys.push(name);\n            }\n        }\n\n        if (hasDontEnumBug) {\n            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {\n                var dontEnum = dontEnums[i];\n                if (owns(object, dontEnum)) {\n                    keys.push(dontEnum);\n                }\n            }\n        }\n\n        return keys;\n    };\n\n}\n\n//\n// Date\n// ====\n//\n\n// ES5 15.9.5.43\n// Format a Date object as a string according to a simplified subset of the ISO 8601\n// standard as defined in 15.9.1.15.\nif (!Date.prototype.toISOString) {\n    Date.prototype.toISOString = function toISOString() {\n        var result, length, value;\n        if (!isFinite(this))\n            throw new RangeError;\n\n        // the date time string format is specified in 15.9.1.15.\n        result = [this.getUTCFullYear(), this.getUTCMonth() + 1, this.getUTCDate(),\n            this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];\n\n        length = result.length;\n        while (length--) {\n            value = result[length];\n            // pad months, days, hours, minutes, and seconds to have two digits.\n            if (value < 10)\n                result[length] = \"0\" + value;\n        }\n        // pad milliseconds to have three digits.\n        return result.slice(0, 3).join(\"-\") + \"T\" + result.slice(3).join(\":\") + \".\" +\n            (\"000\" + this.getUTCMilliseconds()).slice(-3) + \"Z\";\n    }\n}\n\n// ES5 15.9.4.4\nif (!Date.now) {\n    Date.now = function now() {\n        return new Date().getTime();\n    };\n}\n\n// ES5 15.9.5.44\nif (!Date.prototype.toJSON) {\n    Date.prototype.toJSON = function toJSON(key) {\n        // This function provides a String representation of a Date object for\n        // use by JSON.stringify (15.12.3). When the toJSON method is called\n        // with argument key, the following steps are taken:\n\n        // 1.  Let O be the result of calling ToObject, giving it the this\n        // value as its argument.\n        // 2. Let tv be ToPrimitive(O, hint Number).\n        // 3. If tv is a Number and is not finite, return null.\n        // XXX\n        // 4. Let toISO be the result of calling the [[Get]] internal method of\n        // O with argument \"toISOString\".\n        // 5. If IsCallable(toISO) is false, throw a TypeError exception.\n        if (typeof this.toISOString != \"function\")\n            throw new TypeError(); // TODO message\n        // 6. Return the result of calling the [[Call]] internal method of\n        // toISO with O as the this value and an empty argument list.\n        return this.toISOString();\n\n        // NOTE 1 The argument is ignored.\n\n        // NOTE 2 The toJSON function is intentionally generic; it does not\n        // require that its this value be a Date object. Therefore, it can be\n        // transferred to other kinds of objects for use as a method. However,\n        // it does require that any such object have a toISOString method. An\n        // object is free to use the argument key to filter its\n        // stringification.\n    };\n}\n\n// 15.9.4.2 Date.parse (string)\n// 15.9.1.15 Date Time String Format\n// Date.parse\n// based on work shared by Daniel Friesen (dantman)\n// http://gist.github.com/303249\nif (isNaN(Date.parse(\"2011-06-15T21:40:05+06:00\"))) {\n    // XXX global assignment won't work in embeddings that use\n    // an alternate object for the context.\n    Date = (function(NativeDate) {\n\n        // Date.length === 7\n        var Date = function Date(Y, M, D, h, m, s, ms) {\n            var length = arguments.length;\n            if (this instanceof NativeDate) {\n                var date = length == 1 && String(Y) === Y ? // isString(Y)\n                    // We explicitly pass it through parse:\n                    new NativeDate(Date.parse(Y)) :\n                    // We have to manually make calls depending on argument\n                    // length here\n                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :\n                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :\n                    length >= 5 ? new NativeDate(Y, M, D, h, m) :\n                    length >= 4 ? new NativeDate(Y, M, D, h) :\n                    length >= 3 ? new NativeDate(Y, M, D) :\n                    length >= 2 ? new NativeDate(Y, M) :\n                    length >= 1 ? new NativeDate(Y) :\n                                  new NativeDate();\n                // Prevent mixups with unfixed Date object\n                date.constructor = Date;\n                return date;\n            }\n            return NativeDate.apply(this, arguments);\n        };\n\n        // 15.9.1.15 Date Time String Format. This pattern does not implement\n        // extended years (15.9.1.15.1), as `Date.UTC` cannot parse them.\n        var isoDateExpression = new RegExp(\"^\" +\n            \"(\\\\d{4})\" + // four-digit year capture\n            \"(?:-(\\\\d{2})\" + // optional month capture\n            \"(?:-(\\\\d{2})\" + // optional day capture\n            \"(?:\" + // capture hours:minutes:seconds.milliseconds\n                \"T(\\\\d{2})\" + // hours capture\n                \":(\\\\d{2})\" + // minutes capture\n                \"(?:\" + // optional :seconds.milliseconds\n                    \":(\\\\d{2})\" + // seconds capture\n                    \"(?:\\\\.(\\\\d{3}))?\" + // milliseconds capture\n                \")?\" +\n            \"(?:\" + // capture UTC offset component\n                \"Z|\" + // UTC capture\n                \"(?:\" + // offset specifier +/-hours:minutes\n                    \"([-+])\" + // sign capture\n                    \"(\\\\d{2})\" + // hours offset capture\n                    \":(\\\\d{2})\" + // minutes offset capture\n                \")\" +\n            \")?)?)?)?\" +\n        \"$\");\n\n        // Copy any custom methods a 3rd party library may have added\n        for (var key in NativeDate)\n            Date[key] = NativeDate[key];\n\n        // Copy \"native\" methods explicitly; they may be non-enumerable\n        Date.now = NativeDate.now;\n        Date.UTC = NativeDate.UTC;\n        Date.prototype = NativeDate.prototype;\n        Date.prototype.constructor = Date;\n\n        // Upgrade Date.parse to handle simplified ISO 8601 strings\n        Date.parse = function parse(string) {\n            var match = isoDateExpression.exec(string);\n            if (match) {\n                match.shift(); // kill match[0], the full match\n                // parse months, days, hours, minutes, seconds, and milliseconds\n                for (var i = 1; i < 7; i++) {\n                    // provide default values if necessary\n                    match[i] = +(match[i] || (i < 3 ? 1 : 0));\n                    // match[1] is the month. Months are 0-11 in JavaScript\n                    // `Date` objects, but 1-12 in ISO notation, so we\n                    // decrement.\n                    if (i == 1)\n                        match[i]--;\n                }\n\n                // parse the UTC offset component\n                var minuteOffset = +match.pop(), hourOffset = +match.pop(), sign = match.pop();\n\n                // compute the explicit time zone offset if specified\n                var offset = 0;\n                if (sign) {\n                    // detect invalid offsets and return early\n                    if (hourOffset > 23 || minuteOffset > 59)\n                        return NaN;\n\n                    // express the provided time zone offset in minutes. The offset is\n                    // negative for time zones west of UTC; positive otherwise.\n                    offset = (hourOffset * 60 + minuteOffset) * 6e4 * (sign == \"+\" ? -1 : 1);\n                }\n\n                // compute a new UTC date value, accounting for the optional offset\n                return NativeDate.UTC.apply(this, match) + offset;\n            }\n            return NativeDate.parse.apply(this, arguments);\n        };\n\n        return Date;\n    })(Date);\n}\n\n//\n// String\n// ======\n//\n\n// ES5 15.5.4.20\nvar ws = \"\\x09\\x0A\\x0B\\x0C\\x0D\\x20\\xA0\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\" +\n    \"\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u202F\\u205F\\u3000\\u2028\" +\n    \"\\u2029\\uFEFF\";\nif (!String.prototype.trim || ws.trim()) {\n    // http://blog.stevenlevithan.com/archives/faster-trim-javascript\n    // http://perfectionkills.com/whitespace-deviations/\n    ws = \"[\" + ws + \"]\";\n    var trimBeginRegexp = new RegExp(\"^\" + ws + ws + \"*\"),\n        trimEndRegexp = new RegExp(ws + ws + \"*$\");\n    String.prototype.trim = function trim() {\n        return String(this).replace(trimBeginRegexp, \"\").replace(trimEndRegexp, \"\");\n    };\n}\n\n//\n// Util\n// ======\n//\n\n// http://jsperf.com/to-integer\nvar toInteger = function (n) {\n    n = +n;\n    if (n !== n) // isNaN\n        n = -1;\n    else if (n !== 0 && n !== (1/0) && n !== -(1/0))\n        n = (n > 0 || -1) * Math.floor(Math.abs(n));\n    return n;\n};\n\nvar prepareString = \"a\"[0] != \"a\",\n    // ES5 9.9\n    toObject = function (o) {\n        if (o == null) { // this matches both null and undefined\n            throw new TypeError(); // TODO message\n        }\n        // If the implementation doesn't support by-index access of\n        // string characters (ex. IE < 7), split the string\n        if (prepareString && typeof o == \"string\" && o) {\n            return o.split(\"\");\n        }\n        return Object(o);\n    };\n});\n\n//@ sourceURL=/node_modules/racer/node_modules/es5-shim/es5-shim.js"
));

require.define("events", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "if (!process.EventEmitter) process.EventEmitter = function () {};\n\nvar EventEmitter = exports.EventEmitter = process.EventEmitter;\nvar isArray = typeof Array.isArray === 'function'\n    ? Array.isArray\n    : function (xs) {\n        return Object.prototype.toString.call(xs) === '[object Array]'\n    }\n;\n\n// By default EventEmitters will print a warning if more than\n// 10 listeners are added to it. This is a useful default which\n// helps finding memory leaks.\n//\n// Obviously not all Emitters should be limited to 10. This function allows\n// that to be increased. Set to zero for unlimited.\nvar defaultMaxListeners = 10;\nEventEmitter.prototype.setMaxListeners = function(n) {\n  if (!this._events) this._events = {};\n  this._events.maxListeners = n;\n};\n\n\nEventEmitter.prototype.emit = function(type) {\n  // If there is no 'error' event listener then throw.\n  if (type === 'error') {\n    if (!this._events || !this._events.error ||\n        (isArray(this._events.error) && !this._events.error.length))\n    {\n      if (arguments[1] instanceof Error) {\n        throw arguments[1]; // Unhandled 'error' event\n      } else {\n        throw new Error(\"Uncaught, unspecified 'error' event.\");\n      }\n      return false;\n    }\n  }\n\n  if (!this._events) return false;\n  var handler = this._events[type];\n  if (!handler) return false;\n\n  if (typeof handler == 'function') {\n    switch (arguments.length) {\n      // fast cases\n      case 1:\n        handler.call(this);\n        break;\n      case 2:\n        handler.call(this, arguments[1]);\n        break;\n      case 3:\n        handler.call(this, arguments[1], arguments[2]);\n        break;\n      // slower\n      default:\n        var args = Array.prototype.slice.call(arguments, 1);\n        handler.apply(this, args);\n    }\n    return true;\n\n  } else if (isArray(handler)) {\n    var args = Array.prototype.slice.call(arguments, 1);\n\n    var listeners = handler.slice();\n    for (var i = 0, l = listeners.length; i < l; i++) {\n      listeners[i].apply(this, args);\n    }\n    return true;\n\n  } else {\n    return false;\n  }\n};\n\n// EventEmitter is defined in src/node_events.cc\n// EventEmitter.prototype.emit() is also defined there.\nEventEmitter.prototype.addListener = function(type, listener) {\n  if ('function' !== typeof listener) {\n    throw new Error('addListener only takes instances of Function');\n  }\n\n  if (!this._events) this._events = {};\n\n  // To avoid recursion in the case that type == \"newListeners\"! Before\n  // adding it to the listeners, first emit \"newListeners\".\n  this.emit('newListener', type, listener);\n\n  if (!this._events[type]) {\n    // Optimize the case of one listener. Don't need the extra array object.\n    this._events[type] = listener;\n  } else if (isArray(this._events[type])) {\n\n    // Check for listener leak\n    if (!this._events[type].warned) {\n      var m;\n      if (this._events.maxListeners !== undefined) {\n        m = this._events.maxListeners;\n      } else {\n        m = defaultMaxListeners;\n      }\n\n      if (m && m > 0 && this._events[type].length > m) {\n        this._events[type].warned = true;\n        console.error('(node) warning: possible EventEmitter memory ' +\n                      'leak detected. %d listeners added. ' +\n                      'Use emitter.setMaxListeners() to increase limit.',\n                      this._events[type].length);\n        console.trace();\n      }\n    }\n\n    // If we've already got an array, just append.\n    this._events[type].push(listener);\n  } else {\n    // Adding the second element, need to change to array.\n    this._events[type] = [this._events[type], listener];\n  }\n\n  return this;\n};\n\nEventEmitter.prototype.on = EventEmitter.prototype.addListener;\n\nEventEmitter.prototype.once = function(type, listener) {\n  var self = this;\n  self.on(type, function g() {\n    self.removeListener(type, g);\n    listener.apply(this, arguments);\n  });\n\n  return this;\n};\n\nEventEmitter.prototype.removeListener = function(type, listener) {\n  if ('function' !== typeof listener) {\n    throw new Error('removeListener only takes instances of Function');\n  }\n\n  // does not use listeners(), so no side effect of creating _events[type]\n  if (!this._events || !this._events[type]) return this;\n\n  var list = this._events[type];\n\n  if (isArray(list)) {\n    var i = list.indexOf(listener);\n    if (i < 0) return this;\n    list.splice(i, 1);\n    if (list.length == 0)\n      delete this._events[type];\n  } else if (this._events[type] === listener) {\n    delete this._events[type];\n  }\n\n  return this;\n};\n\nEventEmitter.prototype.removeAllListeners = function(type) {\n  // does not use listeners(), so no side effect of creating _events[type]\n  if (type && this._events && this._events[type]) this._events[type] = null;\n  return this;\n};\n\nEventEmitter.prototype.listeners = function(type) {\n  if (!this._events) this._events = {};\n  if (!this._events[type]) this._events[type] = [];\n  if (!isArray(this._events[type])) {\n    this._events[type] = [this._events[type]];\n  }\n  return this._events[type];\n};\n\n//@ sourceURL=events"
));

require.define("/node_modules/racer/lib/plugin.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar isServer, mergeAll, mergeProto, _ref, _require,\n  __slice = [].slice;\n\n_ref = require('./util'), mergeAll = _ref.mergeAll, isServer = _ref.isServer;\n\n_require = require;\n\nmodule.exports = {\n  use: function(plugin, options) {\n    if (typeof plugin === 'string') {\n      if (!isServer) {\n        return this;\n      }\n      plugin = _require(plugin);\n    }\n    this._plugins || (this._plugins = []);\n    if (-1 === this._plugins.indexOf(plugin)) {\n      this._plugins.push(plugin);\n      plugin(this, options);\n    }\n    return this;\n  },\n  mixin: function() {\n    var Klass, fn, mixin, name, server, type, _i, _len, _ref1,\n      _this = this;\n    for (_i = 0, _len = arguments.length; _i < _len; _i++) {\n      mixin = arguments[_i];\n      if (typeof mixin === 'string') {\n        if (!isServer) {\n          continue;\n        }\n        mixin = _require(mixin);\n      }\n      if (!(type = mixin.type)) {\n        throw new Error(\"Mixins require a type parameter\");\n      }\n      if (!(Klass = this[\"protected\"][type])) {\n        throw new Error(\"Cannot find racer.protected.\" + type);\n      }\n      if (Klass.mixins) {\n        Klass.mixins.push(mixin);\n      } else {\n        Klass.mixins = [mixin];\n        Klass.prototype.mixinEmit = function() {\n          var args, name;\n          name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n          return _this.emit.apply(_this, [type + ':' + name].concat(__slice.call(args)));\n        };\n      }\n      mergeAll(Klass, mixin[\"static\"]);\n      mergeProto(mixin.proto, Klass);\n      if (isServer && (server = mixin.server)) {\n        server = typeof server === 'string' ? _require(server) : mixin.server;\n        mergeProto(server, Klass);\n      }\n      _ref1 = mixin.events;\n      for (name in _ref1) {\n        fn = _ref1[name];\n        this.on(type + ':' + name, fn);\n      }\n      this.emit(type + ':mixin', Klass);\n    }\n    return this;\n  }\n};\n\nmergeProto = function(protoSpec, Klass) {\n  var descriptor, fn, groupName, key, methods, name, targetPrototype, value, _i, _len, _ref1;\n  targetPrototype = Klass.prototype;\n  for (name in protoSpec) {\n    descriptor = protoSpec[name];\n    if (typeof descriptor === 'function') {\n      targetPrototype[name] = descriptor;\n      continue;\n    }\n    fn = targetPrototype[name] = descriptor.fn;\n    for (key in descriptor) {\n      value = descriptor[key];\n      switch (key) {\n        case 'fn':\n          continue;\n        case 'type':\n          _ref1 = value.split(',');\n          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {\n            groupName = _ref1[_i];\n            methods = Klass[groupName] || (Klass[groupName] = {});\n            methods[name] = fn;\n          }\n          break;\n        default:\n          fn[key] = value;\n      }\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/plugin.js"
));

require.define("/node_modules/racer/lib/Model.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar EventEmitter, Memory, Model, eventListener, eventRegExp, mergeAll;\n\nEventEmitter = require('events').EventEmitter;\n\nMemory = require('./Memory');\n\neventRegExp = require('./path').eventRegExp;\n\nmergeAll = require('./util').mergeAll;\n\nModel = module.exports = function() {\n  this._memory = new Memory;\n  this._count = {\n    id: 0\n  };\n  this.setMaxListeners(0);\n  this.mixinEmit('init', this);\n};\n\nmergeAll(Model.prototype, EventEmitter.prototype, {\n  id: function() {\n    return '$_' + this._clientId + '_' + (this._count.id++).toString(36);\n  },\n  connected: true,\n  canConnect: true,\n  _setSocket: function(socket) {\n    var onConnected,\n      _this = this;\n    this.socket = socket;\n    this.mixinEmit('socket', this, socket);\n    this.disconnect = function() {\n      return socket.disconnect();\n    };\n    this.connect = function(cb) {\n      if (cb) {\n        socket.once('connect', cb);\n      }\n      return socket.socket.connect();\n    };\n    this.canConnect = true;\n    socket.on('fatalErr', function(msg) {\n      _this.canConnect = false;\n      _this.emit('canConnect', false);\n      return socket.disconnect();\n    });\n    this.connected = false;\n    onConnected = function() {\n      _this.emit('connected', _this.connected);\n      return _this.emit('connectionStatus', _this.connected, _this.canConnect);\n    };\n    socket.on('connect', function() {\n      _this.connected = true;\n      return onConnected();\n    });\n    socket.on('disconnect', function() {\n      _this.connected = false;\n      return setTimeout(onConnected, 400);\n    });\n    return socket.on('connect_failed', onConnected);\n  },\n  at: function(segment, absolute) {\n    var at;\n    return Object.create(this, {\n      _at: {\n        value: (at = this._at) && !absolute ? segment === '' ? at : at + '.' + segment : segment.toString()\n      }\n    });\n  },\n  parent: function(levels) {\n    var at, segments;\n    if (levels == null) {\n      levels = 1;\n    }\n    if (!(at = this._at)) {\n      return this;\n    }\n    segments = at.split('.');\n    return this.at(segments.slice(0, segments.length - levels).join('.'), true);\n  },\n  path: function() {\n    return this._at || '';\n  },\n  leaf: function(path) {\n    var i;\n    if (path == null) {\n      path = this._at || '';\n    }\n    i = path.lastIndexOf('.');\n    return path.substr(i + 1);\n  },\n  _on: EventEmitter.prototype.on,\n  on: function(type, pattern, callback) {\n    var listener;\n    this._on(type, listener = eventListener(type, pattern, callback, this._at));\n    return listener;\n  },\n  _once: EventEmitter.prototype.once,\n  once: function(type, pattern, callback) {\n    var g, listener,\n      _this = this;\n    listener = eventListener(type, pattern, callback, this._at);\n    this._on(type, g = function() {\n      var matches;\n      matches = listener.apply(null, arguments);\n      if (matches) {\n        return _this.removeListener(type, g);\n      }\n    });\n    return listener;\n  },\n  pass: function(arg) {\n    return Object.create(this, {\n      _pass: {\n        value: arg\n      }\n    });\n  }\n});\n\nModel.prototype.addListener = Model.prototype.on;\n\neventListener = function(method, pattern, callback, at) {\n  var re;\n  if (at) {\n    if (typeof pattern === 'string') {\n      pattern = at + '.' + pattern;\n    } else if (pattern.call) {\n      callback = pattern;\n      pattern = at;\n    } else {\n      throw new Error('Unsupported event pattern on scoped model');\n    }\n  } else {\n    if (pattern.call) {\n      return pattern;\n    }\n  }\n  re = eventRegExp(pattern);\n  return function(methodArgs, out, isLocal, pass) {\n    var args, argsForEmit, path;\n    path = methodArgs[0];\n    if (re.test(path)) {\n      args = methodArgs.slice(1);\n      argsForEmit = re.exec(path).slice(1).concat(args);\n      argsForEmit.push(out, isLocal, pass);\n      callback.apply(null, argsForEmit);\n      return true;\n    }\n  };\n};\n\n//@ sourceURL=/node_modules/racer/lib/Model.js"
));

require.define("/node_modules/racer/lib/Memory.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Memory, clone, create, createArray, createObject, isPrivate, lookup, lookupSet, _ref,\n  __slice = [].slice;\n\n_ref = require('./util/speculative'), clone = _ref.clone, create = _ref.create, createObject = _ref.createObject, createArray = _ref.createArray;\n\nisPrivate = require('./path').isPrivate;\n\nMemory = module.exports = function() {\n  this.flush();\n};\n\nMemory.prototype = {\n  flush: function() {\n    this._data = {\n      world: {}\n    };\n    return this.version = 0;\n  },\n  init: function(obj) {\n    this._data = {\n      world: obj.data\n    };\n    return this.version = obj.ver;\n  },\n  eraseNonPrivate: function() {\n    var path, world;\n    world = this._data.world;\n    for (path in world) {\n      if (!isPrivate(path)) {\n        delete world[path];\n      }\n    }\n  },\n  toJSON: function() {\n    return {\n      data: this._data.world,\n      ver: this.version\n    };\n  },\n  setVersion: function(ver) {\n    return this.version = Math.max(this.version, ver);\n  },\n  get: function(path, data, getRef) {\n    data || (data = this._data);\n    data.$deref = null;\n    if (path) {\n      return lookup(path, data, getRef);\n    }\n    return data.world;\n  },\n  set: function(path, value, ver, data) {\n    var obj, parent, prop, segments, _ref1;\n    this.setVersion(ver);\n    _ref1 = lookupSet(path, data || this._data, ver == null, 'object'), obj = _ref1[0], parent = _ref1[1], prop = _ref1[2];\n    parent[prop] = value;\n    segments = path.split('.');\n    if (segments.length === 2 && value && value.constructor === Object) {\n      if (value.id == null) {\n        value.id = segments[1];\n      }\n    }\n    return obj;\n  },\n  del: function(path, ver, data) {\n    var grandparent, index, obj, parent, parentClone, parentPath, parentProp, prop, speculative, _ref1, _ref2;\n    this.setVersion(ver);\n    data || (data = this._data);\n    speculative = ver == null;\n    _ref1 = lookupSet(path, data, speculative), obj = _ref1[0], parent = _ref1[1], prop = _ref1[2];\n    if (ver != null) {\n      if (parent) {\n        delete parent[prop];\n      }\n      return obj;\n    }\n    if (!parent) {\n      return obj;\n    }\n    if (~(index = path.lastIndexOf('.'))) {\n      parentPath = path.substr(0, index);\n      _ref2 = lookupSet(parentPath, data, speculative), parent = _ref2[0], grandparent = _ref2[1], parentProp = _ref2[2];\n    } else {\n      parent = data.world;\n      grandparent = data;\n      parentProp = 'world';\n    }\n    parentClone = clone(parent);\n    delete parentClone[prop];\n    grandparent[parentProp] = parentClone;\n    return obj;\n  },\n  push: function() {\n    var args, arr, data, path, ver, _i;\n    path = arguments[0], args = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), ver = arguments[_i++], data = arguments[_i++];\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    return arr.push.apply(arr, args);\n  },\n  unshift: function() {\n    var args, arr, data, path, ver, _i;\n    path = arguments[0], args = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), ver = arguments[_i++], data = arguments[_i++];\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    return arr.unshift.apply(arr, args);\n  },\n  insert: function() {\n    var args, arr, data, index, len, path, ver, _i;\n    path = arguments[0], index = arguments[1], args = 5 <= arguments.length ? __slice.call(arguments, 2, _i = arguments.length - 2) : (_i = 2, []), ver = arguments[_i++], data = arguments[_i++];\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    len = arr.length;\n    arr.splice.apply(arr, [index, 0].concat(__slice.call(args)));\n    return arr.length;\n  },\n  pop: function(path, ver, data) {\n    var arr;\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    return arr.pop();\n  },\n  shift: function(path, ver, data) {\n    var arr;\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    return arr.shift();\n  },\n  remove: function(path, index, howMany, ver, data) {\n    var arr, len;\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    len = arr.length;\n    return arr.splice(index, howMany);\n  },\n  move: function(path, from, to, howMany, ver, data) {\n    var arr, len, values;\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    len = arr.length;\n    from = +from;\n    to = +to;\n    if (from < 0) {\n      from += len;\n    }\n    if (to < 0) {\n      to += len;\n    }\n    values = arr.splice(from, howMany);\n    arr.splice.apply(arr, [to, 0].concat(__slice.call(values)));\n    return values;\n  }\n};\n\nlookup = function(path, data, getRef) {\n  var curr, i, len, prop, props, refOut, _ref1;\n  props = path.split('.');\n  len = props.length;\n  i = 0;\n  curr = data.world;\n  path = '';\n  while (i < len) {\n    prop = props[i++];\n    curr = curr[prop];\n    path = path ? path + '.' + prop : prop;\n    if (typeof curr === 'function') {\n      if (getRef && i === len) {\n        break;\n      }\n      _ref1 = refOut = curr(lookup, data, path, props, len, i), curr = _ref1[0], path = _ref1[1], i = _ref1[2];\n    }\n    if (curr == null) {\n      break;\n    }\n  }\n  return curr;\n};\n\nlookupSet = function(path, data, speculative, pathType) {\n  var curr, firstProp, i, len, parent, prop, props;\n  props = path.split('.');\n  len = props.length;\n  i = 0;\n  curr = data.world = speculative ? create(data.world) : data.world;\n  firstProp = props[0];\n  while (i < len) {\n    prop = props[i++];\n    parent = curr;\n    curr = curr[prop];\n    if (curr != null) {\n      if (speculative && typeof curr === 'object') {\n        curr = parent[prop] = create(curr);\n      }\n    } else {\n      if (pathType === 'object') {\n        if (i !== 1 && /^[0-9]+$/.test(props[i])) {\n          curr = parent[prop] = speculative ? createArray() : [];\n        } else if (i !== len) {\n          curr = parent[prop] = speculative ? createObject() : {};\n          if (i === 2 && !isPrivate(firstProp)) {\n            curr.id = prop;\n          }\n        }\n      } else if (pathType === 'array') {\n        if (i === len) {\n          curr = parent[prop] = speculative ? createArray() : [];\n        } else {\n          curr = parent[prop] = speculative ? createObject() : {};\n          if (i === 2 && !isPrivate(firstProp)) {\n            curr.id = prop;\n          }\n        }\n      } else {\n        if (i !== len) {\n          parent = curr = void 0;\n        }\n        return [curr, parent, prop];\n      }\n    }\n  }\n  return [curr, parent, prop];\n};\n\n//@ sourceURL=/node_modules/racer/lib/Memory.js"
));

require.define("/node_modules/racer/lib/util/speculative.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar merge, util;\n\nmerge = (util = require('./index')).merge;\n\nutil.speculative = module.exports = {\n  createObject: function() {\n    return {\n      $spec: true\n    };\n  },\n  createArray: function() {\n    var obj;\n    obj = [];\n    obj.$spec = true;\n    return obj;\n  },\n  create: function(proto) {\n    var obj;\n    if (proto.$spec) {\n      return proto;\n    }\n    if (Array.isArray(proto)) {\n      obj = proto.slice();\n      obj.$spec = true;\n      return obj;\n    }\n    return Object.create(proto, {\n      $spec: {\n        value: true\n      }\n    });\n  },\n  clone: function(proto) {\n    var obj;\n    if (Array.isArray(proto)) {\n      obj = proto.slice();\n      obj.$spec = true;\n      return obj;\n    }\n    return merge({}, proto);\n  },\n  isSpeculative: function(obj) {\n    return obj && obj.$spec;\n  },\n  identifier: '$spec'\n};\n\n//@ sourceURL=/node_modules/racer/lib/util/speculative.js"
));

require.define("/node_modules/racer/lib/path.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\n\nmodule.exports = {\n  isPrivate: function(name) {\n    return /(?:^_)|(?:\\._)/.test(name);\n  },\n  eventRegExp: function(pattern) {\n    if (pattern instanceof RegExp) {\n      return pattern;\n    } else {\n      return new RegExp('^' + pattern.replace(/[,.*]/g, function(match, index) {\n        if (match === '.') {\n          return '\\\\.';\n        } else if (match === ',') {\n          return '|';\n        } else if (pattern.length - index === 1) {\n          return '(.+)';\n        } else {\n          return '([^.]+)';\n        }\n      }) + '$');\n    }\n  },\n  regExp: function(pattern) {\n    if (!pattern) {\n      return /^/;\n    } else {\n      return new RegExp('^' + pattern.replace(/[.*]/g, function(match, index) {\n        if (match === '.') {\n          return '\\\\.';\n        } else {\n          return '[^.]+';\n        }\n      }) + '(?:\\\\.|$)');\n    }\n  },\n  regExpPathOrParent: function(path) {\n    var i, p, segment, source;\n    p = '';\n    source = ((function() {\n      var _i, _len, _ref, _results;\n      _ref = path.split('.');\n      _results = [];\n      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {\n        segment = _ref[i];\n        _results.push(\"(?:\" + (p += i ? '\\\\.' + segment : segment) + \")\");\n      }\n      return _results;\n    })()).join('|');\n    return new RegExp('^(?:' + source + ')$');\n  },\n  regExpPathsOrChildren: function(paths) {\n    var path, source;\n    source = ((function() {\n      var _i, _len, _results;\n      _results = [];\n      for (_i = 0, _len = paths.length; _i < _len; _i++) {\n        path = paths[_i];\n        _results.push(\"(?:\" + path + \"(?:\\\\..+)?)\");\n      }\n      return _results;\n    })()).join('|');\n    return new RegExp('^(?:' + source + ')$');\n  },\n  lookup: function(path, obj) {\n    var parts, prop, _i, _len;\n    if (path.indexOf('.') === -1) {\n      return obj[path];\n    }\n    parts = path.split('.');\n    for (_i = 0, _len = parts.length; _i < _len; _i++) {\n      prop = parts[_i];\n      if (obj == null) {\n        return;\n      }\n      obj = obj[prop];\n    }\n    return obj;\n  },\n  assign: function(obj, path, val) {\n    var i, lastIndex, parts, prop, _i, _len;\n    parts = path.split('.');\n    lastIndex = parts.length - 1;\n    for (i = _i = 0, _len = parts.length; _i < _len; i = ++_i) {\n      prop = parts[i];\n      if (i === lastIndex) {\n        obj[prop] = val;\n      } else {\n        obj = obj[prop] || (obj[prop] = {});\n      }\n    }\n  },\n  split: function(path) {\n    return path.split(/\\.?[(*]\\.?/);\n  },\n  expand: function(path) {\n    var lastClosed, match, out, paths, pre, stack, token, val;\n    path = path.replace(/[\\s\\n]/g, '');\n    if (!~path.indexOf('(')) {\n      return [path];\n    }\n    stack = {\n      paths: paths = [''],\n      out: out = []\n    };\n    while (path) {\n      if (!(match = /^([^,()]*)([,()])(.*)/.exec(path))) {\n        return (function() {\n          var _i, _len, _results;\n          _results = [];\n          for (_i = 0, _len = out.length; _i < _len; _i++) {\n            val = out[_i];\n            _results.push(val + path);\n          }\n          return _results;\n        })();\n      }\n      pre = match[1];\n      token = match[2];\n      path = match[3];\n      if (pre) {\n        paths = (function() {\n          var _i, _len, _results;\n          _results = [];\n          for (_i = 0, _len = paths.length; _i < _len; _i++) {\n            val = paths[_i];\n            _results.push(val + pre);\n          }\n          return _results;\n        })();\n        if (token !== '(') {\n          out = lastClosed ? paths : out.concat(paths);\n        }\n      }\n      lastClosed = false;\n      if (token === ',') {\n        stack.out = stack.out.concat(paths);\n        paths = stack.paths;\n      } else if (token === '(') {\n        stack = {\n          parent: stack,\n          paths: paths,\n          out: out = []\n        };\n      } else if (token === ')') {\n        lastClosed = true;\n        paths = out = stack.out.concat(paths);\n        stack = stack.parent;\n      }\n    }\n    return out;\n  },\n  triplet: function(path) {\n    var parts;\n    parts = path.split('.');\n    return [parts[0], parts[1], parts.slice(2).join('.')];\n  },\n  subPathToDoc: function(path) {\n    return path.split('.').slice(0, 2).join('.');\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/path.js"
));

require.define("/node_modules/racer/lib/mutators/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar exports, mixinModel, mixinStore;\n\nmixinModel = require('./mutators.Model');\n\nmixinStore = __dirname + '/mutators.Store';\n\nexports = module.exports = function(racer) {\n  return racer.mixin(mixinModel, mixinStore);\n};\n\nexports.useWith = {\n  server: true,\n  browser: true\n};\n\n//@ sourceURL=/node_modules/racer/lib/mutators/index.js"
));

require.define("/node_modules/racer/lib/mutators/mutators.Model.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar ACCESSOR, ARRAY_MUTATOR, Async, BASIC_MUTATOR, COMPOUND_MUTATOR, Memory,\n  __slice = [].slice;\n\nAsync = require('./Async');\n\nMemory = require('../Memory');\n\nmodule.exports = {\n  type: 'Model',\n  \"static\": {\n    ACCESSOR: ACCESSOR = 'accessor',\n    BASIC_MUTATOR: BASIC_MUTATOR = 'mutator,basicMutator',\n    COMPOUND_MUTATOR: COMPOUND_MUTATOR = 'mutator,compoundMutator',\n    ARRAY_MUTATOR: ARRAY_MUTATOR = 'mutator,arrayMutator'\n  },\n  events: {\n    init: function(model) {\n      var memory;\n      memory = new Memory;\n      return model.async = new Async({\n        nextTxnId: function() {\n          return model._nextTxnId();\n        },\n        get: function(path, callback) {\n          return model._fetch([path], function(err, data) {\n            var item, items, len, out, subpath, value, _i, _len, _ref;\n            if (err) {\n              return callback(err);\n            }\n            if (!((items = data.data) && (len = items.length))) {\n              return callback();\n            }\n            if (len === 1 && (item = items[0]) && item[0] === path) {\n              return callback(null, item[1]);\n            }\n            for (_i = 0, _len = items.length; _i < _len; _i++) {\n              _ref = items[_i], subpath = _ref[0], value = _ref[1];\n              memory.set(subpath, value, -1);\n            }\n            out = memory.get(path);\n            memory.flush();\n            return callback(null, out);\n          });\n        },\n        commit: function(txn, callback) {\n          return model._asyncCommit(txn, callback);\n        }\n      });\n    }\n  },\n  proto: {\n    get: {\n      type: ACCESSOR,\n      fn: function(path) {\n        var at;\n        if (at = this._at) {\n          path = path ? at + '.' + path : at;\n        }\n        return this._memory.get(path, this._specModel());\n      }\n    },\n    set: {\n      type: BASIC_MUTATOR,\n      fn: function(path, value, callback) {\n        var at, len;\n        if (at = this._at) {\n          len = arguments.length;\n          path = len === 1 || len === 2 && typeof value === 'function' ? (callback = value, value = path, at) : at + '.' + path;\n        }\n        return this._addOpAsTxn('set', [path, value], callback);\n      }\n    },\n    del: {\n      type: BASIC_MUTATOR,\n      fn: function(path, callback) {\n        var at;\n        if (at = this._at) {\n          path = typeof path === 'string' ? at + '.' + path : (callback = path, at);\n        }\n        return this._addOpAsTxn('del', [path], callback);\n      }\n    },\n    setNull: {\n      type: COMPOUND_MUTATOR,\n      fn: function(path, value, callback) {\n        var len, obj;\n        len = arguments.length;\n        obj = this._at && len === 1 || len === 2 && typeof value === 'function' ? this.get() : this.get(path);\n        if (obj != null) {\n          return obj;\n        }\n        if (len === 1) {\n          return this.set(path);\n        } else if (len === 2) {\n          return this.set(path, value);\n        } else {\n          return this.set(path, value, callback);\n        }\n      }\n    },\n    incr: {\n      type: COMPOUND_MUTATOR,\n      fn: function(path, byNum, callback) {\n        var value;\n        if (typeof path !== 'string') {\n          callback = byNum;\n          byNum = path;\n          path = '';\n        }\n        if (typeof byNum === 'function') {\n          callback = byNum;\n          byNum = 1;\n        } else if (typeof byNum !== 'number') {\n          byNum = 1;\n        }\n        value = (this.get(path) || 0) + byNum;\n        if (path) {\n          this.set(path, value, callback);\n          return value;\n        }\n        if (callback) {\n          this.set(value, callback);\n        } else {\n          this.set(value);\n        }\n        return value;\n      }\n    },\n    push: {\n      type: ARRAY_MUTATOR,\n      insertArgs: 1,\n      fn: function() {\n        var args, at, callback, path;\n        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        if (at = this._at) {\n          if (typeof (path = args[0]) === 'string' && typeof this.get() === 'object') {\n            args[0] = at + '.' + path;\n          } else {\n            args.unshift(at);\n          }\n        }\n        if (typeof args[args.length - 1] === 'function') {\n          callback = args.pop();\n        }\n        return this._addOpAsTxn('push', args, callback);\n      }\n    },\n    unshift: {\n      type: ARRAY_MUTATOR,\n      insertArgs: 1,\n      fn: function() {\n        var args, at, callback, path;\n        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        if (at = this._at) {\n          if (typeof (path = args[0]) === 'string' && typeof this.get() === 'object') {\n            args[0] = at + '.' + path;\n          } else {\n            args.unshift(at);\n          }\n        }\n        if (typeof args[args.length - 1] === 'function') {\n          callback = args.pop();\n        }\n        return this._addOpAsTxn('unshift', args, callback);\n      }\n    },\n    insert: {\n      type: ARRAY_MUTATOR,\n      indexArgs: [1],\n      insertArgs: 2,\n      fn: function() {\n        var args, at, callback, match, path;\n        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        if (at = this._at) {\n          if (typeof (path = args[0]) === 'string' && isNaN(path)) {\n            args[0] = at + '.' + path;\n          } else {\n            args.unshift(at);\n          }\n        }\n        if (match = /^(.*)\\.(\\d+)$/.exec(args[0])) {\n          args[0] = match[1];\n          args.splice(1, 0, match[2]);\n        }\n        if (typeof args[args.length - 1] === 'function') {\n          callback = args.pop();\n        }\n        return this._addOpAsTxn('insert', args, callback);\n      }\n    },\n    pop: {\n      type: ARRAY_MUTATOR,\n      fn: function(path, callback) {\n        var at;\n        if (at = this._at) {\n          path = typeof path === 'string' ? at + '.' + path : (callback = path, at);\n        }\n        return this._addOpAsTxn('pop', [path], callback);\n      }\n    },\n    shift: {\n      type: ARRAY_MUTATOR,\n      fn: function(path, callback) {\n        var at;\n        if (at = this._at) {\n          path = typeof path === 'string' ? at + '.' + path : (callback = path, at);\n        }\n        return this._addOpAsTxn('shift', [path], callback);\n      }\n    },\n    remove: {\n      type: ARRAY_MUTATOR,\n      indexArgs: [1],\n      fn: function(path, start, howMany, callback) {\n        var at, match;\n        if (at = this._at) {\n          path = typeof path === 'string' && isNaN(path) ? at + '.' + path : (callback = howMany, howMany = start, start = path, at);\n        }\n        if (match = /^(.*)\\.(\\d+)$/.exec(path)) {\n          callback = howMany;\n          howMany = start;\n          start = match[2];\n          path = match[1];\n        }\n        if (typeof howMany !== 'number') {\n          callback = howMany;\n          howMany = 1;\n        }\n        return this._addOpAsTxn('remove', [path, start, howMany], callback);\n      }\n    },\n    move: {\n      type: ARRAY_MUTATOR,\n      indexArgs: [1, 2],\n      fn: function(path, from, to, howMany, callback) {\n        var at, match;\n        if (at = this._at) {\n          path = typeof path === 'string' && isNaN(path) ? at + '.' + path : (callback = howMany, howMany = to, to = from, from = path, at);\n        }\n        if (match = /^(.*)\\.(\\d+)$/.exec(path)) {\n          callback = howMany;\n          howMany = to;\n          to = from;\n          from = match[2];\n          path = match[1];\n        }\n        if (typeof howMany !== 'number') {\n          callback = howMany;\n          howMany = 1;\n        }\n        return this._addOpAsTxn('move', [path, from, to, howMany], callback);\n      }\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/mutators/mutators.Model.js"
));

require.define("/node_modules/racer/lib/mutators/Async.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Async, AsyncAtomic, MAX_RETRIES, RETRY_DELAY, empty, transaction;\n\ntransaction = require('../transaction');\n\nAsync = module.exports = function(options) {\n  var nextTxnId;\n  if (options == null) {\n    options = {};\n  }\n  this.get = options.get;\n  this._commit = options.commit;\n  if (nextTxnId = options.nextTxnId) {\n    this._nextTxnId = function(callback) {\n      return callback(null, '#' + nextTxnId());\n    };\n  }\n};\n\nAsync.prototype = {\n  set: function(path, value, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'set',\n        args: [path, value]\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  del: function(path, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'del',\n        args: [path]\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  push: function(path, items, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'push',\n        args: [path].concat(items)\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  unshift: function(path, items, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'unshift',\n        args: [path].concat(items)\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  insert: function(path, index, items, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'insert',\n        args: [path, index].concat(items)\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  pop: function(path, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'pop',\n        args: [path]\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  shift: function(path, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'shift',\n        args: [path]\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  remove: function(path, start, howMany, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'remove',\n        args: [path, start, howMany]\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  move: function(path, from, to, howMany, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'move',\n        args: [path, from, to, howMany]\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  incr: function(path, byNum, callback) {\n    var tryVal;\n    if (typeof byNum === 'function') {\n      callback = byNum;\n      byNum = 1;\n    } else {\n      if (byNum == null) {\n        byNum = 1;\n      }\n      callback || (callback = empty);\n    }\n    tryVal = null;\n    return this.retry(function(atomic) {\n      return atomic.get(path, function(val) {\n        return atomic.set(path, tryVal = (val || 0) + byNum);\n      });\n    }, function(err) {\n      return callback(err, tryVal);\n    });\n  },\n  setNull: function(path, value, callback) {\n    var tryVal;\n    tryVal = null;\n    return this.retry(function(atomic) {\n      return atomic.get(path, function(val) {\n        if (val != null) {\n          return tryVal = val;\n        }\n        return atomic.set(path, tryVal = value);\n      });\n    }, function(err) {\n      return callback(err, tryVal);\n    });\n  },\n  retry: function(fn, callback) {\n    var atomic, retries;\n    retries = MAX_RETRIES;\n    atomic = new AsyncAtomic(this, function(err) {\n      if (!err) {\n        return typeof callback === \"function\" ? callback() : void 0;\n      }\n      if (!retries--) {\n        return typeof callback === \"function\" ? callback('maxRetries') : void 0;\n      }\n      atomic._reset();\n      return setTimeout(fn, RETRY_DELAY, atomic);\n    });\n    return fn(atomic);\n  }\n};\n\nAsync.MAX_RETRIES = MAX_RETRIES = 20;\n\nAsync.RETRY_DELAY = RETRY_DELAY = 100;\n\nempty = function() {};\n\nAsyncAtomic = function(async, cb) {\n  this.async = async;\n  this.cb = cb;\n  this.minVer = 0;\n  this.count = 0;\n};\n\nAsyncAtomic.prototype = {\n  _reset: function() {\n    this.minVer = 0;\n    return this.count = 0;\n  },\n  get: function(path, callback) {\n    var cb, minVer,\n      _this = this;\n    minVer = this.minVer;\n    cb = this.cb;\n    return this.async.get(path, function(err, value, ver) {\n      if (err) {\n        return cb(err);\n      }\n      _this.minVer = minVer ? Math.min(minVer, ver) : ver;\n      return typeof callback === \"function\" ? callback(value) : void 0;\n    });\n  },\n  set: function(path, value, callback) {\n    var cb,\n      _this = this;\n    this.count++;\n    cb = this.cb;\n    return this.async.set(path, value, this.minVer, function(err, value) {\n      if (err) {\n        return cb(err);\n      }\n      if (typeof callback === \"function\") {\n        callback(null, value);\n      }\n      if (!--_this.count) {\n        return cb();\n      }\n    });\n  },\n  del: function(path, callback) {\n    var cb,\n      _this = this;\n    this.count++;\n    cb = this.cb;\n    return this.async.del(path, this.minVer, function(err) {\n      if (err) {\n        return cb(err);\n      }\n      if (typeof callback === \"function\") {\n        callback();\n      }\n      if (!--_this.count) {\n        return cb();\n      }\n    });\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/mutators/Async.js"
));

require.define("/node_modules/racer/lib/transaction.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\n\nmodule.exports = {\n  create: function(obj) {\n    var txn;\n    if (obj.ops) {\n      txn = [obj.ver, obj.id, obj.ops];\n    } else {\n      txn = [obj.ver, obj.id, obj.method, obj.args];\n    }\n    return txn;\n  },\n  getVer: function(txn) {\n    return txn[0];\n  },\n  setVer: function(txn, val) {\n    return txn[0] = val;\n  },\n  getId: function(txn) {\n    return txn[1];\n  },\n  setId: function(txn, id) {\n    return txn[1] = id;\n  },\n  clientIdAndVer: function(txn) {\n    var res;\n    res = this.getId(txn).split('.');\n    res[1] = parseInt(res[1], 10);\n    return res;\n  },\n  getMethod: function(txn) {\n    return txn[2];\n  },\n  setMethod: function(txn, name) {\n    return txn[2] = name;\n  },\n  getArgs: function(txn) {\n    return txn[3];\n  },\n  copyArgs: function(txn) {\n    return this.getArgs(txn).slice();\n  },\n  setArgs: function(txn, vals) {\n    return txn[3] = vals;\n  },\n  getPath: function(txn) {\n    return this.getArgs(txn)[0];\n  },\n  setPath: function(txn, val) {\n    return this.getArgs(txn)[0] = val;\n  },\n  getMeta: function(txn) {\n    return txn[4];\n  },\n  setMeta: function(txn, vals) {\n    return txn[4] = vals;\n  },\n  getClientId: function(txn) {\n    return this.getId(txn).split('.')[0];\n  },\n  setClientId: function(txn, newClientId) {\n    var clientId, num, _ref;\n    _ref = this.getId(txn).split('.'), clientId = _ref[0], num = _ref[1];\n    this.setId(txn, newClientId + '.' + num);\n    return newClientId;\n  },\n  pathConflict: function(pathA, pathB) {\n    var pathALen, pathBLen;\n    if (pathA === pathB) {\n      return 'equal';\n    }\n    pathALen = pathA.length;\n    pathBLen = pathB.length;\n    if (pathALen === pathBLen) {\n      return false;\n    }\n    if (pathALen > pathBLen) {\n      return pathA.charAt(pathBLen) === '.' && pathA.slice(0, pathBLen) === pathB && 'child';\n    }\n    return pathB.charAt(pathALen) === '.' && pathB.slice(0, pathALen) === pathA && 'parent';\n  },\n  ops: function(txn, ops) {\n    if (ops !== void 0) {\n      txn[2] = ops;\n    }\n    return txn[2];\n  },\n  isCompound: function(txn) {\n    return Array.isArray(txn[2]);\n  },\n  op: {\n    create: function(obj) {\n      var op;\n      op = [obj.method, obj.args];\n      return op;\n    },\n    getMethod: function(op) {\n      return op[0];\n    },\n    setMethod: function(op, name) {\n      return op[0] = name;\n    },\n    getArgs: function(op) {\n      return op[1];\n    },\n    setArgs: function(op, vals) {\n      return op[1] = vals;\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/transaction.js"
));

require.define("/node_modules/racer/lib/refs/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar createRef, createRefList, derefPath, diffArrays, equal, exports, isPrivate, isServer, mixin, racer, regExpPathOrParent, regExpPathsOrChildren, _ref, _ref1,\n  __slice = [].slice;\n\n_ref = require('../path'), isPrivate = _ref.isPrivate, regExpPathOrParent = _ref.regExpPathOrParent, regExpPathsOrChildren = _ref.regExpPathsOrChildren;\n\nderefPath = require('./util').derefPath;\n\ncreateRef = require('./ref');\n\ncreateRefList = require('./refList');\n\ndiffArrays = require('../diffMatchPatch').diffArrays;\n\n_ref1 = require('../util'), isServer = _ref1.isServer, equal = _ref1.equal;\n\nracer = require('../racer');\n\nexports = module.exports = function(racer) {\n  return racer.mixin(mixin);\n};\n\nexports.useWith = {\n  server: true,\n  browser: true\n};\n\nmixin = {\n  type: 'Model',\n  server: __dirname + '/refs.server',\n  events: {\n    init: function(model) {\n      var Model, memory, method, _fn;\n      model._root = model;\n      model._refsToBundle = [];\n      model._fnsToBundle = [];\n      Model = model.constructor;\n      _fn = function(method) {\n        return model.on(method, function(_arg) {\n          var path;\n          path = _arg[0];\n          return model.emit('mutator', method, path, arguments);\n        });\n      };\n      for (method in Model.mutator) {\n        _fn(method);\n      }\n      memory = model._memory;\n      return model.on('beforeTxn', function(method, args) {\n        var data, fn, obj, path;\n        if (path = args[0]) {\n          obj = memory.get(path, data = model._specModel());\n          if (fn = data.$deref) {\n            args[0] = fn(method, args, model, obj);\n          }\n        }\n      });\n    },\n    bundle: function(model) {\n      var from, get, item, onLoad, _i, _j, _len, _len1, _ref2, _ref3, _ref4;\n      onLoad = model._onLoad;\n      _ref2 = model._refsToBundle;\n      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {\n        _ref3 = _ref2[_i], from = _ref3[0], get = _ref3[1], item = _ref3[2];\n        if (model._getRef(from) === get) {\n          onLoad.push(item);\n        }\n      }\n      _ref4 = model._fnsToBundle;\n      for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {\n        item = _ref4[_j];\n        if (item) {\n          onLoad.push(item);\n        }\n      }\n    }\n  },\n  proto: {\n    _getRef: function(path) {\n      return this._memory.get(path, this._specModel(), true);\n    },\n    _ensurePrivateRefPath: function(from, modelMethod) {\n      if (!isPrivate(this.dereference(from, true))) {\n        throw new Error(\"Cannot create \" + modelMethod + \" on public path '\" + from + \"'\");\n      }\n    },\n    dereference: function(path, getRef) {\n      var data;\n      if (getRef == null) {\n        getRef = false;\n      }\n      this._memory.get(path, data = this._specModel(), getRef);\n      return derefPath(data, path);\n    },\n    ref: function(from, to, key) {\n      return this._createRef(createRef, 'ref', from, to, key);\n    },\n    refList: function(from, to, key) {\n      return this._createRef(createRefList, 'refList', from, to, key);\n    },\n    _createRef: function(refFactory, modelMethod, from, to, key) {\n      var get, listener, model, previous, value;\n      if (this._at) {\n        key = to;\n        to = from;\n        from = this._at;\n      } else if (from._at) {\n        from = from._at;\n      }\n      if (to._at) {\n        to = to._at;\n      }\n      if (key && key._at) {\n        key = key._at;\n      }\n      model = this._root;\n      model._ensurePrivateRefPath(from, modelMethod);\n      get = refFactory(model, from, to, key);\n      listener = model.on('beforeTxn', function(method, args) {\n        if (method === 'set' && args[1] === get) {\n          args.cancelEmit = true;\n          model.removeListener('beforeTxn', listener);\n        }\n      });\n      previous = model.set(from, get);\n      value = model.get(from);\n      model.emit('set', [from, value], previous, true, void 0);\n      if (typeof this._onCreateRef === \"function\") {\n        this._onCreateRef(modelMethod, from, to, key, get);\n      }\n      return model.at(from);\n    },\n    fn: function() {\n      var fn, fullPath, i, input, inputs, model, path, _i, _j, _len;\n      inputs = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), fn = arguments[_i++];\n      for (i = _j = 0, _len = inputs.length; _j < _len; i = ++_j) {\n        input = inputs[i];\n        if (fullPath = input._at) {\n          inputs[i] = fullPath;\n        }\n      }\n      path = this._at || inputs.shift();\n      model = this._root;\n      model._ensurePrivateRefPath(path, 'fn');\n      if (typeof fn === 'string') {\n        fn = new Function('return ' + fn)();\n      }\n      return model._createFn(path, inputs, fn);\n    },\n    _createFn: function(path, inputs, fn, destroy, prevVal, currVal) {\n      var listener, model, reInput, reSelf, updateVal,\n        _this = this;\n      reSelf = regExpPathOrParent(path);\n      reInput = regExpPathsOrChildren(inputs);\n      destroy = typeof this._onCreateFn === \"function\" ? this._onCreateFn(path, inputs, fn) : void 0;\n      listener = this.on('mutator', function(mutator, mutatorPath, _arguments) {\n        if (_arguments[3] === listener) {\n          return;\n        }\n        if (reSelf.test(mutatorPath) && !equal(_this.get(path), currVal)) {\n          _this.removeListener('mutator', listener);\n          return typeof destroy === \"function\" ? destroy() : void 0;\n        }\n        if (reInput.test(mutatorPath)) {\n          return currVal = updateVal();\n        }\n      });\n      model = this.pass(listener);\n      return (updateVal = function() {\n        var input;\n        prevVal = currVal;\n        currVal = fn.apply(null, (function() {\n          var _i, _len, _results;\n          _results = [];\n          for (_i = 0, _len = inputs.length; _i < _len; _i++) {\n            input = inputs[_i];\n            _results.push(this.get(input));\n          }\n          return _results;\n        }).call(_this));\n        if (equal(prevVal, currVal)) {\n          return currVal;\n        }\n        model.set(path, currVal);\n        return currVal;\n      })();\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/refs/index.js"
));

require.define("/node_modules/racer/lib/refs/util.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\n\nmodule.exports = {\n  derefPath: function(data, to) {\n    return (typeof data.$deref === \"function\" ? data.$deref() : void 0) || to;\n  },\n  lookupPath: function(path, props, i) {\n    return [path].concat(props.slice(i)).join('.');\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/refs/util.js"
));

require.define("/node_modules/racer/lib/refs/ref.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Model, addListener, derefPath, eventRegExp, exports, lookupPath, setupRefWithKey, setupRefWithoutKey, _ref;\n\neventRegExp = require('../path').eventRegExp;\n\n_ref = require('./util'), derefPath = _ref.derefPath, lookupPath = _ref.lookupPath;\n\nModel = require('../Model');\n\nexports = module.exports = function(model, from, to, key) {\n  if (!from) {\n    throw new Error('Missing `from` in `model.ref(from, to, key)`');\n  }\n  if (!to) {\n    throw new Error('Missing `to` in `model.ref(from, to, key)`');\n  }\n  if (key) {\n    return setupRefWithKey(model, from, to, key);\n  }\n  return setupRefWithoutKey(model, from, to);\n};\n\nsetupRefWithKey = function(model, from, to, key) {\n  var getter, listeners;\n  listeners = [];\n  getter = function(lookup, data, path, props, len, i) {\n    var curr, currPath, dereffed;\n    lookup(to, data);\n    dereffed = derefPath(data, to) + '.';\n    data.$deref = null;\n    dereffed += lookup(key, data);\n    curr = lookup(dereffed, data);\n    currPath = lookupPath(dereffed, props, i);\n    data.$deref = function(method) {\n      if (i === len && method in Model.basicMutator) {\n        return path;\n      } else {\n        return currPath;\n      }\n    };\n    return [curr, currPath, i];\n  };\n  addListener(model, from, getter, listeners, \"\" + to + \".*\", function(match) {\n    var index, keyPath, remainder;\n    keyPath = model.get(key) + '';\n    remainder = match[1];\n    if (remainder === keyPath) {\n      return from;\n    }\n    index = keyPath.length;\n    if (remainder.slice(0, index + 1 || 9e9) === keyPath + '.') {\n      remainder = remainder.slice(index + 1);\n      return from + '.' + remainder;\n    }\n    return null;\n  });\n  addListener(model, from, getter, listeners, key, function(match, mutator, args) {\n    if (mutator === 'set') {\n      args[1] = model.get(to + '.' + args[1]);\n      args.out = model.get(to + '.' + args.out);\n    } else if (mutator === 'del') {\n      args.out = model.get(to + '.' + args.out);\n    }\n    return from;\n  });\n  return getter;\n};\n\nsetupRefWithoutKey = function(model, from, to) {\n  var getter, listeners;\n  listeners = [];\n  getter = function(lookup, data, path, props, len, i) {\n    var curr, currPath, dereffed;\n    curr = lookup(to, data);\n    dereffed = derefPath(data, to);\n    currPath = lookupPath(dereffed, props, i);\n    data.$deref = function(method) {\n      if (i === len && method in Model.basicMutator) {\n        return path;\n      } else {\n        return currPath;\n      }\n    };\n    return [curr, currPath, i];\n  };\n  addListener(model, from, getter, listeners, \"\" + to + \".*\", function(match) {\n    return from + '.' + match[1];\n  });\n  addListener(model, from, getter, listeners, to, function() {\n    return from;\n  });\n  return getter;\n};\n\nexports.addListener = addListener = function(model, from, getter, listeners, pattern, callback) {\n  var listener, re;\n  re = eventRegExp(pattern);\n  listener = function(mutator, path, _arguments) {\n    var args, fn, _i, _len;\n    if (re.test(path)) {\n      if (model._getRef(from) !== getter) {\n        for (_i = 0, _len = listeners.length; _i < _len; _i++) {\n          fn = listeners[_i];\n          model.removeListener('mutator', fn);\n        }\n        return;\n      }\n      args = _arguments[0].slice();\n      args.out = _arguments[1];\n      path = callback(re.exec(path), mutator, args);\n      if (path === null) {\n        return;\n      }\n      args[0] = path;\n      model.emit(mutator, args, args.out, _arguments[2], _arguments[3]);\n    }\n  };\n  listeners.push(listener);\n  return model.on('mutator', listener);\n};\n\n//@ sourceURL=/node_modules/racer/lib/refs/ref.js"
));

require.define("/node_modules/racer/lib/refs/refList.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Model, Ref, addListener, createGetter, derefPath, hasKeys, lookupPath, mergeAll, _ref, _ref1;\n\n_ref = require('../util'), mergeAll = _ref.mergeAll, hasKeys = _ref.hasKeys;\n\nRef = require('./Ref');\n\n_ref1 = require('./util'), derefPath = _ref1.derefPath, lookupPath = _ref1.lookupPath;\n\nModel = require('../Model');\n\naddListener = require('./Ref').addListener;\n\nmodule.exports = function(model, from, to, key) {\n  var arrayMutators, getter, listeners;\n  if (!(from && to && key)) {\n    throw new Error('Invalid arguments for model.refList');\n  }\n  listeners = [];\n  arrayMutators = Model.arrayMutator;\n  getter = createGetter(from, to, key);\n  addListener(model, from, getter, listeners, key, function(match, method, args) {\n    var i, id, _ref2;\n    if (i = (_ref2 = arrayMutators[method]) != null ? _ref2.insertArgs : void 0) {\n      while ((id = args[i]) != null) {\n        args[i] = model.get(to + '.' + id);\n        i++;\n      }\n    }\n    return from;\n  });\n  addListener(model, from, getter, listeners, \"\" + to + \".*\", function(match) {\n    var found, i, id, pointerList, remainder, value, _i, _len;\n    id = match[1];\n    if (~(i = id.indexOf('.'))) {\n      remainder = id.substr(i + 1);\n      id = id.substr(0, i);\n    }\n    if (pointerList = model.get(key)) {\n      for (i = _i = 0, _len = pointerList.length; _i < _len; i = ++_i) {\n        value = pointerList[i];\n        if (value == id) {\n          found = true;\n          break;\n        }\n      }\n    }\n    if (!found) {\n      return null;\n    }\n    if (remainder) {\n      return \"\" + from + \".\" + i + \".\" + remainder;\n    } else {\n      return \"\" + from + \".\" + i;\n    }\n  });\n  return getter;\n};\n\ncreateGetter = function(from, to, key) {\n  var getter;\n  return getter = function(lookup, data, path, props, len, i) {\n    var arrayMutators, basicMutators, curr, currPath, dereffed, dereffedKey, index, obj, pointerList, prop;\n    basicMutators = Model.basicMutator;\n    arrayMutators = Model.arrayMutator;\n    obj = lookup(to, data) || {};\n    dereffed = derefPath(data, to);\n    data.$deref = null;\n    pointerList = lookup(key, data);\n    dereffedKey = derefPath(data, key);\n    if (i === len) {\n      currPath = lookupPath(dereffed, props, i);\n      data.$deref = function(method, args, model) {\n        var arg, id, index, indexArgs, j, keyId, mutator, _i, _j, _len, _len1;\n        if (method in basicMutators) {\n          return path;\n        }\n        if (mutator = arrayMutators[method]) {\n          if (indexArgs = mutator.indexArgs) {\n            for (_i = 0, _len = indexArgs.length; _i < _len; _i++) {\n              j = indexArgs[_i];\n              if (!((arg = args[j]) && ((id = arg.id) != null))) {\n                continue;\n              }\n              for (index = _j = 0, _len1 = pointerList.length; _j < _len1; index = ++_j) {\n                keyId = pointerList[index];\n                if (keyId == id) {\n                  args[j] = index;\n                  break;\n                }\n              }\n            }\n          }\n          if (j = mutator.insertArgs) {\n            while (arg = args[j]) {\n              if ((id = arg.id) == null) {\n                id = arg.id = model.id();\n              }\n              if (hasKeys(arg, 'id')) {\n                model.set(dereffed + '.' + id, arg);\n              }\n              args[j] = id;\n              j++;\n            }\n          }\n          return dereffedKey;\n        }\n        throw new Error(method + ' unsupported on refList');\n      };\n      if (pointerList) {\n        curr = (function() {\n          var _i, _len, _results;\n          _results = [];\n          for (_i = 0, _len = pointerList.length; _i < _len; _i++) {\n            prop = pointerList[_i];\n            _results.push(obj[prop]);\n          }\n          return _results;\n        })();\n        return [curr, currPath, i];\n      }\n      return [void 0, currPath, i];\n    } else {\n      index = props[i++];\n      if (pointerList && ((prop = pointerList[index]) != null)) {\n        curr = obj[prop];\n      }\n      if (i === len) {\n        currPath = lookupPath(dereffed, props, i);\n        data.$deref = function(method, args, model, obj) {\n          var id, value;\n          if (method === 'set') {\n            value = args[1];\n            if ((id = value.id) == null) {\n              id = value.id = model.id();\n            }\n            if (pointerList) {\n              model.set(dereffedKey + '.' + index, id);\n            } else {\n              model.set(dereffedKey, [id]);\n            }\n            return currPath + '.' + id;\n          }\n          if (method === 'del') {\n            if ((id = obj.id) == null) {\n              throw new Error('Cannot delete refList item without id');\n            }\n            model.del(dereffedKey + '.' + index);\n            return currPath + '.' + id;\n          }\n          throw new Error(method + ' unsupported on refList index');\n        };\n      } else {\n        currPath = lookupPath(dereffed + '.' + prop, props, i);\n        data.$deref = function(method) {\n          if (method && prop == null) {\n            throw new Error(method + ' on undefined refList child ' + props.join('.'));\n          }\n          return currPath;\n        };\n      }\n      return [curr, currPath, i];\n    }\n  };\n};\n\n//@ sourceURL=/node_modules/racer/lib/refs/refList.js"
));

require.define("/node_modules/racer/lib/refs/Ref.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Model, addListener, derefPath, eventRegExp, exports, lookupPath, setupRefWithKey, setupRefWithoutKey, _ref;\n\neventRegExp = require('../path').eventRegExp;\n\n_ref = require('./util'), derefPath = _ref.derefPath, lookupPath = _ref.lookupPath;\n\nModel = require('../Model');\n\nexports = module.exports = function(model, from, to, key) {\n  if (!from) {\n    throw new Error('Missing `from` in `model.ref(from, to, key)`');\n  }\n  if (!to) {\n    throw new Error('Missing `to` in `model.ref(from, to, key)`');\n  }\n  if (key) {\n    return setupRefWithKey(model, from, to, key);\n  }\n  return setupRefWithoutKey(model, from, to);\n};\n\nsetupRefWithKey = function(model, from, to, key) {\n  var getter, listeners;\n  listeners = [];\n  getter = function(lookup, data, path, props, len, i) {\n    var curr, currPath, dereffed;\n    lookup(to, data);\n    dereffed = derefPath(data, to) + '.';\n    data.$deref = null;\n    dereffed += lookup(key, data);\n    curr = lookup(dereffed, data);\n    currPath = lookupPath(dereffed, props, i);\n    data.$deref = function(method) {\n      if (i === len && method in Model.basicMutator) {\n        return path;\n      } else {\n        return currPath;\n      }\n    };\n    return [curr, currPath, i];\n  };\n  addListener(model, from, getter, listeners, \"\" + to + \".*\", function(match) {\n    var index, keyPath, remainder;\n    keyPath = model.get(key) + '';\n    remainder = match[1];\n    if (remainder === keyPath) {\n      return from;\n    }\n    index = keyPath.length;\n    if (remainder.slice(0, index + 1 || 9e9) === keyPath + '.') {\n      remainder = remainder.slice(index + 1);\n      return from + '.' + remainder;\n    }\n    return null;\n  });\n  addListener(model, from, getter, listeners, key, function(match, mutator, args) {\n    if (mutator === 'set') {\n      args[1] = model.get(to + '.' + args[1]);\n      args.out = model.get(to + '.' + args.out);\n    } else if (mutator === 'del') {\n      args.out = model.get(to + '.' + args.out);\n    }\n    return from;\n  });\n  return getter;\n};\n\nsetupRefWithoutKey = function(model, from, to) {\n  var getter, listeners;\n  listeners = [];\n  getter = function(lookup, data, path, props, len, i) {\n    var curr, currPath, dereffed;\n    curr = lookup(to, data);\n    dereffed = derefPath(data, to);\n    currPath = lookupPath(dereffed, props, i);\n    data.$deref = function(method) {\n      if (i === len && method in Model.basicMutator) {\n        return path;\n      } else {\n        return currPath;\n      }\n    };\n    return [curr, currPath, i];\n  };\n  addListener(model, from, getter, listeners, \"\" + to + \".*\", function(match) {\n    return from + '.' + match[1];\n  });\n  addListener(model, from, getter, listeners, to, function() {\n    return from;\n  });\n  return getter;\n};\n\nexports.addListener = addListener = function(model, from, getter, listeners, pattern, callback) {\n  var listener, re;\n  re = eventRegExp(pattern);\n  listener = function(mutator, path, _arguments) {\n    var args, fn, _i, _len;\n    if (re.test(path)) {\n      if (model._getRef(from) !== getter) {\n        for (_i = 0, _len = listeners.length; _i < _len; _i++) {\n          fn = listeners[_i];\n          model.removeListener('mutator', fn);\n        }\n        return;\n      }\n      args = _arguments[0].slice();\n      args.out = _arguments[1];\n      path = callback(re.exec(path), mutator, args);\n      if (path === null) {\n        return;\n      }\n      args[0] = path;\n      model.emit(mutator, args, args.out, _arguments[2], _arguments[3]);\n    }\n  };\n  listeners.push(listener);\n  return model.on('mutator', listener);\n};\n\n//@ sourceURL=/node_modules/racer/lib/refs/Ref.js"
));

require.define("/node_modules/racer/lib/diffMatchPatch.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar addInsertOrRemove, diffArrays, moveLookAhead,\n  __slice = [].slice;\n\nmodule.exports = {\n  diffArrays: function(before, after) {\n    var current, inserts, items, moves, op, out, removes, _i, _j, _k, _len, _len1, _len2;\n    out = [];\n    current = before.slice();\n    diffArrays(before, after, removes = [], moves = [], inserts = []);\n    while (removes.length || moves.length || inserts.length) {\n      out = out.concat(removes, moves, inserts);\n      for (_i = 0, _len = removes.length; _i < _len; _i++) {\n        op = removes[_i];\n        current.splice(op[1], op[2]);\n      }\n      for (_j = 0, _len1 = moves.length; _j < _len1; _j++) {\n        op = moves[_j];\n        items = current.splice(op[1], op[3]);\n        current.splice.apply(current, [op[2], 0].concat(__slice.call(items)));\n      }\n      for (_k = 0, _len2 = inserts.length; _k < _len2; _k++) {\n        op = inserts[_k];\n        current.splice.apply(current, [op[1], 0].concat(__slice.call(op.slice(2))));\n      }\n      diffArrays(current, after, removes = [], moves = [], inserts = []);\n    }\n    return out;\n  }\n};\n\ndiffArrays = function(before, after, removes, moves, inserts) {\n  var a, afterLen, b, dir, end, from, fromBackward, fromForward, i, index, indexAfter, indexBefore, insert, itemAfter, itemBefore, j, move, moveFrom, num, numBackward, numForward, numInsert, numRemove, offset, op, otherItem, remove, skipA, skipB, to, toBackward, toForward, _i, _j, _k, _l, _len, _len1, _len2, _len3;\n  afterLen = after.length;\n  a = b = -1;\n  skipA = {};\n  skipB = {};\n  while (a < afterLen) {\n    while (skipA[++a]) {\n      addInsertOrRemove(inserts, removes, after, insert, numInsert, remove, numRemove);\n      insert = remove = null;\n    }\n    while (skipB[++b]) {\n      addInsertOrRemove(inserts, removes, after, insert, numInsert, remove, numRemove);\n      insert = remove = null;\n    }\n    itemAfter = after[a];\n    itemBefore = before[b];\n    if (itemAfter === itemBefore) {\n      addInsertOrRemove(inserts, removes, after, insert, numInsert, remove, numRemove);\n      insert = remove = null;\n      continue;\n    }\n    indexAfter = before.indexOf(itemAfter, b);\n    while (skipB[indexAfter]) {\n      indexAfter = before.indexOf(itemAfter, indexAfter + 1);\n    }\n    if (a < afterLen && indexAfter === -1) {\n      if (insert == null) {\n        insert = a;\n        numInsert = 0;\n      }\n      numInsert++;\n      b--;\n      continue;\n    }\n    indexBefore = after.indexOf(itemBefore, a);\n    while (skipA[indexBefore]) {\n      indexBefore = after.indexOf(itemBefore, indexBefore + 1);\n    }\n    if (indexBefore === -1) {\n      if (remove == null) {\n        remove = b;\n        numRemove = 0;\n      }\n      numRemove++;\n      a--;\n      continue;\n    }\n    addInsertOrRemove(inserts, removes, after, insert, numInsert, remove, numRemove);\n    insert = remove = null;\n    fromBackward = indexAfter;\n    toBackward = a;\n    numBackward = moveLookAhead(before, after, skipA, skipB, afterLen, fromBackward, toBackward, itemBefore);\n    fromForward = b;\n    toForward = indexBefore;\n    otherItem = numBackward === -1 ? NaN : itemAfter;\n    numForward = moveLookAhead(before, after, skipA, skipB, afterLen, fromForward, toForward, otherItem);\n    dir = numBackward === -1 ? dir = true : numForward === -1 ? dir = false : numForward < numBackward;\n    if (dir) {\n      from = fromForward;\n      to = toForward;\n      num = numForward;\n      a--;\n    } else {\n      from = fromBackward;\n      to = toBackward;\n      num = numBackward;\n      b--;\n    }\n    moves.push(['move', from, to, num]);\n    end = from + num;\n    while (from < end) {\n      skipB[from++] = true;\n      skipA[to++] = true;\n    }\n  }\n  offset = 0;\n  for (_i = 0, _len = removes.length; _i < _len; _i++) {\n    op = removes[_i];\n    index = op[1] += offset;\n    num = op[2];\n    offset -= num;\n    for (_j = 0, _len1 = moves.length; _j < _len1; _j++) {\n      move = moves[_j];\n      if (index < move[1]) {\n        move[1] -= num;\n      }\n    }\n  }\n  i = inserts.length;\n  while (op = inserts[--i]) {\n    num = op.length - 2;\n    index = op[1];\n    for (_k = 0, _len2 = moves.length; _k < _len2; _k++) {\n      move = moves[_k];\n      if (index <= move[2]) {\n        move[2] -= num;\n      }\n    }\n  }\n  for (i = _l = 0, _len3 = moves.length; _l < _len3; i = ++_l) {\n    op = moves[i];\n    from = op[1];\n    to = op[2];\n    num = op[3];\n    j = i;\n    while (move = moves[++j]) {\n      moveFrom = move[1];\n      if (to < moveFrom && from < moveFrom) {\n        continue;\n      }\n      move[1] = from < moveFrom ? moveFrom - num : moveFrom + num;\n    }\n  }\n};\n\nmoveLookAhead = function(before, after, skipA, skipB, afterLen, b, a, otherItem) {\n  var item, num;\n  num = 1;\n  if (skipB[b] || skipA[a]) {\n    return -1;\n  }\n  while ((item = before[++b]) === after[++a] && a < afterLen) {\n    if (item === otherItem || skipB[b] || skipA[a]) {\n      return num;\n    }\n    num++;\n  }\n  return num;\n};\n\naddInsertOrRemove = function(inserts, removes, after, insert, numInsert, remove, numRemove) {\n  if (insert != null) {\n    inserts.push(['insert', insert].concat(__slice.call(after.slice(insert, insert + numInsert))));\n  }\n  if (remove != null) {\n    removes.push(['remove', remove, numRemove]);\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/diffMatchPatch.js"
));

require.define("/node_modules/racer/lib/pubSub/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar exports, mixinModel, mixinStore;\n\nmixinModel = require('./pubSub.Model');\n\nmixinStore = __dirname + '/pubSub.Store';\n\nexports = module.exports = function(racer) {\n  return racer.mixin(mixinModel, mixinStore);\n};\n\nexports.useWith = {\n  server: true,\n  browser: true\n};\n\n//@ sourceURL=/node_modules/racer/lib/pubSub/index.js"
));

require.define("/node_modules/racer/lib/pubSub/pubSub.Model.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar LiveQuery, Query, deserialize, empty, expandPath, merge, splitPath, transaction, _ref,\n  __slice = [].slice;\n\ntransaction = require('../transaction');\n\n_ref = require('../path'), expandPath = _ref.expand, splitPath = _ref.split;\n\nLiveQuery = require('./LiveQuery');\n\ndeserialize = (Query = require('./Query')).deserialize;\n\nmerge = require('../util').merge;\n\nempty = function() {};\n\nmodule.exports = {\n  type: 'Model',\n  events: {\n    init: function(model) {\n      model._pathSubs = {};\n      model._querySubs = {};\n      return model._liveQueries = {};\n    },\n    bundle: function(model) {\n      var query, querySubs, _;\n      querySubs = (function() {\n        var _ref1, _results;\n        _ref1 = model._querySubs;\n        _results = [];\n        for (_ in _ref1) {\n          query = _ref1[_];\n          _results.push(query);\n        }\n        return _results;\n      })();\n      return model._onLoad.push(['_loadSubs', model._pathSubs, querySubs]);\n    },\n    socket: function(model, socket) {\n      var memory;\n      memory = model._memory;\n      socket.on('resyncWithStore', function(fn) {\n        return fn(model._subs(), memory.version, model._startId);\n      });\n      socket.on('addDoc', function(_arg, num) {\n        var data, doc, ns, txn, ver;\n        doc = _arg.doc, ns = _arg.ns, ver = _arg.ver;\n        if ((data = memory.get(ns)) && data[doc.id]) {\n          return model._addRemoteTxn(null, num);\n        } else {\n          txn = transaction.create({\n            ver: ver,\n            id: null,\n            method: 'set',\n            args: [\"\" + ns + \".\" + doc.id, doc]\n          });\n          model._addRemoteTxn(txn, num);\n          return model.emit('addDoc', \"\" + ns + \".\" + doc.id, doc);\n        }\n      });\n      return socket.on('rmDoc', function(_arg, num) {\n        var doc, hash, id, key, ns, query, txn, ver, _ref1;\n        doc = _arg.doc, ns = _arg.ns, hash = _arg.hash, id = _arg.id, ver = _arg.ver;\n        _ref1 = model._liveQueries;\n        for (key in _ref1) {\n          query = _ref1[key];\n          if (hash !== key && query.test(doc, \"\" + ns + \".\" + id)) {\n            return model._addRemoteTxn(null, num);\n          }\n        }\n        txn = transaction.create({\n          ver: ver,\n          id: null,\n          method: 'del',\n          args: [\"\" + ns + \".\" + id]\n        });\n        model._addRemoteTxn(txn, num);\n        return model.emit('rmDoc', ns + '.' + id, doc);\n      });\n    }\n  },\n  proto: {\n    _loadSubs: function(_pathSubs, querySubList) {\n      var hash, item, liveQueries, query, querySubs, _i, _len;\n      this._pathSubs = _pathSubs;\n      querySubs = this._querySubs;\n      liveQueries = this._liveQueries;\n      for (_i = 0, _len = querySubList.length; _i < _len; _i++) {\n        item = querySubList[_i];\n        query = deserialize(item);\n        hash = query.hash();\n        querySubs[hash] = query;\n        liveQueries[hash] = new LiveQuery(query);\n      }\n    },\n    query: function(namespace, opts) {\n      var args, conditions, k, method, property, q, v;\n      q = new Query(namespace);\n      if (opts) {\n        for (k in opts) {\n          v = opts[k];\n          switch (k) {\n            case 'byKey':\n            case 'skip':\n            case 'limit':\n            case 'sort':\n              q = q[k](v);\n              break;\n            case 'where':\n              for (property in v) {\n                conditions = v[property];\n                q = q.where(property);\n                if (conditions.constructor === Object) {\n                  for (method in conditions) {\n                    args = conditions[method];\n                    q = q[method](args);\n                  }\n                } else {\n                  q = q.equals(conditions);\n                }\n              }\n              break;\n            case 'only':\n            case 'except':\n              q = q[k].apply(q, v);\n              break;\n            default:\n              throw new Error(\"Unsupported key \" + k);\n          }\n        }\n      }\n      return q;\n    },\n    fetch: function() {\n      var callback, last, newTargets, out, path, root, target, targets, _i, _j, _len, _len1, _ref1,\n        _this = this;\n      targets = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      last = targets[targets.length - 1];\n      callback = typeof last === 'function' ? targets.pop() : empty;\n      newTargets = [];\n      out = [];\n      for (_i = 0, _len = targets.length; _i < _len; _i++) {\n        target = targets[_i];\n        if (target.isQuery) {\n          root = target.namespace;\n          newTargets.push(target);\n        } else {\n          if (target._at) {\n            target = target._at;\n          }\n          root = splitPath(target)[0];\n          _ref1 = expandPath(target);\n          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {\n            path = _ref1[_j];\n            newTargets.push(path);\n          }\n        }\n        out.push(this.at(root, true));\n      }\n      return this._fetch(newTargets, function(err, data) {\n        _this._initSubData(data);\n        return callback.apply(null, [err].concat(__slice.call(out)));\n      });\n    },\n    subscribe: function() {\n      var callback, hash, last, liveQueries, newTargets, out, path, pathSubs, querySubs, root, target, targets, _i, _j, _len, _len1, _ref1,\n        _this = this;\n      targets = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      last = targets[targets.length - 1];\n      callback = typeof last === 'function' ? targets.pop() : empty;\n      pathSubs = this._pathSubs;\n      querySubs = this._querySubs;\n      liveQueries = this._liveQueries;\n      newTargets = [];\n      out = [];\n      for (_i = 0, _len = targets.length; _i < _len; _i++) {\n        target = targets[_i];\n        if (target.isQuery) {\n          root = target.namespace;\n          hash = target.hash();\n          if (!querySubs[hash]) {\n            querySubs[hash] = target;\n            liveQueries[hash] = new LiveQuery(target);\n            newTargets.push(target);\n          }\n        } else {\n          if (target._at) {\n            target = target._at;\n          }\n          root = splitPath(target)[0];\n          _ref1 = expandPath(target);\n          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {\n            path = _ref1[_j];\n            if (pathSubs[path]) {\n              continue;\n            }\n            pathSubs[path] = 1;\n            newTargets.push(path);\n          }\n        }\n        out.push(this.at(root, true));\n      }\n      if (!newTargets.length) {\n        return callback.apply(null, [null].concat(__slice.call(out)));\n      }\n      return this._addSub(newTargets, function(err, data) {\n        if (err) {\n          return callback(err);\n        }\n        _this._initSubData(data);\n        return callback.apply(null, [null].concat(__slice.call(out)));\n      });\n    },\n    unsubscribe: function() {\n      var callback, hash, last, liveQueries, newTargets, path, pathSubs, querySubs, target, targets, _i, _j, _len, _len1, _ref1;\n      targets = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      last = targets[targets.length - 1];\n      callback = typeof last === 'function' ? targets.pop() : empty;\n      pathSubs = this._pathSubs;\n      querySubs = this._querySubs;\n      liveQueries = this._liveQueries;\n      newTargets = [];\n      for (_i = 0, _len = targets.length; _i < _len; _i++) {\n        target = targets[_i];\n        if (target.isQuery) {\n          hash = target.hash();\n          if (querySubs[hash]) {\n            delete querySubs[hash];\n            delete liveQueries[hash];\n            newTargets.push(target);\n          }\n        } else {\n          _ref1 = expandPath(target);\n          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {\n            path = _ref1[_j];\n            if (!pathSubs[path]) {\n              continue;\n            }\n            delete pathSubs[path];\n            newTargets.push(path);\n          }\n        }\n      }\n      if (!newTargets.length) {\n        return callback();\n      }\n      return this._removeSub(newTargets, callback);\n    },\n    _initSubData: function(data) {\n      this.emit('subInit', data);\n      return this._initData(data);\n    },\n    _initData: function(data) {\n      var memory, path, value, ver, _i, _len, _ref1, _ref2;\n      memory = this._memory;\n      _ref1 = data.data;\n      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {\n        _ref2 = _ref1[_i], path = _ref2[0], value = _ref2[1], ver = _ref2[2];\n        memory.set(path, value, ver);\n      }\n    },\n    _fetch: function(targets, callback) {\n      if (!this.connected) {\n        return callback('disconnected');\n      }\n      return this.socket.emit('fetch', targets, callback);\n    },\n    _addSub: function(targets, callback) {\n      if (!this.connected) {\n        return callback('disconnected');\n      }\n      return this.socket.emit('addSub', targets, callback);\n    },\n    _removeSub: function(targets, callback) {\n      if (!this.connected) {\n        return callback('disconnected');\n      }\n      return this.socket.emit('removeSub', targets, callback);\n    },\n    _subs: function() {\n      var query, subs, _, _ref1;\n      subs = Object.keys(this._pathSubs);\n      _ref1 = this._querySubs;\n      for (_ in _ref1) {\n        query = _ref1[_];\n        subs.push(query);\n      }\n      return subs;\n    }\n  },\n  server: {\n    _fetch: function(targets, callback) {\n      var store;\n      store = this.store;\n      return this._clientIdPromise.on(function(err, clientId) {\n        if (err) {\n          return callback(err);\n        }\n        return store.fetch(clientId, targets, callback);\n      });\n    },\n    _addSub: function(targets, callback) {\n      var _this = this;\n      return this._clientIdPromise.on(function(err, clientId) {\n        if (err) {\n          return callback(err);\n        }\n        return _this.store.subscribe(clientId, targets, callback);\n      });\n    },\n    _removeSub: function(targets, callback) {\n      var store;\n      store = this.store;\n      return this._clientIdPromise.on(function(err, clientId) {\n        if (err) {\n          return callback(err);\n        }\n        return store.unsubscribe(clientId, targets, callback);\n      });\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/pubSub/pubSub.Model.js"
));

require.define("/node_modules/racer/lib/pubSub/LiveQuery.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar LiveQuery, compileDocFilter, compileSortComparator, deepEqual, deepIndexOf, evalToTrue, indexOf, lookup, transaction, _ref,\n  __slice = [].slice;\n\nlookup = require('../path').lookup;\n\ntransaction = require('../transaction');\n\n_ref = require('../util'), indexOf = _ref.indexOf, deepIndexOf = _ref.deepIndexOf, deepEqual = _ref.deepEqual;\n\nmodule.exports = LiveQuery = function(query) {\n  var args, method, _i, _len, _ref1, _ref2;\n  this.query = query;\n  this._predicates = [];\n  _ref1 = query._calls;\n  for (_i = 0, _len = _ref1.length; _i < _len; _i++) {\n    _ref2 = _ref1[_i], method = _ref2[0], args = _ref2[1];\n    this[method].apply(this, args);\n  }\n};\n\nLiveQuery.prototype = {\n  from: function(namespace) {\n    this.namespace = namespace;\n    this._predicates.push(function(doc, channel) {\n      var docNs;\n      docNs = channel.slice(0, channel.indexOf('.'));\n      return namespace === docNs;\n    });\n    return this;\n  },\n  testWithoutPaging: function(doc, channel) {\n    this.testWithoutPaging = compileDocFilter(this._predicates);\n    return this.testWithoutPaging(doc, channel);\n  },\n  test: function(doc, channel) {\n    return this.testWithoutPaging(doc, channel);\n  },\n  byKey: function(keyVal) {\n    this._predicates.push(function(doc, channel) {\n      var id, ns, _ref1;\n      _ref1 = channel.split('.'), ns = _ref1[0], id = _ref1[1];\n      return id === keyVal;\n    });\n    return this;\n  },\n  where: function(_currProp) {\n    this._currProp = _currProp;\n    return this;\n  },\n  equals: function(val) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      var currVal;\n      currVal = lookup(currProp, doc);\n      if (typeof currVal === 'object') {\n        return deepEqual(currVal, val);\n      }\n      return currVal === val;\n    });\n    return this;\n  },\n  notEquals: function(val) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      return lookup(currProp, doc) !== val;\n    });\n    return this;\n  },\n  gt: function(val) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      return lookup(currProp, doc) > val;\n    });\n    return this;\n  },\n  gte: function(val) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      return lookup(currProp, doc) >= val;\n    });\n    return this;\n  },\n  lt: function(val) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      return lookup(currProp, doc) < val;\n    });\n    return this;\n  },\n  lte: function(val) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      return lookup(currProp, doc) <= val;\n    });\n    return this;\n  },\n  within: function(list) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      return -1 !== list.indexOf(lookup(currProp, doc));\n    });\n    return this;\n  },\n  contains: function(list) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      var docList, x, _i, _len;\n      docList = lookup(currProp, doc);\n      if (docList === void 0) {\n        if (list.length) {\n          return false;\n        }\n        return true;\n      }\n      for (_i = 0, _len = list.length; _i < _len; _i++) {\n        x = list[_i];\n        if (x.constructor === Object) {\n          if (-1 === deepIndexOf(docList, x)) {\n            return false;\n          }\n        } else {\n          if (-1 === docList.indexOf(x)) {\n            return false;\n          }\n        }\n      }\n      return true;\n    });\n    return this;\n  },\n  only: function() {\n    var path, paths, _i, _len;\n    paths = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n    if (this._except) {\n      throw new Error(\"You cannot specify both query(...).except(...) and query(...).only(...)\");\n    }\n    this._only || (this._only = {});\n    for (_i = 0, _len = paths.length; _i < _len; _i++) {\n      path = paths[_i];\n      this._only[path] = 1;\n    }\n    return this;\n  },\n  except: function() {\n    var path, paths, _i, _len;\n    paths = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n    if (this._only) {\n      throw new Error(\"You cannot specify both query(...).except(...) and query(...).only(...)\");\n    }\n    this._except || (this._except = {});\n    for (_i = 0, _len = paths.length; _i < _len; _i++) {\n      path = paths[_i];\n      this._except[path] = 1;\n    }\n    return this;\n  },\n  limit: function(_limit) {\n    this._limit = _limit;\n    this.isPaginated = true;\n    this._paginatedCache || (this._paginatedCache = []);\n    return this;\n  },\n  skip: function(skip) {\n    this.isPaginated = true;\n    this._paginatedCache || (this._paginatedCache = []);\n    return this;\n  },\n  sort: function() {\n    var params;\n    params = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n    if (this._sort && this._sort.length) {\n      this._sort = this._sort.concat(params);\n    } else {\n      this._sort = params;\n    }\n    this._comparator = compileSortComparator(this._sort);\n    return this;\n  },\n  beforeOrAfter: function(doc) {\n    var comparator;\n    comparator = this._comparator;\n    if (-1 === comparator(doc, this._paginatedCache[0])) {\n      return 'before';\n    }\n    if (1 === comparator(doc, this._paginatedCache[this._paginatedCache.length - 1])) {\n      return 'after';\n    }\n    return 'curr';\n  },\n  updateCache: function(store, callback) {\n    var cache,\n      _this = this;\n    cache = this._paginatedCache;\n    return store.query(this.query, function(err, found, ver) {\n      var added, removed, x, _i, _j, _len, _len1;\n      if (err) {\n        return callback(err);\n      }\n      removed = [];\n      added = [];\n      for (_i = 0, _len = cache.length; _i < _len; _i++) {\n        x = cache[_i];\n        if (-1 === indexOf(found, x, function(y, z) {\n          return y.id === z.id;\n        })) {\n          removed.push(x);\n        }\n      }\n      for (_j = 0, _len1 = found.length; _j < _len1; _j++) {\n        x = found[_j];\n        if (-1 === indexOf(cache, x, function(y, z) {\n          return y.id === z.id;\n        })) {\n          added.push(x);\n        }\n      }\n      _this._paginatedCache = found;\n      return callback(null, added, removed, ver);\n    });\n  },\n  isCacheImpactedByTxn: function(txn) {\n    var cache, id, ns, x, _i, _len, _ref1;\n    _ref1 = transaction.getPath(txn).split('.'), ns = _ref1[0], id = _ref1[1];\n    if (ns !== this.namespace) {\n      return false;\n    }\n    cache = this._paginatedCache;\n    for (_i = 0, _len = cache.length; _i < _len; _i++) {\n      x = cache[_i];\n      if (x.id === id) {\n        return true;\n      }\n    }\n    return false;\n  }\n};\n\nevalToTrue = function() {\n  return true;\n};\n\ncompileDocFilter = function(predicates) {\n  switch (predicates.length) {\n    case 0:\n      return evalToTrue;\n    case 1:\n      return predicates[0];\n  }\n  return function(doc, channel) {\n    var pred, _i, _len;\n    if (doc === void 0) {\n      return false;\n    }\n    for (_i = 0, _len = predicates.length; _i < _len; _i++) {\n      pred = predicates[_i];\n      if (!pred(doc, channel)) {\n        return false;\n      }\n    }\n    return true;\n  };\n};\n\ncompileSortComparator = function(sortParams) {\n  return function(a, b) {\n    var aVal, bVal, factor, i, path, _i, _len, _step;\n    for (i = _i = 0, _len = sortParams.length, _step = 2; _i < _len; i = _i += _step) {\n      path = sortParams[i];\n      factor = (function() {\n        switch (sortParams[i + 1]) {\n          case 'asc':\n            return 1;\n          case 'desc':\n            return -1;\n          default:\n            throw new Error('Must be \"asc\" or \"desc\"');\n        }\n      })();\n      aVal = lookup(path, a);\n      bVal = lookup(path, b);\n      if (aVal < bVal) {\n        return -1 * factor;\n      } else if (aVal > bVal) {\n        return factor;\n      }\n    }\n    return 0;\n  };\n};\n\n//@ sourceURL=/node_modules/racer/lib/pubSub/LiveQuery.js"
));

require.define("/node_modules/racer/lib/pubSub/Query.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar ABBREVS, Query, callsComparator, method, _fn, _i, _len, _ref,\n  __slice = [].slice;\n\nABBREVS = {\n  equals: '$eq',\n  notEquals: '$ne',\n  gt: '$gt',\n  gte: '$gte',\n  lt: '$lt',\n  lte: '$lte',\n  within: '$w',\n  contains: '$c'\n};\n\nQuery = module.exports = function(namespace) {\n  this._calls = [];\n  this._json = {};\n  if (namespace) {\n    this.from(namespace);\n  }\n};\n\nQuery.prototype = {\n  isQuery: true,\n  toJSON: function() {\n    return this._calls;\n  },\n  hash: function() {\n    var arg, args, byKeyHash, calls, group, groups, hash, i, limitHash, method, path, pathCalls, selectHash, sep, skipHash, sortHash, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref, _ref1, _step;\n    sep = ':';\n    groups = [];\n    calls = this._calls;\n    for (_i = 0, _len = calls.length; _i < _len; _i++) {\n      _ref = calls[_i], method = _ref[0], args = _ref[1];\n      switch (method) {\n        case 'from':\n          continue;\n        case 'byKey':\n          byKeyHash = '$k' + sep + JSON.stringify(args[0]);\n          break;\n        case 'where':\n          group = {\n            path: args[0]\n          };\n          pathCalls = group.calls = [];\n          groups.push(group);\n          break;\n        case 'equals':\n        case 'notEquals':\n        case 'gt':\n        case 'gte':\n        case 'lt':\n        case 'lte':\n          pathCalls.push([ABBREVS[method], JSON.stringify(args)]);\n          break;\n        case 'within':\n        case 'contains':\n          args[0].sort();\n          pathCalls.push([ABBREVS[method], args]);\n          break;\n        case 'only':\n        case 'except':\n          selectHash = method === 'only' ? '$o' : '$e';\n          for (_j = 0, _len1 = args.length; _j < _len1; _j++) {\n            path = args[_j];\n            selectHash += sep + path;\n          }\n          break;\n        case 'sort':\n          sortHash = '$s' + sep;\n          for (i = _k = 0, _len2 = args.length, _step = 2; _k < _len2; i = _k += _step) {\n            path = args[i];\n            sortHash += path + sep;\n            sortHash += (function() {\n              switch (args[i + 1]) {\n                case 'asc':\n                  return '^';\n                case 'desc':\n                  return 'v';\n              }\n            })();\n          }\n          break;\n        case 'skip':\n          skipHash = '$sk' + sep + args[0];\n          break;\n        case 'limit':\n          limitHash = '$L' + sep + args[0];\n      }\n    }\n    hash = this.namespace;\n    if (byKeyHash) {\n      hash += sep + byKeyHash;\n    }\n    if (sortHash) {\n      hash += sep + sortHash;\n    }\n    if (selectHash) {\n      hash += sep + selectHash;\n    }\n    if (skipHash) {\n      hash += sep + skipHash;\n    }\n    if (limitHash) {\n      hash += sep + limitHash;\n    }\n    groups = groups.map(function(group) {\n      group.calls = group.calls.sort(callsComparator);\n      return group;\n    });\n    groups.sort(function(groupA, groupB) {\n      var pathA, pathB;\n      pathA = groupA.path;\n      pathB = groupB.path;\n      if (pathA < pathB) {\n        return -1;\n      }\n      if (pathA === pathB) {\n        return 0;\n      }\n      return 1;\n    });\n    for (_l = 0, _len3 = groups.length; _l < _len3; _l++) {\n      group = groups[_l];\n      hash += sep + sep + group.path;\n      calls = group.calls;\n      for (_m = 0, _len4 = calls.length; _m < _len4; _m++) {\n        _ref1 = calls[_m], method = _ref1[0], args = _ref1[1];\n        hash += sep + method;\n        for (_n = 0, _len5 = args.length; _n < _len5; _n++) {\n          arg = args[_n];\n          hash += sep + JSON.stringify(arg);\n        }\n      }\n    }\n    return hash;\n  },\n  from: function(namespace) {\n    this.namespace = namespace;\n    this._calls.push(['from', [this.namespace]]);\n    return this;\n  },\n  skip: function() {\n    var args;\n    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n    this.isPaginated = true;\n    this._calls.push(['skip', args]);\n    return this;\n  },\n  limit: function() {\n    var args;\n    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n    this.isPaginated = true;\n    this._calls.push(['limit', args]);\n    return this;\n  }\n};\n\n_ref = ['byKey', 'where', 'equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'within', 'contains', 'only', 'except', 'sort'];\n_fn = function(method) {\n  return Query.prototype[method] = function() {\n    var args;\n    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n    this._calls.push([method, args]);\n    return this;\n  };\n};\nfor (_i = 0, _len = _ref.length; _i < _len; _i++) {\n  method = _ref[_i];\n  _fn(method);\n}\n\nQuery.deserialize = function(calls) {\n  var args, query, _j, _len1, _ref1;\n  query = new Query;\n  for (_j = 0, _len1 = calls.length; _j < _len1; _j++) {\n    _ref1 = calls[_j], method = _ref1[0], args = _ref1[1];\n    query[method].apply(query, args);\n  }\n  return query;\n};\n\ncallsComparator = function(_arg, _arg1) {\n  var methodA, methodB;\n  methodA = _arg[0];\n  methodB = _arg1[0];\n  if (methodA < methodB) {\n    return -1;\n  }\n  if (methodA === methodB) {\n    return 0;\n  }\n  return 1;\n};\n\n//@ sourceURL=/node_modules/racer/lib/pubSub/Query.js"
));

require.define("/node_modules/racer/lib/txns/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar exports, mixinModel, mixinStore;\n\nmixinModel = require('./txns.Model');\n\nmixinStore = __dirname + '/txns.Store';\n\nexports = module.exports = function(racer) {\n  return racer.mixin(mixinModel, mixinStore);\n};\n\nexports.useWith = {\n  server: true,\n  browser: true\n};\n\n//@ sourceURL=/node_modules/racer/lib/txns/index.js"
));

require.define("/node_modules/racer/lib/txns/txns.Model.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Memory, Promise, RESEND_INTERVAL, SEND_TIMEOUT, Serializer, arrayMutator, isPrivate, mergeTxn, specCreate, transaction,\n  __slice = [].slice;\n\nMemory = require('../Memory');\n\nPromise = require('../util/Promise');\n\nSerializer = require('../Serializer');\n\ntransaction = require('../transaction');\n\nisPrivate = require('../path').isPrivate;\n\nspecCreate = require('../util/speculative').create;\n\nmergeTxn = require('./diff').mergeTxn;\n\narrayMutator = null;\n\nmodule.exports = {\n  type: 'Model',\n  \"static\": {\n    SEND_TIMEOUT: SEND_TIMEOUT = 10000,\n    RESEND_INTERVAL: RESEND_INTERVAL = 2000\n  },\n  events: {\n    mixin: function(Model) {\n      return arrayMutator = Model.arrayMutator, Model;\n    },\n    init: function(model) {\n      var after, before, bundlePromises, memory, specCache, txnQueue, txns;\n      if (bundlePromises = model._bundlePromises) {\n        bundlePromises.push(model._txnsPromise = new Promise);\n      }\n      model._specCache = specCache = {\n        invalidate: function() {\n          delete this.data;\n          return delete this.lastTxnId;\n        }\n      };\n      model._count.txn = 0;\n      model._txns = txns = {};\n      model._txnQueue = txnQueue = [];\n      model._removeTxn = function(txnId) {\n        var i;\n        delete txns[txnId];\n        if (~(i = txnQueue.indexOf(txnId))) {\n          txnQueue.splice(i, 1);\n          specCache.invalidate();\n        }\n      };\n      memory = model._memory;\n      before = new Memory;\n      after = new Memory;\n      return model._onTxn = function(txn) {\n        var isLocal, txnQ, ver;\n        if (txn == null) {\n          return;\n        }\n        if (txnQ = txns[transaction.getId(txn)]) {\n          txn.callback = txnQ.callback;\n          txn.emitted = txnQ.emitted;\n        }\n        isLocal = 'callback' in txn;\n        ver = transaction.getVer(txn);\n        if (ver > memory.version || ver === -1) {\n          model._applyTxn(txn, isLocal);\n        }\n      };\n    },\n    bundle: function(model) {\n      model._txnsPromise.on(function(err) {\n        var clientId, store;\n        if (err) {\n          throw err;\n        }\n        store = model.store;\n        clientId = model._clientId;\n        store._unregisterLocalModel(clientId);\n        return store._startTxnBuffer(clientId);\n      });\n      model._specModel();\n      if (model._txnQueue.length) {\n        model.__removeTxn__ = model._removeTxn;\n        model._removeTxn = function(txnId) {\n          model.__removeTxn__(txnId);\n          model._specModel();\n          if (model._txnQueue.length) {\n            return;\n          }\n          model.__applyMutation__ = model._applyMutation;\n          return model._applyMutation = function(extractor, txn, ver, data, doEmit, isLocal) {\n            var out;\n            out = model.__applyMutation__(extractor, txn, ver, data, doEmit, isLocal);\n            model._txnsPromise.resolve();\n            return out;\n          };\n        };\n        return;\n      }\n      return model._txnsPromise.resolve();\n    },\n    socket: function(model, socket) {\n      var addRemoteTxn, commit, memory, onTxn, removeTxn, resend, resendInterval, setupResendInterval, teardownResendInterval, txnApplier, txnQueue, txns;\n      memory = model._memory, txns = model._txns, txnQueue = model._txnQueue, removeTxn = model._removeTxn, onTxn = model._onTxn;\n      socket.on('snapshotUpdate:replace', function(data, num) {\n        var toReplay, txn, txnId, _i, _len;\n        toReplay = (function() {\n          var _i, _len, _results;\n          _results = [];\n          for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {\n            txnId = txnQueue[_i];\n            _results.push(txns[txnId]);\n          }\n          return _results;\n        })();\n        txnQueue.length = 0;\n        model._txns = txns = {};\n        model._specCache.invalidate();\n        txnApplier.clearPending();\n        if (num != null) {\n          txnApplier.setIndex(num + 1);\n        }\n        memory.eraseNonPrivate();\n        model._initData(data);\n        model.emit('reInit');\n        for (_i = 0, _len = toReplay.length; _i < _len; _i++) {\n          txn = toReplay[_i];\n          model[transaction.getMethod(txn)].apply(model, transaction.getArgs(txn));\n        }\n      });\n      socket.on('snapshotUpdate:newTxns', function(newTxns, num) {\n        var id, txn, _i, _j, _len, _len1;\n        for (_i = 0, _len = newTxns.length; _i < _len; _i++) {\n          txn = newTxns[_i];\n          onTxn(txn);\n        }\n        txnApplier.clearPending();\n        if (num != null) {\n          txnApplier.setIndex(num + 1);\n        }\n        for (_j = 0, _len1 = txnQueue.length; _j < _len1; _j++) {\n          id = txnQueue[_j];\n          commit(txns[id]);\n        }\n      });\n      txnApplier = new Serializer({\n        withEach: onTxn,\n        onTimeout: function() {\n          if (!model.connected) {\n            return;\n          }\n          return socket.emit('fetchCurrSnapshot', memory.version + 1, model._startId, model._subs());\n        }\n      });\n      resendInterval = null;\n      resend = function() {\n        var id, now, txn, _i, _len;\n        now = +(new Date);\n        for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {\n          id = txnQueue[_i];\n          txn = txns[id];\n          if (!txn || txn.timeout > now) {\n            return;\n          }\n          commit(txn);\n        }\n      };\n      setupResendInterval = function() {\n        return resendInterval || (resendInterval = setInterval(resend, RESEND_INTERVAL));\n      };\n      teardownResendInterval = function() {\n        if (resendInterval) {\n          clearInterval(resendInterval);\n        }\n        return resendInterval = null;\n      };\n      if (model.connected) {\n        setupResendInterval();\n      } else {\n        model.once('connect', function() {\n          return setupResendInterval();\n        });\n      }\n      socket.on('disconnect', function() {\n        return teardownResendInterval();\n      });\n      model._addRemoteTxn = addRemoteTxn = function(txn, num) {\n        if (num != null) {\n          return txnApplier.add(txn, num);\n        } else {\n          return onTxn(txn);\n        }\n      };\n      socket.on('txn', addRemoteTxn);\n      socket.on('txnOk', function(txnId, ver, num) {\n        var txn;\n        if (!(txn = txns[txnId])) {\n          return;\n        }\n        transaction.setVer(txn, ver);\n        return addRemoteTxn(txn, num);\n      });\n      socket.on('txnErr', function(err, txnId) {\n        var callback, callbackArgs, txn;\n        txn = txns[txnId];\n        if (txn && (callback = txn.callback)) {\n          if (transaction.isCompound(txn)) {\n            callbackArgs = transaction.ops(txn);\n          } else {\n            callbackArgs = transaction.copyArgs(txn);\n          }\n          callbackArgs.unshift(err);\n          callback.apply(null, callbackArgs);\n        }\n        return removeTxn(txnId);\n      });\n      return model._commit = commit = function(txn) {\n        if (txn.isPrivate) {\n          return;\n        }\n        txn.timeout = +(new Date) + SEND_TIMEOUT;\n        if (!model.connected) {\n          return;\n        }\n        return socket.emit('txn', txn, model._startId);\n      };\n    }\n  },\n  server: {\n    _commit: function(txn) {\n      var _this = this;\n      if (txn.isPrivate) {\n        return;\n      }\n      return this.store._commit(txn, function(err, txn) {\n        if (err) {\n          return _this._removeTxn(transaction.getId(txn));\n        }\n        return _this._onTxn(txn);\n      });\n    }\n  },\n  proto: {\n    force: function() {\n      return Object.create(this, {\n        _force: {\n          value: true\n        }\n      });\n    },\n    _commit: function() {},\n    _asyncCommit: function(txn, callback) {\n      var id;\n      if (!this.connected) {\n        return callback('disconnected');\n      }\n      txn.callback = callback;\n      id = transaction.getId(txn);\n      this._txns[id] = txn;\n      return this._commit(txn);\n    },\n    _nextTxnId: function() {\n      return this._clientId + '.' + this._count.txn++;\n    },\n    _queueTxn: function(txn, callback) {\n      var id;\n      txn.callback = callback;\n      id = transaction.getId(txn);\n      this._txns[id] = txn;\n      return this._txnQueue.push(id);\n    },\n    _getVersion: function() {\n      if (this._force) {\n        return null;\n      } else {\n        return this._memory.version;\n      }\n    },\n    _addOpAsTxn: function(method, args, callback) {\n      var arr, id, out, path, txn, ver;\n      this.emit('beforeTxn', method, args);\n      if ((path = args[0]) == null) {\n        return;\n      }\n      ver = this._getVersion();\n      id = this._nextTxnId();\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: method,\n        args: args\n      });\n      txn.isPrivate = isPrivate(path);\n      txn.emitted = args.cancelEmit;\n      if (method === 'pop') {\n        txn.push((arr = this.get(path) || null) && (arr.length - 1));\n      } else if (method === 'unshift') {\n        txn.push((this.get(path) || null) && 0);\n      }\n      this._queueTxn(txn, callback);\n      out = this._specModel().$out;\n      if (method === 'push') {\n        txn.push(out - args.length + 1);\n      }\n      args = args.slice();\n      if (!txn.emitted) {\n        this.emit(method, args, out, true, this._pass);\n        txn.emitted = true;\n      }\n      this._commit(txn);\n      return out;\n    },\n    _applyTxn: function(txn, isLocal) {\n      var callback, data, doEmit, isCompound, op, ops, out, txnId, ver, _i, _len;\n      if (txnId = transaction.getId(txn)) {\n        this._removeTxn(txnId);\n      }\n      data = this._memory._data;\n      doEmit = !txn.emitted;\n      ver = Math.floor(transaction.getVer(txn));\n      if (isCompound = transaction.isCompound(txn)) {\n        ops = transaction.ops(txn);\n        for (_i = 0, _len = ops.length; _i < _len; _i++) {\n          op = ops[_i];\n          this._applyMutation(transaction.op, op, ver, data, doEmit, isLocal);\n        }\n      } else {\n        out = this._applyMutation(transaction, txn, ver, data, doEmit, isLocal);\n      }\n      if (callback = txn.callback) {\n        if (isCompound) {\n          callback.apply(null, [null].concat(__slice.call(transaction.ops(txn))));\n        } else {\n          callback.apply(null, [null].concat(__slice.call(transaction.getArgs(txn)), [out]));\n        }\n      }\n      return out;\n    },\n    _applyMutation: function(extractor, txn, ver, data, doEmit, isLocal) {\n      var args, method, out, patch, _i, _len, _ref, _ref1;\n      method = extractor.getMethod(txn);\n      if (method === 'get') {\n        return;\n      }\n      args = extractor.getArgs(txn);\n      out = (_ref = this._memory)[method].apply(_ref, __slice.call(args).concat([ver], [data]));\n      if (doEmit) {\n        if (patch = txn.patch) {\n          for (_i = 0, _len = patch.length; _i < _len; _i++) {\n            _ref1 = patch[_i], method = _ref1.method, args = _ref1.args;\n            this.emit(method, args, null, isLocal, this._pass);\n          }\n        } else {\n          this.emit(method, args, out, isLocal, this._pass);\n          txn.emitted = true;\n        }\n      }\n      return out;\n    },\n    _specModel: function() {\n      var cache, data, i, lastTxnId, len, op, ops, out, replayFrom, txn, txnQueue, txns, _i, _len;\n      txns = this._txns;\n      txnQueue = this._txnQueue;\n      while ((txn = txns[txnQueue[0]]) && txn.isPrivate) {\n        out = this._applyTxn(txn, true);\n      }\n      if (!(len = txnQueue.length)) {\n        data = this._memory._data;\n        data.$out = out;\n        return data;\n      }\n      cache = this._specCache;\n      if (lastTxnId = cache.lastTxnId) {\n        if (cache.lastTxnId === txnQueue[len - 1]) {\n          return cache.data;\n        }\n        data = cache.data;\n        replayFrom = 1 + txnQueue.indexOf(cache.lastTxnId);\n      } else {\n        replayFrom = 0;\n      }\n      if (!data) {\n        data = cache.data = specCreate(this._memory._data);\n      }\n      i = replayFrom;\n      while (i < len) {\n        txn = txns[txnQueue[i++]];\n        if (transaction.isCompound(txn)) {\n          ops = transaction.ops(txn);\n          for (_i = 0, _len = ops.length; _i < _len; _i++) {\n            op = ops[_i];\n            this._applyMutation(transaction.op, op, null, data);\n          }\n        } else {\n          out = this._applyMutation(transaction, txn, null, data);\n        }\n      }\n      cache.data = data;\n      cache.lastTxnId = transaction.getId(txn);\n      data.$out = out;\n      return data;\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/txns/txns.Model.js"
));

require.define("/node_modules/racer/lib/util/Promise.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Promise, finishAfter, util;\n\nutil = require('./index');\n\nfinishAfter = require('./async').finishAfter;\n\nutil.Promise = Promise = module.exports = function() {\n  this.callbacks = [];\n  this.resolved = false;\n};\n\nPromise.prototype = {\n  resolve: function(err, value) {\n    var callback, _i, _len, _ref;\n    this.err = err;\n    this.value = value;\n    if (this.resolved) {\n      throw new Error('Promise has already been resolved');\n    }\n    this.resolved = true;\n    _ref = this.callbacks;\n    for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n      callback = _ref[_i];\n      callback(err, value);\n    }\n    this.callbacks = [];\n    return this;\n  },\n  on: function(callback) {\n    if (this.resolved) {\n      callback(this.err, this.value);\n      return this;\n    }\n    this.callbacks.push(callback);\n    return this;\n  },\n  clear: function() {\n    this.resolved = false;\n    delete this.value;\n    delete this.err;\n    return this;\n  }\n};\n\nPromise.parallel = function(promises) {\n  var composite, finish, i;\n  composite = new Promise;\n  i = promises.length;\n  finish = finishAfter(i, function(err) {\n    return composite.resolve(err);\n  });\n  while (i--) {\n    promises[i].on(finish);\n  }\n  return composite;\n};\n\n//@ sourceURL=/node_modules/racer/lib/util/Promise.js"
));

require.define("/node_modules/racer/lib/util/async.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar finishAfter, util;\n\nutil = require('./index');\n\nutil.async = module.exports = {\n  finishAfter: finishAfter = function(count, callback) {\n    var err;\n    callback || (callback = function(err) {\n      if (err) {\n        throw err;\n      }\n    });\n    if (!count) {\n      return callback;\n    }\n    err = null;\n    return function(_err) {\n      err || (err = _err);\n      return --count || callback(err);\n    };\n  },\n  forEach: function(items, fn, done) {\n    var finish, item, _i, _len;\n    finish = finishAfter(items.length, done);\n    for (_i = 0, _len = items.length; _i < _len; _i++) {\n      item = items[_i];\n      fn(item, finish);\n    }\n  },\n  bufferifyMethods: function(Klass, methodNames, _arg) {\n    var await, buffer, fns;\n    await = _arg.await;\n    fns = {};\n    buffer = null;\n    methodNames.forEach(function(methodName) {\n      fns[methodName] = Klass.prototype[methodName];\n      return Klass.prototype[methodName] = function() {\n        var didFlush, flush, _arguments,\n          _this = this;\n        _arguments = arguments;\n        didFlush = false;\n        flush = function() {\n          var args, _i, _len;\n          didFlush = true;\n          methodNames.forEach(function(methodName) {\n            return _this[methodName] = fns[methodName];\n          });\n          delete await.alredyCalled;\n          if (!buffer) {\n            return;\n          }\n          for (_i = 0, _len = buffer.length; _i < _len; _i++) {\n            args = buffer[_i];\n            fns[methodName].apply(_this, args);\n          }\n          buffer = null;\n        };\n        if (await.alredyCalled) {\n          return;\n        }\n        await.alredyCalled = true;\n        await.call(this, flush);\n        if (didFlush) {\n          return this[methodName].apply(this, _arguments);\n        }\n        this[methodName] = function() {\n          buffer || (buffer = []);\n          return buffer.push(arguments);\n        };\n        this[methodName].apply(this, arguments);\n      };\n    });\n    return {\n      bufferify: function(methodName, _arg1) {\n        var await, fn;\n        fn = _arg1.fn, await = _arg1.await;\n        buffer = null;\n        return function() {\n          var didFlush, flush, _arguments,\n            _this = this;\n          _arguments = arguments;\n          didFlush = false;\n          flush = function() {\n            var args, _i, _len;\n            didFlush = true;\n            _this[methodName] = fn;\n            if (!buffer) {\n              return;\n            }\n            for (_i = 0, _len = buffer.length; _i < _len; _i++) {\n              args = buffer[_i];\n              fn.apply(_this, args);\n            }\n            buffer = null;\n          };\n          await.call(this, flush);\n          if (didFlush) {\n            return this[methodName].apply(this, _arguments);\n          }\n          this[methodName] = function() {\n            buffer || (buffer = []);\n            return buffer.push(arguments);\n          };\n          this[methodName].apply(this, arguments);\n        };\n      }\n    };\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/util/async.js"
));

require.define("/node_modules/racer/lib/Serializer.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar DEFAULT_EXPIRY, Serializer;\n\nDEFAULT_EXPIRY = 1000;\n\nmodule.exports = Serializer = function(_arg) {\n  var init;\n  this.withEach = _arg.withEach, this.onTimeout = _arg.onTimeout, this.expiry = _arg.expiry, init = _arg.init;\n  if (this.onTimeout) {\n    if (this.expiry == null) {\n      this.expiry = DEFAULT_EXPIRY;\n    }\n  }\n  this._pending = {};\n  this._index = init != null ? init : 1;\n};\n\nSerializer.prototype = {\n  _setWaiter: function() {\n    var _this = this;\n    if (!this.onTimeout || this._waiter) {\n      return;\n    }\n    return this._waiter = setTimeout(function() {\n      _this.onTimeout();\n      return _this._clearWaiter();\n    }, this.expiry);\n  },\n  _clearWaiter: function() {\n    if (!this.onTimeout) {\n      return;\n    }\n    if (this._waiter) {\n      clearTimeout(this._waiter);\n      return delete this._waiter;\n    }\n  },\n  add: function(msg, msgIndex, arg) {\n    var pending;\n    if (msgIndex > this._index) {\n      this._pending[msgIndex] = msg;\n      this._setWaiter();\n      return true;\n    }\n    if (msgIndex < this._index) {\n      return false;\n    }\n    this.withEach(msg, this._index++, arg);\n    this._clearWaiter();\n    pending = this._pending;\n    while (msg = pending[this._index]) {\n      this.withEach(msg, this._index, arg);\n      delete pending[this._index++];\n    }\n    return true;\n  },\n  setIndex: function(_index) {\n    this._index = _index;\n  },\n  clearPending: function() {\n    var i, index, pending, _results;\n    index = this._index;\n    pending = this._pending;\n    _results = [];\n    for (i in pending) {\n      if (i < index) {\n        _results.push(delete pending[i]);\n      } else {\n        _results.push(void 0);\n      }\n    }\n    return _results;\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/Serializer.js"
));

require.define("/node_modules/racer/lib/txns/diff.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar deepCopy, diffArrays, eventRegExp, lookup, transaction, txnEffect, _ref;\n\ndiffArrays = require('../diffMatchPatch').diffArrays;\n\n_ref = require('../path'), eventRegExp = _ref.eventRegExp, lookup = _ref.lookup;\n\ndeepCopy = require('../util').deepCopy;\n\ntransaction = require('../transaction');\n\nmodule.exports = {\n  txnEffect: txnEffect = function(txn, method, args) {\n    var ins, num, rem;\n    switch (method) {\n      case 'push':\n        ins = transaction.getMeta(txn);\n        num = args.length - 1;\n        break;\n      case 'unshift':\n        ins = 0;\n        num = args.length - 1;\n        break;\n      case 'insert':\n        ins = args[1];\n        num = args.length - 2;\n        break;\n      case 'pop':\n        rem = transaction.getMeta(txn);\n        num = 1;\n        break;\n      case 'shift':\n        rem = 0;\n        num = 1;\n        break;\n      case 'remove':\n        rem = args[1];\n        num = args[2];\n        break;\n      case 'move':\n        ins = args[1];\n        rem = args[2];\n        num = 1;\n    }\n    return [ins, rem, num];\n  },\n  mergeTxn: function(txn, txns, txnQueue, arrayMutator, memory, before, after) {\n    var afterData, args, argsQ, arr, arrPath, arraySubPath, beforeData, diff, i, id, ins, isArrayMutator, item, match, method, methodQ, num, op, parent, parentPath, patch, patchConcat, path, pathQ, prop, rem, remainder, resetPaths, root, txnQ, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref1, _ref2, _results;\n    path = transaction.getPath(txn);\n    method = transaction.getMethod(txn);\n    args = transaction.getArgs(txn);\n    if (isArrayMutator = arrayMutator[method]) {\n      _ref1 = txnEffect(txn, method, args), ins = _ref1[0], rem = _ref1[1], num = _ref1[2];\n      arraySubPath = eventRegExp(\"(\" + path + \".(\\\\d+)).*\");\n    }\n    beforeData = before._data;\n    afterData = after._data;\n    resetPaths = [];\n    patchConcat = [];\n    for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {\n      id = txnQueue[_i];\n      txnQ = txns[id];\n      if (txnQ.callback) {\n        continue;\n      }\n      pathQ = transaction.getPath(txnQ);\n      if (!transaction.pathConflict(path, pathQ)) {\n        continue;\n      }\n      methodQ = transaction.getMethod(txnQ);\n      if (isArrayMutator || arrayMutator[methodQ]) {\n        if (!arrPath) {\n          if (isArrayMutator) {\n            arrPath = path;\n          } else {\n            arraySubPath = eventRegExp(\"(\" + pathQ + \".\\\\d+).*\");\n            if ((match = arraySubPath.exec(path)) && (typeof memory.get(match[1]) === 'object')) {\n              continue;\n            }\n            arrPath = pathQ;\n          }\n          arr = memory.get(arrPath);\n          before.set(arrPath, arr && arr.slice(), 1, beforeData);\n          after.set(arrPath, arr && arr.slice(), 1, afterData);\n          after[method].apply(after, args.concat(1, afterData));\n        }\n        argsQ = deepCopy(transaction.getArgs(txnQ));\n        if (arraySubPath && (match = arraySubPath.exec(pathQ))) {\n          parentPath = match[1];\n          i = +match[2];\n          if (i >= ins) {\n            i += num;\n          }\n          if (i >= rem) {\n            i -= num;\n          }\n          if (typeof before.get(parentPath) === 'object') {\n            resetPaths.push([\"\" + path + \".\" + i, match[3]]);\n            patchConcat.push({\n              method: methodQ,\n              args: argsQ\n            });\n            continue;\n          }\n        }\n        before[methodQ].apply(before, argsQ.concat(1, beforeData));\n        after[methodQ].apply(after, argsQ.concat(1, afterData));\n      } else {\n        txnQ.emitted = false;\n      }\n    }\n    if (arrPath) {\n      txn.patch = patch = [];\n      diff = diffArrays(before.get(arrPath), after.get(arrPath));\n      for (_j = 0, _len1 = diff.length; _j < _len1; _j++) {\n        op = diff[_j];\n        method = op[0];\n        op[0] = arrPath;\n        patch.push({\n          method: method,\n          args: op\n        });\n      }\n      for (_k = 0, _len2 = resetPaths.length; _k < _len2; _k++) {\n        _ref2 = resetPaths[_k], root = _ref2[0], remainder = _ref2[1];\n        i = remainder.indexOf('.');\n        prop = ~i ? remainder.substr(0, i) : remainder;\n        if ((parent = after.get(root)) && (prop in parent)) {\n          patch.push({\n            method: 'set',\n            args: [\"\" + root + \".\" + remainder, lookup(remainder, parent)]\n          });\n        } else {\n          patch.push({\n            method: 'del',\n            args: [\"\" + root + \".\" + prop]\n          });\n        }\n      }\n      _results = [];\n      for (_l = 0, _len3 = patchConcat.length; _l < _len3; _l++) {\n        item = patchConcat[_l];\n        _results.push(patch.push(item));\n      }\n      return _results;\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/txns/diff.js"
));

require.define("/node_modules/racer/lib/adapters/pubsub-memory/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar patternInterface, prefixInterface, queryInterface, stringInterface;\n\npatternInterface = require('./channel-interface-pattern');\n\nprefixInterface = require('./channel-interface-prefix');\n\nstringInterface = require('./channel-interface-string');\n\nqueryInterface = require('./channel-interface-query');\n\nmodule.exports = function(racer, opts) {\n  if (opts == null) {\n    opts = {};\n  }\n  racer.mixin({\n    type: 'Store',\n    events: {\n      init: function(store) {\n        var pubSub;\n        pubSub = store._pubSub;\n        pubSub.defChannelInterface('pattern', patternInterface(pubSub));\n        pubSub.defChannelInterface('prefix', prefixInterface(pubSub));\n        pubSub.defChannelInterface('string', stringInterface(pubSub));\n        return pubSub.defChannelInterface('query', queryInterface(pubSub, store));\n      }\n    }\n  });\n};\n\n//@ sourceURL=/node_modules/racer/lib/adapters/pubsub-memory/index.js"
));

require.define("/node_modules/racer/lib/adapters/pubsub-memory/channel-interface-pattern.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar hasKeys, pathRegExp, patternInterface;\n\npathRegExp = require('../../path').regExp;\n\nhasKeys = require('../../util').hasKeys;\n\nmodule.exports = patternInterface = function(pubSub) {\n  var forwardIndex, intf, reverseIndex;\n  forwardIndex = {};\n  reverseIndex = {};\n  intf = {};\n  intf.subscribe = function(subscriberId, pattern, ackCb) {\n    var subsForPattern;\n    (reverseIndex[subscriberId] || (reverseIndex[subscriberId] = {}))[pattern] = true;\n    if (!(subsForPattern = forwardIndex[pattern])) {\n      subsForPattern = forwardIndex[pattern] = {\n        re: pathRegExp(pattern),\n        subscribers: {}\n      };\n    }\n    subsForPattern.subscribers[subscriberId] = true;\n    return typeof ackCb === \"function\" ? ackCb(null) : void 0;\n  };\n  intf.publish = function(msg) {\n    var params, pattern, re, subscriberId, subscribers, type, _ref, _results;\n    type = msg.type, params = msg.params;\n    switch (type) {\n      case 'txn':\n      case 'ot':\n        _results = [];\n        for (pattern in forwardIndex) {\n          _ref = forwardIndex[pattern], re = _ref.re, subscribers = _ref.subscribers;\n          if (!re.test(params.channel)) {\n            continue;\n          }\n          _results.push((function() {\n            var _results1;\n            _results1 = [];\n            for (subscriberId in subscribers) {\n              _results1.push(pubSub.emit(type, subscriberId, params.data));\n            }\n            return _results1;\n          })());\n        }\n        return _results;\n    }\n  };\n  intf.unsubscribe = function(subscriberId, pattern, ackCb) {\n    var patterns, subscribers;\n    if (typeof pattern !== 'string') {\n      ackCb = pattern;\n      for (pattern in reverseIndex[subscriberId]) {\n        subscribers = forwardIndex[pattern].subscribers;\n        delete subscribers[subscriberId];\n        if (!hasKeys(subscribers)) {\n          delete forwardIndex[pattern];\n        }\n      }\n      delete reverseIndex[subscriberId];\n    } else {\n      if (!(patterns = reverseIndex[subscriberId])) {\n        return typeof ackCb === \"function\" ? ackCb(null) : void 0;\n      }\n      delete patterns[pattern];\n      if (!hasKeys(patterns)) {\n        delete reverseIndex[subscriberId];\n      }\n      subscribers = forwardIndex[pattern].subscribers;\n      delete subscribers[subscriberId];\n      if (!hasKeys(subscribers)) {\n        delete forwardIndex[pattern];\n      }\n    }\n    return typeof ackCb === \"function\" ? ackCb(null) : void 0;\n  };\n  intf.hasSubscriptions = function(subscriberId) {\n    return subscriberId in reverseIndex;\n  };\n  intf.subscribedTo = function(subscriberId, pattern) {\n    var patterns;\n    if (!(patterns = reverseIndex[subscriberId])) {\n      return false;\n    }\n    return pattern in patterns;\n  };\n  return intf;\n};\n\n//@ sourceURL=/node_modules/racer/lib/adapters/pubsub-memory/channel-interface-pattern.js"
));

require.define("/node_modules/racer/lib/adapters/pubsub-memory/channel-interface-prefix.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar patternInterface, prefixInterface;\n\npatternInterface = require('./channel-interface-pattern');\n\nmodule.exports = prefixInterface = function(pubSub) {\n  var patternApi;\n  patternApi = patternInterface(pubSub);\n  return {\n    subscribe: function(subscriberId, prefix, ackCb) {\n      return patternApi.subscribe(subscriberId, prefix, ackCb);\n    },\n    publish: function(msg) {\n      return patternApi.publish(msg);\n    },\n    unsubscribe: function(subscriberId, prefix, ackCb) {\n      return patternApi.unsubscribe(subscriberId, prefix, ackCb);\n    },\n    hasSubscriptions: function(subscriberId) {\n      return patternApi.hasSubscriptions(subscriberId);\n    },\n    subscribedTo: function(subscriberId, prefix) {\n      return patternApi.subscribedTo(subscriberId, prefix);\n    }\n  };\n};\n\n//@ sourceURL=/node_modules/racer/lib/adapters/pubsub-memory/channel-interface-prefix.js"
));

require.define("/node_modules/racer/lib/adapters/pubsub-memory/channel-interface-string.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar hasKeys, pathRegExp, stringInterface;\n\npathRegExp = require('../../path').regExp;\n\nhasKeys = require('../../util').hasKeys;\n\nmodule.exports = stringInterface = function(pubSub) {\n  var forwardIndex, intf, reverseIndex;\n  forwardIndex = {};\n  reverseIndex = {};\n  intf = {};\n  intf.subscribe = function(subscriberId, str, ackCb) {\n    var strings, subscribers;\n    subscribers = forwardIndex[str] || (forwardIndex[str] = {});\n    subscribers[subscriberId] = true;\n    strings = reverseIndex[subscriberId] || (reverseIndex[subscriberId] = {});\n    strings[str] = true;\n    return typeof ackCb === \"function\" ? ackCb(null) : void 0;\n  };\n  intf.publish = function(_arg) {\n    var params, subscriberId, subscribers, type;\n    type = _arg.type, params = _arg.params;\n    switch (type) {\n      case 'direct':\n        if (subscribers = forwardIndex[params.channel]) {\n          for (subscriberId in subscribers) {\n            pubSub.emit('direct', subscriberId, params.data);\n          }\n        }\n        break;\n      case 'txn':\n        if (subscribers = forwardIndex[params.channel]) {\n          for (subscriberId in subscribers) {\n            pubSub.emit('txn', subscriberId, params.data);\n          }\n        }\n        break;\n      case 'addDoc':\n        if (subscribers = forwardIndex[params.channel]) {\n          for (subscriberId in subscribers) {\n            pubSub.emit('addDoc', subscriberId, params.data);\n          }\n        }\n        break;\n      case 'rmDoc':\n        if (subscribers = forwardIndex[params.channel]) {\n          for (subscriberId in subscribers) {\n            pubSub.emit('rmDoc', subscriberId, params.data);\n          }\n        }\n    }\n  };\n  intf.unsubscribe = function(subscriberId, str, ackCb) {\n    var strings, subscribers;\n    if (typeof str !== 'string') {\n      ackCb = str;\n      for (str in reverseIndex[subscriberId]) {\n        subscribers = forwardIndex[str];\n        delete subscribers[subscriberId];\n        if (!hasKeys(subscribers)) {\n          delete forwardIndex[str];\n        }\n      }\n      delete reverseIndex[subscriberId];\n    } else {\n      strings = reverseIndex[subscriberId];\n      delete strings[str];\n      if (!hasKeys(strings)) {\n        delete reverseIndex[subscriberId];\n      }\n      subscribers = forwardIndex[str];\n      delete subscribers[subscriberId];\n      if (!hasKeys(subscribers)) {\n        delete forwardIndex[str];\n      }\n    }\n    return typeof ackCb === \"function\" ? ackCb(null) : void 0;\n  };\n  intf.hasSubscriptions = function(subscriberId) {\n    return subscriberId in reverseIndex;\n  };\n  intf.subscribedTo = function(subscriberId, str) {\n    var strings;\n    if (!(strings = reverseIndex[subscriberId])) {\n      return false;\n    }\n    return str in strings;\n  };\n  return intf;\n};\n\n//@ sourceURL=/node_modules/racer/lib/adapters/pubsub-memory/channel-interface-string.js"
));

require.define("/node_modules/racer/lib/adapters/pubsub-memory/channel-interface-query.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar LiveQuery, Memory, applyTxn, deepCopy, deserializeQuery, finishAfter, isServer, memory, publish, queryInterface, transaction, _ref,\n  __slice = [].slice;\n\n_ref = require('../../util'), isServer = _ref.isServer, deepCopy = _ref.deepCopy, finishAfter = _ref.finishAfter;\n\nconsole.assert(isServer);\n\nMemory = require('../../Memory');\n\ntransaction = require('../../transaction.server');\n\nLiveQuery = require('../../pubSub/LiveQuery');\n\ndeserializeQuery = require('../../pubSub/Query').deserialize;\n\nmodule.exports = queryInterface = function(pubSub, store) {\n  var intf, liveQueries, reverseIndex;\n  reverseIndex = {};\n  liveQueries = store._liveQueries;\n  intf = {};\n  intf.subscribe = function(subscriberId, query, ackCb) {\n    var hash, hashes;\n    hash = query.hash();\n    hashes = reverseIndex[subscriberId] || (reverseIndex[subscriberId] = {});\n    hashes[hash] = true;\n    liveQueries[hash] || (liveQueries[hash] = new LiveQuery(query));\n    return pubSub.string.subscribe(subscriberId, [\"$q.\" + hash], ackCb);\n  };\n  intf.publish = function(_arg, meta) {\n    var newDoc, origDoc, params, txn, type;\n    type = _arg.type, params = _arg.params;\n    if (!(type === 'txn' && meta)) {\n      return;\n    }\n    txn = params.data;\n    if (!(origDoc = meta.origDoc)) {\n      return publish(store, params, meta);\n    }\n    newDoc = origDoc ? deepCopy(origDoc) : transaction.getArgs(txn)[1];\n    newDoc = applyTxn(txn, newDoc);\n    return publish(store, params, origDoc, newDoc);\n  };\n  intf.unsubscribe = function(subscriberId, query, ackCb) {\n    var channels, hash, hashes;\n    if (!(query != null ? query.isQuery : void 0)) {\n      hashes = reverseIndex[subscriberId];\n      delete reverseIndex[subscriberId];\n      channels = (function() {\n        var _results;\n        _results = [];\n        for (hash in hashes) {\n          _results.push(\"$q.\" + hash);\n        }\n        return _results;\n      })();\n      if (ackCb = query) {\n        ackCb = finishAfter(channels.length, ackCb);\n      }\n    } else {\n      channels = [\"$q.\" + (query.hash())];\n    }\n    if (!channels.length) {\n      return typeof ackCb === \"function\" ? ackCb(null) : void 0;\n    }\n    return pubSub.unsubscribe(subscriberId, channels, ackCb);\n  };\n  intf.hasSubscriptions = function(subscriberId) {\n    return subscriberId in reverseIndex;\n  };\n  intf.subscribedTo = function(subscriberId, query) {\n    return pubSub.subscribedTo(subscriberId, \"$q.\" + (query.hash()));\n  };\n  return intf;\n};\n\npublish = function(store, params, origDoc, newDoc) {\n  var channel, doc, hash, liveQueries, nsPlusId, parts, pseudoVer, pubSub, query, txn, txnId, txnNs, txnPath, txnVer, _ref1;\n  txn = params.data;\n  txnVer = transaction.getVer(txn);\n  pseudoVer = function() {\n    return txnVer += 0.01;\n  };\n  txnPath = transaction.getPath(txn);\n  _ref1 = parts = txnPath.split('.'), txnNs = _ref1[0], txnId = _ref1[1];\n  nsPlusId = txnNs + '.' + txnId;\n  liveQueries = store._liveQueries, pubSub = store._pubSub;\n  if (transaction.getMethod(txn) === 'set' && parts.length === 2) {\n    doc = transaction.getArgs(txn)[1];\n    for (hash in liveQueries) {\n      query = liveQueries[hash];\n      channel = \"$q.\" + hash;\n      if (query.isPaginated) {\n        if (!query.testWithoutPaging(doc, nsPlusId)) {\n          continue;\n        }\n        query.updateCache(store, function(err, newMembers, oldMembers, ver) {\n          var mem, _i, _j, _len, _len1, _results;\n          if (err) {\n            throw err;\n          }\n          for (_i = 0, _len = newMembers.length; _i < _len; _i++) {\n            mem = newMembers[_i];\n            pubSub.publish({\n              type: 'addDoc',\n              params: {\n                channel: channel,\n                data: {\n                  ns: txnNs,\n                  doc: mem,\n                  ver: pseudoVer()\n                }\n              }\n            });\n          }\n          _results = [];\n          for (_j = 0, _len1 = oldMembers.length; _j < _len1; _j++) {\n            mem = oldMembers[_j];\n            _results.push(pubSub.publish({\n              type: 'rmDoc',\n              params: {\n                channel: channel,\n                data: {\n                  ns: txnNs,\n                  doc: mem,\n                  hash: hash,\n                  id: mem.id,\n                  ver: pseudoVer()\n                }\n              }\n            }));\n          }\n          return _results;\n        });\n      }\n      if (!query.test(doc, nsPlusId)) {\n        continue;\n      }\n      if (!query.isPaginated || (query.isPaginated && query.isCacheImpactedByTxn(txn))) {\n        pubSub.publish(channel, params);\n        pubSub.publish({\n          type: 'txn',\n          params: {\n            channel: channel,\n            data: txn\n          }\n        });\n      }\n    }\n    return;\n  }\n  for (hash in liveQueries) {\n    query = liveQueries[hash];\n    channel = \"$q.\" + hash;\n    if (query.isPaginated) {\n      if (query.testWithoutPaging(origDoc, nsPlusId) || query.testWithoutPaging(newDoc, nsPlusId)) {\n        query.updateCache(store, function(err, newMembers, oldMembers, ver) {\n          var mem, _i, _j, _len, _len1;\n          if (err) {\n            throw err;\n          }\n          for (_i = 0, _len = newMembers.length; _i < _len; _i++) {\n            mem = newMembers[_i];\n            pubSub.publish({\n              type: 'addDoc',\n              params: {\n                channel: channel,\n                data: {\n                  ns: txnNs,\n                  doc: mem,\n                  ver: pseudoVer()\n                }\n              }\n            });\n          }\n          for (_j = 0, _len1 = oldMembers.length; _j < _len1; _j++) {\n            mem = oldMembers[_j];\n            pubSub.publish({\n              type: 'rmDoc',\n              params: {\n                channel: channel,\n                data: {\n                  ns: txnNs,\n                  doc: mem,\n                  hash: hash,\n                  id: mem.id,\n                  ver: pseudoVer()\n                }\n              }\n            });\n          }\n          if (query.isCacheImpactedByTxn(txn)) {\n            pubSub.publish({\n              type: 'txn',\n              params: {\n                channel: channel,\n                data: txn\n              }\n            });\n          }\n        });\n      }\n    } else if (query.test(origDoc, nsPlusId)) {\n      if (query.test(newDoc, nsPlusId)) {\n        pubSub.publish({\n          type: 'txn',\n          params: {\n            channel: channel,\n            data: txn\n          }\n        });\n      } else {\n        pubSub.publish({\n          type: 'rmDoc',\n          params: {\n            channel: channel,\n            data: {\n              ns: txnNs,\n              doc: newDoc,\n              hash: hash,\n              id: origDoc.id,\n              ver: pseudoVer()\n            }\n          }\n        });\n      }\n    } else if (query.test(newDoc, nsPlusId)) {\n      pubSub.publish({\n        type: 'addDoc',\n        params: {\n          channel: channel,\n          data: {\n            ns: txnNs,\n            doc: newDoc,\n            ver: pseudoVer()\n          }\n        }\n      });\n      pubSub.publish({\n        type: 'txn',\n        params: {\n          channel: channel,\n          data: txn\n        }\n      });\n    }\n  }\n};\n\nmemory = new Memory;\n\nmemory.setVersion = function() {};\n\napplyTxn = function(txn, doc) {\n  var args, data, id, method, ns, path, world, _ref1;\n  method = transaction.getMethod(txn);\n  args = transaction.getArgs(txn);\n  path = transaction.getPath(txn);\n  if (method === 'del' && path.split('.').length === 2) {\n    return;\n  }\n  _ref1 = path.split('.'), ns = _ref1[0], id = _ref1[1];\n  world = {};\n  world[ns] = {};\n  world[ns][id] = doc;\n  data = {\n    world: world\n  };\n  try {\n    memory[method].apply(memory, __slice.call(args).concat([-1], [data]));\n  } catch (err) {\n\n  }\n  return doc;\n};\n\n//@ sourceURL=/node_modules/racer/lib/adapters/pubsub-memory/channel-interface-query.js"
));

require.define("/node_modules/racer/lib/transaction.server.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar transaction;\n\ntransaction = module.exports = require('./transaction');\n\ntransaction.conflict = function(txnA, txnB) {\n  var clientIdA, clientIdB, clientVerA, clientVerB, txnAId, _ref, _ref1;\n  if (!transaction.pathConflict(transaction.getPath(txnA), transaction.getPath(txnB))) {\n    return false;\n  }\n  txnAId = transaction.getId(txnA);\n  if (txnAId.charAt(0) !== '#') {\n    _ref = transaction.clientIdAndVer(txnA), clientIdA = _ref[0], clientVerA = _ref[1];\n    _ref1 = transaction.clientIdAndVer(txnB), clientIdB = _ref1[0], clientVerB = _ref1[1];\n    if (clientIdA === clientIdB) {\n      if (clientVerA > clientVerB) {\n        return false;\n      }\n    }\n  }\n  if (txnAId === transaction.getId(txnB)) {\n    return 'duplicate';\n  }\n  return 'conflict';\n};\n\n//@ sourceURL=/node_modules/racer/lib/transaction.server.js"
));

require.define("/node_modules/racer/lib/racer.browser.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar exports, isReady, mergeAll, model;\n\nmergeAll = require('./util').mergeAll;\n\nisReady = model = null;\n\nexports = module.exports = function(racer) {\n  return mergeAll(racer, {\n    init: function(_arg, socket) {\n      var clientId, count, ioUri, item, memory, method, onLoad, startId, _i, _len;\n      clientId = _arg[0], memory = _arg[1], count = _arg[2], onLoad = _arg[3], startId = _arg[4], ioUri = _arg[5];\n      model = new racer[\"protected\"].Model;\n      model._clientId = clientId;\n      model._startId = startId;\n      model._memory.init(memory);\n      model._count = count;\n      for (_i = 0, _len = onLoad.length; _i < _len; _i++) {\n        item = onLoad[_i];\n        method = item.shift();\n        model[method].apply(model, item);\n      }\n      racer.emit('init', model);\n      model._setSocket(socket || io.connect(ioUri, {\n        'reconnection delay': 100,\n        'max reconnection attempts': 20,\n        query: 'clientId=' + clientId\n      }));\n      isReady = true;\n      racer.emit('ready', model);\n      return racer;\n    },\n    ready: function(onready) {\n      return function() {\n        if (isReady) {\n          return onready(model);\n        }\n        return racer.on('ready', onready);\n      };\n    }\n  });\n};\n\nexports.useWith = {\n  server: false,\n  browser: true\n};\n\n//@ sourceURL=/node_modules/racer/lib/racer.browser.js"
));

require.define("/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"./server.js\"}\n//@ sourceURL=/package.json"
));

require.define("/shared.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\n\nexports.todoHtml = function(_arg) {\n  var checked, completed, id, text;\n  id = _arg.id, text = _arg.text, completed = _arg.completed;\n  if (completed) {\n    completed = 'completed';\n    checked = 'checked';\n  } else {\n    completed = '';\n    checked = '';\n  }\n  return \"<li id=\" + id + \" class=\" + completed + \"><table width=100%><tr>\\n<td class=handle width=0><td width=100%><div class=todo>\\n  <label><input id=check\" + id + \" type=checkbox \" + checked + \" onchange=todos.check(this,'\" + id + \"')><i></i></label>\\n  <div id=text\" + id + \" data-id=\" + id + \" contenteditable=true>\" + text + \"</div>\\n</div>\\n<td width=0><button class=delete onclick=todos.del('\" + id + \"')>Delete</button></table>\";\n};\n\n//@ sourceURL=/shared.js"
));

require.define("/client.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar racer, todoHtml;\n\nracer = require('racer');\n\ntodoHtml = require('./shared').todoHtml;\n\nprocess.nextTick(function() {\n  racer.init(this.init);\n  return delete this.init;\n});\n\n$(racer.ready(function(model) {\n  var checkChanged, checkChangedDelayed, checkShortcuts, content, htmlEscape, lastHtml, list, newTodo, overlay, todoList;\n  newTodo = $('#new-todo');\n  todoList = $('#todos');\n  content = $('#content');\n  overlay = $('#overlay');\n  list = model.at('_todoList');\n  model.on('connectionStatus', function(connected, canConnect) {\n    return overlay.html(connected ? '' : canConnect ? '<p id=info>Offline<span id=reconnect> &ndash; <a href=# onclick=\"return todos.connect()\">Reconnect</a></span>' : '<p id=info>Unable to reconnect &ndash; <a href=javascript:window.location.reload()>Reload</a>');\n  });\n  model.on('reInit', function() {\n    var listHtml, todo, _i, _len, _ref;\n    listHtml = '';\n    _ref = model.get('_todoList');\n    for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n      todo = _ref[_i];\n      listHtml += todoHtml(todo);\n    }\n    return todoList.html(listHtml);\n  });\n  list.on('push', function(value) {\n    return todoList.append(todoHtml(value));\n  });\n  list.on('insert', function(index, value) {\n    return todoList.children().eq(index).before(todoHtml(value));\n  });\n  model.on('set', 'todos.*.completed', function(id, value) {\n    $(\"#\\\\\" + id).toggleClass('completed', value);\n    return $(\"#check\\\\\" + id).prop('checked', value);\n  });\n  list.on('remove', function(index, howMany, _arg) {\n    var id;\n    id = _arg[0];\n    return $(\"#\\\\\" + id).remove();\n  });\n  list.on('move', function(from, to, howMany, _arg) {\n    var id, target;\n    id = _arg[0];\n    target = todoList.children().get(to);\n    if (id.toString() === target.id) {\n      return;\n    }\n    if (from > to && to !== -1) {\n      return $(\"#\\\\\" + id).insertBefore(target);\n    } else {\n      return $(\"#\\\\\" + id).insertAfter(target);\n    }\n  });\n  model.on('set', 'todos.*.text', function(id, value) {\n    var el;\n    el = $(\"#text\\\\\" + id);\n    if (el.is(':focus')) {\n      return;\n    }\n    return el.html(value);\n  });\n  window.todos = {\n    connect: function() {\n      var reconnect;\n      reconnect = document.getElementById('reconnect');\n      reconnect.style.display = 'none';\n      setTimeout((function() {\n        return reconnect.style.display = 'inline';\n      }), 1000);\n      model.socket.socket.connect();\n      return false;\n    },\n    addTodo: function() {\n      var i, items, text, todo, _i, _len;\n      if (!(text = htmlEscape(newTodo.val()))) {\n        return;\n      }\n      newTodo.val('');\n      items = list.get();\n      for (i = _i = 0, _len = items.length; _i < _len; i = ++_i) {\n        todo = items[i];\n        if (todo.completed) {\n          break;\n        }\n      }\n      todo = {\n        groupId: model.get('_group.id'),\n        completed: false,\n        text: text\n      };\n      if (i === items.length) {\n        return list.push(todo);\n      } else {\n        return list.insert(i, todo);\n      }\n    },\n    check: function(checkbox, id) {\n      model.set(\"todos.\" + id + \".completed\", checkbox.checked);\n      if (checkbox.checked) {\n        return list.move({\n          id: id\n        }, -1);\n      }\n    },\n    del: function(id) {\n      return list.remove({\n        id: id\n      });\n    }\n  };\n  todoList.sortable({\n    handle: '.handle',\n    axis: 'y',\n    containment: '#dragbox',\n    update: function(e, ui) {\n      var item, to;\n      item = ui.item[0];\n      to = todoList.children().index(item);\n      return list.move({\n        id: item.id\n      }, to);\n    }\n  });\n  lastHtml = '';\n  checkChanged = function(e) {\n    var html, id, target, text;\n    html = content.html();\n    if (html === lastHtml) {\n      return;\n    }\n    lastHtml = html;\n    target = e.target;\n    if (!(id = target.getAttribute('data-id'))) {\n      return;\n    }\n    text = target.innerHTML;\n    return model.set(\"todos.\" + id + \".text\", text);\n  };\n  checkChangedDelayed = function(e) {\n    return setTimeout(checkChanged, 10, e);\n  };\n  checkShortcuts = function(e) {\n    var code, command;\n    if (!(e.metaKey || e.ctrlKey)) {\n      return;\n    }\n    code = e.which;\n    if (!(command = ((function() {\n      switch (code) {\n        case 66:\n          return 'bold';\n        case 73:\n          return 'italic';\n        case 32:\n          return 'removeFormat';\n        case 220:\n          return 'removeFormat';\n        default:\n          return null;\n      }\n    })()))) {\n      return;\n    }\n    document.execCommand(command, false, null);\n    if (e.preventDefault) {\n      e.preventDefault();\n    }\n    return false;\n  };\n  content.keydown(checkShortcuts).keydown(checkChanged).keyup(checkChanged).bind('paste', checkChangedDelayed).bind('dragover', checkChangedDelayed);\n  document.execCommand('useCSS', false, true);\n  document.execCommand('styleWithCSS', false, false);\n  return htmlEscape = function(s) {\n    if (s == null) {\n      return '';\n    } else {\n      return s.toString().replace(/&(?!\\s)|</g, function(s) {\n        if (s === '&') {\n          return '&amp;';\n        } else {\n          return '&lt;';\n        }\n      });\n    }\n  };\n}));\n\n//@ sourceURL=/client.js"
));
require("/client.js");
