var XAR = require( './xar' )
var int64 = require( './int64' )

/**
 * Header
 * @constructor
 * @returns {Header}
 */
function Header() {

  if( !(this instanceof Header) ) {
    return new Header()
  }

  this.signature = XAR.SIGNATURE
  this.size = XAR.HEADER_SIZE
  this.version = XAR.VERSION
  this.xmlLengthCompressed = 0
  this.xmlLengthOriginal = 0
  this.checksumType = XAR.CHECKSUM.NONE

}

Header.parse = function( buffer, offset ) {
  return new Header().parse( buffer, offset )
}

/**
 * Header prototype
 * @ignore
 */
Header.prototype = {

  constructor: Header,

  parse( buffer, offset ) {

    offset = offset || 0

    this.signature = buffer.readUInt32BE( offset + 0 )
    this.size = buffer.readUInt16BE( offset + 4 )
    this.version = buffer.readUInt16BE( offset + 6 )
    this.xmlLengthCompressed = int64.readUIntBE( buffer, offset + 8 )
    this.xmlLengthOriginal = int64.readUIntBE( buffer, offset + 16 )
    this.checksumType = buffer.readUInt32BE( offset + 24 )

    // TODO: Checksum type 3;
    // If cksum_alg is 3 then the size field MUST be a multiple of 4 and at least 32.
    // Furthermore, immediately following the cksum_alg field a nul terminated nul padded
    // string which is the long name of the hash MUST be present and MUST NOT be
    // the empty ("") string or "none". This name must match exactly (byte-for-byte)
    // the checksum style attribute value from the toc's checksum property.
    // The name SHOULD NOT be "sha1" or "md5" either instead, for backwards-compatibility,
    // cksum_alg values 1 and 2 respectively should be used in that case.

    return this

  },

  write( buffer, offset ) {

    offset = offset || 0
    buffer = buffer || Buffer.alloc( this.size + offset )

    buffer.writeUInt32BE( this.signature, offset + 0 )
    buffer.writeUInt16BE( this.size, offset + 4 )
    buffer.writeUInt16BE( this.version, offset + 6 )
    int64.writeUIntBE( buffer, this.xmlLengthCompressed, offset + 8 )
    int64.writeUIntBE( buffer, this.xmlLengthOriginal, offset + 16 )
    buffer.writeUInt32BE( this.checksumType, offset + 24 )

    return buffer

  },

}

// Exports
module.exports = Header
