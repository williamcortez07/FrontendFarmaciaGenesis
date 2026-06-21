const FOOTER_SELECTOR = "#footer-target";
const FOOTER_FRAGMENT = "../pages/components/footer.html";

async function loadFooter() {
  const target = document.querySelector(FOOTER_SELECTOR);
  if (!target) return;

  try {
    const response = await fetch(FOOTER_FRAGMENT);
    if (!response.ok)
      throw new Error(`Error cargando footer: ${response.status}`);
    target.innerHTML = await response.text();
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", loadFooter);
