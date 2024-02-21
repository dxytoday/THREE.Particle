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

uniform bool srgbColorSpace;

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

    // 理论上 if 里的代码需要始终执行
    if(srgbColorSpace) {

        // Linear sRGB 转换到 sRGB
        // THREE.Color 内部默认会将颜色值从 sRGB 转换为 Linear sRGB
        // sRGB 更符合人眼视觉，Linear sRGB 更适合做数学计算

        vec3 greater = pow(gl_FragColor.rgb, vec3(0.41666)) * 1.055 - vec3(0.055);
        vec3 lessAndEqual = gl_FragColor.rgb * 12.92;
        vec3 flag = vec3(lessThanEqual(gl_FragColor.rgb, vec3(0.0031308)));

        gl_FragColor.rgb = mix(greater, lessAndEqual, flag);

    }

}
