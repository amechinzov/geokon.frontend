jQuery.fn.extend({
  scrollTo(offset, time, dst) {
    time = time || 600;
    offset = offset || 0;
    dst = dst || this.offset().top + offset;
    if (dst) $('html,body').animate({ scrollTop: dst }, time);
    return this;
  },
});

window.BX = window.BX || {};
window.BX.util = window.BX.util || {};
if (!window.BX.util.popup) {
  window.BX.util.popup = function (e, t, r) {
    const n = screen.width;
    const i = screen.height;
    return window.open(
      e,
      '',
      'status=no,scrollbars=yes,resizable=yes,width=' +
        t +
        ',height=' +
        r +
        ',top=' +
        Math.floor((i - r) / 2 - 14) +
        ',left=' +
        Math.floor((n - t) / 2 - 5)
    );
  };
}
