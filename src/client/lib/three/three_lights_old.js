import * as THREE from 'three';

var ThreeLights = function(scene, floorplan, camera) {

  var scope = this;
  var scene = scene;
  var floorplan = floorplan;

  var tol = 1;
  var height = 300; // TODO: share with Blueprint.Wall

  var dirLight;
  var ambientLight;
  var hemisphereLight;
  var pointLight;
  var cameraHelper;
  var dirhelper;
  var hemispherehelper;
  var pointLightHelper;
  var mesh;
  this.getDirLight = function() {
    return dirLight;
  }

  function init() {
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
    hemisphereLight = new THREE.HemisphereLight( 0xffffff, 0x888888, 1 );
    hemisphereLight.position.set(0, height, 0);
    scene.add(hemisphereLight);
    
    const color = 0xFFFFFF;
    const intensity = 0.2;
    dirLight = new THREE.DirectionalLight(color, intensity);
    //dirLight.color.setHSL( 1, 1, 0.1 );
    dirLight.castShadow = true;
   
    //dirLight.target.position.set(0, 0, 0);
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;

    dirLight.shadow.camera.far = height + tol;
    dirLight.shadow.bias = -0.0001;
    //dirLight.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 30, 1, 200, 700 ));
    
    scene.add(dirLight);
    scene.add(dirLight.target);
    
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
    
    
    floorplan.fireOnUpdatedRooms(updateShadowCamera);
    
    
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

  this.updatePointLight = function(activate,color,intensity,distance,x,y,z) {
     
     scene.remove(pointLight);
     scene.remove(pointLightHelper);
     if (activate) {
        pointLight = new THREE.PointLight( color, intensity, distance );
        pointLight.position.set(x, y, z);
        scene.add(pointLight);
        pointLightHelper = new THREE.PointLightHelper( pointLight, 50 );
        scene.add( pointLightHelper );
   
    }
     scene.needsUpdate = true;
   
  }
  
    
  this.updateAmbientLight = function(activate,color,intensity) {
     
     scene.remove(ambientLight);
     if (activate) {
        ambientLight = new THREE.AmbientLight( color, intensity );
        scene.add( ambientLight );
    }
     scene.needsUpdate = true;
   
  }

  this.updateHemisphereLight = function(activate,skycolor,groundcolor,intensity,x,y,z) {
     
     scene.remove(hemisphereLight);
     //scene.remove(hemispherehelper);
     if (activate) {
        hemisphereLight = new THREE.HemisphereLight( skycolor, groundcolor, intensity );
        hemisphereLight.position.set(x, y, z);
        scene.add(hemisphereLight);
        //hemispherehelper = new THREE.HemisphereLightHelper( hemisphereLight, 50 );
        //scene.add( hemispherehelper );
   
    }
     scene.needsUpdate = true;
   
  }
  
  this.updateDirectionalLight = function(activate,color,intensity,y,shadows) {
     
     scene.remove(dirLight);
     scene.remove(dirhelper);
     //scene.remove(cameraHelper);
     
     dirLight = null;
     if (activate) {
        dirLight = new THREE.DirectionalLight(color, intensity);
        dirLight.castShadow = shadows;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        height = parseFloat(y);
        dirLight.shadow.camera.far = height + tol;
        dirLight.shadow.bias = -0.0001;

        
        scene.add(dirLight);
        scene.add(dirLight.target);
       
        //cameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
        //scene.add(cameraHelper);
        updateShadowCamera();
        
        //dirhelper = new THREE.DirectionalLightHelper( dirLight, 50 );
        //scene.add( dirhelper );

    }
     scene.needsUpdate = true;
   
  }
  
  
  function updateShadowCamera() {

    var size = floorplan.getSize();
    d = (Math.max(size.z, size.x) + tol) / 2.0;

    var center = floorplan.getCenter();
    var pos = new THREE.Vector3(
      center.x, height, center.z);
    if (dirLight) {
        dirLight.position.copy(pos);
        //mesh.position.copy(new THREE.Vector3(
        //  center.x, 100, center.z));
        dirLight.target.position.copy(center);
        dirLight.shadow.camera.position.copy(center);
        dirLight.updateMatrix();
        dirLight.updateWorldMatrix();
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        // this is necessary for updates
        if (dirLight.shadowCamera) {
          dirLight.shadowCamera.left = dirLight.shadowCameraLeft;
          dirLight.shadowCamera.right = dirLight.shadowCameraRight;
          dirLight.shadowCamera.top = dirLight.shadowCameraTop;
          dirLight.shadowCamera.bottom = dirLight.shadowCameraBottom;
          dirLight.shadowCamera.updateProjectionMatrix();
        }
        dirLight.shadow.camera.updateProjectionMatrix();
        //cameraHelper.update();
        //dirhelper.update();
    }
  }

  init();
}

module.exports = ThreeLights;