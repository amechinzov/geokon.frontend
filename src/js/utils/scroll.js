export const disableScroll = () => {
  const scrollY = window.pageYOffset;
  const { body } = document;
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
};

export const enableScroll = () => {
  const { body } = document;
  const scrollY = body.style.top;
  body.style.position = '';
  body.style.top = '';
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
};
