const BURGER_SELECTOR = '[data-burger]';
const MENU_SELECTOR = '.header__menu';
const HEADER_SELECTOR = '.header';

export default {
  init: () => {
    const burger = document.querySelector(BURGER_SELECTOR);
    if (!burger) return;

    const menu = document.querySelector(MENU_SELECTOR);
    const header = document.querySelector(HEADER_SELECTOR);
    if (!menu || !header) return;

    burger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      header.classList.toggle('menu-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu on link click
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        header.classList.remove('menu-open');
        document.body.style.overflow = '';
      });
    });
  },
};
