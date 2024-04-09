var JQUERY = require('jquery');
var utils = require('../utils/utils');
var Wall = require('../model/wall');
var Corner = require('../model/corner');
import * as THREE from 'three';

var FloorplannerView = function(floorplan, viewmodel, canvas, scene) {

  var scope = this;
  var floorplan = floorplan;
  var scene = scene;
  var viewmodel = viewmodel;
  var canvas = canvas;
  var canvasElement = document.getElementById(canvas);
  var context = canvasElement.getContext('2d');


  // grid parameters
  var gridSpacing = 20; // pixels
  var gridWidth = 1;
  var gridColor = "#f1f1f1";

  // room config
  var roomColor = "#f9f9f9";

  // wall config
  var wallWidth = 7;
  var wallWidthHover = 9;
  //var wallColor = "#dddddd";
  var wallColor = "#cccccc";
  var wallColorHover = "#008cba";
  var edgeColor = "#888888";
  var edgeColorHover = "#008cba";
  var edgeWidth = 1;

  var deleteColor = "#ff0000";
  var modifyColor = "#ffff00";
  
  // corner config
  var cornerRadius = 0;
  var cornerRadiusHover = 7;
  var cornerColor = "#cccccc";
  //var cornerColor = "#b2b2b2";
  var cornerColorHover = "#008cba";

  // cotas config  
  var doorColor = "#FFFFFF"; 
  var itemColor = "rgba(212, 212, 212, 0.3)";  
  
  var dMinMuro = 5; // distancia mínima al muro para considerarlo pegado
  var lineasOutsideMuros = [];
  
  function init() {
    JQUERY(window).on('resize', scope.handleWindowResize);
    scope.handleWindowResize();
  }

  this.handleWindowResize = function() {
    var canvasSel = JQUERY("#"+canvas);
    var parent = canvasSel.parent();
    canvasSel.height(parent.innerHeight());
    canvasSel.width(parent.innerWidth());
    canvasElement.height = parent.innerHeight();
    canvasElement.width = parent.innerWidth(); 
    scope.draw();
  }

  this.draw = function() {
      
    //console.log("Estoy en draw");  
    context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    drawGrid();
    drawSkyBoxLines();
    lineasOutsideMuros = [];
    utils.forEach(floorplan.getRooms(), drawRoom);
    utils.forEach(floorplan.getWalls(), drawWall);
    utils.forEach(floorplan.getCorners(), drawCorner);
    if (viewmodel.mode == viewmodel.modes.DRAW && !viewmodel.comienzaPintar) {
      //console.log("DrawTarget: " + viewmodel.targetX + " " + viewmodel.targetY);
      //console.log(viewmodel.lastNode);
      drawTarget(viewmodel.targetX, viewmodel.targetY, viewmodel.lastNode);
      //drawTarget2(viewmodel.targetX, viewmodel.targetY, viewmodel.lastNode);
    }
    //utils.forEach(floorplan.getInteriorPoints(), drawInteriorPoint);
   
    //utils.forEach(floorplan.getCorners(), drawDebugCorner);
    //utils.forEach(scene.getItems(), drawItem);
    //utils.forEach(scene.getItems(), drawAuxiliarLines);
    
    //console.log("lineasOutsideMuros");
    //console.log(lineasOutsideMuros);
    //drawExteriorLines();
    utils.forEach(floorplan.getWalls(), drawWallLabels);
    
  }
  function drawInteriorPoint(p) {
      drawCircle(
          viewmodel.convertX(p.x), 
          viewmodel.convertY(p.y), 
          3, 
          "green"
      );
      
  }
  function drawDebugCorner(corner) {
    drawCircle(
      viewmodel.convertX(corner.x), 
      viewmodel.convertY(corner.y), 
      3, 
      "red"
    );
  }


  function drawExteriorLines() {
     var realWalls = floorplan.getWalls();
     for (var i=0; i < realWalls.length; i++) {
         var w = realWalls[i];
         var lineasMuro_i = lineasOutsideMuros.filter(
              function(value, index, arr){ 
                  return value.muro == i;
              });
         if (lineasMuro_i.length > 0) {
             
            var points = [];
            for (var j=0; j < lineasMuro_i.length; j++) {
                var p1 = {
                    x: lineasMuro_i[j].x1,
                    y: lineasMuro_i[j].y1
                }
                var p2 = {
                    x: lineasMuro_i[j].x2,
                    y: lineasMuro_i[j].y2
                }
                points.push(p1);
                points.push(p2);
            }
            var p1 = {
                x: w.getStartX(),
                y: w.getStartY()
            }
            var p2 = {
                x: w.getEndX(),
                y: w.getEndY()
            }
            
            var p = utils.pointDistanceInaLine(p1.x,p1.y,p2.x,p2.y,w.thickness/2);
            p2 = p;
            var p = utils.pointDistanceInaLine(p2.x,p2.y,p1.x,p1.y,w.thickness/2);
            p1 = p;
            
            points.push(p1);
            points.push(p2);
            points = utils.removeDuplicates2(points);
            drawConsecutiveLines(points,p1,0);
            drawWallLabels2(w,1); 
            
         } else {
            drawWallLabels2(w,0); 
            
         }
     }
  }  
  
  function drawConsecutiveLines(points, ref, nivel) {
      //console.log("drawConsecutiveLines");
      //console.log(points);
      //console.log(ref);
      var step = 15;
      var desp1 = -5;
      var desp2 = -30 - (nivel*step);
      var sPoints = utils.sortPointsByRef(points,ref);
      for (var i=0; i < sPoints.length-1; i++) {
          var x1 = sPoints[i].x;
          var y1 = sPoints[i].y;
          var x2 = sPoints[i+1].x;
          var y2 = sPoints[i+1].y;
          var d = utils.distance(x1, y1, x2, y2);
          //if (d >= 10) {
            x1 = viewmodel.convertX(x1);
            y1 = viewmodel.convertY(y1);
            x2 = viewmodel.convertX(x2);
            y2 = viewmodel.convertY(y2);

            //drawCircle(x1,y1,1,"#FF0000");
            //drawCircle(x2,y2,1,"#FF0000");
          
            var l = getParallelLine(x1,y1,x2,y2,viewmodel.convertCm(desp2));
            drawInteriorLine(l.x1,l.y1,l.x2,l.y2,d,viewmodel.convertCm(desp1),viewmodel.convertCm(desp2+5));
          //}
      }
      //console.log(sPoints);
  }
  
  function drawWallLabels2(w, nivel) {
      var d = w.distanciaParcial();
      var step = 30;
      var desp1 = -5;
      var desp2 = -30;
      var desp_paralela = -30 - (nivel*step);
      
      var x1 = viewmodel.convertX(w.getStartX());
      var y1 = viewmodel.convertY(w.getStartY());
      var x2 = viewmodel.convertX(w.getEndX());
      var y2 = viewmodel.convertY(w.getEndY());
      
      var p = utils.pointDistanceInaLine(x1,y1,x2,y2,viewmodel.convertCm(w.thickness/2));
        x2 = p.x;
        y2 = p.y;
      var p = utils.pointDistanceInaLine(x2,y2,x1,y1,viewmodel.convertCm(w.thickness/2));
      x1 = p.x;
      y1 = p.y;
      var l = getParallelLine(x1,y1,x2,y2,viewmodel.convertCm(desp_paralela));
      drawInteriorLine(l.x1,l.y1,l.x2,l.y2,d,viewmodel.convertCm(desp1),viewmodel.convertCm(desp2+w.thickness/2),16);
  }

  function drawWallLabels(wall) {
    // we'll just draw the shorter label... idk
    if (wall.backEdge && wall.frontEdge) {
      if (wall.backEdge.interiorDistance < wall.frontEdge.interiorDistance) {
        drawEdgeLabel(wall.backEdge);
      } else {
        drawEdgeLabel(wall.frontEdge);
      }
    } else if (wall.backEdge) {
      drawEdgeLabel(wall.backEdge);
    } else if (wall.frontEdge) {
      drawEdgeLabel(wall.frontEdge);
    }
  }

  function drawWall(wall) {
    var hover = (wall === viewmodel.activeWall);
    var color = wallColor;
    if (hover && viewmodel.mode == viewmodel.modes.DELETE) {
      color = deleteColor;
    } else if (viewmodel.mode == viewmodel.modes.MOVE && viewmodel.clickActivated) {
        if (wall.color) {
            color = wall.color;
        }
        
    } else if (hover) {
      color = wallColorHover;
    } 
    drawLine(
      viewmodel.convertX(wall.getStartX()),
      viewmodel.convertY(wall.getStartY()),
      viewmodel.convertX(wall.getEndX()),
      viewmodel.convertY(wall.getEndY()),
      hover ? viewmodel.convertCm(wallWidthHover) : viewmodel.convertCm(wallWidth),
      color
    );
    if (!hover && wall.frontEdge) {
      drawEdge(wall.frontEdge, hover);
    }
    if (!hover && wall.backEdge) {
      drawEdge(wall.backEdge, hover);
    }
  }

  function cmToFeet(cm,texto) {
      texto = texto || " cm";
    /*
     * var realFeet = ((cm*0.393700) / 12); var feet = Math.floor(realFeet); var
     * inches = Math.round((realFeet - feet) * 12); return feet + "'" + inches +
     * '"';
     */

    //var meters = Math.round(cm) / 100;
    var meters = Math.round(cm * 10)/10;
    return meters + " " + texto.trim();
    
  }

  function drawText(pos, length) {
        context.font = "normal 10px Arial";
      context.fillStyle = "#000000";
      context.textBaseline = "middle";
      context.textAlign = "center";
      context.strokeStyle = "#ffffff";
      context.lineWidth  = 3;

      context.strokeText(cmToFeet(length," "), 
        viewmodel.convertX(pos.x), 
        viewmodel.convertY(pos.y));
      context.fillText(cmToFeet(length," "), 
        viewmodel.convertX(pos.x), 
        viewmodel.convertY(pos.y));
  }

  function drawTextTarget(x1,y1,x2,y2) {
    
    var d = utils.distance(x1,y1,x2,y2);
    //console.log("Distance: " + d); 
    if (d < 10) {
      // dont draw labels on walls this short
      return;
    }
    var x = (x1 + x2)/2;
    var y = (y1 + y2)/2;
    
    context.font = "normal 12px Arial";
    context.fillStyle = "#000000";
    context.textBaseline = "middle";
    context.textAlign = "center";
    context.strokeStyle = "#ffffff";
    context.lineWidth  = 4;

    context.strokeText(cmToFeet(d), 
      viewmodel.convertX(x), 
      viewmodel.convertY(y));
    context.fillText(cmToFeet(d), 
      viewmodel.convertX(x), 
      viewmodel.convertY(y));
  }

  function drawEdgeLabel(edge) {
    var pos = edge.interiorCenter();
    var length = edge.interiorDistance();
    if (length < 30) {
      // dont draw labels on walls this short
      return;
    }
    context.font = "normal 12px Arial";
    context.fillStyle = "#000000";
    context.textBaseline = "middle";
    context.textAlign = "center";
    context.strokeStyle = "#ffffff";
    context.lineWidth  = 4;

    context.strokeText(cmToFeet(length), 
      viewmodel.convertX(pos.x), 
      viewmodel.convertY(pos.y));
    context.fillText(cmToFeet(length), 
      viewmodel.convertX(pos.x), 
      viewmodel.convertY(pos.y));
  }

  function drawEdge(edge, hover) {
    var color = edgeColor;
    if (hover && viewmodel.mode == viewmodel.modes.DELETE) {
      color = deleteColor;
    } else if (hover) {
      color = edgeColorHover;
    } 
    var corners = edge.corners();
    drawPolygon(
      utils.map(corners, function(corner) {
        return viewmodel.convertX(corner.x);
      }), 
      utils.map(corners, function(corner) {
        return viewmodel.convertY(corner.y);
      }), 
      false,
      null,
      true,
      color,
      edgeWidth
    ); 
  }

  function drawRoom(room) {
    drawPolygon(
      utils.map(room.corners, function(corner) {
        return viewmodel.convertX(corner.x);
      }), 
      utils.map(room.corners, function(corner) {
        return viewmodel.convertY(corner.y);
      }), 
      true,
      roomColor
    );
  }
  
  function drawAuxiliarLines(item) {
        //if (canDraw(item) && item.metadata.subcategoria != 11 && item.metadata.subcategoria != 12) {
        if (canDraw(item)) {    
            /*drawCircle(
                viewmodel.convertX(item.position.x), 
                viewmodel.convertY(item.position.z), 
                cornerRadiusHover, 
                cornerColorHover
              );*/
      
      
            var realWalls = floorplan.getWalls();
            //var walls = item.cotas.walls;
            var corners = item.cotas.corners;
            //console.log("Item: " + item.metadata.itemName);
            var distancias = [];
            
            // Calculo las distancias de cada corner a todos los muros
            for (var i = 0; i < corners.length; i++) {
                var c = corners[i];
                //console.log("Corner: " + i + " Muro: 0 - Distancia: " + d);
                for (var j=0; j < realWalls.length; j++) {
                    var d_t = realWalls[j].perpendicularDistanceFrom(c.getX(),c.getY()) - (realWalls[j].thickness/2);
                    //console.log("Corner: " + i + " Muro: "  + j +  " - Distancia: " + d_t);
                    
                    var dist = {
                        corner: i,
                        wall: j,
                        d: d_t
                    }
                    
                    distancias.push(dist);
                }
                
            }
            //console.log(distancias);
            
            // Compruebo si el objeto está pegado a la pared
            if (!objetoPegadoAlaPared(distancias)) {
           
                // Me quedo con las menores distancias de forma perpendicular a cada muro
                distancias = seleccionarRectas(distancias);    
                //console.log(distancias);

                
                // Dibujamos 2 lineas
                var NUM_LINES = 2;
                if (distancias.length < NUM_LINES) {
                    NUM_LINES = distancias.length;
                }
                for (let i = 0; i < NUM_LINES; i++) {
                    var recta = distancias[i];
                     var c = corners[recta.corner];
                     var w = realWalls[recta.wall];
                     var p_muro = utils.closestPointOnLine(c.getX(),c.getY(), 
                            w.getStartX(), w.getStartY(), 
                            w.getEndX(), w.getEndY());
      
      
                    var x1 = viewmodel.convertX(c.getX());
                    var y1 = viewmodel.convertY(c.getY());
                    var x2 = viewmodel.convertX(p_muro.x);
                    var y2 = viewmodel.convertY(p_muro.y);
        
                    var p = utils.pointDistanceInaLine(x1,y1,x2,y2,viewmodel.convertCm(w.thickness/2));
                    x2 = p.x;
                    y2 = p.y;
                    drawInteriorLine(x1,y1,x2,y2,recta.d);
                }
                
                drawMedidasPorDentro(item);
            } else {
                // El objeto está pegado a la pared
                drawMedidasPorFuera(item,distancias);
                
            }
        }
  }
  
  function canvas_arrow(fromx, fromy, tox, toy, r){
    var x_center = tox;
    var y_center = toy;

    var angle;
    var x;
    var y;

    context.beginPath();

    var ini_angle = Math.atan2(toy-fromy,tox-fromx)
    //x = r*Math.cos(angle) + x_center;
    //y = r*Math.sin(angle) + y_center;
    x = x_center;
    y = y_center;
    
    context.moveTo(x, y);

    angle = ini_angle + (165/360)*(2*Math.PI)
    x = r*Math.cos(angle) + x_center;
    y = r*Math.sin(angle) + y_center;

    context.lineTo(x, y);

    angle = ini_angle - (165/360)*(2*Math.PI)
    x = r*Math.cos(angle) + x_center;
    y = r*Math.sin(angle) + y_center;

    context.lineTo(x, y);
    //context.stroke();
    context.closePath();

    context.fill();
}

  function drawInteriorLine(x1,y1,x2,y2,d,endLen1,endLen2,textSize) {
        
        textSize = textSize || 12;
        var d_endLen1 =viewmodel.convertCm(5); 
        var d_endLen2 =viewmodel.convertCm(5); 
        endLen1 = endLen1 || d_endLen1;
        endLen2 = endLen2 || d_endLen2;
        var lenArrow = 9;
        
        context.strokeStyle = "black";
        context.font = "normal " + Math.round(viewmodel.convertCm(textSize)) + "px Arial";
        context.lineJoin = context.lineCap = "round";
        context.fillStyle = "#000000";
        context.lineWidth = 0.5;
        context.textBaseline = "middle";
        context.textAlign = "center";
        
        const lineLenStr = d.toFixed(1);
        
        if (lineLenStr >= lenArrow*2) { 
            canvas_arrow(x1, y1, x2, y2, viewmodel.convertCm(lenArrow));
            canvas_arrow(x2, y2, x1, y1, viewmodel.convertCm(lenArrow));
        }    
        
      function setTransformToLine(x1, y1, x2, y2) {
          const vx = x2 - x1; 
          const vy = y2 - y1;
          var len = Math.hypot(vx, vy); 
          const nx = vx / len; 
          const ny = vy / len;
          context.setTransform(nx, ny, -ny, nx, x1, y1);
          return len;
        }

        // Set the transform along the line. Keep the line length
        // line len is need to get the x coord of the end of the line
        const lineLen = setTransformToLine(x1, y1, x2, y2);
        
        const textWidth = context.measureText(lineLenStr).width;
        const textHeight = Math.round(viewmodel.convertCm(textSize))*1.5;

        //console.log("Long. linea: " + lineLen + "Alto texto: " + textHeight + " Ancho texto: " + textWidth + " Texto: " + lineLenStr);
        //const rlen = lineLen - textWidth - 16; // find the remaining line len after removing space for text

        // Rendering is done in line local coordinates
        // line is from (0,0) to (lineLen,0)

        // Now draw the line the ends first and then along the line leaving gap for text
        context.beginPath();
        context.lineTo(0, -endLen1);             // start perp line
        context.lineTo(0,  endLen2); 

        context.moveTo(lineLen, -endLen1);       // end of line is at lineLen
        context.lineTo(lineLen,  endLen2); 

        context.moveTo(0,0);                    // line start segment
        //context.lineTo(rlen / 2, 0);

        //context.moveTo(lineLen - rlen / 2,0);   // line end segment
        context.lineTo(lineLen, 0);

        context.stroke(); // render it.

        context.translate(lineLen / 2,0);
        if (textWidth > lineLen) {
           //context.textAlign = "left";
           context.rotate(-Math.PI/2); 
           context.translate(viewmodel.convertCm(13), -viewmodel.convertCm(-1.5));
           //context.translate(-1.75*textHeight, textHeight/2);
           context.font = "normal " + Math.round(viewmodel.convertCm(textSize-3)) + "px Arial";
        } else {
           context.translate(0, -viewmodel.convertCm(textSize/2+1));
        
        }
        
        // Le damos la vuelta al texto para mostrarlo correctamente
        if (x2 < x1 + 0.1) {
           context.rotate(Math.PI);
           context.translate(0, viewmodel.convertCm(textSize/6));
           //context.translate(-lineLen, viewmodel.convertCm(textSize/6));
        }
        context.fillStyle = "#000000";
        
        // now add text at the line center
        if (lineLenStr < 1) {
            console.log("WARNING");
        }
        //if (lineLenStr >= 10) {
            //context.fillText(lineLenStr, lineLen / 2, 0);
            
            context.fillText(lineLenStr, 0, 0);
            
        //}
        
        // To restore the transform to its default use identity matrix
        context.setTransform(1, 0, 0, 1, 0, 0);
        
  }
  
  function objetoPegadoAlaPared(rectas) {
      var muros = [];
      var pegado = false;
      var idx = 0;
      while (idx < rectas.length && !pegado) {
          if (rectas[idx].d < dMinMuro) {
              var i = muros.indexOf(rectas[idx].wall);
              if (i == -1) {
                  muros.push(rectas[idx].wall);
              } else {
                  pegado = true;
              }
          }
          idx = idx + 1;
      }
      return pegado;
  }
  
  function seleccionarRectas(rectas) {
      var newSet = [];
      
      // filtro aquellas rectas que sean muy pequeñas
      var rectas = rectas.filter(
              function(value, index, arr){ 
                  return value.d >= dMinMuro;
              });
              
      while (rectas.length > 0) {
          //console.log(rectas.length);
          var r = getRectaMinima(rectas);
          newSet.push(r);
          rectas = eliminarRectasCornersWalls(rectas,r);
      }
      return newSet;
  }
  
  function getRectaMinima(rectas) {
        var d = rectas[0].d;
        var idx = 0;
        for (var j=0; j < rectas.length; j++) {
            var d_t = rectas[j].d;
            if (d_t < d) {
                d = d_t;
                idx = j;
            }
        }
        return rectas[idx];
  }
  
  function eliminarRectasCornersWalls(rectas, r) {
      var filtered = rectas.filter(
              function(value, index, arr){ 
                  return value.wall != r.wall && value.d != Infinity;
              });
      return filtered; 
  }
  
  function ladoPegadoaMuro(w, corners,porFuera) {
      var c1 = w.getStart();
      var c2 = w.getEnd();
      var idxMuros = [];
      for (let i = 0; i < porFuera.length; i++) {
          var l = porFuera[i];
          var cTemp = corners[l.corner];
          if (c1 == cTemp || c2 == cTemp) {
            idxMuros.push(l.wall);
          } 
      }
      if (idxMuros.length > 1) {
        return utils.getMode(idxMuros);
      }
      return -1;
              
  }
  
  function drawMedidasPorFuera(item, distancias) {
      
    
    // filtro aquellas rectas que sean muy pequeñas
    var porFuera = distancias.filter(
              function(value, index, arr){ 
                  return value.d < dMinMuro;
              });
    //console.log(porFuera);
    var walls = item.cotas.walls;
    var corners = item.cotas.corners;
    var distances = [];
   // console.log(walls);
    for (var i = 0; i < walls.length; i++) {
        var w = walls[i];
        
        var distance = Math.sqrt(Math.pow(w.getStartX() - w.getEndX(),2) + Math.pow(w.getStartY() - w.getEndY(),2)); 
        distance = Math.round(distance * 100) / 100;
        
        idx_muro = ladoPegadoaMuro(w,corners,porFuera);
        
        var d = {
            wall: i, // Lado del item
            muro: idx_muro, // idx de la pared
            l: distance // distancia del lado del item
        }

        distances.push(d);
    }
    //console.log(distances);
    
    // Almaceno las distancias iguales
    var dIguales = [];
    for (var i = 0;i < distances.length; i++) {
        var d = distances[i].l;
        if (dIguales.indexOf(d) == -1) {
            dIguales.push(d);
        }
    }
    var dibujar = [];
    for (var i = 0; i < dIguales.length; i++) {
        var iguales = distances.filter(
              function(value, index, arr){ 
                  return value.l == dIguales[i];
              });
        if (iguales.length > 1) {
            const closest = iguales.reduce(
              (acc, loc) =>
                acc.muro > loc.muro
                  ? acc
                  : loc
            );
            dibujar.push(closest);

        } else {
            dibujar.push(iguales);
        }
    }
    console.log("Dibujar");
    console.log(dibujar);
    var realWalls = floorplan.getWalls();
    for (var i=0; i < dibujar.length; i++) {
        if (dibujar[i].muro == -1) {
          drawParallelLine(walls[dibujar[i].wall],dibujar[i].l);
        } else {
            
          var l = getLineOutsideMuro(walls[dibujar[i].wall], realWalls[dibujar[i].muro]);
          l.muro = dibujar[i].muro;
          lineasOutsideMuros.push(l);
        } 
    }
    
    
    
  }
  
  
  function drawMedidasPorDentro(item) {
      
        //console.log("Dibujo cotas item "  + item.metadata.itemName + " " + item.cotas);
        if (canDraw(item) && item.metadata.subcategoria != 11 && item.metadata.subcategoria != 12) {
        var walls = item.cotas.walls;
        var distances = [];
       // console.log(walls);
        for (var i = 0; i < walls.length; i++) {
            var w = walls[i];
        
            var distance = Math.sqrt(Math.pow(w.getStartX() - w.getEndX(),2) + Math.pow(w.getStartY() - w.getEndY(),2)); 
            distance = Math.round(distance * 100) / 100;
            
            var d = {
                wall: i,
                l: distance
            }
            
            distances.push(d);
        }
       
        //console.log(distances);
        for (var i=0; i < distances.length; i++) {
            var d = distances[i];
             // filtro aquellas rectas que sean muy pequeñas
            var tempD = distances.filter(
              function(value, index, arr){ 
                  return value.l == d.l && index >= i+1;
              });
              
            if (tempD.length == 0) {
                drawParallelLine(walls[d.wall],d.l);
                //drawText(means[i], distances[i]);
            }
        }

        }
  }
  
  function getParallelLine(x1,y1,x2,y2,d) {
    var ini_angle = Math.atan2(y2-y1,x2-x1);
    var angle = ini_angle + (1/4)*(2*Math.PI);
    var n_x2 = -d*Math.cos(angle) + x2;
    var n_y2 = -d*Math.sin(angle) + y2;
    
    var n_x1 = -d*Math.cos(angle) + x1;
    var n_y1 = -d*Math.sin(angle) + y1;
    
    return {
        x1: n_x1,
        y1: n_y1,
        x2: n_x2,
        y2: n_y2
    }
  }
  
  function getLineOutsideMuro(w,muro,desp2) {
      desp2 = desp2 || 0;
      //var x1 = viewmodel.convertX(w.getStartX());
      //var y1 = viewmodel.convertY(w.getStartY());
      //var x2 = viewmodel.convertX(w.getEndX());
      //var y2 = viewmodel.convertY(w.getEndY());

      var p_muro = utils.closestPointOnLine(w.getStartX(), w.getStartY(),
                            muro.getStartX(), muro.getStartY(), 
                            muro.getEndX(), muro.getEndY());
      var x1 = p_muro.x;
      var y1 = p_muro.y
     
      p_muro = utils.closestPointOnLine(w.getEndX(), w.getEndY(),
                            muro.getStartX(), muro.getStartY(), 
                            muro.getEndX(), muro.getEndY());
      var x2 = p_muro.x;
      var y2 = p_muro.y

      var l = getParallelLine(x1,y1,x2,y2,desp2);
      return l;
  }
  
  function drawParallelLine(w, long, desp1, desp2) {
        desp1 = desp1 || 5;
        desp2 = desp2 || 13;
        var x1 = viewmodel.convertX(w.getStartX());
        var y1 = viewmodel.convertY(w.getStartY());
        var x2 = viewmodel.convertX(w.getEndX());
        var y2 = viewmodel.convertY(w.getEndY());

        var l = getParallelLine(x1,y1,x2,y2,viewmodel.convertCm(desp2));
        drawInteriorLine(l.x1,l.y1,l.x2,l.y2,long,viewmodel.convertCm(desp1),viewmodel.convertCm(desp2));
               
  }

  function createElementCotas(item) {
      var corners = item.getCorners('x', 'z');

        // Creamos las esquinas
        var corn = [];
        for (var i = 0; i < corners.length; i++) {
            var corner = new Corner(floorplan, corners[i].x, corners[i].y, i);
            corner.mergeCorners = 0;
            corn.push(corner);
        }

        // Creamos las líneas
        var walls = [];
        for (var i = 1; i < corn.length; i++) {
            var wall = new Wall(corn[i-1], corn[i]);
            walls.push(wall);
        }
        var wall = new Wall(corn[corn.length-1], corn[0]);
        walls.push(wall);


        if (parseFloat(item.corr_depth) > 1e-7) {
            //console.log("Corrección prof: " + parseFloat(item.corr_depth));
            walls[1].moveEndCorner(- parseFloat(item.corr_depth));
            walls[3].moveStartCorner(- parseFloat(item.corr_depth));
            //walls[1].moveRightCorner(- 40);
            //walls[3].moveRightCorner(- 40);

        } 
        if (parseFloat(item.corr_width) > 1e-7) {
            //console.log("Corrección ancho: " + parseFloat(item.corr_width));
            walls[0].moveEndCorner(- parseFloat(item.corr_width));
            walls[2].moveStartCorner(- parseFloat(item.corr_width));
        }

        item.cotas = {
            corners: corn,
            walls: walls
        }

  }  
  
  function canDraw(item) {
    var elemArqui = $("#cotasElemArqui").is(":checked");
    var mobiliario = $("#cotasMobiliario").is(":checked");
    return ((elemArqui && item.metadata.acotada == 2) || (mobiliario && item.metadata.acotada == 1)); 
  }
  
  function materialDeCotas(item,pal) {
    // Busco si existe el material de cotas
    var idxMaterialIndex = -1;
    var materialSelected = item.material.map(
              function(value, index, arr){ 
                  if (value.name.trim().search(pal) != -1) {
                      idxMaterialIndex = index;
                  }
              });
    return idxMaterialIndex;
    
  }
  
  function getVerticesMaterial(item,idxMaterialIndex) {
    
    // Me quedo con los faces del materials
    var selectFaces = item.geometry.faces.filter(
            function(value, index, arr){ 
                return value.materialIndex == idxMaterialIndex;
            });

    // Selecciono los vertices que no se repiten        
    var idxVertexs = [];        
    selectFaces.map(
            function(value,index) {
                if (idxVertexs.indexOf(value.a) == -1) {
                    idxVertexs.push(value.a);
                }
                if (idxVertexs.indexOf(value.b) == -1) {
                    idxVertexs.push(value.b);
                }
                if (idxVertexs.indexOf(value.c) == -1) {
                    idxVertexs.push(value.c);
                }
            });        
    // Los obtengo        
    var vertexs = item.geometry.vertices.filter(
            function(value, index, arr){ 
                return (idxVertexs.indexOf(index) != -1);
            });

    // Se generan las coordenadas globales        
    var vertexs2 = vertexs.map(
            function(value, index, arr){
                var localVertex = value.clone();
                return localVertex.applyMatrix4(item.matrix);
            });
            
    return vertexs2;        

  }
  
  function mostrarMovPuerta(item,idxMaterialIndex) {
      
      if (idxMaterialIndex != -1) {
       
        // Obtengo los vertices del material
        var vertexs2 = getVerticesMaterial(item,idxMaterialIndex);
        
        // Transformo los vertices en el formato que acepta hull
        var pointset = vertexs2.map(
                function(value, index, arr){
                    var i = [];
                    i.push(value.x);
                    i.push(value.z);
                    return i;
                    //return {x: value.x, y:value.z};
                });
        
        drawCircle(viewmodel.convertX(pointset[0][0]),viewmodel.convertY(pointset[0][1]),1,"#00FF00");
        pointset = utils.removeDuplicates(pointset);
       // drawCircle(viewmodel.convertX(pointset[0][0]),viewmodel.convertY(pointset[0][1]),1,"#FF0000");
                
        //var pointset = [[168, 180], [168, 178], [168, 179]];
        // Genero el convex hull
        console.log(pointset);
        var pts = hull(pointset, 10);
        
        pts = utils.comenzarPor(pts,pointset[0]);
        console.log(pts);
// ... draw pts
        // Dibujo el poligono
        
        drawPolygon(
              utils.map(pts, function(v) {
                return viewmodel.convertX(v[0]);
              }), 
              utils.map(pts, function(v) {
                return viewmodel.convertY(v[1]);
              }), 
              true,
              itemColor,
            );
        
         drawCircle(viewmodel.convertX(pts[0][0]),viewmodel.convertY(pts[0][1]),1,"#0000FF");
         drawCircle(viewmodel.convertX(pts[1][0]),viewmodel.convertY(pts[1][1]),1,"#FF0000");
         //drawCircle(viewmodel.convertX(pts[pts.length-1][0]),viewmodel.convertY(pts[pts.length-1][1]),1,"#00FF00");
         //context.translate(viewmodel.convertCm(-10),0);
         drawPolygonRotated(
              utils.map(pts, function(v) {
                return viewmodel.convertX(v[0]);
              }), 
              utils.map(pts, function(v) {
                return viewmodel.convertY(v[1]);
              }), 
              itemColor,
              90
            );
        //context.restore();
        /*for (var i = 0; i < vertexs2.length; i++) {
          drawCircle(viewmodel.convertX(vertexs2[i].x),viewmodel.convertY(vertexs2[i].z),1,"#FF0000");
        }
        for (var i = 0; i < pts.length; i++) {
          var v = pts[i];
          drawCircle(viewmodel.convertX(v[0]),viewmodel.convertY(v[1]),1,"#0000FF");
        }*/
    }
  }
  
  function mostrarPlanta(item,idxMaterialIndex) {
      
      
    if (idxMaterialIndex != -1) {
       
        // Obtengo los vertices del material
        var vertexs2 = getVerticesMaterial(item,idxMaterialIndex);
        
        // Transformo los vertices en el formato que acepta hull
        var pointset = vertexs2.map(
                function(value, index, arr){
                    var i = [];
                    i.push(value.x);
                    i.push(value.z);
                    return i;
                    //return {x: value.x, y:value.z};
                });
        
        drawCircle(viewmodel.convertX(pointset[0][0]),viewmodel.convertY(pointset[0][1]),1,"#00FF00");
        pointset = utils.removeDuplicates(pointset);
       // drawCircle(viewmodel.convertX(pointset[0][0]),viewmodel.convertY(pointset[0][1]),1,"#FF0000");
                
        //var pointset = [[168, 180], [168, 178], [168, 179]];
        // Genero el convex hull
        console.log(pointset);
        var pts = hull(pointset, 10);
        
        pts = utils.comenzarPor(pts,pointset[0]);
        console.log(pts);
// ... draw pts
        // Dibujo el poligono
        
        drawPolygon(
              utils.map(pts, function(v) {
                return viewmodel.convertX(v[0]);
              }), 
              utils.map(pts, function(v) {
                return viewmodel.convertY(v[1]);
              }), 
              true,
              itemColor,
            );
        
        
        //context.restore();
        /*for (var i = 0; i < vertexs2.length; i++) {
          drawCircle(viewmodel.convertX(vertexs2[i].x),viewmodel.convertY(vertexs2[i].z),1,"#FF0000");
        }
        for (var i = 0; i < pts.length; i++) {
          var v = pts[i];
          drawCircle(viewmodel.convertX(v[0]),viewmodel.convertY(v[1]),1,"#0000FF");
        }*/
    }
  }
  
  function drawPuertas(item) {
      
      //var itemColor = "#FFFFFF"; 
      var lineColor = "rgba(51, 51, 51, 1)";   
      var corn = item.cotas.corners;
      var walls = item.cotas.walls;
      
      var grosor = walls[1].thickness;
      var len = walls[1].distanciaParcial();
      var dif = (len - grosor)/2;
      console.log("Grosor: " + grosor + " len: " + len + " dif: " + dif);
      
      var c1 = walls[1].getStart();
      var c2 = walls[1].getEnd();
      
      var x1 = c1.getX();
      var y1 = c1.getY();
      var x2 = c2.getX();
      var y2 = c2.getY();
      
      var p = utils.pointDistanceInaLine(x1,y1,x2,y2,dif);
      c2.move(p.x,p.y);
      var p = utils.pointDistanceInaLine(x2,y2,x1,y1,dif-0.4);
      c1.move(p.x,p.y);
      
      var c1 = walls[3].getStart();
      var c2 = walls[3].getEnd();
      
      var x2 = c1.getX();
      var y2 = c1.getY();
      var x1 = c2.getX();
      var y1 = c2.getY();
      
      var p = utils.pointDistanceInaLine(x1,y1,x2,y2,dif);
      c1.move(p.x,p.y);
      var p = utils.pointDistanceInaLine(x2,y2,x1,y1,dif-0.4);
      c2.move(p.x,p.y);
      
      //var faces = item.geometry.faces[idxFace].materialIndex
        
      
      /*for (var i = 0; i < corn.length; i++) {
        var pos = [];
        pos.x = corn[i].getX();
        pos.y = corn[i].getY();
        drawText(pos, i);

      }*/
     
     
      drawPolygon(
        utils.map(corn, function(corner) {
          return viewmodel.convertX(corner.getX());
        }), 
        utils.map(corn, function(corner) {
          return viewmodel.convertY(corner.getY());
        }), 
        true,
        doorColor
      );
     
       //for (var i = 0; i < walls.length; i++) {
        var w = walls[1];
            drawLine(viewmodel.convertX(w.getStartX()),viewmodel.convertY(w.getStartY()),
                viewmodel.convertX(w.getEndX()),viewmodel.convertY(w.getEndY()),
                1,lineColor);
        w = walls[3];
            drawLine(viewmodel.convertX(w.getStartX()),viewmodel.convertY(w.getStartY()),
                viewmodel.convertX(w.getEndX()),viewmodel.convertY(w.getEndY()),
                1,lineColor);
                
        w = walls[0];
            drawLine(viewmodel.convertX(w.getStartX()),viewmodel.convertY(w.getStartY()),
                viewmodel.convertX(w.getEndX()),viewmodel.convertY(w.getEndY()),
                1,lineColor,[6,4]);
       
         w = walls[2];
            drawLine(viewmodel.convertX(w.getStartX()),viewmodel.convertY(w.getStartY()),
                viewmodel.convertX(w.getEndX()),viewmodel.convertY(w.getEndY()),
                1,"#EEEEEE");
       
       
        // Obtengo los vertices del material
        var idxMaterialHoja = materialDeCotas(item, "HOJA");
        //var vertexs2 = getVerticesMaterial(item,idxMaterialHoja);
        
        if (idxMaterialHoja != -1) {
             //context.save();
           ///   context.translate(0,0);
            //  context.rotate(viewmodel.convertCm(20) * Math.PI / 180);
            mostrarMovPuerta(item, idxMaterialHoja);
             //context.restore();
        } 
       
      
  }
  
 
  
  function drawItem(item) {
    var itemColorL = itemColor;
    if (item.metadata.subcategoria == 89) {
        //itemColor = "rgba(221, 221, 221, 0.3)";   ; 
        itemColorL = wallColor; 
    } 
    var lineColor = "rgba(51, 51, 51, 1)";   
    
      if (canDraw(item)) {
    
    //if (utils.seVende(item)) {
   
        //console.log("Voy a pintar un item: " + item.metadata.itemName + " " + item.getDepthCorr());
        
        // Creo las esquinas y lados del item a partir de su posición
        //console.log("Antes de crear cotas item "  + item.metadata.itemName + " " + item.cotas);
      
        createElementCotas(item);
        
        // Dibujo las puertas
        if (item.metadata.subcategoria == 11) {
            drawPuertas(item);
        } else {
            //console.log("Despues de crear cotas item "  + item.metadata.itemName + " " + item.cotas);
            var walls = item.cotas.walls;
            var idxMaterialCotas = materialDeCotas(item, "COTAS");

            if (idxMaterialCotas != -1) {
                mostrarPlanta(item, idxMaterialCotas);
            } else {
                // Muestro el BoundingBox
                var corn = item.cotas.corners;
               
                drawPolygon(
                  utils.map(corn, function(corner) {
                    return viewmodel.convertX(corner.getX());
                  }), 
                  utils.map(corn, function(corner) {
                    return viewmodel.convertY(corner.getY());
                  }), 
                  true,
                  itemColorL
                );
            }

            /*for (var i = 0; i < corn.length; i++) {
                var pos = [];
                pos.x = corn[i].getX();
                pos.y = corn[i].getY();
                drawText(pos, i);

            }*/

            // console.log(walls);
            for (var i = 0; i < walls.length; i++) {
                var w = walls[i];
                drawLine(
                    viewmodel.convertX(w.getStartX()),
                    viewmodel.convertY(w.getStartY()),
                    viewmodel.convertX(w.getEndX()),
                    viewmodel.convertY(w.getEndY()),
                    1,
                    lineColor
                );
            }
        }
        
    }
    
  }

  function drawCorner(corner) {
    var hover = (corner === viewmodel.activeCorner);
    var color = cornerColor;
    if (hover && viewmodel.mode == viewmodel.modes.DELETE) {
      color = deleteColor;
    } else if (hover) {
      color = cornerColorHover;
    } 
    drawCircle(
      viewmodel.convertX(corner.x), 
      viewmodel.convertY(corner.y), 
      hover ? viewmodel.convertCm(cornerRadiusHover) : viewmodel.convertCm(cornerRadius), 
      color
    );
  }

  function drawTarget(x, y, lastNode) {
    drawCircle(
      viewmodel.convertX(x), 
      viewmodel.convertY(y), 
      cornerRadiusHover, 
      cornerColorHover
    );
    if (viewmodel.lastNode) {
      drawLine(
        viewmodel.convertX(lastNode.x),
        viewmodel.convertY(lastNode.y),
        viewmodel.convertX(x),
        viewmodel.convertY(y),
        wallWidthHover,
        wallColorHover
      );
      //drawTextTarget(lastNode.x, lastNode.y, x, y);
    }
  }

  function drawTarget2(x, y, lastNode) {
      
      
    drawCircle(
      viewmodel.convertX(x), 
      viewmodel.convertY(y), 
      2, 
      "blue"
    );
    
    
    if (viewmodel.lastNode) {
        
      var p1 = utils.perpendicularPointOfaLine(lastNode.x, lastNode.y, x,y, 5);
      var p2 = utils.perpendicularPointOfaLine(x,y,lastNode.x, lastNode.y, -5);
    
      drawCircle(
          viewmodel.convertX(p1.x), 
          viewmodel.convertY(p1.y), 
          2, 
          "red"
      );
      
      drawLine(
        viewmodel.convertX(lastNode.x),
        viewmodel.convertY(lastNode.y),
        viewmodel.convertX(x),
        viewmodel.convertY(y),
        2,
        "blue"
      );
      
      drawLine(
        viewmodel.convertX(p1.x),
        viewmodel.convertY(p1.y),
        viewmodel.convertX(p2.x),
        viewmodel.convertY(p2.y),
        2,
        "red"
      );
      
      drawTextTarget(lastNode.x, lastNode.y, x, y);
    }
  }
  function drawLine(startX, startY, endX, endY, width, color,dashed) {
    // width is an integer
    // color is a hex string, i.e. #ff0000
    dashed = dashed || [];
    context.beginPath();
    context.setLineDash(dashed);
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.lineWidth = width;
    context.strokeStyle = color;
    context.stroke();
  }

  function drawPolygon(xArr, yArr, fill, fillColor, stroke, strokeColor, strokeWidth) {
    // fillColor is a hex string, i.e. #ff0000
    fill = fill || false;
    stroke = stroke || false;
    context.save();
    context.translate(xArr[0],yArr[0]);
    context.beginPath();
    //context.moveTo(xArr[0], yArr[0]);
    context.moveTo(0, 0);
    for (var i = 1; i < xArr.length; i++) {
      //context.lineTo(xArr[i], yArr[i]);
      context.lineTo(xArr[i]-xArr[0], yArr[i]-yArr[0]);
    }
    context.closePath();
    if (fill) {
      context.fillStyle = fillColor;
      context.fill();   
    }
    if (stroke) {
      context.lineWidth = strokeWidth;
      context.strokeStyle = strokeColor;
      context.stroke();
    }
    context.restore();
  }

function drawPolygonRotated(xArr, yArr, fillColor,rotation) {
    // fillColor is a hex string, i.e. #ff0000
    
    drawCircle(xArr[xArr.length-1],yArr[yArr.length-1],1,"#00FF00");
    context.save();
    context.translate(xArr[0],yArr[0]);
    context.rotate(rotation*Math.PI/180);
    context.beginPath();
    //context.moveTo(xArr[0], yArr[0]);
    context.moveTo(0, 0);
    for (var i = 1; i < xArr.length; i++) {
      //context.lineTo(xArr[i], yArr[i]);
      context.lineTo(xArr[i]-xArr[0], yArr[i]-yArr[0]);
    }
    context.closePath();
    context.fillStyle = fillColor;
    context.fill();  
    drawCircle(xArr[xArr.length-1],yArr[yArr.length-1],6,"#FF0000");
    
    
    context.restore();
  }
  
  function drawCircle(centerX, centerY, radius, fillColor) {
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = fillColor;
    context.fill();
  }

  // returns n where -gridSize/2 < n <= gridSize/2
  function calculateGridOffset(n) {
    if (n >= 0) {
      return (n + gridSpacing/2.0) % gridSpacing - gridSpacing/2.0;
    } else {
      return (n - gridSpacing/2.0) % gridSpacing + gridSpacing/2.0;  
    }
  }

  function drawGrid() {
    const offsetX = calculateGridOffset(-viewmodel.originX);
    const offsetY = calculateGridOffset(-viewmodel.originY);
    const width = canvasElement.width;
    const height = canvasElement.height;
    for (let x=0; x <= (width / gridSpacing); x++) {
      drawLine(gridSpacing * x + offsetX, 0, gridSpacing*x + offsetX, height, gridWidth, gridColor);
    }
    for (let y=0; y <= (height / gridSpacing); y++) {
      drawLine(0, gridSpacing*y + offsetY, width, gridSpacing*y + offsetY, gridWidth, gridColor);
    }
  }

  function drawSkyBoxLines() {
    const skyBox = getSkyBoxModel();
    console.log(skyBox)

    if (skyBox) {
      // Calcula el bounding box del modelo
      const boundingBox = new THREE.Box3().setFromObject(skyBox);

      // Obtiene las coordenadas de las esquinas del bounding box
      const min = new THREE.Vector2(viewmodel.convertX(boundingBox.min.x), viewmodel.convertY(boundingBox.min.z));
      const max = new THREE.Vector2(viewmodel.convertX(boundingBox.max.x), viewmodel.convertY(boundingBox.max.z));


      // Dibuja las líneas del bounding box en el grid
      drawLine(min.x, min.y, max.x, min.y, 2, '#77dd77');
      drawLine(max.x, min.y, max.x, max.y, 2, '#77dd77');
      drawLine(max.x, max.y, min.x, max.y, 2, '#77dd77');
      drawLine(min.x, max.y, min.x, min.y, 2, '#77dd77');
    }
  }

  // Función para obtener el modelo mesh del skybox
  function getSkyBoxModel() {
    // Se hace a través de la función traverse de la escene
    let skyBox;
    
    scene.getScene().traverse(function(node) {
      if (node.metadata?.isBackground === true)
        skyBox = node;
    });

    return skyBox;
  }

  init();
}

module.exports = FloorplannerView;
