'use strict';

(() => {
  const app = window.ListenToEarth;
  document.querySelectorAll('[data-text]').forEach(node => {
    node.textContent = app.text[node.dataset.text];
  });
  document.querySelectorAll('[data-alt]').forEach(node => {
    node.alt = app.text[node.dataset.alt];
  });
  document.querySelectorAll('[data-label]').forEach(node => {
    node.setAttribute('aria-label', app.text[node.dataset.label]);
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
  let lastSource = null, lastScanStep = null, rdPoint = null;

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
  function sourceLabel() {
    if (!lastSource) return app.text.sourceEmpty;
    if (lastSource.kind === 'grid') return app.format('sourceGrid', {
      row: lastSource.item.row + 1, col: lastSource.item.col + 1
    });
    if (lastSource.kind === 'scan') return app.format('sourceScan', {
      step: lastSource.item.index + 1, mode: app.text[lastSource.item.mode]
    });
    return app.text.sourcePoint;
  }
  function renderSource() {
    const view = lastSource ? app.describeResult(lastSource.item.result) : null;
    byId('sound-source').textContent = sourceLabel() + (view ? ' ' + view.quantities + '. ' + view.outcome : '');
  }
  function describeRdPoint() {
    if (!rdPoint) return '';
    const view = app.describeResult(rdPoint.result);
    return app.format('dominicanRepublicDescription', {
      quantities: view.quantities,
      residual: percent.format(rdPoint.result.residual), outcome: view.outcome
    });
  }
  function renderSelector() {
    for (const type of app.config.instrumentOrder) {
      byId('aerosol-' + type).checked = app.selection.has(type);
      const volume = audio.getVolume(type);
      byId('volume-' + type).value = volume;
      const label = app.format('volumeValue', { value: volume });
      byId('volume-value-' + type).textContent = label;
      byId('volume-' + type).setAttribute('aria-valuetext', label);
    }
    byId('selection-summary').textContent = app.format('selectionSummary', {
      types: app.selection.types.map(type => app.text[type]).join(', ') || app.text.none
    });
    byId('toggle-all').textContent = app.selection.types.length === 4 ? app.text.onlyDust : app.text.allAerosols;
  }
  function renderGridTable() {
    const rows = byId('grid-rows');
    rows.replaceChildren();
    (app.gridCells || []).forEach(cell => addRow(rows, [
      app.format('positionShort', { row: cell.row + 1, col: cell.col + 1 }), cell.coordinates,
      ...Object.keys(app.config.aerosols).map(type => number.format(cell.result.weights[type])),
      percent.format(cell.result.residual), cell.outcome
    ]));
  }
  function changeSelection(changes) {
    audio.selectionChanged();
    renderSelector();
    // Solo se actualiza la presentación: se conservan datos, foco y reloj.
    for (const cell of app.gridCells || []) app.refreshGridCell(cell);
    controller?.refresh();
    renderGridTable();
    if (currentCell) byId('readout').textContent = currentCell.description;
    if (lastSource?.kind === 'point') byId('readout').textContent = describeRdPoint();
    if (profiles && scanner) scanProfileView(byId('scan-mode').value);
    if (lastScanStep) renderScanReadout(lastScanStep);
    renderSource();
    if (!changes.length) return;
    let error = '';
    const running = ['playing', 'starting'].includes(scanner?.snapshot.state);
    // En marcha las capas nuevas esperan al siguiente paso. Fuera del
    // barrido se compara la misma muestra, sin iniciar audio por primera vez.
    if (!running && audio.ready && lastSource) {
      try { audio.play(lastSource.item.result); }
      catch { error = ' ' + app.text.audioError; }
    }
    announce(changes.map(change => app.text[(change.enabled ? 'on_' : 'off_') + change.type]).join(' ') +
      ' ' + byId('selection-summary').textContent + (!running && lastSource ? ' ' + sourceLabel() : '') + error);
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
    const { state, tempo, steps, mode } = snapshot;
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
      lastScanStep = null;
      byId('scan-progress').value = 0;
      byId('scan-line').hidden = true;
      byId('scan-readout').textContent = app.text.scanIdle;
    }
    if (state !== 'ended') byId('journey-ending').hidden = true;
    if (state === 'ended' && mode === 'journey' && lastScanStep) {
      const values = {
        dust: number.format(lastScanStep.result.weights.dust),
        seaSalt: number.format(lastScanStep.result.weights.seaSalt)
      };
      byId('journey-ending-text').textContent = app.format('journeyEnding', values);
      byId('journey-ending').hidden = false;
    }
    if (state !== previousScanState) {
      if (state === 'playing') announce(app.text.scanPlaying);
      if (state === 'paused') announce(app.text.scanPaused);
      if (state === 'ended') {
        const ending = mode === 'journey' && lastScanStep ? app.format('journeyEndingAnnouncement', {
          dust: number.format(lastScanStep.result.weights.dust),
          seaSalt: number.format(lastScanStep.result.weights.seaSalt)
        }) : app.text.scanEnded;
        announce(ending);
      }
    }
    previousScanState = state;
    audioState();
  }
  function scanOutcome(step) {
    return app.describeResult(step.result).outcome;
  }
  function renderScanReadout(step) {
    const longitude = number.format(Math.abs(step.lon));
    const view = app.describeResult(step.result);
    byId('scan-readout').textContent = app.format('scanReadout', {
      step: step.index + 1, steps: app.config.scan.steps, lon: longitude,
      direction: app.text[step.lon < 0 ? 'west' : 'east'],
      quantities: view.quantities,
      residual: percent.format(step.result.residual), outcome: view.outcome
    });
  }
  function scanStep(step) {
    audio.play(step.result);
    lastScanStep = step;
    lastSource = { kind: 'scan', item: step };
    renderScanReadout(step);
    renderSource();
    byId('scan-progress').value = step.index + 1;
    scanBox(byId('scan-line'), step.bounds);
    byId('scan-line').hidden = false;
  }
  function scanProfileView(mode) {
    byId('scan-mode').value = mode;
    byId('mode-journey').setAttribute('aria-pressed', String(mode === 'journey'));
    byId('mode-world').setAttribute('aria-pressed', String(mode === 'world'));
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
    lastSource = null;
    renderSource();
    scanProfileView(mode);
    announce(app.format('scanModeChanged', { mode: app.text[mode] }));
  }
  function selectCell(cell, speak, play) {
    byId('rd-marker').hidden = true;
    currentCell = cell;
    byId('readout').textContent = cell.description;
    if (play) {
      scanner?.pause();
      lastSource = { kind: 'grid', item: cell };
      renderSource();
      try { audio.play(cell.result); }
      catch { announce(app.text.audioError); return; }
    }
    if (!lastSource) { lastSource = { kind: 'grid', item: cell }; renderSource(); }
    if (speak) announce(cell.description + (!audio.ready ? ' ' + app.text.audioOff : audio.muted ? ' ' + app.text.muted : ''));
  }
  function goToDominicanRepublic() {
    if (!rdPoint || !controller) return;
    scanner?.pause();
    const row = Math.min(app.config.rows - 1,
      Math.floor(rdPoint.y / app.config.height * app.config.rows));
    const col = Math.min(app.config.cols - 1,
      Math.floor(rdPoint.x / app.config.width * app.config.cols));
    controller.selectIndex(row * app.config.cols + col);
    currentCell = null;
    lastSource = { kind: 'point', item: rdPoint };
    const marker = byId('rd-marker');
    marker.style.left = rdPoint.x / app.config.width * 100 + '%';
    marker.style.top = rdPoint.y / app.config.height * 100 + '%';
    marker.hidden = false;
    byId('readout').textContent = describeRdPoint();
    renderSource();
    try { if (audio.ready) audio.play(rdPoint.result); }
    catch { announce(app.text.audioError); return; }
    announce(describeRdPoint() + (!audio.ready ? ' ' + app.text.audioOff : audio.muted ? ' ' + app.text.muted : ''));
  }
  async function load() {
    if (loading) return;
    loading = true;
    byId('retry').hidden = true;
    ++audioRequest;
    byId('retry').setAttribute('aria-disabled', 'true');
    byId('image-panel').setAttribute('aria-busy', 'true');
    for (const id of ['map', 'grid', 'current', 'grid-table', 'checks', 'scan-line', 'scan-band', 'rd-marker', 'scan-table']) byId(id).hidden = true;
    for (const id of ['audio-controls', 'direction-controls', 'scan-controls']) byId(id).disabled = true;
    scanner?.stop();
    scanner = null;
    app.scanner = null;
    profiles = null;
    lastSource = null;
    lastScanStep = null;
    rdPoint = null;
    app.gridCells = [];
    renderSource();
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
        byId('retry').hidden = false;
        announce(app.text.checkError);
        return;
      }
      app.gridCells = app.createGridCells(app.pixels);
      const target = app.config.dominicanRepublic;
      const rgb = app.readPoint(app.pixels, target.x, target.y);
      const result = app.decompose(rgb);
      rdPoint = { ...target, rgb, result };
      app.rdPoint = rdPoint;
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
      renderGridTable();
      for (const id of ['grid', 'current', 'grid-table', 'scan-table']) byId(id).hidden = false;
      for (const id of ['audio-controls', 'direction-controls', 'scan-controls']) byId(id).disabled = false;
      announce(app.text.ready);
    } catch (error) {
      byId('retry').hidden = false;
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
      if (lastSource && !['playing', 'starting'].includes(scanner?.snapshot.state)) audio.play(lastSource.item.result);
      announce(app.text.audioReady + (audio.muted ? ' ' + app.text.muted : '') +
        (lastSource ? ' ' + sourceLabel() + ' ' + app.describeResult(lastSource.item.result).quantities : ''));
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
  byId('hear-ending-salt').addEventListener('click', () => {
    if (!lastScanStep || scanner?.snapshot.state !== 'ended' || scanner.snapshot.mode !== 'journey') return;
    // El botón promete repetir la columna final aunque la persona haya usado R
    // después del barrido. Restauramos explícitamente ese contexto primero.
    lastSource = { kind: 'scan', item: lastScanStep };
    renderScanReadout(lastScanStep);
    renderSource();
    const changes = app.selection.has('seaSalt') ? [] : app.selection.set('seaSalt', true);
    if (changes.length) changeSelection(changes);
    else {
      try { audio.play(lastScanStep.result); announce(app.text.endingSaltReplayed); }
      catch { announce(app.text.audioError); }
    }
  });
  byId('mode-journey').addEventListener('click', () => changeMode('journey'));
  byId('mode-world').addEventListener('click', () => changeMode('world'));
  byId('tempo').addEventListener('input', event => scanner?.setTempo(event.target.value));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    ++audioRequest;
    if (scanner?.pause()) announce(app.text.scanHidden);
  });
  for (const type of app.config.instrumentOrder) {
    byId('aerosol-' + type).addEventListener('change', event => {
      changeSelection(app.selection.set(type, event.target.checked));
    });
    byId('volume-' + type).addEventListener('input', event => {
      audio.setVolume(type, event.target.value);
      renderSelector();
    });
  }
  byId('toggle-all').addEventListener('click', () => changeSelection(app.selection.toggleAll()));
  byId('go-rd').addEventListener('click', goToDominicanRepublic);
  const guide = byId('guide-dialog');
  document.querySelectorAll('[data-guide-open]').forEach(button => {
    button.addEventListener('click', () => {
      if (guide.showModal) guide.showModal();
      else guide.setAttribute('open', '');
    });
  });
  byId('guide-close').addEventListener('click', () => {
    if (guide.close) guide.close();
    else guide.removeAttribute('open');
  });
  guide.addEventListener('click', event => {
    if (event.target === guide && guide.close) guide.close();
  });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
    if (event.key === 'Escape') { event.preventDefault(); stop(); return; }
    const editing = event.target.closest('textarea, select, [contenteditable="true"], input:not([type="checkbox"]):not([type="range"])');
    if (!editing && (app.config.aerosolShortcuts[event.key] || event.key === '8')) {
      event.preventDefault();
      changeSelection(event.key === '8' ? app.selection.toggleAll() : app.selection.toggle(app.config.aerosolShortcuts[event.key]));
      return;
    }
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key.toLowerCase() === 'r') { event.preventDefault(); goToDominicanRepublic(); return; }
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
  renderSelector();
  load();
})();
