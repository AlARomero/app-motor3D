import * as THREE from 'three';

var itemUtils = require('../utils/itemUtils');

class Item extends THREE.Mesh {
    constructor(model, metadata, geometry, material, position, rotation, scale) {

        super(geometry, material);

        // this.three = three;
        // this.model = three.getModel();
        // this.scene = three.getScene();
        // this.controller = three.getController();
        this.model = model;
        this.scene = model.scene;
        //this.controller = model.getController();

        // Items relacionados con este mismo, array de items e itemgroups (comensales)
        this.itemsBounded = [];

        this.errorGlow = new THREE.Mesh();
        this.error = false;
        this.helperGlow = new THREE.Mesh();  
        this.helperBox;
        this.helper = false;
        
        
        this.boundToFloor = false;
        this.addToWall = false;
        this.hover = false;
        this.selected = false;
        this.highlighted = false;
        
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

        /*if (!geometry.isGroup) {
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
        }*/
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

        let boundingBox = new  THREE.Box3();
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
                  if (child.applyMatrix4 === undefined) {
                  child.applyMatrix( new THREE.Matrix4().makeTranslation(
                        - 0.5 * ( boundingBox.max.x + boundingBox.min.x ),
                        - 0.5 * ( boundingBox.max.y + boundingBox.min.y ),
                        - 0.5 * ( boundingBox.max.z + boundingBox.min.z )
                    ) );
                  } else {
                      child.applyMatrix4( new THREE.Matrix4().makeTranslation(
                        - 0.5 * ( boundingBox.max.x + boundingBox.min.x ),
                        - 0.5 * ( boundingBox.max.y + boundingBox.min.y ),
                        - 0.5 * ( boundingBox.max.z + boundingBox.min.z )
                    ) );
                  }

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
    }

//Item.prototype = Object.create(THREE.Mesh.prototype);

    moveToPoint(event, camera) {
        itemUtils.moveToPoint(this, event, camera);
    }

    //Test animacion
    animate() {
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
    moveKeyUp(camera){
        itemUtils.moveKeyUp(this, camera);
    }

    moveKeyDown(camera){
        itemUtils.moveKeyDown(this, camera);
    }

    moveKeyLeft(camera){
        itemUtils.moveKeyLeft(this, camera);
    }

    moveKeyRight(camera){
        itemUtils.moveKeyRight(this, camera);
    }

    remove() {
        itemUtils.remove(this);
    }
    
    // el clone es diferente para item e itemgroup
    clone() {
        return new this.constructor(this.model, this.metadata,this.geometry,this.material).copy(this);
    }   

    setTextureRaw(texture){
        itemUtils.setTextureRaw(this, texture);
    }

    setTexture(texture, callback){
        itemUtils.setTexture(this, texture, callback);
    }

    getMaterialsWithGTAIncluded(gta) {
        return itemUtils.getMaterialsWithGTAIncluded(this, gta);
    }

    closestWallEdgeCorners(vec3) {
        return itemUtils.closestWallEdgeCorners(this, vec3);
    }

    resize(height, width, depth) {
        itemUtils.resize(this, height, width, depth);
    }

    flipX() {
        itemUtils.flipX(this);
    }

    setRotation(val){
         itemUtils.setRotation(this, val);
    }

    addBloque(blq, alias_blq){
        itemUtils.addBloque(this, blq, alias_blq);
    }

    addPalabra(pal, alias_pal, superflua){
        itemUtils.addPalabra(this,pal, alias_pal, superflua);
    }

    setEspecialDims(especialDims){
        itemUtils.setEspecialDims(this,especialDims);
    }

    setPosition(x,y,z){
        itemUtils.setPosition(this,x,y,z);
    }

    setScale(x, y, z) {
        itemUtils.setScale(this,x,y,z);
    }

    setFixed(fixed) {
         itemUtils.setFixed(this,fixed);
    }

    setSimetria(simetria) {
         itemUtils.setSimetria(this,simetria);
    }

    getSimetria() {
         return itemUtils.getSimetria(this);
    };

    setArrowHide(arrowHide) {
         itemUtils.setArrowHide(this,arrowHide);
    };

    resized() {
        // subclass can define to take action after a resize
    };

    isWallItem() {
        return itemUtils.isWallItem(this);
    }

    isItemInRoom(roomFloor) {
        return itemUtils.isItemInRoom(this, roomFloor);
    }

    boundItem(item) {
        itemUtils.boundItem(this, item);
    }

    unboundItem(item) {
        itemUtils.unboundItem(this, item);
    }

    findBoundItem(index) {
        return itemUtils.findBoundItem(this, index);
    }

    getDescription() {
        return itemUtils.getDescription(this);
    }

    getHeight() {
        return itemUtils.getHeight(this);
    };

    getWidth() {
        return itemUtils.getWidth(this);
    };

    getDepth() {
        return itemUtils.getDepth(this);
    };

    getHeightCorr() {
        return itemUtils.getHeightCorr(this);   
    };

    getWidthCorr() {
        return itemUtils.getWidthCorr(this);   
    }

    getDepthCorr() {
        return itemUtils.getDepthCorr(this);   
    }
    placeInRoom() {
        // handle in sub class
    };

    setDesfaseAltura(scale) {
        // handle in sub class
    };


    initObject() {
        itemUtils.initObject(this);   

    };

    removed() {
        // implement in subclass
    }

    // on is a bool
    updateHighlight() {
        itemUtils.updateHighlight(this);   
    }

    updateHelper() {
        itemUtils.updateHelper(this);   
    }


    mouseOver() {
        itemUtils.mouseOver(this);   
    };

    mouseOff() {
        itemUtils.mouseOff(this);   
    };

    getWallDistance(){
        itemUtils.getWallDistance(this);

    }

    showWallDistance(){
        itemUtils.showWallDistance(this);
    }

    hideWallDistance(){
        itemUtils.hideWallDistance(this);	
    }

    setWallDistance(plane){
        itemUtils.setWallDistance(this, plane);		
    }

    setSelected() {
        itemUtils.setSelected(this);		
    };

    setUnselected() {
        itemUtils.setUnselected(this);
    };


    getNombreBloque(name, nom_bloque) {
        return itemUtils.getNombreBloque(this,name, nom_bloque);
    }

    getNombreTirador(name) {
        return itemUtils.getNombreTirador(this,name);
    }

    getNombrePieza(name) {
        return itemUtils.getNombrePieza(this, name);
    }

    getNombrePiezaBloque(name, bloque) {
        return itemUtils.getNombrePiezaBloque(this, name, bloque);
    }

    aliasTirador(nombreTirador) {
        return itemUtils.aliasTirador(this, nombreTirador);
    }

    aliasBloque (bloque) {
        return itemUtils.aliasBloque(this, bloque);
    }

    aliasPalabra (pal) {
        return itemUtils.aliasPalabra(this, pal);
    }

    aliasItemBloque (nombreItemBloque, bloque) {
        return itemUtils.aliasItemBloque(this, nombreItemBloque, bloque);
    }

    diccionario (name) {
        return itemUtils.diccionario(name);

    }
    buscarEnDescripcion (desc,cad) {
        return itemUtils.buscarEnDescripcion(this,desc,cad);
    }

    interseccionObjetos (objects) {
        return itemUtils.interseccionObjetos(this,objects);
    }


    intersectaEstructura () {
        return itemUtils.intersectaEstructura(this);
    }

    openModuleAllowed () {
        return itemUtils.openModuleAllowed(this);
    }

    open (abrir) {
        itemUtils.open(this, abrir);
    }

    isOpened () {
        return itemUtils.isOpened(this);
    }

    marcarMaterialsPorSeparadores () {
        return itemUtils.marcarMaterialsPorSeparadores(this);
    }

    getIdxFoundGTASeparador (idxItemActivos) {
        return itemUtils.getIdxFoundGTASeparador(this,idxItemActivos);
    }


    getGTASeparador (idxSep) {
        return itemUtils.getGTASeparador(this,idxSep);
    }

    getDescripcionTexturas (idxSep,noAgrupar) {
        return itemUtils.getDescripcionTexturas(this,idxSep,noAgrupar);
    }

    getGTAyTexturas () {
        return itemUtils.getGTAyTexturas(this);
    }

    getAllGTAs () {
        return itemUtils.getAllGTAs(this);
    }


    getAllGTAsActivos () {
        return itemUtils.getAllGTAsActivos(this);
    }

    correspondenciaGTAs (gtas_raw, gtas_alias) {
        itemUtils.correspondenciaGTAs(this,gtas_raw,gtas_alias);
    }

    asignarGTAsSeparadores (gtas_sep) {
        itemUtils.asignarGTAsSeparadores(this,gtas_sep);
    }

    correspondenciaTiradores (tiradores) {
        itemUtils.correspondenciaTiradores(this,tiradores);
    }

    correspondenciaBloques (bloque, items_bloque) {
        itemUtils.correspondenciaBloques(this,bloque,items_bloque);
    }

    getGTAcode (name) {
        return itemUtils.getGTAcode(this,name);
    }


    getGTAs (name) {
       return itemUtils.getGTAs(this,name);
    }

    getModelosTirador () {
       return itemUtils.getModelosTirador(this);
    }
    
    getModelosBloquePorGrupo(nombre_bloque, grupo) {
        return itemUtils.getModelosBloquePorGrupo(this, nombre_bloque, grupo);
    }

    getItemsBloqueLimited(bloque,grupo_pieza) {
        return itemUtils.getItemsBloqueLimited(this,bloque,grupo_pieza);
    }

    getModelosBloque (nombre_bloque) {
       return itemUtils.getModelosBloque(this,nombre_bloque);
    }

    isItemBloqueInAllGroups (bloque, item_bloque) {
       return itemUtils.isItemBloqueInAllGroups(this,bloque, item_bloque); 
    }
    
    isGrupoModificable(grupo_pieza,bloque,item_bloque) { 
       return itemUtils.isGrupoModificable(this,grupo_pieza,bloque,item_bloque);  
    }

    aplicarRestriccionDependencia(grupo_pieza,blqPadreName,item_bloque,allGroups) {
        itemUtils.aplicarRestriccionDependencia(this,grupo_pieza,blqPadreName,item_bloque,allGroups);
    }

    setItemBloqueRawGrupo(bloque, item_bloque, grupo) {
        itemUtils.setItemBloqueRawGrupo(this, bloque, item_bloque, grupo);
    }

    setItemBloqueRaw (bloque, item_bloque, idCatalogo,grupo) {
        itemUtils.setItemBloqueRaw(this,bloque,item_bloque,idCatalogo,grupo); 
    }

    getGruposDeBloque(bloque) {
        return itemUtils.getGruposDeBloque(this, bloque);
    }

    resetearTexturas () {
        itemUtils.resetearTexturas(this); 
    }

    getItemActivo (bloque) {
       return itemUtils.getItemActivo(this,bloque); 
    }

    getItemActivoFromGrupo (grupo) {
       return itemUtils.getItemActivoFromGrupo(this,grupo); 
    }

    getTiradorActivo () {
       return itemUtils.getTiradorActivo(this); 
    }

    bloqueEncontrado (name,bloques) {
        return itemUtils.bloqueEncontrado(name,bloques); 
    }

    inicializarBloques  (bloquesIn) {
        itemUtils.inicializarBloques(this,bloquesIn); 
    }

    inicializarPalabras  (palabrasIn) {
        itemUtils.inicializarPalabras(this,palabrasIn); 
    }

    setItemBloque (bloque, item_bloque, idCatalogo, grupo) {
       itemUtils.setItemBloque(this,bloque, item_bloque, idCatalogo, grupo); 
    }

    setModeloTirador (modelo, idCatalogo) {
        itemUtils.setModeloTirador(this,modelo, idCatalogo); 
    }

    setModeloTiradorRaw (modelo, idCatalogo) {
        itemUtils.setModeloTiradorRaw(this,modelo, idCatalogo); 
    }

    // intersection has attributes point (vec3) and object (THREE.Mesh)
    // MOD Rafa
    //Item.prototype.clickPressed (intersection) {
    clickPressed (intersection,myIntersectedObjects) {
        itemUtils.clickPressed(this,intersection,myIntersectedObjects); 
    };

    clickDragged (intersection) {
        itemUtils.clickDragged(this,intersection); 
    };

    rotate (intersection) {
        itemUtils.rotate(this,intersection); 
    }

    moveToPosition (vec3, intersection) {
        itemUtils.moveToPosition(this,vec3,intersection); 
    }

    clickReleased () {
       itemUtils.clickReleased(this); 
    };

    // Returns an array of planes to use other than the ground plane
    // for passing intersection to clickPressed and clickDragged
    customIntersectionPlanes () {
        return itemUtils.customIntersectionPlanes(); 
    }

    // returns the 2d corners of the bounding polygon
    // offset is Vector3 (used for getting corners of object at a new position)
    // TODO: handle rotated objects better!
    getCorners (xDim, yDim, position) {
        return itemUtils.getCorners(this,xDim, yDim, position); 
    }

    // 2D
    getVertices (position) {
        return itemUtils.getVertices(this,position); 
    }

    isValidPosition ( vec3 ) {
        // implement in subclass
    }

    showError (vec3) {
        itemUtils.showError(this,vec3); 
    }

    showHelper(vec3) {
        itemUtils.showHelper(this,vec3); 
    }
    
    hideError () {
        itemUtils.hideError(this); 
    }
    
    hideHelper() {
        itemUtils.hideHelper(this); 
    }
    

    objectHalfSize () {
        return itemUtils.objectHalfSize(this); 
    }

    createGlow ( color, opacity, ignoreDepth ) {
        return itemUtils.createGlow(this, color, opacity, ignoreDepth ); 
    };
    
    createHelper( color, opacity, ignoreDepth ) {
        return itemUtils.createHelper(this, color, opacity, ignoreDepth ); 
    };
}
module.exports = Item;