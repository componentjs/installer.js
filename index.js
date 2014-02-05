
/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter;
var lookup = require('gh-lookup');
var fmt = require('util').format;
var assert = require('assert');
var mkdir = require('mkdirp');
var Batch = require('batch');
var Github = require('gh2');
var path = require('path');
var fs = require('fs');
var dirname = path.dirname;
var join = path.join;

/**
 * File fields.
 */

var filesProperties = [
  'scripts',
  'styles',
  'templates',
  'json',
  'fonts',
  'images',
  'files'
];

/**
 * Expose `Installer`.
 */

module.exports = Installer;

/**
 * Initialize component client with `opts`.
 *
 *  - `remote` object acting as the remote [Github]
 *  - `dir` directory [./components]
 *
 * Remotes must provide the following methods:
 *
 *  - `.lookup(name, version, fn)`
 *  - `.contents(name, ref, file, fn)`
 *  - `.stream(name, ref, file) -> Stream`
 *
 * TODO: ^ interface is lame, too GH specific
 *
 * @param {Object} opts
 * @api public
 */

function Installer(opts) {
  opts = opts || {};
  this.dir = opts.dir || 'components';
  this.remote = opts.remote || new Github(opts);
}

/**
 * Install package `name` with semver `version`.
 *
 * Events:
 *
 *  - `resolve` (release) version resolved
 *  - `file` (filename) fetching a file
 *  - `error` (error) an error occurred
 *  - `end` install complete
 *
 * TODO: less ugly without introducing a bunch of OO state
 *
 * @param {String} name
 * @param {String} version
 * @return {Package}
 * @api public
 */

Installer.prototype.install = function(name, version){
  var pkg = new Package(this, name, version);
  var dst = this.dir;

  pkg.release(function(err, release){
    if (err) return pkg.error(err);
    if (!release) return pkg.error('"failed to find a release that satisfies %s@%s', pkg.name, pkg.version);
    pkg.emit('resolve', release);

    var dir = join(dst, name, release.name);

    mkdir(dir, function(err){
      if (err) return pkg.error(err);

      pkg.json(release.name, function(err, conf){
        if (err) return pkg.error(err);
        pkg.config = conf;

        var files = pkg.files(conf).concat('component.json');
        var batch = new Batch;
        batch.concurrency(6);

        files.forEach(function(file){
          batch.push(function(done){
            pkg.emit('file', file);

            var stream = pkg.stream(file, release.name);
            var path = join(dir, file);
            var out = fs.createWriteStream(path);

            stream.pipe(out);

            out.on('error', done);
            stream.on('error', done);
            stream.on('end', done);
          });
        });

        batch.end(function(err){
          if (err) return pkg.error(err);
          pkg.emit('end');
        });
      });
    });
  });

  return pkg;
};

/**
 * Initialize a package with the given `name` / `version`.
 *
 * @param {Installer} client
 * @param {String} name
 * @param {String} version
 * @api private
 */

function Package(installer, name, version) {
  this.remote = installer.remote;
  this.installer = installer;
  this.version = version;
  this.name = name;
}

/**
 * Inherit from `Emitter.prototype`.
 */

Package.prototype.__proto__ = Emitter.prototype;

/**
 * Return fetchable files defined in the json `conf`.
 *
 * @param {Object} conf
 * @return {Array}
 * @api public
 */

Package.prototype.files = function(conf){
  var ret = [];

  filesProperties.forEach(function(prop){
    var files = conf[prop];
    if (!files) return;
    ret = ret.concat(files);
  });

  return ret;
};

/**
 * Emit `err`.
 *
 * @param {String|Error} err
 * @api private
 */

Package.prototype.error = function(err){
  if ('string' == typeof err) {
    err = new Error(fmt.apply(null, arguments));
  }

  this.emit('error', err);
};

/**
 * Get release
 *
 * @param {Function} fn
 * @api public
 */

Package.prototype.release = function(fn){
  this.remote.lookup(this.name, this.version, fn);
};

/**
 * Get contents of `file` at `ref`.
 *
 * @param {String} file
 * @param {String} ref
 * @param {Function} fn
 * @api public
 */

Package.prototype.contents = function(file, ref, fn){
  this.remote.contents(this.name, ref, file, fn);
};

/**
 * Stream contents of `file` at `ref`.
 *
 * @param {String} file
 * @param {String} ref
 * @param {Stream}
 * @api public
 */

Package.prototype.stream = function(file, ref){
  return this.remote.stream(this.name, ref, file);
};

/**
 * Get component.json at `ref.
 *
 * @param {String} ref
 * @param {Function} fn
 * @api public
 */

Package.prototype.json = function(ref, fn){
  this.contents('component.json', ref, function(err, file){
    if (err) return fn(err);
    var json = decode(file.content);
    fn(null, JSON.parse(json));
  });
};

/**
 * Decode base64 `str`.
 */

function decode(str) {
  return new Buffer(str, 'base64').toString();
}
