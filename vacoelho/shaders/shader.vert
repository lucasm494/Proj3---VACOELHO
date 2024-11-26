#version 300 es

const int MAX_LIGHTS = 8;

struct LightInfo {
    vec4 pos;
    vec3 Ia; // Ambient light intensity
    vec3 Id; // Diffuse light intensity
    vec3 Is; // Specular light intensity
};

struct MaterialInfo {
    vec3 Ka; // Ambient reflection coefficient
    vec3 Kd; // Diffuse reflection coefficient
    vec3 Ks; // Specular reflection coefficient
    float shininess; // Shininess factor for specular highlights
};

uniform int u_n_lights; // Number of lights in the scene
uniform LightInfo u_light; // Array of lights
uniform MaterialInfo u_material; // Material properties

in vec4 a_position; // Vertex position
in vec4 a_normal; // Vertex normal

uniform mat4 u_model_view; // Model-view transformation matrix
uniform mat4 u_normals; // Normal transformation matrix
uniform mat4 u_projection; // Projection matrix

out vec4 fColor; // Fragment color output

void main() {
    // Transform the position and normal to camera space
    vec3 posC = (u_model_view * a_position).xyz;
    vec3 N = normalize((u_normals * a_normal).xyz); // Transform normal to camera space

    // Initialize the color components
    vec3 ambientColor = vec3(0.0f);
    vec3 diffuseColor = vec3(0.0);
    vec3 specularColor = vec3(0.0);

    // Loop over all light sources
    for (int i = 0; i < u_n_lights; i++) {
        // Calculate light direction
        vec3 L;
        if (u_light.pos.w == 0.0) {
            L = normalize((u_normals * u_light.pos).xyz); // Directional light
        } else {
            L = normalize((u_model_view * u_light.pos).xyz - posC); // Point light
        }

        // Calculate view direction (camera is at (0, 0, 1) in camera space)
        vec3 V = normalize(vec3(0.0, 0.0, 1.0));

        // Calculate the half-vector between light direction and view direction
        vec3 H = normalize(L + V);

        // Calculate diffuse light component
        float diffuseFactor = max(dot(L, N), 0.0);
        vec3 diffuse = diffuseFactor * u_light.Id * u_material.Kd;

        // Calculate specular light component
        float specularFactor = pow(max(dot(N, H), 0.0), u_material.shininess);
        vec3 specular = specularFactor * u_light.Is * u_material.Ks;

        // Accumulate the contributions from each light source
        ambientColor = u_light.Ia * u_material.Ka;
        diffuseColor = diffuse;
        specularColor = specular;
    }

    // Final color calculation (sum of all components)
    vec3 finalColor = ambientColor + diffuseColor + specularColor;

    // Set the final color to be rendered
    fColor = vec4(finalColor, 1.0);

    // Set the final position of the vertex
    gl_Position = u_projection * u_model_view * a_position;
}
