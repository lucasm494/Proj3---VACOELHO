#version 300 es
precision mediump float;

in vec3 frag_normal;       // Normal from the vertex shader
in vec3 frag_position;     // Position from the vertex shader
in vec3 fViewer;
in mat4 m_view;
in mat4 m_view_n;

out vec4 fragColor;        // Output color

// Light struct as defined by the user
struct LightInfo {
    vec4 pos;      // Position of the light (vec4)
    vec3 Ia;       // Ambient color (vec3)
    vec3 Id;       // Diffuse color (vec3)
    vec3 Is;       // Specular color (vec3)
};

// Material struct as defined by the user
struct MaterialInfo {
    vec3 Ka;       // Ambient reflectivity (vec3)
    vec3 Kd;       // Diffuse reflectivity (vec3)
    vec3 Ks;       // Specular reflectivity (vec3)
    float shininess; // Shininess exponent (float)
};

// Uniforms
uniform int u_n_lights;            // Number of lights
uniform LightInfo u_light[8];      // Array of LightInfo structs
uniform MaterialInfo u_material;   // Material properties

// Function to calculate the lighting model for a fragment
vec3 calculateLighting(vec3 N, vec3 L, vec3 V, vec3 H, LightInfo light, MaterialInfo material) {
    vec3 ambient = material.Ka * light.Ia;

    // Calculate diffuse lighting
    float diff = max(dot(L, N), 0.0); 
    vec3 diffuse = material.Kd * light.Id * diff;

    // Calculate specular lighting
    float spec = pow(max(dot(N, H), 0.0), material.shininess);
    vec3 specular = material.Ks * light.Is * spec;

    if (dot(L, N) < 0.0) {
        specular = vec3(0.0, 0.0, 0.0);
    }

    // Combine all components
    return ambient + diffuse + specular;
}

void main() {
    
    vec3 V = normalize(fViewer);     // Direction from the fragment to the camera
    
    
    // Normalize the incoming normal vector
    vec3 N = normalize(frag_normal);

    // Initialize the final color with ambient light (we'll accumulate lighting later)
    vec3 color = vec3(0.93f, 0.0f, 0.0f); // Base color, will be modified by lighting

    vec3 ambientTotal = vec3(0.0);
    vec3 diffuseTotal = vec3(0.0);
    vec3 specularTotal = vec3(0.0);

    vec3 fLight;

    // Loop through all lights and apply the lighting model
    for (int i = 0; i < u_n_lights; i++) {
        if(u_light[i].pos.w == 0.0)
            fLight = normalize((m_view_n * u_light[i].pos).xyz);
        else
            fLight = normalize((m_view*u_light[i].pos).xyz - frag_position); 

        vec3 L = normalize(fLight);      // Direction from the fragment to the light source

        vec3 H = normalize(L + V);      // Halfway vector for specular lighting
        // Calculate lighting from the current light and add it to the totals
        //vec3 lightContribution = calculateLighting(N, L, V, H, u_light[i], u_material);

        // Accumulate ambient, diffuse, and specular components
        ambientTotal += u_material.Ka * u_light[i].Ia;
        diffuseTotal += u_material.Kd * u_light[i].Id * max(dot(N, L), 0.0);
        specularTotal += u_material.Ks * u_light[i].Is * pow(max(dot(N, H), 0.0), u_material.shininess);
    }

    // Debugging: Use different channels for ambient, diffuse, and specular
    // We can output these components to debug
    //fragColor = vec4(ambientTotal, 1.0); // Debug the ambient component only
    // fragColor = vec4(diffuseTotal, 1.0); // Uncomment this to debug the diffuse component
    // fragColor = vec4(specularTotal, 1.0); // Uncomment this to debug the specular component

    // If everything seems okay, output the full color as usual
    fragColor = vec4(ambientTotal + diffuseTotal + specularTotal, 1.0);
}
