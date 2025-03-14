#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 fragColor;

void main() {
    fragColor = vec4(uColor, 1.0); // Render the miniSphere with the specified color
}
