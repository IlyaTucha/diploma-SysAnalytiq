const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');
const monacoEditorPlugin = require('vite-plugin-monaco-editor').default;

module.exports = defineConfig({
    plugins: [
        react(),
        monacoEditorPlugin({})
    ],
    server: {
        host: '127.0.0.1',
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://app:8000',
                changeOrigin: true,
            },
        },
        hmr: {
            overlay: false,
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
        },
    },
});