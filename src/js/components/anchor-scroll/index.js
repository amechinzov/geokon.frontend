import scrollToWithDuration from '../../utils/scroll-to.js';

const DURATION = 800;
const HEADER_SELECTOR = '.header';

function getHeaderOffset() {
  const header = document.querySelector(HEADER_SELECTOR);
  return header ? header.offsetHeight : 0;
}

function scrollToElement(id) {
  const target = document.getElementById(id);
  if (!target) return;

  const y = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
  scrollToWithDuration(y, DURATION);
}

function handleClick(e) {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;

  const id = link.getAttribute('href').slice(1);
  if (!id) return;

  e.preventDefault();
  scrollToElement(id);
}

function handleAnchorSpanClick(e) {
  const span = e.target.closest('[data-anchor-id]');
  if (!span) return;

  const id = span.dataset.anchorId;
  if (!id) return;

  e.preventDefault();
  scrollToElement(id);
}

function init() {
  document.addEventListener('click', handleClick);
  document.addEventListener('click', handleAnchorSpanClick);
}

export default { init };
