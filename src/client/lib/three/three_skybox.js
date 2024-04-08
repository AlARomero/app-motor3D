import * as THREE from 'three';

class ThreeSkybox {

  constructor(scene) {
    this.scene = scene;

    // Background (ya se vera si se quiere una imagen, un color...)
    this.background = 0xA8CDF7;
    scene.getScene().background = new THREE.Color(this.background);

    // Carga del modelo 3D de fondo
    scene.loadSkyGltf('models/gltf/Chalet_Bodas_02.gltf')
    .then(model => {
      this.model = model;
      this.model.scale.set(100, 100, 100);
      this.model.position.set(-1530, 40, 200); // TODO ajustar la posición a (0, altura para que el plano se vea en 0, 0)
    }).catch(err => {
      console.log(err);
    });

    const geometry = new THREE.PlaneGeometry(1000000, 1000000);
    const material = new THREE.MeshBasicMaterial({color: 0xBDCC83, side: THREE.DoubleSide});
    this.plane = new THREE.Mesh(geometry, material);
    // Rota el plano para que esté horizontal
    this.plane.rotation.x = Math.PI / 2;
    this.plane.position.y = -100;
    scene.add(this.plane);
  }

  // Carga un nuevo modelo 3D de fondo y desecha el anterior
  loadNewModel(url) {
    if (this.model)
      //TODO borrar el modelo.
    this.scene.loadSkyGltf(url)
    .then(model => {
      this.scene.remove(this.model);
      this.model = model;
    }).catch(err => {
      console.log(err);
    });
  }

  getModel() {
    return this.model;
  }

  getBackground() {
    return this.background;
  }
}


// var ThreeSkybox = function(scene) {

//   var scope = this;

//   var scene = scene;

//   var topColor = 0xffffff;// 0xD8ECF9
//   var bottomColor = 0xe9e9e9; // 0xf9f9f9;//0x565e63
//   var verticalOffset = 500
//   var sphereRadius = 4000
//   var widthSegments = 32
//   var heightSegments = 15

//   var vertexShader = [
//     "varying vec3 vWorldPosition;",
//     "void main() {",
//     "  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
//     "  vWorldPosition = worldPosition.xyz;",
//     "  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
//     "}"
//   ].join('\n');

//   var fragmentShader = [
//     "uniform vec3 topColor;",
//     "uniform vec3 bottomColor;",
//     "uniform float offset;",
//     "varying vec3 vWorldPosition;",
//     "void main() {",
//     "  float h = normalize( vWorldPosition + offset ).y;",
//     "  gl_FragColor = vec4( mix( bottomColor, topColor, (h + 1.0) / 2.0), 1.0 );",
//     "}"
//   ].join('\n');

//   function init() {

//     var uniforms = {
//         topColor: { 
//           type: "c", 
//           value: new THREE.Color(topColor) 
//         },
//         bottomColor: { 
//           type: "c", 
//           value: new THREE.Color(bottomColor) 
//         },
//         offset: { 
//           type: "f", 
//           value: verticalOffset 
//         }
//     }

//     var skyGeo = new THREE.SphereGeometry( 
//       sphereRadius, widthSegments, heightSegments );
//     var skyMat = new THREE.ShaderMaterial({ 
//       vertexShader: vertexShader, 
//       fragmentShader: fragmentShader, 
//       uniforms: uniforms, 
//       side: THREE.BackSide 
//     });

//     var sky = new THREE.Mesh(skyGeo, skyMat);
//     scene.add(sky);
//   }

//   init();
// }

module.exports = ThreeSkybox;