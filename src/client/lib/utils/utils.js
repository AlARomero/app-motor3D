import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import * as THREE from 'three';

var utils = {};

utils.pointDistanceFromLine  = function( x, y, x1, y1, x2, y2 ) {

  var point = utils.closestPointOnLine(x, y, x1, y1, x2, y2);
	var dx = x - point.x;
	var dy = y - point.y;
	return Math.sqrt(dx * dx + dy * dy);
}

utils.checkOrthogonalLines = function(x1,y1,x2,y2,x3,y3,x4,y4) {
    
    var m1, m2; 
    var eps = 1e-05;
    // Both lines have infinite slope 
    if (Math.abs(x2 - x1) < eps && Math.abs(x4 - x3) == eps) 
        return false; 

    // Only line 1 has infinite slope 
    else if (Math.abs(x2 - x1) < eps) 
    { 
        m2 = (y4 - y3) / (x4 - x3); 
        if (Math.abs(m2) < eps) 
            return true; 
        else
            return false; 
    } 

    // Only line 2 has infinite slope 
    else if (Math.abs(x4 - x3) < eps)  
    { 
         m1 = (y2 - y1) / (x2 - x1); 
        if (Math.abs(m1) < eps) 
            return true; 
        else
            return false; 
    } 

    else 
    { 
        // Find slopes of the lines 
        m1 = (y2 - y1) / (x2 - x1); 
        m2 = (y4 - y3) / (x4 - x3); 
        var mul = m1*m2;
        // Check if their product is -1 
        if (Math.abs(mul + 1) < eps) 
            return true; 
        else
            return false; 
    } 
} 

utils.perpendicularPoint = function(x1,y1,x2,y2,d) {
   
   var xx = x2+d*(y1-y2)/Math.sqrt(Math.pow(y1-y2,2)+Math.pow(y1-y2,2));
   var yy = y2-d*(x1-x2)/Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
   
   return {
    x: xx,
    y: yy
   }
} 

utils.closestPointOnLine = function(x, y, x1, y1, x2, y2) {
  // thanks, http://stackoverflow.com/a/6853926
  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;

  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = dot / len_sq;

  var xx, yy;

  if (param < 0 || (x1 == x2 && y1 == y2)) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return {
    x: xx,
    y: yy
  }
}

utils.distance = function( x1, y1, x2, y2 ) {
	return Math.sqrt(
		Math.pow(x2 - x1, 2) + 
		Math.pow(y2 - y1, 2));
}

// angle between 0,0->x1,y1 and 0,0->x2,y2 (-pi to pi)
utils.angle = function( x1, y1, x2, y2 ) {
    var dot = x1 * x2 + y1 * y2;
    var det = x1 * y2 - y1 * x2;
    var angle = -Math.atan2( det, dot );
    return angle;
}

// shifts angle to be 0 to 2pi
utils.angle2pi = function( x1, y1, x2, y2 ) {
	var theta = utils.angle(x1, y1, x2, y2);
	if (theta < 0) {
		theta += 2*Math.PI;
	}
	return theta;
}

// points is array of points with x,y attributes
utils.isClockwise = function( points ) {
    // make positive
    const subX = Math.min(0, Math.min.apply(null, utils.map(points, function(p) {
      return p.x;
    })))
    const subY = Math.min(0, Math.min.apply(null, utils.map(points, function(p) {
      return p.x;
    })))
    var newPoints = utils.map(points, function(p) {
      return {
        x: p.x - subX,
        y: p.y - subY
      }
    })
    // determine CW/CCW, based on:
    // http://stackoverflow.com/questions/1165647
    var sum = 0;
    for ( var i = 0; i < newPoints.length; i++ ) {
        var c1 = newPoints[i];
        if (i == newPoints.length-1) {
            var c2 = newPoints[0]
        } else {
            var c2 = newPoints[i+1];
        }
        sum += (c2.x - c1.x) * (c2.y + c1.y);
    }
    return (sum >= 0);
}


utils.guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

utils.raycastAllVerticesObject = function(vertices, matrix, position,objects) {
    for (var vertexIndex = 0; vertexIndex < vertices.length; vertexIndex++) {       
        var localVertex = vertices[vertexIndex].clone();
        //var globalVertex = matrix.multiplyVector3(localVertex);
        var globalVertex = localVertex.applyMatrix4( matrix );
        var directionVector = globalVertex.sub( position );

        var raycaster = new THREE.Raycaster(position, directionVector.clone().normalize());
        var collisionResults = raycaster.intersectObjects( objects );
        if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
        {
            return false;
        }
    }
    return true;
}


// both arguments are arrays of corners with x,y attributes
utils.polygonPolygonIntersect = function(firstCorners, secondCorners,scene) {
    scene = scene || null;
    for (var i = 0; i < firstCorners.length; i++) {
        var firstCorner = firstCorners[i],
            secondCorner;
        if (i == firstCorners.length-1) {
            secondCorner = firstCorners[0];
        } else {
            secondCorner = firstCorners[i+1];
        }

        if (utils.linePolygonIntersect(
            firstCorner.x, firstCorner.y,
            secondCorner.x, secondCorner.y,
            secondCorners,scene)) {
                
            
            return true;
        }
    }
    return false;
}

// corners is an array of points with x,y attributes
utils.linePolygonIntersect = function(x1,y1,x2,y2,corners,scene) {
    scene = scene || null;
    for (var i = 0; i < corners.length; i++) {
        var firstCorner = corners[i],
            secondCorner;
        if (i == corners.length-1) {
            secondCorner = corners[0];
        } else {
            secondCorner = corners[i+1];
        }

        if (utils.lineLineIntersect(x1,y1,x2,y2,
            firstCorner.x, firstCorner.y,
            secondCorner.x, secondCorner.y)) {
                
            //utils.pintarLinea(x1,y1,x2,y2,scene,"blue");
            //utils.pintarLinea(firstCorner.x,firstCorner.y,secondCorner.x,secondCorner.y,scene,"blue");
            return true;
        }
    }
    return false;
}



utils.lineLineIntersect = function(x1,y1,x2,y2, x3,y3,x4,y4) {
    function CCW(p1, p2, p3) {
        var a = p1.x,
            b = p1.y,
            c = p2.x,
            d = p2.y,
            e = p3.x,
            f = p3.y;
        return (f - b) * (c - a) > (d - b) * (e - a);
    }

    var p1 = {x:x1, y:y1},
        p2 = {x:x2, y:y2},
        p3 = {x:x3, y:y3},
        p4 = {x:x4, y:y4};
    return (CCW(p1, p3, p4) != CCW(p2, p3, p4)) && (CCW(p1, p2, p3) != CCW(p1, p2, p4));
}


// corners is an array of points with x,y attributes
// startX and startY are start coords for raycast
utils.pointInPolygon = function(x,y,corners,startX,startY,scene) {
    scene = scene || null;
    // startX = startX || 0;
    // startY = startY || 0;
    // ensure that point(startX, startY) is outside the polygon consists of
	// corners
        
    if (scene != null) {
        
        var line = scene.getScene().getObjectByName("linea");
        while (line != null) { 
            scene.remove(line);
            line = scene.getScene().getObjectByName("linea");
        }
    }
    var minx = 0,
        miny = 0;
    if(startX === undefined || startY === undefined){
        for (var i = 0; i < corners.length; i++) {
            minx = Math.min(minx, corners[i].x);
            miny = Math.min(minx, corners[i].y);
        }
        startX = minx - 10;
        startY = miny - 10;
    }

    var intersects = 0;
    for (var i = 0; i < corners.length; i++) {
        var firstCorner = corners[i],
            secondCorner;
        if (i == corners.length-1) {
            secondCorner = corners[0];
        } else {
            secondCorner = corners[i+1];
        }

        // TEMP
        // Creo la linea desde el corner 1
        //utils.pintarLinea(startX,startY,x,y,scene,"red");
        
        
        if (utils.lineLineIntersect(startX,startY,x,y,
            firstCorner.x, firstCorner.y,
            secondCorner.x, secondCorner.y)) {
            //utils.pintarLinea(firstCorner.x,firstCorner.y,secondCorner.x,secondCorner.y,scene,"red");    
                
                
            intersects++;
        }
    }
    // odd intersections means the point is in the polygon
    //console.log("intersects: " + intersects);

    return ((intersects%2) == 1);
}
utils.pintarLinea = function(x1,y1,x2,y2,scene,color) {
    if (scene != null) {
        var material = new THREE.LineBasicMaterial({
            color: color
        });
        var fc1 = new THREE.Vector3();
        fc1.x = x1; 
        fc1.y = 126
        fc1.z = y1;

        var dc1 = new THREE.Vector3();
        dc1.x = x2; 
        dc1.y = 126;
        dc1.z = y2;

        //var geometry = new THREE.Geometry();
        //geometry.vertices.push(fc1);
        //geometry.vertices.push(dc1);

        const points = [];
        points.push(fc1);
        points.push(dc1);
        var geometry = new THREE.BufferGeometry().setFromPoints( points );

        lc1 = new THREE.Line(geometry, material);	
        lc1.name = "linea";
        scene.add(lc1);
    }
}

// checks if all corners of insideCorners are inside the polygon described by
// outsideCorners
utils.polygonInsidePolygon = function(insideCorners, outsideCorners, startX, startY) {
    startX = startX || 0;
    startY = startY || 0;

    // console.log("checking polygon in polygon");
    utils.forEach( outsideCorners, function(c) { console.log(c.x + ", " + c.y)});

    for (var i = 0; i < insideCorners.length; i++) {
        // console.log("checking point: " + insideCorners[i].x + ", " +
		// insideCorners[i].y);

        if (!utils.pointInPolygon(
            insideCorners[i].x, insideCorners[i].y,
            outsideCorners,
            startX, startY)) {
            return false;
        }
    }
    return true;
}

// checks if any corners of firstCorners is inside the polygon described by
// secondCorners
utils.polygonOutsidePolygon = function(insideCorners, outsideCorners, startX, startY) {
    //startX = startX || 0;
    //startY = startY || 0;

    for (var i = 0; i < insideCorners.length; i++) {
        if (utils.pointInPolygon(
            insideCorners[i].x, insideCorners[i].y,
            outsideCorners,
            startX, startY)) {
            return false;
        }
    }
    return true;
}

utils.pointDistanceInaLine = function(fromx, fromy, tox, toy, r) {
    var angle = Math.atan2(toy-fromy,tox-fromx);
    var x = -r*Math.cos(angle) + tox;
    var y = -r*Math.sin(angle) + toy;
    return {
        x: x,
        y: y
    }
}

utils.perpendicularPointOfaLine = function(fromx, fromy, tox, toy, r) {
    var angle = Math.atan2(toy-fromy,tox-fromx);
    var x = r*Math.sin(angle) + tox;
    var y = r*(-Math.cos(angle)) + toy;
    return {
        x: x,
        y: y
    }
}

// CCW angle from v1 to v2
  // v1 and v2 are HalfEdges
utils.commonPointTwoLines = function(v1start, v1end, v2start,v2end,offset) {
    // make the best of things if we dont have prev or next

    var v1startX = v1start.x;
    var v1startY = v1start.y;
    var v1endX = v1end.x;
    var v1endY = v1end.y;
    

    var v2startX = v2start.x;
    var v2startY = v2start.y;
    var v2endX = v2end.x;
    var v2endY = v2end.y;      


    // CCW angle between edges
    var theta = utils.angle2pi(
      v1startX- v1endX,
      v1startY - v1endY,
      v2endX - v1endX,
      v2endY - v1endY);

    // cosine and sine of half angle
    var cs = Math.cos(theta / 2.0);
    var sn = Math.sin(theta / 2.0);

    // rotate v2
    var v2dx = v2endX - v2startX;
    var v2dy = v2endY - v2startY;

    var vx = v2dx * cs - v2dy * sn;
    var vy = v2dx * sn + v2dy * cs;

    // normalize
    var mag = utils.distance(0, 0, vx, vy);
    var desiredMag = offset / sn;
    var scalar = desiredMag / mag;

    var halfAngleVector = {
      x: vx * scalar,
      y: vy * scalar
    }

    return halfAngleVector;
  }

utils.lineIntersect2 = function(v1start, v1end, v2start,v2end) {
    
    var line1StartX = v1start.x;
    var line1StartY = v1start.y;
    var line1EndX = v1end.x;
    var line1EndY = v1end.y;
    var line2StartX = v2start.x;
    var line2StartY = v2start.y;
    var line2EndX = v2end.x;
    var line2EndY = v2end.y;
    
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };
    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
    if (denominator == 0) {
        return result;
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));
/*
        // it is worth noting that this should be the same as:
        x = line2StartX + (b * (line2EndX - line2StartX));
        y = line2StartX + (b * (line2EndY - line2StartY));
        */
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
        result.onLine1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
        result.onLine2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
}

utils.lineIntersect = function(v1start, v1end, v2start,v2end){
    //v1start, v1end, v2start,v2end
  var am = (v1start.y-v1end.y)/(v1start.x-v1end.x + Number.EPSILON);  // slope of line 1
  var bm = (v2start.y-v2end.y)/(v2start.x-v2end.x + Number.EPSILON);  // slope of line 2
  return am - bm < Number.EPSILON ? undefined
                                    : { x: (am * v1start.x - bm*v2start.x + v2start.y - v1start.y) / (am - bm),
                                        y: (am*bm*(v2start.x-v1start.x) + bm*v1start.y - am*v2start.y) / (bm - am)};
}

// arrays

utils.forEach = function(array, action) {
  for (var i = 0; i < array.length; i++) {
    action(array[i]);
  }
}

utils.forEachIndexed = function(array, action) {
  for (var i = 0; i < array.length; i++) {
    action(i, array[i]);
  }
}

utils.map = function(array, func) {
  var result = [];
  utils.forEach(array, function (element) {
    result.push(func(element));
  });
  return result;
}

// remove elements in array if func(element) returns true
utils.removeIf  = function(array, func) {
  var result = [];
    utils.forEach(array, function (element) {
    if (!func(element)) {
      result.push(element);
    }
  });
  return result;
}

// shift the items in an array by shift (positive integer)
utils.cycle = function(arr, shift) {
  var ret = arr.slice(0);
  for (var i = 0; i < shift; i++) {
    var tmp = ret.shift();
    ret.push(tmp);
  }
  return ret;
}

// returns in the unique elemnts in arr
utils.unique = function(arr, hashFunc) {
  var results = [];
  var map = {};
    for (var i = 0; i < arr.length; i++) {
      if (!map.hasOwnProperty(arr[i])) {
        results.push(arr[i]);
        map[hashFunc(arr[i])] = true;
      }
    }
    return results; 
}

utils.removeValue = function(arr, value) {
  for(var i = arr.length - 1; i >= 0; i--) {
    if(arr[i] === value) {
       arr.splice(i, 1);
    }
  }
}

// checks if value is in array
utils.hasValue = function(array, value) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === value) {
      return true;
    }
  }
  return false;
}

// subtracts the elements in subArray from array
utils.subtract = function(array, subArray) {
  return utils.removeIf(array, function(el) {
    return utils.hasValue(subArray, el);
  });
}

utils.getIndicesParaActivar = function(nombre, lista, tiradores) {
    var idxs = [];
    for (var i = 0; i < lista.length; i++){
        if (nombre == lista[i]) {
            idxs.push(tiradores[i]);
        }
    }
    return idxs;
}

utils.getGrupoTirador = function(name) {
    var modelo = name.split(";");
    seleccionado = "";
    if (modelo.length > 2) {
        seleccionado = modelo[2].trim();
    } else {
        console.log("Error en getGrupoTirador, el nombre tiene menos de 3 elementos en el material");
    }
    return seleccionado; 
}

utils.palabrasSuperfluas = function() {
    return ['FONDO', 'CENTRO', 'MOLDURA', 'ESPEJO', 'DETALLE', 'TIRAD0R', 
            'SUP', 'MED', 'INF', 'PANEL', 'DCH', 'IZQ', 'PLAFON 1', 'PLAFON 2', 'PLAFON 3'];
}

utils.filtrarGrupo = function(grupo,superfluas) {
    grupo = grupo.toUpperCase();
    
    var idxAlm = grupo.indexOf('#');
    if (idxAlm != -1) {
        // Filtramos por la almohadilla
        grupo = grupo.substr(0, idxAlm); 
    } else {
        var palabrasSuperfluas = superfluas;
        //console.log("[FILTRARGRUPO] " + grupo);
        //console.log("[FILTRARGRUPO] Superfluas: " + superfluas);
        for (var i=0; i<palabrasSuperfluas.length; i++) {
            //console.log("[FILTRARGRUPO] palSupATestear: " + palabrasSuperfluas[i]);
            if (grupo.search(palabrasSuperfluas[i]) != -1) {
                //console.log("[FILTRARGRUPO] palSuperflua: " + palabrasSuperfluas[i]);
                grupo = grupo.replace(palabrasSuperfluas[i],"").trim();
             }
        }
    }
    //console.log("[FILTRARGRUPO] Salida " + grupo);
    return grupo;
}

utils.getGruposDeBloque = function(materials, bloque,superfluas) {
    var grupos = [];
    for (var i = 0; i < materials.length; i++){
        var mat = materials[i];	
        if (mat.name.search(bloque) != -1) {
           //console.log("getGDB: Superfluas: " + superfluas); 
           var g = utils.filtrarGrupo(utils.getGrupoTirador(mat.name),superfluas);
           //console.log("getGDB: " + mat.name + " - " + bloque + " g: " + g);
           if (g !== null && g !== "") {
                if (grupos.indexOf(g) == -1) {
                    grupos.push(g);
                }
           }
        }
    }
    console.log(grupos);
    return grupos;
}

utils.getGruposDeTiradores = function(materials,superfluas) {
    var grupos = [];
    for (var i = 0; i < materials.length; i++){
        var mat = materials[i];	
        if (mat.name.search("TIRADOR") != -1) {
           var g = utils.filtrarGrupo(utils.getGrupoTirador(mat.name),superfluas);
           if (grupos.indexOf(g) == -1) {
               grupos.push(g);
           }
        }
    }
    console.log(grupos);
    return grupos;
}

utils.getIndicesPorGrupo = function(materials, grupo) {
    var idxGrupo = [];
    for (var i = 0; i < materials.length; i++){
        var mat = materials[i];	
        if ((mat.name.search("TIRADOR") != -1) && (mat.name.search(grupo) != -1)) {
           idxGrupo.push(i);
        }
    }
    return idxGrupo;    
}

utils.traducir = function(cadena,item) {
    var cadena_arr = cadena.split(" ");
    for (var i=0;i < cadena_arr.length; i++) {
        var key = cadena_arr[i];
        value = item.aliasPalabra(key).toLowerCase();
        cadena = cadena.replace(key,value);
    }
    return cadena;
}

utils.traducirNombre = function(cadena,item) {
    var cadena_arr = cadena.trim().split(" ");
    for (var i=0;i < cadena_arr.length; i++) {
        var key = cadena_arr[i];
        //console.log("KEY: " + key + " " + item.aliasPalabra(key));
        if (key == item.aliasPalabra(key)) {
            value = key;
        } else {
            value = item.aliasPalabra(key).toLowerCase();
        }
        cadena = cadena.replace(key,value);
    }
    return cadena;
}

utils.bloqueEncontrado = function(name,bloques) {
    var enc = -1;
    for (var i = 0; i < bloques.length; i++){
        if (name.search(bloques[i]) != -1) {
            enc = 1;
            break;
        }
    }
    return enc;
}

utils.duplicarConjunto = function(selecc) {
    var sal = [];
    for (var i=0;i<selecc.length;i++) {
        sal.push(selecc[i]);
    }
    return sal;
}
utils.eliminarRepetidos = function(selecc) {
    var sal = [];
    var sal2 = [];
    for (var i=0;i<selecc.length;i++) {
        if (sal.indexOf(selecc[i]) == -1) {
            sal.push(selecc[i]);
        }
    }
    
    var sal2 = utils.duplicarConjunto(sal);
    var sal3 = [];
    for (var i=0;i<sal2.length;i++) {
        
        var cont = 0;
        for (var j=0;j<sal.length;j++) {
            if (sal[j].search(sal2[i]) != -1) {
                cont++;
                console.log("ELIMINAR_REPETIDOS: " + sal2[i] + " " + cont);
            }
        }
        if (cont < 2) {
            sal3.push(sal2[i]);
        }
    }
    
    return sal3;
}

utils.agruparPiezasVariosMaterials = function(selecc,item) {
    var sal = [];
    var desc = [];
    
    for (var i=0;i<selecc.length;i++) {
        console.log("agruparPiezasVariosMaterials " + i + ": " + selecc[i]);
        var l = selecc[i].split(":");
        if (l.length > 1) {
            l = l[1].split("<b>");
            if (l.length > 1) {
                var cadena = l[0].trim();
                console.log(cadena);
                if (desc.indexOf(cadena) == -1) {
                    desc.push(cadena);
                }
            }
        } 
    }
    if (desc.length < selecc.length) {
        var alFinal = [];
        var alInicio = [];
        
        selecc = utils.separarCadenaSuperfluas(selecc,item.superfluas);
        // Hay varios materials para una misma pieza
        for (var i=0;i<selecc.length;i++) {
            var nueva = utils.modificarCadenaSuperfluas(selecc[i],item);
            if (nueva.length > 0) {
                if (nueva.length != selecc[i].length) {
                    alFinal.push(nueva);
                } else {
                    alInicio.push(nueva);
                }
            }
        }
        for (var i=0;i<alInicio.length;i++) {
            sal.push(alInicio[i]);
        }
        for (var i=0;i<alFinal.length;i++) {
            sal.push(alFinal[i]);
        }
        
    } else {
        // Lo dejo como estaba
        sal = selecc;
    }
        
    
    return sal;
}

utils.eliminarPalabra = function(cadena, palabra) {
    
    palabra = palabra.toLowerCase();   
    var sal = cadena.split(" " + palabra);
    
    console.log(sal)
    
    return sal.join("");
}

utils.indicesSuperfluas = function(palabras, superflua) {
    var idx = [];
    for (var i=0;i<palabras.length;i++) {
        if ((palabras[i].toLowerCase().search(superflua.toLowerCase())) != -1) {
            idx.push(i);
        }
    }
    return idx;
}

utils.componerCadena = function(palabras,idxFind,superflua) {
    var superflua = superflua || null;
    var cad = "[";
    for (var i=0;i<idxFind.length;i++) {
        var pal = palabras[idxFind[i]];
        i//f (superflua != null) {
        //    pal = pal.replace(superflua,"");
        //}
        cad = cad + pal.trim() + "; ";
    }
    cad = cad.substr(0,cad.length-2);
    cad += "]";
    return cad;
}



utils.dividirPorSuperfluas = function(cadena,superfluas) {
    var sal = [];
    // Quitamos los corchetes si existen
    var idxCorcheteIni = cadena.indexOf("[");
    if (idxCorcheteIni == 0) {
        cadena = cadena.substr(1);
    }
    var idxCorcheteFin = cadena.indexOf("]");
    if (idxCorcheteFin == cadena.length-1) {
        cadena = cadena.substr(0, cadena.length-1);
    }
    console.log("sin corchetes: " + cadena);
    var palabras = cadena.split(";");
    
    var idxFind = [];
    var palabrasSuperfluas = superfluas;
    console.log("palabrasSuperfluas: " + superfluas);
    for (var i=0; i<palabrasSuperfluas.length; i++) {
        var idxFindTemp = utils.indicesSuperfluas(palabras,palabrasSuperfluas[i]);
        if (idxFindTemp.length > 0) {
            console.log("idxFindTemp: " + idxFindTemp);
            var cad = utils.componerCadena(palabras,idxFindTemp,palabrasSuperfluas[i]);
            console.log("tras componerCadena: " + cad);
            sal.push(cad);
            idxFind = idxFind.concat(idxFindTemp);
        }
    }
    var idxNotFind = [];
    for (var i=0;i<palabras.length;i++) {
        if (idxFind.indexOf(i) == -1) {
            idxNotFind.push(i);
        }
    }
    console.log("idxNotFind: " + idxNotFind);
    if (idxNotFind.length > 0) {
        var cad = utils.componerCadena(palabras,idxNotFind);
        console.log("tras componerCadena Not Find: " + cad);
        sal.push(cad);
    }
    return sal;
}

utils.separarCadenaSuperfluas = function(selecc,superfluas) {
    sal = [];
    for (var i=0;i<selecc.length;i++) {
        cadena = selecc[i];
        // Quitamos la almohadilla para la descripcion del presupuesto
        var idx = -1;
        var sustitucion = "";
        var l_cadena = cadena.split(":"); 
        if ((l_cadena.length > 1)) {
            cadenaUpper = l_cadena[0];
            console.log("modificarCadenasuper: " + cadenaUpper);
            var S = utils.dividirPorSuperfluas(cadenaUpper,superfluas);
            for (var j=0;j<S.length;j++) {
                console.log("S[j]: " + S[j]);
                var cadN = S[j] + ": " + l_cadena[1];
                console.log("cadN: " + cadN);
                sal.push(cadN);
            }
            
        } else {
            sal.push(cadena);
        }
    }
    return sal;
    
}

utils.modificarCadenaSuperfluas = function(cadena,item) {
    console.log("modificarCadenaSuperfluas: " + cadena);
    var cadenaUpper = cadena.toUpperCase();
    var idx = -1;
    var sustitucion = "";
    var sal = "";
    var palabrasSuperfluas = item.superfluas;
    var l_cadenaUpper = cadenaUpper.split(":"); 
    if ((l_cadenaUpper.length > 1)) {
        cadenaUpper = l_cadenaUpper[0];
        console.log("modificarCadenasuper: " + cadenaUpper);
        
        for (var i=0; i<palabrasSuperfluas.length; i++) {
            if (cadenaUpper.search(palabrasSuperfluas[i].toUpperCase()) != -1) {
                idx = i;
                var cadena2 = cadena.split(":");
                 console.log("EliminarPalabra: " + cadena2[0] + " --- " + palabrasSuperfluas[i]);
                sustitucion = utils.eliminarPalabra(cadena2[0], palabrasSuperfluas[i]);
                console.log("EliminarPalabra: " + sustitucion + " --- " + cadena2[0]);
                break;
             }
        }
    }
    if (idx != -1) {
        var palabra = item.aliasPalabra(palabrasSuperfluas[idx].toLowerCase());
        palabra = palabra[0].toUpperCase() + palabra.substring(1);
        var resto = cadena.split("<b>");
        console.log("resto: " + resto);
        if (resto.length > 1) {
            resto = "<b>" + resto[1];
            sal = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + palabra + " " + sustitucion + ": " + resto;
        }
    } else {
        sal =  cadena;
    }
    console.log("SAL: " + sal);
    return sal;
}

utils.removeAlmohadilla = function(cad) {
   
    //Quitamos la almohadilla si existe
    if (cad.indexOf('#') != -1) {
        cad = cad.replace("#","");
    }
    return cad;
}

utils.removeCaracter = function(cad,car) {
   
    //Quitamos la almohadilla si existe
    if (cad.indexOf(car) != -1) {
        cad = cad.replace(car,"");
    }
    return cad;
}

utils.agruparKeySuperflua = function(key, item) {
    key = key.toLowerCase();
    var palabrasSuperfluas = item.superfluas;
    var nuevaKey = "";
    for (var i=0; i<palabrasSuperfluas.length; i++) {
        if (key.search(palabrasSuperfluas[i].toLowerCase()) != -1) {
            console.log("[agruparKeySuperflua] key: " + key + ", " + palabrasSuperfluas[i].toLowerCase());
            var elem = key.replace(palabrasSuperfluas[i].toLowerCase(), "").trim();
            elem = utils.primeraMayuscula(elem);
            nuevaKey = utils.primeraMayuscula(item.aliasPalabra(palabrasSuperfluas[i])) + " (" + elem + ")";
            break;
         }
    }
    return nuevaKey;
}

utils.quitarSuperflua = function(key, palabrasSuperfluas) {
    key = key.toLowerCase();
    for (var i=0; i<palabrasSuperfluas.length; i++) {
        if (key.search(palabrasSuperfluas[i].toLowerCase()) != -1) {
            var key = key.replace(palabrasSuperfluas[i].toLowerCase(), "").trim();
            break;
         }
    }
    return key;
}



utils.separarPorGruposYSuperfluas = function(selecc,item) {
    var sal = [];
    var alInicio = [];
    var alFinal = [];
    var desc = [];
    
    for (var i=0;i<selecc.length;i++) {
        console.log("separarPorGruposYSuperfluas " + i + ": " + selecc[i]);
        var l = selecc[i].split(":");
        if (l.length > 1) {
            var key = l[0];
            console.log("[separarPorGruposYSuperfluas] key: " + key + ", item:");
            console.log(item);
            var nuevaKey = utils.agruparKeySuperflua(key,item);
            if (nuevaKey != "") {
                var nuevaDesc;
                var nuevaKeySinSuperflua = utils.primeraMayuscula(utils.quitarSuperflua(key,item.superfluas));
                ln = l[1].split("<b>");
                if (ln.length > 1) {
                    var cadena = ln[0].trim();
                    nuevaDesc = nuevaKeySinSuperflua  + ": " + cadena;
                    alInicio.push(nuevaDesc);
                    nuevaDesc = nuevaKey + ": <b>" + ln[1].trim();
                    alFinal.push(nuevaDesc);
                } else {
                    nuevaDesc = nuevaKeySinSuperflua  + ": " + l[1].trim();
                    alInicio.push(nuevaDesc);
                }
            } else {
                alInicio.push(utils.primeraMayuscula(selecc[i].trim()));
            }
        } 
    }
    
    for (var i=0;i<alInicio.length;i++) {
        sal.push(alInicio[i]);
    }
    for (var i=0;i<alFinal.length;i++) {
        sal.push(alFinal[i]);
    }
    
    return sal;
}

utils.primeraMayuscula = function(cadena) {
    return cadena[0].toUpperCase() + cadena.substring(1);
}

utils.agruparSeleccionados = function(selecc) {

    var sal = [];
    var corresp = new Map();
    for (var i=0;i<selecc.length;i++) {
        var l = selecc[i].split(":");
        if (l.length > 1) {
            console.log("l:" + l);
            var cadena = l[1].trim();
            console.log(cadena);
            var v = corresp.get(cadena);
            if (v == null) {
                v = [];
            }
            v.push(l[0].trim());
            console.log("v: " + v + " con long. " + v.length);
            corresp.set(cadena,v);
        } else {
            sal.push(l[0].trim());
        }
        
    }
    
    for (const [key, value] of corresp.entries()) {
        console.log("key: " + key + " value: " + value);
        if (value.length == 1) {
            sal.push(value[0] + ": " + key);
        } else {
            var cadena = "[";
            for(var i=0;i<value.length-1;i++) {
                cadena += value[i] + "; "; 
            }
            cadena += value[value.length-1] + "]";
            sal.push(cadena +  ": " + key);
        }
        
    }
    return sal;
    
}

utils.getBloque = function(name,bloques) {
    var enc = "";
    for (var i = 0; i < bloques.length; i++){
        if (name.search(bloques[i]) != -1) {
            enc = bloques[i];
            break;
        }
    }
    if (enc == "") {
        console.log("getBloque: no se encuentran bloques en: " + name);
    }
    return enc;
}

utils.getIndicesPorGrupo_bloque = function(materials, grupo, bloque) {
    var idxGrupo = [];
    for (var i = 0; i < materials.length; i++){
        var mat = materials[i];	
        if ((mat.name.search(bloque) != -1) && (mat.name.search(grupo) != -1)) {
           idxGrupo.push(i);
        }
    }
    return idxGrupo;    
}

utils.getIdxItemActivoPorGrupo = function(materials, idxGrupos) {
    var idxActivo = [];
    for (var i = 0; i < idxGrupos.length; i++){
        var mat = materials[idxGrupos[i]];
        //console.log("Nombre: " + mat.name + " T: " + mat.visible);
        if (mat.visible == true) {
           idxActivo.push(idxGrupos[i]);
        }
    }
    if (idxActivo.length == 0) {
        console.log("Error en getIdxItemActivoPorGrupo, no hay item activo en el grupo");
    }
    return idxActivo;
} 

utils.getIdxTiradorActivoPorGrupo = function(materials, idxGrupos) {
    var idxActivo = -1;
    for (var i = 0; i < idxGrupos.length; i++){
        var mat = materials[idxGrupos[i]];
        //console.log("Nombre: " + mat.name + " T: " + mat.visible);
        if (mat.visible == true) {
           idxActivo = idxGrupos[i];
        }
    }
    if (idxActivo == -1) {
        console.log("Error en getIdxTiradorActivoPorGrupo, no hay tirador activo en el grupo");
    }
    return idxActivo;
}

utils.seVende = function(item) {
    var puntos = item.metadata.puntos;
    if (puntos != "") {
        puntos = parseFloat(puntos);
        if (puntos > 0) {
            return true;
        }
    }
    return false;
}

utils.getMode = function(myArray) {
    const mode = (myArray) =>
        myArray.reduce(
          (a,b,i,arr)=>
           (arr.filter(v=>v===a).length>=arr.filter(v=>v===b).length?a:b),
          null);
    return mode(myArray);
}

utils.getPosicionArrayPunto = function (pts, pt) {
    var idx = -1;
    for (var i=0; i < pts.length; i++) {
        if ((Math.abs(pts[i][0]-pt[0]) < 0.0001) && (Math.abs(pts[i][1] -pt[1]) < 0.0001)) {
            idx = i;
            break;
        } 
    }
    return idx;
}

utils.comenzarPor = function (pts, pt) {
    var pts2 = [];
    var idx = utils.getPosicionArrayPunto(pts, pt);
    if (idx != -1) {
        for (var i = idx; i < pts.length; i++) {
            pts2.push(pts[i])
        }
        for (var i = 0; i < idx; i++) {
            pts2.push(pts[i])
        }
        return pts2;
    } else {
        return pts;
    }
}

utils.removeDuplicates2 = function (pointset) {
    var pointset2 = [];

    pointset.map(function(value, index, arr){
        var enc = false;
        for (var i=0; i < pointset2.length; i++) {
            if ((Math.abs(pointset2[i].x -value.x) < 0.0001) && (Math.abs(pointset2[i].y -value.y) < 0.0001)) {
                enc = true;
                break;
            } 
        }
        if (!enc) {
            pointset2.push({ x: value.x, y: value.y});
        }
    });
    return pointset2;
}

utils.removeDuplicates = function (pointset) {
    var pointset2 = [];

    pointset.map(function(value, index, arr){
        var enc = false;
        for (var i=0; i < pointset2.length; i++) {
            if ((Math.abs(pointset2[i][0]-value[0]) < 0.0001) && (Math.abs(pointset2[i][1] -value[1]) < 0.0001)) {
                enc = true;
                break;
            } 
        }
        if (!enc) {
            pointset2.push(value);
        }
    });
    return pointset2;
}

utils.sortPointsByRef = function (pointArray, pointRef) {
    function simpleDist(pointA, pointB) {
        var x = pointA.x - pointB.x,
            y = pointA.y - pointB.y;

        return Math.sqrt(x*x + y*y);
    }

    var sortByDist = (function() {
        var comparator = function(a,b) { return a.value - b.value; };

        return function (pointRef, pointArray) {
          var reorder = function(e) { return pointArray[e.index]; };
          var distanceFromArray = function(b,i) {
            return { index: i, value: simpleDist(pointRef, b) };
          };
          return pointArray.map(distanceFromArray).sort(comparator).map(reorder);
        };
    }());
    return sortByDist(pointRef,pointArray);
}

utils.getCameraDirection = function(camera,x,y,z,eje_elim) {
      
      eje_elim = eje_elim || null;
      
      var despl = new THREE.Vector3(x,y,z);
      var cero = new THREE.Vector3(0,0,0);
      
      console.log("[getCameraDirection]");
      console.log("cero");
      console.log(cero);
      var cero_w = camera.localToWorld(cero);
      console.log(cero_w);
      
      console.log("despl");
      console.log(despl);
      var despl_w = camera.localToWorld(despl);
      console.log(despl_w);
      
      var res = {
          x:0,
          y:0,
          z:0
      }
      
      var dif = {
        x: despl_w.x - cero_w.x,
        y: despl_w.y - cero_w.y,
        z: despl_w.z - cero_w.z
      }
     
      if (eje_elim != null) {
        if (eje_elim == 'x') {
            dif.x = 0;
        } else if (eje_elim == 'y') {
            dif.y = 0;
        } else if (eje_elim == 'z') {
            dif.z = 0;
        }
      }
      
      console.log(dif);
      
      var max = Math.max(Math.abs(dif.x), Math.abs(dif.y), Math.abs(dif.z));
       console.log(max);
      if (Math.abs(dif.x) == max) res.x = Math.sign(dif.x);
      else if (Math.abs(dif.y) == max) res.y = Math.sign(dif.y);
      else if (Math.abs(dif.z) == max) res.z = Math.sign(dif.z);
      
      console.log(res);
      return res;
  }

utils.procesarMeshes = function(gltf) {
    
    var group = new THREE.Group();
    gltf.scene.traverse( function ( child ) {
        if ( child.isMesh ) {
            //materials.push(new THREE.MeshPhongMaterial({color: 0x55B663}));
            group.add( child.clone());
        }
    } );
    /*for (var i=0; i < gltf.scene.children.length; i++) {
        group.add( gltf.scene.children[i].clone());
    }*/
    return group;
    
  }

utils.procesarMaterials_raw = function(gltf) {
    var materials = [];
    gltf.scene.traverse( function ( child ) {
        if ( child.isMesh ) {
            //materials.push(new THREE.MeshPhongMaterial({color: 0x55B663}));
            materials.push( child.material );
        }
    } );
    return materials;
  }

utils.procesarMaterials = function(gltf) {
    
    var materials_raw = utils.procesarMaterials_raw(gltf);
    //return materials_raw;
    var materials = [];
    for (var i=materials_raw.length-2; i >= 0; i--) {
        materials.push( materials_raw[i] );
        
    }
     materials.push( materials_raw[materials_raw.length-1] );
    
    return materials;
  }

utils.replaceMaterialsUnderscoreSymbol = function(materials) {
    for (var i = 0; i < materials.length; i++){
        var mat = materials[i];	
        mat.name = mat.name.replaceAll("_"," ");
    }
    return materials;
}

utils.writeDebug = function(line) {
    var DEBUG = true;
    if (DEBUG) {        
        console.log(line);
    }
}

utils.setItemAltitude = function(item, altitude) {
    const itemInstance = typeof item;

    switch (itemInstance) {
        case FloorItem:
        case FloorItemGroup:
        case OnFloorItem:
        case OnFloorGroup:
            item.position.y = altitude + item.desfaseAltura; 
            break;
        case WallItem:
        case WallItemGroup:
        case InWallItem:
        case InWallItemGroup:
        case InWallFloorItem:
        case InWallFloorItemGroup:
            item.position.y = item.currentWallEdge;
            break;
        case WallFloorItem:
            item.position.y = item.currentWallEdge + item.desfaseAltura;
            break;
    }
}

// utils.getItemRoom = function(item) {
//     const itemInstance = typeof item;

//     switch (itemInstance) {
//         case FloorItem:
//         case FloorItemGroup:
//         case OnFloorItem:
//         case OnFloorGroup:
//             return item.room;
//         case WallItem:
//         case WallItemGroup:
//         case InWallItem:
//         case InWallItemGroup:
//         case InWallFloorItem:
//         case InWallFloorItemGroup:
//             return item.room;
//         case WallFloorItem:
//             return item.room;
//     }

// }

utils.dumpVec3 = function(v3, precision = 3) {
  return `${v3.x.toFixed(precision)}, ${v3.y.toFixed(precision)}, ${v3.z.toFixed(precision)}`;
}

utils.dumpObject = function(obj, lines = [], isLast = true, prefix = '') {
  const localPrefix = isLast ? '└─' : '├─';
  lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
  const dataPrefix = obj.children.length
     ? (isLast ? '  │ ' : '│ │ ')
     : (isLast ? '    ' : '│   ');
  lines.push(`${prefix}${dataPrefix}  pos: ${utils.dumpVec3(obj.position)}`);
  lines.push(`${prefix}${dataPrefix}  rot: ${utils.dumpVec3(obj.rotation)}`);
  lines.push(`${prefix}${dataPrefix}  scl: ${utils.dumpVec3(obj.scale)}`);
  const newPrefix = prefix + (isLast ? '  ' : '│ ');
  const lastNdx = obj.children.length - 1;
  obj.children.forEach((child, ndx) => {
    const isLast = ndx === lastNdx;
    utils.dumpObject(child, lines, isLast, newPrefix);
  });
  return lines;
};

utils.controllerEncontrado = function(gui, name) {
    var i = 0;
    var enc = false;
    while ((i < gui.controllers.length) && !enc) {
        if (gui.controllers[i]._name === name) {
            enc = true; 
        } else {
            i++;
        }
    }
    return enc;
};
        
utils.removeController = function(gui, name) {
    var i = 0;
    var enc = false;
    while ((i < gui.controllers.length) && !enc) {
        if (gui.controllers[i]._name === name) {
            gui.controllers[i].destroy();
            return;
        } else {
            i++;
        }
    }

};

// SUBORDINADAS
utils.isBloqueDependiente = function(bloque,bloques) {
    
    
    const blq = bloques.find(elemento => elemento.descripcion === bloque);
    if (blq !== undefined) {
        var itBlqs = blq.items;
        for (var j = 0; j < itBlqs.length; j++) {
            var itemBlq = itBlqs[j];
            var dependencias = itemBlq.dependencias;
            if (dependencias.length > 0) {
                return true;
            }
        }
    }
    return false;
};

utils.getPalabraPadre = function(palabras,grupo_pieza) {
    // Eliminar "Pieza " independientemente de las mayúsculas o minúsculas
    var palabraPadre = null;
    grupo_pieza = grupo_pieza.replace(/pieza /i, '');
    var pal = palabras.find(elemento => elemento.descripcion === grupo_pieza);
    if (pal !== undefined) {
        if (pal.dependencias.length > 0) {
            const id_pal_padre = pal.dependencias[0];
            const pal_padre = palabras.find(elemento => elemento.idPalabra === id_pal_padre);
             if (pal_padre !== undefined) {
                 palabraPadre = pal_padre.descripcion;
             }
        }
    }
    return palabraPadre;
}

utils.getPalabrasHijas = function(palabras,grupo_pieza) {
    // Eliminar "Pieza " independientemente de las mayúsculas o minúsculas
    var palabrasHijas = [];
    grupo_pieza = grupo_pieza.replace(/pieza /i, '');
    
    // Obtenemos la palabra padre
    var pal_padre = palabras.find(elemento => elemento.descripcion === grupo_pieza);
    if (pal_padre !== undefined) {
        
        // Recorremos el resto de palabras para comprobar si hay alguna hija de la palabra padre
        for (var i = 0; i < palabras.length; i++) {
            var tempPalabra = palabras[i];
            if ((tempPalabra.idPalabra !== pal_padre.idPalabra) && (tempPalabra.dependencias.length > 0)) {
                const pal_hija = tempPalabra.dependencias.find(elemento => elemento === pal_padre.idPalabra);
                if (pal_hija !== undefined) {
                    palabrasHijas.push(tempPalabra.descripcion);
                }
            }
        }
    }
    return palabrasHijas;
}

utils.bloqueHijoDependeBloquePadre = function(bloques,itemBloquePadre,itemBloqueHijo) {
  
    var blqPadreNameRaw = itemBloquePadre.split(" ");
    var blqHijoNameRaw = itemBloqueHijo.split(" ");
    
    if ((blqPadreNameRaw.length > 1) && (blqHijoNameRaw.length > 1)) {
        blqPadreName = blqPadreNameRaw[0].trim();
        blqHijoName = blqHijoNameRaw[0].trim();
                
        const blqPadre = bloques.find(elemento => elemento.descripcion === blqPadreName);
        const blqHijo = bloques.find(elemento => elemento.descripcion === blqHijoName);
        
        var itemsblqPadre = blqPadre.items;
        var itemsblqHijo = blqHijo.items;
        
        for (var i=0; i < itemsblqHijo.length; i++) {
            var tempItemHijo = itemsblqHijo[i];
            if (tempItemHijo.dependencias.length > 0) {
                
                for (var j=0; j < tempItemHijo.dependencias.length; j++) {
                    var idDependiente = tempItemHijo.dependencias[j];
                    var encontrado = itemsblqPadre.find(elemento => elemento.idItem === idDependiente);
                    if (encontrado !== undefined) {
                        return true;
                    }
                }
                
            }
        }
        
        
    }
    return false;
}

utils.getListaItemsBloqueValidos = function(bloques,itemPadreName,blqHijoName,tipo) {
    var items_bloque_validos = [];
    var blqPadreNameRaw = itemPadreName.split(" ");
    if (blqPadreNameRaw.length > 1) {
        var blqPadreName = blqPadreNameRaw[0].trim();
        var itemblqPadreName = blqPadreNameRaw[1].trim();
        
        const blqPadre = bloques.find(elemento => elemento.descripcion === blqPadreName);
        const blqHijo = bloques.find(elemento => elemento.descripcion === blqHijoName);
        var itemsblqHijo = blqHijo.items;
        
        // Ordenar la lista de items hijo
        itemsblqHijo.sort(function(a, b) {
            return a.posicion - b.posicion;
          });

        
        var itemsblqPadre = blqPadre.items;
        
        const itemPadre = itemsblqPadre.find(elemento => elemento.descripcion === itemblqPadreName);
        
        // Itero por los items del bloque hijo
        for (var i=0; i < itemsblqHijo.length; i++) {
            var tempItemHijo = itemsblqHijo[i];
            if (tempItemHijo.dependencias.length > 0) {
                
                var encontrado = tempItemHijo.dependencias.indexOf(itemPadre.idItem);
                if (encontrado !== -1) {
                    if (tipo === 'descripcion') {
                        items_bloque_validos.push(tempItemHijo.descripcion);
                    } else {
                        items_bloque_validos.push(tempItemHijo);
                    }
                }
                
            }
        }
        
    }
    return items_bloque_validos;
    
}

utils.comprobarDependencia = function(bloques,itemBloquePadre,itemBloqueHijo) {
    
    var blqPadreNameRaw = itemBloquePadre.split(" ");
    var blqHijoNameRaw = itemBloqueHijo.split(" ");
    
    if ((blqPadreNameRaw.length > 1) && (blqHijoNameRaw.length > 1)) {
        blqPadreName = blqPadreNameRaw[0].trim();
        blqHijoName = blqHijoNameRaw[0].trim();
        var itemblqPadreName = blqPadreNameRaw[1].trim();
        var itemblqHijoName = blqHijoNameRaw[1].trim();
                
        const blqPadre = bloques.find(elemento => elemento.descripcion === blqPadreName);
        const blqHijo = bloques.find(elemento => elemento.descripcion === blqHijoName);
        
        if ((blqPadre !== undefined) && (blqHijo !== undefined) && (blqPadre.items.length > 0) && (blqHijo.items.length > 0)) {
            var itemsblqPadre = blqPadre.items;
            var itemsblqHijo = blqHijo.items;
            
            const itemPadre = itemsblqPadre.find(elemento => elemento.descripcion === itemblqPadreName);
            const itemHijo = itemsblqHijo.find(elemento => elemento.descripcion === itemblqHijoName);
        
            var encontrado = itemHijo.dependencias.indexOf(itemPadre.idItem);
            return (encontrado !== -1);
        }
    }
    return true;
    
}

utils.cambiarValorDesplegableBloque = function(bloque,itemBloqueName,grupo) {
    var myText = itemBloqueName;
    console.log("MYTEXT: " + myText);
    var val = $('#item-' + bloque.toLowerCase() + ' option').filter( function(){
        return ($(this).text() === myText || $(this).val() === myText );
    });
    $('#item-' + bloque.toLowerCase()).val(val.val());        
    
    if ($('#item_grupo-' + bloque.toLowerCase())) {  
        grupo = grupo.replace(/pieza /i, '');
        var val = $('#item_grupo-' + bloque.toLowerCase() + ' option').filter( function(){
            return ($(this).text() === grupo || $(this).val() === grupo );
        });
        $('#item_grupo-' + bloque.toLowerCase()).val(val.val());        
    
    }
    

}

utils.mostrarMensajeNoPermitido = function(mensaje) {
     $("#textureMessage").text(mensaje);
     $('#div_textureMessage').show().delay(2000).fadeOut(1000);
     console.log("Textura no permitida");
}

utils.inicializarOpcionesBloque = function(bloque, items, modelosBloque) {
    var modelosBloqueSort = [];
    var items_bloque = items;
    //selectedItem.correspondenciaBloques(blq.descripcion, items_bloque);
    console.log("BLOQUES en JS: " + modelosBloque);

    $.each(items_bloque, function (item) {
        //console.log(item);
        var n = bloque + " " + item.descripcion; 
        if (modelosBloque.indexOf(n) !== -1) {
            var tir = {
              valor : n,
              alias : item.alias
            };
            modelosBloqueSort.push(tir);
        }
    });

    $('#panel-bloque-'+bloque.toLowerCase()).show();
    $('#item-'+ bloque.toLowerCase()).empty();

    // Cargamos los tiradores encontrados
    $.each(modelosBloqueSort, function (item) {
        $('#item-'+ bloque.toLowerCase()).append($('<option>', { 
            value: item.valor,
            text : item.alias 
        }));
    });

}


module.exports = utils;