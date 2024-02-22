/* 
 * To change item license header, choose License Headers in Project Properties.
 * To change item template file, choose Tools | Templates
 * and open the template in the editor.
 */
import * as THREE from 'three';
var itemUtils = {};

var utils = require('./utils');



itemUtils.moveToPoint = function(item, event, camera){
	  var raycaster;
	  var mouse;
	  
	  raycaster = new THREE.Raycaster();
	  mouse = new THREE.Vector2();
	  
	  var viewerInnerWidth = $("#viewer").innerWidth();
	  var viewerInnerHeight = $("#viewer").innerHeight();
	  
	  var topHeight = $("#viewer-header").height();
	  var leftWidth = $("#side-menu").width();
	  leftWidth += 33.33333;
	  
          // Si se usa en tablets se controla el evento touches
          if (event.touches != null) {
              mouse.x = ( (event.touches[ 0 ].pageX - leftWidth) / viewerInnerWidth ) * 2 - 1;
              mouse.y = - ( (event.touches[ 0 ].pageY - topHeight) / viewerInnerHeight ) * 2 + 1;

          } else {
              mouse.x = ( (event.clientX - leftWidth) / viewerInnerWidth ) * 2 - 1;
              mouse.y = - ( (event.clientY - topHeight) / viewerInnerHeight ) * 2 + 1;
	  
          }
          /*console.log("touches: " + event.touches);
          console.log("clientX: " + event.clientX);
          console.log("clientY: " + event.clientY);
          console.log(mouse);*/
          
	  var camera = camera;
	  
	  raycaster.setFromCamera( mouse, camera );

	  var intersects = raycaster.intersectObjects( item.scene.getScene().children );

	  if ( intersects.length > 0 ) {
		  // cojo la posicion del clic
		  var position = intersects[ 0 ].point;		  
		  
		  // dependiendo del tipo de objeto cambio una coordenada u otra
		  var itemType = item.metadata.itemType;		  
		  switch (itemType){
		  case 1 || 8 || 9: // sobre el suelo (mesas, butacas, etc)
			  item.position.x = position.x;
			  // la y es la misma que tenia
			  item.position.z = position.z;		  
			  break;
		  case 2: // sobre la pared (cuadros, posters, etc)		
			  break;
		  case 3: // dentro de la pared, flotante (ventanas)
			  break;
		  case 7: // dentro de la pared, pegado al suelo (puertas)
			  break;
		  case 8: // pegado al suelo (alfombras)
			  break;
		  case 9: // pared o suelo ¿?
			  break;		  
		  }
	  }
	item.setSelected();
	item.needsUpdate = true;
	
}


itemUtils.moveKeyUp = function (item, camera){
    camera = camera || null;
    var dir = {x:0,y:1,z:0};
    if (camera != null) {
        dir = utils.getCameraDirection(camera,0,1,0,'y');
    }
    var DESPL = 2;
    dir = {
        x: dir.x*DESPL,
        y: dir.y*DESPL,
        z: dir.z*DESPL
    };
    if (!item.fixed){
            var vec3={
                    x: item.position.x+dir.x,
                    y: item.position.y+dir.y,
                    z: item.position.z+dir.z
            }
            // keys=1 para no mostrar la imagen roja erronea
            var keys=1;
            var newPos = new THREE.Vector3(vec3.x,vec3.y,vec3.z);
            item.moveToPosition(newPos,null,keys);
            item.updateHighlight();
            item.scene.needsUpdate = true;
            item.needsUpdate=true;
    }
}

itemUtils.moveKeyDown = function (item, camera){
    camera = camera || null;
    var dir = {x:0,y:-1,z:0};
    if (camera != null) {
        dir = utils.getCameraDirection(camera,0,-1,0,'y');
    }
    var DESPL = 2;
    dir = {
        x: dir.x*DESPL,
        y: dir.y*DESPL,
        z: dir.z*DESPL
    };
    if (!item.fixed){
            var vec3={
                x: item.position.x+dir.x,
                y: item.position.y+dir.y,
                z: item.position.z+dir.z
            }
            // keys=1 para no mostrar la imagen roja erronea
            var keys=1;
            var newPos = new THREE.Vector3(vec3.x,vec3.y,vec3.z);
            item.moveToPosition(newPos,null,keys);
            item.updateHighlight();
            item.scene.needsUpdate = true;
    }
}

itemUtils.moveKeyLeft = function (item,camera){
    
    camera = camera || null;
    var dir = {x:-1,y:0,z:0};
    if (camera != null) {
        dir = utils.getCameraDirection(camera,-1,0,0,'y');
    }
    var DESPL = 2;
    dir = {
        x: dir.x*DESPL,
        y: dir.y*DESPL,
        z: dir.z*DESPL
    };
    
    if (!item.fixed){
            //Compruebo el tipo de objeto a mover
            var tipo = item.metadata.itemType;

            //var dir = getCameraDirection(item);
            //console.log(dir);
            var vec3={
                x: item.position.x+dir.x,
                y: item.position.y+dir.y,
                z: item.position.z+dir.z
            }
            
            // keys=1 para no mostrar la imagen roja erronea
            var keys=1;
            item.moveToPosition(vec3,null,keys)
            item.updateHighlight();
            item.scene.needsUpdate = true;
    }
}

itemUtils.moveKeyRight = function (item, camera){
    camera = camera || null;
    var dir = {x:1,y:0,z:0};
    if (camera != null) {
        dir = utils.getCameraDirection(camera,1,0,0,'y');
    }
    var DESPL = 2;
    dir = {
        x: dir.x*DESPL,
        y: dir.y*DESPL,
        z: dir.z*DESPL
    };
    
    if (!item.fixed){

        //var dir = getCameraDirection(item);
        //console.log(dir);
            var vec3={
                x: item.position.x+dir.x,
                y: item.position.y+dir.y,
                z: item.position.z+dir.z
            }
            
            // keys=1 para no mostrar la imagen roja erronea
            var keys=1;
            item.moveToPosition(vec3,null,keys)
            item.updateHighlight();
            item.scene.needsUpdate = true;
    }
}

itemUtils.remove = function(item) {
    item.scene.removeItem(item);
};

itemUtils.setTextureRaw = function(item, texture){
    
    var materials = item.material;
    var scene = item.scene;
    //var item = item;
    
    if (parseInt(texture.cat) == parseInt(item.metadata.idCatalogo)) {
        var t0 = performance.now();	
        //var texturaCargada = new THREE.TextureLoader().load( texture.url, callback(item) );
        var loader = new THREE.TextureLoader();
        loader.load(
            // resource URL
            texture.url,

            // onLoad callback
            function ( texturaCargada ) {
                    // in item example we create the material when the texture is loaded
                //scene.needsUpdate = true;
                for (var i = 0; i < item.materialsFill.length; i++){
                  var mat = materials[item.materialsFill[i]];

                  var gta = texture.gta.toUpperCase();
                  //console.log(mat.name + " " + gta);
                  if ((gta == "") || (mat.name.search(gta) != -1)) {

                      mat.map = texturaCargada;
                      mat.map.minFilter = THREE.LinearFilter;
                      //console.log("Nombre Tex: " + item.textureSelected.name);
                      mat.map.name = texture.name;
                      mat.needsUpdate = true;	
                  }    
                }
                scene.needsUpdate = true;
                var t1 = performance.now();
                console.log("textura completa " + (t1 - t0) + " milliseconds.");
            },

            // onProgress callback currently not supported
            undefined,

            // onError callback
            function ( err ) {
                    console.error( 'An error happened.' );
            }
        );
    }
    
    //
    //var texturaCargada = THREE.ImageUtils.loadTexture( texture.url );
    // Pongo la textura en los materiales originales
    
}

itemUtils.setTexture = function(item, texture, callback){
	callback = callback || function(){
		// item.scene.needsUpdate = true;
	}
	
        item.textureSelected = texture;
	
	//console.log("Estoy en la funcion de texturas");
	
        // Aplico la textura a todos los objetos de la escena
        if (item.scene.textureScene) {
            item.scene.textureItems(texture);
        } 
        else {
            // Aplico la textura al modulo actual siempre que no sea una pieza
            if (!item.textureFill){ //Textura completa para los materiales añadidos en "materialsFill"
               item.setTextureRaw(texture);
            }
        }

	
}

itemUtils.getMaterialsWithGTAIncluded = function(item, gta) {
    
    var listMaterials = [];
    var idx = item.gta_alias.indexOf(gta.toLowerCase().trim());
    if (idx != -1) {
       gta_c = item.gta_code[idx].toUpperCase().trim();
       //console.log("[getMaterialsWithGTAIncluded] GTA_code " + gta_c + " " + gta);  
    
        var materials = item.material;
        for (var i = 0; i < materials.length; i++){
            var mat = materials[i];
            //console.log("[getMaterialsWithGTAIncluded] Buscando... " + mat.name + " " + gta_c);      
            if (mat.name.search(gta_c) != -1) {
                //console.log("[getMaterialsWithGTAIncluded] " + mat.name + " " + gta_c);  
                var gta_temp = item.getGTAs(mat.name);
                //console.log("[getMaterialsWithGTAIncluded] " + gta_temp);  
                listMaterials.push(gta_temp);
            }    
        }
    }
    return listMaterials;
}

itemUtils.closestWallEdgeCorners = function(item, vec3) {

    var wallEdges = item.model.floorplan.wallEdges();

    var wallEdge = null;
    var minDistance = null; 

    var corners = item.getCorners('x', 'z', vec3);
    
    utils.forEach(wallEdges, function(edge) {
        for (var i=0; i < corners.length; i++) {
            var itemX = corners[i].x;
            var itemZ = corners[i].y;
            var distance = edge.distanceTo(itemX, itemZ);
            if (minDistance === null || distance < minDistance) {
                minDistance = distance;
                wallEdge = edge;
            }
        }
    });

    return wallEdge;
}

itemUtils.resize = function(item, height, width, depth) {
    //console.log("depth " + depth + " corr_depth " + item.corr_depth + " getDepth " + item.getDepth());
    //console.log("width " + width + " corr_width " + item.corr_width + " getDepth " + item.getWidth());
    //console.log("heigth " + height + " corr_height " + item.corr_height + " getDepth " + item.getHeight());
    
    var x = (parseFloat(width) + parseFloat(item.corr_width)) / item.getWidth();
    var y = (parseFloat(height) + parseFloat(item.corr_height)) / item.getHeight();
    var z = (parseFloat(depth) + parseFloat(item.corr_depth)) / item.getDepth();
    console.log("x " + x + " y " + y + " z " + z);
    
    item.setScale(x, y, z);
    
    
}

itemUtils.flipX = function(item) {
    item.setScale(-1, 1, 1);
}


itemUtils.setRotation=function(item, val){
	item.rotation.y = val;
	item.resized();
        item.updateHelper();
        item.scene.needsUpdate = true;
}

itemUtils.addBloque = function(item, blq, alias_blq){
    if (item.bloques.indexOf(blq) == -1) {
        item.bloques.push(blq);
    }
    if (item.aliasBloques.indexOf(alias_blq) == -1) {
        item.aliasBloques.push(alias_blq);
    }
}

itemUtils.addPalabra = function(item, pal, alias_pal, superflua){
    
    if (item.palabras.indexOf(pal) == -1) {
        item.palabras.push(pal);
    //}
    //if (item.aliasPalabras.indexOf(alias_pal) == -1) {
        item.aliasPalabras.push(alias_pal);
    }
    if ((superflua == true) && (item.superfluas.indexOf(pal) == -1)) {
        item.superfluas.push(pal);
    }
}


itemUtils.setEspecialDims = function (item, especialDims){
   item.metadata.especialDims = especialDims;
}

itemUtils.setPosition = function (item, x,y,z){
	item.position.x = x;
	item.position.y = y;
	item.position.z = z;
	item.resized();
        item.updateHelper();
        //console.log("setPosition " + item.scene.needsUpdate);
	item.scene.needsUpdate = true;
}

itemUtils.setScale = function(item, x, y, z) {
    var posY_ant = item.position.y;
    var scaleVec = new THREE.Vector3(x, y, z);
    item.halfSize.multiply(scaleVec);
    scaleVec.multiply(item.scale);
    item.scale.set(scaleVec.x, scaleVec.y, scaleVec.z);
    item.resized();
    item.updateHelper();
    //console.log("setScale " + item.scene.needsUpdate);
    item.scene.needsUpdate = true;
};

itemUtils.setFixed = function(item, fixed) {
    item.fixed = fixed;
}

itemUtils.setSimetria = function(item, simetria) {
    item.simetria = simetria;
    item.flipX();
    item.getWallDistance();
}

itemUtils.getSimetria = function(item) {
    return item.simetria;
}

itemUtils.setArrowHide = function(item, arrowHide) {
    item.arrowHide = arrowHide;
}

itemUtils.getHeight = function(item) {
    return item.halfSize.y * 2.0;
}

itemUtils.getWidth = function(item) {
    var valor = item.halfSize.x * 2.0;
    if (item.simetria) {
        valor = -valor;
    }
    return valor;
}

itemUtils.getDepth = function(item) {
    return item.halfSize.z * 2.0;
}

itemUtils.getHeightCorr = function(item) {
    return item.halfSize.y * 2.0 - item.corr_height;
}

itemUtils.getWidthCorr = function(item) {
    var valor = item.halfSize.x * 2.0 - item.corr_width;
    //console.log("[getWidthCorr] " + item.halfSize.x * 2.0);
    if (item.simetria) {
        valor = -valor;
    }
    return valor;
}

itemUtils.getDepthCorr = function(item) {
    return item.halfSize.z * 2.0 - item.corr_depth;
}

itemUtils.initObject = function(item) {
    var item=item;    
//    $.getJSON( item.metadata.modelUrl, function( data ) { 
//  	  texture = data["materials"][0].mapDiffuse
//  	  item.metadata.model_texture = "models/textures/"+texture;   
//  	});
    item.placeInRoom();    
    item.updateHelper();
    // select and stuff
    item.scene.needsUpdate = true;
    
};

// on is a bool
itemUtils.updateHighlight = function(item) {
    
    var on = item.hover || item.selected;
    var emissiveColor;
    if (item.hover) {
        emissiveColor = item.emissiveColorHover;
    }
    /*if (item.selected) {
        emissiveColor = item.emissiveColorSelected;
    }*/
    item.highlighted = on;
    var hex = on ? emissiveColor : 0x000000;
    utils.forEach(item.material, function(material) {
        material.emissive.setHex(hex);
    });
    
}

itemUtils.updateHelper = function(item) {
    if (item.helper) {
        item.showHelper(item.position);
    }
        //item.helper.position.x = item.position.x;
        //item.helper.position.y = item.position.y;
        //item.helper.position.z = item.position.z;
    
}

    

itemUtils.mouseOver = function(item) {
    item.hover = true;
    item.updateHighlight();
};

itemUtils.mouseOff = function(item) {
    item.hover = false;
    item.updateHighlight();
};

itemUtils.getWallDistance = function(item){
	// Elimino las lineas anteriores
	item.hideWallDistance();
	
	// Veo el tipo de objeto
	var tipo = item.metadata.itemType;
	tipo = parseInt(tipo);
//	console.log("Tipo="+tipo)
	
	// Variables para las lineas
	var lc1; // linea desde el corner1 hasta la pared
	var lc2; // linea desde el corner2 hasta la pared
	var lc; // linea desde el centro hasta el corner 1 o 2 (distancia mas cercana)
	
	var walls = item.model.floorplan.getWalls();
	var corners = item.getCorners('x', 'z');
        //console.log('[getWallDistance]');
        //console.log(corners);
        
	for (var k=0;k < corners.length; k++){
		
		if ((tipo == 3 || tipo == 7) && (k == 0 || k == 2)){
			continue;
		}
		
		var c1 = corners[k];
		var c2;
		if (k<corners.length-1)
			c2 = corners[k+1]
		else
			c2 = corners[0]
		
		// Configuro el color de las lineas y la direccion
		var color;
		var nomColor;
		var dir;
		var rot = item.rotation.y * (180 / Math.PI);
		var lineSize = 5000;
		
		var nombrePlano;
		switch (k){
		case 0:
			color = 0x00ff00;
			nomColor = "verde";
			if ((rot <= 0 && rot >= - 180) || rot == 180)
				dir = lineSize;
			else
				dir = - lineSize
			nombrePlano = "NORTE"
			break;
		case 1:
			color = 0x0000ff;
			nomColor = "azul";
			dir = lineSize;
			if ((rot < -90 && rot < 180) || (rot <= 180 && rot > 90))
				dir = - lineSize;
			nombrePlano = "ESTE"
			break;
		case 2:
			nomColor = "rosa";
			color = 0xff00ff;
			dir = lineSize;
			if ((rot < 0 && rot > -180) || (rot > -180 && rot < 90))
				dir = - lineSize;
			if (rot >= 0 && rot < 90)
				dir = lineSize;
			nombrePlano = "SUR"
			break;
		case 3:
			nomColor = "amarillo";
			color = 0xffff00;
			dir = lineSize;
			if (rot > -90 && rot < 90)
				dir = - lineSize;
			nombrePlano = "OESTE"
			break;
		}
		
	    // Pendiente de la recta
	    var m =  (c2.y - c1.y+0.00001) / (c2.x - c1.x)
//	    console.log("Pendiente de '"+k+"'="+m)
	        
	    // Creo la linea desde el corner 1
            var material = new THREE.LineBasicMaterial({
	        color: color
	    });
	    var fc1 = new THREE.Vector3();
	    fc1.x = c1.x; 
	    fc1.y = item.position.y;
	    fc1.z = c1.y;
	    
            var dc1 = new THREE.Vector3();
	    dc1.x = c1.x + dir; 
	    dc1.y = item.position.y;
	    dc1.z = (-1/m) * (dc1.x - c1.x) + c1.y;
	
            // THREE.Geometry deprecated
            //var geometry = new THREE.Geometry();
	    //geometry.vertices.push(fc1);
	    //geometry.vertices.push(dc1);

            // NEW version with THREE.BufferGeometry
            let points = [];
            points.push(fc1);
            points.push(dc1);
            var geometry = new THREE.BufferGeometry().setFromPoints( points );

            lc1 = new THREE.Line(geometry, material);	           
	    
	    var name = "wallDistance" + k;
	    lc1.name = name;
	    
	    // Creo la linea desde el corner 2
            var material = new THREE.LineBasicMaterial({
	        color: color
	    });
	    var fc2 = new THREE.Vector3();
	    fc2.x = c2.x; 
	    fc2.y = item.position.y;
	    fc2.z = c2.y;
  
	    var dc2 = new THREE.Vector3();
	    dc2.x = c2.x + dir; 
	    dc2.y = item.position.y;
	    dc2.z = (-1/m) * (dc2.x - c2.x) + c2.y;
	    	
            //var geometry = new THREE.Geometry();
	    //geometry.vertices.push(fc2);
	    //geometry.vertices.push(dc2);

            points = [];
            points.push(fc2);
            points.push(dc2);
            var geometry = new THREE.BufferGeometry().setFromPoints( points );

	    lc2 = new THREE.Line(geometry, material);	            
	    
	    var name = "wallDistance1" + k;
	    lc2.name = name;
	    
            //if (k == 1) {
                //item.scene.add(lc1);
                //item.scene.add(lc2);
            //}
	    
	    
	    // Una vez pintadas las lineas veo con que pared corta cada una
	    var minD = 999999;
	    var lCut; // Para saber la linea con la que corto
	    var lWall; // Para saber la pared con la que corto
	    var corto = "Plano '"+nombrePlano+"' no corta con ninguna pared";
	    for (var h=0;h < walls.length; h++){
	    	var w = walls[h];
			
	    	// Linea 1
	    	if (utils.lineLineIntersect(fc1.x, fc1.z, dc1.x, dc1.z, w.getStart().x, w.getStart().y, w.getEnd().x, w.getEnd().y)){
	    		// Si corta la pared actual con la linea calculo la distancia
	    		var d = w.distanceFrom(fc1.x, fc1.z);
	    		if (d < minD){
	    			var uni = "cm";
	    			lWall = h;
	    			minD = d;
	    			lCut = 1;
	    			var fDis = minD;
	    			if (fDis > 99){
	    				fDis = fDis / 100;
	    				uni = "m";
	    			}
	    			corto = "Plano '" + nombrePlano + "', corto con pared " + h + "(linea 1) - Dis = " + fDis + " " + uni;
	    		}
	    	}
	    		
	    	// Linea 2
		    if (utils.lineLineIntersect(fc2.x, fc2.z, dc2.x, dc2.z, w.getStart().x, w.getStart().y, w.getEnd().x, w.getEnd().y)){
		    	// Si corta la pared actual con la linea calculo la distancia
		    	var d = w.distanceFrom(fc2.x, fc2.z);
	    		if (d < minD){
	    			var uni = "cm";
	    			lWall = h;
	    			minD = d;
	    			lCut = 2;
	    			var fDis = minD;
	    			if (fDis > 99){
	    				fDis = fDis / 100;
	    				uni = "m";
	    			}
	    			corto = "Plano '" + nombrePlano + "', corto con pared " + h + "(linea 2) - Dis = " + fDis + " " + uni;
	    		}
		    }

	    }
	    
	    // Busco el punto mas cercano con el que corto la pared
	    var w = walls[lWall];
	    if (w != null){
            let center;
		    if (lCut == 1){
                        
                        var x1, y1, x2, y2;
                        if (!lc1.geometry.isBufferGeometry) {
                            // DEPRECATED 
		    	   // Veo la pendiente antes de modificar
                            x1 = lc1.geometry.vertices[0].x;
                            y1 = lc1.geometry.vertices[0].z;
                            x2 = lc1.geometry.vertices[1].x;
                            y2 = lc1.geometry.vertices[1].z;
                        } else {
                            const positionAttribute = lc1.geometry.getAttribute('position');
                            const point = new THREE.Vector3();
                            point.fromBufferAttribute(positionAttribute, 0);
                            x1 = point.x;
                            y1 = point.z;
                            point.fromBufferAttribute(positionAttribute, 1);
                            x2 = point.x;
                            y2 = point.z;
                        }
                        
                        var m = (y2 - y1 + 0.0001) / (x2 - x1);
		    	
		    	var x = fc1.x;
		    	var y = fc1.z;
		    	var x1 = w.getStart().x;
		    	var y1 = w.getStart().y;
		    	var x2 = w.getEnd().x;
		    	var y2 = w.getEnd().y;
		    	var point = utils.closestPointOnLine(x, y, x1, y1, x2, y2);

                        if (!lc1.geometry.isBufferGeometry) {
                            // Modifico la linea que corto
                            lc1.geometry.vertices[1].x = point.x;
                            lc1.geometry.vertices[1].z = point.y;
                            lc1.geometry.verticesNeedUpdate = true;
                        } else {
                            const positionAttribute = lc1.geometry.getAttribute('position');
                            const vertex = new THREE.Vector3();
                            vertex.fromBufferAttribute(positionAttribute, 1);
                            positionAttribute.setXYZ(1, point.x, vertex.y, point.y);
                        }
		    	
		    	// Elimino la otra linea
		    	item.scene.remove(lc2);
		    	
                        if (!lc1.geometry.isBufferGeometry) {
                            // DEPRECATED 
		    	   // Veo la pendiente antes de modificar
                            x1 = lc1.geometry.vertices[0].x;
                            y1 = lc1.geometry.vertices[0].z;
                            x2 = lc1.geometry.vertices[1].x;
                            y2 = lc1.geometry.vertices[1].z;
                        }
                        else {
                            const positionAttribute = lc1.geometry.getAttribute('position');
                            const point = new THREE.Vector3();
                            point.fromBufferAttribute(positionAttribute, 0);
                            x1 = point.x;
                            y1 = point.z;
                            point.fromBufferAttribute(positionAttribute, 1);
                            x2 = point.x;
                            y2 = point.z;
                        }
		    	
                        var m = (y2 - y1 + 0.00001) / (x2 - x1);

		    	// Tiro la linea desde el corner hasta el centro
				var material = new THREE.LineBasicMaterial({
			        color: color
			    });
                            //var geometry = new THREE.Geometry();
			    //geometry.vertices.push(lc1.geometry.vertices[0]);
			    //geometry.vertices.push(item.position);
			    
                            const points = [];
                            if (!lc1.geometry.isBufferGeometry) {
                                points.push(lc1.geometry.vertices[0]);
                            } else {
                                const positionAttribute = lc1.geometry.getAttribute('position');
                                const vertex0 = new THREE.Vector3();
                                vertex0.fromBufferAttribute(positionAttribute, 0);
                                points.push(vertex0);
                            }
                            points.push(item.position);
                            var geometry = new THREE.BufferGeometry().setFromPoints( points );

                            
			    center = new THREE.Line(geometry, material);	              
			    var name = "wallDistanceC" + k;
			    
			    center.name = name;    
			    //item.scene.add(center);
			    
		    }else{
		    	var x = fc2.x;
		    	var y = fc2.z;
		    	var x1 = w.getStart().x;
		    	var y1 = w.getStart().y;
		    	var x2 = w.getEnd().x;
		    	var y2 = w.getEnd().y;
		    	var point = utils.closestPointOnLine(x, y, x1, y1, x2, y2);

		    	// Modifico la linea que corto
                         if (!lc2.geometry.isBufferGeometry) {
                            // Modifico la linea que corto
                            lc2.geometry.vertices[1].x = point.x;
                            lc2.geometry.vertices[1].z = point.y;
                            lc2.geometry.verticesNeedUpdate = true;
                        } else {
                            const positionAttribute = lc2.geometry.getAttribute('position');
                            const vertex = new THREE.Vector3();
                            vertex.fromBufferAttribute(positionAttribute, 1);
                            positionAttribute.setXYZ(1, point.x, vertex.y, point.y);
                        }
		    	
		    	// Elimino la otra linea
		    	item.scene.remove(lc1);
		    	
		    	// Tiro la linea desde el corner hasta el centro
				var material = new THREE.LineBasicMaterial({
			        color: color
			    });
                            //var geometry = new THREE.Geometry();
			    //geometry.vertices.push(lc2.geometry.vertices[0]);
			    //geometry.vertices.push(item.position);
                            
                            const points = [];
                            if (!lc2.geometry.isBufferGeometry) {
                                points.push(lc2.geometry.vertices[0]);
                            } else {
                                const positionAttribute = lc2.geometry.getAttribute('position');
                                const vertex0 = new THREE.Vector3();
                                vertex0.fromBufferAttribute(positionAttribute, 0);
                                points.push(vertex0);
                            }
                            
                            points.push(item.position);
                            var geometry = new THREE.BufferGeometry().setFromPoints( points );

			    center = new THREE.Line(geometry, material);	              
			    var name = "wallDistanceC" + k;
			    
			    center.name = name;    
			    //item.scene.add(center);
		    }    
		    
//		    console.log(corto)
		       	    
		    // Mostrar con decimales o no
	//	    if (minD > 100)
	//	    	minD = minD.toFixed(0)
	//	    else
	//	    	minD = minD.toFixed(0)
		    	
		    // Corregir medidas
		    if (minD < 6)
		    	minD = 0;
		     else 
		    	minD = minD - 5;
		    
                    minD = minD.toFixed(1);
                    //console.log("K: " + k + ", minD: " + minD);	
		    switch (k){
		    case 0:
		    	item.northWall = minD;
		    	$("#item-northWall").val(minD);
		    	
		    	// Agrego las lineas al vector
		    	item.north = new Array();
		    	if (lCut == 1)
		    		item.north.push(lc1)
		    	else
		    		item.north.push(lc2)
		    	item.north.push(center)
		    	
		    	break;
		    case 1:
		    	item.eastWall = minD;
		    	$("#item-eastWall").val(minD);
		    	
		    	// Agrego las lineas al vector
		    	item.east = new Array();
		    	if (lCut == 1)
		    		item.east.push(lc1)
		    	else
		    		item.east.push(lc2)
		    	item.east.push(center)
		    	break;
		    case 2:
		    	item.southWall = minD;
		    	$("#item-southWall").val(minD);
		    	
		    	// Agrego las lineas al vector
		    	item.south = new Array();
		    	if (lCut == 1)
		    		item.south.push(lc1)
		    	else
		    		item.south.push(lc2)
		    	item.south.push(center)
		    	break;
		    case 3:
		    	item.westWall = minD;
		    	$("#item-westWall").val(minD);
		    	
		    	// Agrego las lineas al vector
		    	item.west = new Array();
		    	if (lCut == 1)
		    		item.west.push(lc1)
		    	else
		    		item.west.push(lc2)
		    	item.west.push(center)
		    	break;
		    }
//		    console.log(" ")
	    }
	}

	// Mostrar lineas auxiliares
	if (item.lineWalls)
		item.showWallDistance();
	
}

itemUtils.showWallDistance = function(item){
	for (var i=0; i < 2; i++){
		var n = item.north[i]
		if (n != null)
			item.scene.add(n)
		var e = item.east[i]
		if (e != null)
			item.scene.add(e)
		var s = item.south[i]
		if (s != null)
			item.scene.add(s)
		var w = item.west[i]
		if (w != null)
			item.scene.add(w)
	}
	
}

itemUtils.hideWallDistance = function(item){
	for (var i=0; i<4; i++){
		var name = "wallDistance" + i;
		var line = item.scene.getScene().getObjectByName(name);
		item.scene.remove(line)
		var name = "wallDistance1" + i;
		var line = item.scene.getScene().getObjectByName(name);
		item.scene.remove(line)
		var name = "wallDistanceC" + i;
		var line = item.scene.getScene().getObjectByName(name);
		item.scene.remove(line)
	}
}

itemUtils.setWallDistance = function(item, plane){
	
	// Plane es el plano a modificar (norte, este, sur u oeste) del objeto
	
	// Variables a utilizar
	var line;
	let center;
	var distance;
	var curDistance;
	
	// Selecciono el plano a modificar
	switch (plane){
	case "north":
		line = item.north[0];
		center = item.north[1];
		distance = $("#item-northWall").val();
		curDistance = item.northWall;
                console.log(distance + " " + curDistance);
		break;
	case "east":
		line = item.east[0];
		center = item.east[1];
		distance = $("#item-eastWall").val();
		curDistance = item.eastWall;
		break;
	case "south":
		line = item.south[0];
		center = item.south[1];
		distance = $("#item-southWall").val();
		curDistance = item.southWall;
		break;
	case "west":
		line = item.west[0];
		center = item.west[1];
		distance = $("#item-westWall").val();
		curDistance = item.westWall;
		break;
	}
	
	// Tamanio de la linea auxiliar (un numero grande...)
	var dis = 1000;
	
        var lineO;
        var lineD;
        if (!line.geometry.isBufferGeometry) {
            lineO = line.geometry.vertices[0];
            lineD = line.geometry.vertices[1];
        } else {
            const positionAttribute = line.geometry.getAttribute('position');
            lineO = new THREE.Vector3();
            lineD = new THREE.Vector3();
            lineO.fromBufferAttribute(positionAttribute, 0);
            lineD.fromBufferAttribute(positionAttribute, 1);
        }
	

	// Calculo el nuevo punto dentro de la linea del corner a la nueva distancia
	// (px,py)
	var x1 = lineD.x;
	var y1 = lineD.z;
	var x2 = lineO.x;
	var y2 = lineO.z;
	
	var vx = x2 - x1;
	var vy = y2 - y1;
	var mag = Math.sqrt(vx*vx + vy*vy);
	vx /= mag;
	vy /= mag;

	distance = parseFloat(distance);
	distance += 5;

	px = x1 + vx * (distance);
	py = y1 + vy * (distance);
	
	// Calculo la pendiente de la recta para replicarla
	var x1 = lineO.x;
	var y1 = lineO.z;
	var z1 = lineO.y;
	var x2 = item.position.x;
	var y2 = item.position.z;
	var z2 = item.position.y;
	
	var m = (y2 - y1) / (x2 - x1)
	
	// Pinto la linea paralela
	// Longitud que debe tener la linea
	var vx = x2 - x1;
	var vy = y2 - y1;
	var vz = z2 - z1;
	
	var long = Math.sqrt(vx*vx + vy*vy + vz*vz);
	
    var fc1 = new THREE.Vector3();
    fc1.x = px; 
    fc1.y = item.position.y;
    fc1.z = py;
	    
    var dc1 = new THREE.Vector3();
    dc1.x = x1 + dis; 
    dc1.y = item.position.y;
    dc1.z = m * (dc1.x - px) + py; 

    // Recalculo el punto final
    var x1 = fc1.x;
	var y1 = fc1.z;
	var x2 = dc1.x;
	var y2 = dc1.z;
	var vx = x2 - x1;
	var vy = y2 - y1;
	var mag = Math.sqrt(vx*vx + vy*vy);
	vx /= mag;
	vy /= mag;
	px1 = x1 + vx * (long);
	py1 = y1 + vy * (long);
    
    // Ahora calculo la distancia para ver si tengo que invertir la linea o no
    var vx = lineD.x - px1;
    var vz = lineD.z - py1;
    var vxDis1 = Math.sqrt(vx*vx + vz*vz)
    
    // Calculo la nueva linea
    var dc1 = new THREE.Vector3();
    dc1.x = x1 - dis; 
    dc1.y = item.position.y;
    dc1.z = m * (dc1.x - px) + py; 

    // Recalculo el punto final
    var x1 = fc1.x;
	var y1 = fc1.z;
	var x2 = dc1.x;
	var y2 = dc1.z;
	var vx = x2 - x1;
	var vy = y2 - y1;
	var mag = Math.sqrt(vx*vx + vy*vy);
	vx /= mag;
	vy /= mag;
	px2 = x1 + vx * (long);
	py2 = y1 + vy * (long);
	
	// Ahora calculo la distancia para ver si tengo que invertir la linea o no
    var vx = lineD.x - px2;
    var vz = lineD.z - py2;
    var vxDis2 = Math.sqrt(vx*vx + vz*vz)
    
    // Compruebo si la orientacion es la correcta
    // calculando la distancia hasta el punto más alejado
    // de la linea que sale del corner que estoy midiendo
    // Por lo tanto:
    // si (la distancia que tenia antes > a la nueva distancia)
    // la distancia entre dicho punto y el nuevo punto de la linea debe ser la más grande
    // en caso contrario
    // la distancia debe ser la mas pequeña
    if (curDistance > distance){
    	if (vxDis1 > vxDis2){
    		// Reasigno el punto final
    		dc1.x = px1;
    		dc1.z = py1;
    	} else{
    		// Reasigno el punto final
    		dc1.x = px2;
    		dc1.z = py2;
    	}
    } else {
    	if (vxDis1 < vxDis2){
    		dc1.x = px2;
    		dc1.z = py2;
    	}else{
    		dc1.x = px1;
    		dc1.z = py1;
    	}
    }
	
	// Muevo el objeto a la nueva posicion
        console.log("Posicion anterior: " + item.position.x + " " + item.position.z);
	
	item.position.x = dc1.x;
	item.position.z = dc1.z;
	
    console.log("Nueva posicion: " + item.position.x + " " + item.position.z);
	item.setSelected();
        console.log("setWallDistance " + item.needsUpdate);
	item.needsUpdate = true;
        item.scene.needsUpdate = true;
	
}

itemUtils.setSelected = function(item) {
	
    item.getWallDistance();

    item.selected = true;
    //item.model.scene.add(item.helper);
    item.showHelper(item.position);
    item.updateHighlight();
    var texture="";
    
//    var item=item;    
//    $.getJSON( item.metadata.modelUrl, function( data ) { 
//  	  texture = data["materials"][0].mapDiffuse
//  	  item.metadata.model_texture = "models/textures/"+texture;   
//  	});
    
};

itemUtils.setUnselected = function(item) {
    item.selected = false;
    item.updateHighlight();
    //item.model.scene.remove(item.helper);
    item.hideHelper();
    item.hideWallDistance();
};


itemUtils.getNombreBloque = function(item, name, nom_bloque) {
    var modelo = name.split(";");
    var seleccionado = name;
    for (var i=0; i<modelo.length; i++) {
        if (modelo[i].search(nom_bloque) != -1) {
            seleccionado = modelo[i];
        }
    }
    // Primera mayúscula
    if (seleccionado.length > 0) {
        seleccionado = seleccionado[0].toUpperCase() + seleccionado.substring(1);
    }
    //console.log("EL NOMBRE del tirador es: " + seleccionado);
    return seleccionado.trim();
}

itemUtils.getNombreTirador = function(item, name) {
    var modelo = name.split(";");
    var seleccionado = name;
    for (var i=0; i<modelo.length; i++) {
        if (modelo[i].search("TIRADOR") != -1) {
            seleccionado = modelo[i];
        }
    }
    // Primera mayúscula
    seleccionado = seleccionado[0].toUpperCase() + seleccionado.substring(1);
    //console.log("EL NOMBRE del tirador es: " + seleccionado);
    return seleccionado;
}

itemUtils.getNombrePieza = function(item, name) {
    var modelo = name.split(";");
    var seleccionado = -1;
    for (var i=0; i<modelo.length; i++) {
        if (modelo[i].search("PIEZA") != -1) {
            seleccionado = modelo[i];
        }
    }
    if (seleccionado == -1) {
        return "";
    }
    else {
        seleccionado = seleccionado.replace("PIEZA","").toLowerCase().trim();
        var key = seleccionado.split(" ")[0];
        //var value = item.diccionario(key);
        var value = item.aliasPalabra(key);
        seleccionado = seleccionado.replace(key,value);
        // Primera mayúscula
        seleccionado = seleccionado[0].toUpperCase() + seleccionado.substring(1);
        
        if (name.search("TIRADOR") != -1) {
            //console.log("Estoy en getNombrePieza");
            var nomTirador = item.getNombreTirador(name);
            nomTirador = nomTirador.replace("TIRADOR","").toLowerCase().trim();
            console.log("TIRADORRRR: " + nomTirador);
            nomTirador = item.aliasTirador(nomTirador);
            nomTirador = nomTirador[0].toUpperCase() + nomTirador.substring(1);
            seleccionado = "Tirador " + seleccionado + ": " + nomTirador + " ";
        }
        else {
            seleccionado = seleccionado + ": ";
        }
        return seleccionado;
    }
}

itemUtils.getNombrePiezaBloque = function(item, name, bloque) {
    var modelo = name.split(";");
    var seleccionado = -1;
    for (var i=0; i<modelo.length; i++) {
        if (modelo[i].search("PIEZA") != -1) {
            seleccionado = modelo[i];
            
            //Quitamos la almohadilla si existe
            if (seleccionado.indexOf('#') != -1) {
                seleccionado = seleccionado.replace("#","");
            }
        }
    }
    if (seleccionado == -1) {
        return "";
    }
    
    else {
        seleccionado = seleccionado.replace("PIEZA","").toLowerCase().trim();
        console.log("En getNombrePiezaBloque (antes): " + seleccionado);
        seleccionado = utils.traducir(seleccionado,item);
        //var key = seleccionado.split(" ")[0];
        //var value = item.aliasPalabra(key);
        //console.log("En getNombrePiezaBloque: " + key + " " + value);
        console.log("En getNombrePiezaBloque (despues): " + seleccionado);
        
        //var value = item.diccionario(key);
        //seleccionado = seleccionado.replace(key,value);
        // Primera mayúscula
        seleccionado = seleccionado[0].toUpperCase() + seleccionado.substring(1);
        
        if ((bloque != "") && (name.search(bloque) != -1)) {
            //console.log("Estoy en getNombrePieza");
            var itemBloque = item.getNombreBloque(name,bloque);
            itemBloque = itemBloque.replace(bloque,"").toLowerCase().trim();
            console.log("BLOQUEEEE: " + itemBloque);
            itemBloque = item.aliasItemBloque(itemBloque, bloque);
            bloqueAlias = item.aliasBloque(bloque);
            
            itemBloque = itemBloque[0].toUpperCase() + itemBloque.substring(1);
            seleccionado = bloque + " " + seleccionado + ": " + itemBloque + " ";
        }
        else {
            seleccionado = seleccionado + ": ";
        }
        return seleccionado;
    }
}

itemUtils.aliasTirador = function(item, nombreTirador) {

    alias = nombreTirador;
    for (var i=0;i<item.tiradores_code.length;i++) {
        if (item.tiradores_code[i].toLowerCase() == nombreTirador.toLowerCase()) {
            alias = item.tiradores_alias[i];
        }
    }
    return alias;
}

itemUtils.aliasBloque = function(item, bloque) {

    alias = bloque;
    //console.log("ALIASBLOQUE: " + alias);
    for (var i=0;i<item.bloques.length;i++) {
        if (item.bloques[i].toLowerCase() == bloque.toLowerCase()) {
            alias = item.aliasBloques[i];
        }
    }
    return alias.toUpperCase();
}

itemUtils.aliasPalabra = function(item, pal) {

    alias = pal;
    for (var i=0;i<item.palabras.length;i++) {
        if (item.palabras[i].toLowerCase() == pal.toLowerCase()) {
            alias = item.aliasPalabras[i];
        }
    }
    return alias;
    
}

itemUtils.aliasItemBloque = function(item, nombreItemBloque, bloque) {

    var items_names = item.correspondenciasB.get(bloque);
    var items_code = items_names[0];
    var items_alias = items_names[1];
    alias = nombreItemBloque;
    for (var i=0;i<items_code.length;i++) {
        if (items_code[i].toLowerCase() == nombreItemBloque.toLowerCase()) {
            alias = items_alias[i];
        }
    }
    return alias;
}

itemUtils.diccionario = function(name) {
    
    var keys = ['cajon','modulo','rectangulo','circulo','boton','onda metalico','tirad0r', 'plafon'];
    var values = ['cajon','modulo','rectangulo','circulo','boton','onda metalico','tirador', 'plafon'];

    //var values = ['cajón','módulo','rectángulo','círculo','botón','onda metálico','tirador', 'plafón'];
    
    var index = keys.indexOf(name);
    if (index > -1) {
        return values[index];
    }
    else {
        return name;
    }
    
}
itemUtils.buscarEnDescripcion = function(item, desc,cad) {
    
    var selecc = [];
    var selecc2 = [];
   
    for (var i=0;i<desc.length;i++) {
        var temp = desc[i].toLowerCase();
        if (temp.indexOf(cad.toLowerCase()) == 0) {
           //console.log("cad " + cad + " temp " + temp); 
           //console.log("desc " + desc[i]); 
           var linea = desc[i];
           //console.log("linea: " + linea);
           if (utils.bloqueEncontrado(cad,item.bloques) != -1) {
               linea = desc[i].substring(cad.length + 1);
           }
           //console.log("linea (after): " + linea);
           
           selecc.push(linea);
           selecc2.push(desc[i]);
        }
    } 
    for (var i=0;i<selecc2.length;i++) {
        var index = desc.indexOf(selecc2[i]);
        if (index > -1) {
            //console.log("desc before splice" + desc); 
            desc.splice(index,1);
            //console.log("desc after splice" + desc);
        }
    }

    return selecc;
}

itemUtils.interseccionObjetos = function(item, objects) {

    var geometry = item.geometry;
    for (var vertexIndex = 0; vertexIndex < geometry.vertices.length; vertexIndex++)
    {      
        var localVertex = geometry.vertices[vertexIndex].clone();
        //var globalVertex = obj1.matrix.multiplyVector3(localVertex);
        var globalVertex = localVertex.applyMatrix4(item.matrix);
        var directionVector = globalVertex.sub( item.position );

        var raycaster = new THREE.Raycaster(item.position, directionVector.clone().normalize());
        var collisionResults = raycaster.intersectObjects( objects ); 
        if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
        //if ( collisionResults.length > 0 ) 
        {
          console.log("vertexIndex: " + vertexIndex + " distance: " + collisionResults[0].distance); 
          var nameEst = collisionResults[0].object.metadata.itemName.toLowerCase();
          if (nameEst.search("pilar") != -1) {
              item.cajeado = 1;
          } else {
              item.cajeado = 2;
          }
          return true;
        }
    }
    
    var corners = item.getCorners('x', 'z');
    for (var i = 0; i < objects.length; i++) {
        if (!utils.polygonOutsidePolygon(corners, objects[i].getCorners('x', 'z')) ||
                !utils.polygonOutsidePolygon(objects[i].getCorners('x', 'z'), corners)) {
             
            var nameEst = objects[i].metadata.itemName.toLowerCase();
            if (nameEst.search("pilar") != -1) {
                item.cajeado = 1;
            } else {
                item.cajeado = 2;
            }
            return true;
        } 
    }
    item.cajeado = 0;
    return false;
}


itemUtils.intersectaEstructura = function(item) {
    
    var name_obj = item.metadata.itemName.toLowerCase();
    // Si nos encontramos con una viga o pilar
    if ((name_obj.search("viga") != -1) && (name_obj.search("pilar") != -1)) {
        return false; 
    }
    var corners = item.getCorners('x', 'z');
    var objects = item.model.scene.getItems();
    for (var i = 0; i < objects.length; i++) {
        var name = objects[i].metadata.itemName.toLowerCase();
        //console.log(name);
        if (objects[i] === item || !objects[i].obstructFloorMoves) {
            continue;
        }
        if ((name.search("viga") == -1) && (name.search("pilar") == -1)) {
            continue; 
        }
        var objects2 = [];
        objects2.push(objects[i]);
        if (item.interseccionObjetos(objects2)) {
            return true;
        }
        /*if (!utils.polygonOutsidePolygon(corners, objects[i].getCorners('x', 'z')) ||
            !utils.polygonOutsidePolygon(objects[i].getCorners('x', 'z'), corners) ||
            utils.polygonPolygonIntersect(corners, objects[i].getCorners('x', 'z'))) {
            // console.log('object not outside other objects');
            return true;
        }*/
    }
    return false;
    
}

itemUtils.openModuleAllowed = function(item) {
    var materials = item.material;
   
    for (var i = 0; i < materials.length; i++){
        var mat = materials[i];
        const words = mat.name.split(/[\s;]+/);
        if (words.indexOf("BRT01") != -1) {
            return true;
        } 
    }
    return false;
}

itemUtils.isOpened = function(item) {
    return ((item.materialOcultosAbrir!=null) && (item.materialOcultosAbrir.length > 0));
}

itemUtils.open = function(item, abrir) {
    
    if (abrir) { 
        // Se abren las puertas
        var materials = item.material;

        for (var i = 0; i < materials.length; i++){
            var mat = materials[i];
            const words = mat.name.split(/[\s;]+/);
            if (words.indexOf("BRT01") != -1) {
                if (mat.visible) {
                    item.materialOcultosAbrir.push(i);
                }
                mat.visible = false;
                mat.needsUpdate = true;
                
            } 
        }
        console.log("OPEN: " + item.materialOcultosAbrir);
    } else {
        // Se cierran, dejando mostrada la puerta que estaba antes de cerrarla
        console.log("OPEN close: " + item.materialOcultosAbrir);
        if (item.materialOcultosAbrir.length != 0) {
            var materials = item.material;
            for (var i = 0; i < item.materialOcultosAbrir.length; i++) { 
                 var mat = materials[item.materialOcultosAbrir[i]];
                 mat.visible = true;
                 mat.needsUpdate = true;
            }
            item.materialOcultosAbrir = [];
        }
       
        
    }
    item.scene.needsUpdate = true;
}

itemUtils.marcarMaterialsPorSeparadores = function(item) {
    var materials = item.material;
    var idxSepActivos = [];
    for (let i=0; i<materials.length; ++i) item.materialsSep[i] = -1;

    var idxGtaSep = -1;
    if (item.gta_sep.length > 0) {
        for (let i=0; i<item.bloques.length; ++i) {
            let bloque = item.bloques[i];
            var grupos = utils.getGruposDeBloque(item.material, bloque,item.superfluas);
            //console.log("BLOQUE: " + bloque +  " GRUPOS: " + grupos);

            for (var j = 0; j < grupos.length; j++){
                var idxGrupos = utils.getIndicesPorGrupo_bloque(item.material, grupos[j], bloque);
                //console.log("G: " + grupos[j] + " IDXGRUPOS: " + idxGrupos);
                var idxItemActivos = utils.getIdxItemActivoPorGrupo(item.material, idxGrupos);

                idxSep = item.getIdxFoundGTASeparador(idxItemActivos);
                if (idxSep != -1) {
                    //console.log("Separador GTA: " + idxSep + " ("  + item.gta_sep[idxSep] + ") encontrado en el grupo " + grupos[j]);
                    for (let k=0; k < idxItemActivos.length; k++) {
                        item.materialsSep[idxItemActivos[k]] = idxSep;
                    }
                    idxSepActivos.push(idxSep);
                }
            }
        }
    }
    
    return idxSepActivos;

}

itemUtils.getIdxFoundGTASeparador = function(item, idxItemActivos) {
    
    var idxGtaSep = -1;
    if (item.gta_sep.length > 0) {
        var materials = item.material;

        for (var i = 0; i < idxItemActivos.length; i++){
            var mat = materials[idxItemActivos[i]];
            var g_code = item.getGTAcode(mat.name);
            for (var j=0; j < item.gta_sep.length; j++) {
                if (g_code.indexOf(item.gta_sep[j]) != -1) {
                    idxGtaSep = j;
                }
            }
        }
    }
    return idxGtaSep;


}


itemUtils.getGTASeparador = function(item, idxSep) {
    return item.gta_sep[idxSep];
}

itemUtils.getDescripcionTexturas = function(item, idxSep,noAgrupar) {
    
    noAgrupar = noAgrupar || false;
    
    var descripcion = [];
    var materials = item.material;
    // Elimino todas las texturas
    for (var i = 0; i < materials.length; i++){
        var mat = materials[i];
        //console.log("NOMBRE: " + mat.name);
        // Primera condición para detectar los materiales con texturas y
        // segunda para detectar los tiradores que no tienen texturas (metálico)
        if ((mat.name.search("NOMOSTRAR") == -1) && ((mat.map != null && mat.visible == true) || 
            ((utils.bloqueEncontrado(mat.name,item.bloques) != -1) && mat.visible == true)) &&
            item.materialsSep[i] == idxSep)  {
            
            var bloque = utils.getBloque(mat.name,item.bloques);
            console.log("NOMBRE DENTRO: " + mat.name + " Bloque: " + bloque);
            var nomPieza = item.getNombrePiezaBloque(mat.name, bloque);
            //var nomPieza2 = item.getNombrePieza(mat.name);
            console.log("nomPiezaBloque: " + nomPieza);
            //console.log("nomPieza: " + nomPieza2);
            
            if (nomPieza != "") {
                if (mat.map != null) {
                    var cad = nomPieza + "<b>" + mat.map.name  + "</b>";
                }
                else {
                    var cad = nomPieza;
                }
                if (descripcion.indexOf(cad) == -1) {
                    descripcion.push(cad);
                }
            }
        }
    }
    // Formateamos la salida
    descripcion.sort();
    console.log("DESCRIPCION: " + descripcion);
    var salida = "";
    if (descripcion.length > 0) {
        while (descripcion.length > 0) {
            var key = descripcion[0].split(" ")[0];
            // Quitamos los : si existen
            if (key[key.length-1] == ":")
                key = key.substr(0,key.length-1);
            
            console.log("KEY: " + key);
            var selecc = item.buscarEnDescripcion(descripcion, key);
            console.log("SELECCIONADO: " + selecc);
            if (selecc.length>0) {
                //console.log("KEY: " + key.toUpperCase() + " Bloques: " + item.bloques);
                if (utils.bloqueEncontrado(key.toUpperCase(),item.bloques) != -1)  {
                var bloque = utils.getBloque(key.toUpperCase(),item.bloques);
                    salida += "- " + item.aliasBloque(bloque) + ": ";
                }
                else {
                    salida += "- " + i18n.t('desc.color') + " " + item.aliasPalabra(key).toUpperCase() + ": ";
                }
                console.log("SELECCIONADO: " + selecc);
                selecc2 = utils.separarPorGruposYSuperfluas(selecc, item);
                console.log("PRIMERADIVISION: " + selecc2);
                
                selecc = utils.eliminarRepetidos(selecc2);
                console.log("ELIMINARREPETIDOS: " + selecc2);
                if (noAgrupar == false) {
                    selecc = utils.agruparSeleccionados(selecc);
                    console.log("AGRUPADOS SELECCIONADO: " + selecc);
                }
                //selecc = utils.agruparPiezasVariosMaterials(selecc,item);
                //console.log("AGRUPADOS SUPERFLUAS: " + selecc);
                
                
                var numEspacios = "";
                if (noAgrupar == false) {
                    var cadenaEspacios = "- " + item.aliasBloque(bloque) + ":";
                    for (var i=0;i<cadenaEspacios.length; i++) {
                        numEspacios += "&nbsp;&nbsp;";
                    }
                } else {
                    numEspacios += "&nbsp;";
                }
                for (var i=0;i<selecc.length-1;i++) {
                    salida+= selecc[i] + "<br>" + numEspacios;
                }
                salida+=selecc[selecc.length-1] + "<br>";
            }
        }
    }
    
    console.log(salida);
    return salida;
}
       
itemUtils.getGTAyTexturas = function(item) {
    var materials = item.material;
    // Elimino todas las texturas
    var acabados = [];
    for (var i = 0; i < materials.length; i++){
        var mat = materials[i];
        //console.log("NOMBRE: " + mat.name);
        // Primera condición para detectar los materiales con texturas y
        // segunda para detectar los tiradores que no tienen texturas (metálico)
        if ((mat.visible == true) || 
                (mat.name.search("TIRADOR") != -1 && mat.visible == true))  {
            //console.log("NOMBRE DENTRO: " + mat.name);
            var nomPieza = utils.removeAlmohadilla(item.getNombrePieza(mat.name));
            var g_code = item.getGTAcode(mat.name);
            var texturaPieza = "";
            if ((mat.map != null) && (mat.map.image != null)) {
                texturaPieza = mat.map.image.src;
                var idx_bar = texturaPieza.lastIndexOf("/");
                texturaPieza = texturaPieza.substr(idx_bar+1);
            }
            if (nomPieza != "") {
                alias_nomPieza = utils.traducirNombre(utils.removeCaracter(nomPieza,':'),item);
                var acab = {nomPieza, g_code, texturaPieza, alias_nomPieza};
                console.log("ACABADO");
                console.log(acab);
                acabados.push(acab);
            }
        }
    }
    return acabados;
}

itemUtils.getAllGTAs = function(item) {
    var gtas = [];
    for (var i = 0; i < item.material.length; i++){
        var mat = item.material[i];	
        var gta_temp = item.getGTAs(mat.name);
        //console.log("GTA name: " + mat.name + " gta_temp: " + gta_temp);
        if (gta_temp != "") {
            var gta_array = gta_temp.split(" ");
            for (var j=0; j < gta_array.length; j++) {
                if (gtas.indexOf(gta_array[j]) == -1) {
                    gtas.push(gta_array[j]);
                } 
            }
        }
    }
    //console.log("GTAS: " + gtas);
    
    return gtas;
}


itemUtils.getAllGTAsActivos = function(item) {
    var gtas = [];
    for (var i = 0; i < item.material.length; i++){
        var mat = item.material[i];	
        if (mat.visible == true) {
            var gta_temp = item.getGTAcode(mat.name);
            //console.log("GTA name: " + mat.name + " gta_temp: " + gta_temp);
            if (gta_temp != "") {
                var gta_array = gta_temp.split(" ");
                for (var j=0; j < gta_array.length; j++) {
                    if (gtas.indexOf(gta_array[j]) == -1) {
                        gtas.push(gta_array[j]);
                    } 
                }
            }
        }
    }
    //console.log("GTAS: " + gtas);
    
    return gtas;
}

itemUtils.correspondenciaGTAs = function(item, gtas_raw, gtas_alias) {
     item.gta_code = gtas_raw.toLowerCase().split(", ");
     item.gta_alias = gtas_alias.toLowerCase().split(", ");
}

itemUtils.asignarGTAsSeparadores = function(item, gtas_sep) {
     item.gta_sep = gtas_sep.toLowerCase().split(",");
     for (let i=0; i < item.gta_sep.length; i++) item.gta_sep[i] = item.gta_sep[i].trim();
}

itemUtils.correspondenciaTiradores = function(item, tiradores) {
    for (var j=0; j < tiradores.length; j++) {
        var tir_desc = tiradores[j].descripcion.replace("TIRADOR","").trim();
        var tir_alias = tiradores[j].alias.replace("Tirador","").trim();
        item.tiradores_code.push(tir_desc);
        item.tiradores_alias.push(tir_alias);
    } 
    console.log("Tiradores code: " + item.tiradores_code);
    console.log("Tiradores alias: " + item.tiradores_alias);
    
}

itemUtils.correspondenciaBloques = function(item, bloque, items_bloque) {
    var code = [];
    var alias = [];
    bloqueMinus = bloque.charAt(0).toUpperCase() + bloque.slice(1);
    for (var j=0; j < items_bloque.length; j++) {
        var tir_desc = items_bloque[j].descripcion.replace(bloque,"").trim();
        var tir_alias = items_bloque[j].alias.replace(bloqueMinus,"").trim();
        code.push(tir_desc);
        alias.push(tir_alias);
    } 
    var together = [];
    together.push(code);
    together.push(alias);
    
    item.correspondenciasB.set(bloque, together);
    console.log("Tiradores code: " + code);
    console.log("Tiradores alias: " + alias);
    
}


itemUtils.getGTAcode = function(item, name) {
    var modelo = name.split(";");
    var seleccionado = -1;
    for (var i=0; i<modelo.length; i++) {
        if (modelo[i].search("GTA") != -1) {
            seleccionado = modelo[i];
        }
    }
    
    if (seleccionado == -1) {
        return "";
    }
    else {
        seleccionado = seleccionado.replace("GTA","").toLowerCase();
        var gtas = seleccionado.split(" ");
        
        if (item.gta_code != null) {
            for (var i=0; i<gtas.length; i++) {
                var idx = item.gta_code.indexOf(gtas[i].trim());
                if (idx != -1) {
                   seleccionado = seleccionado.replace(gtas[i],item.gta_code[idx]).toLowerCase(); 
                }

            }
        }
        
        return seleccionado.trim();
    }
}


itemUtils.getGTAs = function(item, name) {
    var modelo = name.split(";");
    var seleccionado = -1;
    for (var i=0; i<modelo.length; i++) {
        if (modelo[i].search("GTA") != -1) {
            seleccionado = modelo[i];
        }
    }
    
    if (seleccionado == -1) {
        return "";
    }
    else {
        seleccionado = seleccionado.replace("GTA","").toLowerCase().trim();
        var gtas = seleccionado.split(" ");
        if (item.gta_code != null) {
            /*console.log("SELECCIONADO");
            console.log(seleccionado);
            console.log("GTA_CODE");
            console.log(item.gta_code);
            console.log(gtas);
            console.log("GTA_ALIAS");
            console.log(item.gta_alias);*/
            
            for (var i=0; i<gtas.length; i++) {
                var idx = item.gta_code.indexOf(gtas[i].trim());
                if (idx != -1) {
                   seleccionado = seleccionado.replace(gtas[i],item.gta_alias[idx]).toLowerCase(); 
                } else {
                   seleccionado = seleccionado.replace(gtas[i],"").toLowerCase();  
                }
            }
        }
        
        return seleccionado;
    }
}

itemUtils.getModelosTirador = function(item) {
   /////////////////
    // MOD Rafa. Almacenamos el numero de materials de tiradores
    var modelosTirador = [];
    for (var i = 0; i < item.material.length; i++){
        var mat = item.material[i];
        //console.log("Estoy en getModelosTirador");
        var nomTirador = item.getNombreTirador(mat.name);
        if ((mat.name.search("TIRADOR") != -1) && (modelosTirador.indexOf(nomTirador) == -1)) {
            modelosTirador.push(nomTirador);
            item.numModelosTirador =  item.numModelosTirador  + 1;
        }
    }
    return modelosTirador;
    ///////////////// 
}

itemUtils.getModelosBloquePorGrupo = function(item, nombre_bloque, grupo) {
   /////////////////
    // MOD Rafa. Almacenamos el numero de materials de tiradores
    var modelosBloque = [];
    for (var i = 0; i < item.material.length; i++){
        var mat = item.material[i];
        //console.log("Estoy en getModelosTirador");
        var nomBloque = item.getNombreBloque(mat.name,nombre_bloque);
        
        if ((mat.name.search(nombre_bloque) !== -1) && (mat.name.search(grupo) !== -1) && (modelosBloque.indexOf(nomBloque) === -1)) {
            modelosBloque.push(nomBloque);
        }
    }
    return modelosBloque;
    ///////////////// 
}

itemUtils.getModelosBloque = function(item, nombre_bloque) {
   /////////////////
    // MOD Rafa. Almacenamos el numero de materials de tiradores
    var modelosBloque = [];
    for (var i = 0; i < item.material.length; i++){
        var mat = item.material[i];
        //console.log("Estoy en getModelosTirador");
        var nomBloque = item.getNombreBloque(mat.name,nombre_bloque);
        if ((mat.name.search(nombre_bloque) != -1) && (modelosBloque.indexOf(nomBloque) == -1)) {
            modelosBloque.push(nomBloque);
        }
    }
    return modelosBloque;
    ///////////////// 
}

itemUtils.clone = function(item) {
   
}

itemUtils.isItemBloqueInAllGroups = function(item, bloque, item_bloque) {
    var encontrado = true;
    var grupos = utils.getGruposDeBloque(item.material, bloque,item.superfluas);
    for (var j = 0; j < grupos.length; j++){
        var idxGrupos = utils.getIndicesPorGrupo_bloque(item.material, grupos[j], bloque);
        //console.log("G: " + grupos[j] + " IDXGRUPOS: " + idxGrupos);
        var visto = 0;
        for (var i = 0; i < idxGrupos.length; i++){
            var mat = item.material[idxGrupos[i]];	
            if ((mat.name.search(item_bloque + ";") != -1) || (mat.name.search(item_bloque + " ;") != -1)) {
                visto = 1;
            }
        }
        if (visto == 0) {
            encontrado = false;
            break;
        }
    }
    return encontrado;
}

itemUtils.aplicarRestriccionDependencia = function(item,grupo_pieza,itemBloquePadre,todosLosGrupos) {
    
    var allGroups = todosLosGrupos || false;

    // Obtengo los bloques y palabras para buscar informacion
    var bloques = JSON.parse(item.metadata.allBloques); 
    var palabras = JSON.parse(item.metadata.allPalabras); 
    
    var palabrasHijas = utils.getPalabrasHijas(palabras,grupo_pieza);
    
    if (palabrasHijas.length > 0) {
        for (var i=0; i < palabrasHijas.length; i++) {
            var itemBloqueHija = item.getItemActivoFromGrupo("PIEZA " + palabrasHijas[i]);
            if (itemBloqueHija !== null) {
                
                // Comprobar si el bloque hijo depende del padre
                var hayDependencia = utils.bloqueHijoDependeBloquePadre(bloques,itemBloquePadre,itemBloqueHija);
                if (hayDependencia) {
                    
                    // Dado que hay dependencia compruebo si el item bloque hijo actual es válido con el 
                    // cambio al item bloque padre
                    isModificable = utils.comprobarDependencia(bloques,itemBloquePadre,itemBloqueHija);

                    // Me quedo con nombre del bloque hijo
                    var blqHijaNameRaw = itemBloqueHija.split(" ");
                    blqHija = blqHijaNameRaw[0].trim();
                    
                    // Obtenemos los items del bloque a partir del JS
                    var modelosBloqueGrupo = item.getModelosBloquePorGrupo(blqHija,"PIEZA " + palabrasHijas[i]);

                    // Obtenemos los items que valen para ese grupo en funcion del padre
                    var itemsLimited = item.getItemsBloqueLimited(blqHija,"PIEZA " + palabrasHijas[i]);

                    utils.inicializarOpcionesBloque(blqHija,itemsLimited,modelosBloqueGrupo);        

                    if (!isModificable) {
                        // Tengo que cambiar el item de bloque hijo para que sea válido
                        
                        // Obtengo la lista de items de bloque válidos para el item de bloque padre ordenados
                        items_bloque_validos = utils.getListaItemsBloqueValidos(bloques,itemBloquePadre,blqHija,'descripcion');
                        if (items_bloque_validos.length > 0) {
                            // Asigno el primero
                            item.setItemBloqueRawGrupo(blqHija,items_bloque_validos[0],palabrasHijas[i]);
                                        
                            // Cambiamos el item en el bloque en la selección
                            utils.cambiarValorDesplegableBloque(blqHija,blqHija + " " + items_bloque_validos[0],palabrasHijas[i]);
                            
                            // Compruebo si hay bloques que dependan de este y si el cambio provoca algún cambio en cascada
                            item.aplicarRestriccionDependencia(palabrasHijas[i], items_bloque_validos[0],allGroups);
                            
                            // Para usarlo despues si es necesario
                            itemBloqueHija = blqHija + " " + items_bloque_validos[0];
                        }
                        
                    } else {
                        // Cambiamos el item en el bloque en la selección
                        utils.cambiarValorDesplegableBloque(blqHija,itemBloqueHija,palabrasHijas[i]);
                            
                        
                    }
                    
                    // Si la opción de todos los elementos está marcada en el padre hay que marcarla en los hijos
                    if (allGroups) {
            
                        var modelosBloque = item.getModelosBloque(blqHija);

                        // Obtengo todos los items de bloque de ese bloque y mantengo el que está 
                        const blq = bloques.find(elemento => elemento.descripcion === blqHija);
                        
                        utils.inicializarOpcionesBloque(blq.descripcion,blq.items,modelosBloque);   
                        
                        utils.cambiarValorDesplegableBloque(blqHija,itemBloqueHija,"-1");

                    }
        
                    
                }
            }
        }  
        
    }
    
    // Compruebo si alguno de los bloques que no son el padre es bloque dependiente del padre
    /*for (var i = 0; i < bloques.length; i++) {
        var blq = bloques[i];
        console.log("BLOQUE: " + blq);
        if (blq.descripcion.toLowerCase() !== bloque.toLowerCase()) {

            var modelosBloque = item.getModelosBloque(blq.descripcion);

            if (modelosBloque.length > 0) {
                var isDependiente = isBloqueDependiente(blq,bloque,bloques);
                if (isDependiente) {
                    // Me quedo con la opción actual
                    var opcionActual = $('#item-' + blq.descripcion.toLowerCase() + ' option:selected').val();
                    var opcionActualBorrada = false;    
                }
            }
        }
    }
    
    var res = utils.tieneBloqueDependiente(blqPadreName,bloques); */
    
}

itemUtils.getItemsBloqueLimited = function(item,bloque,grupo_pieza) {
    
    // Obtengo los bloques y palabras para buscar informacion
    var bloques = JSON.parse(item.metadata.allBloques); 
    var palabras = JSON.parse(item.metadata.allPalabras); 
    
    const blq = bloques.find(elemento => elemento.descripcion === bloque);
    var items = blq.items;
    
    var isDependiente = utils.isBloqueDependiente(bloque,bloques);
    
    palabraPadre = null;
    if (isDependiente) {  // el bloque es dependiente
        var palabraPadre = utils.getPalabraPadre(palabras,grupo_pieza);
    } 
    if (palabraPadre !== null) {
        var itemBloquePadre = item.getItemActivoFromGrupo("PIEZA " + palabraPadre);
        if (itemBloquePadre !== null) {
            items = utils.getListaItemsBloqueValidos(bloques,itemBloquePadre,bloque,'item');
            
        }
    }
    return items;
}

 // Comprobamos si sobre ese grupo se puede aplicar el item de bloque
itemUtils.isGrupoModificable = function(item,grupo_pieza,bloque,item_bloque) {
    
    var isModificable = true;
    
    // Obtengo los bloques y palabras para buscar informacion
    var bloques = JSON.parse(item.metadata.allBloques); 
    var palabras = JSON.parse(item.metadata.allPalabras); 
    
    // Compruebo si el bloque es dependiente de otro superior (padre)
    var isDependiente = utils.isBloqueDependiente(bloque,bloques);
    palabraPadre = null;
    if (isDependiente) {  // el bloque es dependiente
        var palabraPadre = utils.getPalabraPadre(palabras,grupo_pieza);
    } 
    if (palabraPadre !== null) {
        var itemBloquePadre = item.getItemActivoFromGrupo("PIEZA " + palabraPadre);
        if (itemBloquePadre !== null) {
            isModificable = utils.comprobarDependencia(bloques,itemBloquePadre,item_bloque);
        }
    }
    return isModificable;
}

itemUtils.setItemBloqueRawGrupo = function(item, bloque, item_bloque, grupo) {
    var idxGrupos = utils.getIndicesPorGrupo_bloque(item.material, grupo, bloque);
    console.log("G: " + grupo + " IDXGRUPOS: " + idxGrupos);
    var idxItemActivos = utils.getIdxItemActivoPorGrupo(item.material, idxGrupos);

    var activado = 0;
    for (var i = 0; i < idxGrupos.length; i++){
        var mat = item.material[idxGrupos[i]];	
        if ((mat.name.search(item_bloque + ";") !== -1) || (mat.name.search(item_bloque + " ;") !== -1)) {
            mat.visible = true;
            mat.needsUpdate = true;
            activado = 1;
        }
        else if (mat.name.search(bloque) !== -1) {
            mat.visible = false;
            mat.needsUpdate = true;
        }
    }
    if (activado === 0) {
        console.log("No activado en Grupo " + grupo + " el item bloque " + item_bloque);
        for (var i = 0; i < idxItemActivos.length; i++){
            var mat = item.material[idxItemActivos[i]];
            mat.visible = true;
            mat.needsUpdate = true;
        }
    }
}

itemUtils.setItemBloqueRaw = function(item,bloque,item_bloque,idCatalogo,grupo) {

    var grupoInput = grupo || null;
    
    console.log("Bloque: " + bloque + ", ItemBloque: " + item_bloque + ", IDCatalogo: " + idCatalogo);
    if (item.metadata.idCatalogo === idCatalogo) {
        
        var seAplica = false;
        var todosLosGrupos = false;
        // Lógica para aplicar el item de bloque a un grupo o a todos
        var grupos = [];
        if (grupoInput === null) {
            todosLosGrupos = true;
            grupos = utils.getGruposDeBloque(item.material, bloque,item.superfluas);
        } else {
            grupos.push(grupoInput);
        }
         
        console.log("GRUPOS: " + grupos);
        for (var j = 0; j < grupos.length; j++){
           // Comprobamos si sobre ese grupo se puede aplicar el item de bloque
           var esModificable = item.isGrupoModificable(grupos[j],bloque, item_bloque); 
           if (esModificable) {
               
               seAplica = true;
               // Si es valido para ese grupo lo aplico
               item.setItemBloqueRawGrupo(bloque,item_bloque,grupos[j]);
               
               // Compruebo si hay bloques que dependan de este y si el cambio provoca algún cambio en cascada
               item.aplicarRestriccionDependencia(grupos[j], item_bloque,todosLosGrupos);
            }
        }
        
        if (!seAplica) {
            utils.mostrarMensajeNoPermitido(i18n.t('menuobj.itemBloqueNoAplicado'));
        }
        
        item.scene.needsUpdate = true;
    }
}

itemUtils.getGruposDeBloque = function(item, bloque) {
    return utils.getGruposDeBloque(item.material, bloque,item.superfluas);
}

itemUtils.resetearTexturas = function(item) {
    
    var materials = item.material;
    // Elimino todas las texturas
    for (var i = 0; i < materials.length; i++){
            var mat = materials[i];
            if (mat.name.search("UNICO") == -1) {
                mat.map = null;	
                mat.needsUpdate = true;	
            }
    }
    //console.log("resetearTexturas " + item.scene.needsUpdate);
    item.scene.needsUpdate = true;
}

itemUtils.getItemActivo = function(item, bloque) {
    var itemActivo = [];
    //console.log("[getItemActivo] materialOcultosAbrir " + item.materialOcultosAbrir);
    //var first = true;
    for (var i = 0; i < item.material.length; i++){
        var mat = item.material[i];	
        // Compruebo dos opciones: si está visible o si no lo está pero está almacenado
        // como oculto tras abrir puertas
        
        if ((mat.name.search(bloque) != -1) && 
                ((mat.visible == true) || (item.materialOcultosAbrir.indexOf(i) != -1))) {
            //console.log("Tirador: " + mat.name + " Transparencia: " + mat.transparent);
            //console.log("Estoy en getTiradorActivo");
            itemActivo = item.getNombreBloque(mat.name, bloque);
            return itemActivo;
        }
    }
    return itemActivo;
}

itemUtils.getItemActivoFromGrupo = function(item, grupo) {
    var seleccionado = null;
    //console.log("[getItemActivo] materialOcultosAbrir " + item.materialOcultosAbrir);
    //var first = true;
    for (var i = 0; i < item.material.length; i++){
        var mat = item.material[i];	
        // Compruebo dos opciones: si está visible o si no lo está pero está almacenado
        // como oculto tras abrir puertas
        
        if ((mat.name.search(grupo) != -1) && 
                ((mat.visible == true) || (item.materialOcultosAbrir.indexOf(i) != -1))) {
            //console.log("Tirador: " + mat.name + " Transparencia: " + mat.transparent);
            //console.log("Estoy en getTiradorActivo");
            var modelo = mat.name.split(";");
            if (modelo.length > 2) {
                seleccionado = modelo[0];
                return seleccionado.toUpperCase().trim();
            }
        }
    }
    return seleccionado;
}


itemUtils.getTiradorActivo = function(item) {
    var tiradorActivo = [];
    for (var i = 0; i < item.material.length; i++){
        var mat = item.material[i];	
        if ((mat.name.search("TIRADOR") != -1) && (mat.visible == true)) {
            //console.log("Tirador: " + mat.name + " Transparencia: " + mat.transparent);
            //console.log("Estoy en getTiradorActivo");
            tiradorActivo = item.getNombreTirador(mat.name);
        }
    }
    return tiradorActivo;
}

itemUtils.bloqueEncontrado = function(name,bloques) {
    var enc = -1;
    for (var i = 0; i < bloques.length; i++){
        if (name.search(bloques[i]) != -1) {
            enc = 1;
            break;
        }
    }
    return enc;
}

itemUtils.inicializarBloques = function (item, bloquesIn) {
            
    var bloques = JSON.parse(bloquesIn); 
    for (var i = 0; i < bloques.length; i++) {
        var blq = bloques[i];
        
        // Solo aquéllos bloques que son del catalogo de la pieza
        if (blq.idCatalogo == item.metadata.idCatalogo) {
            // Obtenemos los items del bloque a partir del JS
            var modelosBloque = item.getModelosBloque(blq.descripcion);

            if (modelosBloque.length > 0) {
                var modelosBloqueSort = [];
                var items_bloque = blq.items;
                
                for (var j = 0; j < items_bloque.length; j++) {
                    var ibloque = items_bloque[j];
                    var n = blq.descripcion + " " + ibloque.descripcion; 
                    if (modelosBloque.indexOf(n) !== -1) {
                        // Comprobamos si el item de bloque está en todos los grupos
                        if (item.isItemBloqueInAllGroups(blq.descripcion, ibloque.descripcion)) {
                            var tir = {
                              valor : n,
                              alias : ibloque.alias
                            };
                            modelosBloqueSort.push(tir);
                        }
                    }
                }
                //$.each(items_bloque, function (item, item) {
                    
                //});
                
                item.correspondenciaBloques(blq.descripcion, items_bloque);
                item.addBloque(blq.descripcion, blq.aliasPresupuesto);
                
                // Asignamos el valor inicial al bloque detectado
                item.setItemBloqueRaw(blq.descripcion, modelosBloqueSort[0].valor,item.metadata.idCatalogo);
                
            }
        }
    }

}

itemUtils.inicializarPalabras = function (item, palabrasIn) {
            
    var palabras = JSON.parse(palabrasIn); 
    for (var i = 0; i < palabras.length; i++) {
        var pal = palabras[i];
        
        // Solo aquellas palabras que son del catalogo de la pieza
        if (pal.idCatalogo == item.metadata.idCatalogo) {
            //console.log(pal);
            //console.log(pal.superflua == true);
            item.addPalabra(pal.descripcion, pal.alias.toLowerCase(), pal.superflua);
        }
    }

}

itemUtils.setItemBloque = function(item, bloque, item_bloque, idCatalogo,grupo) {
    if (item.scene.textureScene) {
        item.scene.bloqueItems(bloque, item_bloque, idCatalogo);
    } 
    else {
        item.setItemBloqueRaw(bloque, item_bloque ,idCatalogo,grupo);
    }
}

itemUtils.setModeloTirador = function(item, modelo, idCatalogo) {
    if (item.scene.textureScene) {
        item.scene.tiradoresItems(modelo,idCatalogo);
    } 
    else {
        item.setModeloTiradorRaw(modelo,idCatalogo);
    }
}

itemUtils.setModeloTiradorRaw = function(item, modelo, idCatalogo) {
    console.log("IDCatalogo: " + idCatalogo);
    if (item.metadata.idCatalogo == idCatalogo) {
        var grupos = utils.getGruposDeTiradores(item.material, item.superfluas);
        //console.log("GRUPOS: " + grupos);
        for (var j = 0; j < grupos.length; j++){
            var idxGrupos = utils.getIndicesPorGrupo(item.material, grupos[j]);
            //console.log("G: " + grupos[j] + " IDXGRUPOS: " + idxGrupos);
            var idxTiradorActivo = utils.getIdxTiradorActivoPorGrupo(item.material, idxGrupos);
            var activado = 0;
            for (var i = 0; i < idxGrupos.length; i++){
                var mat = item.material[idxGrupos[i]];	
                if ((mat.name.search(modelo + ";") != -1) || (mat.name.search(modelo + " ;") != -1)) {
                    mat.visible = true;
                    //mat.transparent = false;
                    //mat.opacity = 1.0;
                    mat.needsUpdate = true;
                    activado = 1;
                }
                else if (mat.name.search("TIRADOR") != -1) {
                    
                    //tiradores.push(i);
                    mat.visible = false;
                    //mat.transparent = true;
                    //mat.opacity = 0.0;
                    //console.log("T " + mat.name + " " + mat.visible + " " + mat.transparent + " " + mat.opacity);
                
                    mat.needsUpdate = true;
                    //console.log(mat);
                }
            }
            if (activado == 0) {
                var mat = item.material[idxTiradorActivo];
                mat.visible = true;
                //mat.transparent = false;
                //mat.opacity = 1.0;
                mat.needsUpdate = true;
            }
        }
        //console.log("setModeloTiradorRaw " + item.scene.needsUpdate);
        item.scene.needsUpdate = true;
    }
    /*for (var i = 0; i < item.material.materials.length; i++){
        var mat = item.material.materials[i];	
        if ((mat.name.search(modelo + ";") != -1) || (mat.name.search(modelo + " ;") != -1)) {
            mat.transparent = false;
            mat.opacity = 1.0;
            mat.needsUpdate = true;
        }
        else if (mat.name.search("TIRADOR") != -1) {
            //tiradores.push(i);
            mat.transparent = true;
            mat.opacity = 0.0;
            mat.needsUpdate = true;
            //console.log(mat);
        }
    }
    item.scene.needsUpdate = true;*/
}

// intersection has attributes point (vec3) and object (THREE.Mesh)
// MOD Rafa
//itemUtils.clickPressed = function(intersection) {
itemUtils.clickPressed = function(item, intersection,myIntersectedObjects) {
//
    var scene = item.scene; 
    var callback = function() {
      scene.needsUpdate = true;
    }
    
    item.dragOffset.copy(intersection.point).sub(item.position);
    item.moveToPosition(
            intersection.point.sub(item.dragOffset), 
            intersection);
    
    //////////////////////////
    // MOD Rafa. Asignamos el objeto interseccion
    if (myIntersectedObjects) {
        item.myIntersection = myIntersectedObjects[0];
        console.log("Num. objetos intersectados: " + myIntersectedObjects.length);
    }
    //////////////////////////
    
    //////////////////////////
    // MOD Rafa. Asignamos la textura ya seleccionada sobre el subobjeto clickado
    
    if (item.rightClick && item.textureFill) {
        var materials = item.material;
	
        //var idxFace = item.myIntersection.faceIndex;
        //var idxMaterial = item.geometry.faces[idxFace].materialIndex;
        var mat;
        if (!item.isGroup) {
            var idxMaterial = item.myIntersection.face.materialIndex;
            mat = materials[idxMaterial];
            console.log("El indice del material es " + idxMaterial);
            console.log("El número de materiales es " + materials.length);
        } else {
            mat = item.myIntersection.mesh.material;
        }

        //for (var i = 0; i < materials.length; i++){
        
        var texturaCargada = new THREE.TextureLoader().load(item.textureSelected.url, callback);
        // MOD Rafa. Si el elemento al que quiero cambiar la textura es un tirador
        // se cambia a todos los tiradores que están en la misma posición
        
        if (utils.bloqueEncontrado(mat.name,item.bloques) != -1)  {
        //if (mat.name.search("TIRADOR") != -1) {
            var bloque = utils.getBloque(mat.name,item.bloques);
            var grupo_encontrado = utils.getGrupoTirador(mat.name);
            //console.log("Grupo Encontrado: " + grupo_encontrado);  
            
            //var grupo = utils.filtrarGrupo(grupo_encontrado);
            console.log("Bloque: " + bloque + ", Grupo: " + grupo_encontrado);     
         //   var objects = myIntersectedObjects;
            console.log("Es bloque, cambio texturas de todos los tiradores");
            var permitida = false;
            var mensaje = "";
            var gta = item.textureSelected.gta.toUpperCase();
            console.log("GT textura :" + gta);
            for (var i = 0; i < materials.length; i++){
                var mat2 = materials[i];
            
                //if ((mat2.name.search(bloque) != -1) && (mat2.name.search(grupo_encontrado) != -1) 
                //        && (mat2.name.search("UNICO") == -1)) {
                if ((mat2.name.search(bloque) != -1) && (utils.getGrupoTirador(mat2.name) == grupo_encontrado) 
                        && (mat2.name.search("UNICO") == -1)) {
                
                    //console.log(i + " COLOREADO: " + mat2.name);
                    
                    if ((gta == "") || (mat2.name.search(gta) != -1)) {
                        //console.log(mat.name + " " + gta);
                        mat2.map = texturaCargada;
                        //mat2.map = THREE.ImageUtils.loadTexture( item.textureSelected.url )
                        mat2.map.minFilter = THREE.LinearFilter;
                        mat2.map.name = item.textureSelected.name;
                        mat2.needsUpdate = true;
                        permitida = true;
                    }
                    else {
                        mensaje = item.getGTAs(mat.name);
                        //console.log(mat.name);
                        
                    }
                }
            }
            if (!permitida) {
                console.log(mat.name);
                utils.mostrarMensajeNoPermitido(i18n.t('menuobj.texturanopermitida') + ": " + mensaje);
                
            }
        }
        else if (mat.name.search("UNICO") == -1)  {
            var gta = item.textureSelected.gta.toUpperCase();
            if ((gta == "") || (mat.name.search(gta) != -1)) {
                console.log(mat.name + " " + gta);
                mat.map = texturaCargada;
                //mat.map = THREE.ImageUtils.loadTexture( item.textureSelected.url )
                mat.map.minFilter = THREE.LinearFilter;
                mat.map.name = item.textureSelected.name;
                mat.needsUpdate = true;	
            }
            else {
                console.log(mat.name);
                utils.mostrarMensajeNoPermitido(i18n.t('menuobj.texturanopermitida') + ": " + item.getGTAs(mat.name));
            }
        }
        //console.log("clickPressed " + item.scene.needsUpdate);
        item.scene.needsUpdate = true;
    }
    
    
    
};

itemUtils.clickDragged = function(item, intersection) {
    if (intersection) {    	
    	// keys a 0 para SI mostrar el error de posicion
    	var keys=0;
        //console.log("IntersectionPoint");
        //console.log(intersection.point);
        //console.log("dragOffset");
        //console.log(item.dragOffset);
       
        item.moveToPosition(
            intersection.point.sub(item.dragOffset), 
            intersection,keys);
        item.getWallDistance();
        item.updateHelper();
    }
};

itemUtils.rotate = function(item, intersection) {
    if (intersection) {
        var angle = utils.angle(
            0, 
            1, 
            intersection.point.x - item.position.x, 
            intersection.point.z - item.position.z);

        var snapTolerance = Math.PI / 16.0;

        // snap to intervals near Math.PI/2
        for (var i=-4; i <= 4; i++) {
            if ( Math.abs( angle - ( i * ( Math.PI / 2 ) ) ) < snapTolerance ) {
                angle = i * ( Math.PI / 2 );
                break;
            }
        }
        
        item.rotation.y = angle;
        item.getWallDistance();
    }
}

itemUtils.moveToPosition = function(item, vec3, intersection) {
    item.position.copy(vec3);
}

itemUtils.clickReleased = function(item) {
    if (item.error) {
        item.hideError();
    }
};

// Returns an array of planes to use other than the ground plane
// for passing intersection to clickPressed and clickDragged
itemUtils.customIntersectionPlanes = function() {
    return [];
}

// returns the 2d corners of the bounding polygon
// offset is Vector3 (used for getting corners of object at a new position)
// TODO: handle rotated objects better!
itemUtils.getCorners = function(item, xDim, yDim, position) {

    position = position || item.position;

    var halfSize = item.halfSize.clone();
    
    var nuevo_x = halfSize.x;
    if (item.simetria) {
        nuevo_x = - nuevo_x;
    }
    var c1 = new THREE.Vector3(-nuevo_x, 0, -halfSize.z);
    var c2 = new THREE.Vector3(nuevo_x, 0, -halfSize.z);
    var c3 = new THREE.Vector3(nuevo_x, 0, halfSize.z);
    var c4 = new THREE.Vector3(-nuevo_x, 0, halfSize.z);

    var transform = new THREE.Matrix4();
    // console.log(item.rotation.y);
    transform.makeRotationY(item.rotation.y); // + Math.PI/2)

    c1.applyMatrix4(transform);
    c2.applyMatrix4(transform);
    c3.applyMatrix4(transform);
    c4.applyMatrix4(transform);

    c1.add(position);
    c2.add(position);
    c3.add(position);
    c4.add(position);

    // halfSize.applyMatrix4(transform);

    // var min = position.clone().sub(halfSize);
    // var max = position.clone().add(halfSize);

    var corners = [
        {x: c1.x, y: c1.z},
        {x: c2.x, y: c2.z},
        {x: c3.x, y: c3.z},
        {x: c4.x, y: c4.z}
    ];

    return corners;
}

// 2D
itemUtils.getVertices = function(item, position) {

    position = position || item.position;

    var transform = new THREE.Matrix4();
    // console.log(item.rotation.y);
        transform.makeRotationY(item.rotation.y); // + Math.PI/2)

    var vertices = item.geometry.vertices;
    var vert = [];
    for (var i=0; i < vertices.length; i++) {
        var v = vertices[i].clone();
        v.applyMatrix4(transform);
        v.add(position);
        vert.push(v);
    }

    return vert;
}

itemUtils.showError = function(item, vec3) {
    vec3 = vec3 || item.position;
    if (!item.error) {
        item.error = true;
        item.errorGlow = item.createGlow(item.errorColor, 0.8, true);
        item.scene.add(item.errorGlow);
    }
    item.errorGlow.position.copy(vec3);
}

itemUtils.showHelper = function(item, vec3) {
    vec3 = vec3 || item.position;
    if (!item.helper) {
        item.helper = true;
        item.helperGlow = item.createHelper(item.errorColor, 0.8, true);
        
        item.helperGlow.visible = false; 
        item.scene.add(item.helperGlow);
        
        item.helperBox = new THREE.BoxHelper( item.helperGlow, 0x0000ff  );
        item.helperBox.material.linewidth = 10;
        item.scene.add(item.helperBox);

        
    }
   
    item.helperGlow.position.copy(vec3);
    item.helperGlow.rotation.copy(item.rotation);
    item.helperGlow.scale.copy(item.scale);
    item.helperBox.update();
    
}
itemUtils.hideError = function(item) {
    if ( item.error) {
        item.error = false;
        item.scene.remove( item.errorGlow );
        
        
    }
}

itemUtils.hideHelper = function(item) {
    if ( item.helper) {
        item.helper = false;
        item.scene.remove( item.helperGlow );
        item.scene.remove( item.helperBox );
    }
}

itemUtils.objectHalfSize = function(item) {
    
     
    var objectBox = new THREE.Box3();
    objectBox.copy( item.geometry.boundingBox );
    //objectBox.setFromObject( item );
    return objectBox.max.clone().sub( objectBox.min ).divideScalar( 2 );
}

itemUtils.createHelper = function( item, color, opacity, ignoreDepth ) {
        
        
        //box helper to see the extend of the volume
        /*const geometry = new THREE.BoxGeometry( volume.xLength, volume.yLength, volume.zLength );
        const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        const cube = new THREE.Mesh( geometry, material );
        cube.visible = false;
        const box = new THREE.BoxHelper( cube );
        scene.add( box );
        box.applyMatrix4( volume.matrix );
        scene.add( cube );*/
        
    
        /*var object = item;
        var glow = new THREE.BoxHelper( object, 0xffff00 );
		
	//var glow = new THREE.Mesh(item.geometry.clone(), glowMaterial);
	glow.position.copy(object.position);
	glow.rotation.copy(object.rotation);
        glow.scale.copy(object.scale);
        
        /*for (var i=0; i < item.children.length; i++) {
            object = item.children[i];
            var glow1 = new THREE.BoxHelper( object, 0x0000ff );

            //var glow = new THREE.Mesh(item.geometry.clone(), glowMaterial);
            glow1.position.copy(object.position);
            glow1.rotation.copy(object.rotation);
            glow1.scale.copy(object.scale);
            item.scene.add(glow1);
        }
	return glow;*/
    
        const glowMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        
        const box3 = new  THREE.Box3();
        
        //box3.copy( item.geometry.boundingBox ).applyMatrix4( item.matrixWorld );
        box3.copy( item.geometry.boundingBox );
        //item.geometry = undefined;
        //box3.setFromObject(item);
   
        // make a BoxBufferGeometry of the same size as Box3
        const dimensions = new THREE.Vector3().subVectors( box3.max, box3.min );
        const boxGeo = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);

        var glow = new THREE.Mesh(boxGeo, glowMaterial);
	
        //glow = new THREE.Box3();
        //glow.copy( item.geometry.boundingBox ).applyMatrix4( item.matrixWorld );
		
	//var glow = new THREE.Mesh(item.geometry.clone(), glowMaterial);
	glow.position.copy(item.position);
	glow.rotation.copy(item.rotation);
        glow.scale.copy(item.scale);
	return glow;
    
};

itemUtils.createGlow = function( item, color, opacity, ignoreDepth ) {
    ignoreDepth = ignoreDepth || false;
    opacity = opacity || 0.2;
	var glowMaterial = new THREE.MeshBasicMaterial ({
		color: color,
		blending: THREE.AdditiveBlending,
		opacity: 0.2,
		transparent: true,
        depthTest: !ignoreDepth
	});
        
        const box3 = new  THREE.Box3();
        //item.geometry = undefined;
        //box3.copy( item.geometry.boundingBox ).applyMatrix4( item.matrixWorld );
        //box3.setFromObject(item);
        box3.copy( item.geometry.boundingBox );
        // make a BoxBufferGeometry of the same size as Box3
        const dimensions = new THREE.Vector3().subVectors( box3.max, box3.min );
        const boxGeo = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);

        var glow = new THREE.Mesh(boxGeo, glowMaterial);
	
        //glow = new THREE.Box3();
        //glow.copy( item.geometry.boundingBox ).applyMatrix4( item.matrixWorld );
		
	//var glow = new THREE.Mesh(item.geometry.clone(), glowMaterial);
	glow.position.copy(item.position);
	glow.rotation.copy(item.rotation);
        glow.scale.copy(item.scale);
	return glow;
};


module.exports = itemUtils;


