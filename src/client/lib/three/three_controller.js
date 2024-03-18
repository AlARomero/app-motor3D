var JQUERY = require('jquery');
import * as THREE from 'three';
var utils = require('../utils/utils');

var ThreeController = function(three, model, camera, element, controls, hud) {

  var scope = this;

  this.enabled = true;
  
  //medir distancia
  var sprite1 = null;
  var sprite2 = null;
  var sprCount = 0;

  var three = three;
  var model = model;
  var scene = model.scene;
  var element = element;
  var camera = camera;
  var controls = controls;
  var hud = hud;

  var plane; // ground plane used for intersection testing

  var mouse;
  var intersectedObject;
  
  //MOD Rafa
  var myIntersectedObjects;
  //

  this.itemDraggedCallbacks = JQUERY.Callbacks();

  var mouseoverObject;
  var selectedObject;

  var mouseDown = false;
  var mouseMoved = false; // has mouse moved since down click
  var mouseButton = THREE.MOUSE.LEFT; 
  var rotateMouseOver = false;

  // Touch events
  var pressTime;
  var durationTouch;
  var clickTimer;
  var touchDoubleTap = false;
  
  var states = {
    UNSELECTED: 0, // no object selected
    SELECTED: 1, // selected but inactive
    DRAGGING: 2, // performing an action while mouse depressed
    ROTATING: 3,  // rotating with mouse down
    ROTATING_FREE: 4, // rotating with mouse up
    PANNING: 5
  };
  var state = states.UNSELECTED;

  this.needsUpdate = true;
  this.needsUpdate_afterDragging = false;
  
  function init() {
    element.mousedown( mouseDownEvent );
    element.mouseup( mouseUpEvent );
    element.mousemove( mouseMoveEvent );
    
    // TOUCH
    element.on("touchstart", touchStartEvent );
    element.on("touchmove", touchMoveEvent );
    element.on("touchend", touchEndEvent );
    
    mouse = new THREE.Vector2();

    scene.itemRemovedCallbacks.add(itemRemoved);
    scene.itemLoadedCallbacks.add(itemLoaded);
    setGroundPlane();
  }

  // invoked via callback when item is loaded
  function itemLoaded(item) {
    if (item.metadata.reemplazo) {
        scope.setSelectedObject(item);
        
    } else if (!item.position_set) {
        scope.setSelectedObject(item);
        //console.log("Estoy en itemLoaded " + item.metadata.itemType);
        // Sólo mueve los que no están pegados al suelo
        if (item.metadata.itemType == 2 || item.metadata.itemType == 3 || item.metadata.itemType == 7) {
            switchState(states.DRAGGING);  
            var pos = item.position.clone();
            pos.y = 0;   
            var vec = three.projectVector(pos); 
            clickPressed(vec);
        }
    }
    item.position_set = true;
  }


function clickPressed(vec2) {
    vec2 = vec2 || mouse;
    var intersection = scope.itemIntersection(mouse, selectedObject);
    if (intersection) {
      console.log("faceIndex " + intersection.faceIndex);
      console.log("intersection.object.id " + intersection.object.id);
      
      // MOD.Rafa
      
      if (mouseButton == 2) {
        selectedObject.rightClick = true;
        console.log("Boton derecho pulsado");
      }
      else {
        selectedObject.rightClick = false;
        console.log("Boton izquierdo pulsado");
      }
      
      // MOD.Rafa
      if (selectedObject.qPressed || touchDoubleTap) {
        var objects = updateIntersections2();
        console.log("Num objetos: " + objects.length);
        
        var materials = selectedObject.material;
	
        if (objects) {
            //var idxFace = objects[0].faceIndex;
            //var idxMaterial = selectedObject.geometry.faces[idxFace].materialIndex;
            var mat;
            if (!objects[0].object.isGroup) {
                var idxMaterial = objects[0].face.materialIndex;
                mat = materials[idxMaterial];	
            } else {
                mat = objects[0].mesh.material;
            }

            if (utils.bloqueEncontrado(mat.name,selectedObject.bloques) != -1)  {
                var bloque = utils.getBloque(mat.name,selectedObject.bloques);
                
                var grupo = utils.filtrarGrupo(utils.getGrupoTirador(mat.name),selectedObject.superfluas);
                
                if (grupo != "") {
                    // Array que almacena los indices de los materiales de tiradores
                    var itemsBloque = [];
                    var nombres_itemsBloque = [];

                    var nombres_itemsBloque_unico = [];
                    var itemsBloqueVisibles_unico = []; 
                    
                    for (var i = 0; i < materials.length; i++){
                        var mat = materials[i];
                        if ((mat.name.search(bloque) != -1) && (mat.name.search(grupo) != -1)) {
                            itemsBloque.push(i);
                            var nomItem = selectedObject.getNombreBloque(mat.name, bloque);
                            nombres_itemsBloque.push(nomItem);
                            var esModificable = selectedObject.isGrupoModificable(grupo, bloque, nomItem); 
                            // Si no existe el tirador en la lista de tiradores únicos se añade
                            if (esModificable && (nombres_itemsBloque_unico.indexOf(nomItem) === -1)) {
                                nombres_itemsBloque_unico.push(nomItem);
                                itemsBloqueVisibles_unico.push(mat.visible);
                            }
                            
                        }
                    }
                    
                    console.log("ItemsBloque Detectados: " + itemsBloque.length);
                    console.log("Nombres itemsBloque Detectados: " + nombres_itemsBloque.length);
                    console.log("ItemsBloque Unicos Detectados: " + nombres_itemsBloque_unico.length);

                    if (itemsBloque.length > 0) {
                        console.log("ItemsBloque: " + itemsBloque);
                        console.log("ItemsBloqueVisibles: " + itemsBloqueVisibles_unico);
                        console.log("NombresItemBloque: " + nombres_itemsBloque_unico);

                        var idx = itemsBloqueVisibles_unico.indexOf(true);
                        if (idx != -1) {
                            var idxSig = ((idx + 1) % itemsBloqueVisibles_unico.length);

                            console.log("Indice bloque activo: " + idx);
                            console.log("Indice siguiente: " + idxSig);
                            console.log("Nombre del item de bloque sig: " + nombres_itemsBloque_unico[idxSig]);    
                            // Obtenemos los idxs de los materiales del tirador a activar
                            var idxParaActivar = utils.getIndicesParaActivar(nombres_itemsBloque_unico[idxSig],nombres_itemsBloque,itemsBloque);

                            //console.log("idxParaActivar: " + idxParaActivar);
                            // Ponemos visibles los materiales del tirador a activar
                            for (var i = 0; i < idxParaActivar.length; i++){
                                var mat = materials[idxParaActivar[i]];
                                mat.visible = true;
                                mat.needsUpdate = true;
                                //console.log("idxParaActivar: " + mat.name);
                            }

                            // Ponemos no visible el resto de materiales de tiradores
                            for (var i = 0; i < itemsBloque.length; i++){
                                if (idxParaActivar.indexOf(itemsBloque[i]) == -1) {
                                    var mat = materials[itemsBloque[i]];
                                    mat.visible = false;
                                    mat.needsUpdate = true;	   
                                }
                            }    

                            // Cambiamos el item en el bloque en la selección
                            utils.cambiarValorDesplegableBloque(bloque,nombres_itemsBloque_unico[idxSig],grupo);
                            
                            selectedObject.aplicarRestriccionDependencia(grupo, nombres_itemsBloque_unico[idxSig]);    
                            selectedObject.scene.needsUpdate = true;
                            console.log("La q se ha presionado");
                        }
                    }
                }
                
            }
        }
        touchDoubleTap = false;
    
       
      }
      /////////
      else {
        updateIntersections();
        if (myIntersectedObjects) {
            console.log("intesectedObject.faceIndex: " + myIntersectedObjects[0].faceIndex);
        }
        // MOD Rafa
        //selectedObject.clickPressed(intersection);
        selectedObject.clickPressed(intersection, myIntersectedObjects);
      }
      //
      
    }
  }
  
  function clickDragged(vec2) {
    vec2 = vec2 || mouse;
    var intersection = scope.itemIntersection(mouse, selectedObject);
    if (intersection) {
      if (scope.isRotating()) {
        selectedObject.rotate(intersection);        
      } else {
        selectedObject.clickDragged(intersection);                
      }
    }
  }

  function itemRemoved(item) {
    // invoked as a callback to event in Scene
    if (item === selectedObject) {
      selectedObject.setUnselected();
      selectedObject.mouseOff();  
      scope.setSelectedObject(null);  
    }
  }

  function setGroundPlane() {
    // ground plane used to find intersections
    var size = 10000;
    plane = new THREE.Mesh( 
      new THREE.PlaneGeometry(size, size), 
      new THREE.MeshBasicMaterial());
      
    plane.rotation.x = -Math.PI/2;
    plane.visible = false;
    scene.add(plane);
  }

  function checkWallsAndFloors(event) {

    console.log("en checkWallsAndFloors");
    // double click on a wall or floor brings up texture change modal
    if (state == states.UNSELECTED && mouseoverObject == null) {
      // check walls
      console.log("walls");
      var wallEdgePlanes = model.floorplan.wallEdgePlanes();
      var wallIntersects = scope.getIntersections(
          mouse, wallEdgePlanes, true);
      console.log("wallIntersects " + wallIntersects);
      if (wallIntersects.length > 0) {
        var wall = wallIntersects[0].object.edge;
        three.wallClicked.fire(wall);
        return;
      } 

      // check floors
      
      var floorPlanes = model.floorplan.floorPlanes();
      utils.forEach(floorPlanes, function(plane) {
        plane.visible = true;
      });
      
      var floorIntersects = scope.getIntersections(
          mouse, floorPlanes, false);
  
      utils.forEach(floorPlanes, function(plane) {
        plane.visible = false;
      });
      console.log("floorIntersects " + floorIntersects);
      if (floorIntersects.length > 0) {
        var room = floorIntersects[0].object.room;
        three.floorClicked.fire(room);
        three.updateWindowSize();
        return;
      }

      three.nothingClicked.fire();
    }
  
  }

  function mouseMoveEvent(event) {
    //console.debug("Estoy en mouseMoveEvent (ThreeController)");    
    if (scope.enabled) {
      event.preventDefault();

      mouseMoved = true;
     
      mouse.x = event.clientX;
      mouse.y = event.clientY;

      if (!mouseDown) {
        updateIntersections();        
      }

        switch(state) {
        case states.UNSELECTED:
          updateMouseover();
          break;
        case states.SELECTED:
          updateMouseover();
          break;
        case states.DRAGGING:
          
          //console.log("DRAGGING");
        case states.ROTATING:
        case states.ROTATING_FREE:
          //console.log("ROTTAINT_FREE");
          //console.log(" model.scene.needsUpdate " + model.scene.needsUpdate);
          clickDragged();
          // Parche porque no encontramos donde se pone a true
          model.scene.needsUpdate = false;
          //console.log(" model.scene.needsUpdate " + model.scene.needsUpdate);
          hud.update();
          scope.needsUpdate = true;
          
          //scope.needsUpdate_afterDragging = false;
          break;
      }      
    }
  }

  this.isRotating = function() {
    return (state == states.ROTATING || state == states.ROTATING_FREE);
  }

  function touchMoveEvent( event ) {
      
    console.log("[TouchMove] Num. touches: " + event.touches.length);
    if (scope.enabled) {
      //event.preventDefault();

      mouseMoved = true;
     
     if (!mouseDown) {
        updateIntersections();        
      }
      
      mouse.x = event.touches[ 0 ].pageX;
      mouse.y = event.touches[ 0 ].pageY;

      switch(state) {
        case states.UNSELECTED:
          updateMouseover();
          break;
        case states.SELECTED:
          updateMouseover();
          break;
        case states.DRAGGING:
          
          //console.log("DRAGGING");
        case states.ROTATING:
        case states.ROTATING_FREE:
          //console.log("ROTTAINT_FREE");
          //console.log(" model.scene.needsUpdate " + model.scene.needsUpdate);
          clickDragged();
          // Parche porque no encontramos donde se pone a true
          model.scene.needsUpdate = false;
          //console.log(" model.scene.needsUpdate " + model.scene.needsUpdate);
          hud.update();
          scope.needsUpdate = true;
          
          //scope.needsUpdate_afterDragging = false;
          break;
      }      
    }
  }
  
  function touchEndEvent( event ) {
    if (scope.enabled) {
      mouseDown = false;
      if (!mouseMoved) {
        durationTouch = new Date().getTime() - pressTime;
        console.log("TouchEndEvent:" + durationTouch + "ms");
        if (selectedObject != null && durationTouch > 120) {
            event.preventDefault();
            console.log("Pulsación larga");
            mouseButton = THREE.MOUSE.RIGHT;
            clickPressed();
            mouseButton = THREE.MOUSE.LEFT;
        }
      }
      console.log("Num. touches: " + event.touches.length);
      
      switch(state) {
        case states.DRAGGING:
          selectedObject.clickReleased();
          scope.needsUpdate_afterDragging = true;
          //console.log("mouseUpEvent needsUpdate_afterDragging " + scope.needsUpdate_afterDragging);
          switchState(states.SELECTED);
          break;
        case states.ROTATING:
          if (!mouseMoved) {
            //console.log("mouseUpEvent ROTATING_FREE");
            switchState(states.ROTATING_FREE);
          } else {
              //console.log("mouseUpEvent ROTATING");
              scope.needsUpdate_afterDragging = true;
            switchState(states.SELECTED);
          }
          break;
        case states.UNSELECTED:
          console.log("Unselected " + mouseMoved);  
          if (!mouseMoved) {
            checkWallsAndFloors();
          }
          break;
        case states.SELECTED:
          console.log("selected");
          if (intersectedObject == null && !mouseMoved) {
            switchState(states.UNSELECTED);
            checkWallsAndFloors();
          }
          break;
        case states.ROTATING_FREE:
          break;
      }
    }
  }
  function touchStartEvent( event ) {
      
    console.log("[TouchStart] Num. touches: " + event.touches.length);
    if (scope.enabled) {
        
      if (selectedObject != null) {
        if (clickTimer == null) {
          clickTimer = setTimeout(function () {
              clickTimer = null;
              //alert("single");
              //touchDoubleTap = false;
              //console.log("------- SINGLE");

          }, 300);
        } else {
          clearTimeout(clickTimer);
          clickTimer = null;
          touchDoubleTap = true;
          //console.log("---------- DOUBLE");
        } 
      }
      
      //event.preventDefault();
      pressTime = new Date().getTime();
      
      mouseMoved = false;
      mouseDown = true;   
      
      mouse.x = event.touches[ 0 ].pageX;
      mouse.y = event.touches[ 0 ].pageY;
      
      //if (!mouseDown) {
        updateIntersections();        
      //}
      
       // Mod. Rafa.
      switch (event.button) {
          case 0:  mouseButton = THREE.MOUSE.LEFT; break;
          case 1:  mouseButton = THREE.MOUSE.MIDDLE; break;
          case 2:  mouseButton = THREE.MOUSE.RIGHT; break;
      }
      
      console.log("STATE: " + state); 
      switch(state) {
          
        case states.SELECTED:
          if (rotateMouseOver) {
            console.log("Cambio a ROTATING");  
            switchState(states.ROTATING);
          } else if (intersectedObject != null) {
            scope.setSelectedObject(intersectedObject);
            if (!intersectedObject.fixed) {
              switchState(states.DRAGGING);              
            }
            
          }
          break;
        case states.UNSELECTED:
          if (intersectedObject != null) {
            scope.setSelectedObject(intersectedObject);
            if (!intersectedObject.fixed) {
              switchState(states.DRAGGING);
            }
            
          } 
          break;
        case states.DRAGGING:
        case states.ROTATING:
          //
          break;
        case states.ROTATING_FREE:
            //console.log("mouseDownEvent Cambio a SELECTED");  
            switchState(states.SELECTED);
          break;
      }
    } 
  }
  


  function mouseDownEvent( event ) {
    utils.writeDebug("Estoy en mouseDownEvent (ThreeController)");  
    if (scope.enabled) {
      event.preventDefault();
      mouseMoved = false;
      mouseDown = true;   
      
       // Mod. Rafa.
      switch (event.button) {
          case 0:  mouseButton = THREE.MOUSE.LEFT; break;
          case 1:  mouseButton = THREE.MOUSE.MIDDLE; break;
          case 2:  mouseButton = THREE.MOUSE.RIGHT; break;
      }
      
      // mover objeto a un punto
      if (scene.mover){
    	  var raycaster;
    	  var mouse;
    	  
    	  raycaster = new THREE.Raycaster();
    	  mouse = new THREE.Vector2();
    	  
    	  var viewerInnerWidth = $("#viewer").innerWidth();
    	  var viewerInnerHeight = $("#viewer").innerHeight();
    	  
    	  var topHeight = $("#viewer-header").height();
    	  var leftWidth = $("#side-menu").width();
    	  leftWidth += 33.33333;
    	  
    	  mouse.x = ( (event.clientX - leftWidth) / viewerInnerWidth ) * 2 - 1;
    	  mouse.y = - ( (event.clientY - topHeight) / viewerInnerHeight ) * 2 + 1;
    	  
    	  raycaster.setFromCamera( mouse, camera );

    	  var intersects = raycaster.intersectObjects( scene.getScene().children );

    	  if ( intersects.length > 0 ) {
    		   return ( intersects[ 0 ].point );			   		  
    	  }	else {
    		  return null;
    	  }
      }
      
      // medir distancia entre dos puntos
      if (scene.medir && scene.sprCount > 0){
		  var particleMaterial;
          particleMaterial = new THREE.SpriteMaterial( {
    			color: 0x000000,
    			program: function ( context ) {
    				context.beginPath();
    				context.arc( 0, 0, 0.5, 0, PI2, true );
    				context.fill();
    			}

    		} );
          particleMaterial.name = "hola";
          
    	  var raycaster;
    	  var mouse;
    	  
    	  raycaster = new THREE.Raycaster();
    	  mouse = new THREE.Vector2();
    	  
    	  var viewerInnerWidth = $("#viewer").innerWidth();
    	  var viewerInnerHeight = $("#viewer").innerHeight();
    	  
    	  var topHeight = $("#viewer-header").height();
    	  var leftWidth = $("#side-menu").width();
    	  leftWidth += 33.33333;
    	  
    	  mouse.x = ( (event.clientX - leftWidth) / viewerInnerWidth ) * 2 - 1;
    	  mouse.y = - ( (event.clientY - topHeight) / viewerInnerHeight ) * 2 + 1;
    	  
//        	  console.log("Mouse - x="+mouse.x+", y="+mouse.y)
//        	  console.log("window.innerWidth="+window.innerWidth)
//        	  console.log("window.innerHeight="+window.innerHeight)
//        	  console.log("event.clientX="+event.clientX)
//        	  console.log("event.clientY="+event.clientY)
//        	  console.log("topHeight="+topHeight)
//        	  console.log("leftWidth="+leftWidth)
//        	  console.log(" ");

    	  raycaster.setFromCamera( mouse, camera );

    	  var intersects = raycaster.intersectObjects( scene.getScene().children );

    	  if ( intersects.length > 0 ) {
    		  
//        		  intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
    		  
    		  if (scene.sprCount == 1){
    			  sprite1 = new THREE.Sprite( particleMaterial );
    			  sprite1.position.copy( intersects[ 0 ].point );
    			  sprite1.scale.x =sprite1.scale.y = 1;  
    			  scene.add( sprite1 );
//    			  console.log("S1 -> x="+ sprite1.position.x+", y="+ sprite1.position.y+", z="+ sprite1.position.z);
    			  scene.sprCount+=1;
    			  
    			  $("#measureInfo").val(i18n.t('menuobj.distancia') + " '?'");
    			  
    		  }else if (scene.sprCount == 2){
    			  sprite2 = new THREE.Sprite( particleMaterial );
    			  sprite2.position.copy( intersects[ 0 ].point );
    			  sprite2.scale.x = sprite2.scale.y = 1;  
    			  scene.add( sprite2  );
//    			  console.log("S2 -> x="+sprite2 .position.x+", y="+sprite2 .position.y+", z="+ sprite2.position.z);
    			  
    			  var dx = sprite1.position.x - sprite2.position.x;
    			  var dy = sprite1.position.y - sprite2.position.y;
    			  var dz = sprite1.position.z - sprite2.position.z;

    			  var dis = Math.sqrt( dx * dx + dy * dy + dz * dz );
    			  dis = Math.round(dis * 100.00/100.00)
    				
    			  if (dis > 100){
    				  dis = dis / 100;
//    				  console.log("Distancia = " + dis + " m");
    				  $("#measureInfo").val(i18n.t('menuobj.distancia') + dis + " m");
    			  }else{
//    				  console.log("Distancia = " + dis + " cm");
    				  $("#measureInfo").val(i18n.t('menuobj.distancia') + dis + " cm");
    			  }  
    			  scene.remove(sprite1);
    			  scene.remove(sprite2);
    			  scene.sprCount = 1;		  
    		  }	else {
    			  scene.sprCount+=1;
    		  }  
    	  }	        
      }


      console.log("STATE: " + state);  
      switch(state) {
          
        case states.SELECTED:
          console.debug("[mouseDownEvent (ThreeController)] states.SELECTED");  
          if (rotateMouseOver) {
            console.log("Cambio a ROTATING");  
            switchState(states.ROTATING);
          } else if (intersectedObject != null) {
            scope.setSelectedObject(intersectedObject);
            if (!intersectedObject.fixed) {
              switchState(states.DRAGGING);              
            }
            
          }
          break;
        case states.UNSELECTED:
          console.debug("[mouseDownEvent (ThreeController)] states.UNSELECTED");  
          /*if (intersectedObject != null) {
            scope.setSelectedObject(intersectedObject);
            if (!intersectedObject.fixed) {
              switchState(states.DRAGGING);
            }
            
          }*/
          break;
        case states.DRAGGING:
          console.debug("[mouseDownEvent (ThreeController)] states.DRAGGING");  
        case states.ROTATING:
          console.debug("[mouseDownEvent (ThreeController)] states.ROTATING");  
          //
          break;
        case states.ROTATING_FREE:
            console.debug("[mouseDownEvent (ThreeController)] states.ROTATING_FREE");  
            //console.log("mouseDownEvent Cambio a SELECTED");  
            switchState(states.SELECTED);
          break;
      }
    }    
  }

  function mouseUpEvent( event ) {
    console.debug("Estoy en mouseUpEvent (ThreeController)");  
    if (scope.enabled) {
      mouseDown = false;

      switch(state) {
        case states.DRAGGING:
          scope.itemDraggedCallbacks.fire(selectedObject);
          selectedObject.clickReleased();
          scope.needsUpdate_afterDragging = true;
          //console.log("mouseUpEvent needsUpdate_afterDragging " + scope.needsUpdate_afterDragging);
          switchState(states.SELECTED);
          break;
        case states.ROTATING:
          console.debug("[mouseUpEvent (ThreeController)] states.ROTATING");  
          if (!mouseMoved) {
            //console.log("mouseUpEvent ROTATING_FREE");
            switchState(states.ROTATING_FREE);
          } else {
              //console.log("mouseUpEvent ROTATING");
              scope.needsUpdate_afterDragging = true;
              switchState(states.SELECTED);
          }
          break;
        case states.UNSELECTED:
          console.debug("[mouseUpEvent (ThreeController)] states.UNSELECTED " + mouseMoved);  
          if (!mouseMoved) {
            if (intersectedObject != null) {
                scope.setSelectedObject(intersectedObject);
                if (!intersectedObject.fixed) {
                  switchState(states.SELECTED);
                }
            } else {
                checkWallsAndFloors();
            }
          }
          break;
        case states.SELECTED:
          console.debug("[mouseUpEvent (ThreeController)] states.SELECTED " + mouseMoved);  
          if (intersectedObject == null && !mouseMoved) {
            switchState(states.UNSELECTED);
            checkWallsAndFloors();
          }
          break;
        case states.ROTATING_FREE:
          console.debug("[mouseUpEvent (ThreeController)] states.ROTATING_FREE");  
          break;
      }
    }
  }

  function switchState( newState ) {
    if (newState != state) {
      onExit(state);
      onEntry(newState);
    }
    state = newState;
    hud.setRotating(scope.isRotating());
  }

  function onEntry(state) {
    console.log("en OnEntry " + state);  
    switch(state) {
      case states.UNSELECTED:
        scope.setSelectedObject( null );
      case states.SELECTED:
        controls.enabled = true;
        break;
      case states.ROTATING:
      case states.ROTATING_FREE:
        controls.enabled = false;
        break;
      case states.DRAGGING:
        three.setCursorStyle("move");
        clickPressed();
        controls.enabled = false;
        break;
    }
  }

  function onExit(state) {
    console.log("en OnExit " + state); 
    switch(state) {
      case states.UNSELECTED:
      case states.SELECTED:
        break;
      case states.DRAGGING:
        if (mouseoverObject) {
          three.setCursorStyle("pointer");
        } else {
          three.setCursorStyle("auto");
        }
        break;
      case states.ROTATING:
      case states.ROTATING_FREE:
        break;
    }
  }

  this.selectedObject = function() {
    return selectedObject;
  }

  // updates the vector of the intersection with the plane of a given
  // mouse position, and the intersected object
  // both may be set to null if no intersection found
  function updateIntersections() {

    // check the rotate arrow
    var hudObject = hud.getObject();
    if (hudObject != null) {
      //console.log("HUD Tolerance: " + hud.getTolerance());  
      var hudIntersects = scope.getIntersections(
        mouse,
        hudObject,
        false, false, true,hud.getTolerance());
      if (hudIntersects.length > 0) {
        rotateMouseOver = true;
        hud.setMouseover(true);
        intersectedObject = null;
        return;
      } 
    }
    rotateMouseOver = false;
    hud.setMouseover(false);

    // check objects
    var items = model.scene.getItems();
    /*
	 * items = utils.removeIf(items, function(item) { var remove = item.fixed &&
	 * !three.options().canMoveFixedItems; //alert("remove!"); return remove;
	 * });
	 */
    //console.log("Vengo de updateIntersections");
    var intersects = scope.getIntersections(
      mouse, 
      items,
      false, true, true, 20, true);

    if (intersects.length > 0) {
        
      intersects = filtrarPorGrupos(intersects);  
      intersectedObject = intersects[0].object;
      //MOD Rafa. Guardamos toda informacion de la interseccion
      myIntersectedObjects = intersects;
      //console.log("[updateIntersections] intesectedObject.faceIndex: " + intersectedObject.faceIndex);

    } else {
      intersectedObject = null;
    }
  }

function filtrarPorGrupos(intersections) {
    if (intersections.length > 0) {
         for (var i = 0; i < intersections.length; i++){
             if (intersections[i].object.parent.isGroup) {
                 intersections[i].mesh = intersections[i].object.clone();
                 intersections[i].object = buscarItemGroup(intersections[i].object.parent);
                 
             }
         }
    }
    return intersections;
}

function buscarItemGroup(itemGroup) {
    
    let items = scene.getItems();
    for (var i = 0; i < items.length; i++){
        if (items[i].isGroup) {
            if (items[i].children === itemGroup.children) {
                return items[i];
            }
        }
    } 
    return itemGroup;
    
}


 function updateIntersections2() {

    // check the rotate arrow
    var hudObject = hud.getObject();
    if (hudObject != null) {
      var hudIntersects = scope.getIntersections(
        mouse,
        hudObject,
        false, false, true,2);
      if (hudIntersects.length > 0) {
        rotateMouseOver = true;
        hud.setMouseover(true);
        intersectedObject = null;
        return;
      } 
    }
    rotateMouseOver = false;
    hud.setMouseover(false);

    // check objects
    var items = model.scene.getItems();
    /*
	 * items = utils.removeIf(items, function(item) { var remove = item.fixed &&
	 * !three.options().canMoveFixedItems; //alert("remove!"); return remove;
	 * });
	 */
    console.log("Numero de items: " + items.length);
 
    var intersects = scope.getIntersections(
      mouse, 
      items,
      false, true, true, 20, true);

    if (intersects.length > 0) {
      intersects = filtrarPorGrupos(intersects);  
    }  
    return intersects;
    
  }
  // sets coords to -1 to 1
  function normalizeVector2(vec2) {
     var retVec = new THREE.Vector2();
     retVec.x = ((vec2.x - three.widthMargin) / (window.innerWidth - three.widthMargin)) * 2 - 1;
     retVec.y = -((vec2.y - three.heightMargin) / (window.innerHeight - three.heightMargin)) * 2 + 1;
     return retVec;
  }

  //
  function mouseToVec3(vec2) {
    var normVec2 = normalizeVector2(vec2)
    var vector = new THREE.Vector3(
      normVec2.x, normVec2.y, 0.5);
    vector.unproject(camera);
    return vector;
  }

  // returns the first intersection object
  this.itemIntersection = function(vec2, item) {
    var customIntersections;
    if (item != null) {
        customIntersections = item.customIntersectionPlanes();
    } else {
        customIntersections = [];
    } 
    var intersections = null;
    if (customIntersections && customIntersections.length > 0) {
      intersections = this.getIntersections(vec2, customIntersections, true);
    } else {
      plane.visible = true;
      intersections = this.getIntersections(vec2, plane);
      plane.visible = false;
    }
    if (intersections.length > 0) {
        return intersections[0];
    } else {
        return null;
    }
  }
  
  
  

  // filter by normals will only return objects facing the camera
  // objects can be an array of objects or a single object
  this.getIntersections = function(vec2, objects, filterByNormals, onlyVisible, recursive, linePrecision, onlyMaterialVisible ) {

    var vector = mouseToVec3(vec2);

    onlyVisible = onlyVisible || false;
    filterByNormals = filterByNormals || false;
    recursive = recursive || false;
    linePrecision = linePrecision || 20;
    onlyMaterialVisible = onlyMaterialVisible || false;


    var direction = vector.sub( camera.position ).normalize();
    var raycaster = new THREE.Raycaster(
        camera.position,
        direction);
    raycaster.linePrecision = linePrecision;
    var intersections;
    if (objects instanceof Array){
      intersections = raycaster.intersectObjects(objects, recursive);
    } else {
      intersections = raycaster.intersectObject(objects, recursive);
    }
    // filter by visible, if true
    //console.log("onlyVisible: " + onlyVisible);
    if (onlyVisible) {
      intersections = utils.removeIf(intersections, function(intersection) {
        return !intersection.object.visible;
      });
    }

    // filter by normals, if true
    if (filterByNormals) {
      intersections = utils.removeIf(intersections, function(intersection) {
        var dot = intersection.face.normal.dot(direction);
        return (dot > 0)
      });
    } 
    
    if (onlyMaterialVisible) {
      //console.log("onlyMaterialVisible: " + onlyMaterialVisible);
      intersections = utils.removeIf(intersections, function(intersection) {
          //var idxFace = intersection.faceIndex;
          //var idxMaterial = intersection.object.geometry.faces[idxFace].materialIndex;
          var idxMaterial = intersection.face.materialIndex;
          var mat;
          if (Array.isArray(intersection.object.material)) {
              mat = intersection.object.material[idxMaterial];
          } else {
              mat = intersection.object.material;
          }
          return !mat.visible;
          //console.log(intersects[i].distance + " " + intersects[i].object.metadata.itemName + " " + mat.name + " " + mat.visible);
      });
    }
    
    
    //MOD Rafa. Sirve para mostrar las intersecciones
    //console.log("[getIntersections] Num. intersections: " + intersections.length);
    //if (intersections.length > 0) {
    //    console.log("[getIntersections] FaceIndex: " + intersections[0].faceIndex);
    //}
    
    return intersections;
  }

  // manage the selected object
  this.setSelectedObject = function( object ) {
    if (state === states.UNSELECTED) {
      switchState(states.SELECTED);
    }
    if ( selectedObject != null ) {
      selectedObject.setUnselected();
    }
    if ( object != null ) {
      selectedObject = object;
      selectedObject.setSelected();
      three.itemSelectedCallbacks.fire(object);
    } else {
      selectedObject = null;
      three.itemUnselectedCallbacks.fire();
    }
    //console.log("setSelectedObject " + this.needsUpdate);
    this.needsUpdate = true;
  }

  // TODO: there MUST be simpler logic for expressing this
  function updateMouseover() {
    if ( intersectedObject != null ) {
      if ( mouseoverObject != null ) {
        if ( mouseoverObject !== intersectedObject ) {
          mouseoverObject.mouseOff();
          mouseoverObject = intersectedObject;
          mouseoverObject.mouseOver();
          scope.needsUpdate = true;
        } else {
          // do nothing, mouseover already set
        }
      } else {
        mouseoverObject = intersectedObject;
        mouseoverObject.mouseOver();
        three.setCursorStyle("pointer");
        scope.needsUpdate = true;
      }
    } else if (mouseoverObject != null) {
      mouseoverObject.mouseOff();
      if (!scene.medir)
    	  three.setCursorStyle("auto");
      else
    	  three.setCursorStyle("crosshair");
      mouseoverObject = null;
      scope.needsUpdate = true;
    }
  }

  init();
}

module.exports = ThreeController;