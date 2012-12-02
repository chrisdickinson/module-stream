module.exports = find

var Path = require('path')
  , fs = require('fs')
  , through = require('through')

var join = Path.join
  , resolve = Path.resolve
  , dirname = Path.dirname
  , extname = Path.extname

function find(module_name, current_path, extensions) {
  var stream = through()

  stream.path = null

  current_path = dirname(current_path)

  extensions =
    typeof extensions === 'string' ? [extensions] :
    typeof extensions === 'object' && extensions.shift ? extensions :
    ['.js']

  stream.resolve = function(module_name) {
    return find(module_name, stream.path, extensions)
  }

  if(module_name[0] === '.') {
    find_relative(stream, module_name, current_path, extensions.slice())
  } else {
    find_absolute(stream, module_name, current_path, extensions.slice())
  }

  return stream
}

function find_relative(output, module_name, current_path, extensions) {
  if(!extensions.length) {
    return output.emit('error', new Error(module_name + ' does not exist'))
  }

  var dir = current_path
    , module_path = resolve(join(dir, module_name)) + extensions.shift()

  fs.exists(module_path, function(exists) {
    if(!exists) return find_relative(output, module_name, current_path, extensions)

    output.path = module_path
    output.emit('resolved', module_path)

    return fs.createReadStream(module_path).pipe(output)
  })
}

function find_absolute(output, module_name, current_path, extensions) {
  var module_bits = module_name.split(Path.sep)
    , dir = current_path
    , package_in_node_modules = join(dir, 'node_modules', module_bits[0])
    , package_json_path = join(package_in_node_modules, 'package.json')
    , package_json = {main: "./index"}
    , path

  fs.exists(package_in_node_modules, does_package_exist)

  function does_package_exist(exists) {
    exists ?
      resolve_package_from_dir() :
      next_dir_up()
  }

  function next_dir_up() {
    path = resolve(join(dir, '..'))
    if(path === dir) {
      return output.emit('error', new Error(module_name + ' does not exist'))
    }

    find_absolute(output, module_name, join(path, '.'), extensions) 
  }

  function resolve_package_from_dir() {
    if(module_bits.length > 1) {
      package_json = {main: join('.', module_bits.slice(1).join(Path.sep))}
      return got_package_json()
    }
    fs.exists(package_json_path, function(exists) {
      exists ? read_package_json() : got_package_json() 
    })
  }

  function read_package_json() {
    fs.readFile(package_json_path, 'utf8', function(err, data) {
      try {
        package_json = JSON.parse(data)
      } catch(e) { }
      got_package_json()
    })
  }

  function got_package_json() {
    if(!extensions.length) {
      return output.emit('error', new Error(module_name + ' does not exist'))
    }

    path = resolve(join(package_in_node_modules, package_json.main || './index'))

    extname(path) === extensions[0] ?
      extensions.shift() :
      (path += extensions.shift())

    fs.exists(path, function(exists) {
      if(!exists) {
        return got_package_json()
      }

      output.path = path
      output.emit('resolved', path)
      fs.createReadStream(path).pipe(output)
    })
  }
}
