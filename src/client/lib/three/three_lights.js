import * as THREE from 'three';
var utils = require('../utils/utils');

class ThreeLights {

    //var scope = this;
    constructor(scene, floorplan, camera) {
        this.scene = scene;
        this.floorplan = floorplan;
        this.tol = 1;
        this.height = 300; // TODO: share with Blueprint.Wall
        this.camera = camera;
        this.dirLight;
        this.ambientLight;
        this.hemisphereLight;
        this.pointLight = [];
        this.cameraHelper;
        this.dirhelper;
        this.hemispherehelper;
        this.pointLightHelper = [];
        this.mesh;
    
        
        this.init();
    }

  
    getDirLight() {
        return this.dirLight;
    }

    init() {
        /*var light = new THREE.HemisphereLight( 0xffffff, 0x888888, 0.6 );
        light.position.set(0, height, 0);
        scene.add(light);

        dirLight = new THREE.DirectionalLight( 0xffffff, 0 );
        dirLight.color.setHSL( 1, 1, 0.1 );

        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;

        dirLight.shadow.camera.far = height + tol;
        dirLight.shadow.bias = -0.0001;
        //dirLight.shadowDarkness = 0.2; // Comprobar alternativa
        dirLight.visible = true;
        //dirLight.shadowCameraVisible = false; // Comprobar alternativa

        scene.add(dirLight);
        scene.add(dirLight.target);

        //const helper = new THREE.DirectionalLightHelper(dirLight);
        //scene.add(helper); */



        /*
        dirLight = new THREE.SpotLight( 0xffffff, 0.5 );
        dirLight.position.set( 0, 500, 0);
        dirLight.castShadow = true;
        dirLight.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 70, 1, 200, 2000 ) );
        dirLight.shadow.bias = - 0.000222;
        dirLight.shadow.mapSize.width = 512;
        dirLight.shadow.mapSize.height = 512;
        scene.add( dirLight );*/

        //var camera = new THREE.PerspectiveCamera( 45, 1, 10,200 );
        //camera.translateX(500);
        //camera.updateProjectionMatrix();
        //ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
        //scene.add( ambientLight );

        //var light = new THREE.HemisphereLight( 0xffffff, 0x888888, 0.7 );
        
        if (parseInt(THREE.REVISION) <= 120) { 
            /*** OLD */ 
            this.hemisphereLight = new THREE.HemisphereLight( 0xffffff, 0x888888, 1 );
            this.hemisphereLight.position.set(0, this.height, 0);
            this.scene.add(this.hemisphereLight);

            const color = 0xFFFFFF;
            const intensity = 0.2;
            this.dirLight = new THREE.DirectionalLight(color, intensity);
            //dirLight.color.setHSL( 1, 1, 0.1 );
            this.dirLight.castShadow = true;

            //dirLight.target.position.set(0, 0, 0);
            this.dirLight.shadow.mapSize.width = 1024;
            this.dirLight.shadow.mapSize.height = 1024;

            this.dirLight.shadow.camera.far = this.height + this.tol;
            this.dirLight.shadow.bias = -0.0001;
            //dirLight.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 30, 1, 200, 700 ));

            this.scene.add(this.dirLight);
            this.scene.add(this.dirLight.target);

            /* FIN OLD */
        } else {
            // Para parecer a la version antigua
            //this.updateAmbientLight(true, 0xffffff, 0.9);
            //this.updateDirectionalLight(true,0xffffff,0.4,this.height,true);
            
            // Para comprobar nuevas luces
            //this.updateAmbientLight(true, 0xffffff, 0.3);
            //this.updatePointLight(true,0xffffff,1,0,0,0,0);
            /*const light1 = new THREE.AmbientLight(0xffffff, 0.3);
            light1.name = 'ambient_light';
            this.camera.add(light1);

            const light2 = new THREE.DirectionalLight(0xffffff, 0.9);
            light2.position.set(0.5, 0, 0.866); // ~60º
            light2.name = 'main_light';
            this.camera.add(light2);*/

            
            
        }
        //hemispherehelper = new THREE.HemisphereLightHelper( hemisphereLight, 50 );
        //scene.add( hemispherehelper );

        //dirhelper = new THREE.DirectionalLightHelper( dirLight, 50 );
        //scene.add( dirhelper );

        //const sphereSize = 50;
        //const pointLightHelper = new THREE.PointLightHelper( pointlight, sphereSize );
        //scene.add( pointLightHelper );


        //cameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
        //scene.add(cameraHelper);

        /*pointLight = new THREE.PointLight( 0xffffff, 1, 100 );
        pointLight.position.set( 100, 100, 100 );
        scene.add( pointLight );

        const sphereSize = 50;
        pointLightHelper = new THREE.PointLightHelper( pointLight, sphereSize );
        scene.add( pointLightHelper );*/


        this.floorplan.fireOnUpdatedRooms(this.updateShadowCamera);


        /*const sphereRadius = 30;
        const sphereWidthDivisions = 32;
        const sphereHeightDivisions = 16;
        const sphereGeo = new THREE.SphereBufferGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
        const sphereMat = new THREE.MeshPhongMaterial({color: '#CA8'});
        mesh = new THREE.Mesh(sphereGeo, sphereMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(0, 100, 0);
        scene.add(mesh);*/

    }

    updatePointLight(activate,color,intensity,distance,x,y,z) {
     
        
        //this.scene.remove(this.pointLight);
        //this.scene.remove(this.pointLightHelper);
        if (this.pointLight.length > 0) {
            this.removePointLights();
        }
        if (activate) {
           
      
           var pL = new THREE.PointLight( color, intensity, distance );
           //pL.castShadow = true;
           pL.position.set(x, y, z);
           var pLH = new THREE.PointLightHelper( pL, 50 );
           
           this.scene.add(pL);
           /*pL.shadow.mapSize.width = 1024; // default
            pL.shadow.mapSize.height = 1024; // default
            pL.shadow.camera.near = 1; // default
            pL.shadow.camera.far = 1000; // default*/

           this.scene.add(pLH);
           
           this.pointLight.push(pL);
           this.pointLightHelper.push(pLH);

        }
        this.scene.needsUpdate = true;
      
    }
  
    
    updateAmbientLight(activate,color,intensity) {
     
        this.scene.remove(this.ambientLight);
        if (activate) {
            this.ambientLight = new THREE.AmbientLight( color, intensity );
            this.scene.add( this.ambientLight );
        }
        this.scene.needsUpdate = true;
   
    }

    updateHemisphereLight(activate,skycolor,groundcolor,intensity,x,y,z) {
     
        this.scene.remove(this.hemisphereLight);
        //scene.remove(hemispherehelper);
        if (activate) {
           this.hemisphereLight = new THREE.HemisphereLight( skycolor, groundcolor, intensity );
           this.hemisphereLight.position.set(x, y, z);
           this.scene.add(this.hemisphereLight);
           //hemispherehelper = new THREE.HemisphereLightHelper( hemisphereLight, 50 );
           //scene.add( hemispherehelper );

        }
        this.scene.needsUpdate = true;
   
    }
  
    updateDirectionalLight(activate,color,intensity,y,shadows) {
     
        this.scene.remove(this.dirLight);
        this.scene.remove(this.dirhelper);
        //scene.remove(cameraHelper);

        this.dirLight = null;
        if (activate) {
           this.dirLight = new THREE.DirectionalLight(color, intensity);
           this.dirLight.castShadow = shadows;
           this.dirLight.shadow.mapSize.width = 1024;
           this.dirLight.shadow.mapSize.height = 1024;
           this.height = parseFloat(y);
           this.dirLight.shadow.camera.far = this.height + this.tol;
           this.dirLight.shadow.bias = -0.0001;

           //this.dirLight.position.set(0.5, 0, 0.866);
           this.scene.add(this.dirLight);
           this.scene.add(this.dirLight.target);

           //cameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
           //scene.add(cameraHelper);
           this.updateShadowCamera();

           //dirhelper = new THREE.DirectionalLightHelper( dirLight, 50 );
           //scene.add( dirhelper );

       }
       this.scene.needsUpdate = true;
   
    }
  
    removePointLights() {
        for (var i=0; i < this.pointLight.length; i++) {
            this.scene.remove(this.pointLight[i]);
        }
        for (var i=0; i < this.pointLightHelper.length; i++) {
            this.scene.remove(this.pointLightHelper[i]);
        }
        this.pointLight = [];
        this.pointLightHelper = [];
        
    }
    
    removeLightsHelper() {
        for (var i=0; i < this.pointLightHelper.length; i++) {
            this.scene.remove(this.pointLightHelper[i]);   
        }
        this.pointLightHelper = [];
        this.scene.remove(this.cameraHelper);
        this.scene.remove(this.dirhelper);
        this.scene.remove(this.hemispherehelper);
        this.pointLightHelper = [];
    }
    updateShadowCamera = () => {

        var size = this.floorplan.getSize();
        var d = (Math.max(size.z, size.x) + this.tol) / 2.0;

        var center = this.floorplan.getCenter();
        var pos = new THREE.Vector3(
          center.x, this.height, center.z);
  
        var distance = 100000;  
        var intensity = 1;
        if (this.pointLight.length > 0) {
            this.removePointLights();
            //var rooms = this.floorplan.getRooms();
            //for (var i=0; i < rooms.length; i++) {
                //var cen = rooms[i].getCenter(true);
                //var pos = new THREE.Vector3(
                //    cen.x, this.height, cen.z);
                this.updatePointLight(true,0xffffff,1,100000,pos.x,pos.y,pos.z);
            //}
            
            

        }
        if (this.dirLight) {
            this.dirLight.position.copy(pos);
            //mesh.position.copy(new THREE.Vector3(
            //  center.x, 100, center.z));
            this.dirLight.target.position.copy(center);
            this.dirLight.shadow.camera.position.copy(center);
            this.dirLight.updateMatrix();
            this.dirLight.updateWorldMatrix();
            this.dirLight.shadow.camera.left = -d;
            this.dirLight.shadow.camera.right = d;
            this.dirLight.shadow.camera.top = d;
            this.dirLight.shadow.camera.bottom = -d;
            // this is necessary for updates
            if (this.dirLight.shadowCamera) {
              this.dirLight.shadowCamera.left = this.dirLight.shadowCameraLeft;
              this.dirLight.shadowCamera.right = this.dirLight.shadowCameraRight;
              this.dirLight.shadowCamera.top = this.dirLight.shadowCameraTop;
              this.dirLight.shadowCamera.bottom = this.dirLight.shadowCameraBottom;
              this.dirLight.shadowCamera.updateProjectionMatrix();
            }
            this.dirLight.shadow.camera.updateProjectionMatrix();
            //cameraHelper.update();
            //dirhelper.update();
         }
    }

 }

module.exports = ThreeLights;