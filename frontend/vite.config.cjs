const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');
const monacoEditorPlugin = require('vite-plugin-monaco-editor').default;

const backendTarget = process.env.VITE_BACKEND_URL || 'http://localhost:8000';

module.exports = defineConfig({
    envDir: path.resolve(__dirname, '..'),
    plugins: [
        react(),
        monacoEditorPlugin({}),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        allowedHosts: [
            'sysanalytiq.ru',
            'www.sysanalytiq.ru',
            'localhost',
            '127.0.0.1',
            '.ngrok-free.dev',
        ],
        proxy: {
            '/api': {
                target: backendTarget,
                changeOrigin: true,
            },
            '/sys-admin': {
                target: backendTarget,
                changeOrigin: true,
            },
        },
        hmr: false,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
        },
    },
});