attribute vec4 random;

attribute vec3 direction;
uniform float directionSolidAngle;

uniform float pixelRatio;

uniform float elapsed;

uniform float emissionSpacing;

uniform float motionDuration;
uniform float motionDurationRandom;

uniform float motionSpeed;
uniform float motionSpeedRandom;

uniform vec3 gravityVector;

uniform float startSize;
uniform float endSize;
uniform float sizeLengthRandom;

varying float vRandom;
varying float vRatio;

void main() {

    gl_PointSize = 0.0;
    vRandom = random.w;
    vRatio = 0.0;

    // 当前点的索引值
    float index = float(gl_VertexID);

    // 开始发射时间
    float emissionTime = (index + 1.0) * emissionSpacing;

    // MTD = motion total duration - 运动的总时长
    float MTD = elapsed - emissionTime;

    if(MTD > 0.0) {

        // FMD = final motion duration - 最终运动时长
        float FMD = motionDuration - motionDurationRandom * vRandom;

        // 实际存活时长
        float life = mod(MTD, FMD);

        // 最终运动速度
        float finalMotionSpeed = motionSpeed - motionSpeedRandom * vRandom;

        // 实际移动的空间长度
        float moveLength = life * finalMotionSpeed;

        // 初始运动方向
        vec3 initialDirection = direction * (1.0 - directionSolidAngle);

        // 叠加随机方向
        vec3 randomDirection = random.xyz * directionSolidAngle;

        // 叠加重力方向和速度
        vec3 gravityDirection = gravityVector * life;

        // 最终方向
        vec3 finalDirection = initialDirection + randomDirection + gravityDirection;

        // 已经移动距离
        vec3 moved = finalDirection * moveLength;

        // 摄像机空间的位置
        vec4 mvPosition = modelViewMatrix * vec4(position + moved, 1);

        // 当前时长在整个生命周期的比例
        vRatio = life / FMD;

        // 计算过度尺寸
        float finalEndSize = endSize - sizeLengthRandom * vRandom;
        float finalSize = startSize + vRatio * (finalEndSize - startSize);

        // 根据 z 对像素进行缩放
        gl_PointSize = finalSize * (pixelRatio / -mvPosition.z);

        // 最终位置
        gl_Position = projectionMatrix * mvPosition;

    }

}
