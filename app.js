/* eslint-disable complexity */

//disable the brower from scrolling when pressing directional keys
const arrow_keys_handler = function (e) {
  switch (e.keyCode) {
    case 37:
    case 39:
    case 38:
    case 40: // Arrow key codes
      e.preventDefault();
      break; //prevent window scroll
    default:
      break; // do not block other keys
  }
};
window.addEventListener("keydown", arrow_keys_handler, false);

import {
  load,
  TileEngine,
  dataAssets,
  imageAssets,
  GameLoop,
  initKeys,
  keyPressed,
  collides
} from "kontra";
import makePlayer from "./src/player";
import { canvas, context } from "./src/initialize";
import makeBot from "./src/bot";
import track from "./src/track";
import level from "./assets/tile/parsed.level2.json"


initKeys();

let moves = [];
const goButton = document.getElementById("go");
const userInput = document.getElementById("userMoves");
const levelPick = document.getElementById("levelPick");

goButton.addEventListener("click", () => {
  moves = userInput.value.split(",");
});

levelPick.addEventListener("click", (ev) => {
  if (ev.target.tagName === "BUTTON") {
    /* there will have to be some logic here related to loading and resetting the level */
    console.log(ev.target.value);
  }
});
///Level Testing Code//////////////////////

///these levels and robot moves will be loaded/created dynamically later

let selectedLevel = 1;
const levelNames = ["test", "parsed.level2"];
const levelObstacles = [
  // test.json obstacle locations in decorations layer
  [
    //array; potentially other obstacles
    [
      //array of obstacle tile locations
      { row: 4, column: 12 },
      { row: 4, column: 13 },
      { row: 4, column: 14 },
      { row: 4, column: 15 },
      { row: 5, column: 12 },
      { row: 5, column: 13 },
      { row: 5, column: 14 },
      { row: 5, column: 15 },
    ],
  ],
  // pipe2.json obstacle tile locations
  [
    [
      { row: 11, column: 5 },
      { row: 11, column: 6 },
      { row: 11, column: 7 },
      { row: 11, column: 8 },
      { row: 11, column: 9 },
      { row: 11, column: 10 },
      { row: 12, column: 5 },
      { row: 12, column: 6 },
      { row: 12, column: 7 },
      { row: 12, column: 8 },
      { row: 12, column: 9 },
      { row: 12, column: 10 },
    ],
  ],
];

const levelSwitches = [
  //test.json switch locations
  [
    { row: 7, column: 8 }, //potentially others
    //{row: 1, column: 1}
  ],
  //pipe2.json switch locations
  [
    { row: 2, column: 13 }, //potentially others
  ],
];

let levelObjects;
let playerStart;
let playerGoal;

//declares the level to be built by the tile engine globally so that the game loop can access it

//these could and probably should be combined into a single level object later. I imagine there will
//be other properties as we develop more features in the game

let levelTest, levelTrack;
let player, bot;
///////////////////////////////////////

const loop = GameLoop({
  context: context, // create the main game loop
  update: function () {
    ///// player keyboard controls. collision test prevents player from moving into obstacle tiles
    ////  position test prevents player from walking off screen

    if (keyPressed("right")) {
      if (player.x < canvas.width - player.width * player.scaleX) player.x += 2;
      if (levelTest.layerCollidesWith("decorations", player)) player.x -= 2;
      player.playAnimation("walkRight");
    } else if (keyPressed("left")) {
      if (player.x <= 0) player.x += 2;
      player.x += -2;
      if (levelTest.layerCollidesWith("decorations", player)) player.x -= -2;
      player.playAnimation("walkLeft");
    } else if (keyPressed("up")) {
      if (player.y > 0) player.y -= 2;
      if (levelTest.layerCollidesWith("decorations", player)) player.y += 2;
      player.playAnimation("walkUp");
    } else if (keyPressed("down")) {
      if (player.y < canvas.height - player.height * player.scaleY)
        player.y += 2;
      if (levelTest.layerCollidesWith("decorations", player)) player.y -= 2;
      player.playAnimation("walkDown");
    } else {
      player.playAnimation("idle");
    }





    player.update();

    //update the bot based on level track and move list
    bot.update(levelTrack, moves);

    //check each switch
    const switches = levelSwitches[selectedLevel];
    let swIx = -1;
    switches.forEach((sw, ix) => {
      const matchRow = bot.currentNode.gridRow === sw.row;
      const matchCol = bot.currentNode.gridCol === sw.column;
      if (matchRow && matchCol) {
        swIx = ix;
      }
    });
    if (swIx !== -1) {
      const obsTilesToClear = levelObstacles[selectedLevel][swIx];
      obsTilesToClear.forEach((tile) => {
        levelTest.setTileAtLayer(
          "decorations",
          { row: tile.row, col: tile.column },
          0
        );
      });
    }
  },
  render: function () {
    // render the game state
    levelTest.render();
    player.render();

    //render each pipe and node
    /* the tile engine can render the pipes and nodes on its own so we don't need to render them separately anymore.
    except it looks like the horizontal pipes don't come from the tileset, so it doesn' know how to render them*/

    //I've taken out the manual rendering of nodes/pipes and replaced with just one track object and its' node/pipe logic.
    //The pieces that aren't appearing on the map are rotated within the Tiled editor (trying to save on KBs), but
    //apparently Kontra's TileEngine can't handle that.

    bot.render();

       /* checks for end game if player is colliding with an invisible goal tile layer AND
      if the bot is at the end node coordinates. Right now the end node tile is hard coded.
      I'm not sure the tile id will stay the same across levels, in the future we will either
      need to create a bot end node tile layer for each level or dynamically check for the
      tile id of the end node
      */
    console.log(collides(player,playerGoal))
      if (
      collides(player,playerGoal) &&
      levelTest.tileAtLayer("nodes", { x: bot.x, y: bot.y }) === 7
    ) {
    //  If not the last level, reset the bot, player, and tile engine for the  next level and rerender
    //  Otherwise end game message
      alert("YOU WIN!!!");
      loop.stop();
    }


  },
});

const imageAssetPaths=[
"./assets/img/rpg_sprite_walk.png",
'./assets/img/bot.png',
"./assets/img/pipes.png",
"./assets/img/test.png",
"./assets/img/node.png",
"./assets/img/nodeHome.png",
]
const tilesetNames = ["pipes.tsx","node.tsx","nodeHome.tsx","test.tsx"]
let levelJson = "./assets/tile/parsed.level2.json"



//// all images, tiles, spritesheets, etc. must be loaded prior to starting the game loop
load(...imageAssetPaths
).then(() => {
  //this skips the dataAsset loading in Kontra (which requires fetch) and sticks everything directly on the window object
  //it also fakes the required mapping for the TileEngine
  //later, we should make something that cleans this up and creates the necessary JSON for a level and also deal w multiple levels
  dataAssets[levelJson] = level
  console.dir(dataAssets)
  tilesetNames.map(tileset=> {
    const tilesetURL = new URL(tileset, window.location.href).href
    window.__k.d[tilesetURL] = 'x'
    window.__k.dm.set(dataAssets[levelJson],tilesetURL)
  })

  //I moved the asset assignment for the player and bot here so that they could load from the image assets (which don't have the same fetch problem)
  player = makePlayer(imageAssets[imageAssetPaths[0]]);

  bot = makeBot(imageAssets[imageAssetPaths[1]]);

  levelTest = TileEngine(
    dataAssets[`./assets/tile/${levelNames[selectedLevel]}.json`]
  );
  levelTrack = track(
  //  { pipes: levelTest.layers.filter((layer) => layer.name === "pipes")[0].data,
  //   nodes: levelTest.layers.filter((layer) => layer.name === "nodes")[0].data,}
  level
  );

  //dynamically sets the player sprite at it's assigned location
  levelObjects=levelTest.layers.filter(layer=>layer.name==='InteractiveComponents')[0].objects;
  playerStart =levelObjects.filter(layer=>layer.name==='playerStart')[0];
  playerGoal = levelObjects.filter(layer => layer.name==='playerGoal')[0];
  console.log(playerGoal)
  player.placeAtStart(playerStart)


  loop.start();
});



///////////TESTING//////
