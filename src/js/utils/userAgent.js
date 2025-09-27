class BrowserDetect {
  constructor() {
    this.browser = this.searchString(this.dataBrowser()) || 'Other';
    this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || 'Unknown';
  }

  searchString(data) {
    for (let i = 0; i < data.length; i++) {
      const dataString = data[i].string;
      this.versionSearchString = data[i].subString;

      if (dataString.indexOf(data[i].subString) !== -1) {
        return data[i].identity;
      }
    }
  }

  searchVersion(dataString) {
    const index = dataString.indexOf(this.versionSearchString);
    if (index === -1) {
      return;
    }

    const rv = dataString.indexOf('rv:');
    if (this.versionSearchString === 'Trident' && rv !== -1) {
      return parseFloat(dataString.substring(rv + 3));
    }
    return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
  }

  dataBrowser() {
    return [
      {
        string: navigator.userAgent,
        subString: 'Edge',
        identity: 'edge',
      },
      { string: navigator.userAgent, subString: 'MSIE', identity: 'ie' },
      {
        string: navigator.userAgent,
        subString: 'Trident',
        identity: 'ie',
      },
      {
        string: navigator.userAgent,
        subString: 'Firefox',
        identity: 'ff',
      },
      {
        string: navigator.userAgent,
        subString: 'Opera',
        identity: 'opera',
      },
      {
        string: navigator.userAgent,
        subString: 'OPR',
        identity: 'opera',
      },
      {
        string: navigator.userAgent,
        subString: 'Chrome',
        identity: 'chrome',
      },
      {
        string: navigator.userAgent,
        subString: 'Safari',
        identity: 'safari',
      },
    ];
  }
}

window.browserDetect = new BrowserDetect();

document.documentElement.classList.add(`is-${window.browserDetect.browser}`);
