async function loadComponent(selector, url) {
  const container = document.querySelector(selector);
  if (!container) return;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error ${response.status}`);
    container.innerHTML = await response.text();
  } catch (error) {
    console.error(`Error cargando componente: ${url}`, error);
  }
}

function initPageComponents() {
  // Rutas relativas a la página actual (ej. pages/catalogs.html → pages/components/…)
  loadComponent('#sidebar-container', 'components/sidebar.html');
  loadComponent('#footer-container', 'components/footer.html');
}

document.addEventListener('DOMContentLoaded', initPageComponents);
