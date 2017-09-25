var XAR = require( './xar' )
var path = require( 'path' )
var fs = require( 'fs' )
var os = require( 'os' )
var crypto = require( 'crypto' )
var zlib = require( 'zlib' )
var StringDecoder = require( 'string_decoder' ).StringDecoder
var xml = require( 'htmlparser2' )
var XMLHandler = require( './xml-handler' )
var stream = require( 'stream' )

/**
 * Archive
 * @constructor
 * @param {String} [filename]
 * @param {Object} [options]
 * @returns {Archive}
 */
function Archive( filename, options ) {

  if( !(this instanceof Archive) ) {
    return new Archive( filename, options )
  }

  if( typeof filename !== 'string' ) {
    options = filename
    filename = null
  }

  filename = filename || (options && options.path)

  this.path = filename ? path.resolve( filename ) : null
  this.fd = (options && options.fd) || null
  this.flags = (options && options.flags) || 'r'
  this.mode = (options && options.mode) || null

  this.header = new XAR.Header()
  this.contents = []

}

Archive.open = function( filename, options, callback ) {
  var archive = new Archive( filename, options )
  archive.open( function( error ) {
    callback( error, archive )
  })
}

/**
 * Archive prototype
 * @ignore
 */
Archive.prototype = {

  constructor: Archive,

  open( filename, options, callback ) {

    if( typeof filename !== 'string' ) {
      options = filename
      filename = null
    }

    if( typeof options === 'function' ) {
      callback = options
      options = null
    }

    filename = filename || (options && options.path)

    this.path = filename ? path.resolve( filename ) : null
    this.fd = (options && options.fd) || null
    this.flags = (options && options.flags) || 'r'
    this.mode = (options && options.mode) || null

    var tasks = [
      // Open the file
      ( next ) => {
        fs.open( this.path, this.flags, this.mode, ( error, fd ) => {
          this.fd = fd
          next( error )
        })
      },
      // Read the header, if present
      ( next ) => {

        // Read more than `XAR.HEADER_SIZE`, in case there's a custom
        // checksum algorithm specified
        var offset = 0
        var position = 0
        var length = 128
        var buffer = Buffer.alloc( length )

        fs.read( this.fd, buffer, offset, length, position, ( error, bytesRead ) => {
          if( bytesRead >= XAR.HEADER_SIZE ) {
            try {
              this.header.parse( buffer )
            } catch( exception ) {
              return next( exception )
            }
          }
          next()
        })

      },
      // Read the TOC, if header is present
      ( next ) => {

        this.contents = []

        if( !this.header.xmlLengthCompressed ) {
          return next()
        }

        var decompressor = zlib.createUnzip()
        var stringDecoder = new StringDecoder( 'utf8' )
        var decoder = new stream.Transform({
          transform( chunk, _, next ) {
            next( null, stringDecoder.write( chunk ) )
          },
          flush( done ) {
            done( null, stringDecoder.end() )
          }
        })

        var readStream = fs.createReadStream( null, {
          fd: this.fd,
          start: this.header.size,
          end: this.header.size + this.header.xmlLengthCompressed,
          autoClose: false,
        })

        var xmlHandler = new XMLHandler(( error, document, files ) => {
          if( error ) return next( error )
          // this.document = document
          this.contents = files.sort(( a, b ) => {
            return a.path.localeCompare( b.path )
          })
          xmlParser.reset()
          next()
        })

        var xmlParser = new xml.Parser( xmlHandler, {
          xmlMode: true,
          lowerCaseTags: false,
          lowerCaseAttributeNames: false,
          decodeEntities: true,
        })

        readStream
          .pipe( decompressor )
          .pipe( decoder )
          .pipe( xmlParser )

      }
    ]

    function run( error ) {
      if( error ) return void callback.call( this, error )
      var task = tasks.shift()
      if( task ) task( run )
      else callback.call( this, error )
    }

    run()

  },

  readdir( dirname, callback ) {

    dirname = path.posix.resolve( '/', dirname )

    // Check if dirname is a directory
    var file = this.contents.find(( entry ) => entry.path === dirname )
    if( dirname !== '/' && (!file || file.type !== 'directory') ) {
      var error = new Error( `ENOTDIR: not a directory, readdir '${dirname}'` )
      error.code = 'ENOTDIR'
      error.errno = -os.constants.errno[ error.code ]
      error.path = dirname
      return void callback( error )
    }

    // Scan for files in that directory
    var ls = []
    for( var i = 0; i < this.contents.length; i++ ) {
      if( this.contents[i].dirname === dirname ) {
        ls.push( this.contents[i].basename )
      }
    }

    callback( null, ls )

  },

  readFile( filename, callback ) {

    var chunks = []
    var readStream = this.createReadStream( filename )

    readStream.on( 'error', callback )

    readStream.on( 'readable', function() {
      var chunk = null
      while( chunk = this.read() ) {
        chunks.push( chunk )
      }
    })

    readStream.on( 'end', function() {
      callback( null, Buffer.concat( chunks ) )
    })

  },

  createReadStream( filename, options ) {

    filename = path.posix.resolve( '/', filename )
    options = options || {}

    var error = null
    var file = this.contents.find(( entry ) => entry.path === filename )
    if( file == null || file.type !== 'file' ) {
      error = new Error( `ENOENT: no such file, open '${filename}'` )
      error.code = 'ENOENT'
      error.errno = -os.constants.errno[ error.code ]
      error.path = filename
      var through = new stream.PassThrough()
      process.nextTick(() => {
        through.emit( 'error', error )
      })
      return through
    }

    var transform = null
    var heapOffset = this.header.size + this.header.xmlLengthCompressed
    var start = heapOffset + file.data.offset + ( options.start || 0 )
    var end = heapOffset + file.data.offset + file.data.length

    var readStream = fs.createReadStream( null, {
      fd: this.fd,
      start: start,
      end: Math.min( end, ( options.end || Infinity )),
      autoClose: false,
    })

    switch( file.data.encoding ) {
      case 'application/x-gzip':
      case 'application/gzip':
        transform = zlib.createUnzip()
        break
      case 'application/octet-stream':
        // No decompresison necessary
        break
      default:
        error = new Error( `Unknown file encoding: '${file.data.encoding}'` )
        break
    }

    if( error ) {
      process.nextTick(() => {
        readStream.emit( 'error', error )
      })
    }

    if( transform ) {
      readStream = readStream.pipe( transform )
        .on( 'error', function( error ) {
          readStream.emit( 'error', error )
        })
    }

    return readStream

  },

  pack( filename, callback ) {
    throw new Error( 'Not implemented' )
  },

  unpack( callback ) {
    throw new Error( 'Not implemented' )
  },

  close( callback ) {

    if( this.fd == null ) {
      return void callback.call( this )
    }

    fs.close( this.fd, ( error ) => {
      callback.call( this, error )
    })

    this.fd = null
    this.contents = []
    this.header = new XAR.Header()

  },

}

// Exports
module.exports = Archive
