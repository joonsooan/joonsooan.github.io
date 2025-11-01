/*--------------------------------------------------------------------------------
19_ConeShading.js

- Viewing a 3D cone with perspective projection and ArcBall control
- Supports two Shading Modes (Geometry Normal): 'FLAT' ('f') and 'SMOOTH' ('s')
- Supports two Rendering Modes (Lighting Model): 'GOURAUD' ('g') and 'PHONG' ('p')
- Arcball controls:
    - 'a' to switch between camera and model rotation modes
    - 'r' to reset arcball
----------------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText } from "./util.js";
import { Shader, readShaderFile } from "./shader.js";
import { Cube } from "./cube.js";
import { Arcball } from "./arcball.js";
import { Cone } from "./cone.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
let shader;
let lampShader;
let textOverlay2;
let textOverlay3;
let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();
let lampModelMatrix = mat4.create();
let arcBallMode = "CAMERA";
let shadingMode = "SMOOTH";
let renderingMode = "GOURAUD";

const cone = new Cone(gl, 32);
const lamp = new Cube(gl);

const cameraPos = vec3.fromValues(0, 0, 3);
const lightPos = vec3.fromValues(1.0, 0.7, 1.0);
const lightSize = vec3.fromValues(0.1, 0.1, 0.1);

const arcball = new Arcball(canvas, 5.0, { rotation: 2.0, zoom: 0.0005 });

document.addEventListener("DOMContentLoaded", () => {
  if (isInitialized) {
    console.log("Already initialized");
    return;
  }

  main()
    .then((success) => {
      if (!success) {
        console.log("program terminated");
        return;
      }
      isInitialized = true;
      cone.copyVertexNormalsToNormals();
      cone.updateNormals();
      render();
    })
    .catch((error) => {
      console.error("program terminated with error:", error);
    });
});

function updateOverlayText() {
  updateText(textOverlay2, `arcball Mode: ${arcBallMode}`);
  updateText(textOverlay3, `shading mode: ${shadingMode} (${renderingMode})`);
}

function setupKeyboardEvents() {
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key === "a") {
      arcBallMode = arcBallMode === "CAMERA" ? "MODEL" : "CAMERA";
    } else if (key === "r") {
      arcball.reset();
      mat4.identity(modelMatrix);
      arcBallMode = "CAMERA";
    } else if (key === "s") {
      cone.copyVertexNormalsToNormals();
      cone.updateNormals();
      shadingMode = "SMOOTH";
    } else if (key === "f") {
      cone.copyFaceNormalsToNormals();
      cone.updateNormals();
      shadingMode = "FLAT";
    } else if (key === "g") {
      renderingMode = "GOURAUD";
      shader.use();
      shader.setInt("u_renderingMode", 0);
    } else if (key === "p") {
      renderingMode = "PHONG";
      shader.use();
      shader.setInt("u_renderingMode", 1);
    } else {
      return;
    }

    updateOverlayText();
  });
}

function initWebGL() {
  if (!gl) {
    console.error("WebGL 2 is not supported by your browser.");
    return false;
  }

  canvas.width = 700;
  canvas.height = 700;
  resizeAspectRatio(gl, canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1, 0.1, 0.1, 1.0);

  return true;
}

async function initShader() {
  const vertexShaderSource = await readShaderFile("shVert.glsl");
  const fragmentShaderSource = await readShaderFile("shFrag.glsl");
  shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function initLampShader() {
  const vertexShaderSource = await readShaderFile("shLampVert.glsl");
  const fragmentShaderSource = await readShaderFile("shLampFrag.glsl");
  lampShader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  if (arcBallMode === "CAMERA") {
    viewMatrix = arcball.getViewMatrix();
  } else {
    modelMatrix = arcball.getModelRotMatrix();
    viewMatrix = arcball.getViewCamDistanceMatrix();
  }

  shader.use();
  shader.setMat4("u_model", modelMatrix);
  shader.setMat4("u_view", viewMatrix);
  shader.setVec3("u_viewPos", cameraPos);

  shader.setInt("u_renderingMode", renderingMode === "PHONG" ? 1 : 0);

  cone.draw(shader);

  lampShader.use();
  lampShader.setMat4("u_view", viewMatrix);
  lamp.draw(lampShader);

  requestAnimationFrame(render);
}

async function main() {
  try {
    if (!initWebGL()) {
      throw new Error("WebGL initialization failed");
    }

    mat4.lookAt(
      viewMatrix,
      cameraPos,
      vec3.fromValues(0, 0, 0), // look at point
      vec3.fromValues(0, 1, 0) // up vector
    );

    // Projection transformation matrix
    mat4.perspective(
      projMatrix,
      glMatrix.toRadian(60), // field of view (fov, degree)
      canvas.width / canvas.height, // aspect ratio
      0.1, // near
      100.0 // far
    );

    await initShader();
    await initLampShader();

    shader.use();
    shader.setMat4("u_projection", projMatrix);

    shader.setVec3("material.diffuse", vec3.fromValues(1.0, 0.5, 0.31));
    shader.setVec3("material.specular", vec3.fromValues(0.5, 0.5, 0.5));
    shader.setFloat("material.shininess", 32.0);

    shader.setVec3("light.position", lightPos);
    shader.setVec3("light.ambient", vec3.fromValues(0.2, 0.2, 0.2));
    shader.setVec3("light.diffuse", vec3.fromValues(0.7, 0.7, 0.7));
    shader.setVec3("light.specular", vec3.fromValues(1.0, 1.0, 1.0));
    shader.setVec3("u_viewPos", cameraPos);

    shader.setInt("u_renderingMode", 0);

    lampShader.use();
    lampShader.setMat4("u_projection", projMatrix);
    mat4.translate(lampModelMatrix, lampModelMatrix, lightPos);
    mat4.scale(lampModelMatrix, lampModelMatrix, lightSize);
    lampShader.setMat4("u_model", lampModelMatrix);

    setupText(canvas, "Cone With Lighting", 1);
    textOverlay2 = setupText(canvas, `arcball mode: ${arcBallMode}`, 2);
    textOverlay3 = setupText(
      canvas,
      `shading mode: ${shadingMode} (${renderingMode})`,
      3
    );
    setupText(canvas, "press 'a' to change arcball mode", 4);
    setupText(canvas, "press 'r' to reset arcball", 5);
    setupText(canvas, "press 's' to switch to smooth shading", 6);
    setupText(canvas, "press 'f' to switch to flat shading", 7);
    setupText(canvas, "press 'g' to switch to Gouraud shading", 8);
    setupText(canvas, "press 'p' to switch to Phong shading", 9);

    setupKeyboardEvents();

    return true;
  } catch (error) {
    console.error("Failed to initialize program:", error);
    return false;
  }
}
