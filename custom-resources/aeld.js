function shiirenAddEventListenerDefuser(typeMatch, handlerMatch) {
  try {
    const parseArg = function (s) {
      if (typeof s !== 'string' || s === '') { return null; }
      const m = /^\/(.*)\/([a-z]*)$/.exec(s);
      return m ? new RegExp(m[1], m[2]) : s;
    };
    const typeNeedle = parseArg(typeMatch);
    const handlerNeedle = parseArg(handlerMatch);
    const matches = function (needle, haystack) {
      if (needle == null) { return true; }
      return needle instanceof RegExp ? needle.test(haystack) : haystack.indexOf(needle) !== -1;
    };
    const realAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      try {
        const typeStr = String(type == null ? '' : type);
        const handlerStr = typeof listener === 'function' ? String(listener) : '';
        if (matches(typeNeedle, typeStr) && matches(handlerNeedle, handlerStr)) {
          return;
        }
      } catch (e) {}
      return realAdd.call(this, type, listener, options);
    };
  } catch (e) {}
}
