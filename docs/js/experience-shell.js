'use strict';

(() => {
  const mode = document.body.dataset.pageMode;
  if (!['viaje', 'planeta', 'explorar'].includes(mode)) throw new Error('Modo de experiencia no válido.');

  document.body.insertAdjacentHTML('afterbegin', `
    <a class="skip" href="#content" data-text="skip"></a>
    <header class="site-header">
      <a class="brand" href="index.html">Listen to Earth</a>
      <nav aria-label="Navegación principal">
        <a href="experiencias.html">Experiencias</a>
        <a href="guia.html">Guía de uso</a>
        <a href="creditos.html">Créditos y fuentes</a>
      </nav>
    </header>

    <main id="content" tabindex="-1">
      <div class="page-shell">
        <section class="experience-banner" aria-labelledby="experience-page-title">
          <a href="experiencias.html" class="back-link" data-text="backExperiences"></a>
          <p id="experience-page-eyebrow" class="eyebrow"></p>
          <h1 id="experience-page-title"></h1>
          <p id="experience-page-description"></p>
          <a id="alternate-experience" class="alternate-link" href="experiencias.html"></a>
        </section>
        <p id="status" class="status" role="status" aria-live="polite" aria-atomic="true"></p>
        <button id="retry" class="button secondary" type="button" data-text="retry" hidden></button>

        <section id="aerosols" class="section-block setup-section" aria-labelledby="selection-title">
          <div class="section-heading"><p class="section-number" aria-hidden="true">01</p><div>
            <p class="eyebrow" data-text="mixerEyebrow"></p><h2 id="selection-title" data-text="selectionTitle"></h2><p id="selection-help" data-text="selectionHelp"></p>
          </div></div>
          <fieldset id="aerosol-controls" class="aerosol-controls" aria-describedby="selection-help">
            <legend class="visually-hidden" data-text="selectionTitle"></legend>
            <div class="listening-mode"><div><strong data-text="soloModeTitle"></strong><p data-text="soloModeDescription"></p></div><label class="mix-switch" for="mix-mode"><input id="mix-mode" type="checkbox"><span data-text="mixModeLabel"></span></label></div>
            <div class="aerosol-grid">
              <div class="aerosol-card aerosol-dust"><div class="instrument-choice"><input id="aerosol-dust" type="checkbox" checked aria-keyshortcuts="4"><label for="aerosol-dust" data-text="toggleDust"></label></div><label for="volume-dust" data-text="volumeDust"></label><div class="volume-row"><input id="volume-dust" type="range" min="0" max="100" step="1" value="50"><output id="volume-value-dust" for="volume-dust"></output></div></div>
              <div class="aerosol-card aerosol-carbon"><div class="instrument-choice"><input id="aerosol-blackCarbon" type="checkbox" aria-keyshortcuts="5"><label for="aerosol-blackCarbon" data-text="toggleBlackCarbon"></label></div><label for="volume-blackCarbon" data-text="volumeBlackCarbon"></label><div class="volume-row"><input id="volume-blackCarbon" type="range" min="0" max="100" step="1" value="50"><output id="volume-value-blackCarbon" for="volume-blackCarbon"></output></div></div>
              <div class="aerosol-card aerosol-sulfate"><div class="instrument-choice"><input id="aerosol-sulfate" type="checkbox" aria-keyshortcuts="6"><label for="aerosol-sulfate" data-text="toggleSulfate"></label></div><label for="volume-sulfate" data-text="volumeSulfate"></label><div class="volume-row"><input id="volume-sulfate" type="range" min="0" max="100" step="1" value="50"><output id="volume-value-sulfate" for="volume-sulfate"></output></div></div>
              <div class="aerosol-card aerosol-salt"><div class="instrument-choice"><input id="aerosol-seaSalt" type="checkbox" aria-keyshortcuts="7"><label for="aerosol-seaSalt" data-text="toggleSeaSalt"></label></div><label for="volume-seaSalt" data-text="volumeSeaSalt"></label><div class="volume-row"><input id="volume-seaSalt" type="range" min="0" max="100" step="1" value="50"><output id="volume-value-seaSalt" for="volume-seaSalt"></output></div></div>
            </div>
            <div class="mixer-footer"><button id="toggle-all" class="button secondary" type="button" aria-keyshortcuts="8" data-text="allAerosols" hidden></button><p id="selection-summary"></p></div>
          </fieldset>
          <details class="compact-details"><summary data-text="mixerDetails"></summary><p data-text="selectionTiming"></p><p data-text="timbreNote"></p></details>
        </section>

        <div class="playback-workspace">
          <section id="experience" class="section-block playback-controls" aria-labelledby="scan-title">
            <div class="section-heading"><p class="section-number" aria-hidden="true">02</p><div><p class="eyebrow" data-text="scanEyebrow"></p><h2 id="scan-title" data-text="scanTitle"></h2><p id="scan-intro" data-text="scanIntro"></p></div></div>
            <fieldset id="scan-controls" class="scan-panel" disabled>
              <legend class="visually-hidden" data-text="scanControls"></legend>
              <input id="scan-mode" type="hidden" value="journey">
              <div class="mode-picker" role="group" data-label="modePickerLabel" aria-label=""><button id="mode-journey" class="mode-card" type="button" aria-pressed="true"><span class="mode-icon" aria-hidden="true">→</span><strong data-text="modeJourneyTitle"></strong><span data-text="modeJourneyDescription"></span></button><button id="mode-world" class="mode-card" type="button" aria-pressed="false"><span class="mode-icon" aria-hidden="true">◎</span><strong data-text="modeWorldTitle"></strong><span data-text="modeWorldDescription"></span></button></div>
              <div class="transport"><button id="scan-play" class="button primary" type="button" data-text="scanPlay"></button><button id="scan-repeat" class="button secondary" type="button" data-text="scanRepeat"></button><button id="scan-stop" class="button ghost" type="button" data-text="stop"></button><div class="tempo-control"><label for="tempo" data-text="tempoLabel"></label><input id="tempo" type="range" min="50" max="150" step="10" value="100"><output id="tempo-value" for="tempo"></output></div></div>
            </fieldset>
            <div class="route-context"><p id="scan-info" data-text="journeyInfo"></p><div class="progress-row"><label for="scan-progress" data-text="scanProgress"></label><progress id="scan-progress" max="30" value="0"></progress></div></div>
            <section id="journey-ending" class="journey-ending" aria-labelledby="journey-ending-title" hidden><p class="eyebrow" data-text="journeyEndingEyebrow"></p><h3 id="journey-ending-title" data-text="journeyEndingTitle"></h3><p id="journey-ending-text"></p><p data-text="journeyEndingAction"></p><button id="hear-ending-salt" class="button primary" type="button" aria-keyshortcuts="7" data-text="hearEndingSalt"></button></section>
          </section>

          <section id="map-explorer" class="section-block map-section" aria-labelledby="grid-title">
            <div class="section-heading"><p class="section-number" aria-hidden="true">03</p><div><p class="eyebrow" data-text="mapEyebrow"></p><h2 id="grid-title" data-text="gridTitle"></h2><p id="grid-help" data-text="gridHelp"></p></div></div>
            <fieldset id="audio-controls" class="audio-toolbar" disabled><legend class="visually-hidden" data-text="soundControls"></legend><button id="activate" class="button primary" type="button" data-text="activate"></button><button id="mute" class="button secondary" type="button" aria-pressed="false" data-text="mute"></button><button id="stop" class="button ghost" type="button" data-text="stop"></button><p id="audio-state"></p></fieldset>
            <figure id="image-panel" class="map-panel" aria-busy="true" tabindex="-1">
              <div class="map-view"><canvas id="map" width="1920" height="1080" role="img" aria-describedby="map-description" hidden><span data-text="canvasFallback"></span></canvas><div id="grid" role="grid" aria-labelledby="grid-title" aria-describedby="grid-help" aria-rowcount="8" aria-colcount="12" hidden></div><div id="scan-band" aria-hidden="true" hidden></div><div id="scan-line" aria-hidden="true" hidden></div><div id="rd-marker" aria-hidden="true" hidden></div></div>
              <figcaption id="map-description" data-text="description"></figcaption>
            </figure>
            <p id="scan-readout" class="data-readout map-readout" data-text="scanIdle"></p>
            <div class="explore-grid"><section id="current" class="current-card" aria-labelledby="current-title" hidden><p class="eyebrow" data-text="currentEyebrow"></p><h3 id="current-title" data-text="currentTitle"></h3><p id="readout"></p><p id="sound-source" class="source-info" data-text="sourceEmpty"></p></section><fieldset id="direction-controls" class="direction-card" disabled><legend data-text="directions"></legend><div class="directions"><button id="up" type="button" aria-controls="grid" data-text="upShort"></button><button id="left" type="button" aria-controls="grid" data-text="leftShort"></button><button id="replay" type="button" aria-controls="grid" data-text="replayShort"></button><button id="right" type="button" aria-controls="grid" data-text="rightShort"></button><button id="down" type="button" aria-controls="grid" data-text="downShort"></button></div><button id="go-rd" class="rd-button" type="button" aria-controls="grid current" aria-keyshortcuts="R" data-text="goDominicanRepublic"></button></fieldset></div>
            <p class="shortcut-line" data-text="shortcuts"></p>
          </section>
        </div>

        <section id="science" class="section-block science-block" aria-labelledby="science-title">
          <div class="section-heading"><p class="section-number" aria-hidden="true">04</p><div><p class="eyebrow" data-text="scienceEyebrow"></p><h2 id="science-title" data-text="scienceTitle"></h2><p data-text="scienceIntro"></p></div></div>
          <img class="colorbar" src="assets/aerosols_5669_colorbar.png" width="1500" height="300" loading="lazy" decoding="async" data-alt="legendAlt" alt="">
          <div class="data-details">
            <details id="grid-table" hidden><summary data-text="tableSummary"></summary><div class="table-scroll" role="region" aria-labelledby="grid-caption" tabindex="0"><table><caption id="grid-caption" data-text="gridCaption"></caption><thead><tr><th scope="col" data-text="position"></th><th scope="col" data-text="coordinatesHeading"></th><th scope="col" data-text="blackCarbon"></th><th scope="col" data-text="dust"></th><th scope="col" data-text="seaSalt"></th><th scope="col" data-text="sulfate"></th><th scope="col" data-text="residual"></th><th scope="col" data-text="soundHeading"></th></tr></thead><tbody id="grid-rows"></tbody></table></div></details>
            <details id="scan-table" hidden><summary data-text="scanTableSummary"></summary><div class="table-scroll" role="region" aria-labelledby="scan-caption" tabindex="0"><table><caption id="scan-caption" data-text="scanCaption"></caption><thead><tr><th scope="col" data-text="scanStep"></th><th scope="col" data-text="longitude"></th><th scope="col" data-text="blackCarbon"></th><th scope="col" data-text="dust"></th><th scope="col" data-text="seaSalt"></th><th scope="col" data-text="sulfate"></th><th scope="col" data-text="residual"></th><th scope="col" data-text="soundHeading"></th></tr></thead><tbody id="scan-rows"></tbody></table></div></details>
            <details id="diagnostics"><summary data-text="diagnostics"></summary><section id="checks" aria-labelledby="checks-title" hidden><h3 id="checks-title" data-text="checksTitle"></h3><p data-text="guardDescription"></p><div class="table-scroll" role="region" aria-labelledby="checks-title" tabindex="0"><table><caption data-text="tableCaption"></caption><thead><tr><th scope="col" data-text="zone"></th><th scope="col" data-text="blackCarbon"></th><th scope="col" data-text="dust"></th><th scope="col" data-text="seaSalt"></th><th scope="col" data-text="sulfate"></th><th scope="col" data-text="residual"></th><th scope="col" data-text="candidate"></th><th scope="col" data-text="result"></th></tr></thead><tbody id="check-rows"></tbody></table></div></section></details>
          </div>
          <div class="limitations"><p data-text="limitation"></p><p data-text="uncertainty"></p></div><p class="development" data-text="stageLimit"></p>
        </section>
      </div>
    </main>
    <footer><div><p class="footer-brand">Listen to Earth</p><p data-text="footer"></p></div><div class="footer-actions"><a href="guia.html">Guía de uso</a><a class="button ghost" href="creditos.html">Créditos y fuentes</a></div></footer>
  `);
})();
