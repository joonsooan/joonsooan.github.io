#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec4 a_color;
layout(location = 3) in vec2 a_texCoord;

// Outputs for Gouraud shading
out vec3 lightingColor;

// Outputs for Phong shading (interpolated in fragment shader)
out vec3 fragPos;
out vec3 normal;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

struct Material {
    vec3 diffuse;
    vec3 specular;
    float shininess;
};

struct Light {
    vec3 position;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;

void main() {
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);

    // Common calculations
    fragPos = vec3(u_model * vec4(a_position, 1.0));
    normal = mat3(transpose(inverse(u_model))) * a_normal;
    
    // 이 normal, fragPos는 Phong Shading을 위해 프래그먼트 쉐이더로 전달됩니다.

    // --- Gouraud Shading Calculation (lightingColor에 결과 저장) ---
    // Gouraud Shading을 위해 정점 쉐이더에서 라이팅을 계산합니다.
    
    // ambient
    vec3 rgb = material.diffuse;
    vec3 ambient = light.ambient * rgb;

    // diffuse
    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(light.position - fragPos);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);
    vec3 diffuse = light.diffuse * diff * rgb;  

    // specular
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = 0.0;
    if (dotNormLight > 0.0) {
        spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    }
    vec3 specular = light.specular * spec * material.specular;  

    // ambient + diffuse + specular
    lightingColor = ambient + diffuse + specular;
} 
