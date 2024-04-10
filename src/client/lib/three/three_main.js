import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import * as THREE from 'three';
var JQUERY = require('jquery');

const ThreeController = require('./three_controller');
const ThreeFloorplan = require('./three_floorplan');
const ThreeLights = require('./three_lights');
const ThreeSkybox = require('./three_skybox');
const ThreeControls = require('./three_controls');
// var ThreeCanvas = require('./three_canvas')
const ThreeHUD = require('./three_hud.js');


//var utils = require('../utils/utils');
//var EffectComposer = require('../three/jsm/postprocessing/EffectComposer');
//var OutlinePass = require('../three/jsm/postprocessing/OutlinePass');
//var RenderPass = require('../three/jsm/postprocessing/RenderPass');


var ThreeMain = function(model, element, canvasElement, opts) {
  var scope = this;
  
  this.keyControl=scope;
  
  var options = {
    resize: true,
    pushHref: false,
    spin: true,
    spinSpeed: .00002,
    clickPan: true,
    canMoveFixedItems: false
  }

  // override with manually set options
  for (var opt in options) {
    if (options.hasOwnProperty(opt) && opts.hasOwnProperty(opt)) {
      options[opt] = opts[opt]
    }
  }

  var scene = model.scene;
  var touchMode = false;
  var model = model;
  this.element = JQUERY(element);
  let startDragRoom = null;
  var domElement;

  var camera;
  var renderer;
  let css3DRenderer;
  this.lights;
  this.skyBox;
  //var composer;
  
  // Variable para guardar el estado de los elementos
  var historyDeshacer = [];
  var idx_historyDeshacer = -1;
  var needsUpdate_deshacer = false;
  
  var MAX_NUMBER_HISTORY_STATES = 50; 
  
  
  this.controls;
  var canvas;
  var controller;
  
  this.aux = controller;
  
  let floorplan;

  // var canvas;
  // var canvasElement = canvasElement;

  var needsUpdate = false;

  var lastRender = Date.now();
  var mouseOver = false;
  var hasClicked = false;
  
  var cargando = false;
  // activar o desactivar rotacion
  this.rotacion;

  var hud;

  this.heightMargin;
  this.widthMargin;
  this.elementHeight;
  this.elementWidth;

  this.itemSelectedCallbacks = JQUERY.Callbacks(); // item
  this.itemUnselectedCallbacks = JQUERY.Callbacks(); 

  this.wallClicked = JQUERY.Callbacks(); // wall
  this.floorClicked = JQUERY.Callbacks(); // floor
  this.nothingClicked = JQUERY.Callbacks();
  
  function init() {
    
    try {
        // Añadir una funcion al callback para actualizar la altura de un item cuando se modifica la habitacion
        model.floorplan.fireOnUpdatedRooms(scope.updateHeightItemsInRooms);
        // Añadir una funcion al callback para ajustar la altura de un nuevo item en la escena con su habitacion
        scene.itemLoadedCallbacks.add(scope.updateHeightNewItemInRoom);

        THREE.ImageUtils.crossOrigin = "";

        domElement = scope.element.get(0); // Container
        camera = new THREE.PerspectiveCamera(45, 1, 1, 15000);
        scene.add(camera);
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          preserveDrawingBuffer: true // required to support .toDataURL()
        });
        renderer.autoClear = false;
        renderer.shadowMap.enabled = true;
        console.log("DevicePixelRatio: " + window.devicePixelRatio);
        renderer.setPixelRatio(Math.min(2,window.devicePixelRatio ));
        //renderer.shadowMapSoft = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        //renderer.hola
        //alert(renderer.capabilities.maxTextureSize);
        
        // Environment
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
	      renderer.toneMappingExposure = 0.5;
	      //renderer.outputEncoding = THREE.sRGBEncoding;
      
        //Carga del entorno (Iluminación o HDR)
        scope.skyBox = new ThreeSkybox(scene);

        scope.controls = new ThreeControls(camera, domElement);

        hud = new ThreeHUD(scope, model);
        touchMode = is_touch_device();
        if (touchMode) {
            hud.setTouchTolerance();
        }

        // Seleccionado el entorno de iluminación de interior
        const environment = new RoomEnvironment( renderer );
        const pmremGenerator = new THREE.PMREMGenerator( renderer );
        scene.getScene().environment = pmremGenerator.fromScene( environment ).texture;
        environment.dispose();  

        /*composer = new EffectComposer( renderer );
        const renderPass = new RenderPass( scene.getScene(), camera );
        composer.addPass( renderPass );*/


        //outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene.getScene(), camera );
        //composer.addPass( outlinePass );


        controller = new ThreeController(
          scope, model, camera, scope.element, scope.controls, hud);

        // Añadir funcion al callback para saber la habitacion inicial de un dragging state
        controller.itemStartDragCallbacks.add(scope.updateOldRoomSelected);
        // Añadir funcion al callback para actualizar la altura de un item cuando se arrastra
        controller.itemDraggedCallbacks.add(scope.updateItemDraggedHeight);

        domElement.appendChild(renderer.domElement);

        /* CSS3DRenderer */
        css3DRenderer = new CSS3DRenderer();
        css3DRenderer.domElement.style.position = 'absolute'; // Posiciona el elemento DOM del renderer en la esquina superior izquierda de la página
        css3DRenderer.domElement.style.top = 0;
        domElement.appendChild(css3DRenderer.domElement); // Agrega el elemento DOM del renderer a tu página HTML
        /* End CSS3DRenderer */

        // handle window resizing
        scope.updateWindowSize();
        if (options.resize) {
          JQUERY(window).on('resize', scope.updateWindowSize);
        }

        // setup camera nicely
        scope.centerCamera();
        model.floorplan.fireOnUpdatedRooms(scope.centerCamera);

        scope.lights = new ThreeLights(scene, model.floorplan, camera);

        floorplan = new ThreeFloorplan(scene, 
          model.floorplan, scope.controls);

        animate();

        scope.element.on('mouseenter', function() {
          mouseOver = true;
        }).on('mouseleave', function() {
          mouseOver = false;
        }).on('click', function() {
          hasClicked = true;
        });

    } catch (err) {
        // Elevamos el error a design.js
        console.log(err);
        throw(err);
    }

    // canvas = new ThreeCanvas(canvasElement, scope);
  }
  
  this.isTouchMode = function() {
      return touchMode;
  }

  this.getFloorPlan = function() {
    return floorplan;
  }
  
    // https://codepen.io/Ferie/pen/vQOMmO
  function is_touch_device() {
        var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
        var mq = function(query) {
            return window.matchMedia(query).matches;
        }

        if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
            return true;
        }

        // include the 'heartz' as a way to have a non matching MQ to help terminate the join
        // https://git.io/vznFH
        var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
        return mq(query);
  }
  

  function spin() {
    if (options.spin && !mouseOver && scope.rotacion /*!hasClicked*/) {
      var theta = 2 * Math.PI * options.spinSpeed * (Date.now() - lastRender);
      scope.controls.rotateLeft(theta);
      scope.controls.update();
    }
  }

  this.dataUrl = function() {
    var dataUrl = renderer.domElement.toDataURL("image/png");
    //console.log("DATAURL: " + dataUrl);
    return dataUrl;
  }

  this.stopSpin = function() {
    hasClicked = true;
  }

  this.options = function() {
    return options;
  }

  this.getModel = function() {
    return model;
  }

  this.getScene = function() {
    return scene;
  }

  this.getController = function() {
    return controller;
  }

  this.getCamera = function() {
    return camera;
  }
  
  this.GLTFExporter = function() {
      return new GLTFExporter();
  }
 
  this.THREE_Version = function() {
      return parseInt(THREE.REVISION);
  }
 
  this.quaternionFromCamera = function(cam) {
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        return quaternion.multiply(cam.quaternion);
  }
 
 
  this.needsUpdate = function() {
    needsUpdate = true;

  }
  function shouldRender() {
    // Do we need to draw a new frame
    if (scope.controls.needsUpdate || controller.needsUpdate || needsUpdate || model.scene.needsUpdate) {
      //console.log("SR model.scene.needsUpdate " + model.scene.needsUpdate);
      //console.log("SR scope.controls.needsUpdate " + scope.controls.needsUpdate);
      //console.log("SR controller.needsUpdate " + controller.needsUpdate);
      //console.log("SR needsUpdate " + needsUpdate);  
      scope.controls.needsUpdate = false;
      controller.needsUpdate = false;
      needsUpdate = false;
      model.scene.needsUpdate = false;

      return true;
    } else {
      return false;
    }
  }

  function storeHistory() {
    //console.log("storeHistory needsUpdate_afterDragging " + controller.needsUpdate_afterDragging);
    if ((model.scene.needsUpdate || controller.needsUpdate_afterDragging) && (needsUpdate_deshacer == false)) {
      //console.log("storeHistory needsUpdate_afterDragging " + controller.needsUpdate_afterDragging);
      //console.log("storeHistory model.scene.needsUpdate " + model.scene.needsUpdate);
      var t0 = performance.now();
      var curr_items = model.exportSerialized(true);
      if ((!model.scene.getCargandoEscena()) && cambioEnEscena(curr_items) && (!cargando)) {
          console.log("Se va a registrar un cambio " + historyDeshacer.length);
          registrarCambio(curr_items);
      }
      var t1 = performance.now();
      console.log("History: " + (t1 - t0) + " milliseconds.");
      
      controller.needsUpdate_afterDragging = false;
    } else if ((model.scene.needsUpdate || controller.needsUpdate_afterDragging) && (needsUpdate_deshacer == true)) {
        needsUpdate_deshacer = false;
    }  
  }
  
  function render() {
    spin();
    storeHistory();
    if (shouldRender()) {
      
      renderer.clear();
      renderer.render(scene.getScene(), camera);
      
      //composer.render();
      renderer.clearDepth();
      renderer.render(hud.getScene(), camera); 

      css3DRenderer.render(scene.getScene(), camera);
      css3DRenderer.render(hud.getScene(), camera);
    }
    lastRender = Date.now();
  };
  
  function cambioEnEscena(curr_items) {
    var cambio = true;
    /*var curr_items = $.map(curr_items, function (obj) {
                      return $.extend(true, {}, obj);
                  });*/
      
    
      
    //var curr_items = JSON.parse(JSON.stringify(curr_items));  
    /*if (curr_items.length > 0) {
        console.log(curr_items[0].material.materials[3]);
    }*/
    if (historyDeshacer.length > 0) {
        var prev_items = historyDeshacer[idx_historyDeshacer]; 
        //console.log("IDX :" + idx_historyDeshacer);
        /*if (prev_items.length > 0) {
            console.log(prev_items[0].material.materials[3]);
        }*/
        if (asegurarSonDiferentes(prev_items, curr_items)) {
            cambio = true;    
        } else {
            cambio = false;
        }
        
    }
    return cambio;
  }
  
  function asegurarSonDiferentes(prev_json,curr_json) {
      
      if (prev_json == curr_json) {
          return false;
      }
      // El string en json se pasa a objeto para obtener la escena y los items
      let prev = JSON.parse(prev_json);
      let curr = JSON.parse(curr_json);
      
      // Se comparan las escenas (comparación en String) 
      //if (JSON.stringify(prev.floorplan) != JSON.stringify(curr.floorplan)) {
      //    return true;
      //} 
      
      // Se determinan los objetos comunes entre ambos estados
      var items_comunes = [];
      for (var i = 0; i < curr.items.length; i++) {
          var curr_item = JSON.stringify(curr.items[i]);
          for (var j = 0; j < prev.items.length; j++) {
            var prev_item = JSON.stringify(prev.items[j]);
            if (curr_item == prev_item) {
                items_comunes.push(curr_item);
                break;
            }
          }
      }
      if (items_comunes.length != curr.items.length) {
          return true;
      }
      return false;
  }
  
  this.intercambioEstados = function(prev_json,curr_json) {
      // El string en json se pasa a objeto para obtener la escena y los items
      prev = JSON.parse(prev_json);
      curr = JSON.parse(curr_json);
      
      // Se comparan las escenas (comparación en String) 
      //if (JSON.stringify(prev.floorplan) != JSON.stringify(curr.floorplan)) {
      //    model.floorplan.loadFloorplan(prev.floorplan);
      //} 
      
      // Se determinan los objetos comunes entre ambos estados
      var items_comunes = [];
      for (var i = 0; i < curr.items.length; i++) {
          var curr_item = JSON.stringify(curr.items[i]);
          for (var j = 0; j < prev.items.length; j++) {
            var prev_item = JSON.stringify(prev.items[j]);
            if (curr_item == prev_item) {
                items_comunes.push(curr_item);
                break;
            }
          }
      }
      
      // Se determinan los items a borrar (diferencia de los actuales con los comunes)
      var items_borrar = diferenciaConjuntoItems(curr.items,items_comunes);
      // Se determinan los items a insertar (diferencia de los anteriores con los comunes)
      var items_insertar = diferenciaConjuntoItems(prev.items,items_comunes);
      
      // Borramos los items. Hay que obtener la referencia del objeto tal y como está 
      // en la escena para poder llamar al removeItem (no vale el item tras exportar)
      for (var i=0; i < items_borrar.length; i++) {
          var item = items_borrar[i];
          var ib = scope.getScene().getItem(item);
          scope.getScene().removeItem(ib, false);
      }
      
      // Insertamos los items de la lista en la escena
      for (var i=0; i < items_insertar.length; i++) {
        var item = items_insertar[i];
        position = new THREE.Vector3(item.xpos, item.ypos, item.zpos);
        //alert(item.allBloques);
        var metadata = {
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
          sepPieza: item.sepPieza
        }

        var scale = {
          x: item.scale_x,
          y: item.scale_y,
          z: item.scale_z
        }
        
        console.log(metadata);
        console.log(scale);
        
        scope.getScene().addItem( 
          item.item_type, 
          item.model_url,
          metadata,
          item.textureFill,
          position, 
          item.rotation,
          scale,
          item.fixed);
      } 
  }
  
  this.initDeshacer = function() {
     historyDeshacer = [];
     idx_historyDeshacer = -1;   
     $("#deshacer").prop("disabled", true);
     $("#rehacer").prop("disabled", true);
     needsUpdate_deshacer = true;
     //model.initDeshacerFloorplan();
  }
  
  this.deshacer = function() {
      //console.log("Estoy en deshacer");
      cargando = true;
      $("#deshacer").prop("disabled", true);
      // Se obtiene el estado anterior y el actual (String)
      var prev_json = historyDeshacer[idx_historyDeshacer-1];
      var curr_json  = model.exportSerialized(true);
      
      this.intercambioEstados(prev_json,curr_json);
      
     
      // Decrementamos el contador de estados
      idx_historyDeshacer = idx_historyDeshacer - 1; 
      //console.log("Deshacer IDX :" + idx_historyDeshacer);
      if (idx_historyDeshacer < 1) {
          $("#deshacer").prop("disabled", true);
      } else {
          $("#deshacer").prop("disabled", false);
      }
      $("#rehacer").prop("disabled", false);
      needsUpdate_deshacer = true;
      cargando = false;
  }
  
  function diferenciaConjuntoItems(items, items_comunes) {
      var dif = [];
      for (var i = 0; i < items.length; i++) {
          var curr_item = JSON.stringify(items[i]);
          var enc = false;
          for (var j = 0; j < items_comunes.length; j++) {
             if (curr_item == items_comunes[j]) {
                 enc = true;
                 break;
             }
          }
          if (enc == false) {
              dif.push(items[i]);
          }
      }
      return dif;
  }
  
  this.rehacer = function() {
      //console.log("Estoy en rehacer");
      cargando = true;
      $("#rehacer").prop("disabled", true);
      // Se obtiene el estado siguiente y el actual (String)
      var prev_json = historyDeshacer[idx_historyDeshacer+1];
      var curr_json  = model.exportSerialized(true);
      
      this.intercambioEstados(prev_json,curr_json);
       
       
      // Incrementamos el contador de estados
      idx_historyDeshacer = idx_historyDeshacer + 1; 
      //console.log("Rehacer IDX :" + idx_historyDeshacer);
      if (idx_historyDeshacer == (historyDeshacer.length - 1)) {
          $("#rehacer").prop("disabled", true);
      } else {
          $("#rehacer").prop("disabled", false);
      }
      $("#deshacer").prop("disabled", false);
      needsUpdate_deshacer = true;
      cargando = false;
  }
  function registrarCambio(curr_items) {
      
      // Si el tamaño de array de estados se llena se elimina el primero
      if (historyDeshacer.length == MAX_NUMBER_HISTORY_STATES) {
          historyDeshacer.shift();
          idx_historyDeshacer = idx_historyDeshacer - 1;  
      }
      
      // Si estoy en la ultima posición del array añado al mismo de forma normal
      if (idx_historyDeshacer == (historyDeshacer.length - 1)) {
          historyDeshacer.push(curr_items);
      } else {
          // Si vengo de un deshacer elimino a partir de esa posición en el vector de estados
          historyDeshacer.splice(idx_historyDeshacer+1, historyDeshacer.length - (idx_historyDeshacer+1));
          historyDeshacer.push(curr_items);
      }
      idx_historyDeshacer = idx_historyDeshacer + 1;
      if (idx_historyDeshacer > 0) {
          $("#deshacer").prop("disabled", false);
      }
      console.log("historyDeshacer " + historyDeshacer.length + " idx " + idx_historyDeshacer);
      $("#rehacer").prop("disabled", true);
  }

  function equalsItems(prev_items, curr_items) {
      if (prev_items == curr_items) {
          return true;
      }
      return false;
  }
  
 function compareItems(o1, o2){
    //var properties = ['desfaseAltura', 'eastWall', 'metadata','northWall','position','scale','westWall','southWall','material']; 
    //for (i = 0; i < properties.length; i++) {
    for (var p in o1) {    
        //var p = properties[i];
        if(o1.hasOwnProperty(p)){
            /*if (p == "material") {
                console.log(o1[p]);
                console.log(o2[p]);
            }*/
            if((o1[p] !== o2[p]) && (!isNaN(o1[p]) && !isNaN(o2[p]))){
                console.log(p);
                console.log(o1[p]);
                console.log(o2[p]);
                return false;
            }
        }
    }
    for (var p in o1) {   
    //for (i = 0; i < properties.length; i++) {
        //var p = properties[i];
        if(o2.hasOwnProperty(p)){
            if((o1[p] !== o2[p]) && (!isNaN(o1[p]) && !isNaN(o2[p]))){
                console.log(o1[p]);
                console.log(o2[p]);
                return false;
            }
        }
    }
    return true;
};
  
  function animate() {
    var delay = 50;
    setTimeout(function() { 
      requestAnimationFrame(animate);
      }, delay);
    render();
  };

  this.rotatePressed = function() {
    controller.rotatePressed();
  }

  this.rotateReleased = function() {
    controller.rotateReleased();
  }

  this.setCursorStyle = function(cursorStyle) {
    domElement.style.cursor = cursorStyle;
  };

  this.showRotationArrow = function(hide) {
    hud.setVisible(hide);
  }
  
  this.hudUpdate = function() {
      hud.update();
  }

  this.PerspectiveCamera = function() {
      return new THREE.PerspectiveCamera();
  }

  this.updateWindowSize = function() {
    scope.heightMargin = scope.element.offset().top;
    scope.widthMargin = scope.element.offset().left;

    scope.elementWidth = scope.element.innerWidth();
    if (options.resize) {
      scope.elementHeight = window.innerHeight - scope.heightMargin;
    } else {
      scope.elementHeight = scope.element.innerHeight();
    }

    camera.aspect = scope.elementWidth / scope.elementHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(scope.elementWidth, scope.elementHeight);
    css3DRenderer.setSize(scope.elementWidth, scope.elementHeight);
    //composer.setSize(scope.elementWidth, scope.elementHeight);
    
    needsUpdate = true;
  }

  this.centerCamera = function() {
    var yOffset = 150.0;

    var pan = model.floorplan.getCenter();
    pan.y = yOffset;

    scope.controls.target = pan;

    var distance = model.floorplan.getSize().z * 1.5;

    var offset = pan.clone().add(
      new THREE.Vector3(0, distance, distance));
    // scope.controls.setOffset(offset);
    camera.position.copy(offset);

    scope.controls.update();
  }
  
  this.topViewCamera = function() {
    var yOffset = 1000;

    var pan = model.floorplan.getCenter();
    console.log("PAN: " + pan);
    pan.y = yOffset;
    pan.z = 70;

    scope.controls.target = pan;

    var distance = model.floorplan.getSize().z * 1.5;

    var offset = pan.clone();
            
    //          .add(
    //  new THREE.Vector3(0, distance, distance));
    // scope.controls.setOffset(offset);
    camera.position.copy(offset);

//scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
			
    scope.controls.update();
  }

  // projects the object's center point into x,y screen coords
  // x,y are relative to top left corner of viewer
  this.projectVector = function(vec3, ignoreMargin) {
    ignoreMargin = ignoreMargin || false;

    var widthHalf = scope.elementWidth / 2;
    var heightHalf = scope.elementHeight / 2;

    var vector = new THREE.Vector3();
    vector.copy(vec3);
    vector.project(camera);

    var vec2 = new THREE.Vector2();

    vec2.x = ( vector.x * widthHalf ) + widthHalf;
    vec2.y = - ( vector.y * heightHalf ) + heightHalf;

    if (!ignoreMargin) {
       vec2.x += scope.widthMargin;
       vec2.y += scope.heightMargin;
    }

    return vec2;
  }

  function getRoomFromItem(item) {
    const floors = floorplan.floors;
    let floorIter = 0;
    let found = false;

    /* 
      Cuando se llama a esta funcion, por si acaso la referencia al edge esta desfasada, se actualiza al edge mas cercano.
      Esto para todos los itemGroup que sean de tipo Wall.
    */
    if (item.isWallItem()) {
      const closestWallEdge = item.closestWallEdge();
      item.changeWallEdge(closestWallEdge);
      return closestWallEdge.room;
    }

    console.log(floors);
    // Si son items de suelo se itera por las habitaciones
    while (floorIter < floors.length && !found) {
      const floor = floors[floorIter];
      found = item.isItemInRoom(floor);
      if (found) {
        return floor.room;
      }
      floorIter++;
    }

    return null;
  }

  this.updateOldRoomSelected = function(item) {

    // Siempre deberia haber habitacion, si no algo va mal

    startDragRoom = getRoomFromItem(item);

  }

  this.updateItemDraggedHeight = function(item) {
    const room = getRoomFromItem(item);
    const roomAltitude = room.altitude;

    if (startDragRoom) {
      // Si se ha movido de habitacion o se reconoce la habitacion inicial
      const oldRoomAltitude = startDragRoom.altitude;

      item.setPosition(item.position.x, item.position.y + (roomAltitude - oldRoomAltitude), item.position.z);
    }
    // Si no se reconoce la habitacion inicial, no se hace nada (no deberia pasar)

  }

  this.updateHeightNewItemInRoom = function(item) {
    const room = getRoomFromItem(item);
    if (room) {
      const roomAltitude = room.altitude;
      item.setPosition(item.position.x, item.position.y + roomAltitude, item.position.z);
    }

    // Si no hay habitacion, algo malo ha ocurrido
  }

  this.updateHeightItemsInRooms = function() { // Cuando se actualiza la altura de las habitaciones
    const roomsAltitude = floorplan.floorplan.getRoomsAltitude();
    const items = model.scene.getItems();

      items.forEach(item => {

        const room = getRoomFromItem(item);
        if (room && floorplan.floorplan.roomsAltitudeChanged(room)) {
          const newRoomAltitude = roomsAltitude[room.getUuid()]['newAltitude'];
          const oldRoomAltitude = roomsAltitude[room.getUuid()]['oldAltitude'];
              
          const plusAltitude = newRoomAltitude - oldRoomAltitude;
          item.setPosition(item.position.x, item.position.y + plusAltitude, item.position.z);
        }

        else {
          // Si no hay habitacion, algo malo ha ocurrido
          console.error('No se ha encontrado la habitacion del item');
        }
      })
      // Ya se actualizaron los objetos, la altura antigua no sirve.
      floorplan.floorplan.equaliceRoomsAltitude();
  }

  init();
}

module.exports = ThreeMain;