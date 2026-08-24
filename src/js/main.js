// jQuery глобал (должен быть первым — до bx модулей)
import './setup-jquery.js';

// Основной SCSS файл
import '@/scss/main.scss';

// Авто-импорт всех SCSS компонентов (замена require.context)
import.meta.glob('@/include/**/*.scss', { eager: true });

// Библиотеки и утилиты
import './libs/index.js';
import './utils/scroll.js';
import './utils/userAgent.js';
import './bx/app.js';
import modal from './components/modal/index.js';
import filter from './components/filter/index.js';
import anchorScroll from './components/anchor-scroll/index.js';
import mobileMenu from './components/mobile-menu/index.js';

document.addEventListener('DOMContentLoaded', () => {
  modal.init();
  filter.init();
  anchorScroll.init();
  mobileMenu.init();
});
