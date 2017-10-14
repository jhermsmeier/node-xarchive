# xarchive
[![npm](https://img.shields.io/npm/v/xarchive.svg?style=flat-square)](https://npmjs.com/package/xarchive)
[![npm license](https://img.shields.io/npm/l/xarchive.svg?style=flat-square)](https://npmjs.com/package/xarchive)
[![npm downloads](https://img.shields.io/npm/dm/xarchive.svg?style=flat-square)](https://npmjs.com/package/xarchive)
[![build status](https://img.shields.io/travis/jhermsmeier/node-xarchive/master.svg?style=flat-square)](https://travis-ci.org/jhermsmeier/node-xarchive)

Extensible Archive Format

## Install via [npm](https://npmjs.com)

```sh
$ npm install --save xarchive
```

## Usage

```js
var xar = require( 'xarchive' )
```

### Opening an Archive

```js
var archive = new xar.Archive( 'something.xar' )

archive.open( function( error ) {
  // ...
})
```

### Reading Directories

```js
archive.readdir( '/', ( error, ls ) => {
  console.log( error || ls )
})
```

```js
[ 'file.txt', 'subdirectory' ]
```

### Reading Files

**Reading an entire file:**

```js
archive.readFile( 'file.txt', function( error, buffer ) {
  // ...
})
```

**Streaming from a file:**

```js
var readableStream = archive.createReadStream( 'file.txt' )
```

## References

- [mackyle/xar/wiki](https://github.com/mackyle/xar/wiki/xarformat)
- [Wikipedia/xar](https://en.wikipedia.org/wiki/Xar_%28archiver%29)
- [opensource.apple.com/source/xar](https://opensource.apple.com/source/xar/)
- [code.google.com/archive/p/xar](https://code.google.com/archive/p/xar/)
