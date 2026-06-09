import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
    testTimeout: 20000, // equity Monte Carlo (up to 15k iters) can exceed the 5s default under parallel load
    // This repo lives on an exFAT drive where macOS constantly writes AppleDouble
    // "._*" shadow files; without this, Vitest tries to parse them as test suites.
    exclude: [...configDefaults.exclude, '**/._*'],
  },
})
