import * as THREE from 'three';

var utils = require('../utils/utils');


var Item = function(model, metadata, geometry, material, position, rotation, scale) {

    // this.three = three;
    // this.model = three.getModel();
    // this.scene = three.getScene();
    // this.controller = three.getController();
    this.model = model;
    this.scene = model.scene;
    //this.controller = model.getController();

    this.errorGlow = new THREE.Mesh();

    this.boundToFloor = false;
    this.addToWall = false;
    this.hover = false;
    this.selected = false;
    this.highlighted = false;
    this.error = false;
    // MOD. Rafa. Se ha cambiado el color de emisión
    this.emissiveColorHover = 0x111111;
    this.emissiveColorSelected = 0x222222;
    //this.emissiveColor = 0x444444;
    this.errorColor = 0xff0000;
    
    //Distancia con las paredes de los cuatro planos del objeto
    this.northWall;
    this.southWall;
    this.westWall;
    this.eastWall;
    
    /////////////////
    // MOD Rafa. Variable para guardar el objeto de interseccion
    this.myIntersection;
    /////////////////
  
    this.corr_width = 0;
    this.corr_height = 0;
    this.corr_depth = 0;
    this.simetria = false;
    /////////////////
    // MOD Rafa. Variable para detectar si se ha pulsado la tecla t (textura)
    this.tPressed = false;
    // Variable para detectar si se ha pulsado la tecla q (tiradores)
    this.qPressed = false;
    // Variable para detectar si se ha pulsado el boton derecho del raton
    this.rightClick = false;
    /////////////////
  
    /////////////////
    // MOD Rafa. Guardamos la textura seleccionada
    this.textureSelected;
    /////////////////
    
    // Sirve para inicializar los tiradores y bloques existentes
    this.bloquesInicializados = false; 
   
    //Array para guardar las lineas
    this.north = new Array();
    this.east = new Array();
    this.south = new Array();
    this.west = new Array();
    
    //Mostar u ocultar lineas auxiliares
    this.lineWalls = false;
    
    //Aplicar textura a toda la pieza
    this.textureFill = false;
    
    //Indica si el item está abierto o cerrado
    this.openModule = false;
    
    // Indica si el item es cajeado: 0 no cajeado, 1 cajeado con pilar, 2 cajeado con viga
    this.cajeado = 0;
   
    //Array para guardar las posiciones de los materiales iniciales que contienen textura
    this.materialsFill;

    this.metadata = JSON.parse(JSON.stringify(metadata));
    this.resizable = metadata.resizable;

    if (!geometry.isGroup) {
        THREE.Mesh.call(this, geometry, material);
    } else {
        THREE.Group.call(this);
        this.children = geometry.children;
        
        this.castShadow = geometry.castShadow;
        this.frustumCulled =  geometry.frustumCulled;
        this.layers = geometry.layers;
        this.matrix = geometry.matrix;
        this.matrixWorld = geometry.matrixWorld;
        this.quaternion.copy(geometry.quaternion);
        this.receiveShadow = geometry.receiveShadow;
        this.renderOrder = geometry.renderOrder;
        
        this.position.copy(geometry.position); 
        this.rotation.copy(geometry.rotation);
        this.parent = geometry.parent;
        this.up.copy(geometry.up);
        
        this.scale.copy(geometry.scale);
        //
                
        this.material = material;
    }
    this.isGroup = (this.type == "Group");
    this.isMesh = (this.type == "Mesh");
    
    this.castShadow = true;
    this.receiveShadow = true; // comprobar que funciona bien

   
    // does this object affect other floor items
    this.obstructFloorMoves = true;

    this.materialsSep = [];
    
    // Necesario para que cuando reemplazamos una pieza especial tras modificar
    // medidas quede seleccionada
    //if (metadata.reemplazo) {
    //    this.position_set = false;
    //}

    // show rotate option in context menu
    this.allowRotate = true;
    this.fixed = false;
    this.arrowHide = false;

    // dragging
    this.dragOffset = new THREE.Vector3();

    boundingBox = new  THREE.Box3();
    if (geometry.isGroup) {
        boundingBox.setFromObject(this);
              
    } else {
        var cubeA = new THREE.Mesh( geometry, material );
        boundingBox.setFromObject(cubeA);
    }
    
    const low = boundingBox.min;
    const high = boundingBox.max;

    const corner1 = new THREE.Vector3(low.x,    low.y,  low.z);
    const corner2 = new THREE.Vector3(high.x,   low.y,  low.z);
    const corner3 = new THREE.Vector3(low.x,    high.y, low.z);
    const corner4 = new THREE.Vector3(low.x,    low.y,  high.z);

    const corner5 = new THREE.Vector3(high.x,   high.y, low.z);
    const corner6 = new THREE.Vector3(high.x,   low.y,  high.z);
    const corner7 = new THREE.Vector3(low.x,    high.y, high.z);
    const corner8 = new THREE.Vector3(high.x,   high.y, high.z);
    
    if (!geometry.isGroup) {
        // center in its boundingbox
        this.geometry.computeBoundingBox();
        this.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(
            - 0.5 * ( this.geometry.boundingBox.max.x + this.geometry.boundingBox.min.x ),
            - 0.5 * ( this.geometry.boundingBox.max.y + this.geometry.boundingBox.min.y ),
            - 0.5 * ( this.geometry.boundingBox.max.z + this.geometry.boundingBox.min.z )
        ) );

        this.geometry.computeBoundingBox();
    } else {
        this.geometry = [];
        this.geometry.boundingBox = [];
        this.geometry.boundingBox = boundingBox;
        this.traverse( function(child) {
            if (child instanceof THREE.Mesh) {

              // apply custom material
              child.applyMatrix( new THREE.Matrix4().makeTranslation(
                    - 0.5 * ( boundingBox.max.x + boundingBox.min.x ),
                    - 0.5 * ( boundingBox.max.y + boundingBox.min.y ),
                    - 0.5 * ( boundingBox.max.z + boundingBox.min.z )
                ) );

              // enable casting shadows
              child.castShadow = true;
              child.receiveShadow = true;
              }
          });

    }
    
    this.halfSize = this.objectHalfSize();
    this.originalHalfSize = this.halfSize.clone();
    
    //console.log("Estoy en Item " + position);
    if (position) {
        this.position.copy(position);        
        this.position_set = true;
    } else {
        this.position_set = false;
    }
    
    if (rotation) {
        this.rotation.y = rotation;
    }
   
    // MOD Rafa. Inicializamos el desfase en altura en 0
    //this.desfaseAltura = 0.5 * ( this.geometry.boundingBox.max.y - this.geometry.boundingBox.min.y ) * scale.y;
    this.setDesfaseAltura(scale);
   
    // Indicamos la correccion por cada dimensión
    if (metadata.width != null) {
        console.log(metadata.width);
        this.corr_width = (this.getWidth() - metadata.width).toFixed(1);
        this.corr_height = (this.getHeight() - metadata.height).toFixed(1);
        this.corr_depth = (this.getDepth() - metadata.depth).toFixed(1);
        //console.log("Las dimensiones del JS son: " + this.getWidth() + ", " + this.getHeight() + ", " + this.getDepth());
        //console.log("Los metadatos son: " + metadata.width + ", " + metadata.height + ", " + metadata.depth);
        //console.log("Las correcciones son: " + this.corr_width + ", " + this.corr_height + ", " + this.corr_depth);
        //console.log("Las dimensiones son: " + this.getWidthCorr() + ", " + this.getHeightCorr() + ", " + this.getDepthCorr());
        
    }
    
    if (scale != null) {
        console.log("Scale: " + scale.x + "," + scale.y + "," + scale.z);
        this.setScale(scale.x, scale.y, scale.z);
        if (scale.x < 0) {
            this.simetria = true;
        } else {
            this.simetria = false;
        }
    }

    // MOD Rafa. Asignar tirador por defecto
    /*var tiradores = this.getModelosTirador();
    console.log("TIRADORES: " + tiradores);
    if (tiradores.length > 0) {
        console.log("Metadata.tirador: " + this.metadata.tirador);
        if (this.metadata.tirador != "") {
            this.setModeloTiradorRaw(this.metadata.tirador,this.metadata.idCatalogo);
        } else {
            this.setModeloTiradorRaw(tiradores[0],this.metadata.idCatalogo);
        }
    }*/
    //////
    this.gtas = this.getAllGTAs();
    this.gta_code = [];
    this.gta_alias = [];
    this.gta_sep = []; // GTAs que actuan como separadores de piezas en presupuesto
    
    this.tiradores_code = [];
    this.tiradores_alias = [];
    
    this.correspondenciasB = new Map();
    this.bloques = [];
    this.aliasBloques = [];
    this.palabras = [];
    this.aliasPalabras = [];
    this.superfluas = [];
    
    this.materialOcultosAbrir = [];
    
    // Prueba
    //this.edges = new THREE.EdgesGeometry( this.geometry, 15 );
    //this.lines = new THREE.LineSegments( this.edges, new THREE.LineBasicMaterial({ 
    //  color: 0x000000 }));  
};

Item.prototype = Object.create(THREE.Mesh.prototype);

Item.prototype.moveToPoint = function(event, camera){
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

	  var intersects = raycaster.intersectObjects( this.scene.getScene().children );

	  if ( intersects.length > 0 ) {
		  // cojo la posicion del clic
		  var position = intersects[ 0 ].point;		  
		  
		  // dependiendo del tipo de objeto cambio una coordenada u otra
		  var itemType = this.metadata.itemType;		  
		  switch (itemType){
		  case 1 || 8 || 9: // sobre el suelo (mesas, butacas, etc)
			  this.position.x = position.x;
			  // la y es la misma que tenia
			  this.position.z = position.z;		  
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
	this.setSelected();
	this.needsUpdate = true;
	
}


//Test animacion
Item.prototype.animate = function() {
//	var skinnedMesh = this;
//    var materials = skinnedMesh.material.materials;
// 
//    for (var k in materials) {
//        materials[k].skinning = true;
//    }
// 
//    THREE.AnimationHandler.add(skinnedMesh.geometry.animation);
//    animation = new THREE.Animation(skinnedMesh, "ArmatureAction", THREE.AnimationHandler.CATMULLROM);
//    animation.play();
	
//	var spotLight = new THREE.SpotLight(0xffffff, 1, 200, 20, 10);
//	spotLight.position.set( 0, 150, 0 );
//	  
//	var spotTarget = new THREE.Object3D();
//	spotTarget.position.set(0, 0, 0);
//	spotLight.target = spotTarget;
//	  
//	this.scene.add(spotLight);
//	this.scene.add(new THREE.PointLightHelper(spotLight, 1));
	
	
}

// Mover items con las flechas de direccion
Item.prototype.moveKeyUp = function (camera){
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
    if (!this.fixed){
            var vec3={
                    x: this.position.x+dir.x,
                    y: this.position.y+dir.y,
                    z: this.position.z+dir.z
            }
            // keys=1 para no mostrar la imagen roja erronea
            var keys=1;
            var newPos = new THREE.Vector3(vec3.x,vec3.y,vec3.z);
            this.moveToPosition(newPos,null,keys);
            this.updateHighlight();
            this.scene.needsUpdate = true;
            this.needsUpdate=true;
    }
}

Item.prototype.moveKeyDown = function (camera){
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
    if (!this.fixed){
            var vec3={
                x: this.position.x+dir.x,
                y: this.position.y+dir.y,
                z: this.position.z+dir.z
            }
            // keys=1 para no mostrar la imagen roja erronea
            var keys=1;
            var newPos = new THREE.Vector3(vec3.x,vec3.y,vec3.z);
            this.moveToPosition(newPos,null,keys);
            this.updateHighlight();
            this.scene.needsUpdate = true;
    }
}

Item.prototype.moveKeyLeft = function (camera){
    
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
    
    if (!this.fixed){
            //Compruebo el tipo de objeto a mover
            var tipo = this.metadata.itemType;

            //var dir = getCameraDirection(this);
            //console.log(dir);
            var vec3={
                x: this.position.x+dir.x,
                y: this.position.y+dir.y,
                z: this.position.z+dir.z
            }
            
            // keys=1 para no mostrar la imagen roja erronea
            var keys=1;
            this.moveToPosition(vec3,null,keys)
            this.updateHighlight();
            this.scene.needsUpdate = true;
    }
}

Item.prototype.moveKeyRight = function (camera){
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
    
    if (!this.fixed){

        //var dir = getCameraDirection(this);
        //console.log(dir);
            var vec3={
                x: this.position.x+dir.x,
                y: this.position.y+dir.y,
                z: this.position.z+dir.z
            }
            
            // keys=1 para no mostrar la imagen roja erronea
            var keys=1;
            this.moveToPosition(vec3,null,keys)
            this.updateHighlight();
            this.scene.needsUpdate = true;
    }
}

Item.prototype.remove = function() {
    this.scene.removeItem(this);
};

Item.prototype.setTextureRaw = function(texture){
    
    var materials = this.material;
    var scene = this.scene;
    var item = this;
    
    if (parseInt(texture.cat) == parseInt(item.metadata.idCatalogo)) {
        var t0 = performance.now();	
        //var texturaCargada = new THREE.TextureLoader().load( texture.url, callback(this) );
        var loader = new THREE.TextureLoader();
        loader.load(
            // resource URL
            texture.url,

            // onLoad callback
            function ( texturaCargada ) {
                    // in this example we create the material when the texture is loaded
                //scene.needsUpdate = true;
                for (var i = 0; i < item.materialsFill.length; i++){
                  var mat = materials[item.materialsFill[i]];

                  var gta = texture.gta.toUpperCase();
                  //console.log(mat.name + " " + gta);
                  if ((gta == "") || (mat.name.search(gta) != -1)) {

                      mat.map = texturaCargada;
                      mat.map.minFilter = THREE.LinearFilter;
                      //console.log("Nombre Tex: " + this.textureSelected.name);
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

Item.prototype.setTexture = function(texture, callback){
	callback = callback || function(){
		// this.scene.needsUpdate = true;
	}
	
        this.textureSelected = texture;
	
	//console.log("Estoy en la funcion de texturas");
	
        // Aplico la textura a todos los objetos de la escena
        if (this.scene.textureScene) {
            this.scene.textureItems(texture);
        } 
        else {
            // Aplico la textura al modulo actual siempre que no sea una pieza
            if (!this.textureFill){ //Textura completa para los materiales añadidos en "materialsFill"
               this.setTextureRaw(texture);
            }
        }

	
}

Item.prototype.getMaterialsWithGTAIncluded = function(gta) {
    
    var listMaterials = [];
    var idx = this.gta_alias.indexOf(gta.toLowerCase().trim());
    if (idx != -1) {
       gta_c = this.gta_code[idx].toUpperCase().trim();
       //console.log("[getMaterialsWithGTAIncluded] GTA_code " + gta_c + " " + gta);  
    
        var materials = this.material;
        for (var i = 0; i < materials.length; i++){
            var mat = materials[i];
            //console.log("[getMaterialsWithGTAIncluded] Buscando... " + mat.name + " " + gta_c);      
            if (mat.name.search(gta_c) != -1) {
                //console.log("[getMaterialsWithGTAIncluded] " + mat.name + " " + gta_c);  
                var gta_temp = this.getGTAs(mat.name);
                //console.log("[getMaterialsWithGTAIncluded] " + gta_temp);  
                listMaterials.push(gta_temp);
            }    
        }
    }
    return listMaterials;
}

Item.prototype.closestWallEdgeCorners = function(vec3) {

    var wallEdges = this.model.floorplan.wallEdges();

    var wallEdge = null;
    var minDistance = null; 

    var corners = this.getCorners('x', 'z', vec3);
    
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

Item.prototype.resize = function(height, width, depth) {
    //console.log("depth " + depth + " corr_depth " + this.corr_depth + " getDepth " + this.getDepth());
    //console.log("width " + width + " corr_width " + this.corr_width + " getDepth " + this.getWidth());
    //console.log("heigth " + height + " corr_height " + this.corr_height + " getDepth " + this.getHeight());
    
    var x = (parseFloat(width) + parseFloat(this.corr_width)) / this.getWidth();
    var y = (parseFloat(height) + parseFloat(this.corr_height)) / this.getHeight();
    var z = (parseFloat(depth) + parseFloat(this.corr_depth)) / this.getDepth();
    console.log("x " + x + " y " + y + " z " + z);
    
    this.setScale(x, y, z);
    
}

Item.prototype.flipX = function() {
    this.setScale(-1, 1, 1);
}


Item.prototype.setRotation=function(val){
	this.rotation.y = val;
	this.resized();
    this.scene.needsUpdate = true;
}

Item.prototype.addBloque = function(blq, alias_blq){
    if (this.bloques.indexOf(blq) == -1) {
        this.bloques.push(blq);
    }
    if (this.aliasBloques.indexOf(alias_blq) == -1) {
        this.aliasBloques.push(alias_blq);
    }
}

Item.prototype.addPalabra = function(pal, alias_pal, superflua){
    
    if (this.palabras.indexOf(pal) == -1) {
        this.palabras.push(pal);
    //}
    //if (this.aliasPalabras.indexOf(alias_pal) == -1) {
        this.aliasPalabras.push(alias_pal);
    }
    if ((superflua == true) && (this.superfluas.indexOf(pal) == -1)) {
        this.superfluas.push(pal);
    }
}


Item.prototype.setEspecialDims = function (especialDims){
   this.metadata.especialDims = especialDims;
}

Item.prototype.setPosition = function (x,y,z){
	this.position.x = x;
	this.position.y = y;
	this.position.z = z;
	this.resized();
        //console.log("setPosition " + this.scene.needsUpdate);
	this.scene.needsUpdate = true;
}

Item.prototype.setScale = function(x, y, z) {
    var posY_ant = this.position.y;
    var scaleVec = new THREE.Vector3(x, y, z);
    this.halfSize.multiply(scaleVec);
    scaleVec.multiply(this.scale);
    this.scale.set(scaleVec.x, scaleVec.y, scaleVec.z);
    this.resized();
    //console.log("setScale " + this.scene.needsUpdate);
    this.scene.needsUpdate = true;
};

Item.prototype.setFixed = function(fixed) {
    this.fixed = fixed;
}

Item.prototype.setSimetria = function(simetria) {
    this.simetria = simetria;
    this.flipX();
    this.getWallDistance();
}

Item.prototype.getSimetria = function() {
    return this.simetria;
}

Item.prototype.setArrowHide = function(arrowHide) {
    this.arrowHide = arrowHide;
}

Item.prototype.resized = function() {
    // subclass can define to take action after a resize
}

Item.prototype.getHeight = function() {
    return this.halfSize.y * 2.0;
}

Item.prototype.getWidth = function() {
    var valor = this.halfSize.x * 2.0;
    if (this.simetria) {
        valor = -valor;
    }
    return valor;
}

Item.prototype.getDepth = function() {
    return this.halfSize.z * 2.0;
}

Item.prototype.getHeightCorr = function() {
    return this.halfSize.y * 2.0 - this.corr_height;
}

Item.prototype.getWidthCorr = function() {
    var valor = this.halfSize.x * 2.0 - this.corr_width;
    //console.log("[getWidthCorr] " + this.halfSize.x * 2.0);
    if (this.simetria) {
        valor = -valor;
    }
    return valor;
}

Item.prototype.getDepthCorr = function() {
    return this.halfSize.z * 2.0 - this.corr_depth;
}
Item.prototype.placeInRoom = function() {
    // handle in sub class
};

Item.prototype.setDesfaseAltura = function(scale) {
    // handle in sub class
};


Item.prototype.initObject = function() {
    var item=this;    
//    $.getJSON( this.metadata.modelUrl, function( data ) { 
//  	  texture = data["materials"][0].mapDiffuse
//  	  item.metadata.model_texture = "models/textures/"+texture;   
//  	});
    this.placeInRoom();    
    // select and stuff
    this.scene.needsUpdate = true;
    
};

Item.prototype.removed = function() {
    // implement in subclass
}

// on is a bool
Item.prototype.updateHighlight = function() {
    
    var on = this.hover || this.selected;
    var emissiveColor;
    if (this.hover) {
        emissiveColor = this.emissiveColorHover;
    }
    if (this.selected) {
        emissiveColor = this.emissiveColorSelected;
    }
    this.highlighted = on;
    var hex = on ? emissiveColor : 0x000000;
    utils.forEach(this.material, function(material) {
        material.emissive.setHex(hex);
    });
    
}

    

Item.prototype.mouseOver = function() {
    this.hover = true;
    this.updateHighlight();
};

Item.prototype.mouseOff = function() {
    this.hover = false;
    this.updateHighlight();
};

Item.prototype.getWallDistance = function(){
	// Elimino las lineas anteriores
	this.hideWallDistance();
	
	// Veo el tipo de objeto
	var tipo = this.metadata.itemType;
	tipo = parseInt(tipo);
//	console.log("Tipo="+tipo)
	
	// Variables para las lineas
	var lc1; // linea desde el corner1 hasta la pared
	var lc2; // linea desde el corner2 hasta la pared
	var lc; // linea desde el centro hasta el corner 1 o 2 (distancia mas cercana)
	
	var walls = this.model.floorplan.getWalls();
	var corners = this.getCorners('x', 'z');
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
		var rot = this.rotation.y * (180 / Math.PI);
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
	    fc1.y = this.position.y;
	    fc1.z = c1.y;
	    
            var dc1 = new THREE.Vector3();
	    dc1.x = c1.x + dir; 
	    dc1.y = this.position.y;
	    dc1.z = (-1/m) * (dc1.x - c1.x) + c1.y;
	
            var geometry = new THREE.Geometry();
	    geometry.vertices.push(fc1);
	    geometry.vertices.push(dc1);

	    lc1 = new THREE.Line(geometry, material);	           
	    
	    var name = "wallDistance" + k;
	    lc1.name = name;
	    
	    // Creo la linea desde el corner 2
            var material = new THREE.LineBasicMaterial({
	        color: color
	    });
	    var fc2 = new THREE.Vector3();
	    fc2.x = c2.x; 
	    fc2.y = this.position.y;
	    fc2.z = c2.y;
  
	    var dc2 = new THREE.Vector3();
	    dc2.x = c2.x + dir; 
	    dc2.y = this.position.y;
	    dc2.z = (-1/m) * (dc2.x - c2.x) + c2.y;
	    	
		var geometry = new THREE.Geometry();
	    geometry.vertices.push(fc2);
	    geometry.vertices.push(dc2);

	    lc2 = new THREE.Line(geometry, material);	            
	    
	    var name = "wallDistance1" + k;
	    lc2.name = name;
	    
            //if (k == 1) {
                //this.scene.add(lc1);
                //this.scene.add(lc2);
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
		    if (lCut == 1){
		    	
		    	// Veo la pendiente antes de modificar
		    	var x1 = lc1.geometry.vertices[0].x;
		    	var y1 = lc1.geometry.vertices[0].z;
		    	var x2 = lc1.geometry.vertices[1].x;
		    	var y2 = lc1.geometry.vertices[1].z;
		    	var m = (y2 - y1 + 0.0001) / (x2 - x1);
		    	
		    	var x = fc1.x;
		    	var y = fc1.z;
		    	var x1 = w.getStart().x;
		    	var y1 = w.getStart().y;
		    	var x2 = w.getEnd().x;
		    	var y2 = w.getEnd().y;
		    	var point = utils.closestPointOnLine(x, y, x1, y1, x2, y2);

		    	// Modifico la linea que corto
		    	lc1.geometry.vertices[1].x = point.x;
		    	lc1.geometry.vertices[1].z = point.y;
		    	lc1.geometry.verticesNeedUpdate = true;
		    	
		    	// Elimino la otra linea
		    	this.scene.remove(lc2);
		    	
		    	// Veo la pendiente antes de modificar
		    	var x1 = lc1.geometry.vertices[0].x;
		    	var y1 = lc1.geometry.vertices[0].z;
		    	var x2 = lc1.geometry.vertices[1].x;
		    	var y2 = lc1.geometry.vertices[1].z;
		    	var m = (y2 - y1 + 0.00001) / (x2 - x1);

		    	// Tiro la linea desde el corner hasta el centro
				var material = new THREE.LineBasicMaterial({
			        color: color
			    });
				var geometry = new THREE.Geometry();
			    geometry.vertices.push(lc1.geometry.vertices[0]);
			    geometry.vertices.push(this.position);
			    
			    center = new THREE.Line(geometry, material);	              
			    var name = "wallDistanceC" + k;
			    
			    center.name = name;    
			    //this.scene.add(center);
			    
		    }else{
		    	var x = fc2.x;
		    	var y = fc2.z;
		    	var x1 = w.getStart().x;
		    	var y1 = w.getStart().y;
		    	var x2 = w.getEnd().x;
		    	var y2 = w.getEnd().y;
		    	var point = utils.closestPointOnLine(x, y, x1, y1, x2, y2);

		    	// Modifico la linea que corto
		    	lc2.geometry.vertices[1].x = point.x;
		    	lc2.geometry.vertices[1].z = point.y;
		    	lc2.geometry.verticesNeedUpdate = true;
		    	
		    	// Elimino la otra linea
		    	this.scene.remove(lc1);
		    	
		    	// Tiro la linea desde el corner hasta el centro
				var material = new THREE.LineBasicMaterial({
			        color: color
			    });
				var geometry = new THREE.Geometry();
			    geometry.vertices.push(lc2.geometry.vertices[0]);
			    geometry.vertices.push(this.position);
			    
			    center = new THREE.Line(geometry, material);	              
			    var name = "wallDistanceC" + k;
			    
			    center.name = name;    
			    //this.scene.add(center);
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
		    	this.northWall = minD;
		    	$("#item-northWall").val(minD);
		    	
		    	// Agrego las lineas al vector
		    	this.north = new Array();
		    	if (lCut == 1)
		    		this.north.push(lc1)
		    	else
		    		this.north.push(lc2)
		    	this.north.push(center)
		    	
		    	break;
		    case 1:
		    	this.eastWall = minD;
		    	$("#item-eastWall").val(minD);
		    	
		    	// Agrego las lineas al vector
		    	this.east = new Array();
		    	if (lCut == 1)
		    		this.east.push(lc1)
		    	else
		    		this.east.push(lc2)
		    	this.east.push(center)
		    	break;
		    case 2:
		    	this.southWall = minD;
		    	$("#item-southWall").val(minD);
		    	
		    	// Agrego las lineas al vector
		    	this.south = new Array();
		    	if (lCut == 1)
		    		this.south.push(lc1)
		    	else
		    		this.south.push(lc2)
		    	this.south.push(center)
		    	break;
		    case 3:
		    	this.westWall = minD;
		    	$("#item-westWall").val(minD);
		    	
		    	// Agrego las lineas al vector
		    	this.west = new Array();
		    	if (lCut == 1)
		    		this.west.push(lc1)
		    	else
		    		this.west.push(lc2)
		    	this.west.push(center)
		    	break;
		    }
//		    console.log(" ")
	    }
	}

	// Mostrar lineas auxiliares
	if (this.lineWalls)
		this.showWallDistance();
	
}

Item.prototype.showWallDistance = function(){
	for (var i=0; i < 2; i++){
		var n = this.north[i]
		if (n != null)
			this.scene.add(n)
		var e = this.east[i]
		if (e != null)
			this.scene.add(e)
		var s = this.south[i]
		if (s != null)
			this.scene.add(s)
		var w = this.west[i]
		if (w != null)
			this.scene.add(w)
	}
	
}

Item.prototype.hideWallDistance = function(){
	for (var i=0; i<4; i++){
		var name = "wallDistance" + i;
		var line = this.scene.getScene().getObjectByName(name);
		this.scene.remove(line)
		var name = "wallDistance1" + i;
		var line = this.scene.getScene().getObjectByName(name);
		this.scene.remove(line)
		var name = "wallDistanceC" + i;
		var line = this.scene.getScene().getObjectByName(name);
		this.scene.remove(line)
	}
}

Item.prototype.setWallDistance = function(plane){
	
	// Plane es el plano a modificar (norte, este, sur u oeste) del objeto
	
	// Variables a utilizar
	var line;
	var center;
	var distance;
	var curDistance;
	
	// Selecciono el plano a modificar
	switch (plane){
	case "north":
		line = this.north[0];
		center = this.north[1];
		distance = $("#item-northWall").val();
		curDistance = this.northWall;
                console.log(distance + " " + curDistance);
		break;
	case "east":
		line = this.east[0];
		center = this.east[1];
		distance = $("#item-eastWall").val();
		curDistance = this.eastWall;
		break;
	case "south":
		line = this.south[0];
		center = this.south[1];
		distance = $("#item-southWall").val();
		curDistance = this.southWall;
		break;
	case "west":
		line = this.west[0];
		center = this.west[1];
		distance = $("#item-westWall").val();
		curDistance = this.westWall;
		break;
	}
	
	// Tamanio de la linea auxiliar (un numero grande...)
	var dis = 1000;
	
	var lineO = line.geometry.vertices[0];
	var lineD = line.geometry.vertices[1];

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
	var x2 = this.position.x;
	var y2 = this.position.z;
	var z2 = this.position.y;
	
	var m = (y2 - y1) / (x2 - x1)
	
	// Pinto la linea paralela
	// Longitud que debe tener la linea
	var vx = x2 - x1;
	var vy = y2 - y1;
	var vz = z2 - z1;
	
	var long = Math.sqrt(vx*vx + vy*vy + vz*vz);
	
    var fc1 = new THREE.Vector3();
    fc1.x = px; 
    fc1.y = this.position.y;
    fc1.z = py;
	    
    var dc1 = new THREE.Vector3();
    dc1.x = x1 + dis; 
    dc1.y = this.position.y;
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
    dc1.y = this.position.y;
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
        console.log("Posicion anterior: " + this.position.x + " " + this.position.z);
	
	this.position.x = dc1.x;
	this.position.z = dc1.z;
	
    console.log("Nueva posicion: " + this.position.x + " " + this.position.z);
	this.setSelected();
        console.log("setWallDistance " + this.needsUpdate);
	this.needsUpdate = true;
        this.scene.needsUpdate = true;
	
}

Item.prototype.setSelected = function() {
	
    this.getWallDistance();

    this.selected = true;
    this.updateHighlight();
    var texture="";
    
//    var item=this;    
//    $.getJSON( this.metadata.modelUrl, function( data ) { 
//  	  texture = data["materials"][0].mapDiffuse
//  	  item.metadata.model_texture = "models/textures/"+texture;   
//  	});
    
};

Item.prototype.setUnselected = function() {
    this.selected = false;
    this.updateHighlight();
	this.hideWallDistance();
};


Item.prototype.getNombreBloque = function(name, nom_bloque) {
    var modelo = name.split(";");
    var seleccionado = name;
    for (var i=0; i<modelo.length; i++) {
        if (modelo[i].search(nom_bloque) != -1) {
            seleccionado = modelo[i];
        }
    }
    // Primera mayúscula
    seleccionado = seleccionado[0].toUpperCase() + seleccionado.substring(1);
    //console.log("EL NOMBRE del tirador es: " + seleccionado);
    return seleccionado.trim();
}

Item.prototype.getNombreTirador = function(name) {
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

Item.prototype.getNombrePieza = function(name) {
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
        //var value = this.diccionario(key);
        var value = this.aliasPalabra(key);
        seleccionado = seleccionado.replace(key,value);
        // Primera mayúscula
        seleccionado = seleccionado[0].toUpperCase() + seleccionado.substring(1);
        
        if (name.search("TIRADOR") != -1) {
            //console.log("Estoy en getNombrePieza");
            var nomTirador = this.getNombreTirador(name);
            nomTirador = nomTirador.replace("TIRADOR","").toLowerCase().trim();
            console.log("TIRADORRRR: " + nomTirador);
            nomTirador = this.aliasTirador(nomTirador);
            nomTirador = nomTirador[0].toUpperCase() + nomTirador.substring(1);
            seleccionado = "Tirador " + seleccionado + ": " + nomTirador + " ";
        }
        else {
            seleccionado = seleccionado + ": ";
        }
        return seleccionado;
    }
}

Item.prototype.getNombrePiezaBloque = function(name, bloque) {
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
        seleccionado = utils.traducir(seleccionado,this);
        //var key = seleccionado.split(" ")[0];
        //var value = this.aliasPalabra(key);
        //console.log("En getNombrePiezaBloque: " + key + " " + value);
        console.log("En getNombrePiezaBloque (despues): " + seleccionado);
        
        //var value = this.diccionario(key);
        //seleccionado = seleccionado.replace(key,value);
        // Primera mayúscula
        seleccionado = seleccionado[0].toUpperCase() + seleccionado.substring(1);
        
        if ((bloque != "") && (name.search(bloque) != -1)) {
            //console.log("Estoy en getNombrePieza");
            var itemBloque = this.getNombreBloque(name,bloque);
            itemBloque = itemBloque.replace(bloque,"").toLowerCase().trim();
            console.log("BLOQUEEEE: " + itemBloque);
            itemBloque = this.aliasItemBloque(itemBloque, bloque);
            bloqueAlias = this.aliasBloque(bloque);
            
            itemBloque = itemBloque[0].toUpperCase() + itemBloque.substring(1);
            seleccionado = bloque + " " + seleccionado + ": " + itemBloque + " ";
        }
        else {
            seleccionado = seleccionado + ": ";
        }
        return seleccionado;
    }
}

Item.prototype.aliasTirador = function(nombreTirador) {

    alias = nombreTirador;
    for (var i=0;i<this.tiradores_code.length;i++) {
        if (this.tiradores_code[i].toLowerCase() == nombreTirador.toLowerCase()) {
            alias = this.tiradores_alias[i];
        }
    }
    return alias;
}

Item.prototype.aliasBloque = function(bloque) {

    alias = bloque;
    //console.log("ALIASBLOQUE: " + alias);
    for (var i=0;i<this.bloques.length;i++) {
        if (this.bloques[i].toLowerCase() == bloque.toLowerCase()) {
            alias = this.aliasBloques[i];
        }
    }
    return alias.toUpperCase();
}

Item.prototype.aliasPalabra = function(pal) {

    alias = pal;
    for (var i=0;i<this.palabras.length;i++) {
        if (this.palabras[i].toLowerCase() == pal.toLowerCase()) {
            alias = this.aliasPalabras[i];
        }
    }
    return alias;
    
}

Item.prototype.aliasItemBloque = function(nombreItemBloque, bloque) {

    var items_names = this.correspondenciasB.get(bloque);
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

Item.prototype.diccionario = function(name) {
    
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
Item.prototype.buscarEnDescripcion = function(desc,cad) {
    
    var selecc = [];
    var selecc2 = [];
   
    for (var i=0;i<desc.length;i++) {
        var temp = desc[i].toLowerCase();
        if (temp.indexOf(cad.toLowerCase()) == 0) {
           //console.log("cad " + cad + " temp " + temp); 
           //console.log("desc " + desc[i]); 
           var linea = desc[i];
           //console.log("linea: " + linea);
           if (utils.bloqueEncontrado(cad,this.bloques) != -1) {
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

Item.prototype.interseccionObjetos = function(objects) {

    var geometry = this.geometry;
    for (var vertexIndex = 0; vertexIndex < geometry.vertices.length; vertexIndex++)
    {      
        var localVertex = geometry.vertices[vertexIndex].clone();
        //var globalVertex = obj1.matrix.multiplyVector3(localVertex);
        var globalVertex = localVertex.applyMatrix4(this.matrix);
        var directionVector = globalVertex.sub( this.position );

        var raycaster = new THREE.Raycaster(this.position, directionVector.clone().normalize());
        var collisionResults = raycaster.intersectObjects( objects ); 
        if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
        //if ( collisionResults.length > 0 ) 
        {
          console.log("vertexIndex: " + vertexIndex + " distance: " + collisionResults[0].distance); 
          var nameEst = collisionResults[0].object.metadata.itemName.toLowerCase();
          if (nameEst.search("pilar") != -1) {
              this.cajeado = 1;
          } else {
              this.cajeado = 2;
          }
          return true;
        }
    }
    
    var corners = this.getCorners('x', 'z');
    for (var i = 0; i < objects.length; i++) {
        if (!utils.polygonOutsidePolygon(corners, objects[i].getCorners('x', 'z')) ||
                !utils.polygonOutsidePolygon(objects[i].getCorners('x', 'z'), corners)) {
             
            var nameEst = objects[i].metadata.itemName.toLowerCase();
            if (nameEst.search("pilar") != -1) {
                this.cajeado = 1;
            } else {
                this.cajeado = 2;
            }
            return true;
        } 
    }
    this.cajeado = 0;
    return false;
}


Item.prototype.intersectaEstructura = function() {
    
    var name_obj = this.metadata.itemName.toLowerCase();
    // Si nos encontramos con una viga o pilar
    if ((name_obj.search("viga") != -1) && (name_obj.search("pilar") != -1)) {
        return false; 
    }
    var corners = this.getCorners('x', 'z');
    var objects = this.model.scene.getItems();
    for (var i = 0; i < objects.length; i++) {
        var name = objects[i].metadata.itemName.toLowerCase();
        //console.log(name);
        if (objects[i] === this || !objects[i].obstructFloorMoves) {
            continue;
        }
        if ((name.search("viga") == -1) && (name.search("pilar") == -1)) {
            continue; 
        }
        var objects2 = [];
        objects2.push(objects[i]);
        if (this.interseccionObjetos(objects2)) {
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

Item.prototype.openModuleAllowed = function() {
    var materials = this.material;
   
    for (var i = 0; i < materials.length; i++){
        var mat = materials[i];
        const words = mat.name.split(/[\s;]+/);
        if (words.indexOf("BRT01") != -1) {
            return true;
        } 
    }
    return false;
}

Item.prototype.open = function(abrir) {
    
    if (abrir) { 
        // Se abren las puertas
        var materials = this.material;

        for (var i = 0; i < materials.length; i++){
            var mat = materials[i];
            const words = mat.name.split(/[\s;]+/);
            if (words.indexOf("BRT01") != -1) {
                if (mat.visible) {
                    this.materialOcultosAbrir.push(i);
                }
                mat.visible = false;
                mat.needsUpdate = true;
                
            } 
        }
        console.log("OPEN: " + this.materialOcultosAbrir);
    } else {
        // Se cierran, dejando mostrada la puerta que estaba antes de cerrarla
        console.log("OPEN close: " + this.materialOcultosAbrir);
        if (this.materialOcultosAbrir.length != 0) {
            var materials = this.material;
            for (var i = 0; i < this.materialOcultosAbrir.length; i++) { 
                console.log("OPEN close i: " + this.materialOcultosAbrir[i]);
                 var mat = materials[this.materialOcultosAbrir[i]];
                 mat.visible = true;
                 mat.needsUpdate = true;
            }
            this.materialOcultosAbrir = [];
        }
       
        
    }
    this.scene.needsUpdate = true;
}

Item.prototype.marcarMaterialsPorSeparadores = function() {
    var materials = this.material;
    var idxSepActivos = [];
    for (let i=0; i<materials.length; ++i) this.materialsSep[i] = -1;

    var idxGtaSep = -1;
    if (this.gta_sep.length > 0) {
        for (let i=0; i<this.bloques.length; ++i) {
            let bloque = this.bloques[i];
            var grupos = utils.getGruposDeBloque(this.material, bloque,this.superfluas);
            console.log("BLOQUE: " + bloque +  " GRUPOS: " + grupos);

            for (var j = 0; j < grupos.length; j++){
                var idxGrupos = utils.getIndicesPorGrupo_bloque(this.material, grupos[j], bloque);
                console.log("G: " + grupos[j] + " IDXGRUPOS: " + idxGrupos);
                var idxItemActivos = utils.getIdxItemActivoPorGrupo(this.material, idxGrupos);

                idxSep = this.getIdxFoundGTASeparador(idxItemActivos);
                if (idxSep != -1) {
                    console.log("Separador GTA: " + idxSep + " ("  + this.gta_sep[idxSep] + ") encontrado en el grupo " + grupos[j]);
                    for (let k=0; k < idxItemActivos.length; k++) {
                        this.materialsSep[idxItemActivos[k]] = idxSep;
                    }
                    idxSepActivos.push(idxSep);
                }
            }
        }
    }
    
    return idxSepActivos;

}

Item.prototype.getIdxFoundGTASeparador = function(idxItemActivos) {
    
    var idxGtaSep = -1;
    if (this.gta_sep.length > 0) {
        var materials = this.material;

        for (var i = 0; i < idxItemActivos.length; i++){
            var mat = materials[idxItemActivos[i]];
            var g_code = this.getGTAcode(mat.name);
            for (var j=0; j < this.gta_sep.length; j++) {
                if (g_code.indexOf(this.gta_sep[j]) != -1) {
                    idxGtaSep = j;
                }
            }
        }
    }
    return idxGtaSep;


}


Item.prototype.getGTASeparador = function(idxSep) {
    return this.gta_sep[idxSep];
}

Item.prototype.getDescripcionTexturas = function(idxSep,noAgrupar) {
    
    noAgrupar = noAgrupar || false;
    
    var descripcion = [];
    var materials = this.material;
    // Elimino todas las texturas
    for (var i = 0; i < materials.length; i++){
        var mat = materials[i];
        //console.log("NOMBRE: " + mat.name);
        // Primera condición para detectar los materiales con texturas y
        // segunda para detectar los tiradores que no tienen texturas (metálico)
        if ((mat.name.search("NOMOSTRAR") == -1) && ((mat.map != null && mat.visible == true) || 
            ((utils.bloqueEncontrado(mat.name,this.bloques) != -1) && mat.visible == true)) &&
            this.materialsSep[i] == idxSep)  {
            
            var bloque = utils.getBloque(mat.name,this.bloques);
            console.log("NOMBRE DENTRO: " + mat.name + " Bloque: " + bloque);
            var nomPieza = this.getNombrePiezaBloque(mat.name, bloque);
            //var nomPieza2 = this.getNombrePieza(mat.name);
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
            var selecc = this.buscarEnDescripcion(descripcion, key);
            console.log("SELECCIONADO: " + selecc);
            if (selecc.length>0) {
                //console.log("KEY: " + key.toUpperCase() + " Bloques: " + this.bloques);
                if (utils.bloqueEncontrado(key.toUpperCase(),this.bloques) != -1)  {
                var bloque = utils.getBloque(key.toUpperCase(),this.bloques);
                    salida += "- " + this.aliasBloque(bloque) + ": ";
                }
                else {
                    salida += "- " + i18n.t('desc.color') + " " + this.aliasPalabra(key).toUpperCase() + ": ";
                }
                console.log("SELECCIONADO: " + selecc);
                selecc2 = utils.separarPorGruposYSuperfluas(selecc, this);
                console.log("PRIMERADIVISION: " + selecc2);
                
                selecc = utils.eliminarRepetidos(selecc2);
                console.log("ELIMINARREPETIDOS: " + selecc2);
                if (noAgrupar == false) {
                    selecc = utils.agruparSeleccionados(selecc);
                    console.log("AGRUPADOS SELECCIONADO: " + selecc);
                }
                //selecc = utils.agruparPiezasVariosMaterials(selecc,this);
                //console.log("AGRUPADOS SUPERFLUAS: " + selecc);
                
                
                var numEspacios = "";
                if (noAgrupar == false) {
                    var cadenaEspacios = "- " + this.aliasBloque(bloque) + ":";
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
       
Item.prototype.getGTAyTexturas = function() {
    var materials = this.material;
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
            var nomPieza = utils.removeAlmohadilla(this.getNombrePieza(mat.name));
            var g_code = this.getGTAcode(mat.name);
            var texturaPieza = "";
            if ((mat.map != null) && (mat.map.image != null)) {
                texturaPieza = mat.map.image.src;
                var idx_bar = texturaPieza.lastIndexOf("/");
                texturaPieza = texturaPieza.substr(idx_bar+1);
            }
            if (nomPieza != "") {
                alias_nomPieza = utils.traducirNombre(utils.removeCaracter(nomPieza,':'),this);
                var acab = {nomPieza, g_code, texturaPieza, alias_nomPieza};
                console.log("ACABADO");
                console.log(acab);
                acabados.push(acab);
            }
        }
    }
    return acabados;
}

Item.prototype.getAllGTAs = function() {
    var gtas = [];
    for (var i = 0; i < this.material.length; i++){
        var mat = this.material[i];	
        var gta_temp = this.getGTAs(mat.name);
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


Item.prototype.getAllGTAsActivos = function() {
    var gtas = [];
    for (var i = 0; i < this.material.length; i++){
        var mat = this.material[i];	
        if (mat.visible == true) {
            var gta_temp = this.getGTAcode(mat.name);
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

Item.prototype.correspondenciaGTAs = function(gtas_raw, gtas_alias) {
     this.gta_code = gtas_raw.toLowerCase().split(", ");
     this.gta_alias = gtas_alias.toLowerCase().split(", ");
}

Item.prototype.asignarGTAsSeparadores = function(gtas_sep) {
     this.gta_sep = gtas_sep.toLowerCase().split(",");
     for (let i=0; i < this.gta_sep.length; i++) this.gta_sep[i] = this.gta_sep[i].trim();
}

Item.prototype.correspondenciaTiradores = function(tiradores) {
    for (var j=0; j < tiradores.length; j++) {
        var tir_desc = tiradores[j].descripcion.replace("TIRADOR","").trim();
        var tir_alias = tiradores[j].alias.replace("Tirador","").trim();
        this.tiradores_code.push(tir_desc);
        this.tiradores_alias.push(tir_alias);
    } 
    console.log("Tiradores code: " + this.tiradores_code);
    console.log("Tiradores alias: " + this.tiradores_alias);
    
}

Item.prototype.correspondenciaBloques = function(bloque, items_bloque) {
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
    
    this.correspondenciasB.set(bloque, together);
    console.log("Tiradores code: " + code);
    console.log("Tiradores alias: " + alias);
    
}


Item.prototype.getGTAcode = function(name) {
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
        
        if (this.gta_code != null) {
            for (var i=0; i<gtas.length; i++) {
                var idx = this.gta_code.indexOf(gtas[i].trim());
                if (idx != -1) {
                   seleccionado = seleccionado.replace(gtas[i],this.gta_code[idx]).toLowerCase(); 
                }

            }
        }
        
        return seleccionado.trim();
    }
}


Item.prototype.getGTAs = function(name) {
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
        if (this.gta_code != null) {
            /*console.log("SELECCIONADO");
            console.log(seleccionado);
            console.log("GTA_CODE");
            console.log(this.gta_code);
            console.log(gtas);
            console.log("GTA_ALIAS");
            console.log(this.gta_alias);*/
            
            for (var i=0; i<gtas.length; i++) {
                var idx = this.gta_code.indexOf(gtas[i].trim());
                if (idx != -1) {
                   seleccionado = seleccionado.replace(gtas[i],this.gta_alias[idx]).toLowerCase(); 
                } else {
                   seleccionado = seleccionado.replace(gtas[i],"").toLowerCase();  
                }
            }
        }
        
        return seleccionado;
    }
}

Item.prototype.getModelosTirador = function() {
   /////////////////
    // MOD Rafa. Almacenamos el numero de materials de tiradores
    var modelosTirador = [];
    for (var i = 0; i < this.material.length; i++){
        var mat = this.material[i];
        //console.log("Estoy en getModelosTirador");
        var nomTirador = this.getNombreTirador(mat.name);
        if ((mat.name.search("TIRADOR") != -1) && (modelosTirador.indexOf(nomTirador) == -1)) {
            modelosTirador.push(nomTirador);
            this.numModelosTirador =  this.numModelosTirador  + 1;
        }
    }
    return modelosTirador;
    ///////////////// 
}

Item.prototype.getModelosBloque = function(nombre_bloque) {
   /////////////////
    // MOD Rafa. Almacenamos el numero de materials de tiradores
    var modelosBloque = [];
    for (var i = 0; i < this.material.length; i++){
        var mat = this.material[i];
        //console.log("Estoy en getModelosTirador");
        var nomBloque = this.getNombreBloque(mat.name,nombre_bloque);
        if ((mat.name.search(nombre_bloque) != -1) && (modelosBloque.indexOf(nomBloque) == -1)) {
            modelosBloque.push(nomBloque);
        }
    }
    return modelosBloque;
    ///////////////// 
}

Item.prototype.isItemBloqueInAllGroups = function(bloque, item_bloque) {
    var encontrado = true;
    var grupos = utils.getGruposDeBloque(this.material, bloque,this.superfluas);
    for (var j = 0; j < grupos.length; j++){
        var idxGrupos = utils.getIndicesPorGrupo_bloque(this.material, grupos[j], bloque);
        console.log("G: " + grupos[j] + " IDXGRUPOS: " + idxGrupos);
        var visto = 0;
        for (var i = 0; i < idxGrupos.length; i++){
            var mat = this.material[idxGrupos[i]];	
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

Item.prototype.setItemBloqueRaw = function(bloque, item_bloque, idCatalogo) {
    console.log("Bloque: " + bloque + ", ItemBloque: " + item_bloque + ", IDCatalogo: " + idCatalogo);
    if (this.metadata.idCatalogo == idCatalogo) {
        var grupos = utils.getGruposDeBloque(this.material, bloque,this.superfluas);
        console.log("GRUPOS: " + grupos);
        for (var j = 0; j < grupos.length; j++){
            var idxGrupos = utils.getIndicesPorGrupo_bloque(this.material, grupos[j], bloque);
            console.log("G: " + grupos[j] + " IDXGRUPOS: " + idxGrupos);
            var idxItemActivos = utils.getIdxItemActivoPorGrupo(this.material, idxGrupos);
            
            var activado = 0;
            for (var i = 0; i < idxGrupos.length; i++){
                var mat = this.material[idxGrupos[i]];	
                if ((mat.name.search(item_bloque + ";") != -1) || (mat.name.search(item_bloque + " ;") != -1)) {
                    mat.visible = true;
                    mat.needsUpdate = true;
                    activado = 1;
                }
                else if (mat.name.search(bloque) != -1) {
                    mat.visible = false;
                    mat.needsUpdate = true;
                }
            }
            if (activado == 0) {
                console.log("No activado en Grupo " + grupos[j] + " el item bloque " + item_bloque);
                for (var i = 0; i < idxItemActivos.length; i++){
                    var mat = this.material[idxItemActivos[i]];
                    mat.visible = true;
                    mat.needsUpdate = true;
                }
            }
        }
        this.scene.needsUpdate = true;
    }
}

Item.prototype.resetearTexturas = function() {
    
    var materials = this.material;
    // Elimino todas las texturas
    for (var i = 0; i < materials.length; i++){
            var mat = materials[i];
            if (mat.name.search("UNICO") == -1) {
                mat.map = null;	
                mat.needsUpdate = true;	
            }
    }
    //console.log("resetearTexturas " + this.scene.needsUpdate);
    this.scene.needsUpdate = true;
}

Item.prototype.getItemActivo = function(bloque) {
    var itemActivo = [];
    for (var i = 0; i < this.material.length; i++){
        var mat = this.material[i];	
        // Compruebo dos opciones: si está visible o si no lo está pero está almacenado
        // como oculto tras abrir puertas
        if ((mat.name.search(bloque) != -1) && 
                ((mat.visible == true) || (this.materialOcultosAbrir.indexOf(i) != -1))) {
            //console.log("Tirador: " + mat.name + " Transparencia: " + mat.transparent);
            //console.log("Estoy en getTiradorActivo");
            itemActivo = this.getNombreBloque(mat.name, bloque);
            return itemActivo;
        }
    }
    return itemActivo;
}


Item.prototype.getTiradorActivo = function() {
    var tiradorActivo = [];
    for (var i = 0; i < this.material.length; i++){
        var mat = this.material[i];	
        if ((mat.name.search("TIRADOR") != -1) && (mat.visible == true)) {
            //console.log("Tirador: " + mat.name + " Transparencia: " + mat.transparent);
            //console.log("Estoy en getTiradorActivo");
            tiradorActivo = this.getNombreTirador(mat.name);
        }
    }
    return tiradorActivo;
}

Item.prototype.bloqueEncontrado = function(name,bloques) {
    var enc = -1;
    for (var i = 0; i < bloques.length; i++){
        if (name.search(bloques[i]) != -1) {
            enc = 1;
            break;
        }
    }
    return enc;
}

Item.prototype.inicializarBloques = function (bloquesIn) {
            
    var bloques = JSON.parse(bloquesIn); 
    for (var i = 0; i < bloques.length; i++) {
        var blq = bloques[i];
        
        // Solo aquéllos bloques que son del catalogo de la pieza
        if (blq.idCatalogo == this.metadata.idCatalogo) {
            // Obtenemos los items del bloque a partir del JS
            var modelosBloque = this.getModelosBloque(blq.descripcion);

            if (modelosBloque.length > 0) {
                var modelosBloqueSort = [];
                var items_bloque = blq.items;
                
                for (var j = 0; j < items_bloque.length; j++) {
                    var ibloque = items_bloque[j];
                    var n = blq.descripcion + " " + ibloque.descripcion; 
                    if (modelosBloque.indexOf(n) !== -1) {
                        // Comprobamos si el item de bloque está en todos los grupos
                        if (this.isItemBloqueInAllGroups(blq.descripcion, ibloque.descripcion)) {
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
                
                this.correspondenciaBloques(blq.descripcion, items_bloque);
                this.addBloque(blq.descripcion, blq.aliasPresupuesto);
                
                // Asignamos el valor inicial al bloque detectado
                this.setItemBloqueRaw(blq.descripcion, modelosBloqueSort[0].valor,this.metadata.idCatalogo);
                
            }
        }
    }

}

Item.prototype.inicializarPalabras = function (palabrasIn) {
            
    var palabras = JSON.parse(palabrasIn); 
    for (var i = 0; i < palabras.length; i++) {
        var pal = palabras[i];
        
        // Solo aquellas palabras que son del catalogo de la pieza
        if (pal.idCatalogo == this.metadata.idCatalogo) {
            //console.log(pal);
            //console.log(pal.superflua == true);
            this.addPalabra(pal.descripcion, pal.alias.toLowerCase(), pal.superflua);
        }
    }

}

Item.prototype.setItemBloque = function(bloque, item_bloque, idCatalogo) {
    if (this.scene.textureScene) {
        this.scene.bloqueItems(bloque, item_bloque, idCatalogo);
    } 
    else {
        this.setItemBloqueRaw(bloque, item_bloque ,idCatalogo);
    }
}

Item.prototype.setModeloTirador = function(modelo, idCatalogo) {
    if (this.scene.textureScene) {
        this.scene.tiradoresItems(modelo,idCatalogo);
    } 
    else {
        this.setModeloTiradorRaw(modelo,idCatalogo);
    }
}

Item.prototype.setModeloTiradorRaw = function(modelo, idCatalogo) {
    console.log("IDCatalogo: " + idCatalogo);
    if (this.metadata.idCatalogo == idCatalogo) {
        var grupos = utils.getGruposDeTiradores(this.material, this.superfluas);
        console.log("GRUPOS: " + grupos);
        for (var j = 0; j < grupos.length; j++){
            var idxGrupos = utils.getIndicesPorGrupo(this.material, grupos[j]);
            console.log("G: " + grupos[j] + " IDXGRUPOS: " + idxGrupos);
            var idxTiradorActivo = utils.getIdxTiradorActivoPorGrupo(this.material, idxGrupos);
            var activado = 0;
            for (var i = 0; i < idxGrupos.length; i++){
                var mat = this.material[idxGrupos[i]];	
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
                var mat = this.material[idxTiradorActivo];
                mat.visible = true;
                //mat.transparent = false;
                //mat.opacity = 1.0;
                mat.needsUpdate = true;
            }
        }
        //console.log("setModeloTiradorRaw " + this.scene.needsUpdate);
        this.scene.needsUpdate = true;
    }
    /*for (var i = 0; i < this.material.materials.length; i++){
        var mat = this.material.materials[i];	
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
    this.scene.needsUpdate = true;*/
}

// intersection has attributes point (vec3) and object (THREE.Mesh)
// MOD Rafa
//Item.prototype.clickPressed = function(intersection) {
Item.prototype.clickPressed = function(intersection,myIntersectedObjects) {
//
    var scene = this.scene; 
    var callback = function() {
      scene.needsUpdate = true;
    }
    
    this.dragOffset.copy(intersection.point).sub(this.position);
    this.moveToPosition(
            intersection.point.sub(this.dragOffset), 
            intersection,keys);
    
    //////////////////////////
    // MOD Rafa. Asignamos el objeto interseccion
    if (myIntersectedObjects) {
        this.myIntersection = myIntersectedObjects[0];
        console.log("Num. objetos intersectados: " + myIntersectedObjects.length);
    }
    //////////////////////////
    
    //////////////////////////
    // MOD Rafa. Asignamos la textura ya seleccionada sobre el subobjeto clickado
    
    if (this.rightClick && this.textureFill) {
        var materials = this.material;
	
        //var idxFace = this.myIntersection.faceIndex;
        //var idxMaterial = this.geometry.faces[idxFace].materialIndex;
        var idxMaterial = this.myIntersection.face.materialIndex;
        console.log("El indice del material es " + idxMaterial);
        console.log("El número de materiales es " + materials.length);

        //for (var i = 0; i < materials.length; i++){
        var mat = materials[idxMaterial];
        var texturaCargada = new THREE.TextureLoader().load(this.textureSelected.url, callback);
        // MOD Rafa. Si el elemento al que quiero cambiar la textura es un tirador
        // se cambia a todos los tiradores que están en la misma posición
        
        if (utils.bloqueEncontrado(mat.name,this.bloques) != -1)  {
        //if (mat.name.search("TIRADOR") != -1) {
            var bloque = utils.getBloque(mat.name,this.bloques);
            var grupo_encontrado = utils.getGrupoTirador(mat.name);
            //console.log("Grupo Encontrado: " + grupo_encontrado);  
            
            //var grupo = utils.filtrarGrupo(grupo_encontrado);
            console.log("Bloque: " + bloque + ", Grupo: " + grupo_encontrado);     
         //   var objects = myIntersectedObjects;
            console.log("Es bloque, cambio texturas de todos los tiradores");
            var permitida = false;
            var mensaje = "";
            var gta = this.textureSelected.gta.toUpperCase();
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
                        //mat2.map = THREE.ImageUtils.loadTexture( this.textureSelected.url )
                        mat2.map.minFilter = THREE.LinearFilter;
                        mat2.map.name = this.textureSelected.name;
                        mat2.needsUpdate = true;
                        permitida = true;
                    }
                    else {
                        mensaje = this.getGTAs(mat.name);
                        //console.log(mat.name);
                        
                    }
                }
            }
            if (!permitida) {
                console.log(mat.name);
                $("#textureMessage").text(i18n.t('menuobj.texturanopermitida') + ": " + mensaje);
                $('#div_textureMessage').show().delay(2000).fadeOut(1000);
                console.log("Textura no permitida");
            }
        }
        else if (mat.name.search("UNICO") == -1)  {
            var gta = this.textureSelected.gta.toUpperCase();
            if ((gta == "") || (mat.name.search(gta) != -1)) {
                console.log(mat.name + " " + gta);
                mat.map = texturaCargada;
                //mat.map = THREE.ImageUtils.loadTexture( this.textureSelected.url )
                mat.map.minFilter = THREE.LinearFilter;
                mat.map.name = this.textureSelected.name;
                mat.needsUpdate = true;	
            }
            else {
                console.log(mat.name);
                $("#textureMessage").text(i18n.t('menuobj.texturanopermitida') + ": " + this.getGTAs(mat.name));
                $('#div_textureMessage').show().delay(2000).fadeOut(1000);
                console.log("Textura no permitida");
            }
        }
        //console.log("clickPressed " + this.scene.needsUpdate);
        this.scene.needsUpdate = true;
    }
    
    
    
};

Item.prototype.clickDragged = function(intersection) {
    if (intersection) {    	
    	// keys a 0 para SI mostrar el error de posicion
    	var keys=0;
        //console.log("IntersectionPoint");
        //console.log(intersection.point);
        //console.log("dragOffset");
        //console.log(this.dragOffset);
       
        this.moveToPosition(
            intersection.point.sub(this.dragOffset), 
            intersection,keys);
        this.getWallDistance();
    }
};

Item.prototype.rotate = function(intersection) {
    if (intersection) {
        var angle = utils.angle(
            0, 
            1, 
            intersection.point.x - this.position.x, 
            intersection.point.z - this.position.z);

        var snapTolerance = Math.PI / 16.0;

        // snap to intervals near Math.PI/2
        for (var i=-4; i <= 4; i++) {
            if ( Math.abs( angle - ( i * ( Math.PI / 2 ) ) ) < snapTolerance ) {
                angle = i * ( Math.PI / 2 );
                break;
            }
        }
        
        this.rotation.y = angle;
        this.getWallDistance();
    }
}

Item.prototype.moveToPosition = function(vec3, intersection) {
    this.position.copy(vec3);
}

Item.prototype.clickReleased = function() {
    if (this.error) {
        this.hideError();
    }
};

// Returns an array of planes to use other than the ground plane
// for passing intersection to clickPressed and clickDragged
Item.prototype.customIntersectionPlanes = function() {
    return [];
}

// returns the 2d corners of the bounding polygon
// offset is Vector3 (used for getting corners of object at a new position)
// TODO: handle rotated objects better!
Item.prototype.getCorners = function(xDim, yDim, position) {

    position = position || this.position;

    var halfSize = this.halfSize.clone();
    
    var nuevo_x = halfSize.x;
    if (this.simetria) {
        nuevo_x = - nuevo_x;
    }
    var c1 = new THREE.Vector3(-nuevo_x, 0, -halfSize.z);
    var c2 = new THREE.Vector3(nuevo_x, 0, -halfSize.z);
    var c3 = new THREE.Vector3(nuevo_x, 0, halfSize.z);
    var c4 = new THREE.Vector3(-nuevo_x, 0, halfSize.z);

    var transform = new THREE.Matrix4();
    // console.log(this.rotation.y);
    transform.makeRotationY(this.rotation.y); // + Math.PI/2)

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
Item.prototype.getVertices = function(position) {

    position = position || this.position;

    var transform = new THREE.Matrix4();
    // console.log(this.rotation.y);
        transform.makeRotationY(this.rotation.y); // + Math.PI/2)

    var vertices = this.geometry.vertices;
    var vert = [];
    for (var i=0; i < vertices.length; i++) {
        var v = vertices[i].clone();
        v.applyMatrix4(transform);
        v.add(position);
        vert.push(v);
    }

    return vert;
}

Item.prototype.isValidPosition = function( vec3 ) {
    // implement in subclass
}

Item.prototype.showError = function(vec3) {
    vec3 = vec3 || this.position;
    if (!this.error) {
        this.error = true;
        this.errorGlow = this.createGlow(this.errorColor, 0.8, true);
        this.scene.add(this.errorGlow);
    }
    this.errorGlow.position.copy(vec3);
}

Item.prototype.hideError = function() {
    if ( this.error) {
        this.error = false;
        this.scene.remove( this.errorGlow );
    }
}

Item.prototype.objectHalfSize = function() {
    var objectBox = new THREE.Box3();
    objectBox.setFromObject( this );
    return objectBox.max.clone().sub( objectBox.min ).divideScalar( 2 );
}

Item.prototype.createGlow = function( color, opacity, ignoreDepth ) {
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
        box3.setFromObject(this);
   
        // make a BoxBufferGeometry of the same size as Box3
        const dimensions = new THREE.Vector3().subVectors( box3.max, box3.min );
        const boxGeo = new THREE.BoxBufferGeometry(dimensions.x, dimensions.y, dimensions.z);

        var glow = new THREE.Mesh(boxGeo, glowMaterial);
	
		
	//var glow = new THREE.Mesh(this.geometry.clone(), glowMaterial);
	glow.position.copy(this.position);
	glow.rotation.copy(this.rotation);
    glow.scale.copy(this.scale);
	return glow;
};

module.exports = Item;