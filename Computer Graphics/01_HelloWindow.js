// Global constants
const canvas = document.getElementById('glCanvas'); // html 파일의 캔버스를 가져옴
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
  console.error('WebGL 2 is not supported by your browser.');
}

canvas.width = 500;
canvas.height = 500;

gl.enable(gl.SCISSOR_TEST);

// Render loop
function render() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.scissor(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.viewport(0, canvas.height / 2, canvas.width / 2, canvas.height / 2);
  gl.scissor(0, canvas.height / 2, canvas.width / 2, canvas.height / 2);
  gl.clearColor(0, 1, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.viewport(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2,
    canvas.height / 2
  );
  gl.scissor(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2,
    canvas.height / 2
  );
  gl.clearColor(1, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.viewport(0, 0, canvas.width / 2, canvas.height / 2);
  gl.scissor(0, 0, canvas.width / 2, canvas.height / 2);
  gl.clearColor(0, 0, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height / 2);
  gl.scissor(canvas.width / 2, 0, canvas.width / 2, canvas.height / 2);
  gl.clearColor(1, 1, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

render();

// Resize viewport when window size changes
window.addEventListener('resize', () => {
  const size = Math.min(window.innerWidth, window.innerHeight);
  canvas.width = size;
  canvas.height = size;
  render();
});
