function shiirenAbortCurrentScript(property, scriptContentMatch, scriptSrcMatch) {
  try {
    if (typeof property !== 'string' || property === '') { return; }
    const parseArg = function (s) {
      if (typeof s !== 'string' || s === '') { return null; }
      const m = /^\/(.*)\/([a-z]*)$/.exec(s);
      return m ? new RegExp(m[1], m[2]) : s;
    };
    const contentNeedle = parseArg(scriptContentMatch);
    const srcNeedle = parseArg(scriptSrcMatch);
    const matches = function (needle, haystack) {
      if (needle == null) { return true; }
      if (!haystack) { return false; }
      return needle instanceof RegExp ? needle.test(haystack) : haystack.indexOf(needle) !== -1;
    };
    // document.currentScript is only non-null during synchronous execution of
    // a top-level classic <script> tag -- this is the standard, documented
    // way this scriptlet family identifies "the script currently running",
    // and shares the same known limitation (it can't see inside an async
    // callback/promise) as the real upstream implementations.
    const shouldAbort = function () {
      const script = document.currentScript;
      if (!script) { return false; }
      if (scriptContentMatch && !matches(contentNeedle, script.textContent || '')) { return false; }
      if (scriptSrcMatch && !matches(srcNeedle, script.src || '')) { return false; }
      return true;
    };
    const abort = function () {
      if (shouldAbort()) { throw new ReferenceError(property); }
    };

    const chain = property.split('.');
    const leaf = chain.pop();
    let owner = window;
    for (const segment of chain) {
      if (owner == null) { return; }
      const next = owner[segment];
      if (next === undefined || next === null) { return; }
      owner = next;
    }
    try {
      const desc = Object.getOwnPropertyDescriptor(owner, leaf);
      if (desc && desc.configurable === false) { return; }
      let stored = desc ? desc.value : owner[leaf];
      Object.defineProperty(owner, leaf, {
        configurable: true,
        get: function () { abort(); return stored; },
        set: function (v) { abort(); stored = v; },
      });
    } catch (e) {}
  } catch (e) {}
}
