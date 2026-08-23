const PROJECTS_LIST_SELECTOR = '.projects__list';
const AJAX_URL = '/ajax/projects.php';

function filterProjects(value) {
  const list = document.querySelector(PROJECTS_LIST_SELECTOR);
  if (!list) return;

  list.classList.add('loading');

  fetch(`${AJAX_URL}?section=${encodeURIComponent(value)}`)
    .then((res) => res.text())
    .then((html) => {
      list.innerHTML = html;
      list.classList.remove('loading');
    })
    .catch(() => {
      list.classList.remove('loading');
    });
}

export default {
  init: () => {
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
  },
};
