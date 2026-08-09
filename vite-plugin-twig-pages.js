import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import twigLib from 'twig';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      const defaultDataPath = path.resolve(componentPath, `${componentName}.json`);

      if (fs.existsSync(defaultDataPath)) {
        dependencies.add(defaultDataPath);
      }
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

// Загрузка JSON для страницы
function loadPageData(pageName) {
  const dataDir = path.resolve(__dirname, 'data');
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
  const ajaxDataDir = path.resolve(__dirname, 'data/ajax');
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

// Регистрация кастомных Twig-тегов
let twigTagsRegistered = false;

function registerTwigTags() {
  if (twigTagsRegistered) return;
  twigTagsRegistered = true;

  const iconsDir = path.resolve(__dirname, 'src/img');

  // Кастомный тег `view` для компонентов
  twigLib.extend((Twig) => {
    twigLib.cache(false);

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
          const renderedComponent = twigLib.twig({ data: componentTemplate }).render(mergedData);
          return { chain: false, output: renderedComponent };
        } catch (err) {
          console.error(`Ошибка рендеринга компонента ${componentName}:`, err);
          return { chain: false, output: '' };
        }
      },
    });
  });

  // Кастомный тег `svg` для иконок
  twigLib.extend((Twig) => {
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
}

// Рендеринг одной Twig-страницы (через renderFile для поддержки extends)
function renderTwigFile(twigPath, data) {
  return new Promise((resolve, reject) => {
    twigLib.renderFile(twigPath, data, (err, html) => {
      if (err) reject(err);
      else resolve(html);
    });
  });
}

export function twigPagesPlugin() {
  const pagesDir = path.resolve(__dirname, 'src/pages');
  const ajaxDir = path.resolve(__dirname, 'src/pages/ajax');

  registerTwigTags();

  return {
    name: 'vite-plugin-twig-pages',

    // === DEV MODE ===
    configureServer(server) {
      // Следим за изменениями в twig/json/svg
      const dirsToWatch = [
        path.resolve(__dirname, 'src/pages'),
        path.resolve(__dirname, 'src/include'),
        path.resolve(__dirname, 'data'),
        path.resolve(__dirname, 'src/img'),
      ];

      server.watcher.add(dirsToWatch);

      server.watcher.on('change', (filePath) => {
        if (/\.(twig|json|svg)$/.test(filePath)) {
          pageCache.clear();
          ajaxCache.clear();
          server.ws.send({ type: 'full-reload' });
        }
      });

      // Middleware для отдачи отрендеренных Twig-страниц
      return () => {
        server.middlewares.use(async (req, res, next) => {
          let url = req.url.split('?')[0];

          // / → /main.html (главная страница)
          if (url === '/' || url === '/index.html') {
            url = '/main.html';
          }

          if (!url.endsWith('.html')) {
            return next();
          }

          const pageName = path.basename(url, '.html');
          const isAjax = url.startsWith('/ajax/');
          const twigPath = isAjax
            ? path.resolve(ajaxDir, `${pageName}.twig`)
            : path.resolve(pagesDir, `${pageName}.twig`);

          if (!fs.existsSync(twigPath)) {
            return next();
          }

          const data = isAjax
            ? { ...loadAjaxData(pageName), _ajaxName: pageName }
            : { ...loadPageData(pageName), _pageName: pageName };

          try {
            let html = await renderTwigFile(twigPath, data);

            // Инжектим entry point перед </body>
            if (!isAjax) {
              html = html.replace(
                '</body>',
                '  <script type="module" src="/src/js/main.js"></script>\n</body>'
              );
            }

            // Vite трансформирует HTML (добавит HMR client)
            html = await server.transformIndexHtml(req.url, html);

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.statusCode = 200;
            res.end(html);
          } catch (err) {
            console.error(`Ошибка рендеринга ${pageName}:`, err);
            next(err);
          }
        });
      };
    },

    // === BUILD MODE ===
    async generateBundle(outputOptions, bundle) {
      pageDependencies.clear();

      // Собираем CSS и JS файлы из бандла
      const cssFiles = [];
      const jsFiles = [];
      for (const [fileName] of Object.entries(bundle)) {
        if (fileName.endsWith('.css')) cssFiles.push('/' + fileName);
        if (fileName.endsWith('.js')) jsFiles.push('/' + fileName);
      }

      // Рендеринг страниц
      const pages = globSync(path.join(pagesDir, '*.twig').replace(/\\/g, '/'));

      for (const page of pages) {
        const pageName = path.basename(page, '.twig');
        const fileName = `${pageName}.html`;

        // Кэширование
        const pageHash = getFileHash(page);
        const dataDir = path.resolve(__dirname, 'data');
        const dataPath = path.resolve(dataDir, `${pageName}.json`);
        const dataHash = fs.existsSync(dataPath) ? getFileHash(dataPath) : '';
        const dependencies = collectTwigDependencies(page);
        pageDependencies.set(pageName, dependencies);
        const componentsHash = Array.from(dependencies).map(getFileHash).sort().join(':');
        const cacheKey = `${pageName}:${pageHash}:${dataHash}:${componentsHash}`;

        if (pageCache.has(cacheKey)) {
          console.log(`Используем кэш для страницы ${pageName}`);
          this.emitFile({ type: 'asset', fileName, source: pageCache.get(cacheKey) });
          continue;
        }

        const pageData = {
          ...loadPageData(pageName),
          cssFiles,
          jsFiles,
          _pageName: pageName,
        };

        try {
          console.time(`Рендеринг страницы ${pageName}`);
          const html = await renderTwigFile(page, pageData);
          console.timeEnd(`Рендеринг страницы ${pageName}`);

          console.log(`Страница ${pageName} отрендерена`);
          pageCache.set(cacheKey, html);
          this.emitFile({ type: 'asset', fileName, source: html });
        } catch (err) {
          console.error(`Ошибка рендеринга страницы ${pageName}:`, err);
        }
      }

      // Рендеринг AJAX-компонентов
      const ajaxComponents = globSync(path.join(ajaxDir, '*.twig').replace(/\\/g, '/'));

      for (const component of ajaxComponents) {
        const ajaxName = path.basename(component, '.twig');
        const fileName = `ajax/${ajaxName}.html`;

        // Кэширование
        const componentHash = getFileHash(component);
        const ajaxDataDir = path.resolve(__dirname, 'data/ajax');
        const dataPath = path.resolve(ajaxDataDir, `${ajaxName}.json`);
        const dataHash = fs.existsSync(dataPath) ? getFileHash(dataPath) : '';
        const dependencies = collectTwigDependencies(component);
        pageDependencies.set(ajaxName, dependencies);
        const componentsHash = Array.from(dependencies).map(getFileHash).sort().join(':');
        const cacheKey = `${ajaxName}:${componentHash}:${dataHash}:${componentsHash}`;

        if (ajaxCache.has(cacheKey)) {
          console.log(`Используем кэш для AJAX-компонента ${ajaxName}`);
          this.emitFile({ type: 'asset', fileName, source: ajaxCache.get(cacheKey) });
          continue;
        }

        const ajaxData = {
          ...loadAjaxData(ajaxName),
          _ajaxName: ajaxName,
        };

        try {
          console.time(`Рендеринг AJAX ${ajaxName}`);
          const html = await renderTwigFile(component, ajaxData);
          console.timeEnd(`Рендеринг AJAX ${ajaxName}`);

          console.log(`AJAX-компонент ${ajaxName} отрендерен`);
          ajaxCache.set(cacheKey, html);
          this.emitFile({ type: 'asset', fileName, source: html });
        } catch (err) {
          console.error(`Ошибка рендеринга AJAX-компонента ${ajaxName}:`, err);
        }
      }
    },
  };
}
