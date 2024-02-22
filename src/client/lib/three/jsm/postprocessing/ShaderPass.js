"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ShaderPass = void 0;

var _threeModule = require('three');

var _Pass = require("./Pass.js");

/**
 * @author alteredq / http://alteredqualia.com/
 */
var ShaderPass = function (shader, textureID) {
  _Pass.Pass.call(this);

  this.textureID = textureID !== undefined ? textureID : "tDiffuse";

  if (shader instanceof _threeModule.ShaderMaterial) {
    this.uniforms = shader.uniforms;
    this.material = shader;
  } else if (shader) {
    this.uniforms = _threeModule.UniformsUtils.clone(shader.uniforms);
    this.material = new _threeModule.ShaderMaterial({
      defines: Object.assign({}, shader.defines),
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });
  }

  this.fsQuad = new _Pass.Pass.FullScreenQuad(this.material);
};

exports.ShaderPass = ShaderPass;
ShaderPass.prototype = Object.assign(Object.create(_Pass.Pass.prototype), {
  constructor: ShaderPass,
  render: function (renderer, writeBuffer, readBuffer
  /*, deltaTime, maskActive */
  ) {
    if (this.uniforms[this.textureID]) {
      this.uniforms[this.textureID].value = readBuffer.texture;
    }

    this.fsQuad.material = this.material;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer); // TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600

      if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
      this.fsQuad.render(renderer);
    }
  }
});
