import * as THREE from 'three';

class ThreeSkybox {
  constructor(scene) {
    this.scene = scene;
    this.skybox = this.createSkybox();
    this.ground = this.createGround();
  }

  createSkybox() {
    // Cargar la textura
    const loader = new THREE.TextureLoader();
    const texture = loader.load('assets/img/fondo/Realism_equirectangular-jpg_una_meseta_llana_sin_1574523967_10436526.jpg');

    // Crear la geometría de la esfera
    const geometry = new THREE.SphereGeometry(4000, 32, 32, 0, Math.PI * 2, 0, Math.PI * 1.5);

    // Crear el material con la textura
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide // Para que la textura se vea desde dentro de la esfera
    });

    // Crear la esfera y añadirla a la escena
    const skybox = new THREE.Mesh(geometry, material);
    skybox.position.y = 3000;
    return skybox;
  }

  createGround() {
    // Cargar la textura
    const loader = new THREE.TextureLoader();
    const texture = loader.load('assets/img/fondo/fondo-textura-hierba-new.jpg');

    // Configurar la textura para que se repita
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50); // Ajustar este valor según el tamaño de la textura y el tamaño del plano

    // Crear la geometría del plano
    const geometry = new THREE.PlaneGeometry(5000, 5000);

    // Crear el material con la textura
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide // Para que la textura se vea desde ambos lados del plano
    });

    // Crear el plano, rotarlo para que esté horizontal y moverlo hacia abajo para que esté en la base de la esfera
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -1;
    return ground;
  }

  addToScene() {
    this.scene.add(this.skybox);
    this.scene.add(this.ground);
  }

  removeFromScene() {
    this.scene.remove(this.skybox);
    this.scene.remove(this.ground);
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


//https://teams.microsoft.com/dl/launcher/launcher.html?url=%2F_%23%2Fl%2Fmeetup-join%2F19%3Ameeting_YzA5YTM2NDYtNmRmZi00MjgxLWEwNzMtN2U0YmE0ODVjMjRk%40thread.v2%2F0%3Fcontext%3D%257b%2522Tid%2522%253a%25225b973f99-77df-4beb-b27d-aa0c70b8482c%2522%252c%2522Oid%2522%253a%2522bd5a8e27-f66b-47fb-b896-d346e591f7bf%2522%257d%26anon%3Dtrue&type=meetup-join&deeplinkId=a286063d-1485-4a49-8d80-b6dd7d5b3eaa&directDl=true&msLaunch=true&enableMobilePage=true&suppressPrompt=true