import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.direnv/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/app/**',
        'src/ui/**',
        'src/map/world-map.ts',
        'src/geometry/types.ts',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
