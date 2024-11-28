#version 300 es

in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_projection;
uniform mat4 u_model_view;   // Model-view matrix (camera space)
uniform mat4 u_normals;      // Normal transformation matrix (camera space)
uniform mat4 u_model;        // Model matrix (object space)
uniform mat4 u_view;
uniform mat4 u_view_normals;

const int MAX_LIGHTS = 8;
struct LightInfo {
    vec4 pos;  // Light position or direction
    vec3 Ia;   // Ambient intensity
    vec3 Id;   // Diffuse intensity
    vec3 Is;   // Specular intensity
    int type;  // 0 - world space, 1 - camera space, 2 - object space
};

struct MaterialInfo {
    vec3 Ka;       // Ambient reflectivity
    vec3 Kd;       // Diffuse reflectivity
    vec3 Ks;       // Specular reflectivity
    float shininess; // Shininess factor
};

uniform int u_n_lights;                // Number of active lights
uniform LightInfo u_light[MAX_LIGHTS]; // Array of lights
uniform MaterialInfo u_material;       // Material properties of the object

out vec4 fColor;

void main() {
    vec3 accumulatedAmbient = vec3(0.0);
    vec3 accumulatedDiffuse = vec3(0.0);
    vec3 accumulatedSpecular = vec3(0.0);

    vec3 posC = (u_model_view * a_position).xyz; // Vertex position in camera space
    vec3 N = normalize((u_normals * vec4(a_normal, 0.0)).xyz); // Normal in camera space
    vec3 V = normalize(-posC); // View direction (from camera to fragment)
    
    // Loop through all lights
    for (int i = 0; i < u_n_lights; i++) {
        vec3 ambientColor = u_light[i].Ia * u_material.Ka;

        vec3 L; // Light direction vector
        if(u_light[i].pos.w == 0.0)
             L = normalize((u_light[i].pos).xyz);
        else
            L = normalize((u_light[i].pos).xyz - posC);

        // Diffuse and specular shading
        float diffuseFactor = max(dot(L, N), 0.0);
        vec3 diffuseColor = diffuseFactor * (u_light[i].Id * u_material.Kd);

        
        vec3 H = normalize(L + V); // Halfway vector
        float specularFactor = pow(max(dot(N, H), 0.0), u_material.shininess);
        vec3 specularColor = specularFactor * (u_light[i].Is * u_material.Ks);
    
        // Accumulate contributions from this light
        accumulatedAmbient += ambientColor;
        accumulatedDiffuse += diffuseColor;
        accumulatedSpecular += specularColor;
    }
    
    // Final color computation
    vec3 finalColor = accumulatedAmbient + accumulatedDiffuse + accumulatedSpecular;

    gl_Position = u_projection * u_model_view * a_position;
    fColor = vec4(finalColor, 1.0);

}
