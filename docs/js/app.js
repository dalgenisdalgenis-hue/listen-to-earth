'use strict';

(() => {
  const app = window.ListenToEarth;
  document.querySelectorAll('[data-text]').forEach(node => {
    node.textContent = app.text[node.dataset.text];
  });
  document.querySelectorAll('[data-alt]').forEach(node => {
    node.alt = app.text[node.dataset.alt];
  });
  document.title = app.text.title;
  const byId = id => document.getElementById(id);
  const canvas = byId('map');
  canvas.setAttribute('aria-label', app.text.mapLabel);
  const status = byId('status');
  const audio = app.createAudio();
  app.audio = audio;
  const number = new Intl.NumberFormat('es-DO', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const percent = new Intl.NumberFormat('es-DO', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  let loading = false, activating = false, controller, currentCell, announcement;

  function announce(message) {
    clearTimeout(announcement);
    status.textContent = '';
    // Permite repetir un aviso igual al anterior sin acumular una cola de voz.
    announcement = setTimeout(() => { status.textContent = message; }, 30);
  }
  function audioState() {
    byId('audio-state').textContent = audio.ready ?
      (audio.muted ? app.text.muted : app.text.audioReady) : app.text.audioOff;
  }
  function addRow(parent, values) {
    const row = document.createElement('tr');
    values.forEach((value, i) => {
      const cell = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) cell.scope = 'row';
      cell.textContent = value;
      row.append(cell);
    });
    parent.append(row);
  }
  function showChecks(image) {
    const rows = byId('check-rows');
    rows.replaceChildren();
    app.checkResults = app.config.checks.map(check => {
      const { x, y } = app.pixelFromCoordinates(check.lat, check.lon);
      const rgb = app.readPoint(image, x, y);
      const result = app.decompose(rgb);
      const passed = result.dominant === check.expected;
      addRow(rows, [app.text[check.id],
        ...Object.keys(app.config.aerosols).map(key => number.format(result.weights[key])),
        percent.format(result.residual),
        result.dominant === null ? app.text.softClick : app.text[result.dominant],
        passed ? app.text.pass : app.text.fail]);
      return { id: check.id, rgb, ...result, passed };
    });
    byId('checks').hidden = false;
    return app.checkResults.every(check => check.passed);
  }
  function selectCell(cell, speak, play) {
    currentCell = cell;
    byId('readout').textContent = cell.description;
    if (play) {
      try { audio.play(cell.result); }
      catch { announce(app.text.audioError); return; }
    }
    if (speak) announce(cell.description + (!audio.ready ? ' ' + app.text.audioOff : audio.muted ? ' ' + app.text.muted : ''));
  }
  async function load() {
    if (loading) return;
    loading = true;
    byId('retry').setAttribute('aria-disabled', 'true');
    byId('image-panel').setAttribute('aria-busy', 'true');
    for (const id of ['map', 'grid', 'current', 'grid-table', 'checks']) byId(id).hidden = true;
    for (const id of ['audio-controls', 'direction-controls']) byId(id).disabled = true;
    controller?.destroy();
    controller = null;
    currentCell = null;
    audio.stop();
    app.pixels = null;
    app.checkResults = [];
    announce(app.text.loading);
    try {
      app.pixels = await app.loadImageData(canvas);
      canvas.hidden = false;
      if (!showChecks(app.pixels)) {
        byId('diagnostics').open = true;
        announce(app.text.checkError);
        return;
      }
      app.gridCells = app.createGridCells(app.pixels);
      controller = app.mountGrid(app.gridCells, selectCell, announce);
      const rows = byId('grid-rows');
      rows.replaceChildren();
      app.gridCells.forEach(cell => addRow(rows, [
        app.format('positionShort', { row: cell.row + 1, col: cell.col + 1 }),
        cell.coordinates, number.format(cell.result.weights.dust),
        percent.format(cell.result.residual), cell.outcome
      ]));
      for (const id of ['grid', 'current', 'grid-table']) byId(id).hidden = false;
      for (const id of ['audio-controls', 'direction-controls']) byId(id).disabled = false;
      announce(app.text.ready);
    } catch (error) {
      announce(app.text[error.message] || app.text.canvasError);
    } finally {
      loading = false;
      byId('retry').setAttribute('aria-disabled', 'false');
      byId('image-panel').setAttribute('aria-busy', 'false');
      audioState();
    }
  }
  byId('retry').addEventListener('click', load);
  byId('activate').addEventListener('click', async () => {
    if (activating) return;
    activating = true;
    byId('activate').setAttribute('aria-disabled', 'true');
    try {
      await audio.start();
      byId('activate').textContent = app.text.reactivate;
      if (currentCell) audio.play(currentCell.result);
      announce(app.text.audioReady + (audio.muted ? ' ' + app.text.muted : '') +
        (currentCell ? ' ' + currentCell.description : ''));
    } catch { announce(app.text.audioError); }
    finally {
      activating = false;
      byId('activate').setAttribute('aria-disabled', 'false');
      audioState();
    }
  });
  function mute() {
    const muted = audio.toggleMute();
    byId('mute').setAttribute('aria-pressed', String(muted));
    announce(muted ? app.text.muted : app.text.unmuted);
    audioState();
  }
  function stop() { audio.stop(); announce(app.text.stopped); }
  byId('mute').addEventListener('click', mute);
  byId('stop').addEventListener('click', stop);
  byId('volume').addEventListener('input', event => {
    audio.setVolume(event.target.value);
    const label = app.format('volumeValue', { value: event.target.value });
    byId('volume-value').textContent = label;
    event.target.setAttribute('aria-valuetext', label);
  });
  byId('volume-value').textContent = app.format('volumeValue', { value: 50 });
  byId('volume').setAttribute('aria-valuetext', byId('volume-value').textContent);
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
    if (event.key === 'Escape') { event.preventDefault(); stop(); return; }
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key.toLowerCase() === 'm') { event.preventDefault(); mute(); }
    if (event.key.toLowerCase() === 's') { event.preventDefault(); stop(); }
  });
  audioState();
  load();
})();
