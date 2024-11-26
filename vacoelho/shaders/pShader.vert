#version 300 es

in vec3 a_position;         // Vertex position
in vec3 a_normal;           // Vertex normal
in vec4 lightPosition;

out vec3 frag_normal;       // Normal for the fragment shader
out vec3 frag_position;     // Position for the fragment shader
//out vec3 fLight;
out vec3 fViewer;
out mat4 m_view;
out mat4 m_view_n;

uniform mat4 u_view;
uniform mat4 u_view_normals;
uniform mat4 u_model_view;  // Model-view matrix
uniform mat4 u_projection; // Projection matrix
uniform mat4 u_normals;     // Normal matrix (transpose(inverse(modelViewMatrix)))

void main() {

    // Transform the vertex position into camera space
    frag_position = (u_model_view * vec4(a_position, 1.0)).xyz;
    
    /*
    // compute light vector in camera frame
    if(lightPosition.w == 0.0)
        fLight = normalize((u_view_normals * lightPosition).xyz);
    else
        fLight = normalize((u_view*lightPosition).xyz - frag_position); 
    */
    m_view = u_view;
    m_view_n = u_view_normals;

    fViewer = vec3(0,0,1);

    // Pass the normal to the fragment shader
    frag_normal = (u_normals * vec4(a_normal,1.0)).xyz;
    
    // Calculate the final position in clip space
    gl_Position = u_projection * vec4(frag_position, 1.0);
}
