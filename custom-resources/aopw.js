function shiirenAbortOnPropertyWrite(property) {
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
      const existingValue = desc ? desc.value : owner[leaf];
      Object.defineProperty(owner, leaf, {
        configurable: true,
        get: function () { return existingValue; },
        set: abort,
      });
    } catch (e) {}
  } catch (e) {}
}
