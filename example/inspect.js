var inspect = require( '../test/inspect' )
var XAR = require( '..' )
var argv = process.argv.slice( 2 )

var filename = argv.shift()
var archive = new XAR.Archive()

if( !filename ) {
  console.error( `Usage: node example/inspect.js <filename>` )
  process.exit( 1 )
}

archive.open( filename, ( error ) => {

  if( error ) {
    console.error( error )
    process.exit( 1 )
  }

  console.log( '' )
  console.log( inspect( archive.header ) )
  console.log( '' )

  console.log( 'Files:\n' )
  archive.contents.forEach(( file ) => {
    if( file.type === 'file' ) {
      console.log( `  ${file.path} [${file.data.size} B]` )
    }
  })

  archive.close(( erro ) => {
    if( error ) {
      console.error( error )
    }
  })

})
