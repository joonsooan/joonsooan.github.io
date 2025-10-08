window.onload = async function main() {
  const canvas = document.getElementById("glcanvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    console.error("WebGL 2 is not supported by your browser.");
    return false;
  }

  const vsSource = await (await fetch("shVert.glsl")).text();
  const fsSource = await (await fetch("shFrag.glsl")).text();

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  if (!shaderProgram) return;

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "a_position"),
    },
    uniformLocations: {
      modelMatrix: gl.getUniformLocation(shaderProgram, "u_modelMatrix"),
      color: gl.getUniformLocation(shaderProgram, "u_color"),
    },
  };

  const buffers = initBuffers(gl);
  let startTime = performance.now();

  function render(currentTime) {
    currentTime *= 0.001;
    const elapsedTime = currentTime - startTime * 0.001;
    drawScene(gl, programInfo, buffers, elapsedTime);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
};

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error("Shader link failed:", gl.getProgramInfoLog(shaderProgram));
    return null;
  }
  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initBuffers(gl) {
  const pillarBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pillarBuffer);
  const pillarVertices = [-0.1, -0.6, 0.1, -0.6, -0.1, 0.4, 0.1, 0.4];
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(pillarVertices),
    gl.STATIC_DRAW
  );

  const bladeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bladeBuffer);
  const bladeVertices = [-0.35, -0.06, 0.35, -0.06, -0.35, 0.06, 0.35, 0.06];
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(bladeVertices),
    gl.STATIC_DRAW
  );

  const smallBladeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, smallBladeBuffer);
  const smallBladeVertices = [
    -0.08, -0.025, 0.08, -0.025, -0.08, 0.025, 0.08, 0.025,
  ];
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(smallBladeVertices),
    gl.STATIC_DRAW
  );

  return {
    pillar: pillarBuffer,
    blade: bladeBuffer,
    smallBlade: smallBladeBuffer,
  };
}

function drawScene(gl, programInfo, buffers, elapsedTime) {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.15, 0.22, 0.32, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(programInfo.program);

  {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pillar);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    gl.uniform4fv(programInfo.uniformLocations.color, [0.5, 0.3, 0.1, 1.0]);
    const modelMatrix = mat4.create();
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelMatrix,
      false,
      modelMatrix
    );
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  const largeBladeAngle = Math.sin(elapsedTime) * Math.PI * 2.0;
  const largeBladeMatrix = mat4.create();
  mat4.translate(largeBladeMatrix, largeBladeMatrix, [0.0, 0.4, 0.0]);
  mat4.rotate(largeBladeMatrix, largeBladeMatrix, largeBladeAngle, [0, 0, 1]);
  {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.blade);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    gl.uniform4fv(programInfo.uniformLocations.color, [0.9, 0.9, 0.9, 1.0]);
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelMatrix,
      false,
      largeBladeMatrix
    );
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  const smallBladeAngle = Math.sin(elapsedTime) * Math.PI * -10.0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.smallBlade);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    2,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  gl.uniform4fv(programInfo.uniformLocations.color, [0.7, 0.7, 0.7, 1.0]);

  const leftSmallBladeMatrix = mat4.clone(largeBladeMatrix);
  mat4.translate(leftSmallBladeMatrix, leftSmallBladeMatrix, [-0.35, 0, 0]);
  mat4.rotate(leftSmallBladeMatrix, leftSmallBladeMatrix, 0.4, [0, 0, 1]);
  mat4.rotate(
    leftSmallBladeMatrix,
    leftSmallBladeMatrix,
    smallBladeAngle,
    [0, 0, 1]
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelMatrix,
    false,
    leftSmallBladeMatrix
  );
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  const rightSmallBladeMatrix = mat4.clone(largeBladeMatrix);
  mat4.translate(rightSmallBladeMatrix, rightSmallBladeMatrix, [0.35, 0, 0]);
  mat4.rotate(rightSmallBladeMatrix, rightSmallBladeMatrix, -0.4, [0, 0, 1]);
  mat4.rotate(
    rightSmallBladeMatrix,
    rightSmallBladeMatrix,
    smallBladeAngle,
    [0, 0, 1]
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelMatrix,
    false,
    rightSmallBladeMatrix
  );
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
