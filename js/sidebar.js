const SIDEBAR_SELECTOR = "#sidebar-target";
const SIDEBAR_FRAGMENT = "../pages/components/sidebar.html";

async function loadSidebar() {
  const target = document.querySelector(SIDEBAR_SELECTOR);
  if (!target) return;

  try {
    const response = await fetch(SIDEBAR_FRAGMENT);
    if (!response.ok)
      throw new Error(`Error cargando sidebar: ${response.status}`);
    target.innerHTML = await response.text();
    initSidebarMenu();
  } catch (error) {
    console.error(error);
  }
}

function initSidebarMenu() {
  const menuBtn = document.getElementById("mobile-menu-btn");
  const appLayout = document.querySelector(".app-layout");
  if (!menuBtn || !appLayout) return;

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

document.addEventListener("DOMContentLoaded", loadSidebar);
