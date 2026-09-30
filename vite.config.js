import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward all cookies
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
            // Forward CSRF token header as uppercase X-XSRF-TOKEN
            const xsrfToken = req.headers['x-xsrf-token'] || req.headers['X-XSRF-TOKEN'];
            if (xsrfToken) {
              proxyReq.setHeader('X-XSRF-TOKEN', xsrfToken);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Forward Set-Cookie headers and fix for localhost
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              const modifiedCookies = cookies.map(cookie => {
                // Remove Domain attribute for localhost
                return cookie.replace(/Domain=[^;]+;?/gi, '')
                  .replace(/SameSite=[^;]+;?/gi, 'SameSite=Lax;');
              });
              res.setHeader('set-cookie', modifiedCookies);
            }
            // Forward X-XSRF-TOKEN header
            const xsrfToken = proxyRes.headers['x-xsrf-token'] || proxyRes.headers['X-XSRF-TOKEN'];
            if (xsrfToken) {
              res.setHeader('X-XSRF-TOKEN', xsrfToken);
            }
          });
        }
      }
    }
  }
})
