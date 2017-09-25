var assert = require( 'assert' )
var fs = require( 'fs' )
var path = require( 'path' )
var inspect = require( './inspect' )
var XAR = require( '..' )

describe( 'XAR.Archive', function() {

  var archive = null
  var filename = path.join( __dirname, 'data', 'test.xar' )

  specify( 'constructor', function() {
    archive = new XAR.Archive()
  })

  specify( '.open()', function( done ) {
    archive.open( filename, function( error ) {
      assert.ok( isFinite( archive.fd ) && archive.fd > 3, 'Invalid file descriptor' )
      done( error )
    })
  })

  specify( 'log', function() {
    console.log( inspect( archive ) )
  })

  specify( '.readdir( / )', function( done ) {
    archive.readdir( '/', ( error, ls ) => {
      // console.log( error || inspect( ls ) )
      if( error ) return done( error )
      assert.ok( ls && ls.length > 0, 'Missing directory contents')
      done( error )
    })
  })

  specify( '.readdir( . )', function( done ) {
    archive.readdir( '.', ( error, ls ) => {
      // console.log( error || inspect( ls ) )
      if( error ) return done( error )
      assert.ok( ls && ls.length > 0, 'Missing directory contents')
      done( error )
    })
  })

  specify( '.readdir( subdirectory )', function( done ) {
    archive.readdir( 'subdirectory', ( error, ls ) => {
      // console.log( error || inspect( ls ) )
      if( error ) return done( error )
      assert.ok( ls && ls.length > 0, 'Missing directory contents')
      done( error )
    })
  })

  specify( '.readdir( subdirectory/ )', function( done ) {
    archive.readdir( 'subdirectory/', ( error, ls ) => {
      // console.log( error || inspect( ls ) )
      if( error ) return done( error )
      assert.ok( ls && ls.length > 0, 'Missing directory contents')
      done( error )
    })
  })

  specify( '.readdir( /root.txt )', function( done ) {
    archive.readdir( '/root.txt', ( error, ls ) => {
      assert.ok( error instanceof Error )
      assert.equal( error.message, 'ENOTDIR: not a directory, readdir \'/root.txt\'' )
      done()
    })
  })

  specify( '.readFile()', function( done ) {
    var size = 35
    archive.readFile( 'root.txt', function( error, buffer ) {
      assert.ifError( error )
      assert.equal( buffer.length, size, 'Size mismatch' )
      done( error )
    })
  })

  specify( '.readFile( doesnotexist )', function( done ) {
    archive.readFile( 'doesnotexist', function( error, buffer ) {
      assert.ok( error instanceof Error, 'Missing expected error' )
      assert.equal( error.message, 'ENOENT: no such file, open \'/doesnotexist\'' )
      done()
    })
  })

  specify( '.createReadStream()', function( done ) {
    var size = 35
    var stream = archive.createReadStream( 'root.txt' )
    stream.on( 'error', done )
    stream.on( 'end', done )
    stream.resume()
  })

  specify( '.createReadStream( doesnotexist )', function( done ) {
    var stream = archive.createReadStream( 'doesnotexist' )
    stream.on( 'error', function( error ) {
      assert.ok( error instanceof Error, 'Missing expected error' )
      assert.equal( error.message, 'ENOENT: no such file, open \'/doesnotexist\'' )
      done()
    })
    stream.on( 'end', function() {
      done( new Error( 'Missing expected error' ) )
    })
    stream.resume()
  })

  specify( '.close()', function( done ) {
    archive.close( function( error ) {
      assert.equal( archive.fd, null, 'File descriptor still present' )
      done( error )
    })
  })

})
