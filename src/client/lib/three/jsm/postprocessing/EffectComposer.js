"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Pass = exports.EffectComposer = void 0;

var _threeModule = require('three');

var _CopyShader = require("../shaders/CopyShader.js");

var _ShaderPass = require("./ShaderPass.js");

var _MaskPass = require("./MaskPass.js");

/**
 * @author alteredq / http://alteredqualia.com/
 */
var EffectComposer = function (renderer, renderTarget) {
  this.renderer = renderer;

  if (renderTarget === undefined) {
    var parameters = {
      minFilter: _threeModule.LinearFilter,
      magFilter: _threeModule.LinearFilter,
      format: _threeModule.RGBAFormat,
      stencilBuffer: false
    };
    var size = renderer.getSize(new _threeModule.Vector2());
    this._pixelRatio = renderer.getPixelRatio();
    this._width = size.width;
    this._height = size.height;
    renderTarget = new _threeModule.WebGLRenderTarget(this._width * this._pixelRatio, this._height * this._pixelRatio, parameters);
    renderTarget.texture.name = 'EffectComposer.rt1';
  } else {
    this._pixelRatio = 1;
    this._width = renderTarget.width;
    this._height = renderTarget.height;
  }

  this.renderTarget1 = renderTarget;
  this.renderTarget2 = renderTarget.clone();
  this.renderTarget2.texture.name = 'EffectComposer.rt2';
  this.writeBuffer = this.renderTarget1;
  this.readBuffer = this.renderTarget2;
  this.renderToScreen = true;
  this.passes = []; // dependencies

  if (_CopyShader.CopyShader === undefined) {
    console.error('THREE.EffectComposer relies on CopyShader');
  }

  if (_ShaderPass.ShaderPass === undefined) {
    console.error('THREE.EffectComposer relies on ShaderPass');
  }

  this.copyPass = new _ShaderPass.ShaderPass(_CopyShader.CopyShader);
  this.clock = new _threeModule.Clock();
};

exports.EffectComposer = EffectComposer;
Object.assign(EffectComposer.prototype, {
  swapBuffers: function () {
    var tmp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = tmp;
  },
  addPass: function (pass) {
    this.passes.push(pass);
    pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  },
  insertPass: function (pass, index) {
    this.passes.splice(index, 0, pass);
  },
  isLastEnabledPass: function (passIndex) {
    for (var i = passIndex + 1; i < this.passes.length; i++) {
      if (this.passes[i].enabled) {
        return false;
      }
    }

    return true;
  },
  render: function (deltaTime) {
    // deltaTime value is in seconds
    if (deltaTime === undefined) {
      deltaTime = this.clock.getDelta();
    }

    var currentRenderTarget = this.renderer.getRenderTarget();
    var maskActive = false;
    var pass,
        i,
        il = this.passes.length;

    for (i = 0; i < il; i++) {
      pass = this.passes[i];
      if (pass.enabled === false) continue;
      pass.renderToScreen = this.renderToScreen && this.isLastEnabledPass(i);
      pass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime, maskActive);

      if (pass.needsSwap) {
        if (maskActive) {
          var context = this.renderer.getContext();
          var stencil = this.renderer.state.buffers.stencil; //context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );

          stencil.setFunc(context.NOTEQUAL, 1, 0xffffffff);
          this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime); //context.stencilFunc( context.EQUAL, 1, 0xffffffff );

          stencil.setFunc(context.EQUAL, 1, 0xffffffff);
        }

        this.swapBuffers();
      }

      if (_MaskPass.MaskPass !== undefined) {
        if (pass instanceof _MaskPass.MaskPass) {
          maskActive = true;
        } else if (pass instanceof _MaskPass.ClearMaskPass) {
          maskActive = false;
        }
      }
    }

    this.renderer.setRenderTarget(currentRenderTarget);
  },
  reset: function (renderTarget) {
    if (renderTarget === undefined) {
      var size = this.renderer.getSize(new _threeModule.Vector2());
      this._pixelRatio = this.renderer.getPixelRatio();
      this._width = size.width;
      this._height = size.height;
      renderTarget = this.renderTarget1.clone();
      renderTarget.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
    }

    this.renderTarget1.dispose();
    this.renderTarget2.dispose();
    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;
  },
  setSize: function (width, height) {
    this._width = width;
    this._height = height;
    var effectiveWidth = this._width * this._pixelRatio;
    var effectiveHeight = this._height * this._pixelRatio;
    this.renderTarget1.setSize(effectiveWidth, effectiveHeight);
    this.renderTarget2.setSize(effectiveWidth, effectiveHeight);

    for (var i = 0; i < this.passes.length; i++) {
      this.passes[i].setSize(effectiveWidth, effectiveHeight);
    }
  },
  setPixelRatio: function (pixelRatio) {
    this._pixelRatio = pixelRatio;
    this.setSize(this._width, this._height);
  }
});

var Pass = function () {
  // if set to true, the pass is processed by the composer
  this.enabled = true; // if set to true, the pass indicates to swap read and write buffer after rendering

  this.needsSwap = true; // if set to true, the pass clears its buffer before rendering

  this.clear = false; // if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.

  this.renderToScreen = false;
};

exports.Pass = Pass;
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


module.exports = EffectComposer;