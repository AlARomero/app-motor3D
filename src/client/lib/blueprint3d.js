const ThreeMain = require('./three/three_main.js');
const Floorplanner = require('./floorplanner/floorplanner');
const Model = require('./model/model');

const Blueprint3d = function(opts) {
  // opts.threeElement
  // opts.floorplannerElement
  // opts.textureDir
  
  this.model = new Model(opts.textureDir);
  this.three = new ThreeMain(this.model, opts.threeElement, opts.threeCanvasElement, {});
  if (!opts.widget) {
    this.floorplanner = new Floorplanner(opts.floorplannerElement, this.model);    
  } else {
    this.three.getController().enabled = false;
  }
}

module.exports = Blueprint3d;
