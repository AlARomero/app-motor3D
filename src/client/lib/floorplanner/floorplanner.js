var $ = require('jquery');
var FloorplannerView = require('./floorplanner_view');
import * as THREE from 'three';
var utils = require('../utils/utils');

var Floorplanner = function(canvas, model) {

  var scope = this;
  var floorplan = model.floorplan;
  var scene = model.scene;

  this.modes = {
    MOVE: 0,
    DRAW: 1,
    DELETE: 2,
    ALTURA_MUROS: 3
  };
  this.mode = 0;
  var mouseDown = false;
  var mouseMoved = false;
  this.clickActivated = false;
  
  this.activeWall = null;
  this.activeCorner = null;

  this.originX = 0;
  this.originY = 0;

  // how much will we move a corner to make a wall axis aligned (cm)
  var snapTolerance_min = 1;
  var snapTolerance = 10;
  var snapTolerance_max = 15;
  
  var mouseTolerance_min = 2;
  var mouseTolerance = 5;
  var mouseTolerance_max = 10;
  
  // these are in threeJS coords
  var mouseX = 0;
  var mouseY = 0;
  var rawMouseX = 0;
  var rawMouseY = 0;

  // mouse position at last click
  var lastX = 0;
  var lastY = 0;

  // drawing state
  this.targetX = 0;
  this.targetY = 0;
  this.lastNode = null;
  
  // deshacer floorplan
  var historyDeshacerFloorplan = [];
  var idx_historyDeshacerFloorplan = -1;
  var needsUpdate_deshacerFloorplan = false;
  var cargando = false;
  var MAX_NUMBER_HISTORY_STATES = 50; 
  
  this.modeResetCallbacks = $.Callbacks();

  var canvasElement = $("#"+canvas);

  var view = new FloorplannerView(floorplan, this, canvas, scene);

  var cmPerFoot = 30.48;
  
  var pixelsPerFoot_def = 22.0; // 15.0
  var pixelsPerFoot_min = 4; // 15.0
  var pixelsPerFoot = 22.0; // 15.0
  var pixelsPerFoot_max = 60;
  
  var cmPerPixel = cmPerFoot * (1.0 / pixelsPerFoot);
  var pixelsPerCm = 1.0 / cmPerPixel;
  this.wallWidth = 10.0 * pixelsPerCm;

  var lengthLine = "";  
  var enterActivated = false;
  
  // Touch
  this.comienzaPintar = false;
  var touchMode = false;
  var toleranceCornerTouch;
  var STATE = { NONE : -1, PAN : 0, DOLLY : 1 };
  var state = STATE.NONE;
  var dollyStart = new THREE.Vector2();
  var dollyEnd = new THREE.Vector2();
  var dollyDelta = new THREE.Vector2();

  // FUNCION para lengthLine
  this.addNumberLengthLine = function(num) {
      
      idx = lengthLine.indexOf('.');
      if ((num == '.') || (num == ',')) {
        if ((idx == -1) && (lengthLine.length > 0)) {
            lengthLine = lengthLine + '.';
        }
      } else {
        if (idx == -1) {
           var l = lengthLine.length;
           if (l == 4) {
            lengthLine = lengthLine + '.';
           }
           lengthLine = lengthLine + num;
        } else {
           var subl = lengthLine.substring(idx+1); 
           if (subl.length < 2) {
              lengthLine = lengthLine + num;
           }
        }
          
      }
      console.log("LengthLine: " + lengthLine);
  }
  this.popNumberLengthLine = function() {
      if (lengthLine.length > 0) {
        lengthLine = lengthLine.substring(0,lengthLine.length - 1);
        lastCaracter = lengthLine.substring(lengthLine.length-1,lengthLine.length);
        if (lastCaracter == '.') {
            lengthLine = lengthLine.substring(0,lengthLine.length - 1);
        }
      }
      console.log("LengthLine: " + lengthLine);
  }
    
  this.triggerLengthLine = function() {
      if (lengthLine.length > 0) {
        console.log("Mayor que 0");
        enterActivated = true;
        mouseup();
      }
  }  
  
  // FUNCIONES DESHACER  
  this.initDeshacerFloorplan = function() {
      
    historyDeshacerFloorplan = [];
    idx_historyDeshacerFloorplan = -1;   
    $("#deshacerFloorplan").prop("disabled", true);
    $("#rehacerFloorplan").prop("disabled", true);
    needsUpdate_deshacerFloorplan = true;
    storeHistoryFloorplan();
  }
  
  this.deshacerFloorplan = function() {
     //console.log("Estoy en deshacer");
      cargando = true;
      $("#deshacerFloorplan").prop("disabled", true);
      // Se obtiene el estado anterior y el actual (String)
      var prev_json = historyDeshacerFloorplan[idx_historyDeshacerFloorplan-1];
      var curr_json  = model.exportSerialized(true);
      
      this.intercambioEstadosFloorplan(prev_json,curr_json);
      
      // Decrementamos el contador de estados
      idx_historyDeshacerFloorplan = idx_historyDeshacerFloorplan - 1; 
      //console.log("Deshacer IDX :" + idx_historyDeshacer);
      if (idx_historyDeshacerFloorplan < 1) {
          $("#deshacerFloorplan").prop("disabled", true);
      } else {
          $("#deshacerFloorplan").prop("disabled", false);
      }
      $("#rehacerFloorplan").prop("disabled", false);
      needsUpdate_deshacerFloorplan = true;
      cargando = false; 
  }
  
  this.rehacerFloorplan = function() {
      //console.log("Estoy en rehacer");
      cargando = true;
      $("#rehacerFloorplan").prop("disabled", true);
      // Se obtiene el estado siguiente y el actual (String)
      var prev_json = historyDeshacerFloorplan[idx_historyDeshacerFloorplan+1];
      var curr_json  = model.exportSerialized(true);
      
      this.intercambioEstadosFloorplan(prev_json,curr_json);
       
      // Incrementamos el contador de estados
      idx_historyDeshacerFloorplan = idx_historyDeshacerFloorplan + 1; 
      //console.log("Rehacer IDX :" + idx_historyDeshacer);
      if (idx_historyDeshacerFloorplan == (historyDeshacerFloorplan.length - 1)) {
          $("#rehacerFloorplan").prop("disabled", true);
      } else {
          $("#rehacerFloorplan").prop("disabled", false);
      }
      $("#deshacerFloorplan").prop("disabled", false);
      needsUpdate_deshacerFloorplan = true;
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
  
  this.intercambioEstadosFloorplan = function(prev_json,curr_json) {
      // El string en json se pasa a objeto para obtener la escena y los items
      const prev = JSON.parse(prev_json);
      const curr = JSON.parse(curr_json);
      
      // Se comparan las escenas (comparación en String) 
      if (JSON.stringify(prev.floorplan) != JSON.stringify(curr.floorplan)) {
          floorplan.loadFloorplan(prev.floorplan);
         
      } 
      // Se vuelven a añadir las paredes
      const items_paredes = [];
      for (const element of curr.items) {
          const prev_item = element;
          if (prev_item.item_type == 2 || prev_item.item_type == 3 || 
                  prev_item.item_type == 7) {
                items_paredes.push(prev_item);
          }
      }
      model.scene.addSeveralItems(items_paredes);
      floorplan.update();
      updateTarget();
      view.draw();
  }
  
  function storeHistoryFloorplan() {
    var t0 = performance.now();
    var curr_items = model.exportSerialized(true);
    if (cambioEnEscenaFloorplan(curr_items)) {
          console.log("Se va a registrar un cambio " + historyDeshacerFloorplan.length);
          registrarCambioFloorplan(curr_items);
    }
    var t1 = performance.now();
    console.log("History: " + (t1 - t0) + " milliseconds.");
  }
  
  function cambioEnEscenaFloorplan(curr_items) {
    var cambio = true;
    
    if (historyDeshacerFloorplan.length > 0) {
        var prev_items = historyDeshacerFloorplan[idx_historyDeshacerFloorplan]; 
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
      if (JSON.stringify(prev.floorplan) != JSON.stringify(curr.floorplan)) {
          return true;
      } 
      return false;
  }
  
  function registrarCambioFloorplan(curr_items) {
      
      // Si el tamaño de array de estados se llena se elimina el primero
      if (historyDeshacerFloorplan.length == MAX_NUMBER_HISTORY_STATES) {
          historyDeshacerFloorplan.shift();
          idx_historyDeshacerFloorplan = idx_historyDeshacerFloorplan - 1;  
      }
      
      // Si estoy en la ultima posición del array añado al mismo de forma normal
      if (idx_historyDeshacerFloorplan == (historyDeshacerFloorplan.length - 1)) {
          historyDeshacerFloorplan.push(curr_items);
      } else {
          // Si vengo de un deshacer elimino a partir de esa posición en el vector de estados
          historyDeshacerFloorplan.splice(idx_historyDeshacerFloorplan+1, historyDeshacerFloorplan.length - (idx_historyDeshacerFloorplan+1));
          historyDeshacerFloorplan.push(curr_items);
      }
      idx_historyDeshacerFloorplan = idx_historyDeshacerFloorplan + 1;
      if (idx_historyDeshacerFloorplan > 0) {
          $("#deshacerFloorplan").prop("disabled", false);
      }
      console.log("historyDeshacerFloorplan " + historyDeshacerFloorplan.length + " idx " + idx_historyDeshacerFloorplan);
      $("#rehacerFloorplan").prop("disabled", true);
  }
  // FIN FUNCIONES DESHACER
  
  this.zoomOut = function(c) {
      c = c || 1.1;
      if (pixelsPerFoot > pixelsPerFoot_min) {
        pixelsPerFoot = pixelsPerFoot / c;
        pixelsPerFoot = pixelsPerFoot.toFixed(2);
        zoomCommon();
        console.log("ZoomOut: " + pixelsPerFoot);
      }
  }  
  
  this.zoomIn = function(c) {
      c = c || 1.1;
     
      if (pixelsPerFoot < pixelsPerFoot_max) {

        pixelsPerFoot = pixelsPerFoot * c;
        pixelsPerFoot = pixelsPerFoot.toFixed(2);
        zoomCommon();
        console.log("ZoomIn: " + pixelsPerFoot);
      }
  }  
  
  function zoomCommon(wallWidth) {
      cmPerPixel = cmPerFoot * (1.0 / pixelsPerFoot);
      pixelsPerCm = 1.0 / cmPerPixel;
      wallWidth = 10.0 * pixelsPerCm;
      //resetOrigin();
      view.draw();
  }

  function initTouch() {
    mouseTolerance_min = 12;
    mouseTolerance = 20;
    mouseTolerance_max = 26;
    toleranceCornerTouch = 18;
    touchMode = true;
  }  
  function init() {
    scope.setMode(scope.modes.MOVE);
    
    if ('ontouchstart' in document.documentElement) {
        // TOUCH
        canvasElement.on("touchstart", touchstart );
        //canvasElement.on("touchmove", touchmove );
        //canvasElement.on("touchend", touchend );
        initTouch();
      
    } else {
        canvasElement.on('mousedown', mousedown);
        canvasElement.on('mousemove', mousemove);
        canvasElement.on('mouseup', mouseup);
        canvasElement.on('mouseleave', mouseleave);
        //canvasElement.dblclick(dblclick);
    }
     
    //floorplan.roomLoadedCallbacks.add(scope.reset);
  }

  function escapeKey() {
    scope.setMode(scope.modes.MOVE);
  }

  this.update = function() {
    view.draw();
  }  
  
  function updateTarget() {
        //console.log("UpdateTarget (before): " + mouseX + " " + mouseY);
        //console.log(scope.lastNode);
        if (scope.mode == scope.modes.DRAW && scope.lastNode) { 
          if (Math.abs(mouseX - scope.lastNode.x) < getSnapTolerance()) {
            scope.targetX = scope.lastNode.x;
          } else {
            scope.targetX = mouseX;
          }
          if (Math.abs(mouseY - scope.lastNode.y) < getSnapTolerance()) {
            scope.targetY = scope.lastNode.y;
          } else {
            scope.targetY = mouseY;
          }

        } else {
          scope.targetX = mouseX;
          scope.targetY = mouseY;  

        }
        //console.log("UpdateTarget (after): " + scope.targetX + " " + scope.targetY + " " + scope.lastNode);
        view.draw();
    
  }
  
  
  function getYellowWall() {
      var walls = floorplan.getWalls();
      for (var i = 0; i < walls.length; i++){
        if (walls[i].color == "#ffff00") {
            return walls[i];
        }
        
      } 
      return null;
  }
  
  this.changeHeightAllWalls = function(d) {
    var walls = floorplan.getWalls();
    for (var i = 0; i < walls.length; i++){
        walls[i].setWallHeight(d);
    } 
    updateTarget();
    view.draw();
  }
  
  this.changeWallHeight = function(d) {
    var wall = getYellowWall();
    console.log("Estoy en changeWallHeight: " + wall);
    wall.setWallHeight(d);
    updateTarget();
    view.draw();
  }
  
  
  this.changeWall_LeftUp = function(d) {
    var wall = getYellowWall();
    if (wall) {
        //d = d * 100;
        var len;
        if (wall.backEdge) {
            len = wall.backEdge.interiorDistance();
        } else {
            len = wall.frontEdge.interiorDistance();
        }
        
        var dif = d - len; 
        wall.moveLeftCorner(dif);
        updateTarget();

        scope.clickActivated = false;
        utils.forEach(floorplan.getWalls(), resetColorWall);
        $("#introducirMedidas").hide();
        view.draw();
        storeHistoryFloorplan(); 
    }
  }

  this.changeWall_RightDown = function(d) {
    var wall = getYellowWall();
    if (wall) {
        //d = d * 100;
        var len;
        if (wall.backEdge) {
            len = wall.backEdge.interiorDistance();
        } else {
            len = wall.frontEdge.interiorDistance();
        }
        var dif = d - len; 
        wall.moveRightCorner(dif);
        updateTarget();

        scope.clickActivated = false;
        utils.forEach(floorplan.getWalls(), resetColorWall);
        $("#introducirMedidas").hide();
        view.draw();
        storeHistoryFloorplan(); 
    }
  }
  
  function oneTouchStartFloorplanner(event) {
      
    mouseDown = true;
    mouseMoved = false;
    
    //console.log("[TouchStart] numTouches: " + event.touches.length);
    //event.preventDefault();
    
    rawMouseX = event.touches[ 0 ].pageX;
    rawMouseY = event.touches[ 0 ].pageY;

    mouseX = (rawMouseX - canvasElement.offset().left) * cmPerPixel + scope.originX * cmPerPixel;
    mouseY = (rawMouseY - canvasElement.offset().top) * cmPerPixel + scope.originY * cmPerPixel;
    
    lastX = rawMouseX;
    lastY = rawMouseY;
    
    if (scope.mode == scope.modes.DRAW && scope.comienzaPintar) {
        scope.comienzaPintar = false;
        updateTarget();
        var corner = floorplan.newCorner(scope.targetX, scope.targetY,undefined,1,toleranceCornerTouch);
        if (corner != null && corner.mergeWithIntersected() && scope.lastNode != null) {
          scope.setMode(scope.modes.MOVE);

        } 
        storeHistoryFloorplan(); 
        scope.lastNode = corner;  
    } else if ((scope.mode == scope.modes.MOVE) || (scope.mode == scope.modes.DELETE)) {
      //console.log("Tolerancia: " + getMouseTolerance());  
      var hoverCorner = floorplan.overlappedCorner(mouseX, mouseY,getMouseTolerance());
      var hoverWall = floorplan.overlappedWall(mouseX, mouseY,getMouseTolerance());      
      var draw = false;
      if (hoverCorner != scope.activeCorner) {
        scope.activeCorner = hoverCorner;
        draw = true;
      }
      // corner takes precendence
      if (scope.activeCorner == null) {
        if (hoverWall != scope.activeWall) {
          scope.activeWall = hoverWall;
          draw = true;
        }  
      } else {
        scope.activeWall = null;
      }
      if (draw) {
        view.draw();
        if (scope.mode == scope.modes.ALTURA_MUROS) {
            console.log("En alturaMuros");
            scope.setMode(scope.modes.MOVE);
            $('#move').trigger('focus');
            
        }
      }
    }
  }
  
  function touchstart(event) {
   
    //console.log("Estoy en touchstart (2D). Dedos activos: " + event.touches.length);
    
    switch ( event.touches.length ) {

        case 1:	// one-fingered touch: pan
            state = STATE.PAN;
            oneTouchStartFloorplanner(event);
            break;

        case 2:	// two-fingered touch: dolly
            scope.setMode(scope.modes.MOVE);
            /*state = STATE.DOLLY;
            
            var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
            var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
            var distance = Math.sqrt( dx * dx + dy * dy );
            dollyStart.set( 0, distance );*/
            break;

        default:
                state = STATE.NONE;

        }
        canvasElement.on("touchmove", touchmove );
        canvasElement.on("touchend", touchend );
  }
  
  function mousedown(event) {
   
    //console.log("Estoy en mouseDown (2D)");
    mouseDown = true;
    mouseMoved = false;
    
    //console.log("[MouseMove] numTouches: " + event.touches.length);
    
    //console.log("[Mousedown] rawMouse: " + event.clientX + " " + event.clientY);
    
    lastX = rawMouseX;
    lastY = rawMouseY;
    
    // delete
    if (scope.mode == scope.modes.DELETE) {
      if (scope.activeCorner) {
        scope.activeCorner.removeAll();
      } else if (scope.activeWall) {
        scope.activeWall.remove();
      } else {
        scope.setMode(scope.modes.MOVE);
      }
    }
    
  }

  function getMouseTolerance() {

      if (pixelsPerFoot >= pixelsPerFoot_def) {
          var v_x = pixelsPerFoot_def - pixelsPerFoot_max;
          var v_y = mouseTolerance - mouseTolerance_min;
          var m = (pixelsPerFoot - pixelsPerFoot_max)*(v_y/v_x) + mouseTolerance_min;
      } else {
          var v_x = pixelsPerFoot_min - pixelsPerFoot_def;
          var v_y = mouseTolerance_max - mouseTolerance;
          var m = (pixelsPerFoot - pixelsPerFoot_def)*(v_y/v_x) + mouseTolerance;
      } 
      
      return m;
  }
  
  function getSnapTolerance() {
      
      if (pixelsPerFoot >= pixelsPerFoot_def) {
          var v_x = pixelsPerFoot_def - pixelsPerFoot_max;
          var v_y = snapTolerance - snapTolerance_min;
          var m = (pixelsPerFoot - pixelsPerFoot_max)*(v_y/v_x) + snapTolerance_min;
      } else {
          var v_x = pixelsPerFoot_min - pixelsPerFoot_def;
          var v_y = snapTolerance_max - snapTolerance;
          var m = (pixelsPerFoot - pixelsPerFoot_def)*(v_y/v_x) + snapTolerance;
      } 
      
      return m;
  }
  
  function oneTouchMoveFloorplanner(event) {
    
    mouseMoved = true;
    //console.log("Estoy en touchmove (2D)");
    //console.log("[Touchmove] numTouches: " + event.touches.length);
    
    // Si se usa en tablets se controla el evento touches
    
    // update mouse
    rawMouseX = event.touches[ 0 ].pageX;
    rawMouseY = event.touches[ 0 ].pageY;

    mouseX = (event.touches[ 0 ].pageX - canvasElement.offset().left) * cmPerPixel + scope.originX * cmPerPixel;
    mouseY = (event.touches[ 0 ].pageY - canvasElement.offset().top) * cmPerPixel + scope.originY * cmPerPixel;

    // update target (snapped position of actual mouse)
    if (scope.mode == scope.modes.DRAW) {
     // console.log("[TouchMove] Drawing");  
      updateTarget();
      
    }

    // panning
    else if (mouseDown && !scope.activeCorner && !scope.activeWall) {
      //console.log("[TouchMove] Panning");  
      //console.log("[MouseMove] rawMouse: " + rawMouseX + " " + rawMouseY);
      //console.log("[MouseMove] last: " + lastX + " " + lastY);
      
      scope.originX += (lastX - rawMouseX);
      scope.originY += (lastY - rawMouseY);
      lastX = rawMouseX;
      lastY = rawMouseY;
      view.draw();
    }

    // dragging
    else if (scope.mode == scope.modes.MOVE && mouseDown) {
      //console.log("[TouchMove] Dragging");  
      //console.log("dragging");  
      if (scope.activeCorner) {
        scope.activeCorner.move(mouseX, mouseY);
        //console.log("SnapTolerance: " + getSnapTolerance());
        scope.activeCorner.snapToAxis(getSnapTolerance());
      } else if (scope.activeWall) {
        scope.activeWall.relativeMove(
          (rawMouseX - lastX) * cmPerPixel, 
          (rawMouseY - lastY) * cmPerPixel
        );
        scope.activeWall.snapToAxis(getSnapTolerance());
        lastX = rawMouseX;
        lastY = rawMouseY;
      }
      view.draw();
    } 
  }
  
  function touchmove(event) {
    //event.preventDefault();
    //event.stopPropagation();

    //console.log("[Touchmove] Dedos activos: " + event.touches.length);
    switch ( event.touches.length ) {

            case 1: // one-fingered touch: rotate
                if ( state !== STATE.PAN ) { return; }
                oneTouchMoveFloorplanner(event);
                break;

            case 2: // two-fingered touch: dolly
                if ( state !== STATE.DOLLY ) { return; }

                /*var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                var distance = Math.sqrt( dx * dx + dy * dy );

                dollyEnd.set( 0, distance );
                dollyDelta.subVectors( dollyEnd, dollyStart );
                console.log("Distance: " + distance);
                console.log("y: " + dollyDelta.y);
                if ( dollyDelta.y < 0 ) {
                        //scope.dollyOut();
                        scope.zoomOut(1.02);
                } else {
                        //scope.dollyIn();
                        scope.zoomIn(1.02);
                }
                dollyStart.copy( dollyEnd );*/
                break;

            default:
                state = STATE.NONE;
    }
  }
  
  function mousemove(event) {
    
    mouseMoved = true;
    //console.log("Estoy en mouseMove (2D)");
 
    // update mouse
    rawMouseX = event.clientX;
    rawMouseY = event.clientY;

    //console.log("[MouseMove] numTouches: " + event.touches.length);
    //console.log("[MouseMove] rawMouse: " + rawMouseX + " " + rawMouseY);
    
    mouseX = (event.clientX - canvasElement.offset().left) * cmPerPixel + scope.originX * cmPerPixel;
    mouseY = (event.clientY - canvasElement.offset().top) * cmPerPixel + scope.originY * cmPerPixel;
    
    
    // update target (snapped position of actual mouse)
    if ((scope.mode == scope.modes.DRAW) || (scope.mode == scope.modes.MOVE && mouseDown)) {
      //console.log("Esytoy aki");
      updateTarget();
    }

    // update object target
    if (scope.mode != scope.modes.DRAW && !mouseDown) {
      var hoverCorner = floorplan.overlappedCorner(mouseX, mouseY,getMouseTolerance());
      var hoverWall = floorplan.overlappedWall(mouseX, mouseY,getMouseTolerance());      
      var draw = false;
      if (hoverCorner != scope.activeCorner) {
        scope.activeCorner = hoverCorner;
        draw = true;
      }
      // corner takes precendence
      if (scope.activeCorner == null) {
        if (hoverWall != scope.activeWall) {
          scope.activeWall = hoverWall;
          draw = true;
        }  
      } else {
        scope.activeWall = null;
      }
      if (draw) {
        view.draw();
        if (scope.mode == scope.modes.ALTURA_MUROS) {
            console.log("En alturaMuros");
            scope.setMode(scope.modes.MOVE);
            $('#move').trigger('focus');
            
        }
      }
    }

    // panning
    if (mouseDown && !scope.activeCorner && !scope.activeWall) {
      scope.originX += (lastX - rawMouseX);
      scope.originY += (lastY - rawMouseY);
      lastX = rawMouseX;
      lastY = rawMouseY;
      view.draw();
    }

    // dragging
    if (scope.mode == scope.modes.MOVE && mouseDown) {
      //console.log("dragging");  
      if (scope.activeCorner) {
        scope.activeCorner.move(mouseX, mouseY);
        //console.log("SnapTolerance: " + getSnapTolerance());
        scope.activeCorner.snapToAxis(getSnapTolerance());
      } else if (scope.activeWall) {
        scope.activeWall.relativeMove(
          (rawMouseX - lastX) * cmPerPixel, 
          (rawMouseY - lastY) * cmPerPixel
        );
        scope.activeWall.snapToAxis(getSnapTolerance());
        lastX = rawMouseX;
        lastY = rawMouseY;
      }
      view.draw();
    }

  }

  function oneTouchEndFloorplanner(event) {
    mouseDown = false;
    
    //console.log("[Touchend] numTouches: " + event.touches.length);
    
    // drawing
    if (scope.mode == scope.modes.DRAW && mouseMoved) {
        var corner = floorplan.newCorner(scope.targetX, scope.targetY,undefined,1,toleranceCornerTouch);
        if (scope.lastNode != null) {
          var nWall = floorplan.newWall(scope.lastNode, corner);  
          nWall.setWallHeight(floorplan.getHeightWall());
          //console.log("he creado muro");
        }
        
        if (corner != null && corner.mergeWithIntersected() && scope.lastNode != null) {
          scope.setMode(scope.modes.MOVE);

        } 
        storeHistoryFloorplan(); 
        scope.lastNode = corner;  
    }
    else if (scope.mode == scope.modes.MOVE && !mouseMoved) {
        if (scope.activeWall) {
            scope.clickActivated = true;
            utils.forEach(floorplan.getWalls(), resetColorWall);
            scope.activeWall.color = "#ffff00";
            if (scope.activeWall.ejeX_mayor_ejeY()) {
                $("#idContent_modIzquierda").removeClass("glyphicon-arrow-up");
                $("#idContent_modDerecha").removeClass("glyphicon-arrow-down");
                $("#idContent_modIzquierda").addClass("glyphicon-arrow-left");
                $("#idContent_modDerecha").addClass("glyphicon-arrow-right");
            }
            else {
                $("#idContent_modIzquierda").removeClass("glyphicon-arrow-left");
                $("#idContent_modDerecha").removeClass("glyphicon-arrow-right");
                $("#idContent_modIzquierda").addClass("glyphicon-arrow-up");
                $("#idContent_modDerecha").addClass("glyphicon-arrow-down");
            }
            $("#introducirMedidas").show();
        }
        else {
            scope.clickActivated = false;
            utils.forEach(floorplan.getWalls(), resetColorWall);
            $("#introducirMedidas").hide();
        }
        view.draw();
    }
    else if (scope.mode == scope.modes.MOVE || scope.mode == scope.modes.DELETE) {
        if (scope.mode == scope.modes.DELETE) {
            if (scope.activeCorner) {
                scope.activeCorner.removeAll();
            } else if (scope.activeWall) {
              scope.activeWall.remove();
            } else {
              scope.setMode(scope.modes.MOVE);
            }
            view.draw();
        }
        storeHistoryFloorplan();
    }
  }
  
  function touchend(event) {
    
    console.log("Estoy en touchend (2D)");

    switch ( state ) {
        case STATE.PAN: // one-fingered touch: rotate
            oneTouchEndFloorplanner(event);
            break;
    }    
    
    canvasElement.off("touchmove");
    canvasElement.off("touchend");

    state = STATE.NONE;
  }
  
  function mouseup(event) {
    
    
    
    mouseDown = false;
    
    //console.log("Estoy en mouseup (2D)");
    //console.log("[MouseMove] numTouches: " + event.touches.length);
    
    //console.log("[Mouseup] rawMouse: " + event.clientX + " " + event.clientY);
   
    // drawing
    if (scope.mode == scope.modes.DRAW && (!mouseMoved || enterActivated)) {
        if (!enterActivated) { 
            var corner = floorplan.newCorner(scope.targetX, scope.targetY);
            if (scope.lastNode != null) {
              var nWall = floorplan.newWall(scope.lastNode, corner);  
              nWall.setWallHeight(floorplan.getHeightWall());
              //console.log("he creado muro");
            }
        } else {
            // Si ya tenemos un corner y hemos pulsado enter
            if (scope.lastNode != null) {
                // Nuevo corner a la distancia indicada en lengthLine
                //var d = utils.distance(scope.lastNode.x,scope.lastNode.y,scope.targetX,scope.targetY);
                var dif = parseFloat(lengthLine);
                
                var p = utils.pointDistanceInaLine(scope.targetX,scope.targetY,scope.lastNode.x,scope.lastNode.y,dif);
                var corner = floorplan.newCorner(p.x, p.y);
                var nWall = floorplan.newWall(scope.lastNode, corner);
                nWall.setFixedInteriorDistance(dif);
                nWall.setWallHeight(floorplan.getHeightWall());
            }
            enterActivated = false;
            mouseDown = false;
        }
        lengthLine = "";
        if (corner != null && corner.mergeWithIntersected() && scope.lastNode != null) {
          scope.setMode(scope.modes.MOVE);

        } 
        storeHistoryFloorplan(); 
        scope.lastNode = corner;  
    }
    else if (scope.mode == scope.modes.MOVE && !mouseMoved) {
        if (scope.activeWall) {
            scope.clickActivated = true;
            utils.forEach(floorplan.getWalls(), resetColorWall);
            scope.activeWall.color = "#ffff00";
            if (scope.activeWall.ejeX_mayor_ejeY()) {
                $("#idContent_modIzquierda").removeClass("glyphicon-arrow-up");
                $("#idContent_modDerecha").removeClass("glyphicon-arrow-down");
                $("#idContent_modIzquierda").addClass("glyphicon-arrow-left");
                $("#idContent_modDerecha").addClass("glyphicon-arrow-right");
            }
            else {
                $("#idContent_modIzquierda").removeClass("glyphicon-arrow-left");
                $("#idContent_modDerecha").removeClass("glyphicon-arrow-right");
                $("#idContent_modIzquierda").addClass("glyphicon-arrow-up");
                $("#idContent_modDerecha").addClass("glyphicon-arrow-down");
            }
            $("#introducirMedidas").show();
        }
        else {
            scope.clickActivated = false;
            utils.forEach(floorplan.getWalls(), resetColorWall);
            $("#introducirMedidas").hide();
        }
        view.draw();
    }
    else if (scope.mode == scope.modes.MOVE || scope.mode == scope.modes.DELETE) {
        if (scope.mode == scope.modes.DELETE) {
            view.draw();
        }
         storeHistoryFloorplan();
    }
    
   
  }


  function mouseup2() {
    
    mouseDown = false;
    var old_corner;
    // drawing
    if (scope.mode == scope.modes.DRAW && (!mouseMoved || enterActivated)) {
        if (!enterActivated) { 
            var corner = floorplan.newCorner(scope.targetX, scope.targetY);
            if (scope.lastNode != null) {
                
              var new_corner = utils.perpendicularPointOfaLine(scope.lastNode.x, scope.lastNode.y, corner.getX(),corner.getY(), 5);
              var new_lastNode = utils.perpendicularPointOfaLine(corner.getX(),corner.getY(),scope.lastNode.x, scope.lastNode.y, -5);
              console.log("Voy a crear el muro")
              console.log(corner);
              old_corner = {x:corner.getX(),y:corner.getY()};
              var old_lastNode = {x:scope.lastNode.getX(),y:scope.lastNode.getY()};
              floorplan.addInteriorPoint(old_corner);
              floorplan.addInteriorPoint(old_lastNode);
              
              
              corner.move(new_corner.x,new_corner.y);
              console.log(corner);
              scope.lastNode.move(new_lastNode.x, new_lastNode.y);
              
              
              var nWall = floorplan.newWall(scope.lastNode, corner);  
              nWall.setWallHeight(floorplan.getHeightWall());
              nWall.addInteriorPoint(old_corner);
              nWall.addInteriorPoint(old_lastNode);
              floorplan.mergeWallsWithCommonInteriorPoints(nWall);
              //nWall.enableMergeCorners();
              console.log(corner);
             
              //corner.move(old_corner.x,old_corner.y);
              //scope.lastNode.move(old_lastNode.x, old_lastNode.y);
                 
              
              //console.log("he creado muro");
            }
        } else {
            // Si ya tenemos un corner y hemos pulsado enter
            if (scope.lastNode != null) {
                // Nuevo corner a la distancia indicada en lengthLine
                //var d = utils.distance(scope.lastNode.x,scope.lastNode.y,scope.targetX,scope.targetY);
                var dif = parseFloat(lengthLine);
                
                var p = utils.pointDistanceInaLine(scope.targetX,scope.targetY,scope.lastNode.x,scope.lastNode.y,dif);
                var corner = floorplan.newCorner(p.x, p.y);
                var nWall = floorplan.newWall(scope.lastNode, corner);
                nWall.setFixedInteriorDistance(dif);
                nWall.setWallHeight(floorplan.getHeightWall());
            }
            enterActivated = false;
            mouseDown = false;
        }
        lengthLine = "";
        if (corner != null && corner.mergeWithIntersected() && scope.lastNode != null) {
          scope.setMode(scope.modes.MOVE);

        } 
        storeHistoryFloorplan(); 
        //scope.lastNode = corner; 
        console.log("Voy a asignar a lastNode");
        console.log(scope.lastNode);
        console.log(corner);
        if (scope.lastNode == null) {
            scope.lastNode = corner;  
        } else {
            if (old_corner != null) {
                scope.lastNode = floorplan.newCorner(old_corner.x, old_corner.y, undefined, 0);
            }
        }
    }
    
    else if (scope.mode == scope.modes.MOVE && !mouseMoved) {
        if (scope.activeWall) {
            scope.clickActivated = true;
            utils.forEach(floorplan.getWalls(), resetColorWall);
            scope.activeWall.color = "#ffff00";
            if (scope.activeWall.ejeX_mayor_ejeY()) {
                $("#idContent_modIzquierda").removeClass("glyphicon-arrow-up");
                $("#idContent_modDerecha").removeClass("glyphicon-arrow-down");
                $("#idContent_modIzquierda").addClass("glyphicon-arrow-left");
                $("#idContent_modDerecha").addClass("glyphicon-arrow-right");
            }
            else {
                $("#idContent_modIzquierda").removeClass("glyphicon-arrow-left");
                $("#idContent_modDerecha").removeClass("glyphicon-arrow-right");
                $("#idContent_modIzquierda").addClass("glyphicon-arrow-up");
                $("#idContent_modDerecha").addClass("glyphicon-arrow-down");
            }
            $("#introducirMedidas").show();
        }
        else {
            scope.clickActivated = false;
            utils.forEach(floorplan.getWalls(), resetColorWall);
            $("#introducirMedidas").hide();
        }
        view.draw();
    }
    else if (scope.mode == scope.modes.MOVE || scope.mode == scope.modes.DELETE) {
        if (scope.mode == scope.modes.DELETE) {
            view.draw();
        }
         storeHistoryFloorplan();
    }
   
  }
  
  function resetColorWall(wall) {
      wall.color = "#dddddd";
  }

  function mouseleave() {
     
    mouseDown = false;
    // scope.setMode(scope.modes.MOVE);
  }

  this.reset = function() {
    scope.resizeView();
    scope.setMode(scope.modes.MOVE);
    resetOrigin();
    view.draw();
  }

  this.resizeView = function() {
    view.handleWindowResize();
  }

  this.setMode = function(mode) {
    scope.lastNode = null;
    scope.mode = mode;
    scope.modeResetCallbacks.fire(mode);
    if (mode == scope.modes.DRAW && touchMode) {
        this.comienzaPintar = true;
    }
    updateTarget();
  }

  function resetOrigin() {
    // sets the origin so that floorplan is centered
    var canvasSel = $("#"+canvas);
    var centerX = canvasSel.innerWidth() / 2.0;
    var centerY = canvasSel.innerHeight() / 2.0;
    var centerFloorplan = floorplan.getCenter();
    var s = floorplan.getSize();
    pixelsPerFoot = computePixelPerFoot(s.x, s.z); // s.x es el width y s.z es el height
    
    cmPerPixel = cmPerFoot * (1.0 / pixelsPerFoot);
    pixelsPerCm = 1.0 / cmPerPixel;
    scope.originX = centerFloorplan.x * pixelsPerCm - centerX;
    scope.originY = centerFloorplan.z * pixelsPerCm - centerY;
    
    zoomCommon();
  }
  
  function computePixelPerFoot(w,h) {
      if (h <= 500 && w <= 1000) {
          return pixelsPerFoot_def;
      } else if (h <= 500 && w <= 2000) {
          return -(8/1000)*(w-1000) + pixelsPerFoot_def;
      } else if (h <= 1000 && w <= 2000) {
          var p_h = -(8/500)*(h-500) + pixelsPerFoot_def;
          var p_w = -(8/1000)*(w-1000) + pixelsPerFoot_def;
          return Math.min(p_h,p_w);
      } else if (h > 1000 || w > 2000) {
          // ecuacion de la curva polynómica cuadrada (height) segun los puntos
          // x = [1000 2000 3000 4000]';
          // y = pop = [14 8 5 4]'; Calculado con fit en Matlab
          var p_h = 1.25e-06*h*h - 0.00955*h + pixelsPerFoot_def + 0.25; 
          // ecuacion de la curva polynómica cuadrada (width) segun los puntos
          // x = [2000 3000 4000]';
          // y = pop = [14 10 8]'; Calculado con fit en Matlab
          var p_w = 1e-06*w*w - 0.009*w + pixelsPerFoot_def + 6; 
          return Math.min(p_h,p_w);
      }
  }

  this.convertX = function(x) {
    // convert from THREEjs coords to canvas coords
    return (x - scope.originX * cmPerPixel) * pixelsPerCm;
  }

  this.convertY = function(y) {
    // convert from THREEjs coords to canvas coords
    return (y - scope.originY * cmPerPixel) * pixelsPerCm;
  }
  
  this.convertCm = function(v) {
      return v*pixelsPerCm;
  } 

  init();
}

module.exports = Floorplanner;
