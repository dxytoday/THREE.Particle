import * as THREE from 'three';

class ParticleGeometry extends THREE.BufferGeometry {
    isParticleGeometry = true;
    motionDirection = new THREE.Vector3(0, 1, 0);
    updateRecords = new Map();
    generateAttributes(count) {
        if (this.index) {
            if (this.index.count === count) {
                return;
            }
            this.dispose();
        }
        if (count <= 0) {
            return;
        }
        const indices = [];
        const vertices = [];
        const directions = [];
        const randoms = [];
        const v4 = new THREE.Vector4();
        for (let ii = 0; ii < count; ii++) {
            indices.push(ii);
            vertices.push(0, 0, 0);
            this.motionDirection.toArray(directions, ii * 3);
            v4.set(Math.random(), Math.random(), Math.random(), 0);
            v4.multiplyScalar(2).subScalar(1);
            v4.setW(0).normalize().setW(Math.random());
            v4.toArray(randoms, ii * 4);
        }
        this.setIndex(indices);
        this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.setAttribute('direction', new THREE.Float32BufferAttribute(directions, 3));
        this.setAttribute('random', new THREE.Float32BufferAttribute(randoms, 4));
        this.updateRecords.clear();
    }
    resetAttributes() {
        if (!this.index) {
            return;
        }
        const posAttr = this.getAttribute('position');
        const direAttr = this.getAttribute('direction');
        const v3 = new THREE.Vector3(0, 0, 0);
        const number = this.index.count;
        for (let ii = 0; ii < number; ii++) {
            v3.toArray(posAttr.array, ii * 3);
            this.motionDirection.toArray(direAttr.array, ii * 3);
        }
        posAttr.needsUpdate = true;
        direAttr.needsUpdate = true;
        this.updateRecords.clear();
    }
    updateAttributes(particle) {
        if (!this.index) {
            return false;
        }
        const matrix = particle.modelMatrix.clone();
        const position = new THREE.Vector3();
        position.setFromMatrixPosition(matrix);
        const direction = new THREE.Vector4(this.motionDirection.x, this.motionDirection.y, this.motionDirection.z, 0);
        direction.applyMatrix4(matrix);
        const posAttr = this.getAttribute('position');
        const dirAttr = this.getAttribute('direction');
        const ranAttr = this.getAttribute('random');
        const material = particle.material;
        const elapsed = material.elapsed;
        const motionDuration = material.motionDuration;
        const motionDurationRandom = material.uniforms.motionDurationRandom.value;
        const emissionSpacing = material.uniforms.emissionSpacing.value;
        let start = Infinity, end = -Infinity;
        for (const index of this.index.array) {
            const MTD = Math.max(elapsed - (index + 1) * emissionSpacing, 0);
            const FMD = motionDuration - motionDurationRandom * ranAttr.getW(index);
            const order = Math.trunc(MTD / FMD);
            if (this.updateRecords.get(index) === order) {
                continue;
            }
            this.updateRecords.set(index, order);
            position.toArray(posAttr.array, index * 3);
            direction.toArray(dirAttr.array, index * 3);
            start = Math.min(start, index);
            end = Math.max(end, index + 1);
        }
        if (start !== Infinity && end !== -Infinity) {
            let offset = start * 3;
            let count = (end - start) * 3;
            posAttr.updateRange.offset = offset;
            posAttr.updateRange.count = count;
            posAttr.needsUpdate = true;
            dirAttr.updateRange.offset = offset;
            dirAttr.updateRange.count = count;
            dirAttr.needsUpdate = true;
            return true;
        }
        return false;
    }
    dispose() {
        super.dispose();
        this.index = null;
        this.deleteAttribute('position');
        this.deleteAttribute('direction');
        this.deleteAttribute('random');
    }
}

var vertexShader = "attribute vec4 random;\r\n\r\nattribute vec3 direction;\r\nuniform float directionSolidAngle;\r\n\r\nuniform float pixelRatio;\r\n\r\nuniform float elapsed;\r\n\r\nuniform float emissionSpacing;\r\n\r\nuniform float motionDuration;\r\nuniform float motionDurationRandom;\r\n\r\nuniform float motionSpeed;\r\nuniform float motionSpeedRandom;\r\n\r\nuniform vec3 gravityVector;\r\n\r\nuniform float startSize;\r\nuniform float endSize;\r\nuniform float sizeLengthRandom;\r\n\r\nvarying float vRandom;\r\nvarying float vRatio;\r\n\r\nvoid main() {\r\n\r\n    gl_PointSize = 0.0;\r\n    vRandom = random.w;\r\n    vRatio = 0.0;\r\n\r\n    // 当前点的索引值\r\n    float index = float(gl_VertexID);\r\n\r\n    // 开始发射时间\r\n    float emissionTime = (index + 1.0) * emissionSpacing;\r\n\r\n    // MTD = motion total duration - 运动的总时长\r\n    float MTD = elapsed - emissionTime;\r\n\r\n    if(MTD > 0.0) {\r\n\r\n        // FMD = final motion duration - 最终运动时长\r\n        float FMD = motionDuration - motionDurationRandom * vRandom;\r\n\r\n        // 实际存活时长\r\n        float life = mod(MTD, FMD);\r\n\r\n        // 最终运动速度\r\n        float finalMotionSpeed = motionSpeed - motionSpeedRandom * vRandom;\r\n\r\n        // 实际移动的空间长度\r\n        float moveLength = life * finalMotionSpeed;\r\n\r\n        // 初始运动方向\r\n        vec3 initialDirection = direction * (1.0 - directionSolidAngle);\r\n\r\n        // 叠加随机方向\r\n        vec3 randomDirection = random.xyz * directionSolidAngle;\r\n\r\n        // 叠加重力方向和速度\r\n        vec3 gravityDirection = gravityVector * life;\r\n\r\n        // 最终方向\r\n        vec3 finalDirection = initialDirection + randomDirection + gravityDirection;\r\n\r\n        // 已经移动距离\r\n        vec3 moved = finalDirection * moveLength;\r\n\r\n        // 摄像机空间的位置\r\n        vec4 mvPosition = modelViewMatrix * vec4(position + moved, 1);\r\n\r\n        // 当前时长在整个生命周期的比例\r\n        vRatio = life / FMD;\r\n\r\n        // 计算过度尺寸\r\n        float finalEndSize = endSize - sizeLengthRandom * vRandom;\r\n        float finalSize = startSize + vRatio * (finalEndSize - startSize);\r\n\r\n        // 根据 z 对像素进行缩放\r\n        gl_PointSize = finalSize * (pixelRatio / -mvPosition.z);\r\n\r\n        // 最终位置\r\n        gl_Position = projectionMatrix * mvPosition;\r\n\r\n    }\r\n\r\n}\r\n";

var fragmentShader = "uniform float opacity;\r\n\r\nuniform float elapsed;\r\n\r\nuniform sampler2D map;\r\nuniform bool useMap;\r\n\r\nuniform float startOpacity;\r\nuniform float endOpacity;\r\nuniform float opacityLengthRandom;\r\n\r\nuniform float rotationSpeed;\r\nuniform float rotationSpeedRandom;\r\n\r\nuniform vec3 startColor;\r\nuniform vec3 endColor;\r\n\r\nvarying float vRandom;\r\nvarying float vRatio;\r\n\r\nvoid main() {\r\n\r\n    if(vRatio <= 0.0) {\r\n\r\n        discard; // 不在生命周期内，丢弃片段\r\n\r\n    }\r\n\r\n    // 计算过度颜色\r\n    vec3 finalColor = startColor + vRatio * (endColor - startColor);\r\n\r\n    // 计算过度透明度\r\n    float finalEndOpacity = endOpacity - opacityLengthRandom * vRandom;\r\n    float finalOpacity = startOpacity + vRatio * (finalEndOpacity - startOpacity);\r\n\r\n    if(useMap) {\r\n\r\n        vec3 uv = vec3(gl_PointCoord, 1);\r\n\r\n        // 计算旋转角度\r\n        float finalRotationSpeed = rotationSpeed - rotationSpeedRandom * vRandom;\r\n        float rotatedRadian = finalRotationSpeed * elapsed;\r\n\r\n        // 执行旋转\r\n        float c = cos(rotatedRadian);\r\n        float s = sin(rotatedRadian);\r\n        mat3 rotateMat = mat3(c, s, 0, -s, c, 0, (1.0 - (c - s)) * 0.5, (1.0 - (c + s)) * 0.5, 1);\r\n        uv = rotateMat * uv;\r\n\r\n        // 读取文素\r\n        vec4 texel = texture2D(map, uv.xy);\r\n\r\n        finalColor *= texel.rgb;\r\n        finalOpacity *= texel.a;\r\n\r\n    }\r\n\r\n    gl_FragColor = vec4(finalColor, opacity * finalOpacity);\r\n\r\n}\r\n";

class ParticleMaterial extends THREE.ShaderMaterial {
    isParticleMaterial = true;
    get elapsed() {
        return this.uniforms.elapsed.value;
    }
    set elapsed(time) {
        this.uniforms.elapsed.value = time;
    }
    set directionSolidAngle(degree) {
        this.uniforms.directionSolidAngle.value = degree / 360;
    }
    get directionSolidAngle() {
        return this.uniforms.directionSolidAngle.value * 360;
    }
    _emissionTotal = 0;
    set emissionTotal(count) {
        this._emissionTotal = count;
        this.uniforms.emissionSpacing.value = this.emissionDuration / count;
    }
    get emissionTotal() {
        return this._emissionTotal;
    }
    _emissionDuration = 0;
    set emissionDuration(time) {
        this._emissionDuration = time;
        this.uniforms.emissionSpacing.value = time / this.emissionTotal;
    }
    get emissionDuration() {
        return this._emissionDuration;
    }
    set motionSpeed(length) {
        this.uniforms.motionSpeed.value = length;
        this.uniforms.motionSpeedRandom.value = this.motionSpeedRandomRatio * length;
    }
    get motionSpeed() {
        return this.uniforms.motionSpeed.value;
    }
    _motionSpeedRandomRatio = 0;
    set motionSpeedRandomRatio(ratio) {
        this._motionSpeedRandomRatio = ratio;
        this.uniforms.motionSpeedRandom.value = ratio * this.motionSpeed;
    }
    get motionSpeedRandomRatio() {
        return this._motionSpeedRandomRatio;
    }
    set motionDuration(time) {
        this.uniforms.motionDuration.value = time;
        this.uniforms.motionDurationRandom.value = this.motionDurationRandomRatio * time;
    }
    get motionDuration() {
        return this.uniforms.motionDuration.value;
    }
    _motionDurationRandomRatio = 0;
    set motionDurationRandomRatio(ratio) {
        this._motionDurationRandomRatio = ratio;
        this.uniforms.motionDurationRandom.value = ratio * this.motionDuration;
    }
    get motionDurationRandomRatio() {
        return this._motionDurationRandomRatio;
    }
    gravity = 0;
    get map() {
        return this.uniforms.map.value;
    }
    set map(texture) {
        if (this.map === texture) {
            return;
        }
        if (typeof texture === "string") {
            texture = new THREE.TextureLoader().load(texture);
        }
        texture.flipY = false;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        this.uniforms.map.value = texture;
    }
    get useMap() {
        return this.uniforms.useMap.value;
    }
    set useMap(flag) {
        this.uniforms.useMap.value = !!flag;
    }
    get startSize() {
        return this.uniforms.startSize.value;
    }
    set startSize(size) {
        this.uniforms.startSize.value = size;
        this.sizeRandomRatio = this.sizeRandomRatio;
    }
    get endSize() {
        return this.uniforms.endSize.value;
    }
    set endSize(size) {
        this.uniforms.endSize.value = size;
        this.sizeRandomRatio = this.sizeRandomRatio;
    }
    _sizeRandomRatio = 0;
    get sizeRandomRatio() {
        return this._sizeRandomRatio;
    }
    set sizeRandomRatio(ratio) {
        this._sizeRandomRatio = ratio;
        this.uniforms.sizeLengthRandom.value = (this.endSize - this.startSize) * ratio;
    }
    get startOpacity() {
        return this.uniforms.startOpacity.value;
    }
    set startOpacity(opacity) {
        this.uniforms.startOpacity.value = opacity;
        this.opacityRandomRatio = this.opacityRandomRatio;
    }
    get endOpacity() {
        return this.uniforms.endOpacity.value;
    }
    set endOpacity(opacity) {
        this.uniforms.endOpacity.value = opacity;
        this.opacityRandomRatio = this.opacityRandomRatio;
    }
    _opacityRandomRatio = 0;
    get opacityRandomRatio() {
        return this._opacityRandomRatio;
    }
    set opacityRandomRatio(ratio) {
        this._opacityRandomRatio = ratio;
        this.uniforms.opacityLengthRandom.value = (this.endOpacity - this.startOpacity) * ratio;
    }
    get rotationSpeed() {
        return this.uniforms.rotationSpeed.value * THREE.MathUtils.RAD2DEG;
    }
    set rotationSpeed(degree) {
        this.uniforms.rotationSpeed.value = degree * THREE.MathUtils.DEG2RAD;
        this.rotationSpeedRandomRatio = this.rotationSpeedRandomRatio;
    }
    _rotationSpeedRandomRatio = 0;
    get rotationSpeedRandomRatio() {
        return this._rotationSpeedRandomRatio;
    }
    set rotationSpeedRandomRatio(ratio) {
        this._rotationSpeedRandomRatio = ratio;
        this.uniforms.rotationSpeedRandom.value = ratio;
        this.uniforms.rotationSpeedRandom.value *= this.rotationSpeed;
        this.uniforms.rotationSpeedRandom.value *= THREE.MathUtils.DEG2RAD;
    }
    get startColor() {
        return `#${this.uniforms.startColor.value.getHexString()}`;
    }
    set startColor(color) {
        this.uniforms.startColor.value.set(color);
    }
    get endColor() {
        return `#${this.uniforms.endColor.value.getHexString()}`;
    }
    set endColor(color) {
        this.uniforms.endColor.value.set(color);
    }
    constructor() {
        super();
        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;
        this.transparent = true;
        this.blending = THREE.AdditiveBlending;
        this.depthWrite = false;
        this.initUniforms();
    }
    initUniforms() {
        this.uniforms.opacity = { value: this.opacity };
        this.uniforms.elapsed = { value: 0 };
        this.uniforms.pixelRatio = { value: 1 };
        this.uniforms.emissionSpacing = { value: 0 };
        this.uniforms.motionSpeed = { value: 0 };
        this.uniforms.motionSpeedRandom = { value: 0 };
        this.uniforms.motionDuration = { value: 0 };
        this.uniforms.motionDurationRandom = { value: 0 };
        this.uniforms.directionSolidAngle = { value: 0 };
        this.uniforms.gravityVector = { value: new THREE.Vector3() };
        this.uniforms.map = { value: null };
        this.uniforms.useMap = { value: false };
        this.uniforms.startSize = { value: 1 };
        this.uniforms.endSize = { value: 1 };
        this.uniforms.sizeLengthRandom = { value: 0 };
        this.uniforms.startOpacity = { value: 1 };
        this.uniforms.endOpacity = { value: 1 };
        this.uniforms.opacityLengthRandom = { value: 0 };
        this.uniforms.rotationSpeed = { value: 0 };
        this.uniforms.rotationSpeedRandom = { value: 0 };
        this.uniforms.startColor = { value: new THREE.Color() };
        this.uniforms.endColor = { value: new THREE.Color() };
    }
    computePixelRatio(fov, pixelHeight) {
        const halfAngle = THREE.MathUtils.DEG2RAD * fov * 0.5;
        const viewHeight = Math.tan(halfAngle) * 2;
        const pixelRatio = pixelHeight / viewHeight;
        this.uniforms.pixelRatio.value = pixelRatio;
    }
    computeGravityVector(modelMatrix, isIndependent) {
        const gravityVector = this.uniforms.gravityVector.value;
        if (this.gravity === 0) {
            gravityVector.set(0, 0, 0);
            return;
        }
        gravityVector.set(0, -this.gravity, 0);
        if (!isIndependent) {
            const m3 = new THREE.Matrix3();
            m3.setFromMatrix4(modelMatrix).invert();
            gravityVector.applyMatrix3(m3);
        }
    }
}

class Particle extends THREE.Points {
    isParticle = true;
    boundingSphere = null;
    modelMatrix = new THREE.Matrix4();
    clock = new THREE.Clock();
    set count(count) {
        count = Math.trunc(count);
        this.material.emissionTotal = count;
        this.geometry.generateAttributes(count);
    }
    get count() {
        return this.material.emissionTotal;
    }
    _independentMotion = false;
    set independentMotion(flag) {
        if (this._independentMotion == flag) {
            return;
        }
        this._independentMotion = !!flag;
        if (!this._independentMotion) {
            this.geometry.resetAttributes();
        }
        if (this.boundingSphere !== null) {
            this.computeBoundingSphere();
        }
    }
    get independentMotion() {
        return this._independentMotion;
    }
    constructor() {
        super(new ParticleGeometry(), new ParticleMaterial());
        this.registerRenderCallback();
    }
    registerRenderCallback() {
        const scope = this;
        const material = this.material;
        const v2 = new THREE.Vector2();
        let fov;
        let pixelHeight;
        const modelMatrix = new THREE.Matrix4();
        let gravity;
        let isIndependent;
        scope.onBeforeRender = function () {
            const renderer = arguments[0];
            const camera = arguments[2];
            renderer.getSize(v2);
            if (fov !== camera.fov || pixelHeight !== v2.y) {
                fov = camera.fov;
                pixelHeight = v2.y;
                material.computePixelRatio(fov, pixelHeight);
            }
            if (!modelMatrix.equals(scope.modelMatrix) ||
                gravity !== material.gravity ||
                isIndependent !== scope.independentMotion) {
                gravity = material.gravity;
                isIndependent = scope.independentMotion;
                modelMatrix.copy(scope.modelMatrix);
                material.computeGravityVector(modelMatrix, isIndependent);
            }
            this.material.uniforms.opacity.value = this.material.opacity;
        };
    }
    updateMatrixWorld(force) {
        super.updateMatrixWorld(force);
        this.modelMatrix.copy(this.matrixWorld);
        if (this.independentMotion) {
            this.matrixWorld.identity();
        }
        this.update(this.clock.getDelta());
    }
    computeBoundingSphere() {
        if (this.boundingSphere === null) {
            this.boundingSphere = new THREE.Sphere(undefined, -Infinity);
        }
        const duration = this.material.motionDuration;
        const speed = this.material.motionSpeed;
        if (!this.independentMotion) {
            this.boundingSphere.radius = duration * speed * 0.5;
            this.boundingSphere.center.y = this.boundingSphere.radius;
        }
        else {
            this.geometry.computeBoundingSphere();
            this.boundingSphere.copy(this.geometry.boundingSphere);
            const direction = this.geometry.motionDirection;
            const v4 = new THREE.Vector4(direction.x, direction.y, direction.z, 0);
            v4.applyMatrix4(this.modelMatrix).multiplyScalar(duration * speed);
            this.boundingSphere.radius += v4.length();
        }
    }
    update(delta) {
        this.material.elapsed += delta;
        if (this.independentMotion) {
            const haveChanged = this.geometry.updateAttributes(this);
            if (haveChanged && this.boundingSphere !== null) {
                this.computeBoundingSphere();
            }
        }
    }
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        if (this.material.map) {
            this.material.map.dispose();
        }
    }
}

export { Particle };
