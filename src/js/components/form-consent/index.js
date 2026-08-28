export default {
  init() {
    document.querySelectorAll('.form').forEach((form) => {
      const checkbox = form.querySelector('.is-checkbox input[type="checkbox"][required]');
      const submitBtn = form.querySelector('.form__action button[type="submit"]');

      if (!checkbox || !submitBtn) return;

      const toggle = () => {
        submitBtn.disabled = !checkbox.checked;
      };

      toggle();
      checkbox.addEventListener('change', toggle);
    });
  },
};