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

  // 2. Lógica para fetch del contenido de la vista
  fetch(`./pages/components/${viewName}.html`)
    .then((response) => response.text())
    .then((html) => {
      container.innerHTML = html;
      btnSingIn.addEventListener("click", () => {
        continer.classList.remove("toogle");
        const continer = document.querySelector(".continer");
        const btnSingIn = document.getElementById("btn-sing-in");
        const btnLoginSubmit = document.getElementById("btn-login-submit");

        if (btnSingIn && continer) {
          btnSingIn.addEventListener("click", () => {
            continer.classList.remove("toogle");
          });
        }

        if (btnLoginSubmit) {
          btnLoginSubmit.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "/pages/components/sidebar.html";
          });
        }
      });
    })
    .catch((err) => console.error("Error al cargar la vista:", err));
}
