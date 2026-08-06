function shiirenSet(property, value) {
  try {
    if (typeof property !== 'string' || property === '') { return; }
    const parseValue = function (v) {
      switch (v) {
        case 'undefined': return undefined;
        case 'null': return null;
        case 'true': return true;
        case 'false': return false;
        case 'noopFunc': return function () {};
        case 'trueFunc': return function () { return true; };
        case 'falseFunc': return function () { return false; };
        case 'throwFunc': return function () { throw new Error(); };
        case "''": case '': return '';
        case '[]': return [];
        case '{}': return {};
      }
      if (/^\d+$/.test(v) && Number(v) <= 0x7FFF) { return Number(v); }
      return v;
    };
    const finalValue = parseValue(value);
    const chain = property.split('.');
    const leaf = chain.pop();

    // Walks/creates the parent-object chain, installing a setter trap on any
    // segment that doesn't exist yet so the final assignment still lands the
    // moment the page's own script creates that segment (e.g. a global like
    // `ytInitialPlayerResponse` that only appears after our document-start
    // script has already run).
    const attachLeaf = function (obj) {
      try {
        const existing = Object.getOwnPropertyDescriptor(obj, leaf);
        if (existing && existing.configurable === false) { return; }
        Object.defineProperty(obj, leaf, {
          configurable: true,
          get: function () { return finalValue; },
          set: function () {},
        });
      } catch (e) {}
    };

    let owner = window;
    for (const segment of chain) {
      if (owner == null) { return; }
      const current = owner[segment];
      if (current !== undefined && current !== null) {
        owner = current;
        continue;
      }
      // Segment not created yet -- trap it so we can attach to whatever
      // object the page assigns here, the instant it does.
      let stored;
      let attached = false;
      try {
        Object.defineProperty(owner, segment, {
          configurable: true,
          get: function () { return stored; },
          set: function (v) {
            stored = v;
            if (!attached && v && typeof v === 'object') {
              attached = true;
              attachLeaf(v);
            }
          },
        });
      } catch (e) {}
      return;
    }
    attachLeaf(owner);
  } catch (e) {}
}
