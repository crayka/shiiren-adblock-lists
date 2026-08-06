(function () {
    'use strict';
    const matches = function (url) {
        return typeof url === 'string' && url.indexOf('/pagead/js/adsbygoogle.js') !== -1;
    };
    window.adsbygoogle = window.adsbygoogle || { loaded: true, push: function () { } };

    const RealXHR = window.XMLHttpRequest;
    const OpenFn = RealXHR.prototype.open;
    const SendFn = RealXHR.prototype.send;
    RealXHR.prototype.open = function (method, url) {
        this.__stubTarget = matches(url) ? url : null;
        return OpenFn.apply(this, arguments);
    };
    RealXHR.prototype.send = function (body) {
        if (this.__stubTarget) {
            const url = this.__stubTarget;
            const finish = () => {
                Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
                Object.defineProperty(this, 'status', { value: 200, configurable: true });
                Object.defineProperty(this, 'statusText', { value: 'OK', configurable: true });
                Object.defineProperty(this, 'responseURL', { value: url, configurable: true });
                Object.defineProperty(this, 'responseText', { value: '', configurable: true });
                Object.defineProperty(this, 'response', { value: '', configurable: true });
                if (typeof this.onreadystatechange === 'function') { this.onreadystatechange(); }
                this.dispatchEvent(new Event('readystatechange'));
                this.dispatchEvent(new Event('load'));
                this.dispatchEvent(new Event('loadend'));
            };
            setTimeout(finish, 0);
            return;
        }
        return SendFn.apply(this, arguments);
    };

    const RealFetch = window.fetch;
    if (typeof RealFetch === 'function') {
        window.fetch = function (input, init) {
            const url = typeof input === 'string' ? input : (input && input.url);
            if (matches(url)) {
                return Promise.resolve(new Response('', { status: 200, statusText: 'OK' }));
            }
            return RealFetch.apply(this, arguments);
        };
    }
})();
