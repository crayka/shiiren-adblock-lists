function shiirenTrustedReplaceFetchResponse(pattern, replacement, propsToMatch) {
  try {
    const parseArg = function (s) {
      if (typeof s !== 'string' || s === '') { return null; }
      const m = /^\/(.*)\/([a-z]*)$/.exec(s);
      return m ? new RegExp(m[1], m[2]) : null;
    };
    const patternRe = parseArg(pattern);
    const matchRe = parseArg(propsToMatch);
    const realFetch = self.fetch;
    if (typeof realFetch !== 'function') { return; }
    self.fetch = new Proxy(realFetch, {
      apply: function (target, thisArg, args) {
        const req = args[0];
        const url = typeof req === 'string' ? req : (req && req.url) || '';
        const shouldMatch = !propsToMatch
          || (matchRe ? matchRe.test(url) : url.indexOf(propsToMatch) !== -1);
        const p = Reflect.apply(target, thisArg, args);
        if (!shouldMatch) { return p; }
        return p.then(function (response) {
          return response.clone().text().then(function (text) {
            const newText = patternRe
              ? text.replace(patternRe, replacement)
              : text.split(pattern).join(replacement == null ? '' : replacement);
            if (newText === text) { return response; }
            return new Response(newText, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          }).catch(function () { return response; });
        }).catch(function () { return p; });
      },
    });
  } catch (e) {}
}
