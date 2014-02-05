
# installer.js

  Component installer, used by component(1) to fetch components.

  This library does _not_ handle recursive installation or caching,
  this logic is deferred to a higher level. Authentication etc is
  handled via the `.remote` implementation shown in the API docs
  below (and need a non-GH specific API ;)).

## Installation

    $ npm install component-installer

## Example

```js
var Installer = require('component-installer');
var installer = new Installer;

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
        dep = installer.install(dep, ver);
        report(dep);
      });
    }

    console.log('  %s : installed', pkg.name);
  });
}

var tip = installer.install('component/events', '1.x');

report(tip);
```

## API

## Installer()

Initialize component client with `opts`.

- `remote` object acting as the remote [Github]
- `dir` directory [./components]

Remotes must provide the following methods:

- `.lookup(name, version, fn)`
- `.contents(name, ref, file, fn)`
- `.stream(name, ref, file) -> Stream`

## Installer.install(name, version)

  Install package `name` with semver `version`. The
  following events are available:

 - `resolve` (release) version resolved
 - `file` (filename) fetching a file
 - `error` (error) an error occurred
 - `end` install complete

## License

 MIT