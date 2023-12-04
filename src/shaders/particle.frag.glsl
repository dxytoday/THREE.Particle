uniform float opacity;

uniform float elapsed;

uniform sampler2D map;
uniform bool useMap;

uniform float startOpacity;
uniform float endOpacity;
uniform float opacityLengthRandom;

uniform float rotationSpeed;
uniform float rotationSpeedRandom;

uniform vec3 startColor;
uniform vec3 endColor;

varying float vRandom;
varying float vRatio;

void main() {

    if(vRatio <= 0.0) {

        discard; // 不在生命周期内，丢弃片段

    }

    // 计算过度颜色
    vec3 finalColor = startColor + vRatio * (endColor - startColor);

    // 计算过度透明度
    float finalEndOpacity = endOpacity - opacityLengthRandom * vRandom;
    float finalOpacity = startOpacity + vRatio * (finalEndOpacity - startOpacity);

    if(useMap) {

        vec3 uv = vec3(gl_PointCoord, 1);

        // 计算旋转角度
        float finalRotationSpeed = rotationSpeed - rotationSpeedRandom * vRandom;
        float rotatedRadian = finalRotationSpeed * elapsed;

        // 执行旋转
        float c = cos(rotatedRadian);
        float s = sin(rotatedRadian);
        mat3 rotateMat = mat3(c, s, 0, -s, c, 0, (1.0 - (c - s)) * 0.5, (1.0 - (c + s)) * 0.5, 1);
        uv = rotateMat * uv;

        // 读取文素
        vec4 texel = texture2D(map, uv.xy);

        finalColor *= texel.rgb;
        finalOpacity *= texel.a;

    }

    gl_FragColor = vec4(finalColor, opacity * finalOpacity);

}
