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
        host: '0.0.0.0',
        port: 5173,
        allowedHosts: [
            'sysanalytiq.ru',
            'www.sysanalytiq.ru',
            'localhost',
        ],
        proxy: {
            '/api': {
                target: 'http://app:8000',
                changeOrigin: true,
            },
        },
        hmr: {
            clientPort: 443,
            overlay: false,
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
        },
    },
});