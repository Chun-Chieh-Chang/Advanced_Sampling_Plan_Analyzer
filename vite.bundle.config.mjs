import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    build: {
        outDir: path.resolve(__dirname, 'app'),
        emptyOutDir: false,
        copyPublicDir: false,
        lib: {
            entry: path.resolve(__dirname, 'app/main.js'),
            name: 'SamplingPlanApp',
            formats: ['iife'],
            fileName: () => 'main.bundle.js'
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true
            }
        }
    }
});
