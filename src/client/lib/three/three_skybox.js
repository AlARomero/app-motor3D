import * as THREE from 'three';

class ThreeSkybox {

  constructor(scene) {
    // Callbacks llamados cuando se carga el modelo
    this.skyBoxLoadedCallbacks = $.Callbacks();
    this.scene = scene;

    // Background (ya se vera si se quiere una imagen, un color...)
    this.background = 0xD3D3D3;
    scene.getScene().background = new THREE.Color(this.background);

    // Carga del modelo 3D de fondo
    scene.loadSkyGltf('models/gltf/Chalet_Bodas_02.gltf')
    .then(model => {
      this.bgModel = model;
      // Se le añade una variable metadata si no la tiene para poner que es el background
      this.bgModel.metadata = this.bgModel.metadata || {};
      this.bgModel.metadata.isBackground = true;

      // Se reescala (modelos suelen ser muy pequeños)
      this.bgModel.scale.set(100, 100, 100);
      this.bgModel.position.set(-1530, 32, 200); // TODO ajustar la posición a (0, altura para que el plano se vea en 0, 0)
      this.skyBoxLoadedCallbacks.fire(model);
    }).catch(err => {
      console.log(err);
    });
  }

  // Carga un nuevo modelo 3D de fondo y desecha el anterior
  loadNewModel(url) {
    if (this.bgModel) {
      this.scene.remove(this.bgModel);
    }
    this.scene.loadSkyGltf(url)
    .then(model => {
      this.bgModel = model;
      // Se disparan las funciones del callback una vez esta cargado el modelo
      this.skyBoxLoadedCallbacks.fire(model);
    }).catch(err => {
      console.log(err);
    });
  }

  // Añadir callbacks
  onSkyBoxLoad(callback) {
    this.skyBoxLoadedCallbacks.add(callback);
  }

  // Eliminar callbacks
  removeOnSkyBoxLoad(callback) {
    this.skyBoxLoadedCallbacks.remove(callback);
  }

  getModel() {
    return this.bgModel;
  }

  getBackground() {
    return this.background;
  }

  getSky() {
    return this.sky;
  }
}

module.exports = ThreeSkybox;