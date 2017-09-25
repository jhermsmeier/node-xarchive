var path = require( 'path' )
var fs = require( 'fs' )

/**
 * XMLHandler
 * @constructor
 * @returns {XMLHandler}
 */
function XMLHandler( callback ) {

  if( !(this instanceof XMLHandler) ) {
    return new XMLHandler( callback )
  }

  this.callback = callback
  this.files = []
  this.document = {
    parent: null,
    children: [],
  }

  this.document.parent = this.document
  this.currentNode = this.document

}

function getFilePath( node ) {
  var parents = []
  var name = null
  var text = ''
  while( /file/i.test( node.name ) && node.parent != node ) {
    name = node.children.find(( child ) => child.name === 'name' )
    text = name.children.find(( child ) => child.text ).text
    parents.unshift( text )
    node = node.parent
  }
  parents.unshift( '/' )
  return path.posix.join.apply( null, parents )
}

function setFileData( file, dataNode ) {

  if( dataNode == null )
    return undefined

  var child = null
  var childName = ''

  file.data = {
    offset: 0,
    length: 0,
    size: 0,
    encoding: '',
    extractedChecksum: { type: '', value: '' },
    archivedChecksum: { type: '', value: '' },
  }

  for( var i = 0; i < dataNode.children.length; i++ ) {
    child = dataNode.children[i]
    childName = child.name && child.name.toLowerCase()
    switch( childName ) {
      case 'offset':
      case 'length':
      case 'size':
        file.data[ childName ] = +child.children.find((n) => n.text).text
        break
      case 'encoding':
        file.data[ childName ] = child.attr.style
        break
      case 'extracted-checksum':
        file.data.extractedChecksum.type = child.attr.style
        file.data.extractedChecksum.value = child.children.find((n) => n.text).text
        break
      case 'archived-checksum':
        file.data.archivedChecksum.type = child.attr.style
        file.data.archivedChecksum.value = child.children.find((n) => n.text).text
        break
    }
  }

}

function setFileStats( file, node ) {

  var child = null
  var childName = ''

  for( var i = 0; i < node.children.length; i++ ) {
    child = node.children[i]
    childName = child.name && child.name.toLowerCase()
    switch( childName ) {
      case 'ctime':
      case 'mtime':
      case 'atime':
        file.stats[ childName ] = new Date( child.children.find((n) => n.text).text )
        file.stats[ childName + 'Ms' ] = file.stats[ childName ].getTime()
        break
      case 'gid':
      case 'uid':
        file.stats[ childName ] = +child.children.find((n) => n.text).text
        break
      case 'deviceno':
        file.stats[ 'dev' ] = +child.children.find((n) => n.text).text
        break
      case 'inode':
        file.stats[ 'ino' ] = +child.children.find((n) => n.text).text
        break
      case 'mode':
        file.stats[ childName ] = parseInt( child.children.find((n) => n.text).text, 8 )
        break
      case 'group':
      case 'user':
        file[ childName ] = child.children.find((n) => n.text).text
        break
      case 'name':
        file.basename = child.children.find((n) => n.text).text
        break
      case 'type':
        file[ childName ] = child.children.find((n) => n.text).text
        break
    }
  }

  file.stats.rdev = 0
  file.stats.nlink = 1
  file.stats.blksize = 512
  file.stats.blocks = file.data ? Math.ceil( file.data.size / file.stats.blksize ) : 0
  file.stats.size = file.data ? file.data.size : 0
  file.stats.birthtime = file.stats.ctime
  file.stats.birthtimeMs = file.stats.ctimeMs

}

XMLHandler.materializeFile = function( node ) {

  var file = {
    id: node.attr.id,
    path: getFilePath( node ),
    dirname: '',
    basename: '',
    type: 'file',
    group: '',
    user: '',
    data: null,
    stats: new fs.Stats(),
  }

  file.dirname = path.posix.dirname( file.path ) || '/'

  setFileData( file, node.children.find(( child ) => /data/i.test( child.name ) ) )
  setFileStats( file, node )

  return file

}

/**
 * XMLHandler prototype
 * @ignore
 */
XMLHandler.prototype = {

  constructor: XMLHandler,

  onopentag( name, attributes ) {
    var node = {
      name: name,
      attr: attributes,
      parent: this.currentNode,
      children: [],
    }
    this.currentNode.children.push( node )
    this.currentNode = node
    // if( this.currentNode.parent.name === 'toc' ) {
    //   console.log( `<${name}>`, attributes )
    // }
  },

  ontext( text ) {
    text = text.trim()
    if( !text ) return undefined
    var node = { text: text }
    this.currentNode.children.push( node )
  },

  onclosetag( name ) {
    var file = null
    if( /file/i.test( this.currentNode.name ) ) {
      file = XMLHandler.materializeFile( this.currentNode )
      // console.log( 'Materialized', file )
      this.files.push( file )
    }
    // if( this.currentNode.parent.name === 'toc' ) {
    //   console.log( `</${name}>` )
    // }
    this.currentNode = this.currentNode.parent
  },

  onerror( error ) {
    this.callback( error )
  },

  onend() {

    var files = this.files
    var document = this.document

    this.files = null
    this.document = null

    this.callback( null, document, files )

  },

}

// Exports
module.exports = XMLHandler
