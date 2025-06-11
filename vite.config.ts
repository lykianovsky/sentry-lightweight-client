import { defineConfig } from 'vite'
import path from 'path'
import dtsPlugin from 'vite-plugin-dts'
import terser from '@rollup/plugin-terser'

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js'],
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'client',
      fileName: 'client',
    },
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser', // <-- Указываем terser как минификатор
    rollupOptions: {
      plugins: [
        terser({
          format: {
            comments: false, // Убираем все комментарии
          },
          compress: {
            drop_console: true, // Удалить console.*
            drop_debugger: true,
            passes: 3, // Несколько проходов минификации
          },
        }),
      ],
    },
  },
  plugins: [
    dtsPlugin({
      include: ['src'],
      exclude: ['node_modules'],
      staticImport: true,
    }),
  ],
})
