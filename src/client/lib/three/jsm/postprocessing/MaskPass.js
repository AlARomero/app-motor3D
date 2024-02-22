"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MaskPass = exports.ClearMaskPass = void 0;

var _Pass = require("./Pass.js");

/**
 * @author alteredq / http://alteredqualia.com/
 */
var MaskPass = function (scene, camera) {
  _Pass.Pass.call(this);

  this.scene = scene;
  this.camera = camera;
  this.clear = true;
  this.needsSwap = false;
  this.inverse = false;
};

exports.MaskPass = MaskPass;
MaskPass.prototype = Object.assign(Object.create(_Pass.Pass.prototype), {
  constructor: MaskPass,
  render: function (renderer, writeBuffer, readBuffer
  /*, deltaTime, maskActive */
  ) {
    var context = renderer.getContext();
    var state = renderer.state; // don't update color or depth

    state.buffers.color.setMask(false);
    state.buffers.depth.setMask(false); // lock buffers

    state.buffers.color.setLocked(true);
    state.buffers.depth.setLocked(true); // set up stencil

    var writeValue, clearValue;

    if (this.inverse) {
      writeValue = 0;
      clearValue = 1;
    } else {
      writeValue = 1;
      clearValue = 0;
    }

    state.buffers.stencil.setTest(true);
    state.buffers.stencil.setOp(context.REPLACE, context.REPLACE, context.REPLACE);
    state.buffers.stencil.setFunc(context.ALWAYS, writeValue, 0xffffffff);
    state.buffers.stencil.setClear(clearValue);
    state.buffers.stencil.setLocked(true); // draw into the stencil buffer

    renderer.setRenderTarget(readBuffer);
    if (this.clear) renderer.clear();
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(writeBuffer);
    if (this.clear) renderer.clear();
    renderer.render(this.scene, this.camera); // unlock color and depth buffer for subsequent rendering

    state.buffers.color.setLocked(false);
    state.buffers.depth.setLocked(false); // only render where stencil is set to 1

    state.buffers.stencil.setLocked(false);
    state.buffers.stencil.setFunc(context.EQUAL, 1, 0xffffffff); // draw if == 1

    state.buffers.stencil.setOp(context.KEEP, context.KEEP, context.KEEP);
    state.buffers.stencil.setLocked(true);
  }
});

var ClearMaskPass = function () {
  _Pass.Pass.call(this);

  this.needsSwap = false;
};

exports.ClearMaskPass = ClearMaskPass;
ClearMaskPass.prototype = Object.create(_Pass.Pass.prototype);
Object.assign(ClearMaskPass.prototype, {
  render: function (renderer
  /*, writeBuffer, readBuffer, deltaTime, maskActive */
  ) {
    renderer.state.buffers.stencil.setLocked(false);
    renderer.state.buffers.stencil.setTest(false);
  }
});
