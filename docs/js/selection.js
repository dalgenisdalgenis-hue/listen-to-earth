'use strict';

(() => {
  const app = window.ListenToEarth;
  app.createSelection = function () {
    const order = app.config.instrumentOrder;
    const selected = new Set(['dust']);
    function set(type, enabled) {
      if (!order.includes(type)) throw new Error('sampleError');
      enabled = Boolean(enabled);
      if (selected.has(type) === enabled) return [];
      if (enabled) selected.add(type); else selected.delete(type);
      return [{ type, enabled }];
    }
    return {
      get types() { return order.filter(type => selected.has(type)); },
      has: type => selected.has(type),
      set,
      toggle: type => set(type, !selected.has(type)),
      toggleAll() {
        const all = selected.size !== order.length;
        return order.flatMap(type => set(type, all || type === 'dust'));
      }
    };
  };
  app.selection = app.createSelection();
})();
