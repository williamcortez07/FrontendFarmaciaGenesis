const TOPBAR_SELECTOR = "#header-target";
const TOPBAR_FRAGMENT = "../pages/components/topbar.html";

async function loadTopbar() {
  const target = document.querySelector(TOPBAR_SELECTOR);
  if (!target) return;

  try {
    const response = await fetch(TOPBAR_FRAGMENT);
    if (!response.ok)
      throw new Error(`Error cargando topbar: ${response.status}`);
    target.innerHTML = await response.text();
    if (typeof window.initSidebarMenu === "function") {
      window.initSidebarMenu();
    }
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", loadTopbar);
