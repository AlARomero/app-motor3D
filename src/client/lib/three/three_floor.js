import * as THREE from 'three';
var utils = require('../utils/utils');
var dat = require('lil-gui');


var ThreeFloor = function(scene, room) {

  var scope = this;
  
  this.room = room;
  var scene = scene;
  const altitude = room.altitude;
  this.floorPlane = null;
  var roofPlane = null;
  
  init();

  function init() {
    scope.room.fireOnFloorChange(redraw);
    scope.floorPlane = buildFloor();
    // roofs look weird, so commented out
    // roofPlane = buildRoof();
    //scope.updateWindowSize();

  }
  
  function redraw() {
    scope.removeFromScene();
    scope.floorPlane = buildFloor();
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
    };
    
    var textureSettings = scope.room.getTexture();
    const manager = new THREE.LoadingManager();
    var loader = new THREE.TextureLoader(manager);
    var roughMap, aoMap, normalMap, dispMap, lightMap;
    // setup texture
    //alert("Estoy en buildFloor");
    //var floorTexture = new THREE.TextureLoader().load(textureSettings.url,callback);
    
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
    floor.position.set(0, altitude, 0);
    floor.receiveShadow = true;
    floor.castShadow = false;
    
    manager.onLoad = function ( ) {
        
        console.log( 'Loading complete!');
        // Debug
        if (scene.DEBUG) {
            utils.removeController(scene.gui, "Floor roughness");
            utils.removeController(scene.gui, "Floor metalness");
            utils.removeController(scene.gui, "Floor displacementScale");
            utils.removeController(scene.gui, "Floor aoMapIntensity");
            utils.removeController(scene.gui, "Floor normalScale");
            utils.removeController(scene.gui, "Floor lightMapIntensity");
        }
    
        const parameters = {
            normalScale: 0.5
        };
        
        
    
        floor.material = new THREE.MeshStandardMaterial({ 
          map: floorTex, 
          side: THREE.DoubleSide,
          //ambient: 0xffffff,
          color: 0xcccccc
          //specular: 0x0a0a0a
          //opacity: 0.2
        });
        
        if (lightMap) {
            if (!(floor.geometry.isBufferGeometry)) {
                floor.material.lightMap = lightMap;
                floor.material.lightMapIntensity = 0.15;
                if (scene.DEBUG) scene.gui.add(floor.material, 'lightMapIntensity').min(0).max(2).step(0.0001).name("Floor lightMapIntensity");
            }
        }
        //floor.material.envMapIntensity = 1;
        //scene.gui.add(floor.material, 'envMapIntensity').min(0).max(2).step(0.0001).name("Floor envMapIntensity");
        
        var aoMapIntensity = 1;
        var displacementScale = 0;
        var normalScale = parameters.normalScale;
        
        if (normalMap) {
            floor.material.normalMap = normalMap;
            floor.material.normalScale.set(normalScale, normalScale);
            if (scene.DEBUG) {
            scene.gui.add(parameters, 'normalScale').min(0).max(2).step(0.0001).name("Floor normalScale")
                    .onChange(() =>
                    {
                        floor.material.normalScale.set(parameters.normalScale, parameters.normalScale);
                    });
            }
            
        }
        if (aoMap) {
            if (floor.geometry.isBufferGeometry) {
                floor.geometry.setAttribute('uv2', new THREE.BufferAttribute(floor.geometry.attributes.uv.array, 2));
                floor.material.aoMap = aoMap;
                floor.material.aoMapIntensity = aoMapIntensity;
                if (scene.DEBUG) scene.gui.add(floor.material, 'aoMapIntensity').min(0).max(2).step(0.0001).name("Floor aoMapIntensity");
            }
        }
        if (roughMap) {
            floor.material.roughnessMap = roughMap;
        } else {
             floor.material.roughness = 0.65;
             // Debug
             if (scene.DEBUG) scene.gui.add(floor.material, 'roughness').min(0).max(1).step(0.0001).name("Floor roughness");
             //}
        }
        
        if (dispMap) {
            floor.material.displacementMap = dispMap;
            floor.material.displacementScale = displacementScale;
            if (scene.DEBUG) scene.gui.add(floor.material, 'displacementScale').min(0).max(1).step(0.0001).name("Floor displacementScale");
        }
        
        floor.material.metalness = 0.1;
       
        // Debug
        if (scene.DEBUG) scene.gui.add(floor.material, 'metalness').min(0).max(1).step(0.0001).name("Floor metalness");
        //}
        /**/
        /*if (!utils.controllerEncontrado(scene.gui, "Displacement Scale")) {
            scene.gui.add(floor.material, 'displacementScale').min(0).max(1).step(0.0001).name("Displacement Scale");
        }    
        if (!utils.controllerEncontrado(scene.gui, "aoMapIntensity")) {
            scene.gui.add(floor.material, 'aoMapIntensity').min(0).max(1).step(0.0001).name("aoMapIntensity");
        }*/
        
        
        floor.material.needsUpdate = true;	
        floor.needsUpdate = true;
        scene.needsUpdate = true;

        // do something with your material

    };
    
    var callbackTexture = function(floorTexture) {
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(1, 1);
        
        floorTexture.needsUpdate = true;
    };
    
    lightMap = loader.load("assets/img/walllightmap.png", callbackTexture);
    //lightMap = new THREE.TextureLoader().load("rooms/textures/walllightmap.png");
    
  //lightMap.minFilter = THREE.LinearFilter;
    
    if ((textureSettings.url_rough !== undefined) && (textureSettings.url_rough !== "")) {
        roughMap = loader.load(textureSettings.url_rough, callbackTexture);
    }
    if ((textureSettings.url_norm !== undefined) && (textureSettings.url_norm !== "")) {
        normalMap = loader.load(textureSettings.url_norm, callbackTexture);
    }
    if ((textureSettings.url_occ !== undefined) && (textureSettings.url_occ !== "")) {
        aoMap = loader.load(textureSettings.url_occ, callbackTexture);
    }
    if ((textureSettings.url_disp !== undefined) && (textureSettings.url_disp !== "")) {
        dispMap = loader.load(textureSettings.url_disp, callbackTexture);
    }
    
    var floorTex = loader.load(textureSettings.url,callbackTexture);
    
    /*var floorTex = loader.load(textureSettings.url,function(floorTexture) {
        
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(1, 1);
        
        floorTexture.needsUpdate = true;
        
        /*floor.material.metalness = 0.1;
        floor.material.roughness = 0.5;
        
        
        var i = 0;
        while (i < scene.gui.controllers.length) {
            if (scene.gui.controllers[i]._name === "Floor metalness" || scene.gui.controllers[i]._name === "Floor roughness") {
                scene.gui.controllers[i].destroy();
                i = 0;
            } else {
                i++;
            }
        }
        
        if (!utils.controllerEncontrado(scene.gui, "Floor metalness")) {
            scene.gui.add(floor.material, 'metalness').min(0).max(1).step(0.0001).name("Floor metalness");
        }
        if (!utils.controllerEncontrado(scene.gui, "Floor roughness")) {
            scene.gui.add(floor.material, 'roughness').min(0).max(1).step(0.0001).name("Floor roughness");
        }
        
        floor.material.needsUpdate = true;	
        floor.needsUpdate = true;
        scene.needsUpdate = true;
        
    });*/

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
    scene.add(this.floorPlane);
    // scene.add(roofPlane);
    // hack so we can do intersect testing
    room.floorPlane.visible = false;
    scene.add(room.floorPlane);
  }

  this.removeFromScene = function() {
    scene.remove(this.floorPlane);
    // scene.remove(roofPlane);
    scene.remove(room.floorPlane);
  }
}

module.exports = ThreeFloor;