import * as THREE from "three";
import { ParticleGeometry } from "./ParticleGeometry";
import { ParticleMaterial } from "./ParticleMaterial";

export class Particle extends THREE.Points {

    public readonly isParticle = true;

    public boundingSphere: THREE.Sphere | null = null;

    public declare readonly material: ParticleMaterial;
    public declare readonly geometry: ParticleGeometry;

    public readonly modelMatrix = new THREE.Matrix4();

    private readonly clock = new THREE.Clock();

    //#region count

    public set count(count: number) {

        count = Math.trunc(count);

        this.material.emissionTotal = count;
        this.geometry.generateAttributes(count);

    }

    public get count(): number {

        return this.material.emissionTotal;

    }

    //#endregion

    //#region independentMotion

    private _independentMotion = false;

    public set independentMotion(flag: boolean) {

        if (this._independentMotion == flag) {

            return;

        }

        this._independentMotion = !!flag;

        if (!this._independentMotion) {

            this.geometry.resetAttributes();

        }

        this.boundingSphere = null;

    }

    public get independentMotion(): boolean {

        return this._independentMotion;

    }

    //#endregion

    public constructor() {

        super(new ParticleGeometry(), new ParticleMaterial());

        this.registerRenderCallback();

    }

    private registerRenderCallback(): void {

        const scope = this;
        const material = this.material;
        const v2 = new THREE.Vector2();

        let fov: number;
        let pixelHeight: number;

        const modelMatrix = new THREE.Matrix4();
        let gravity: number;
        let isIndependent: boolean;

        scope.onBeforeRender = function (): void {

            const renderer: THREE.WebGLRenderer = arguments[0];
            const camera: THREE.PerspectiveCamera = arguments[2];

            renderer.getSize(v2);

            if (fov !== camera.fov || pixelHeight !== v2.y) {

                fov = camera.fov;
                pixelHeight = v2.y;

                material.computePixelRatio(fov, pixelHeight);

            }

            if (

                !modelMatrix.equals(scope.modelMatrix) ||
                gravity !== material.gravity ||
                isIndependent !== scope.independentMotion

            ) {

                gravity = material.gravity;
                isIndependent = scope.independentMotion;
                modelMatrix.copy(scope.modelMatrix);

                material.computeGravityVector(modelMatrix, isIndependent);

            }

            material.uniforms.opacity.value = material.opacity;

        }

    }

    public override updateMatrixWorld(force?: boolean): void {

        super.updateMatrixWorld(force);

        this.modelMatrix.copy(this.matrixWorld);

        if (this.independentMotion) {

            this.matrixWorld.identity();

        }

        // todo: 可以在更合适的地方调用
        // 比如在执行 THREE.WebGLRenderer.render 之前
        this.update(this.clock.getDelta());

    }

    public computeBoundingSphere(): void {

        if (this.boundingSphere === null) {

            this.boundingSphere = new THREE.Sphere(undefined, -Infinity);

        }

        const duration = this.material.motionDuration;
        const speed = this.material.motionSpeed;

        if (!this.independentMotion) {

            this.boundingSphere.radius = duration * speed * 0.5;
            this.boundingSphere.center.y = this.boundingSphere.radius;

        } else {

            this.geometry.computeBoundingSphere();

            this.boundingSphere.copy(this.geometry.boundingSphere as THREE.Sphere);

            const direction = this.geometry.motionDirection;

            const v4 = new THREE.Vector4(direction.x, direction.y, direction.z, 0);
            v4.applyMatrix4(this.modelMatrix).multiplyScalar(duration * speed);

            this.boundingSphere.radius += v4.length();

        }

    }

    public update(delta: number): void {

        this.material.elapsed += delta;

        if (this.independentMotion) {

            if (this.geometry.updateAttributes(this)) {

                this.boundingSphere = null;

            }

        }

    }

    public dispose(): void {

        this.geometry.dispose();
        this.material.dispose();

        if (this.material.map) {

            this.material.map.dispose();

        }

    }

}



