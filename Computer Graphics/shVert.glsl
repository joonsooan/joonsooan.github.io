attribute vec2 a_position;
uniform mat4 u_modelMatrix;

void main() {
  gl_Position = u_modelMatrix * vec4(a_position, 0.0, 1.0);
}