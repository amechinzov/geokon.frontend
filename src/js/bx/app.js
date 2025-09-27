window.GEOKON_LOAD_LIBS = true;
__webpack_public_path__ = __webpack_public_path__ || '/';

// Файлы начинающиеся с '_' можно импортировать, они не компилируются сами по себе
const loadModules = () => {
  require('./_common');
  require('./_ajaxLoadHandler.class');
  require('./_eventHandlers');

  document.dispatchEvent(new CustomEvent('GEOKON.LibsLoaded'));
};

// TODO переделать на промисы
const asyncLoadJs = (url, onload) => {
  const script = document.createElement('script');
  script.onload = onload;
  script.src = __webpack_public_path__ + url;
  const parentNode = document.querySelector('head');
  parentNode && parentNode.appendChild(script);
};

const checkLoadedLibs = () => {
  loadModules();
};

document.addEventListener('DOMContentLoaded', checkLoadedLibs);
