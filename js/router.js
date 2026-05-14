const appRoot = document.getElementById("app-root");
const pageStyle = document.getElementById("page-style");

function setActiveStyleSheet(href) {
  if (pageStyle) pageStyle.href = href;
}

function clearDynamicStyles() {
  document
    .querySelectorAll("link[data-dynamic-style]")
    .forEach((link) => link.remove());
}

function addDynamicStyle(href) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.dynamicStyle = "true";
  document.head.appendChild(link);
}

function loadLoginStyles() {
  clearDynamicStyles();
  setActiveStyleSheet("./css/components/login.css");
}

function loadDashboardStyles() {
  clearDynamicStyles();
  setActiveStyleSheet("./css/layout/home.css");
  [
    "./css/components/sidebar.css",
    "./css/components/topbar.css",
    "./css/components/footer.css",
  ].forEach(addDynamicStyle);
}

/**
 * 1. GESTIÓN DE ESTADO
 */
const state = {
  isAuthenticated: () => localStorage.getItem("token") !== null,
  currentView: "login",
};

/*
 * 2. NAVEGADOR PRINCIPAL
 */
async function initApp() {
  if (state.isAuthenticated()) {
    await loadDashboard();
  } else {
    await loadLogin();
  }
}

/**
  3. VISTA: LOGIN

  */
async function loadLogin() {
  loadLoginStyles();
  appRoot.className = "auth-mode";

  // 1. Cargamos el HTML
  const response = await fetch("/pages/components/login.html");
  appRoot.innerHTML = await response.text();

  // 2. Buscamos el botón DESPUÉS de insertar el HTML
  const btnLogin = document.getElementById("btn-login-submit");

  if (btnLogin) {
    btnLogin.addEventListener("click", async (event) => {
      event.preventDefault();
      
      const userName = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      if (!userName || !password) {
        alert("Por favor, ingresa tu usuario y contraseña.");
        return;
      }

      try {
        const response = await fetch("https://localhost:7204/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userName: userName,
            password: password
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // GUARDAMOS CON EL MISMO NOMBRE QUE EL STATE
          localStorage.setItem("tokenFarmacia", data.token); 
          
          // NO USES window.location.href. 
          // Simplemente vuelve a ejecutar initApp() para que detecte el token y cargue el dashboard.
          window.location.href = "/pages/home.html";
        } else {
          alert("Credenciales incorrectas.");
        }
      } catch (error) {
        console.error("Error:", error);
        window.alert("El servidor no responde.");
      }
    });
  }
}

/**
 * 4. VISTA: DASHBOARD
 */
async function loadDashboard() {
  loadDashboardStyles();
  appRoot.className = "app-layout";

  // Inyectamos un casco de layout que reserva espacio antes de cargar los componentes
  appRoot.innerHTML = `
    <aside id="sidebar-target" class="main-sidebar" aria-label="Navegación">
      <div class="sidebar-placeholder skeleton-loader"></div>
    </aside>
    <div id="header-target" class="main-header" aria-label="Barra superior">
      <div class="header-placeholder skeleton-loader"></div>
    </div>
    <main id="content-target" class="main-content" aria-label="Contenido principal">
      <div class="content-placeholder skeleton-loader"></div>
    </main>
    <div id="footer-target" aria-label="Pie de página">
      <div class="footer-placeholder skeleton-loader"></div>
    </div>
  `;

  await Promise.all([
    loadFragment("#sidebar-target", "./pages/components/sidebar.html"),
    loadFragment("#header-target", "./pages/components/topbar.html"),
    loadFragment("#footer-target", "./pages/components/footer.html"),
  ]);

  renderDashboardContent();
  initDashboardInteractions();
}

function renderDashboardContent() {
  const contentTarget = document.querySelector("#content-target");
  if (!contentTarget) return;

  contentTarget.innerHTML = `

  `;
}

/**
 * 5. FUNCIONES AUXILIARES
 */
async function loadFragment(targetSelector, url) {
  const target = document.querySelector(targetSelector);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error 404 en ${url}`);
    target.innerHTML = await res.text();
  } catch (err) {
    console.error(err);
  }
}

function initDashboardInteractions() {
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      initApp();
    });
  }

  const menuBtn = document.getElementById("mobile-menu-btn");
  const appLayout = document.querySelector(".app-layout");
  if (menuBtn && appLayout) {
    menuBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      appLayout.classList.toggle("sidebar-mobile-open");
    });

    document.addEventListener("click", (event) => {
      if (!appLayout.classList.contains("sidebar-mobile-open")) return;
      const sidebar = document.querySelector(".main-sidebar");
      if (
        sidebar &&
        !sidebar.contains(event.target) &&
        !menuBtn.contains(event.target)
      ) {
        appLayout.classList.remove("sidebar-mobile-open");
      }
    });
  }
}

// Arrancar la aplicación
window.addEventListener("DOMContentLoaded", initApp);
