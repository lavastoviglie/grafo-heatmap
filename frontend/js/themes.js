function applyTheme(theme) {
  const app = document.getElementById('app');
  app.className = app.className.replace(/theme-\w+/g, '').trim();
  app.classList.add(`theme-${theme}`);
}
