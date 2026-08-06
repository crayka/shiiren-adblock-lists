function shiirenAbortOnPropertyRead(property) {
  try {
    if (typeof property !== 'string' || property === '') { return; }
    const abort = function () { throw new ReferenceError(property); };
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
      Object.defineProperty(owner, leaf, {
        configurable: true,
        get: abort,
        set: function (v) {
          try {
            Object.defineProperty(owner, leaf, { value: v, configurable: true, writable: true });
          } catch (e) {}
        },
      });
    } catch (e) {}
  } catch (e) {}
}
