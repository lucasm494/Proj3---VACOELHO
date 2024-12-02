#version 300 es
precision mediump float;
precision highp int;

in vec3 a_position;         // Vertex position
in vec3 a_normal;           // Vertex normal

const int MAX_LIGHTS = 8;
// Light struct as defined by the user
struct LightInfo {
    vec4 pos;      // Position of the light (vec4)
    vec3 Ia;       // Ambient color (vec3)
    vec3 Id;       // Diffuse color (vec3)
    vec3 Is;       // Specular color (vec3)
};

uniform LightInfo u_light[MAX_LIGHTS];
uniform int u_n_lights;            // Number of lights

out vec3 frag_normal;       // Normal for the fragment shader
out vec3 frag_position;     // Position for the fragment shader
//out vec3 fLight;
out vec3 fViewer;
out mat4 m_view;
out mat4 m_view_n;
out vec3 fLight;

uniform mat4 u_view;
uniform mat4 u_view_normals;
uniform mat4 u_model_view;  // Model-view matrix
uniform mat4 u_projection; // Projection matrix
uniform mat4 u_normals;     // Normal matrix (transpose(inverse(modelViewMatrix)))

void main() {


    // Transform the vertex position into camera space
    frag_position = (u_model_view * vec4(a_position, 1.0)).xyz;
    
    for (int i = 0; i < u_n_lights; i++) {
    // compute light vector in camera frame
        if(u_light[i].pos.w == 0.0)
            fLight = normalize((u_view_normals * u_light[i].pos).xyz);
        else
            fLight = normalize((u_view*u_light[i].pos).xyz - frag_position); 
    }

    m_view = u_view;
    m_view_n = u_view_normals;

    fViewer = vec3(0,0,1);

    // Pass the normal to the fragment shader
    frag_normal = (u_normals * vec4(a_normal,1.0)).xyz;
    
    // Calculate the final position in clip space
    gl_Position = u_projection * vec4(frag_position, 1.0);
}
