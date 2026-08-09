import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { twigPagesPlugin } from './vite-plugin-twig-pages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    root: '.',
    publicDir: 'src/public',

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      extensions: ['.js', '.scss'],
    },

    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "@/scss/vars/index.scss";
            @import "@/scss/mixins/index.scss";
          `,
          silenceDeprecations: [
            'import',
            'legacy-js-api',
            'color-functions',
            'global-builtin',
            'slash-div',
          ],
        },
      },
    },

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'src/js/main.js'),
        },
        output: {
          entryFileNames: 'js/[name].js',
          chunkFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const ext = path.extname(assetInfo.name).slice(1);
            if (/woff2?|ttf|eot|otf/.test(ext)) return 'fonts/[name][extname]';
            if (/css/.test(ext)) return 'css/[name][extname]';
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      sourcemap: isDev,
    },

    server: {
      port: 3000,
      open: true,
    },

    plugins: [
      viteStaticCopy({
        targets: [
          { src: 'src/img/**/*', dest: 'img' },
        ],
      }),
      twigPagesPlugin(),
    ],
  };
});
