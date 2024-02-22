import * as THREE from 'three';
var utils = require('../utils/utils')

var ThreeFloor = function(scene, room) {

  var scope = this;
  
  this.room = room;
  var scene = scene;

  var floorPlane = null;
  var roofPlane = null;

  init();

  function init() {
    scope.room.fireOnFloorChange(redraw);
    floorPlane = buildFloor();
    // roofs look weird, so commented out
    // roofPlane = buildRoof();
    //scope.updateWindowSize();

  }
  
  function redraw() {
    scope.removeFromScene();
    floorPlane = buildFloor();
    scope.addToScene();
    
    // MOD. Rafa. Added to update de scene
    //console.log("Redraw " + scene.needsUpdate); 
    
    //scope.updateWindowSize();

  }
  
  function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
  }

  function buildFloor(callback) {
    callback = callback || function() {
      scene.needsUpdate = true;
    }
    var textureSettings = scope.room.getTexture();
    // setup texture
    //alert("Estoy en buildFloor");
    //var floorTexture = new THREE.TextureLoader().load(textureSettings.url,callback);
    var loader = new THREE.TextureLoader();
    /*const texture = new THREE.TextureLoader().load('https://threejsfundamentals.org/threejs/resources/images/checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = 10 / 2;
    texture.repeat.set(repeats, repeats);*/

    var textureScale = textureSettings.scale;
    // http://stackoverflow.com/questions/19182298/how-to-texture-a-three-js-mesh-created-with-shapegeometry
    // scale down coords to fit 0 -> 1, then rescale

    var points = [];
    utils.forEach( scope.room.interiorCorners, function(corner) {
        points.push(new THREE.Vector2(
          corner.x / textureScale, 
          corner.y / textureScale));
    });
    var shape = new THREE.Shape( points );

    var geometry = new THREE.ShapeGeometry( shape );
    //var geometry = new THREE.PlaneBufferGeometry( 2000,2000 );

    var floor = new THREE.Mesh(geometry);

    floor.rotation.set(Math.PI/2, 0, 0);
    floor.scale.set(textureScale, textureScale, textureScale);
    floor.receiveShadow = true;
    floor.castShadow = false;
    
    loader.load(textureSettings.url,function(floorTexture) {
        
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(1, 1);
        floor.material = new THREE.MeshPhongMaterial({ 
          map: floorTexture, 
          side: THREE.DoubleSide,
          //ambient: 0xffffff,
          color: 0xcccccc,
          specular: 0x0a0a0a,
          //opacity: 0.2
        });
        
        floorTexture.needsUpdate = true;
        floor.material.needsUpdate = true;	
        floor.needsUpdate = true;
        scene.needsUpdate = true;
        
    });
    
    return floor;

    /*var texloader = new THREE.TextureLoader();
    
    texloader.load(textureSettings.url, function(floorTexture) {
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(1, 1);
        var floorMaterialTop = new THREE.MeshPhongMaterial({ 
            map: floorTexture, 
            side: THREE.DoubleSide,
            //ambient: 0xffffff,
            color: 0xcccccc,
            specular: 0x0a0a0a
        });

        floorTexture.needsUpdate = true;

        
        //floorPlane = floor;
        
        // scope.addToScene();
        //scene.needsUpdate = true;
        
    }); */
    
    
    
  }

  function buildRoof() {
    // setup texture
    var roofMaterial = new THREE.MeshBasicMaterial({ 
      side: THREE.FrontSide,
      color: 0xe5e5e5
    });

    var points = [];
    utils.forEach( scope.room.interiorCorners, function(corner) {
        points.push(new THREE.Vector2(
          corner.x, 
          corner.y));
    });
    var shape = new THREE.Shape( points );
    var geometry = new THREE.ShapeGeometry( shape );
    var roof = new THREE.Mesh(geometry, roofMaterial);

    roof.rotation.set(Math.PI/2, 0, 0);
    roof.position.y = 250;
    return roof;  
  }

  this.addToScene = function() {
    scene.add(floorPlane);
    // scene.add(roofPlane);
    // hack so we can do intersect testing
    room.floorPlane.visible = false;
    scene.add(room.floorPlane);
  }

  this.removeFromScene = function() {
    scene.remove(floorPlane);
    // scene.remove(roofPlane);
    scene.remove(room.floorPlane);
  }
}

module.exports = ThreeFloor;