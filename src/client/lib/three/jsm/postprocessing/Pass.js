"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Pass = Pass;

var _threeModule = require('three');

function Pass() {
  // if set to true, the pass is processed by the composer
  this.enabled = true; // if set to true, the pass indicates to swap read and write buffer after rendering

  this.needsSwap = true; // if set to true, the pass clears its buffer before rendering

  this.clear = false; // if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.

  this.renderToScreen = false;
}

Object.assign(Pass.prototype, {
  setSize: function
    /* width, height */
  () {},
  render: function
    /* renderer, writeBuffer, readBuffer, deltaTime, maskActive */
  () {
    console.error('THREE.Pass: .render() must be implemented in derived pass.');
  }
}); // Helper for passes that need to fill the viewport with a single quad.

Pass.FullScreenQuad = function () {
  var camera = new _threeModule.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var geometry = new _threeModule.PlaneBufferGeometry(2, 2);

  var FullScreenQuad = function (material) {
    this._mesh = new _threeModule.Mesh(geometry, material);
  };

  Object.defineProperty(FullScreenQuad.prototype, 'material', {
    get: function () {
      return this._mesh.material;
    },
    set: function (value) {
      this._mesh.material = value;
    }
  });
  Object.assign(FullScreenQuad.prototype, {
    render: function (renderer) {
      renderer.render(this._mesh, camera);
    }
  });
  return FullScreenQuad;
}();

//module.exports = Pass;