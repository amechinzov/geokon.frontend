// Основной SCSS файл
import '@/scss/main';

const context = require.context('@/include', true, /\.scss$/);
context.keys().forEach((file) => context(file));

window.$ = window.jQuery = require('jquery');

import './libs';
import './utils/scroll';
import './utils/userAgent';
import './bx/app';
import modal from './components/modal';
import filter from './components/filter';

document.addEventListener('DOMContentLoaded', () => {
  modal.init();
  filter.init();
})