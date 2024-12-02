#version 300 es
precision mediump float;
precision highp int;

const int MAX_LIGHTS = 8;

// Inputs from vertex shader
in vec3 frag_normal;        // Normal from the vertex shader
in vec3 frag_position;      // Position from the vertex shader
in vec3 fViewer;            // Viewer direction from vertex shader
in vec3 fLight[MAX_LIGHTS]; // Array of light directions from vertex shader

// Light and Material structs
struct LightInfo {
    vec4 pos;      // Position of the light
    vec3 Ia;       // Ambient color
    vec3 Id;       // Diffuse color
    vec3 Is;       // Specular color
};

struct MaterialInfo {
    vec3 Ka;       // Ambient reflectivity
    vec3 Kd;       // Diffuse reflectivity
    vec3 Ks;       // Specular reflectivity
    float shininess; // Shininess exponent
};

// Uniforms
uniform LightInfo u_light[MAX_LIGHTS];
uniform int u_n_lights;            // Number of lights
uniform MaterialInfo u_material;   // Material properties

out vec4 fragColor; // Output color

void main() {

    vec3 N = normalize(frag_normal);  // Normalized normal vector
    vec3 V = normalize(fViewer);      // Normalized viewer direction

    // Initialize total lighting components
    vec3 ambientTotal = vec3(0.0);
    vec3 diffuseTotal = vec3(0.0);
    vec3 specularTotal = vec3(0.0);

    // Loop through all lights
    for (int i = 0; i < u_n_lights; i++) {
        vec3 L = normalize(fLight[i]);     // Light direction
        vec3 H = normalize(L + V);         // Halfway vector

        // Ambient component
        ambientTotal += u_material.Ka * u_light[i].Ia;

        // Diffuse component
        float NdotL = max(dot(L, N), 0.0);
        diffuseTotal += u_material.Kd * u_light[i].Id * NdotL;

        // Specular component
        float NdotH = max(dot(N, H), 0.0);
        vec3 specular = vec3(0.0,0.0,0.0); // Default to black if light is behind the surface
        if (NdotL >= 0.0) {         // Specular only when light is in front
            specular = u_material.Ks * u_light[i].Is * pow(NdotH, u_material.shininess);
        }
        specularTotal += specular;
    }

    // Combine all components and output final color
    vec3 finalColor = ambientTotal + diffuseTotal + specularTotal;
    fragColor = vec4(finalColor, 1.0);
}
