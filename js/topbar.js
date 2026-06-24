const TOPBAR_SELECTOR = "#header-target";
const TOPBAR_FRAGMENT = "../pages/components/topbar.html";

async function loadTopbar() {
  const target = document.querySelector(TOPBAR_SELECTOR);
  if (!target) return;

  try {
    const response = await fetch(TOPBAR_FRAGMENT);
    if (!response.ok) throw new Error(`Error cargando topbar: ${response.status}`);
    
    target.innerHTML = await response.text();

    setUserInfo();
    initNotifications();
    
    cargarAlertasGlobales(); 

    if (typeof window.initSidebarMenu === "function") {
      window.initSidebarMenu();
    }
  } catch (error) {
    console.error(error);
  }
}

function initNotifications() {
  const btnNotificaciones = document.getElementById("btnNotificaciones");
  const alertsDropdown = document.getElementById("alertsDropdown");

  if (btnNotificaciones && alertsDropdown) {
    btnNotificaciones.addEventListener("click", (e) => {
      e.stopPropagation();
      alertsDropdown.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!alertsDropdown.contains(e.target) && !btnNotificaciones.contains(e.target)) {
        alertsDropdown.classList.remove("show");
      }
    });
  }
}

async function cargarAlertasGlobales() {
  const homeAlertasList = document.getElementById("homeAlertasList");
  const alertsCount = document.getElementById("alertsCount");

  if (!homeAlertasList || !alertsCount) return;

  try {
    const response = await fetch("https://localhost:7204/api/Inventory/dashboard?page=1&limit=1000");
    if (!response.ok) throw new Error("Error cargando alertas");

    const { data } = await response.json();
    let alertasGeneradas = [];

    // A) Vencimientos
    const lotesProblematicos = data.batches.filter(b => b.estadoLote === "Por vencer" || b.estadoLote === "Vencido");
    lotesProblematicos.forEach(lote => {
      const prod = data.items.find(p => p.productId === lote.productId);
      alertasGeneradas.push({
        tipo: lote.estadoLote === "Vencido" ? "danger" : "warning",
        icono: "fa-triangle-exclamation",
        nombre: prod ? prod.producto : "Desconocido",
        descripcion: `${lote.estadoLote} — Lote #${lote.numeroLote}`,
        prioridad: lote.estadoLote === "Vencido" ? 1 : 2
      });
    });

    // B) Stock
    const productosSinStock = data.items.filter(p => p.estado === "Critico" || p.estado === "Agotado");
    productosSinStock.forEach(prod => {
      const isAgotado = prod.estado === "Agotado";
      alertasGeneradas.push({
        tipo: isAgotado ? "danger" : "warning",
        icono: "fa-boxes-stacked",
        nombre: prod.producto,
        descripcion: isAgotado ? "Agotado" : `Pocas uds: ${prod.existencia}`,
        prioridad: isAgotado ? 1 : 3
      });
    });

    // C) Ordenar y pintar
    alertasGeneradas.sort((a, b) => a.prioridad - b.prioridad);
    const topAlertas = alertasGeneradas.slice(0, 5);
    
    alertsCount.textContent = alertasGeneradas.length;
    homeAlertasList.innerHTML = "";

    if (topAlertas.length === 0) {
      homeAlertasList.innerHTML = `<p style="text-align:center; padding:1rem; color: #666; margin:0;">No hay alertas pendientes.</p>`;
      return;
    }

    topAlertas.forEach(alerta => {
      homeAlertasList.innerHTML += `
        <div class="alert-item alert-item--${alerta.tipo}" role="listitem">
          <div class="alert-item__indicator alert-item__indicator--${alerta.tipo}"></div>
          <div class="alert-item__body">
            <div class="alert-item__icon" aria-hidden="true">
              <i class="fa-solid ${alerta.icono}"></i>
            </div>
            <div class="alert-item__text">
              <p class="alert-item__name">${alerta.nombre}</p>
              <p class="alert-item__desc">${alerta.descripcion}</p>
            </div>
          </div>
        </div>`;
    });

  } catch (error) {
    console.error("Error al cargar notificaciones:", error);
  }
}

function setUserInfo() {
  const token = localStorage.getItem("tokenFarmacia");
  if (!token) return;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userNameElement = document.querySelector(".user-name-mini");
    const avatarElement = document.querySelector(".avatar-mini");

    if (userNameElement) userNameElement.textContent = payload.name;
    if (avatarElement) {
      avatarElement.textContent = payload.name.split(" ").map(w => w[0]).join("").toUpperCase();
    }
  } catch (error) {
    console.error("Error leyendo token:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadTopbar);