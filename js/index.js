// Función para cargar componentes dinámicos
function isAuthenticated() {
  return localStorage.getItem("token") !== null;
}

function init() {
  if (isAuthenticated()) {
    loadComponent("home");
  } else {
    loadComponent("login");
  }
}
window.addEventListener("DOMContentLoaded", init);
function loadComponent(viewName) {
  console.log(`Cargando vista: ${viewName}`);

  const container = document.getElementById("main-content");

  fetch(`./pages/components/${viewName}.html`)
    .then((response) => response.text())
    .then((html) => {
      container.innerHTML = html;
    })

    .catch((err) => console.error("Error al cargar la vista:", err));
}
