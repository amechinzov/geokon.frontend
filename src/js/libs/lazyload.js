import LazyLoad from 'vanilla-lazyload';
import fixObjectFit from '../utils/fixObjectFit';

export default {
  init() {
    const lazy = new LazyLoad({
      elements_selector: '.is-lazy',
      class_loading: 'is-loading',
      class_loaded: 'is-loaded',
      class_error: 'is-error',
      callback_loaded: (el) => {
        fixObjectFit(el);
      },
    });
    lazy.update();

    window.addEventListener('init.lazyload', () => {
      lazy.update();
    });
  },
};
