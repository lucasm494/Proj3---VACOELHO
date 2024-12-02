#version 300 es
precision mediump float;
precision highp int;

in vec4 a_position;  // Vertex position
in vec3 a_normal;    // Vertex normal

const int MAX_LIGHTS = 8;
struct LightInfo {
    vec4 pos;      // Position of the light (vec4)
    vec3 Ia;       // Ambient color (vec3)
    vec3 Id;       // Diffuse color (vec3)
    vec3 Is;       // Specular color (vec3)
};

uniform LightInfo u_light[MAX_LIGHTS];
uniform int u_n_lights;          // Number of lights

uniform mat4 u_model_view;       // Model-view matrix
uniform mat4 u_normals;          // Normal matrix (transpose(inverse(modelViewMatrix)))
uniform mat4 u_view;
uniform mat4 u_view_normals;
uniform mat4 u_projection;       // Projection matrix

out vec3 frag_normal;            // Normal for the fragment shader
out vec3 frag_position;          // Position for the fragment shader
out vec3 fViewer;                // Viewer direction for the fragment shader
out vec3 fLight[MAX_LIGHTS];     // Light directions for the fragment shader

void main() {
    // Transform the vertex position into camera space
    frag_position = (u_model_view * a_position).xyz;

    // Pass the normal to the fragment shader
    frag_normal = (u_normals * vec4(a_normal,0.0)).xyz;

    // Compute the light direction for each light
    for (int i = 0; i < u_n_lights; i++) {
        if (u_light[i].pos.w == 0.0) {
            // Directional light
            fLight[i] = normalize((u_view_normals * u_light[i].pos).xyz);
        } else {
            // Point light
            fLight[i] = normalize((u_view * u_light[i].pos).xyz - frag_position);
        }
    }

    // Compute the view vector
    // fViewer = -frag_position; // Perspective projection
    fViewer = vec3(0,0,1); // Parallel projection only 

    // Calculate the final position in clip space
    gl_Position = u_projection * vec4(frag_position, 1.0);
}