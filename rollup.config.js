import typescript from "rollup-plugin-typescript2";
import { string } from "rollup-plugin-string";

export default {
	external: ["three"],
	input: "./src/Particle.ts",
	output: [
		{
			file: "./dist/THREE.Particle.module.js",
			format: "esm",
			sourcemap: false,
		},
		{
			file: "./dist/THREE.Particle.js",
			format: "umd",
			name: 'THREE',
			sourcemap: false,
			globals: {
				three: "THREE"
			}
		},
	],
	plugins: [
		string({ include: ["**/*.glsl", "**/*.frag", "**/*.vert"] }),
		typescript(),
	],
};