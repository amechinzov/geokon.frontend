export default {
  init: () => {
    const filters = document.querySelectorAll('[data-filter]');
    if (!filters.length) return;

    if (!document.querySelector('[data-filter].active')) {
      filters[0].classList.add('active');
      console.log(filters[0]);
    }
    filters.forEach((filter) => {
      filter.addEventListener('click', () => {
        filters.forEach((filter) => {
          filter.classList.remove('active');
        });
        filter.classList.add('active');
      });
    });
  },
};