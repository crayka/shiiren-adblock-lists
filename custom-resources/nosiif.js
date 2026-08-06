function shiirenNoSetIntervalIf(callbackMatch, delayMatch) {
  try {
    const parseArg = function (s) {
      if (typeof s !== 'string' || s === '') { return null; }
      const m = /^\/(.*)\/([a-z]*)$/.exec(s);
      return m ? new RegExp(m[1], m[2]) : s;
    };
    let negateCb = false;
    let cbArg = callbackMatch;
    if (typeof cbArg === 'string' && cbArg.charAt(0) === '!') {
      negateCb = true;
      cbArg = cbArg.slice(1);
    }
    const cbNeedle = parseArg(cbArg);

    const parseDelay = function (s) {
      if (typeof s !== 'string' || s === '') { return null; }
      let negate = false;
      let v = s;
      if (v.charAt(0) === '!') { negate = true; v = v.slice(1); }
      let min = null;
      let max = null;
      if (/^\d+$/.test(v)) {
        min = max = Number(v);
      } else {
        const m = /^(\d+)?-(\d+)?$/.exec(v);
        if (m) {
          min = m[1] !== undefined ? Number(m[1]) : 0;
          max = m[2] !== undefined ? Number(m[2]) : Infinity;
        }
      }
      return min === null ? null : { min, max, negate };
    };
    const delaySpec = parseDelay(delayMatch);

    const matchesCb = function (fnSource) {
      if (cbNeedle == null) { return true; }
      const hit = cbNeedle instanceof RegExp ? cbNeedle.test(fnSource) : fnSource.indexOf(cbNeedle) !== -1;
      return negateCb ? !hit : hit;
    };
    const matchesDelay = function (delay) {
      if (!delaySpec) { return true; }
      const d = Number(delay) || 0;
      const hit = d >= delaySpec.min && d <= delaySpec.max;
      return delaySpec.negate ? !hit : hit;
    };

    const realSetInterval = window.setInterval;
    window.setInterval = new Proxy(realSetInterval, {
      apply: function (target, thisArg, args) {
        const fn = args[0];
        const delay = args[1];
        const fnSource = typeof fn === 'function' ? String(fn) : String(fn == null ? '' : fn);
        if (matchesCb(fnSource) && matchesDelay(delay)) {
          return 0;
        }
        return Reflect.apply(target, thisArg, args);
      },
    });
  } catch (e) {}
}
