var Path = require('path')
  , fs = require('fs')
  , assert = require('assert')

var locate = require('../index')

var tests = [
  test_relative_require   // require('./path')
, test_updir_require      // require('../path')
, test_module_require     // require('module')
, test_module_dir_require // require('module/path')
, test_relative_resolve
, test_failure_require    // require('dne')
]

run()

function test_relative_require(ready) {
  var buffer = []

  locate('./index', __filename, ['.js'])
    .on('data', buffer.push.bind(buffer)) 
    .on('end', function() {
      assert.equal(fs.readFileSync(__filename, 'utf8'), buffer.join(''))
      ready()
    })
}

function test_updir_require(ready) {
  var buffer = []

  locate('../index', __filename, ['.js'])
    .on('data', buffer.push.bind(buffer)) 
    .on('end', function() {
      assert.equal(fs.readFileSync(Path.resolve(Path.join(__dirname, '..', 'index.js')), 'utf8'), buffer.join(''))
      ready()
    })
}

function test_module_require(ready) {
  var buffer = []

  locate('through', __filename, ['.js'])
    .on('data', buffer.push.bind(buffer)) 
    .on('end', function() {
      assert.equal(fs.readFileSync(
        Path.resolve(Path.join(__dirname, '..', 'node_modules', 'through', 'index.js'))
      , 'utf8'), buffer.join(''))
      ready()
    })
}

function test_relative_resolve(ready) {
  var buffer = []

  var p = locate('through', __filename, ['.js'])

  p.once('resolved', function() {
    p.resolve('./test/index')
      .on('data', buffer.push.bind(buffer)) 
      .on('end', function() {
        assert.equal(fs.readFileSync(
          Path.resolve(Path.join(__dirname, '..', 'node_modules', 'through', 'test', 'index.js'))
        , 'utf8'), buffer.join(''))
        ready()
      })
  })
}

function test_module_dir_require(ready) {
  var buffer = []

  locate('through/test/index', __filename, ['.js'])
    .on('data', buffer.push.bind(buffer)) 
    .on('end', function() {
      assert.equal(fs.readFileSync(
        Path.resolve(Path.join(__dirname, '..', 'node_modules', 'through', 'test', 'index.js'))
      , 'utf8'), buffer.join(''))
      ready()
    })

}

function test_failure_require(ready) {
  locate('dne', __filename, ['.js'])
    .on('error', function(e) { assert.ok(e instanceof Error), ready() })
}

function out(what) {
  process.stdout.write(what)
}

function run() {
  if(!tests.length)
    return out('\n')

  var test = tests.shift()
    , now = Date.now()

  out(test.name+' - ')
  test.length ? test(done) : (test(), done())

  function done() {
    out(''+(Date.now() - now)+'ms\n')
    run()
  }
}
