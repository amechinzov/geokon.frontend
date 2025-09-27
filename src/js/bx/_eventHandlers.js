//update captcha
$(document)
  .off('click.captcha')
  .on('click.captcha', '[data-action=getCode]', function (e) {
    e.preventDefault();

    const $element = $(this);
    const $form = $element.closest('form');
    const $inputCaptchaSid = $form.find('input[name=captcha_sid]');
    const $inputCaptchaWord = $form.find('input[name=captcha_word]');
    const $img = $form.find('img.captcha__img');

    $.ajax((window.APP && window.APP.captchaUrl) || './ajax/captcha/success.json').done(function (response) {
      if (response && response.data) {
        const code = response.data.code;
        if (code) {
          $inputCaptchaWord.val('');
          $inputCaptchaSid.val(code);
          $img.attr('src', '/bitrix/tools/captcha.php?captcha_sid=' + code);
        }
      }
    });
  });
