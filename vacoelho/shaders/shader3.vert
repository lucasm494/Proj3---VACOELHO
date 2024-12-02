#version 300 es

precision mediump float;

in vec3 a_position;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(a_position, 1.0);
}
