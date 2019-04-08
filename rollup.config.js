import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';
import getPreprocessor from 'svelte-preprocess';

import { compile as ts } from './ts-compile.js';

const production = !process.env.ROLLUP_WATCH;

const preprocess = getPreprocessor({
	transformers: { ts }
});

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/bundle.js'
	},
	plugins: [
		svelte({
			dev: !production,
			css: css => {
				css.write('public/bundle.css');
			},
			preprocess
		}),
		json(),
		resolve(),
		commonjs(),
		production && terser()
	]
};
