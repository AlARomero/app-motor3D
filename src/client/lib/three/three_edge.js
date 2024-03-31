import * as THREE from 'three';
var utils = require('../utils/utils')

var ThreeEdge = function(scene, edge, controls) {
  var scope = this;
  var scene = scene;
  var edge = edge;
  var controls = controls;
  var wall = edge.wall;
  var front = edge.front;
  var altitude = edge.altitude;

  var planes = [];
  var basePlanes = []; // always visible
  var texture = null;
  var lightMap = new THREE.TextureLoader().load("assets/img/walllightmap.png");
  lightMap.minFilter = THREE.LinearFilter;
  var fillerColor = 0xdddddd;
  var sideColor = 0xcccccc;
  var baseColor = 0xdddddd;

  this.visible = false;

  this.remove = function() {
    edge.redrawCallbacks.remove(redraw);
    controls.cameraMovedCallbacks.remove(updateVisibility);
    removeFromScene();
  }

  function init() {
    edge.redrawCallbacks.add(redraw);
    controls.cameraMovedCallbacks.add(updateVisibility);
    edge.setCambio(true);
    updateTexture();
    updatePlanes();
    //updatePlanes2();
    addToScene();
  }

  function redraw() {
    removeFromScene();
    updateTexture();
    updatePlanes();
     //updatePlanes2();
    addToScene();
  }

  function removeFromScene() {
    utils.forEach(planes, function(plane) {
      scene.remove(plane);
    });
    utils.forEach(basePlanes, function(plane) {
      scene.remove(plane);
    });
    planes = [];
    basePlanes = [];
  }
  
  function addToScene() {
    utils.forEach(planes, function(plane) {
      scene.add(plane);
    });
    utils.forEach(basePlanes, function(plane) {
      scene.add(plane);
    });
    updateVisibility();
  }

  function updateVisibility() {
    // finds the normal from the specified edge
    var start = edge.interiorStart();
    var end = edge.interiorEnd();
    var x = end.x - start.x;
    var y = end.y - start.y;
    // rotate 90 degrees CCW
    var normal = new THREE.Vector3(-y, 0, x);
    normal.normalize();

    // setup camera
    var position = controls.object.position.clone();
    var focus = new THREE.Vector3(
      (start.x + end.x) / 2.0,
      0,
      (start.y + end.y) / 2.0);
    var direction = position.sub(focus).normalize();

    // find dot
    var dot = normal.dot(direction);

    // update visible
    scope.visible = (dot >= 0);

    // show or hide plans
    utils.forEach(planes, function(plane) { 
      plane.visible = scope.visible;
    });

    updateObjectVisibility();
  }

  function updateObjectVisibility() {
    utils.forEach(wall.items, function(item) {
      item.updateEdgeVisibility(scope.visible, front);
    });
    utils.forEach(wall.onItems, function(item) {
      item.updateEdgeVisibility(scope.visible, front);
    });
  } 


/*function updateTexture(callback) {
    // callback is fired when texture loads
    callback = callback || function() {
      scene.needsUpdate = true;
      edge.setCambio(false);
      
    }
    var textureData = edge.getTexture();
    if (edge.getCambio()) {
        var stretch = textureData.stretch;
        var url = textureData.url;
        var scale = textureData.scale;
        texture = new THREE.TextureLoader().load(url,callback);
        if (!stretch) {
            var height = wall.height;
            var width = edge.interiorDistance(); 
            texture.wrapT = THREE.RepeatWrapping;
            texture.wrapS = THREE.RepeatWrapping;
            texture.repeat.set(width/scale, height/scale);
            texture.needsUpdate = true;
        }
        
    } 
}*/
    function updateTexture(callback) {
    // callback is fired when texture loads
    callback = callback || function() {
      scene.needsUpdate = true;
      edge.setCambio(false);
      console.log("Textura cargada");
      
    }
    
    var textureData = edge.getTexture();
    if (edge.getCambio()) {
        var stretch = textureData.stretch;
        var url = textureData.url;
        var scale = textureData.scale;
        texture = scene.mapaTexturas.get(url);
        if ((texture === undefined) || (texture === null)) {
        //if (texture === null) {
            
            texture = new THREE.TextureLoader().load(url, callback);
            scene.mapaTexturas.set(url,texture);
            if (!stretch) {
                var height = wall.height;
                var width = edge.interiorDistance(); 
                texture.wrapT = THREE.RepeatWrapping;
                texture.wrapS = THREE.RepeatWrapping;
                texture.repeat.set(width/scale, height/scale);
                texture.needsUpdate = true;
            }
            
        }
        //texture = new THREE.TextureLoader().load(url,callback);
        
        scene.needsUpdate = true;
        edge.setCambio(false);
        
    } 
    
  }
  
  function updatePlanes2() {
      
      callback = function() {
        scene.needsUpdate = true;
        edge.setCambio(false);
        console.log("Textura cargada");
        updatePlanes();
        addToScene();

      }
      var textureData = edge.getTexture();
      
      if (edge.getCambio()) {
        var stretch = textureData.stretch;
        var url = textureData.url;
        var scale = textureData.scale;
        texture = scene.mapaTexturas.get(url);
        if ((texture === undefined) || (texture === null)) {
            
            texture = new THREE.TextureLoader().load(url, callback);
            scene.mapaTexturas.set(url,texture);
            if (!stretch) {
                var height = wall.height;
                var width = edge.interiorDistance(); 
                texture.wrapT = THREE.RepeatWrapping;
                texture.wrapS = THREE.RepeatWrapping;
                texture.repeat.set(width/scale, height/scale);
                texture.needsUpdate = true;
            }
            
        } else {
            updatePlanes();
            addToScene();
            
        } 
        //texture = new THREE.TextureLoader().load(url,callback);
        
        scene.needsUpdate = true;
        edge.setCambio(false);
        
      } 
       
       
  }

  function updatePlanes() {
      
    /*callback = function() {
      console.log("Textura cargada");
      scene.needsUpdate = true;
    }
    var textureData = edge.getTexture();
    var stretch = textureData.stretch;
    var url = textureData.url;
    var scale = textureData.scale;
    var texture = new THREE.TextureLoader().load(url,callback);
    //loader.load(url,function(texture) {
    //texture = THREE.ImageUtils.loadTexture(url, null, callback);
        console.log("Textura cargada");
        if (!stretch) {
            var height = wall.height;
            var width = edge.interiorDistance(); 
            texture.wrapT = THREE.RepeatWrapping;
            texture.wrapS = THREE.RepeatWrapping;
            texture.repeat.set(width/scale, height/scale);
        }*/


       //var wallMaterial = new THREE.MeshBasicMaterial({
       var wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        //ambientColor: 0xffffff,
        // ambient: scope.wall.color,
        side: THREE.FrontSide,
        map: texture
        //lightMap: lightMap
      });
      
      if (parseInt(THREE.REVISION) > 120) { 
        wallMaterial.roughness = 0.5;
        // Debug
        if (scene.DEBUG) scene.gui.add(wallMaterial, 'roughness').min(0).max(1).step(0.0001).name("Wall roughness");

        wallMaterial.metalness = 0.4;

        // Debug
        if (scene.DEBUG) scene.gui.add(wallMaterial, 'metalness').min(0).max(1).step(0.0001).name("Wall metalness");
      } 
      
             
      //var fillerMaterial = new THREE.MeshBasicMaterial({
      var fillerMaterial = new THREE.MeshStandardMaterial({
        color: fillerColor,
        side: THREE.DoubleSide
      });  

      // exterior plane
      planes.push(makeWall(
        edge.exteriorStart(), 
        edge.exteriorEnd(),
        edge.exteriorTransform,
        edge.invExteriorTransform,
        fillerMaterial));

      // interior plane
      var w = makeWall(
        edge.interiorStart(), 
        edge.interiorEnd(),
        edge.interiorTransform,
        edge.invInteriorTransform,
        wallMaterial);
      
      if (lightMap) {
            if (w.geometry.isBufferGeometry) {
                w.geometry.setAttribute('uv2', new THREE.BufferAttribute(w.geometry.attributes.uv.array, 2));
                w.material.lightMap = lightMap;
                w.material.lightMapIntensity = 0.5;
                if (scene.DEBUG) {
                    scene.gui.add(w.material, 'lightMapIntensity').min(0).max(2).step(0.0001).name("Wall lightMapIntensity");
                }
            } else {
                w.material.lightMap = lightMap;
                w.material.lightMapIntensity = 1.2;
                //scene.gui.add(w.material, 'lightMapIntensity').min(0).max(2).step(0.0001).name("Wall lightMapIntensity");
            }
      }

        planes.push(w);

        // bottom
      // put into basePlanes since this is always visible
      basePlanes.push(buildFiller(
        edge, 0, 
        THREE.BackSide, baseColor)); 

      // top
      planes.push(buildFiller(
        edge, wall.height, 
        THREE.DoubleSide, fillerColor));

      // sides
      planes.push(buildSideFillter(
        edge.interiorStart(), edge.exteriorStart(), 
        wall.height, sideColor));

      planes.push(buildSideFillter(
        edge.interiorEnd(), edge.exteriorEnd(), 
        wall.height, sideColor)); 
       
      
    //});
  }
      

  // start, end have x and y attributes (i.e. corners)
  function makeWall(start, end, transform, invTransform, material) {
    var v1 = toVec3(start);
    var v2 = toVec3(end);
    var v3 = v2.clone();
    v3.y = wall.height;
    var v4 = v1.clone();
    v4.y = wall.height;

    var points = [v1.clone(), v2.clone(), v3.clone(), v4.clone()];

    utils.forEach(points, function(p) {
      p.applyMatrix4(transform);
    });

    var shape = new THREE.Shape(points);

    // add holes for each wall item
    utils.forEach(wall.items, function(item) {
      var pos = item.position.clone();

      /* Si es un InWallItemGroup (como una puerta), la posición en y es la altura inicial para hacer los holes,
       * ya que la altura al dibujar agujeros se trabaja en 0.  
       */
      if (item.constructor.name === 'InWallFloorItemGroup') {
        pos.y = item.getBoundToFloorInitialAltitude();
      }

      pos.applyMatrix4(transform);
      var halfSize = item.halfSize;
      var min = halfSize.clone().multiplyScalar(-1);
      var max = halfSize.clone();
      min.add(pos);
      max.add(pos);

      var holePoints = [
        new THREE.Vector3(min.x, min.y, 0),
        new THREE.Vector3(max.x, min.y, 0),
        new THREE.Vector3(max.x, max.y, 0),
        new THREE.Vector3(min.x, max.y, 0)
      ];

      shape.holes.push(new THREE.Path(holePoints));
    });

    var geometry = new THREE.ShapeGeometry(shape);

    //DEPRECATED geometry.vertices in r140
    
    if (!geometry.isBufferGeometry) {
        utils.forEach(geometry.vertices, function(v) {
          v.applyMatrix4(invTransform);
        });
    } else {
    //****** NEW  in r140
        const position = geometry.attributes.position;
        const vector = new THREE.Vector3();
        const positionsArray = new Float32Array(position.count*3);
        let j = 0;
        for ( let i = 0, l = position.count; i < l; i ++ ) {
           vector.fromBufferAttribute( position, i );
           vector.applyMatrix4(invTransform);
           positionsArray[j] = vector.x;
           positionsArray[j+1] = vector.y;
           positionsArray[j+2] = vector.z;
           j = j+3;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3));

    }
    //******

    // make UVs
    var totalDistance = utils.distance(v1.x, v1.z, v2.x, v2.z);
    var height = wall.height;
    
    function vertexToUv(vertex) {
        var x = utils.distance(v1.x, v1.z, vertex.x, vertex.z) / totalDistance;
        var y = vertex.y / height;
        return new THREE.Vector2(x, y);
    }
    
    if (!geometry.isBufferGeometry) {
        geometry.faceVertexUvs[0] = [];

        utils.forEach(geometry.faces, function(face) {
          var vertA = geometry.vertices[face.a];
          var vertB = geometry.vertices[face.b];
          var vertC = geometry.vertices[face.c];
          geometry.faceVertexUvs[0].push([
              vertexToUv(vertA),
              vertexToUv(vertB),
              vertexToUv(vertC)]);      
        });

        geometry.faceVertexUvs[1] = geometry.faceVertexUvs[0];

        geometry.computeFaceNormals();
    } else {
        // Creamos las uv para el BufferGeometry
        const position = geometry.attributes.position;
        const vector3 = new THREE.Vector3();
        let vector2 = new THREE.Vector2();
        
        const uvArray = new Float32Array(position.count*2);
        
        let j = 0;
        for ( let i = 0, l = position.count; i < l; i ++ ) {
           vector3.fromBufferAttribute( position, i );
           vector2 = vertexToUv(vector3);
           uvArray[j] = vector2.x;
           uvArray[j+1] = vector2.y;
           j = j+2;
        }
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
    }
    // metodo siguiente común a BufferGeometry y Geometry (deprecated)
    geometry.computeVertexNormals();

    var mesh = new THREE.Mesh(
        geometry,
        material);

    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.position.set(mesh.position.x, altitude, mesh.position.z);
       
    return mesh;
  }

  function buildSideFillter(p1, p2, height, color) {
    var points = [
      toVec3(p1), // a
      toVec3(p2), // b
      toVec3(p2, height), //c
      toVec3(p1, height) //d
    ];

    //var geometry = new THREE.Geometry(); 
    //utils.forEach(points, function(p){
    //  geometry.vertices.push(p);
    //});
    //geometry.faces.push(new THREE.Face3(0, 1, 2)); //a, b, c
    //geometry.faces.push(new THREE.Face3(0, 2, 3)); // a, c, d

    var geometry = new THREE.BufferGeometry();
    const pointsA = [
        points[0],//a
        points[1],//b
        points[2],//c

        points[0],//a
        points[2],//c
        points[3]//d
    ];

    geometry.setFromPoints(pointsA);
    geometry.computeVertexNormals();

    var fillerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide
    });  

    var filler = new THREE.Mesh(geometry, fillerMaterial);
    filler.position.set(filler.position.x, altitude, filler.position.z);
    return filler;
  }

  function buildFiller(edge, height, side, color) {
    var points = [
      toVec2(edge.exteriorStart()),
      toVec2(edge.exteriorEnd()),
      toVec2(edge.interiorEnd()),
      toVec2(edge.interiorStart())
    ];

    var fillerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: side
    });  

    var shape = new THREE.Shape(points);
    var geometry = new THREE.ShapeGeometry(shape);

    var filler = new THREE.Mesh(geometry, fillerMaterial);
    filler.rotation.set(Math.PI/2, 0, 0);
    filler.position.y = altitude + height;
    //filler.position.y = height;
    return filler;
  }

  function toVec2(pos) {
    return new THREE.Vector2(pos.x, pos.y);
  }

  function toVec3(pos, height) {
    height = height || 0;
    return new THREE.Vector3(pos.x, height, pos.y);
  }

  init();
}

module.exports = ThreeEdge;