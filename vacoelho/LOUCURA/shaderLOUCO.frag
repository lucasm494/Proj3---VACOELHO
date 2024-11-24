#version 300 es

precision mediump float;

uniform bool u_use_normals;
in vec4 fColor;

out vec4 color;

void main() {
    color = fColor;
}
