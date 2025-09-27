const fixObjectFit = function (el) {
  const supportObjFit = 'objectFit' in document.documentElement.style;
  if (supportObjFit) return;

  const { backgroundSize } = getComputedStyle(el);

  el.style.background = `url("${el.src}") no-repeat center center/${backgroundSize}`;
  el.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${el.width}' height='${el.height} '%3E%3C/svg%3E`;
};

export default fixObjectFit;
