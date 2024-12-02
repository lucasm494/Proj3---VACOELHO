#version 300 es
precision mediump float;
precision highp int;

const int MAX_LIGHTS = 8;
in vec3 frag_normal;       // Normal from the vertex shader
in vec3 frag_position;     // Position from the vertex shader
in vec3 fViewer;
in vec3 fLight;
in mat4 m_view;
in mat4 m_view_n;

// Light struct as defined by the user
struct LightInfo {
    vec4 pos;      // Position of the light (vec4)
    vec3 Ia;       // Ambient color (vec3)
    vec3 Id;       // Diffuse color (vec3)
    vec3 Is;       // Specular color (vec3)
};

uniform LightInfo u_light[MAX_LIGHTS];

out vec4 fragColor;        // Output color



// Material struct as defined by the user
struct MaterialInfo {
    vec3 Ka;       // Ambient reflectivity (vec3)
    vec3 Kd;       // Diffuse reflectivity (vec3)
    vec3 Ks;       // Specular reflectivity (vec3)
    float shininess; // Shininess exponent (float)
};

// Uniforms
uniform int u_n_lights;            // Number of lights
uniform MaterialInfo u_material;   // Material properties

void main() {

  
    vec3 L = normalize(fLight);      // Direction from the fragment to the light source
    vec3 V = normalize(fViewer);     // Direction from the fragment to the camera
    vec3 N = normalize(frag_normal); // Normalize the incoming normal vector
    vec3 H = normalize(L + V);      // Halfway vector for specular lighting

    vec3 ambientTotal = vec3(0.0);
    vec3 diffuseTotal = vec3(0.0);
    vec3 specularTotal = vec3(0.0);

    // Loop through all lights and apply the lighting model
    for (int i = 0; i < u_n_lights; i++) {
        // Accumulate ambient, diffuse, and specular components
        ambientTotal += u_material.Ka * u_light[i].Ia;
        diffuseTotal += u_material.Kd * u_light[i].Id * max(dot(L,N), 0.0);
        vec3 specular = u_material.Ks * u_light[i].Is * pow(max(dot(N, H), 0.0), u_material.shininess);
        if( dot(L,N) < 0.0 ) {
            specular = vec3(0.0, 0.0, 0.0);
        } 
        specularTotal += specular;
    }

    // Debugging: Use different channels for ambient, diffuse, and specular
    // We can output these components to debug
    //fragColor = vec4(ambientTotal, 1.0); // Debug the ambient component only
    // fragColor = vec4(diffuseTotal, 1.0); // Uncomment this to debug the diffuse component
    // fragColor = vec4(specularTotal, 1.0); // Uncomment this to debug the specular component

    // If everything seems okay, output the full color as usual
    fragColor = vec4(ambientTotal + diffuseTotal + specularTotal, 1.0);
}
