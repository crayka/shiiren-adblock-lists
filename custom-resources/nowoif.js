function shiirenNowoif() {
  try {
    const realOpen = window.open;
    window.open = function () {
      return null;
    };
    try {
      Object.defineProperty(window, 'open', {
        configurable: false,
        get: function () { return function () { return null; }; },
        set: function () {},
      });
    } catch (e) {}
  } catch (e) {}
}
