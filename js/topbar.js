const TOPBAR_SELECTOR = "#header-target";
const TOPBAR_FRAGMENT = "../pages/components/topbar.html";

async function loadTopbar() {
  const target = document.querySelector(TOPBAR_SELECTOR);
  if (!target) return;

  try {
    const response = await fetch(TOPBAR_FRAGMENT);

    if (!response.ok) {
      throw new Error(`Error cargando topbar: ${response.status}`);
    }

    target.innerHTML = await response.text();

    // Mostrar información del usuario
    setUserInfo();

    // Inicializar menú
    if (typeof window.initSidebarMenu === "function") {
      window.initSidebarMenu();
    }
  } catch (error) {
    console.error(error);
  }
}

function setUserInfo() {
  const token = localStorage.getItem("tokenFarmacia");

  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    const userNameElement = document.querySelector(".user-name-mini");
    const avatarElement = document.querySelector(".avatar-mini");

    if (userNameElement) {
      userNameElement.textContent = payload.name;
    }

    if (avatarElement) {
      const initials = payload.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();

      avatarElement.textContent = initials;
    }
  } catch (error) {
    console.error("Error leyendo token:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadTopbar);
