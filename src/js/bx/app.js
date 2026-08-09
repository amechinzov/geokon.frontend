window.GEOKON_LOAD_LIBS = true;

const publicPath = import.meta.env.BASE_URL || '/';

// Модули загружаются через ESM import
import './_common.js';
import './_ajaxLoadHandler.class.js';
import './_eventHandlers.js';

const loadModules = () => {
  document.dispatchEvent(new CustomEvent('GEOKON.LibsLoaded'));
};

// TODO переделать на промисы
const asyncLoadJs = (url, onload) => {
  const script = document.createElement('script');
  script.onload = onload;
  script.src = publicPath + url;
  const parentNode = document.querySelector('head');
  parentNode && parentNode.appendChild(script);
};

const checkLoadedLibs = () => {
  loadModules();
};

document.addEventListener('DOMContentLoaded', checkLoadedLibs);
