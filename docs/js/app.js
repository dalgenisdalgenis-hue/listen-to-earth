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
  let scanner, profiles, previousScanState = 'idle', audioRequest = 0;

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
  function scanBox(node, bounds) {
    node.style.left = bounds.x0 / app.config.width * 100 + '%';
    node.style.top = bounds.y0 / app.config.height * 100 + '%';
    node.style.width = (bounds.x1 - bounds.x0) / app.config.width * 100 + '%';
    node.style.height = (bounds.y1 - bounds.y0) / app.config.height * 100 + '%';
  }
  function scanState(snapshot) {
    const { state, tempo, steps } = snapshot;
    byId('scan-play').textContent = app.text[
      state === 'starting' ? 'scanStarting' : state === 'playing' ? 'scanPause' :
        state === 'paused' ? 'scanResume' : 'scanPlay'];
    byId('tempo').value = tempo;
    const label = app.format('tempoValue', {
      value: tempo,
      seconds: new Intl.NumberFormat('es-DO', { maximumFractionDigits: 1 })
        .format(steps * app.config.scan.stepMs / 1000 * 100 / tempo)
    });
    byId('tempo-value').textContent = label;
    byId('tempo').setAttribute('aria-valuetext', label);
    if (state === 'idle') {
      byId('scan-progress').value = 0;
      byId('scan-line').hidden = true;
      byId('scan-readout').textContent = app.text.scanIdle;
    }
    if (state !== previousScanState) {
      if (state === 'playing') announce(app.text.scanPlaying);
      if (state === 'paused') announce(app.text.scanPaused);
      if (state === 'ended') announce(app.text.scanEnded);
    }
    previousScanState = state;
    audioState();
  }
  function scanOutcome(step) {
    if (step.result.residual > app.config.maxResidual) return app.text.unreliable;
    return step.sound.hz === null ? app.text.scanNoDust : app.format('noteDescription', {
      index: step.sound.index + 1, hz: number.format(step.sound.hz)
    });
  }
  function scanStep(step) {
    audio.play(step.result);
    const longitude = number.format(Math.abs(step.lon));
    byId('scan-readout').textContent = app.format('scanReadout', {
      step: step.index + 1, steps: app.config.scan.steps, lon: longitude,
      direction: app.text[step.lon < 0 ? 'west' : 'east'],
      weight: number.format(step.result.weights.dust),
      residual: percent.format(step.result.residual), outcome: scanOutcome(step)
    });
    byId('scan-progress').value = step.index + 1;
    scanBox(byId('scan-line'), step.bounds);
    byId('scan-line').hidden = false;
  }
  function scanProfileView(mode) {
    byId('scan-mode').value = mode;
    byId('scan-info').textContent = app.text[mode === 'journey' ? 'journeyInfo' : 'worldInfo'];
    const rows = byId('scan-rows');
    rows.replaceChildren();
    profiles[mode].forEach(step => addRow(rows, [step.index + 1,
      number.format(Math.abs(step.lon)) + ' ' + app.text[step.lon < 0 ? 'west' : 'east'],
      ...Object.keys(app.config.aerosols).map(key => number.format(step.result.weights[key])),
      percent.format(step.result.residual), scanOutcome(step)]));
    const first = profiles[mode][0].bounds;
    const last = profiles[mode].at(-1).bounds;
    scanBox(byId('scan-band'), { x0: last.x0, x1: first.x1, y0: first.y0, y1: first.y1 });
    byId('scan-band').hidden = mode !== 'journey';
  }
  function changeMode(mode) {
    if (!scanner) return;
    ++audioRequest;
    scanner.setProfile(profiles[mode]);
    scanProfileView(mode);
    announce(app.format('scanModeChanged', { mode: app.text[mode] }));
  }
  function selectCell(cell, speak, play) {
    currentCell = cell;
    byId('readout').textContent = cell.description;
    if (play) {
      scanner?.pause();
      try { audio.play(cell.result); }
      catch { announce(app.text.audioError); return; }
    }
    if (speak) announce(cell.description + (!audio.ready ? ' ' + app.text.audioOff : audio.muted ? ' ' + app.text.muted : ''));
  }
  async function load() {
    if (loading) return;
    loading = true;
    ++audioRequest;
    byId('retry').setAttribute('aria-disabled', 'true');
    byId('image-panel').setAttribute('aria-busy', 'true');
    for (const id of ['map', 'grid', 'current', 'grid-table', 'checks', 'scan-line', 'scan-band', 'scan-table']) byId(id).hidden = true;
    for (const id of ['audio-controls', 'direction-controls', 'scan-controls']) byId(id).disabled = true;
    scanner?.stop();
    scanner = null;
    app.scanner = null;
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
      profiles = Object.fromEntries(Object.keys(app.config.scan.modes)
        .map(mode => [mode, app.createScanProfile(app.pixels, mode)]));
      const mode = byId('scan-mode').value;
      previousScanState = 'idle';
      scanner = app.createScanner(profiles[mode], {
        startAudio: () => audio.start(), onStep: scanStep, onState: scanState,
        onSilence: () => audio.stop(), onError: () => announce(app.text.audioError)
      });
      app.scanner = scanner;
      scanner.setTempo(Number(byId('tempo').value));
      scanProfileView(mode);
      const rows = byId('grid-rows');
      rows.replaceChildren();
      app.gridCells.forEach(cell => addRow(rows, [
        app.format('positionShort', { row: cell.row + 1, col: cell.col + 1 }),
        cell.coordinates, number.format(cell.result.weights.dust),
        percent.format(cell.result.residual), cell.outcome
      ]));
      for (const id of ['grid', 'current', 'grid-table', 'scan-table']) byId(id).hidden = false;
      for (const id of ['audio-controls', 'direction-controls', 'scan-controls']) byId(id).disabled = false;
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
    const token = ++audioRequest;
    byId('activate').setAttribute('aria-disabled', 'true');
    try {
      await audio.start();
      if (token !== audioRequest || document.hidden) return;
      byId('activate').textContent = app.text.reactivate;
      if (currentCell && !['playing', 'starting'].includes(scanner?.snapshot.state)) audio.play(currentCell.result);
      announce(app.text.audioReady + (audio.muted ? ' ' + app.text.muted : '') +
        (currentCell ? ' ' + currentCell.description : ''));
    } catch { if (token === audioRequest) announce(app.text.audioError); }
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
  function stop() {
    ++audioRequest;
    if (scanner) scanner.stop(); else audio.stop();
    byId('scan-readout').textContent = app.text.scanStopped;
    announce(app.text.stopped);
  }
  byId('mute').addEventListener('click', mute);
  byId('stop').addEventListener('click', stop);
  byId('scan-stop').addEventListener('click', stop);
  byId('scan-play').addEventListener('click', () => scanner?.toggle());
  byId('scan-repeat').addEventListener('click', () => scanner?.repeat());
  byId('scan-mode').addEventListener('change', event => changeMode(event.target.value));
  byId('tempo').addEventListener('input', event => scanner?.setTempo(event.target.value));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    ++audioRequest;
    if (scanner?.pause()) announce(app.text.scanHidden);
  });
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
    if (event.key.toLowerCase() === 'p' && scanner) { event.preventDefault(); scanner.toggle(); }
    if (event.key.toLowerCase() === 'v' && scanner) {
      event.preventDefault(); changeMode(byId('scan-mode').value === 'journey' ? 'world' : 'journey');
    }
    if (['+', '-', '−'].includes(event.key) && scanner) {
      event.preventDefault();
      scanner.setTempo(scanner.snapshot.tempo + (event.key === '+' ? 1 : -1) * app.config.scan.tempoStep);
      announce(byId('tempo-value').textContent);
    }
    if (event.key.toLowerCase() === 'm') { event.preventDefault(); mute(); }
    if (event.key.toLowerCase() === 's') { event.preventDefault(); stop(); }
  });
  audioState();
  load();
})();
