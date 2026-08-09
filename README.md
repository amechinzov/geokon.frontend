# Geokon Frontend

Фронтенд-сборка для сайта Geokon. Статический сайт-генератор на базе Twig-шаблонов с компонентным подходом (Atomic Design).

## Стек

- **Vite** — сборка и dev-сервер
- **Twig** — шаблонизатор с кастомными тегами `{% view %}` и `{% svg %}`
- **SCSS** — стили с BEM-методологией
- **jQuery** — DOM-манипуляции, AJAX
- **vanilla-lazyload** — ленивая загрузка изображений
- **OverlayScrollbars** — кастомные скроллбары в модальных окнах

## Структура проекта

```
src/
├── js/                  # JavaScript (entry: main.js)
│   ├── bx/              # Модули интеграции с Bitrix
│   ├── components/      # Компоненты (modal, filter)
│   ├── libs/            # Обёртки над библиотеками
│   └── utils/           # Утилиты (scroll, breakpoints, ...)
├── scss/                # Глобальные стили, переменные, миксины
├── pages/               # Twig-страницы (*.twig → *.html)
│   └── ajax/            # AJAX-компоненты
├── include/             # Twig-компоненты
│   ├── @atoms/          # Атомы (button, icon, image, ...)
│   ├── ^molecules/      # Молекулы (card, tag, factoid, ...)
│   ├── &organisms/      # Организмы (header, footer, screen, ...)
│   └── layout/          # Базовый layout
├── fonts/               # Шрифты
├── img/                 # Изображения и SVG-иконки
└── public/              # Статические файлы (favicon, manifest)
data/                    # JSON-данные для страниц
```

## Команды

```bash
npm install       # Установка зависимостей
npm run dev       # Dev-сервер (http://localhost:3000)
npm run build     # Production-сборка в dist/
npm run preview   # Превью production-сборки
```

## Кастомные Twig-теги

**`{% view %}`** — подключение компонента с данными из JSON:
```twig
{% view '&header' with { header: header } %}
{% view '^card' with { title: 'Hello' } %}
{% view '@button' with { text: 'Click' } %}
```

Префиксы: `&` — organisms, `^` — molecules, `@` — atoms.

**`{% svg %}`** — вставка SVG-иконки из `src/img/`:
```twig
{% svg { name: '24/arrow' } %}
```
