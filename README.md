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

```js
var archive = new xar.Archive( 'something.xar' )

archive.open( function( error ) {
  // ...
})
```

## References

- [mackyle/xar](https://github.com/mackyle/xar/wiki/xarformat)
- [Wikipedia/xar](https://en.wikipedia.org/wiki/Xar_%28archiver%29)
