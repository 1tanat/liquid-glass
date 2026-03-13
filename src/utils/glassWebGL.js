import vertSource from "../shaders/glass.vert?raw";
import fragSource from "../shaders/glass.frag?raw";

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertSource, fragSource) {
  const vert = createShader(gl, gl.VERTEX_SHADER, vertSource);
  const frag = createShader(gl, gl.FRAGMENT_SHADER, fragSource);
  if (!vert || !frag) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function createCoverTexture(gl, img, viewportWidth, viewportHeight) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const vw = viewportWidth;
  const vh = viewportHeight;
  const scale = Math.max(vw / iw, vh / ih);
  const drawWidth = iw * scale;
  const drawHeight = ih * scale;
  const dx = (vw - drawWidth) / 2;
  const dy = (vh - drawHeight) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = vw;
  canvas.height = vh;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  return tex;
}

export function initGlassGL(canvas, img) {
  const gl = canvas.getContext("webgl", { alpha: true });
  if (!gl) return null;

  const program = createProgram(gl, vertSource, fragSource);
  if (!program) return null;

  const positionLoc = gl.getAttribLocation(program, "a_position");
  const uvLoc = gl.getAttribLocation(program, "a_uv");

  const viewportSizeLoc = gl.getUniformLocation(program, "u_viewportSize");
  const cardPosLoc = gl.getUniformLocation(program, "u_cardPos");
  const cardSizeLoc = gl.getUniformLocation(program, "u_cardSize");
  const cardCenterLoc = gl.getUniformLocation(program, "u_cardCenter");
  const distortionVwLoc = gl.getUniformLocation(program, "u_distortionVw");
  const edgePowerLoc = gl.getUniformLocation(program, "u_edgePower");
  const cornerRadiusVwLoc = gl.getUniformLocation(program, "u_cornerRadiusVw");
  const chromaStrengthLoc = gl.getUniformLocation(program, "u_chromaStrength");
  const timeLoc = gl.getUniformLocation(program, "u_time");
  const draggingLoc = gl.getUniformLocation(program, "u_dragging");

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const quad = new Float32Array([
    -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

  let bgTexture = null;
  let rafId = null;

  function updateBackgroundTexture() {
    if (!img || !img.complete) return;
    const w = canvas.width;
    const h = canvas.height;
    if (bgTexture) gl.deleteTexture(bgTexture);
    bgTexture = createCoverTexture(gl, img, w, h);
  }

  function drawCard(cardRect, time, isDragging) {
    const { x, y, width, height, centerX, centerY } = cardRect;
    const cx = centerX ?? x + width / 2;
    const cy = centerY ?? y + height / 2;
    const vw = canvas.width;
    const vh = canvas.height;
    const left = (x / vw) * 2 - 1;
    const right = ((x + width) / vw) * 2 - 1;
    const topNDC = 1 - (y / vh) * 2;
    const bottomNDC = 1 - ((y + height) / vh) * 2;
    const positions = new Float32Array([
      left,
      bottomNDC,
      0,
      1,
      right,
      bottomNDC,
      1,
      1,
      left,
      topNDC,
      0,
      0,
      right,
      topNDC,
      1,
      0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);

    gl.uniform2f(viewportSizeLoc, vw, vh);
    gl.uniform2f(cardPosLoc, x, y);
    gl.uniform2f(cardSizeLoc, width, height);
    gl.uniform2f(cardCenterLoc, cx, cy);
    gl.uniform1f(distortionVwLoc, 4.5);
    gl.uniform1f(edgePowerLoc, 2.0);
    gl.uniform1f(cornerRadiusVwLoc, 2.0);
    gl.uniform1f(chromaStrengthLoc, 1.0);
    gl.uniform1f(timeLoc, time);
    gl.uniform1f(draggingLoc, isDragging ? 1.0 : 0.0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function render(cardRects) {
    if (!gl || !program || !bgTexture) return;
    const vw = canvas.width;
    const vh = canvas.height;
    gl.viewport(0, 0, vw, vh);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D, bgTexture);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);

    const time = performance.now() / 1000;
    for (const rect of cardRects) {
      drawCard(rect, time, !!rect.dragging);
    }
  }

  function loop(getCardRects) {
    const rects = getCardRects();
    if (rects.length) render(rects);
    rafId = requestAnimationFrame(() => loop(getCardRects));
  }

  return {
    setImage(image) {
      if (image && image.complete) {
        updateBackgroundTexture();
      } else if (image) {
        image.addEventListener("load", () => updateBackgroundTexture());
      }
    },
    resize(width, height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      if (img && img.complete) updateBackgroundTexture();
    },
    start(getCardRects) {
      if (img && img.complete) updateBackgroundTexture();
      loop(getCardRects);
    },
    stop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    },
    destroy() {
      this.stop();
      if (bgTexture) gl.deleteTexture(bgTexture);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    },
  };
}
