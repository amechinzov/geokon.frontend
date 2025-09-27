import Lazyload from './lazyload';
import Layers from './layers';

document.addEventListener('DOMContentLoaded', () => {
  Lazyload.init();
  Layers.init();
});

window.addEventListener('reinit', () => {
  Lazyload.init();
});

window.addEventListener('init.lazyload', () => {
  Lazyload.init();
});
