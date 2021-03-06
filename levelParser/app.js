var fs = require('fs');
var path = require('path')
//const { parseString } = require('xml2js')

/// This program adds to the level JSON the image property needed for the TileEngine
/// The parser now runs through the JSON folder and write the parsed versions to the tile folder

let levelList= fs.readdirSync(path.join(__dirname,'..','assets','json'));
let numLevels = levelList.length
let levels = []


levelList.forEach(fileName =>{

  console.log(fileName)
  let level
  fs.readFile(path.join(__dirname,'..','assets','json',fileName), 'utf8', function(err, data) {
      if (err) throw err;
      level = JSON.parse(data);
      level.levelName = fileName
      exporter(level)

      //const tilesets = level.tilesets.map(tileset=>tileset.source.replace('../tile/',''))
      // tilesets.forEach((tileset,ix) => {
      //   fs.readFile(path.join(__dirname,'..','assets','tile',tileset), 'utf8', function(errReadXML, xml) {
      //     if (errReadXML) throw errReadXML;
      //     parseString(xml,function (xmlerr, result) {
      //       if (xmlerr) throw xmlerr;
      //       // let imgString = result.tileset.image[0]['$'].source
      //       // imgString = imgString.replace('..','./assets')
      //       //level.tilesets[ix].image = imgString
      //       //level.tilesets[ix].source = tileset
      //       level.levelName = fileName
      //        if(ix===tilesets.length-1) {exporter(level)}
      //     });
      //   })
      // })
  });

  function exporter(parsedLevel) {
    levels.push(compressor(parsedLevel))
    if(levels.length === numLevels) {
      //put levels in order based on level.name
      levels.sort((a,b) => a.levelName > b.levelName ? 1 : -1)
      //for production, these stringify flags should be removed or altered.
      //they make the json more readable but take up more space
      const levelsString = JSON.stringify(levels)
      //const levelsString = JSON.stringify(levels, null, '\t')
      fs.writeFile(path.join(__dirname,'..','assets','tile','parsed.allLevels.json'), levelsString, function(err) {
        if(err) throw err
      });
    }
  }

  function compressor(parsedLevel) {
    let returnLevel = {}
    returnLevel.levelName = parsedLevel.levelName
    //returnLevel.height = returnLevel.width = 16
    //returnLevel.tileheight = returnLevel.tilewidth = 32
    //returnLevel.tilesets = parsedLevel.tilesets

    //pruning object properties
    returnLevel.o = compressObjectLayer(parsedLevel.layers[3])

    returnLevel.cL = [{},{},{}]
    for(let i = 0; i < 3; i++) {
      const thisLayer = returnLevel.cL[i]
      for(let x = 0; x < 256; x++) {
        let mapValue = parsedLevel.layers[i].data[x]
        if(mapValue !== 0) {
          if (mapValue > 100) mapValue = mapValue.toString(16)[0]+'R'+parseInt(mapValue.toString(16).slice(1),16)
          thisLayer[mapValue] ? thisLayer[mapValue].push(x) : thisLayer[mapValue] = [x]
        }
      }
    }
    return returnLevel
  }

  function compressObjectLayer(inputOLayer){

  let prunedOLayer={}

  prunedOLayer.n=inputOLayer.name;
  prunedOLayer.o= inputOLayer.objects.map(object=> compressObject(object))


  return prunedOLayer
  }

  function compressObject(inputObject){
    let prunedObject={}
    if(inputObject.height!==32) prunedObject.height=inputObject.height;
    prunedObject.n=inputObject.name;
    if(inputObject.type!=="")prunedObject.t=inputObject.type;
    if(inputObject.width!==32) prunedObject.width=inputObject.width;
    prunedObject.x=inputObject.x;
    prunedObject.y=inputObject.y;
    if(inputObject.properties)
    {
        prunedObject.p=[]
        inputObject.properties.forEach(property =>{
          let prop = {}
          prop.v=property.value
          prunedObject.p.push(prop)
        })
    }


    return prunedObject
  }
})


