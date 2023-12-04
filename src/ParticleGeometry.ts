import * as THREE from "three";
import { Particle } from "./Particle";

class ParticleGeometry extends THREE.BufferGeometry {

    public readonly isParticleGeometry = true;
    public readonly motionDirection = new THREE.Vector3(0, 1, 0);

    private readonly updateRecords = new Map<number, number>();

    public generateAttributes(count: number): void {

        if (this.index) {

            if (this.index.count === count) {

                return;

            }

            this.dispose();

        }

        if (count <= 0) {

            return;

        }

        const indices: number[] = [];
        const vertices: number[] = [];
        const directions: number[] = [];
        const randoms: number[] = [];

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

    public resetAttributes(): void {

        if (!this.index) {

            return;

        }

        const posAttr = this.getAttribute('position') as THREE.Float32BufferAttribute;
        const direAttr = this.getAttribute('direction') as THREE.Float32BufferAttribute;

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

    public updateAttributes(particle: Particle): boolean {

        if (!this.index) {

            return false;

        }

        const matrix = particle.modelMatrix.clone();

        const position = new THREE.Vector3();
        position.setFromMatrixPosition(matrix);

        const direction = new THREE.Vector4(this.motionDirection.x, this.motionDirection.y, this.motionDirection.z, 0);
        direction.applyMatrix4(matrix);

        const posAttr = this.getAttribute('position') as THREE.BufferAttribute;
        const dirAttr = this.getAttribute('direction') as THREE.BufferAttribute;
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

    public override dispose(): void {

        super.dispose();

        this.index = null;

        this.deleteAttribute('position');
        this.deleteAttribute('direction');
        this.deleteAttribute('random');

    }

}

export { ParticleGeometry }
