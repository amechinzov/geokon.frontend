import { OverlayScrollbars } from 'overlayscrollbars';
import { throttle } from 'throttle-debounce';
import { disableScroll, enableScroll } from '@/js/utils/scroll';

export default {
  init() {
    const buttonModal = document.querySelectorAll('[data-modal]');
    if (!buttonModal.length) return;

    buttonModal.forEach((button) => {
      if (button.hasAttribute('data-init')) return;

      button.addEventListener('click', () => {
        const url = button.getAttribute('data-modal');

        if (url) {
          button.blur();
          this.createModal(url);
        }
      });
      button.setAttribute('data-init', true);
    });
  },

  resetStyle(el) {
    const els = el.querySelectorAll('[class*="form"][style]');
    if (!els.length) return;
    els.forEach((el) => {
      el.setAttribute('style', '');
    });
  },

  computedFormHeight(modal, form) {
    this.resetStyle(modal);
    const modalContent = modal.querySelector('.modal__content');
    const modalContentHeight = modalContent.offsetHeight;
    const modalForm = modal.querySelector('.modal-form');
    modalForm.style = `height: ${modalContentHeight}px`;
    const modalFormHeight = modalForm.offsetHeight;
    const modalFormStyles = getComputedStyle(modalForm);
    const head = modal.querySelector('.modal-form__head');
    const headStyles = getComputedStyle(head);
    const formHeight =
      modalFormHeight -
      (parseFloat(modalFormStyles.paddingTop) +
        parseFloat(modalFormStyles.paddingBottom) +
        parseFloat(head?.offsetHeight) +
        parseFloat(headStyles?.marginBottom));

    form.style = `height: ${formHeight}px`;

    const actions = form.querySelector('.form__actions');
    const fieldsWrap = form.querySelector('.form__fields-wrap');
    const fields = form.querySelector('.form__fields');
    if (actions) {
      const actionsStyles = getComputedStyle(actions);
      const formFieldsHeight = formHeight - (actions.offsetHeight + parseFloat(actionsStyles?.marginTop) - 1);
      fieldsWrap.style = `height: ${formFieldsHeight}px`;
    } else {
      fieldsWrap.style = `height: ${formHeight}px`;
    }
    OverlayScrollbars(
      {
        target: fieldsWrap,
        elements: {
          viewport: fields,
        },
      },
      {}
    );
  },

  async createModal(url) {
    let error = false;
    const modal = document.createElement('dialog');
    modal.classList.add('modal');
    modal.setAttribute('aria-label', 'modal-content');
    modal.innerHTML = `<div class="modal__inner"><div class="modal__overlay"></div><div class="modal__content"></div>`;
    const buttonClose = document.createElement('button');
    buttonClose.classList.add('modal__close');
    buttonClose.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
<path d="M17.6435 20L4.65527 7.0118L7.01229 4.65479L20.0005 17.6429L32.9887 4.65479L35.3457 7.0118L22.3575 20L35.3457 32.988L32.9887 35.3452L20.0005 22.357L7.01229 35.3452L4.65527 32.988L17.6435 20Z" fill="currentColor"/>
</svg>`;

    const handleClose = () => {
      modal.close();
      modal.remove();
      if (error) {
        //закрываем уведмоление об ошибке, при закрытии окна
        window.dispatchEvent(new CustomEvent('notification:clear'));
      }
      enableScroll();
      window.removeEventListener('form:success', handleClose);
    };

    document.body.appendChild(modal);
    const modalContent = modal.querySelector('.modal__content');

    const res = await fetch(url);
    if (res.status === 200) {
      const html = await res.text();
      modalContent.innerHTML = html;
      modalContent.appendChild(buttonClose);

      const overlay = modal.querySelector('.modal__overlay');

      overlay.addEventListener('click', handleClose);
      buttonClose.addEventListener('click', handleClose);
      const modalCloseButtons = modal.querySelectorAll('[data-modal-close]');
      if (modalCloseButtons.length) {
        modalCloseButtons.forEach((button) => {
          button.addEventListener('click', handleClose);
        });
      }
      //Закрываем все открытые попапы перед открытием нового
      document.querySelectorAll('dialog[open]')?.forEach((dialog) => dialog.close());
      modal.show();
      const form = modal.querySelector('form');

      if (form) {
        if (!form.hasAttribute('data-scroll-disabled')) {
          this.computedFormHeight(modal, form);

          window.addEventListener(
            'resize',
            throttle(300, () => {
              this.computedFormHeight(modal, form);
            })
          );
        } else {
          const target = modal.querySelector('.modal-form');
          if (target) {
            OverlayScrollbars(
              {
                target,
              },
              {
                overflow: {
                  x: 'hidden',
                },
              }
            );
          }
        }
        window.addEventListener('form:success', handleClose);
        window.addEventListener('form:error', () => (error = true));
      }

      disableScroll();
      window.dispatchEvent(new CustomEvent('reinit'));
    }
  },
};
