
var Installer = require('./');
var tok = process.env.TOKEN;

var com = new Installer({
  token: tok
});

function report(pkg) {
 console.log('  %s : downloading', pkg.name);

  pkg.on('resolve', function(release){
    console.log('  %s : resolve %s -> %s', pkg.name, pkg.version, release.name);
  });

  pkg.on('file', function(file){
    console.log('  %s : GET %s', pkg.name, file);
  });

  pkg.on('error', function(err){
    console.log('  %s : error %s', pkg.name, err.message);
  });

  pkg.on('end', function(){
    if (pkg.config.dependencies) {
      var n = Object.keys(pkg.config.dependencies).length;
      console.log('  %s : installing %d dependencies', pkg.name, n);
      Object.keys(pkg.config.dependencies).forEach(function(dep){
        var ver = pkg.config.dependencies[dep];
        dep = com.install(dep, ver);
        report(dep);
      });
    }

    console.log('  %s : installed', pkg.name);
  });
}

var tip = com.install('component/events', '1.x');

report(tip);