import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as THREE from 'three';

var JQUERY = require('jquery');


var Floorplan = require('./floorplan');
var Scene = require('./scene');

var utils = require('../utils/utils');

var Model = function(textureDir) {
  var scope = this;

  this.floorplan = new Floorplan();
  this.scene = new Scene(scope, textureDir);

  this.roomLoadingCallbacks = JQUERY.Callbacks();
  this.roomLoadedCallbacks = JQUERY.Callbacks(); // name
  this.roomSavedCallbacks = JQUERY.Callbacks(); // success (bool), copy (bool)
  this.roomDeletedCallbacks = JQUERY.Callbacks();

  this.loadSerialized = function(data_json) {
    // TODO: better documentation on serialization format.
    // TODO: a much better serialization format.
    scope.scene.setCargandoEscena(true);
    
    this.roomLoadingCallbacks.fire();

    var data = JSON.parse(data_json);
    scope.newRoom(
      data.floorplan,
      data.items
    );

    scope.roomLoadedCallbacks.fire();
  }
  
  this.getObjectDimensions = function(){
	  var objects = scope.scene.getItems();
	  //Compruebo si esta la pieza ya cargada
	  if (objects.length!=0){
		  var object = objects[0];
		  var box = new THREE.Box3().setFromObject( object );
		  
		  //Cojo las dimensiones de la pieza
		  var dimensiones={
				  ancho: Math.floor(box.size().z),
				  alto: Math.floor(box.size().y),
				  profundidad: Math.floor(box.size().x)
		  }
		  return dimensiones;
	  }
}


  this.exportSerializedItem = function(objectIn, tempHistory) {
      tempHistory = tempHistory || false;
      var object = objectIn;
      var textures = [];
      var textures_name = [];
      var textures_url = [];
      
      var domain = window.location.origin + "/AtrioGraphics/";
      //console.log(domain);
      var tiradoresActivos = [];
      //
      // Conseguir las dimensiones de la pieza
//      var box = new THREE.Box3().setFromObject( object );
//      console.log("Pieza="+object.metadata.itemName+": ancho="+Math.floor(box.size().z) +", alto="+Math.floor(box.size().y)+", prof="+Math.floor(box.size().x));
      //
      
      // Localizo la url de la textura
      var src=null;
      var name=null;
      // Compruebo si el objeto tiene textura
      // Hay objetos, como la puerta abierta que no tiene
//      if (object.material.materials[0].map!=null){
      	//console.log("Long="+object.material.materials.length)
        var cont = 0;
        var contTirador = 0;
        
                // Almaceno previamente las texturas para despues poder indexarlas
                for (var j = 0; j < object.material.length; j++){
                    var mat = object.material[j];	
                    var map = mat["map"];
                    // Hay textura en el material
                    if (map != null){
                        if (map.image && map.image.src) {    
                            src = map.image.src;
                            src = src.replace(domain, "");
                        } else {
                            src = null;
                        }
                        name = map["name"];
                        if (textures_url.indexOf(src) == -1) {
                            textures_url.push(src);
                            textures_name.push(name);
                        }
                        var texture_id = textures_url.indexOf(src);
                        textures[cont] = { 
                            id : j,
                            t: texture_id
                        };

                        //console.log("i="+j+", src="+texture_id);
                        cont = cont + 1;
                    }
                    // El material es un tirador
                    //if ((mat.name.search("TIRADOR") != -1) && (mat.visible == true)) {
                    if ((utils.bloqueEncontrado(mat.name,object.bloques) != -1) && (mat.visible == true)) {
                        tiradoresActivos[contTirador] = j;
                        contTirador = contTirador + 1;
                    }  
                }
//      }
      //console.log(textures);
      //console.log(tiradoresActivos);
      
      /*var textureMap="";
	  if (src!=null){
		  var res = src.split("/");
		  textureMap="models/textures/"+res[res.length-1];
	  }	*/
          
      let textureMap = { 
        textures : textures,
        textures_url: textures_url,
        textures_name: textures_name
      };
         
      var idCatalogo = -1;   
      if (object.metadata.idCatalogo)  {
          idCatalogo = object.metadata.idCatalogo;
      }
      
      let item = {
    	itemId : object.metadata.itemId,
        item_name: object.metadata.itemName,
        item_type: object.metadata.itemType,
        model_url: object.metadata.modelUrl,
        // Siguiente linea aniadida para guardar la textura. TEST!!!!
        model_texture: textureMap,
        // Guardamos el catalogo asociado al objeto
        idCat: idCatalogo,
        // Guardamos los puntos
        puntos: object.metadata.puntos,
        especial: object.metadata.especial,
        acotada: object.metadata.acotada,
        simetria: object.metadata.simetria,
        subcategoria: object.metadata.subcategoria,
        
        // Siguiente linea aniadida para guardar los tiradores activos
        tiradores_activos: tiradoresActivos,
        materialOcultosAbrir: object.materialOcultosAbrir,
        w : object.metadata.width,
        h : object.metadata.height,
        d : object.metadata.depth,
        // Siguiente linea aniadida para aplicar la textura a toda la pieza o no
        //textureFill: object.textureFill,
        textureFill: 2,
        xpos: object.position.x,
        ypos: object.position.y,
        zpos: object.position.z,
        rotation: object.rotation.y,
        scale_x: object.scale.x,
        scale_y: object.scale.y,
        scale_z: object.scale.z,
        fixed: object.fixed,
        desfaseAltura: object.desfaseAltura
      };
      
      if (tempHistory) {
          //alert("tempHistory: " + object.metadata.allBloques);
          item.allBloques = object.metadata.allBloques;
          item.allPalabras = object.metadata.allPalabras;
          item.descripcion = object.metadata.descripcion;
          item.sepPieza = object.metadata.sepPieza;
          
      }
      
      // Guardamos las dimensiones de la pieza especial
      if ((object.metadata.especial == true) || (object.metadata.especial == "true")) {
          item.especialDims = object.metadata.especialDims;
      }
      
      //alert("EXPORT " + item.allBloques);
      return item;
      
  }
  
  function save( blob, filename ) {


        var a = window.document.createElement('a');
        a.setAttribute("id", "tosave");
        
        a.href = window.URL.createObjectURL(blob);
        a.download = filename;
        //a.download = "DiseñoBinario - "
        //                + document.getElementById("room-name").innerHTML + " - "
        //                + new Date().toLocaleString() + ".txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
       
        // URL.revokeObjectURL( url ); breaks Firefox...

  }

  function saveString( text, filename ) {
        save( new Blob( [ text ], { type: 'text/plain' } ), filename );
  }
  function saveArrayBuffer( buffer, filename ) {
        save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
  }
  
  this.exportSerializedGLTF_Blender = function(camera) {
      
      camera = camera || null;
      var data;
      var exporter = new GLTFExporter();
      var options = {
	onlyVisible: true,
        binary: true
      };
      var scene = scope.scene.getScene().clone();
      
     
      var objects = scope.scene.getItems();
      const group = new THREE.Group();

      //var objects = scene.getItems();
      for (var i=0; i < objects.length; i++) {
          var obj = objects[i].clone();
          group.add( obj );

          /*if (obj.isMesh) {
              obj.scale.set(1/100,1/100,1/100);
          }*/
          //if (scene.children[i].isMesh) {
          //    scene.children[i].scale.set(1/100,1/100,1/100);
          //}>
      }
      
      var floorPlanes = scope.floorplan.floorPlanes();
      var wallEdgePlanes = scope.floorplan.wallEdgePlanes();
      
      utils.forEach(floorPlanes, function(floor) {
        group.add(floor);
      });
      
      utils.forEach(wallEdgePlanes, function(wall) {
        group.add(wall);
      });
      
      
      /*var walls = scope.floorplan.getWalls();
      for (var i=0; i < walls.length; i++) {
          var obj = walls[i];
          group.add( obj );
      }*/
      //for (var i=1; i < scene.children; i++) {
          /*if (scene.children[i].isLight == true) {
              var light = scene.children[i].clone();
              group.add( light );
          }*/
        /*  if (scene.children[i].isMesh) {
            var obj = scene.children[i].clone();
            group.add( obj );

          }*/
          //group.add( obj );

      //} 
      if (camera != null) {
        group.add(camera);
        scene.add(camera);
      }
    
    
      const SCALE_BLENDER = 0.02;
      
      scene.scale.set(SCALE_BLENDER,SCALE_BLENDER,SCALE_BLENDER);
      //group.scale.set(SCALE_UNITY,SCALE_UNITY,SCALE_UNITY); 
      group.scale.set(SCALE_BLENDER,SCALE_BLENDER,SCALE_BLENDER); 
      /*for (var i=0; i < scene.children.length; i++) {
          if (scene.children[i].isMesh) {
              scene.children[i].scale.set(1/100,1/100,1/100);
          }
      }*/
      
      var sphere = scene.children[0];
      scene.children.splice(0, 1);
        exporter.parse( scene, function ( gltf ) {
            if ( gltf instanceof ArrayBuffer ) {
                saveArrayBuffer( gltf, 'scene.glb' );
            } else {
                data = JSON.stringify(gltf,null,2);
                saveString( data, 'scene.gltf' );
            }
       }, options);
       scene.children.splice(0, 0, sphere);

      
      return data;
  }
  
  this.exportSerializedGLTF_Blender2 = function(camera) {
      
      camera = camera || null;
      var data;
      var exporter = new GLTFExporter();
      var options = {
	onlyVisible: true,
        binary: false
      };
      
      // Faltaría definir el clone correctamente
      var scene = scope.scene.getScene();
       
      if (camera != null) {
        scene.add(camera);
      }
      
      var objects = scene.children;
     
      
      for (var i=0; i < objects.length; i++) {
        var obj = objects[i];
        
        // Por cada hijo que esté en array lo elimino si el material no es visible
        if (Array.isArray(obj.children)) {
            obj.children = obj.children.filter(child => child.material.visible);
        }
          
          
      }
          
          
          

      const SCALE_BLENDER = 0.02;
      
      scene.scale.set(SCALE_BLENDER,SCALE_BLENDER,SCALE_BLENDER);
      //group.scale.set(SCALE_UNITY,SCALE_UNITY,SCALE_UNITY); 
      //group.scale.set(SCALE_BLENDER,SCALE_BLENDER,SCALE_BLENDER); 
      /*for (var i=0; i < scene.children.length; i++) {
          if (scene.children[i].isMesh) {
              scene.children[i].scale.set(1/100,1/100,1/100);
          }
      }*/
      
      var sphere = scene.children[0];
      scene.children.splice(0, 1);
        exporter.parse( scene, function ( gltf ) {
            if ( gltf instanceof ArrayBuffer ) {
                saveArrayBuffer( gltf, 'scene.glb' );
            } else {
                data = JSON.stringify(gltf,null,2);
                saveString( data, 'scene.gltf' );
            }
       }, null, options);
       
       scene.children.splice(0, 0, sphere);

      
      
      return data;
  }
  
  this.exportSerializedGLTF_TFG = function(camera) {
      
      camera = camera || null;
      var data;
      var exporter = new GLTFExporter();
      var options = {
	onlyVisible: true,
        binary: false
      };
      var scene = scope.scene.getScene();
       
      if (camera != null) {
        scene.add(camera);
      }
    
    
      const SCALE_BLENDER = 0.02;
      
      scene.scale.set(SCALE_BLENDER,SCALE_BLENDER,SCALE_BLENDER);
      //group.scale.set(SCALE_UNITY,SCALE_UNITY,SCALE_UNITY); 
      //group.scale.set(SCALE_BLENDER,SCALE_BLENDER,SCALE_BLENDER); 
      /*for (var i=0; i < scene.children.length; i++) {
          if (scene.children[i].isMesh) {
              scene.children[i].scale.set(1/100,1/100,1/100);
          }
      }*/
      
      var sphere = scene.children[0];
      scene.children.splice(0, 1);
        exporter.parse( scene, function ( gltf ) {
            if ( gltf instanceof ArrayBuffer ) {
                saveArrayBuffer( gltf, 'scene.glb' );
            } else {
                data = JSON.stringify(gltf,null,2);
                saveString( data, 'scene.gltf' );
            }
       }, options);
       
       scene.children.splice(0, 0, sphere);

      
      
      return data;
  }
  
  this.exportSerializedGLTF_Unity = function(camera) {
      
      camera = camera || null;
      var data;
      var exporter = new GLTFExporter();
      var options = {      
        onlyVisible: true
        //binary: true
      };
      
      var objects = scope.scene.getItems();
      const group = new THREE.Group();

        
      var item_types = {
          1: "FloorItem",
          2: "WallItem",
          3: "InWallItem",
          7: "InWallFloorItem",
          8: "OnFloorItem",
          9: "WallFloorItem"
        };

      
      for (var i=0; i < objects.length; i++) {
          var obj = objects[i].clone();
          obj.metadata = objects[i].metadata;
          obj.name = item_types[obj.metadata.itemType];
          group.add( obj );

      }
      if (camera != null) {
        group.add(camera);
      }
    
      const SCALE_UNITY = 0.01;
      
      
      group.scale.set(SCALE_UNITY,SCALE_UNITY,SCALE_UNITY); 
     
      exporter.parse( group, function ( gltf ) {
            if ( gltf instanceof ArrayBuffer ) {
                saveArrayBuffer( gltf, 'scene.glb' );
            } else {
                data = JSON.stringify(gltf,null,2);
                saveString( data, 'scene.gltf' );
            }
       }, options);
      
      return data;
  }
  
  this.exportSerialized = function(tempHistory,onlyFloor) {
    tempHistory = tempHistory || false;  
    onlyFloor = onlyFloor || false;  
    
    var items_arr = [];
    
    if (!onlyFloor) {
        var objects = scope.scene.getItems();
        for ( var i = 0; i < objects.length; i++ ) {
          items_arr[i] = this.exportSerializedItem(objects[i],tempHistory);
        }
    }
    
    var room = {
      floorplan: (scope.floorplan.saveFloorplan()),
      items: items_arr
    };

    return JSON.stringify(room);
  }

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateRandomString(longitud) {
    var CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
    var CHAR_UPPER = CHAR_LOWER.toUpperCase();
    var NUMBER = "0123456789";

    var DATA_FOR_RANDOM_STRING = CHAR_UPPER + NUMBER;

    var cad = "";
    for (var i = 0; i < longitud; i++) {
        var idx = Math.trunc(Math.random() * DATA_FOR_RANDOM_STRING.length);
        cad += DATA_FOR_RANDOM_STRING[idx];
    }
    return cad;
}


  this.newRoom = function(floorplan, items) {
    this.scene.clearItems();
    //console.log("EStoy en newRoom: ");
    this.floorplan.loadFloorplan(floorplan);
    utils.forEach(items, function(item) {
      const position = new THREE.Vector3(
        parseFloat(item.xpos), parseFloat(item.ypos), parseFloat(item.zpos));

      //var JS_VARIATION = "?" + generateRandomString(8);
      var JS_VARIATION = "";
      
      //console.log("JS_VARIATION: " + JS_VARIATION);
      var idx = item.model_url.indexOf("?");
      
      if (idx != -1) {
        item.model_url = item.model_url.substr(0,idx) + JS_VARIATION;
      } else {
        item.model_url = item.model_url + JS_VARIATION;  
      } 
      console.log("EStoy en newRoom: " + item.model_url);
      var metadata = {
    	itemId: item.itemId,
        itemName: item.item_name,
        resizable: item.resizable,
        itemType: item.item_type,
        modelUrl: item.model_url,
        model_texture: item.model_texture,
        especial: item.especial,
        acotada: item.acotada,
        simetria: item.simetria,
        subcategoria: item.subcategoria,
        especialDims: item.especialDims,
        idCatalogo: item.idCat,
        puntos: item.puntos,
        tiradores_activos: item.tiradores_activos,
        materialOcultosAbrir: item.materialOcultosAbrir,
        width: item.w,
        height: item.h,
        depth: item.d,
        allBloques: item.allBloques,
        allPalabras: item.allPalabras,
        descripcion: item.descripcion,
        sepPieza: item.sepPieza
      }
      
      var scale = {
        x: item.scale_x,
        y: item.scale_y,
        z: item.scale_z
      }
      
      console.log(metadata);
      console.log(scale);
      
      
      console.log("URL item: " + item.model_url);
      scope.scene.addItem( 
        item.item_type, 
        item.model_url,
        metadata,
        item.textureFill,
        position, 
        item.rotation,
        scale,
        item.fixed);
    });
  }
}

module.exports = Model;