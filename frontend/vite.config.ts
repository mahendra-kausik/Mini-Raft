/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

const frontendNodeModules = path.resolve(__dirname, 'node_modules')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@testing-library/react': path.resolve(frontendNodeModules, '@testing-library/react'),
      '@testing-library/jest-dom': path.resolve(frontendNodeModules, '@testing-library/jest-dom'),
      '@testing-library/user-event': path.resolve(frontendNodeModules, '@testing-library/user-event'),
      'react-router-dom': path.resolve(frontendNodeModules, 'react-router-dom'),
      'react': path.resolve(frontendNodeModules, 'react'),
      'react-dom': path.resolve(frontendNodeModules, 'react-dom'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: path.resolve(__dirname, 'src/test-setup.ts'),
    root: path.resolve(__dirname, '..'),
    include: [
      'tests/frontend/**/*.test.{ts,tsx}',
    ],
  },
})
