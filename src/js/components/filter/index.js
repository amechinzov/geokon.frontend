const PROJECTS_LIST_SELECTOR = '.projects__list';
const PROJECT_SELECTOR = '.project';

function filterProjects(value) {
  const list = document.querySelector(PROJECTS_LIST_SELECTOR);
  if (!list) return;

  const projects = list.querySelectorAll(PROJECT_SELECTOR);
  projects.forEach((project) => {
    if (value === 'all' || project.dataset.section === value) {
      project.style.display = '';
    } else {
      project.style.display = 'none';
    }
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
