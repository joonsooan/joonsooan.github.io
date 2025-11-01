#version 300 es

precision highp float;

// Input from Gouraud shading
in vec3 lightingColor;

// Inputs for Phong shading (interpolated)
in vec3 fragPos;
in vec3 normal;

out vec4 FragColor;

uniform int u_renderingMode; // 0: GOURAUD, 1: PHONG
uniform vec3 u_viewPos;

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


// Phong shading function (fragment-level lighting calculation)
vec3 calculatePhong() {
    // ambient
    vec3 rgb = material.diffuse;
    vec3 ambient = light.ambient * rgb;

    // diffuse
    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(light.position - fragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = light.diffuse * diff * rgb;  

    // specular
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    vec3 specular = light.specular * spec * material.specular;  

    return ambient + diffuse + specular;
}

void main() {
    if (u_renderingMode == 0) {
        // Gouraud Shading: use pre-calculated vertex lighting (interpolated)
        FragColor = vec4(lightingColor, 1.0);
    } else {
        // Phong Shading: calculate lighting per fragment
        FragColor = vec4(calculatePhong(), 1.0);
    }
}
