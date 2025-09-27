const fs = require('fs');
const path = require('path');
const glob = require('glob');
const twig = require('twig');
const crypto = require('crypto');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

// Кэш для страниц и AJAX-компонентов
const pageCache = new Map();
const ajaxCache = new Map();
const pageDependencies = new Map();

// Вычисление хэша файла
function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return '';

  const content = fs.readFileSync(filePath);

  return crypto.createHash('md5').update(content).digest('hex');
}

// Преобразование сокращённого пути компонента в абсолютный
function resolveComponentPath(shortPath) {
  const prefixes = {
    '&': 'include/&organisms/',
    '^': 'include/^molecules/',
    '@': 'include/@atoms/',
  };

  const prefix = shortPath[0];
  const name = shortPath.slice(1);

  if (!prefixes[prefix]) {
    console.error(`Неизвестный префикс компонента: ${prefix}`);

    return null;
  }

  return path.resolve(__dirname, 'src', prefixes[prefix], name);
}

// Сбор зависимостей Twig-файла
function collectTwigDependencies(filePath, dependencies = new Set(), seen = new Set()) {
  if (!fs.existsSync(filePath) || seen.has(filePath)) return dependencies;
  seen.add(filePath);

  const content = fs.readFileSync(filePath, 'utf-8');
  dependencies.add(filePath);

  // Поиск тегов view
  const viewRegex = /{%\s*view\s+['"]([&^@][\w-]+)['"](?:\s+with\s+[^%]+)?\s*%}/g;
  let match;

  while ((match = viewRegex.exec(content)) !== null) {
    const shortPath = match[1];
    const componentPath = resolveComponentPath(shortPath);

    if (!componentPath) continue;

    const componentName = shortPath.slice(1);
    const componentTemplatePath = path.resolve(componentPath, `${componentName}.twig`);

    if (fs.existsSync(componentTemplatePath)) {
      dependencies.add(componentTemplatePath);
      // Добавление JSON компонента
      const defaultDataPath = path.resolve(componentPath, `${componentName}.json`);

      if (fs.existsSync(defaultDataPath)) {
        dependencies.add(defaultDataPath);
      }
      // Сборка зависимости компонента
      collectTwigDependencies(componentTemplatePath, dependencies, seen);
    }
  }
  // Поиск extends для layoutов
  const extendsRegex = /{%\s*extends\s+['"]([^'"]+)['"]\s*%}/g;

  while ((match = extendsRegex.exec(content)) !== null) {
    const layoutPath = path.resolve(path.dirname(filePath), match[1]);

    if (fs.existsSync(layoutPath)) {
      dependencies.add(layoutPath);

      collectTwigDependencies(layoutPath, dependencies, seen);
    }
  }

  return dependencies;
}

// Кастомный плагин для рендеринга Twig-шаблонов
const TwigPagesPlugin = {
  apply: (compiler) => {
    const pagesDir = path.resolve(__dirname, 'src/pages');
    const ajaxDir = path.resolve(__dirname, 'src/pages/ajax');
    const dataDir = path.resolve(__dirname, 'data');
    const ajaxDataDir = path.resolve(__dirname, 'data/ajax');
    const includeDir = path.resolve(__dirname, 'src/include');
    const iconsDir = path.resolve(__dirname, 'src/img');

    // Загрузка JSON для страницы
    function loadPageData(pageName) {
      const dataPath = path.resolve(dataDir, `${pageName}.json`);

      if (fs.existsSync(dataPath)) {
        try {
          return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        } catch (err) {
          console.error(`Ошибка парсинга JSON для страницы ${pageName}:`, err);
          return {};
        }
      }
      console.warn(`Данные для страницы ${pageName} не найдены`);

      return {};
    }

    // Загрузка JSON для AJAX-компонентов
    function loadAjaxData(ajaxName) {
      const dataPath = path.resolve(ajaxDataDir, `${ajaxName}.json`);

      if (fs.existsSync(dataPath)) {
        try {
          return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        } catch (err) {
          console.error(`Ошибка парсинга JSON для AJAX-компонента ${ajaxName}:`, err);

          return {};
        }
      }
      console.warn(`Данные для AJAX-компонента ${ajaxName} не найдены`);

      return {};
    }

    // Кастомный тег `view` для компонентов
    twig.extend((Twig) => {
      twig.cache(false); // кэширование шаблонов отключено

      Twig.exports.extendTag({
        type: 'view',
        regex: /^view\s+(.+?)(?:\s+with\s+([\S\s]+?))?$/,
        next: [],
        open: true,
        compile(token) {
          const expression = token.match[1].trim();

          token.stack = Twig.expression.compile.call(this, {
            type: Twig.expression.type,
            value: expression,
          }).stack;

          if (token.match[2]) {
            token.additionalData = Twig.expression.compile.call(this, {
              type: Twig.expression.type,
              value: token.match[2],
            }).stack;
          }

          return token;
        },
        parse(token, context) {
          const shortPath = Twig.expression.parse.call(this, token.stack, context);
          const componentPath = resolveComponentPath(shortPath);

          if (!componentPath) {
            console.error(`Не удалось разрешить путь компонента: ${shortPath}`);

            return { chain: false, output: '' };
          }
          const componentName = shortPath.slice(1);
          const componentTemplatePath = path.resolve(componentPath, `${componentName}.twig`);

          if (!fs.existsSync(componentTemplatePath)) {
            console.error(`Шаблон компонента не найден: ${componentTemplatePath}`);

            return { chain: false, output: '' };
          }

          // Отслеживание зависимостей
          if (context._pageName || context._ajaxName) {
            const key = context._pageName || context._ajaxName;

            if (!pageDependencies.has(key)) {
              pageDependencies.set(key, new Set());
            }
            pageDependencies.get(key).add(componentTemplatePath);

            const defaultDataPath = path.resolve(componentPath, `${componentName}.json`);

            if (fs.existsSync(defaultDataPath)) {
              pageDependencies.get(key).add(defaultDataPath);
            }
          }

          // Загрузка дефолтных данных компонента
          const defaultDataPath = path.resolve(componentPath, `${componentName}.json`);
          let defaultData = {};

          if (fs.existsSync(defaultDataPath)) {
            try {
              defaultData = JSON.parse(fs.readFileSync(defaultDataPath, 'utf-8'));
            } catch (err) {
              console.error(`Ошибка парсинга JSON компонента ${componentName}:`, err);
            }
          }

          // Слияние данных
          let mergedData = defaultData;

          if (token.additionalData) {
            const overrides = Twig.expression.parse.call(this, token.additionalData, context);
            mergedData = { ...defaultData, ...overrides };
          }

          try {
            const componentTemplate = fs.readFileSync(componentTemplatePath, 'utf-8');
            const renderedComponent = twig.twig({ data: componentTemplate }).render(mergedData);

            return { chain: false, output: renderedComponent };
          } catch (err) {
            console.error(`Ошибка рендеринга компонента ${componentName}:`, err);

            return { chain: false, output: '' };
          }
        },
      });
    });

    // Кастомный тег `svg` для иконок
    twig.extend((Twig) => {
      Twig.exports.extendTag({
        type: 'svg',
        regex: /^svg\s+(.+?)(?:\s+with\s+(.+))?$/,
        next: [],
        open: true,
        compile(token) {
          if (token.match[1]) {
            token.stack = Twig.expression.compile.call(this, {
              type: Twig.expression.type,
              value: token.match[1],
            }).stack;
          }

          if (token.match[2]) {
            token.additionalData = Twig.expression.compile.call(this, {
              type: Twig.expression.type,
              value: token.match[2],
            }).stack;
          }

          return token;
        },
        parse(token, context) {
          let iconData = token.stack ? Twig.expression.parse.call(this, token.stack, context) : null;

          if (token.additionalData) {
            const additionalData = Twig.expression.parse.call(this, token.additionalData, context);

            if (!iconData && additionalData?.icon) {
              iconData = additionalData.icon;
            } else if (typeof iconData === 'object' && additionalData) {
              iconData = { ...iconData, ...additionalData };
            } else {
              iconData = additionalData;
            }
          }

          if (typeof iconData === 'string') {
            iconData = { name: iconData };
          }

          if (typeof iconData !== 'object' || !iconData.name) {
            console.error('SVG-тег должен содержать объект с полем "name"');

            return { chain: false, output: '' };
          }

          const iconPath = path.resolve(iconsDir, `${iconData.name}.svg`);

          if (!fs.existsSync(iconPath)) {
            console.error(`Иконка ${iconData.name} не найдена: ${iconPath}`);

            return { chain: false, output: '' };
          }

          try {
            const svgContent = fs.readFileSync(iconPath, 'utf-8');

            return { chain: false, output: svgContent };
          } catch (err) {
            console.error(`Ошибка чтения SVG ${iconData.name}:`, err);

            return { chain: false, output: '' };
          }
        },
      });
    });

    // Рендеринг страниц и AJAX-компонентов
    compiler.hooks.thisCompilation.tap('TwigPagesPlugin', (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: 'TwigPagesPlugin',
          stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        async () => {
          pageDependencies.clear();
          const pages = glob.sync(`${pagesDir}/*.twig`);
          const ajaxComponents = glob.sync(`${ajaxDir}/*.twig`);
          const assets = Object.keys(compilation.assets);
          const cssFiles = assets.filter((file) => file.endsWith('.css')).map((file) => `/${file}`);
          const jsFiles = assets.filter((file) => file.endsWith('.js')).map((file) => `/${file}`);

          // Рендеринг страниц
          await Promise.all(
            pages.map(async (page) => {
              const pageName = path.basename(page, '.twig');
              const fileName = `${pageName}.html`;
              const pageHash = getFileHash(page);
              const dataPath = path.resolve(dataDir, `${pageName}.json`);
              const dataHash = fs.existsSync(dataPath) ? getFileHash(dataPath) : '';

              // Сборка зависимостей страницы
              const dependencies = collectTwigDependencies(page);
              pageDependencies.set(pageName, dependencies);

              // Хэш всех зависимостей
              const componentsHash = Array.from(dependencies).map(getFileHash).sort().join(':');
              const cacheKey = `${pageName}:${pageHash}:${dataHash}:${componentsHash}`;

              // Проверка кэша
              if (pageCache.has(cacheKey)) {
                console.log(`Используем кэш для страницы ${pageName}`);
                compilation.emitAsset(fileName, pageCache.get(cacheKey));

                return;
              }

              const pageData = {
                ...loadPageData(pageName),
                cssFiles,
                jsFiles,
                _pageName: pageName,
              };

              try {
                const html = await new Promise((resolve, reject) => {
                  console.time(`Рендеринг страницы ${pageName}`);
                  twig.renderFile(page, pageData, (err, html) => {
                    console.timeEnd(`Рендеринг страницы ${pageName}`);
                    if (err) reject(err);
                    else resolve(html);
                  });
                });

                console.log(`Страница ${pageName} отрендерена заново`);
                const source = new webpack.sources.RawSource(html);
                pageCache.set(cacheKey, source);
                compilation.emitAsset(fileName, source);
              } catch (err) {
                console.error(`Ошибка рендеринга страницы ${pageName}:`, err);
              }
            })
          );

          // Рендеринг AJAX-компонентов
          await Promise.all(
            ajaxComponents.map(async (component) => {
              const ajaxName = path.basename(component, '.twig');
              const fileName = `ajax/${ajaxName}.html`;
              const componentHash = getFileHash(component);
              const dataPath = path.resolve(ajaxDataDir, `${ajaxName}.json`);
              const dataHash = fs.existsSync(dataPath) ? getFileHash(dataPath) : '';

              // Сборка завиимостей AJAX-компонента
              const dependencies = collectTwigDependencies(component);
              pageDependencies.set(ajaxName, dependencies);

              // Хэш всех зависимостей
              const componentsHash = Array.from(dependencies).map(getFileHash).sort().join(':');
              const cacheKey = `${ajaxName}:${componentHash}:${dataHash}:${componentsHash}`;

              if (ajaxCache.has(cacheKey)) {
                console.log(`Используем кэш для AJAX-компонента ${ajaxName}`);
                compilation.emitAsset(fileName, ajaxCache.get(cacheKey));

                return;
              }

              const ajaxData = {
                ...loadAjaxData(ajaxName),
                _ajaxName: ajaxName,
              };

              try {
                const html = await new Promise((resolve, reject) => {
                  console.time(`Рендеринг AJAX ${ajaxName}`);
                  twig.renderFile(component, ajaxData, (err, html) => {
                    console.timeEnd(`Рендеринг AJAX ${ajaxName}`);
                    if (err) reject(err);
                    else resolve(html);
                  });
                });

                console.log(`AJAX-компонент ${ajaxName} отрендерен заново`);
                const source = new webpack.sources.RawSource(html);
                ajaxCache.set(cacheKey, source);
                compilation.emitAsset(fileName, source);
              } catch (err) {
                console.error(`Ошибка рендеринга AJAX-компонента ${ajaxName}:`, err);
              }
            })
          );
        }
      );
    });

    // Отслеживание изменений в директориях
    compiler.hooks.afterCompile.tap('TwigPagesPlugin', (compilation) => {
      compilation.contextDependencies.add(dataDir);
      compilation.contextDependencies.add(pagesDir);
      compilation.contextDependencies.add(ajaxDataDir);
      compilation.contextDependencies.add(includeDir);
      compilation.contextDependencies.add(iconsDir);
    });
  },
};

// Основная конфигурация Webpack
module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    entry: {
      main: './src/js/main.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                additionalData: `
                  @import "@/scss/vars/index.scss";
                  @import "@/scss/mixins/index.scss";
                `,
                sassOptions: {
                  silenceDeprecations: ['import', 'mixed-decls', 'legacy-js-api', 'color-functions', 'global-builtin', 'slash-div'],
                },
              },
            },
          ],
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
        {
          test: /\.(ttf|woff|woff2|eot|otf)$/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name][ext]',
          },
        },
        {
          test: /\.twig$/,
          use: [
            {
              loader: 'twig-loader',
              options: {
                twigOptions: {
                  cache: false,
                },
              },
            },
          ],
        },
      ],
    },
    optimization: {
      minimize: !isDev,
      minimizer: [new TerserWebpackPlugin({ extractComments: false }), new CssMinimizerPlugin()],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: 'css/[name].css',
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/img', to: 'img' },
          { from: 'src/public', to: '.' },
        ],
      }),
      TwigPagesPlugin,
    ],
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist'),
      },
      port: 3000,
      hot: true,
      watchFiles: [
        'src/**/*.scss',
        'src/js/**/*.js',
        'src/pages/**/*.twig',
        'src/include/**/*.twig',
        'data/**/*.json',
        'src/include/**/*.json',
        'src/img/**/*.svg',
      ],
    },
    resolve: {
      extensions: ['.js', '.scss', '.twig'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'source-map' : false,
  };
};
