const PROJECTS_LIST_SELECTOR = '.projects__list';
const PAGINATION_SELECTOR = '.projects__pagination';
const LOAD_MORE_SELECTOR = '[data-load-more]';
const AJAX_URL = '/ajax/projects.php';

let currentSection = 'all';

function getLoadMoreButton() {
  return document.querySelector(LOAD_MORE_SELECTOR);
}

function updatePaginationVisibility(hasMore) {
  const paginationWrap = document.querySelector(PAGINATION_SELECTOR);
  if (paginationWrap) {
    paginationWrap.style.display = hasMore ? '' : 'none';
  }
}

function loadMore() {
  const btn = getLoadMoreButton();
  if (!btn) return;

  const page = parseInt(btn.dataset.page, 10) + 1;
  const count = parseInt(btn.dataset.count, 10) || 4;
  const list = document.querySelector(PROJECTS_LIST_SELECTOR);
  if (!list) return;

  btn.classList.add('button--loading');

  fetch(`${AJAX_URL}?section=${encodeURIComponent(currentSection)}&page=${page}&count=${count}`)
    .then((res) => res.text())
    .then((html) => {
      const temp = document.createElement('div');
      temp.innerHTML = html;

      const hasMore = !!temp.querySelector('[data-has-more]');
      const marker = temp.querySelector('[data-has-more]');
      if (marker) marker.remove();

      list.insertAdjacentHTML('beforeend', temp.innerHTML);
      window.dispatchEvent(new Event('init.lazyload'));

      btn.dataset.page = page;
      btn.classList.remove('button--loading');

      updatePaginationVisibility(hasMore);
    })
    .catch(() => {
      btn.classList.remove('button--loading');
    });
}

function filterProjects(value) {
  currentSection = value;
  const list = document.querySelector(PROJECTS_LIST_SELECTOR);
  if (!list) return;

  const btn = getLoadMoreButton();
  const count = (btn && btn.dataset.count) ? parseInt(btn.dataset.count, 10) : 4;

  list.classList.add('loading');

  fetch(`${AJAX_URL}?section=${encodeURIComponent(value)}&page=1&count=${count}`)
    .then((res) => res.text())
    .then((html) => {
      const temp = document.createElement('div');
      temp.innerHTML = html;

      const hasMore = !!temp.querySelector('[data-has-more]');
      const marker = temp.querySelector('[data-has-more]');
      if (marker) marker.remove();

      list.innerHTML = temp.innerHTML;
      list.classList.remove('loading');
      window.dispatchEvent(new Event('init.lazyload'));

      if (btn) {
        btn.dataset.page = '1';
      }
      updatePaginationVisibility(hasMore);
    })
    .catch(() => {
      list.classList.remove('loading');
    });
}

export default {
  init: () => {
    // Фильтры
    const filters = document.querySelectorAll('[data-filter]');
    if (!filters.length) return;

    if (!document.querySelector('[data-filter].active')) {
      filters[0].classList.add('active');
    }

    filters.forEach((filter) => {
      filter.addEventListener('click', () => {
        filters.forEach((f) => f.classList.remove('active'));
        filter.classList.add('active');

        const value = filter.dataset.filter;
        filterProjects(value);
      });
    });

    // Кнопка "Загрузить ещё"
    document.addEventListener('click', (e) => {
      const btn = e.target.closest(LOAD_MORE_SELECTOR);
      if (!btn) return;

      e.preventDefault();
      loadMore();
    });
  },
};
