'use strict';

(() => {
  const app = window.ListenToEarth;
  document.querySelectorAll('[data-text]').forEach(node => {
    node.textContent = app.text[node.dataset.text];
  });
  document.title = app.text.title;
  const guide = document.getElementById('guide-dialog');
  document.querySelectorAll('[data-guide-open]').forEach(button => {
    button.addEventListener('click', () => guide.showModal());
  });
  document.getElementById('guide-close').addEventListener('click', () => guide.close());
  guide.addEventListener('click', event => {
    if (event.target === guide) guide.close();
  });
})();
