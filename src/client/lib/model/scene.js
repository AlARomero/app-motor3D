import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LegacyJSONLoader } from '../three/deprecated/LegacyJSONLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import * as THREE from 'three';

var dat = require('lil-gui');

var JQUERY = require('jquery');
  
// var LegacyJSONLoader = require('../three/misc/LegacyJSONLoader');
   

var FloorItem = require('../items/floor_item');
var InWallFloorItem = require('../items/in_wall_floor_item');
var InWallItem = require('../items/in_wall_item');
var Item = require('../items/item');
var OnFloorItem = require('../items/on_floor_item');
var WallFloorItem = require('../items/wall_floor_item');
var WallItem = require('../items/wall_item');

var FloorItemGroup = require('../items/floor_itemGroup');
var WallItemGroup = require('../items/wall_itemGroup');
var InWallItemGroup = require('../items/in_wall_itemGroup');
var InWallFloorItemGroup = require('../items/in_wall_floor_itemGroup');
var OnFloorGroup = require('../items/on_floor_itemGroup');

var utils = require('../utils/utils');

var Scene = function(model, textureDir) {
  var scope = this;
  var model = model;
  var textureDir = textureDir;
  
  var cargandoEscena = false;
  
  // activar o desactivar colisiones entre objetos
  this.colisiones = true;
  
  // activar o desactivar el cambiar las texturas de todos los objetos de la escena
  this.textureScene = false; 
  
  // Indica si se abren todos los modulos de la escena o no
  this.openModules = false; 
  
  // activar o desactivar magnetizacion
  this.magnet;
  this.magnet_snap;
  
  // medir distancia
  this.medir = false;
  this.sprCount = 0;
  
  // mover a un punto
  this.mover = false;

  var scene = new THREE.Scene();
        
  var items = [];

  var callback = function() {
        scope.needsUpdate = true;
  };

  this.DEBUG = false;  
  if (window._DEBUG) {
      this.DEBUG = true;
      this.gui = new dat.GUI();
      this.gui.onChange(callback);  
  }
  this.needsUpdate = false;

    const manager = new THREE.LoadingManager();
    manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
      $('#script-loading-screen').show();
      console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };

    manager.onLoad = function ( ) {
      $('#script-loading-screen').hide();
      console.log( 'Loading complete!');
      this.needsUpdate = true;
      if (scope.getCargandoEscena()) {
          utils.writeDebug('Ha finalizado la carga de la escena');
          scope.setCargandoEscena(false);
      }
    };


    manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
      console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };

    manager.onError = function ( url ) {
      console.log( 'There was an error loading ' + url );
    };
    
  // init item loader
  
  var loader = null;
  if (parseInt(THREE.REVISION) <= 120) { 
    var loader = new LegacyJSONLoader(manager);
    loader.crossOrigin = "";
  }
  
  
  var loaderGLTF = new GLTFLoader(manager);
  var loaderOBJ = new OBJLoader(manager);
  var loaderMTL = new MTLLoader(manager);
  var loaderTexture = new THREE.TextureLoader(manager);
  
  this.mapaTexturas = new Map();
  
  var item_types = {
    1: FloorItem,
    2: WallItem,
    3: InWallItem,
    7: InWallFloorItem,
    8: OnFloorItem,
    9: WallFloorItem,
    11: FloorItemGroup,
    12: WallItemGroup,
    13: InWallItemGroup,
    17: InWallFloorItemGroup,
    18: OnFloorGroup
  };

  // init callbacks
  this.itemLoadingCallbacks = JQUERY.Callbacks(); 
  this.itemLoadedCallbacks = JQUERY.Callbacks(); // Item
  this.itemRemovedCallbacks = JQUERY.Callbacks(); // Item
  this.comensalListLoaded = JQUERY.Callbacks(); // Item, Item bounded (ComensalListObject)

  this.add = function(mesh) {
    // only use this for non-items
    scene.add(mesh);
  }

  this.remove = function(mesh) {
    // only use this for non-items
    scene.remove(mesh);
    utils.removeValue(items, mesh);
  }

  this.setCargandoEscena = function(cargando) {
    cargandoEscena = cargando;
  }   
  
  this.getCargandoEscena = function() {
      return cargandoEscena;
  }
  this.getScene = function() {
    return scene;
  }
  
  this.prepareSceneBlender = function() {
      const sc = scene.clone();
      
      for (var i=0; i < sc.children.length;i++) {
          const child = sc.children[i];
          
          var err = false;
          for (var j=0; j < child.matrix.elements.length; j++) {
              if($.type(child.matrix.elements[j]) === "string"){
                child.matrix.elements[j] = parseFloat(child.matrix.elements[j]);
                err = true;
              }
          }
          if (err) {
              console.log(i);
              console.log(child.matrix.elements);
              
          }
      }
      
      const SCALE_BLENDER = 0.02;
      
      
      
      sc.scale.set(SCALE_BLENDER,SCALE_BLENDER,SCALE_BLENDER);
      
      return sc;
      
      
  }

  this.loadSkyGltf = function(location) {
    return new Promise((resolve, reject) => {
      loaderGLTF.load(location, (gltf) => {
        const model = gltf.scene;
        this.add(model);
        this.needsUpdate = true;
        resolve(model);
      }, undefined, function (error) {
        reject(error);
      });
    });
  }

  this.getItems = function() {
    return items;
  }

  this.itemCount = function() {
    return items.length
  }

  this.clearItems = function() {
    var items_copy = items;
    utils.forEach(items, function(item) {
      scope.removeItem(item, true);
    });
    items = []
  }
  
  this.textureItems = function(texture) {
    utils.forEach(items, function(item) {
      item.setTextureRaw(texture);
    });  
  }
  
  this.tiradoresItems = function(modelo,idCatalogo) {
    utils.forEach(items, function(item) {
      item.setModeloTiradorRaw(modelo,idCatalogo);
    });  
  }
  
  this.bloqueItems = function(bloque, item_bloque,idCatalogo) {
    utils.forEach(items, function(item) {
      item.setItemBloqueRaw(bloque, item_bloque,idCatalogo);
    });  
  }
  
  this.openAllModules = function(abrir) {
      
    utils.forEach(items, function(item) {
        if (item.openModuleAllowed()) {
            item.open(abrir);
            item.openModule = abrir;
        }
    });  
  }
  
  this.marcarItemsCajeados = function() {
    var estructuras = this.getItemsEstructuras();
    console.log("Num. estructuras: " + estructuras.length);
    var itemOcl = this.getItemsDeOclusion();
    console.log("Num. items oclusion: " + itemOcl.length);
    if (estructuras.length > 0) {
        utils.forEach(itemOcl, function(item) {
            item.interseccionObjetos(estructuras);
        });
    }
  }

// Mod. Rafa. Obtener las estructuras de la lista de items
  this.getItemsEstructuras = function() {
    var estructuras = [];
    utils.forEach(items, function(item) {
        var name = item.metadata.itemName.toLowerCase();
        if ((name.search("viga") != -1) || (name.search("pilar") != -1)) {
            estructuras.push(item);          
        }
    });
    return estructuras;
  }

// Mod. Rafa. Obtener la lista de items de objetos que pueden ocluir
  this.getItemsDeOclusion = function() {
    var deOclusion = [];
    utils.forEach(items, function(item) {
        var name = item.metadata.itemName.toLowerCase();
        if ((name.search("viga") == -1) && (name.search("pilar") == -1)) {// && (item.obstructFloorMoves)) {
            deOclusion.push(item);          
        }
    });
    return deOclusion;
  }
  
  this.getItem = function(itemIn) {
      var itemR = [];
      for (var i=0; i < items.length; i++) {
          var item = items[i];
          if (JSON.stringify(model.exportSerializedItem(item,true)) == JSON.stringify(itemIn)) {
              return item;
          }
      }
      return itemR;
  }
  
  this.reemplazarItem = function(previtem,modelURL) {
      
      const item = model.exportSerializedItem(previtem, true);
      item.model_url = modelURL;
            
      const position = new THREE.Vector3(item.xpos, item.ypos, item.zpos);
        //alert(item.allBloques);
      const metadata = {
          itemId: item.itemId,
          itemName: item.item_name,
          resizable: item.resizable,
          itemType: item.item_type,
          modelUrl: item.model_url,
          model_texture: item.model_texture,
          idCatalogo: item.idCat,
          puntos: item.puntos,
          especial: item.especial,
          especialDims: item.especialDims,
          simetria: item.simetria,
          tiradores_activos: item.tiradores_activos,
          materialOcultosAbrir: item.materialOcultosAbrir,
          width: item.w,
          height: item.h,
          depth: item.d,
          allBloques: item.allBloques,
          allPalabras: item.allPalabras,
          descripcion: item.descripcion,
          sepPieza: item.sepPieza,
          reemplazo: true,
          desfaseAltura: item.desfaseAltura,
          isTable: item.isTable,
          itemDescription: item.itemDescription
      }

      const scale = {
          x: item.scale_x,
          y: item.scale_y,
          z: item.scale_z
      }
      
      this.removeItem(previtem, false);
      
      console.log("Reemplazo, nuevo js: " + item.model_url);
      this.addItem( 
          item.item_type, 
          item.model_url,
          metadata,
          item.textureFill,
          position, 
          item.rotation,
          scale,
          item.fixed,
          item.itemsBounded);
      
      
      
      //var ir = this.getItem(item);
      //return ir;
      
  }
  
  this.removeItem = function(item, dontRemove) {
    dontRemove = dontRemove || false;
    // use this for item meshes
    this.itemRemovedCallbacks.fire(item);
    item.removed();
    scene.remove(item);
    if (!dontRemove) {
      utils.removeValue(items, item);
      scope.needsUpdate = true;
    }
  }
  
  this.addSeveralItems = function(items) {
    // Insertamos los items de la lista en la escena
    for (const element of items) {
        const item = element;
        position = new THREE.Vector3(item.xpos, item.ypos, item.zpos);
        //alert(item.allBloques);
        const metadata = {
          itemId: item.itemId,
          itemName: item.item_name,
          resizable: item.resizable,
          itemType: item.item_type,
          modelUrl: item.model_url,
          model_texture: item.model_texture,
          idCatalogo: item.idCat,
          puntos: item.puntos,
          especial: item.especial,
          acotada: item.acotada,
          simetria: item.simetria,
          subcategoria: item.subcategoria,
          especialDims: item.especialDims,
          tiradores_activos: item.tiradores_activos,
          materialOcultosAbrir: item.materialOcultosAbrir,
          width: item.w,
          height: item.h,
          depth: item.d,
          allBloques: item.allBloques,
          allPalabras: item.allPalabras,
          descripcion: item.descripcion,
          sepPieza: item.sepPieza,
          isTable: item.isTable,
          itemDescription: item.itemDescription
        }

        const scale = {
          x: item.scale_x,
          y: item.scale_y,
          z: item.scale_z
        }
        this.addItem( 
          item.item_type, 
          item.model_url,
          metadata,
          item.textureFill,
          position, 
          item.rotation,
          scale,
          item.fixed,
          item.itemsBounded);
    }  
  }

  function loaderCallback(geometry, materials, ext, itemType, fileName, metadata, textureFill, position, rotation, scale, fixed, itemsBounded) {
      const t0 = performance.now();  
      if (ext == "gltf" || ext == "glb") {
          itemType += 10;
      }
      const item = new item_types[itemType](
        model,
        metadata, geometry,
        materials,
        position, rotation, scale
      );
      
      item.fixed = fixed || false;
      item.textureFill = textureFill;
//      alert(items.length)
      items.push(item);
//      alert(items.length)

      scope.add(item);
      //scene.add( item.lines );
      
      item.initObject();
      
      var ruta = fileName; 
//      alert(metadata.model_texture)
      
      if (metadata.tempHistory) {
          alert(metadata.tempHistory);
          item.bloques = metadata.tempHistory.bloques;
          item.aliasBloques = metadata.tempHistory.aliasBloques;
          item.correspondenciasB = metadata.tempHistory.correspondenciasB;
      }
      
      if (metadata.allPalabras) {
          item.inicializarPalabras(metadata.allPalabras);
          //console.log("METADATA.ALLPALABRAS: ");
          console.log(metadata.allPalabras);
          console.log("THIS.PALABRAS: " + item.palabras);
          console.log("THIS.ALIASPALABRAS: " + item.aliasPalabras);
          console.log("THIS.SUPERFLUAS: " + item.superfluas);
      }
      
      if (metadata.allBloques) {
          item.inicializarBloques(metadata.allBloques);
          console.log("THIS.BLOQUES: " + item.bloques);
          console.log("THIS.ALIASBLOQUES: " + item.aliasBloques);
      }
      
      if (metadata.sepPieza) {
          item.asignarGTAsSeparadores(metadata.sepPieza);
          console.log("THIS.SEP_PIEZA: " + item.gta_sep);
          
      }
      
      
      // Relleno el array de materiales que tienen textura
      item.materialsFill = new Array();
      var materials = item.material;
      for (var i = 0; i < materials.length; i++){
            var mat = materials[i];	
            //if ((mat.name.search("TIRADOR") == -1) && (mat.name.search("UNICO") == -1)) {  
            if (mat.name.search("UNICO") == -1) {  
                    item.materialsFill.push(i);
            }
      }
      
      
      //console.log("Materiales con textura="+item.terialsFill);
      
      // Para cargar los tiradores
      if (metadata.tiradores_activos!=null && metadata.tiradores_activos!=""){
          var materials = item.material;
          var tiradores_activos = metadata.tiradores_activos;  
          for (var i = 0; i < materials.length; i++){
            var mat = materials[i];
            if (utils.bloqueEncontrado(mat.name,item.bloques) != -1)  {
            //if (mat.name.search("TIRADOR") != -1) {  
                if (tiradores_activos.indexOf(i) == -1) {
                  //mat.opacity = 0;
                  //mat.transparent = true;  
                  mat.visible = false;
                }
                else {
                  //mat.opacity = 1;
                  //mat.transparent = false;
                  mat.visible = true;
                }
            }
            mat.needsUpdate = true;
          }
      }
      
      // Para ocultar los materiales por apertura de puertas
      if ((metadata.materialOcultosAbrir!=null) && (metadata.materialOcultosAbrir.length > 0)){
       
            var materials = item.material;
            for (var i = 0; i < metadata.materialOcultosAbrir.length; i++) { 
                 var mat = materials[metadata.materialOcultosAbrir[i]];
                 mat.visible = false;
                 mat.needsUpdate = true;
            }
            item.materialOcultosAbrir = metadata.materialOcultosAbrir;
            item.openModule = true;
        }
      
      if (metadata.bloqueInitialized) {
        item.bloquesInicializados = true;
      }
      

        
      // Para cargar la textura
      if (metadata.model_texture!=null && metadata.model_texture!="" && metadata.model_texture!=="models/textures/"){
        
          var callback = function() {
            item.scene.needsUpdate = true;
            console.log("Textura cargada");
            
          }
    	  var materials = item.material;
          // Opción para cuando cargamos un diseño
    	  if (item.textureFill == 2){
                  item.textureFill = 0;
                  const myMaterials = metadata.model_texture.textures;  
                  const textures_url = metadata.model_texture.textures_url;  
                  const textures_name = metadata.model_texture.textures_name;  
                  
                  var app1 = "/AtrioGraphics/"
                  var app2 = "/planificador/"
      
                  // Creamos un mapa para guardar las texturas que vamos cargando y no volver a 
                  // cargarlas si ya lo hemos hecho antes
                  
        	  for (var i = 0; i < myMaterials.length; i++){
                         if (myMaterials[i].id != null) {
                          var t = myMaterials[i].t;   
        		  var mat = materials[myMaterials[i].id];
                          
                          
                          var t_url = textures_url[t];
                          if (t_url != null) {
                            var n1 = t_url.indexOf(app1);
                            var n2 = t_url.indexOf(app2);
                            if (n1 != -1) {
                                t_url = t_url.substr(n1 + app1.length);
                            } else if (n2 != -1) {
                                t_url = t_url.substr(n2 + app2.length);
                            }
                          }
                          //console.log(mat + " " + myMaterials[i].id + " " + t_url);
                          if ((mat != null) && (t_url != null)) {
                              
                            // Comprobamos si la textura ya ha sido cargada, en caso contrario se carga y se guarda  
                            var texturaCargada = scope.mapaTexturas.get(t_url);
                            if (texturaCargada == null) {
                                texturaCargada = loaderTexture.load(t_url, callback);
                                scope.mapaTexturas.set(t_url,texturaCargada);
                            }
                            // Se asigna la textura cargada
                            mat.map = texturaCargada;
                            //mat.map = THREE.ImageUtils.loadTexture(textures_url[t]);
                            mat.map.minFilter = THREE.LinearFilter;
                            mat.map.name = textures_name[t]; 
                            mat.needsUpdate = true;
                          }
                         }
        	   }
          }
          else if (item.textureFill == 1){  
              var l = metadata.model_texture.length;
              var ext = metadata.model_texture.substr(l-5,l);
              //console.log("ModelTexture: " + metadata.model_texture + " " + ext);
              if (ext !== "blend") {
                var texturaCargada = loaderTexture.load(metadata.model_texture, callback);
                for (var i = 0; i < materials.length; i++){
                  var mat = materials[i];
                  mat.map = texturaCargada;
                  //mat.map = THREE.ImageUtils.loadTexture( metadata.model_texture);
                  mat.map.minFilter = THREE.LinearFilter;
                  mat.needsUpdate = true;
                
                  }
              }
    	  } 
          else {
              var l = metadata.model_texture.length;
              var ext = metadata.model_texture.substr(l-5,l);
              //console.log("ModelTexture: " + metadata.model_texture + " " + ext);
              if (ext !== "blend") {
                var texturaCargada = loaderTexture.load(metadata.model_texture, callback);  
                
                for (var i = 0; i < materials.length; i++){
                      var mat = materials[i];	  
                      var map = mat["map"];		
                      if (map != null){
                              mat.map = texturaCargada;
                              //mat.map = THREE.ImageUtils.loadTexture( metadata.model_texture )
                              mat.map.minFilter = THREE.LinearFilter;
                              mat.needsUpdate = true;
                      }
                }
            }
    	  }
          
          //console.log("addItem " + item.scene.needsUpdate);  
    	  item.scene.needsUpdate = true;
    	  
    	  
//		  item.material.materials[0].map = THREE.ImageUtils.loadTexture(metadata.model_texture, null, null); 
//		  item.material.materials[0].needsUpdate = true;
//		  item.scene.needsUpdate = true;
      }
      
      if (metadata.reemplazo)  {
          item.desfaseAltura = metadata.desfaseAltura;
          item.resized();
      }
      
      // Añadir a los items sus objetos asociados.
      if (itemsBounded) {
        itemsBounded.forEach( bounded => {
          if (bounded.comensalList){
            scope.comensalListLoaded.fire(item, bounded);
          }
          // Si hubiese otro tipo de itemBounded, habria que ponerlo aqui.
        });
      }  
      
      scope.itemLoadedCallbacks.fire(item);
      
      var t1 = performance.now();
      console.log("[FIN]LoadingCallback " + item.metadata.itemName + ": " + (t1 - t0) + " milliseconds.");
  }  

  this.addItem = function(itemType, fileName, metadata, textureFill, position, rotation, scale, fixed, itemsBounded) {
    itemType = itemType || 1;

    //console.log("ItemType " + itemType);
    scope.itemLoadingCallbacks.fire();
    console.log("[INI]LoadingCallback " + metadata.itemName  + "...");

    // Obtenemos la extensión
    var ext = fileName.split('.').pop().split('?')[0];
    var fName = fileName.split('.').shift();
    
    cargarItem("add",ext,fName,itemType, fileName, metadata, textureFill, position, rotation, scale, fixed, itemsBounded);
    
    
    //}
  }
  
  function loaderCallbackDuplicate(geometry, materials, ext, itemType, fileName, metadata, position, rotation, scale, fixed, itemsBounded) {
      if (ext == "gltf" || ext == "glb") {
          itemType += 10;
      }
      const item = new item_types[itemType](
        model,
        metadata, geometry,
        materials,
        //new THREE.MeshFaceMaterial(materials),
        position, rotation, scale
      );
            
      item.fixed = fixed || false;
      items.push(item);
      scope.add(item);
      item.initObject();
      
      var ruta = fileName;
      
      if (metadata.allPalabras) {
          item.inicializarPalabras(metadata.allPalabras);
      }
      
      if (metadata.allBloques) {
          item.inicializarBloques(metadata.allBloques);
      }
      
      if (metadata.sepPieza) {
          item.asignarGTAsSeparadores(metadata.sepPieza);
      }
      // Relleno el array de materiales que tienen textura
      item.materialsFill = new Array();
      var materials = item.material;
      for (var i = 0; i < materials.length; i++){
            var mat = materials[i];	
            //if ((mat.name.search("TIRADOR") == -1) && (mat.name.search("UNICO") == -1)) {  
            if (mat.name.search("UNICO") == -1) {  
                    item.materialsFill.push(i);
            }
      }
//      console.log("Materiales con textura="+item.materialsFill);
    
      item.bloques = metadata.bloques;
      item.aliasBloques = metadata.aliasBloques;
      
     // Para cargar los tiradores
      if (metadata.tiradores_activos!=null && metadata.tiradores_activos!=""){
          var materials = item.material;
          var tiradores_activos = metadata.tiradores_activos;  
          for (var i = 0; i < materials.length; i++){
            var mat = materials[i];
            
            if (utils.bloqueEncontrado(mat.name,metadata.bloques) != -1)  {
            //if (mat.name.search("TIRADOR") != -1) {  
                if (tiradores_activos.indexOf(i) == -1) {
                  //mat.opacity = 0;
                  //mat.transparent = true; 
                  mat.visible = false;
                }
                else {
                  //mat.opacity = 1;
                  //mat.transparent = false;
                  mat.visible = true;
                }
                //console.log("T " + mat.name + " " + mat.visible + " " + mat.transparent + " " + mat.opacity);
                
            }
            mat.needsUpdate = true;
          }
      }
      
       
      // Para ocultar los materiales por apertura de puertas
      if ((metadata.materialOcultosAbrir!=null) && (metadata.materialOcultosAbrir.length > 0)){
       
            var materials = item.material;
            for (var i = 0; i < metadata.materialOcultosAbrir.length; i++) { 
                 var mat = materials[metadata.materialOcultosAbrir[i]];
                 mat.visible = false;
                 mat.needsUpdate = true;
            }
            item.materialOcultosAbrir = metadata.materialOcultosAbrir;
            item.openModule = true;
      }
      
      // Para cargar la textura
      if (metadata.model_texture!=null && metadata.model_texture!="" && metadata.model_texture!=="models/textures/"){
    	  
          var callback = function() {
            item.scene.needsUpdate = true;
          }
          
    	  var materials = item.material;
          if (metadata.textureFill == 2){
                  myMaterials = metadata.model_texture.textures;  
                  textures_url = metadata.model_texture.textures_url;  
                  textures_name = metadata.model_texture.textures_name;  
                  
        	  for (var i = 0; i < myMaterials.length; i++){
                         if (myMaterials[i].id != null) {
                          var t = myMaterials[i].t;   
        		  var mat = materials[myMaterials[i].id];
                          //console.log(mat + " " + myMaterials[i].id + " " + textures_url[t]);
                          // Comprobamos si la textura ya ha sido cargada, en caso contrario se carga y se guarda  
                            var texturaCargada = scope.mapaTexturas.get(textures_url[t]);
                            if (texturaCargada == null) {
                                texturaCargada = loaderTexture.load(textures_url[t], callback);
                                scope.mapaTexturas.set(textures_url[t],texturaCargada);
                            }
                          mat.map = texturaCargada;
        		  //mat.map = THREE.ImageUtils.loadTexture(textures_url[t]);
        		  mat.map.minFilter = THREE.LinearFilter;
                          mat.map.name = textures_name[t]; 
        	          mat.needsUpdate = true;
                         }
        	   }
                   
          }
          else {
                var texturaCargada = loaderTexture.load(metadata.model_texture, callback);  
                for (var i = 0; i < materials.length; i++){
    		  var mat = materials[i];	  
    		  var map = mat["map"];		
    		  if (map != null){
                        mat.map = texturaCargada;
                        //mat.map = THREE.ImageUtils.loadTexture( metadata.model_texture )
                        mat.map.minFilter = THREE.LinearFilter;
                        mat.needsUpdate = true;
    		  }
    		}
          }
    	  item.scene.needsUpdate = true;
    	  
//		  item.material.materials[0].map = THREE.ImageUtils.loadTexture(metadata.model_texture, null, null); 
//		  item.material.materials[0].needsUpdate = true;
//		  item.scene.needsUpdate = true;
	  }
      // Añadir a los items sus objetos asociados.
      if (itemsBounded) {
        itemsBounded.forEach( bounded => {
          if (bounded.comensalList){
            scope.comensalListLoaded.fire(item, bounded);
          }
          // Si hubiese otro tipo de itemBounded, habria que ponerlo aqui.
        });
      }
      scope.itemLoadedCallbacks.fire(item);     
    }
    
  function cargarItem(type,ext,fName,itemType, fileName, metadata, textureFill, position, rotation, scale, fixed, itemsBounded) {
      // LOADING GLTF
    if ((ext === 'gltf') || (ext === 'glb'))  {
        //const loader = new GLTFLoader().setPath( 'models/gltf/DamagedHelmet/glTF-instancing/' );
	//					loader.load( 'DamagedHelmetGpuInstancing.gltf', function ( gltf ) {

        loaderGLTF.load(fileName, 
        //loaderGLTF.load('models/js/Duck.gltf',
        function ( object ) { 
            //itemType = 10;
            //metadata.itemType = itemType;
            const root = object.scene;
            console.log(utils.dumpObject(root).join('\n'));
            //scope.add(object.scene.children[0]);
            
            var materials = utils.procesarMaterials(object);
            /*for (var i=0; i < materials.length; i++) {
                scope.gui.add(materials[i], 'roughness').min(0).max(1).step(0.0001).name("Object " + i + " roughness");
                scope.gui.add(materials[i], 'metalness').min(0).max(1).step(0.0001).name("Object " + i + " metalness");
            }*/
            
            for (var i=0; i < materials.length; i++) {
                console.log(i + " " + materials[i].name);
            }
            //var materials = new THREE.MeshPhongMaterial({color: 0x55B663});

            /*var materials = new THREE.MeshStandardMaterial( {color: 0x55B663} );
            //console.log(materials[0]);
            
            const geometry = new THREE.BoxGeometry( 100, 100, 100 );
            //geometry.computeFaceNormals();
            geometry.computeVertexNormals();
            
            const cubeA = new THREE.Mesh( geometry, materials[0] );
            cubeA.position.set( 175, 0, 0 );

            const cubeB = new THREE.Mesh( geometry, materials[0] );
            cubeB.position.set( -175, 0, 0 );*/

            
            //create a group and add the two cubes
            //These cubes can now be rotated / scaled etc as a group*/
            /*var group = new THREE.Group();
            for (var i=0; i < object.scene.children.length; i++) {
                group.add( object.scene.children[i].clone());
            }*/
            var group = utils.procesarMeshes(object);
            
            /*** PREDEFINED FORMS ******/
            //var s = predefinedForms();
            //materials = s.materials;
            //group = s.group;
            /****************************/
            
            //group.add(cubeA);
            //group.add(cubeB);
            /*const geo = [];
            for (var i=0; i < object.scene.children.length; i++) {
               geo.add(object.scene.children[i].geometry);
            }*/
            //const bgu = new BufferGeometryUtils();
            //const mergeGeo = BufferGeometryUtils.mergeBufferGeometries(object.scene.children.map(child =>
            //    child.geometry.clone() // The issue
            //));
            
            /*this.add(new THREE.Mesh(geometry, this.children[0].material));
            for (const child of this.children) {
                 child.visible = false;
            }*/
            
            //const mergeGeo = new THREE.BoxBufferGeometry(dimensions.x, dimensions.y, dimensions.z);

            //var glow = new THREE.Mesh(boxGeo, glowMaterial);
	
            //loaderCallback(object.scene.children[0].children[0].geometry, materials);
            if (type === "add") {
                loaderCallback(group, materials, ext, itemType, fileName, metadata, textureFill, position, rotation, scale, fixed, itemsBounded);
            } else {
                loaderCallbackDuplicate(group, materials, ext, itemType, fileName, metadata, position, rotation, scale, fixed, itemsBounded);
            }
            //loaderCallback(object.scene.children[0], materials);
            //loaderCallback(object.scene.children[0].geometry, object.scene.children[0].material);
        }, 
        function ( xhr ) { console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' ); });
        //function ( error ) { console.log( 'An error happened' ); } );
        
    // LOADING OBJ    
    } else if ((ext === 'obj'))  {
        
        var t0 = performance.now();
        loaderMTL.load( fName + '.mtl', function ( materials ) {

            materials.preload();
            loaderOBJ.setMaterials( materials ).load( fileName, 
            //new OBJLoader().load( fileName, 
                function ( object ) {
                      var t1 = performance.now();
                      console.log("LoadOBJ: " + (t1 - t0) + " milliseconds.");
                      var materials = utils.replaceMaterialsUnderscoreSymbol(object.children[0].material);
                      if (type === "add") {
                        loaderCallback(object.children[0].geometry, materials, ext, itemType, fileName, metadata, textureFill, position, rotation, scale, fixed, itemsBounded);
                      } else {
                        loaderCallbackDuplicate(object.children[0].geometry, materials, ext, itemType, fileName, metadata, position, rotation, scale, fixed, itemsBounded);  
                      }
                    }, function ( xhr ) { console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' ); },
                    function ( error ) { console.log( 'An error happened' ); } );

            } );
        
    // LOADING JS        
    } else {
    console.log("FILENAME: " + fileName);
    //loader.setPath('models/textures');
        var t0 = performance.now();
        loader.load(fileName,function(geometry, materials) {
            var t1 = performance.now();
            console.log("LoadJS: " + (t1 - t0) + " milliseconds.");
            
            for (var i=0; i < materials.length; i++) {
                console.log(i + " " + materials[i].name);
            }
            if (type === "add") {
                loaderCallback(geometry,materials, ext, itemType, fileName, metadata, textureFill, position, rotation, scale, fixed, itemsBounded);
            } else {
                loaderCallbackDuplicate(geometry,materials, ext, itemType, fileName, metadata, position, rotation, scale, fixed, itemsBounded);
            }
        });
    }
  }
     
  
  this.duplicateItem = function(itemType, fileName, metadata, textureFill, position, rotation, scale, fixed, itemsBounded) {
    itemType = itemType || 1;

    scope.itemLoadingCallbacks.fire();
    
    // Obtenemos la extensión
    var ext = fileName.split('.').pop().split('?')[0];
    var fName = fileName.split('.').shift();
    
    cargarItem("duplicate",ext,fName,itemType, fileName, metadata, textureFill, position, rotation, scale, fixed, itemsBounded);
    
  }
  
  function predefinedForms() {
      
        var callback = function() {
            scope.needsUpdate = true;
        };
        
        const gui = new dat.GUI();
        gui.onChange(callback);
        
        //const textureLoader = new THREE.TextureLoader();

        const doorColorTexture = loaderTexture.load('images/door/color.jpg', callback);
        const doorAlphaTexture = loaderTexture.load('images/door/alpha.jpg', callback);
        const doorAmbientOcclusionTexture = loaderTexture.load('images/door/ambientOcclusion.jpg', callback);
        const doorHeightTexture = loaderTexture.load('images/door/height.jpg', callback);
        const doorNormalTexture = loaderTexture.load('images/door/normal.jpg', callback);
        const doorMetalnessTexture = loaderTexture.load('images/door/metalness.jpg', callback);
        const doorRoughnessTexture = loaderTexture.load('images/door/roughness.jpg', callback);
        const matcapTexture = loaderTexture.load('images/matcaps/1.png', callback);
        const gradientTexture = loaderTexture.load('images/gradients/3.jpg', callback);
      
      
        var scene = { 
            materials : new THREE.MeshStandardMaterial(),
            group : new THREE.Group()
        };
        
        //const material = new THREE.MeshNormalMaterial()
       
       scene.materials.metalness = 0.7;
       scene.materials.roughness = 0.2;
       
       gui.add(scene.materials, 'metalness').min(0).max(1).step(0.0001);
       gui.add(scene.materials, 'roughness').min(0).max(1).step(0.0001);
        /*scene.materials.map = doorColorTexture;
       scene.materials.normalMap = doorNormalTexture;
       scene.materials.normalScale.set(0.5, 0.5);
       scene.materials.transparent = true;
       scene.materials.alphaMap = doorAlphaTexture;
       scene.materials.displacementScale = 0.05;*/
       /* scene.materials.transparent = true;
        scene.materials.opacity = 0.5;*/

        const cubeTextureLoader = new THREE.CubeTextureLoader();

        const environmentMapTexture = cubeTextureLoader.load([
            'images/environmentMaps/0/px.jpg',
            'images/environmentMaps/0/nx.jpg',
            'images/environmentMaps/0/py.jpg',
            'images/environmentMaps/0/ny.jpg',
            'images/environmentMaps/0/pz.jpg',
            'images/environmentMaps/0/nz.jpg'
        ]);
        
        //scene.materials.envMap = environmentMapTexture;
        
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(50, 16, 16),
            scene.materials
        );
        sphere.position.x = - 150;

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            scene.materials
        );

        const torus = new THREE.Mesh(
            new THREE.TorusGeometry(30, 20, 16, 32),
            scene.materials
        );
        torus.position.x = 150;
        
        const geometry = new THREE.BoxGeometry( 100, 100, 100 );
        //geometry.computeVertexNormals();
            
        const cube = new THREE.Mesh( geometry, scene.materials );
        //cube.position.z = 50;

        /*sphere.geometry.setAttribute('uv2', new THREE.BufferAttribute(sphere.geometry.attributes.uv.array, 2));
        plane.geometry.setAttribute('uv2', new THREE.BufferAttribute(plane.geometry.attributes.uv.array, 2));
        torus.geometry.setAttribute('uv2', new THREE.BufferAttribute(torus.geometry.attributes.uv.array, 2));
        
        scene.materials.aoMap = doorAmbientOcclusionTexture;
        scene.materials.aoMapIntensity = 1;
        scene.materials.displacementMap = doorHeightTexture;
        
        scene.materials.metalnessMap = doorMetalnessTexture;
        scene.materials.roughnessMap = doorRoughnessTexture;*/
        
        //scene.group.add(sphere);
        //scene.group.add(plane);
        //scene.group.add(torus);
        scene.group.add(cube);
        
        return scene;
  }
  
}

module.exports = Scene;