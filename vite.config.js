import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            }
        }
    },
    build: {
        // Code-split vendor libraries into a separate cacheable chunk
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    icons: ['react-icons'],
                    utils: ['axios', 'qrcode.react']
                }
            }
        },
        // Terser minification — drops console.log and debugger in production
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        // Chunk size warning threshold
        chunkSizeWarningLimit: 600,
        // Generate source maps for debugging (optional, remove for smaller deploy)
        sourcemap: false,
        // Target modern browsers for smaller output
        target: 'es2020'
    }
})
