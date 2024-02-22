var JQUERY = require('jquery');
var utils = require('../utils/utils')

// start and end are Corner objects
var Wall = function(start, end) {

  this.id = getUuid();

  var scope = this;
  
  var start = start;
  var end = end;
  
  // MOD Rafa. Definimos una variable para el color del muro cuando se seleccione
  var color = null;  
  
  this.thickness = 10;
  this.height = 270;

  // front is the plane from start to end
  // these are of type HalfEdge
  this.frontEdge = null;
  this.backEdge = null;
  this.orphan = false;

  var fixedInteriorDistance = -1;
  
  var interiorPoints = [];
  
  // items attached to this wall
  this.items = [];
  this.onItems = [];

  var moved_callbacks = JQUERY.Callbacks();
  var deleted_callbacks = JQUERY.Callbacks();
  var action_callbacks = JQUERY.Callbacks();

  var defaultTexture =  {
    url: "assets/img/wallmap.png",
    stretch: true,
    scale: 0
  }
  this.frontTexture = defaultTexture;
  this.backTexture = defaultTexture;

  start.attachStart(this)
  end.attachEnd(this);

  function getUuid() {
    return [start.id, end.id].join();
  }

  this.addInteriorPoint = function(p) {
      interiorPoints.push(p);
  }
  this.getInteriorPoints = function() {
      return interiorPoints;
  }
  
  
  this.enableMergeCorners = function() {
      start.enableMerge();
      end.enabledMerge();
  }
  
  this.resetFrontBack = function(func) {
    this.frontEdge = null;
    this.backEdge = null; 
    this.orphan = false;
  }

  this.snapToAxis = function(tolerance) {
    // order here is important, but unfortunately arbitrary
    start.snapToAxis(tolerance);
    end.snapToAxis(tolerance);
  }

  this.setFixedInteriorDistance = function(value) {
    fixedInteriorDistance = value;
  }
  this.getFixedInteriorDistance = function() {
    return fixedInteriorDistance;
  }

  this.fireOnMove = function(func) {
    moved_callbacks.add(func);
  }

  this.fireOnDelete = function(func) {
    deleted_callbacks.add(func);
  }

  this.dontFireOnDelete = function(func) {
    deleted_callbacks.remove(func);
  }

  this.fireOnAction = function(func) {
    action_callbacks.add(func)
  }

  this.fireAction = function(action) {
    action_callbacks.fire(action)
  }

  this.getStart = function() {
    return start;
  }

  this.relativeMove = function(dx, dy) {
    start.relativeMove(dx, dy);
    end.relativeMove(dx, dy);
  }

  this.fireMoved = function() {
    moved_callbacks.fire();
  }

  this.fireRedraw = function() {
    if (scope.frontEdge) {
      scope.frontEdge.redrawCallbacks.fire();
    }
    if (scope.backEdge) {
      scope.backEdge.redrawCallbacks.fire();
    }
  }

  this.getEnd = function() {
    return end;
  }

  this.getHeight = function() {
    return this.height;
  }
  
  this.getStartX = function() {
    return start.getX();
  }

  this.getEndX = function() {
    return end.getX();
  }

  this.getStartY = function() {
    return start.getY();
  }

  this.getEndY = function() {
    return end.getY();
  }

  this.remove = function() {
    start.detachWall(this);
    end.detachWall(this);
    deleted_callbacks.fire(this);
  }

  this.setStart = function(corner) {
    start.detachWall(this);
    corner.attachStart(this);
    start = corner;
    this.fireMoved();
  }

  this.setEnd = function(corner) {
    end.detachWall(this);
    corner.attachEnd(this);
    end = corner;
    this.fireMoved();
  }

  this.setWallHeight = function(height) {
    this.height = height;
    this.fireMoved();
  }
  
  this.distanceFrom = function(x, y) {
    return utils.pointDistanceFromLine(x, y, 
      this.getStartX(), this.getStartY(), 
      this.getEndX(), this.getEndY());
  }
  
  this.getClosestCorner = function(p) {
      
      var d_start = this.getStart().distanceFrom(p.x,p.y);
      var d_end = this.getEnd().distanceFrom(p.x,p.y);
      if (d_start <= d_end) {
          return this.getStart();
      } else {
          return this.getEnd();
      }
  }
  
  this.matchedInteriorPoints = function(points) {
      var common = [];
      
      for (var i=0; i < points.length; i++) {
        for (var j=0; j < interiorPoints.length; j++) {
            if ((interiorPoints[j].x == points[i].x) && (interiorPoints[j].y == points[i].y)) {
                common.push(points[i]);
            }
        }
      }
      return common;
      
  }
         

  this.perpendicularDistanceFrom = function(x, y) {
    var point = utils.closestPointOnLine(x, y, 
      this.getStartX(), this.getStartY(), 
      this.getEndX(), this.getEndY());
    
    if (utils.checkOrthogonalLines(point.x, point.y, x,y,this.getStartX(), this.getStartY(), 
      this.getEndX(), this.getEndY())) {
        return utils.pointDistanceFromLine(x, y, 
            this.getStartX(), this.getStartY(), 
            this.getEndX(), this.getEndY());
    } else {
        return Infinity;
    }
  }

  
  

  // return the corner opposite of the one provided
  this.oppositeCorner = function( corner ) {
    if ( start === corner ) {
      return end;
    } else if ( end === corner ) {
      return start;
    } else {
      console.log('Wall does not connect to corner');
    }
  }
  
  // MOD Rafa. Obtenemos el valor de y a partir del x de la recta
  this.getYfromX = function(x) {
      var coef = (x - this.getStartX()) / (this.getEndX() - this.getStartX());
      return (this.getEndY() - this.getStartY())*coef + this.getStartY();
  }

  // MOD Rafa. Obtenemos el valor de x a partir del y de la recta
  this.getXfromY = function(y) {
      var coef = (y - this.getStartY()) / (this.getEndY() - this.getStartY());
      return (this.getEndX() - this.getStartX())*coef + this.getStartX();
  }
  
  this.moveStartCorner = function(desplz) {
      this.moveCorner(this.getStart(),desplz,Math.sign(desplz)*(-0.05));
  }
  
  this.moveEndCorner = function(desplz) {
      this.moveCorner(this.getEnd(),desplz,Math.sign(desplz)*(-0.05));
  }
  
  this.moveLeftCorner = function(desplz) {
      var corner = this.getLeftCorner();
       this.moveCorner(corner,desplz,Math.sign(desplz)*(-0.05));
  }
  
  this.ejeX_mayor_ejeY = function() {
      var difX = Math.abs(this.getStartX() - this.getEndX());
      var difY = Math.abs(this.getStartY() - this.getEndY());
      if (difX >= difY) {
          return true;
      }
      else return false;
  }

  this.moveRightCorner = function(desplz) {
      var corner = this.getRightCorner();
      this.moveCorner(corner,desplz,Math.sign(desplz)*0.05);
     
   
  }
  
this.distanciaParcial = function() {
    var partialLen;
    if (this.backEdge) {
        partialLen = Math.round(this.backEdge.interiorDistance()*1000)/1000;
    } else if (this.frontEdge) {
        partialLen = Math.round(this.frontEdge.interiorDistance()*1000)/1000;
    } else {
        partialLen = Math.round(utils.distance(this.getStartX(),this.getStartY(),this.getEndX(),this.getEndY())*1000)/1000;
    }
    return partialLen;
  }

  this.distanciaEje = function() {
    return utils.distance(this.getStartX(),this.getStartY(),this.getEndX(),this.getEndY());
  }  
  
  this.moveCorner = function(corner, desplz, step) {
    if (Math.abs(desplz) >  Math.abs(step)) {
      var difX = Math.abs(this.getStartX() - this.getEndX());
      var difY = Math.abs(this.getStartY() - this.getEndY());
      var x; 
      var y;
      var partialLen = this.distanciaParcial();
      //console.log("Longitud inicial: " + partialLen);
      var finalLen = (Math.round((partialLen + desplz)*100)/100).toFixed(1); 
      
      
      //console.log("Longitud final requerida: " + finalLen);
      if (difX >= difY) {
        //var x = corner.getX(); 
        var ori_x = corner.getX();
        var ori_y = this.getYfromX(ori_x);
        
        var x1 = ori_x + desplz; 
        var y1 = ori_y;
        corner.move(x1,y1);
        partialLen = this.distanciaParcial();
        var queda1 = Math.abs(finalLen - partialLen);
        //console.log("Primer mov1: " + partialLen + " " + finalLen);
        corner.move(ori_x,ori_y);
        var x2 = ori_x - desplz; 
        var y2 = ori_y;
        corner.move(x2,y2);
        partialLen = this.distanciaParcial();
        var queda2 = Math.abs(finalLen - partialLen);
        //console.log("Primer mov2: " + partialLen + " " + finalLen);
        if (queda1 < queda2) {
            corner.move(x1,y1);
            partialLen = this.distanciaParcial();
            x = x1;
            y = y1;
        } else {
            x = x2;
            y = y2;
        }
          
        //console.log("Primer mov: " + partialLen + " " + finalLen);
        cont = 1;
        var queda = finalLen - partialLen;
        var sigQueda;
        while (Math.abs(queda) > 0.05) {
            x = x + step;
            y = this.getYfromX(x);
            corner.move(x,y);
            partialLen = this.distanciaParcial();
            cont = cont + 1;
            sigQueda = Math.abs(finalLen - partialLen);
            if (sigQueda > queda) {
                step = - step;
            }
            queda = sigQueda;
            //console.log(cont + " " + partialLen + " " + finalLen);
        }
      }
      else {
        //var y = corner.getY(); 
        
        var ori_y = corner.getY(); 
        var ori_x = this.getXfromY(ori_y);
        
        var y1 = ori_y + desplz; 
        var x1 = ori_x;
        corner.move(x1,y1);
        partialLen = this.distanciaParcial();
        var queda1 = Math.abs(finalLen - partialLen);
        //console.log("Primer mov1: " + partialLen + " " + finalLen);
        corner.move(ori_x,ori_y);
        var y2 = ori_y - desplz; 
        var x2 = ori_x;
        corner.move(x2,y2);
        partialLen = this.distanciaParcial();
        var queda2 = Math.abs(finalLen - partialLen);
        //console.log("Primer mov2: " + partialLen + " " + finalLen);
        
        if (queda1 < queda2) {
            corner.move(x1,y1);
            partialLen = this.distanciaParcial();
            x = x1;
            y = y1;
        } else {
            x = x2;
            y = y2;
        }
        
        //console.log("Primer mov: " + partialLen + " " + finalLen);
        cont = 1;
        var queda = finalLen - partialLen;
        var sigQueda;
        while (Math.abs(queda) > 0.05) {
            y = y + step;
            x = this.getXfromY(y);
            corner.move(x,y);
            partialLen = this.distanciaParcial();
            cont = cont + 1;
            sigQueda = Math.abs(finalLen - partialLen);
            if (sigQueda > queda) {
                step = - step;
            }
            queda = sigQueda;
            //console.log(cont + " " + partialLen + " " + finalLen);
        } 
      }
    }
      
      //console.log(partialLen);
  }
  
  this.getLeftCorner = function() {
      var difX = Math.abs(this.getStartX() - this.getEndX());
      var difY = Math.abs(this.getStartY() - this.getEndY());
      if (difX >= difY) {

        if (this.getStartX() > this.getEndX()) {
            return this.getEnd();
        }
        else if (this.getStartX() < this.getEndX()) {
            return this.getStart();
        }
        else {
            // Si su x es igual elegimos el superior como el izq
            if (this.getStartY() > this.getEndY()) {
                return this.getEnd();
            }
            else {
                return this.getStart();
            }
        }
      }
      else {
          // Si su x es igual elegimos el superior como el izq
        if (this.getStartY() > this.getEndY()) {
            return this.getEnd();
        }
        else {
            return this.getStart();
        }
      }
  }
  
  this.getRightCorner = function() {
      var difX = Math.abs(this.getStartX() - this.getEndX());
      var difY = Math.abs(this.getStartY() - this.getEndY());
      if (difX >= difY) {
        if (this.getStartX() < this.getEndX()) {
            return this.getEnd();
        }
        else if (this.getStartX() > this.getEndX()) {
            return this.getStart();
        }
        else {
            // Si su x es igual elegimos el inferior como el izq
            if (this.getStartY() < this.getEndY()) {
                return this.getEnd();
            }
            else {
                return this.getStart();
            }
        }
      }
      else {
          if (this.getStartY() < this.getEndY()) {
                return this.getEnd();
          }
          else {
                return this.getStart();
          }
      }
  }
   


                        


}

module.exports = Wall;