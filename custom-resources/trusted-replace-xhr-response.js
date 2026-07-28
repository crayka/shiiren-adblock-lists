function shiirenTrustedReplaceXhrResponse(pattern, replacement, propsToMatch) {
  try {
    const parseArg = function (s) {
      if (typeof s !== 'string' || s === '') { return null; }
      const m = /^\/(.*)\/([a-z]*)$/.exec(s);
      return m ? new RegExp(m[1], m[2]) : null;
    };
    const patternRe = parseArg(pattern);
    const matchRe = parseArg(propsToMatch);
    const RealXHR = self.XMLHttpRequest;
    if (typeof RealXHR !== 'function') { return; }
    const rewrite = function (text) {
      const newText = patternRe
        ? text.replace(patternRe, replacement)
        : text.split(pattern).join(replacement == null ? '' : replacement);
      return newText;
    };
    self.XMLHttpRequest = new Proxy(RealXHR, {
      construct: function (target, args) {
        const xhr = new target(...args);
        let targetUrl = '';
        const realOpen = xhr.open;
        xhr.open = function (method, url) {
          targetUrl = String(url || '');
          return realOpen.apply(xhr, arguments);
        };
        xhr.addEventListener('readystatechange', function () {
          if (xhr.readyState !== 4) { return; }
          const shouldPatch = !propsToMatch
            || (matchRe ? matchRe.test(targetUrl) : targetUrl.indexOf(propsToMatch) !== -1);
          if (!shouldPatch) { return; }
          try {
            const original = xhr.responseText;
            if (typeof original !== 'string') { return; }
            const patched = rewrite(original);
            if (patched === original) { return; }
            Object.defineProperty(xhr, 'responseText', { value: patched, configurable: true });
            Object.defineProperty(xhr, 'response', { value: patched, configurable: true });
          } catch (e) {}
        }, false);
        return xhr;
      },
    });
  } catch (e) {}
}
