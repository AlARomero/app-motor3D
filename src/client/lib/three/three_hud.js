/*
 * Drawings on "top" of the scene. e.g. rotate arrows
 */
import * as THREE from 'three';

var utils = require('../utils/utils')

var ThreeHUD = function(three, model) {
  var scope = this;
  var three = three;
  var scene = new THREE.Scene();
  //var scene = model.scene;

  var selectedItem = null;
  var hideObject = null;
  
  var rotating = false;
  var mouseover = false;

  var tolerance = 4;
  var touch_tolerance = 10;
  var height = 5;
  var distance = 20;
  var color = "#ffffff";
  var hoverColor = "#f1c40f";

  var activeObject = null;

  this.getTolerance = function() {
      return tolerance;
  }
   
  this.setTolerance = function(tol) {
    tolerance = tol;
  }
  
  this.setTouchTolerance = function() {
    tolerance = touch_tolerance;
  }
    
  this.getScene = function() {
    return scene;
  }

  this.getObject = function() {
    return activeObject;
  }

  function init() {
    three.itemSelectedCallbacks.add(itemSelected);
    three.itemUnselectedCallbacks.add(itemUnselected);
  } 

  function resetSelectedItem() {
    selectedItem = null;
    if (activeObject) {
      scene.remove(activeObject);
      activeObject = null;
    }
  }

  function itemSelected(item) {
    if (selectedItem != item) {
      resetSelectedItem();
      if (item.allowRotate && !item.fixed && !item.arrowHide) {
        selectedItem = item;
        activeObject = makeObject(selectedItem);
        
        scene.add(activeObject);
        //var box = new THREE.BoxHelper( activeObject, 0xffff00 ); scene.add( box );
      }
    }
  }

  function itemUnselected() {
    resetSelectedItem();
  }

  this.setRotating = function(isRotating) {
    rotating = isRotating;
    setColor();
  }

  this.setMouseover = function(isMousedOver) {
    mouseover = isMousedOver;
    setColor();
  }

  this.setVisible = function(hide) {
      
   
      if (hide) {
        hideObject = selectedItem;
        resetSelectedItem();
        console.log("Oculto la felcha!!!");
      }
      else {
        if (hideObject != null) {
           itemSelected(hideObject);
        }
        console.log("Muestro la felcha!!!");
      }
      three.needsUpdate();
  }  

  function setColor() {
    if (activeObject) {
      utils.forEach(activeObject.children, function(obj) {
        obj.material.color.set(getColor());
      });  
      three.needsUpdate();
    }
   
   
  }

  function getColor() {
    return (mouseover || rotating) ? hoverColor : color;
  }

  this.update = function() {
    if (activeObject) {
      activeObject.rotation.y = selectedItem.rotation.y;
      activeObject.position.x = selectedItem.position.x;
      activeObject.position.z = selectedItem.position.z;
      selectedItem.updateHelper();
    }
  }

  function makeLineGeometry(item) {
    /*var geometry = new THREE.Geometry();

    geometry.vertices.push(
      new THREE.Vector3(0, 0, 0),
      rotateVector(item)
    );*/

    // NEW version with THREE.BufferGeometry
    const points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(rotateVector(item));
    
    var geometry = new THREE.BufferGeometry().setFromPoints( points );

    return geometry;
  }

  function rotateVector(item) {
    var nuevo_x = item.halfSize.x;
    if (item.simetria) {
        nuevo_x = - nuevo_x;
    }
    var vec = new THREE.Vector3(0, 0, 
      Math.max(nuevo_x, item.halfSize.z) + 1.4 + distance);
    return vec;
  }

  function makeLineMaterial(rotating) {
    var mat = new THREE.MeshBasicMaterial({ 
      color: getColor(), 
      linewidth: 1
    });
    return mat;
  }

  function makeLine(item) {
    
    var cyl = new THREE.CylinderGeometry(5, 5, 10);
    var mat = new THREE.MeshBasicMaterial({ 
      color: getColor(), 
      
    });
    
    var line = new THREE.Mesh(cyl, mat);
    
    line.position.copy(rotateVector(item));

    line.rotation.x = -Math.PI / 2.0;

    line.renderOrder = 999;
    line.onBeforeRender = function( renderer ) { renderer.clearDepth(); };
    
  }  
  
  function makeCone(item) {
    var coneGeo = new THREE.CylinderGeometry(5, 0, 10);
    var coneMat = new THREE.MeshBasicMaterial({
      color: getColor()
    });
    var cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.copy(rotateVector(item));

    cone.rotation.x = -Math.PI / 2.0;

    /*cone.renderOrder = 999;
    cone.onBeforeRender = function( renderer ) { renderer.clearDepth(); };*/
    
    return cone;
  }

  function makeSphere(item) {
    var geometry = new THREE.SphereGeometry(4, 16, 16); 
    var material = new THREE.MeshBasicMaterial({
      color: getColor()
    });
    var sphere = new THREE.Mesh(geometry, material); 
    //sphere.renderOrder = 999;
    //sphere.onBeforeRender = function( renderer ) { renderer.clearDepth(); };
    
    return sphere;
  }

  function makeObject(item) {
    var object = new THREE.Object3D();
    //var line = new THREE.Line(
    //  makeLineGeometry(item), 
    //  makeLineMaterial(scope.rotating),
    //  THREE.LineSegments);


    var line = new THREE.Line(
      makeLineGeometry(item), makeLineMaterial());
     
    //line.renderOrder = 999;
    //line.onBeforeRender = function( renderer ) { renderer.clearDepth(); };
    
    //var line = makeLine(item)  
    var cone = makeCone(item);
    var sphere = makeSphere(item);
    
    object.add(line);
    object.add(cone);
    object.add(sphere);

    object.rotation.y = item.rotation.y;
    object.position.x = item.position.x;
    object.position.z = item.position.z;
    object.position.y = height;
    
    return object;
  }

  init();
}

module.exports = ThreeHUD;