# module-stream

given a module name X and a current path Y, return a readable stream
that outputs the contents of the resolved path to X (if possible!)

```javascript

var locate = require('module-stream')

locate('my-module', __filename)
  .once('resolved', function(p) { console.error(p) })
  .pipe(process.stdout)

```

# API

### locate(module_name, current_file_path, [extensions]) -> read stream

return a readable stream looking for `module_name` (e.g., `my-module`, `./relative-module`,
`my-module/path/within`).

if the path is resolved relative to the current file path, a `'resolved'` event
will be emitted with the new path, and the stream will have a non-null
`path` attribute. immediately afterward the stream will start emitting
data events.

* current_file_path should be a path to a file, not a directory.

* extensions should contain the leading `.`: `.js`, `.html`, etc, etc.

* extensions may be a string (in which case only one extension will be attempted),
  an array (in which case each extension will be tried in order), or not provided,
  in which case it'll be assumed to be `.js`.

### resolved_stream.resolve(other_path) -> read stream

resolves a stream relative to the current resolved stream.

# license

MIT
