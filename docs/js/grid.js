'use strict';

(() => {
  const app = window.ListenToEarth;
  const degrees = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 });
  const percent = new Intl.NumberFormat('es-DO', { style: 'percent', maximumFractionDigits: 1 });

  app.gridPosition = (row, col, dr, dc) => ({
    row: Math.max(0, Math.min(app.config.rows - 1, row + dr)),
    col: Math.max(0, Math.min(app.config.cols - 1, col + dc))
  });

  app.refreshGridCell = function (cell) {
    const view = app.describeResult(cell.result);
    cell.outcome = view.outcome;
    cell.description = app.format('cellDescription', {
      row: cell.row + 1, col: cell.col + 1, rows: app.config.rows, cols: app.config.cols,
      coordinates: cell.coordinates, quantities: view.quantities,
      residual: percent.format(cell.result.residual), outcome: view.outcome
    });
    cell.label = app.format('cellLabel', {
      coordinates: cell.coordinates, quantities: view.quantities, outcome: view.outcome
    });
  };

  app.createGridCells = function (image) {
    const cells = [];
    for (let row = 0; row < app.config.rows; row++) {
      for (let col = 0; col < app.config.cols; col++) {
        // La cuadrícula organiza el movimiento; solo se lee una ventana 3×3
        // en el centro de cada casilla, no el promedio de toda la casilla.
        const lon = (col + 0.5) / app.config.cols * 360 - 180;
        const lat = 90 - (row + 0.5) / app.config.rows * 180;
        const { x, y } = app.pixelFromCoordinates(lat, lon);
        const rgb = app.readPoint(image, x, y);
        const result = app.decompose(rgb);
        const coordinates = app.format('coordinates', {
          lat: degrees.format(Math.abs(90 - y / app.config.height * 180)),
          ns: app.text[y <= app.config.height / 2 ? 'north' : 'south'],
          lon: degrees.format(Math.abs(x / app.config.width * 360 - 180)),
          ew: app.text[x >= app.config.width / 2 ? 'east' : 'west']
        });
        const cell = { row, col, x, y, rgb, result, coordinates };
        app.refreshGridCell(cell);
        cells.push(cell);
      }
    }
    return cells;
  };

  app.mountGrid = function (cells, onSelect, announce) {
    const grid = document.getElementById('grid');
    let current = 0;
    const elements = [];
    const listeners = [];
    const listen = (node, event, handler) => {
      node.addEventListener(event, handler);
      listeners.push(() => node.removeEventListener(event, handler));
    };
    grid.replaceChildren();
    for (let row = 0; row < app.config.rows; row++) {
      const rowNode = document.createElement('div');
      rowNode.setAttribute('role', 'row');
      rowNode.setAttribute('aria-rowindex', String(row + 1));
      rowNode.className = 'grid-row';
      for (let col = 0; col < app.config.cols; col++) {
        const index = row * app.config.cols + col;
        const node = document.createElement('div');
        node.setAttribute('role', 'gridcell');
        node.setAttribute('aria-colindex', String(col + 1));
        node.setAttribute('aria-label', cells[index].label);
        node.setAttribute('aria-selected', String(index === current));
        node.tabIndex = index === current ? 0 : -1;
        node.dataset.index = index;
        rowNode.append(node);
        elements.push(node);
      }
      grid.append(rowNode);
    }
    function select(index, focus, speak, play = true) {
      elements[current].tabIndex = -1;
      elements[current].setAttribute('aria-selected', 'false');
      current = index;
      elements[current].tabIndex = 0;
      elements[current].setAttribute('aria-selected', 'true');
      onSelect(cells[current], speak, play);
      if (focus) elements[current].focus();
    }
    function move(dr, dc, focus, speak, boundary = true) {
      const cell = cells[current];
      const next = app.gridPosition(cell.row, cell.col, dr, dc);
      if (next.row === cell.row && next.col === cell.col) {
        if (boundary) announce(app.text.gridEdge);
        return;
      }
      select(next.row * app.config.cols + next.col, focus, speak);
    }
    listen(grid, 'keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const directions = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (directions[event.key]) {
        event.preventDefault();
        // El foco anuncia la etiqueta. No duplicamos ese anuncio con aria-live.
        move(...directions[event.key], true, false, !event.repeat);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!event.repeat) onSelect(cells[current], true, true);
      }
      // Tab no se captura: sale de la cuadrícula con un único punto de tabulación.
    });
    listen(grid, 'click', event => {
      const cell = event.target.closest('[role="gridcell"]');
      if (cell && grid.contains(cell)) select(Number(cell.dataset.index), true, false);
    });
    listen(grid, 'focusin', event => {
      const cell = event.target.closest('[role="gridcell"]');
      if (cell && grid.contains(cell) && Number(cell.dataset.index) !== current) {
        select(Number(cell.dataset.index), false, false, false);
      }
    });
    for (const [id, dr, dc] of [['up', -1, 0], ['down', 1, 0], ['left', 0, -1], ['right', 0, 1]]) {
      listen(document.getElementById(id), 'click', () => move(dr, dc, false, true));
    }
    listen(document.getElementById('replay'), 'click', () => onSelect(cells[current], true, true));
    select(0, false, false, false);
    return {
      replay: () => onSelect(cells[current], true, true),
      // R necesita dejar preparada la celda que contiene a RD para que la
      // siguiente flecha continúe desde allí. La lectura de R, sin embargo,
      // se calcula aparte en el píxel exacto y no usa el centro de esta celda.
      selectIndex: (index, focus = false) => select(index, focus, false, false),
      refresh: () => elements.forEach((node, index) => node.setAttribute('aria-label', cells[index].label)),
      destroy: () => listeners.forEach(remove => remove())
    };
  };
})();
