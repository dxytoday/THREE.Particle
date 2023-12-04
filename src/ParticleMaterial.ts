import * as THREE from "three";
import vertexShader from "./shaders/particle.vert.glsl";
import fragmentShader from "./shaders/particle.frag.glsl";

// 提示：在 vscode 中 ctrl + k + 0/j 可以快速收起/展开所有折叠行

type ParticleUniforms = {

    opacity: THREE.IUniform<number>,

    elapsed: THREE.IUniform<number>,

    pixelRatio: THREE.IUniform<number>,

    emissionSpacing: THREE.IUniform<number>,

    motionSpeed: THREE.IUniform<number>,
    motionSpeedRandom: THREE.IUniform<number>,

    motionDuration: THREE.IUniform<number>,
    motionDurationRandom: THREE.IUniform<number>,

    directionSolidAngle: THREE.IUniform<number>,

    gravityVector: THREE.IUniform<THREE.Vector3>,

    map: THREE.IUniform<THREE.Texture | null>,
    useMap: THREE.IUniform<boolean>,

    startSize: THREE.IUniform<number>,
    endSize: THREE.IUniform<number>,
    sizeLengthRandom: THREE.IUniform<number>,

    startOpacity: THREE.IUniform<number>,
    endOpacity: THREE.IUniform<number>,
    opacityLengthRandom: THREE.IUniform<number>,

    rotationSpeed: THREE.IUniform<number>,
    rotationSpeedRandom: THREE.IUniform<number>,

    startColor: THREE.IUniform<THREE.Color>,
    endColor: THREE.IUniform<THREE.Color>,

}

export class ParticleMaterial extends THREE.ShaderMaterial {

    public readonly isParticleMaterial = true;

    public declare readonly uniforms: ParticleUniforms;

    //#region elapsed - 运行总时间

    public get elapsed(): number {

        return this.uniforms.elapsed.value;

    }

    public set elapsed(time: number) {

        this.uniforms.elapsed.value = time;

    }

    //#endregion

    //#region directionSolidAngle - 运动方向立体角 0-360

    public set directionSolidAngle(degree: number) {

        this.uniforms.directionSolidAngle.value = degree / 360;

    }

    public get directionSolidAngle(): number {

        return this.uniforms.directionSolidAngle.value * 360;

    }

    //#endregion

    //#region emissionTotal - 发射总量

    private _emissionTotal = 0;

    public set emissionTotal(count: number) {

        this._emissionTotal = count;

        this.uniforms.emissionSpacing.value = this.emissionDuration / count;

    }

    public get emissionTotal(): number {

        return this._emissionTotal;

    }

    //#endregion

    //#region emissionDuration - 发射时长

    private _emissionDuration = 0;

    public set emissionDuration(time: number) {

        this._emissionDuration = time;

        this.uniforms.emissionSpacing.value = time / this.emissionTotal;

    }

    public get emissionDuration(): number {

        return this._emissionDuration;

    }

    //#endregion

    //#region motionSpeed - 每当 elapse 增加 1 时，运动方向增加的长度

    public set motionSpeed(length: number) {

        this.uniforms.motionSpeed.value = length;

        this.uniforms.motionSpeedRandom.value = this.motionSpeedRandomRatio * length;

    }

    public get motionSpeed(): number {

        return this.uniforms.motionSpeed.value;

    }

    //#endregion

    //#region motionSpeedRandomRatio - 运动速度随机系数 0-1，所有粒子会在 motionSpeed * ( 1 - ratio ) 到 motionSpeed 之间随机

    private _motionSpeedRandomRatio = 0;

    public set motionSpeedRandomRatio(ratio: number) {

        this._motionSpeedRandomRatio = ratio;

        this.uniforms.motionSpeedRandom.value = ratio * this.motionSpeed;

    }

    public get motionSpeedRandomRatio(): number {

        return this._motionSpeedRandomRatio;

    }

    //#endregion

    //#region motionDuration - 单个粒子的运动时长 - 也可以称为循环周期

    public set motionDuration(time: number) {

        this.uniforms.motionDuration.value = time;

        this.uniforms.motionDurationRandom.value = this.motionDurationRandomRatio * time;

    }

    public get motionDuration(): number {

        return this.uniforms.motionDuration.value;

    }

    //#endregion

    //#region motionDurationRandomRatio - 运动时长随机系数 0-1，，所有粒子会在 motionDuration * ( 1 - ratio ) 到 motionDuration 之间随机

    private _motionDurationRandomRatio = 0;

    public set motionDurationRandomRatio(ratio: number) {

        this._motionDurationRandomRatio = ratio;

        this.uniforms.motionDurationRandom.value = ratio * this.motionDuration;

    }

    public get motionDurationRandomRatio(): number {

        return this._motionDurationRandomRatio;

    }

    //#endregion

    //#region gravity - 重力值 0-1

    public gravity = 0;

    //#endregion

    //#region map - 纹理

    public get map(): THREE.Texture | null {

        return this.uniforms.map.value;

    }

    public set map(texture: THREE.Texture | string) {

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

    //#endregion

    //#region useMap - 纹理开关

    public get useMap(): boolean {

        return this.uniforms.useMap.value;

    }

    public set useMap(flag: boolean) {

        this.uniforms.useMap.value = !!flag;

    }

    //#endregion

    //#region startSize - 运动开始时的大小

    public get startSize(): number {

        return this.uniforms.startSize.value;

    }

    public set startSize(size: number) {

        this.uniforms.startSize.value = size;

        this.sizeRandomRatio = this.sizeRandomRatio;

    }

    //#endregion

    //#region endSize - 运动结束时的大小

    public get endSize(): number {

        return this.uniforms.endSize.value;

    }

    public set endSize(size: number) {

        this.uniforms.endSize.value = size;

        this.sizeRandomRatio = this.sizeRandomRatio;

    }

    //#endregion

    //#region sizeRandomRatio - 大小随机系数 0-1

    private _sizeRandomRatio = 0;

    public get sizeRandomRatio(): number {

        return this._sizeRandomRatio;

    }

    public set sizeRandomRatio(ratio: number) {

        this._sizeRandomRatio = ratio

        this.uniforms.sizeLengthRandom.value = (this.endSize - this.startSize) * ratio;

    }

    //#endregion

    //#region startOpacity - 运动开始时的透明度

    public get startOpacity(): number {

        return this.uniforms.startOpacity.value;

    }

    public set startOpacity(opacity: number) {

        this.uniforms.startOpacity.value = opacity;

        this.opacityRandomRatio = this.opacityRandomRatio;

    }

    //#endregion

    //#region endOpacity - 运动结束时的透明度

    public get endOpacity(): number {

        return this.uniforms.endOpacity.value;

    }

    public set endOpacity(opacity: number) {

        this.uniforms.endOpacity.value = opacity;

        this.opacityRandomRatio = this.opacityRandomRatio;

    }

    //#endregion

    //#region opacityRandomRatio - 透明度随机系数 0-1

    private _opacityRandomRatio = 0;

    public get opacityRandomRatio(): number {

        return this._opacityRandomRatio;

    }

    public set opacityRandomRatio(ratio: number) {

        this._opacityRandomRatio = ratio

        this.uniforms.opacityLengthRandom.value = (this.endOpacity - this.startOpacity) * ratio;

    }

    //#endregion

    //#region rotationSpeed - 旋转速度 秒/角度 0-360

    public get rotationSpeed(): number {

        return this.uniforms.rotationSpeed.value * THREE.MathUtils.RAD2DEG;

    }

    public set rotationSpeed(degree: number) {

        this.uniforms.rotationSpeed.value = degree * THREE.MathUtils.DEG2RAD;

        this.rotationSpeedRandomRatio = this.rotationSpeedRandomRatio;

    }

    //#endregion

    //#region rotationSpeedRandomRatio - 旋转速度随机系数 0-1

    private _rotationSpeedRandomRatio = 0;

    public get rotationSpeedRandomRatio(): number {

        return this._rotationSpeedRandomRatio;

    }

    public set rotationSpeedRandomRatio(ratio: number) {

        this._rotationSpeedRandomRatio = ratio;

        this.uniforms.rotationSpeedRandom.value = ratio;
        this.uniforms.rotationSpeedRandom.value *= this.rotationSpeed;
        this.uniforms.rotationSpeedRandom.value *= THREE.MathUtils.DEG2RAD;

    }

    //#endregion

    //#region startColor - 运动开始时的颜色

    public get startColor(): string {

        return `#${this.uniforms.startColor.value.getHexString()}`;

    }

    public set startColor(color: string) {

        this.uniforms.startColor.value.set(color);

    }

    //#endregion

    //#region endColor 运动结束时的颜色

    public get endColor(): string {

        return `#${this.uniforms.endColor.value.getHexString()}`;

    }

    public set endColor(color: string) {

        this.uniforms.endColor.value.set(color);

    }

    //#endregion

    public constructor() {

        super();

        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;

        this.transparent = true;
        this.blending = THREE.AdditiveBlending;
        this.depthWrite = false;

        this.initUniforms();

    }

    private initUniforms(): void {

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

    /** 计算空间单位长度对应的像素数量 */
    public computePixelRatio(fov: number, pixelHeight: number): void {

        // 计算出 z 为 1 的时候近投影面上的（视口高度）
        // 再用（画布的像素高度）/ （视口高度）
        // 得到 z 为 1 时，空间单位长度对应的像素数量

        const halfAngle = THREE.MathUtils.DEG2RAD * fov * 0.5;
        const viewHeight = Math.tan(halfAngle) * 2;
        const pixelRatio = pixelHeight / viewHeight;

        this.uniforms.pixelRatio.value = pixelRatio;

    }

    /** 计算重力矢量 - 包含重力的方向（矢量的方向）和重力的加速度（矢量的长度） */
    public computeGravityVector(modelMatrix: THREE.Matrix4, isIndependent: boolean): void {

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
