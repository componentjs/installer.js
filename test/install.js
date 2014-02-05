
var exec = require('child_process').exec;
var assert = require('assert');
var Installer = require('..');
var path = require('path');
var fs = require('fs');

describe('.install(name, version)', function(){
  beforeEach(function(done){
    exec('rm -fr components', done);
  })

  it('should install a component', function(done){
    var installer = new Installer;
    var pkg = installer.install('component/events', '1.x');
    pkg.on('end', function(){
      assertInstalled('component/events', '1.0.5');
      done();
    });
  })
})

/**
 * Assert that `version` of pkg `name` has installed.
 */

function assertInstalled(name, version) {
  var dir = path.join('components', name, version);

  var stat = fs.statSync(dir);
  assert(stat.isDirectory(), dir + ' does not exist');

  var json = fs.readFileSync(path.join(dir, 'component.json'), 'utf8');
  assert(~json.indexOf('"name": "events"'), 'json failed to install');

  var script = fs.readFileSync(path.join(dir, 'index.js'), 'utf8');
  assert(~script.indexOf('var events'), 'script failed to install');
}