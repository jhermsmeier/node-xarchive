var XAR = module.exports

/**
 * Extensible Archive signature;
 * "xar!" in ASCII (78 61 72 21)
 * @type {Number}
 * @constant
 */
XAR.SIGNATURE = 0x78617221

/**
 * Base header size in bytes
 * @type {Number}
 * @constant
 */
XAR.HEADER_SIZE = 28

/**
 * Archive format version
 * NOTE: Previous version appears to be `0`
 * @type {Number}
 * @constant
 */
XAR.VERSION = 1

/**
 * Checksum type
 * @enum {Number}
 */
XAR.CHECKSUM = {
  NONE: 0,
  SHA1: 1,
  MD5: 2,
  CUSTOM: 3,
}

XAR.COMPRESSION = {
  NONE: 0,
  GZIP: 1,
  BZIP2: 2,
  LZMA: 3,
}

XAR.Header = require( './header' )
XAR.Archive = require( './archive' )
