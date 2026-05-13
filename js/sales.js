document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("sales-modal");
  const openButton = document.querySelector(".btn-new-sale");
  const closeButtons = modal ? modal.querySelectorAll("[data-close-modal]") : [];

  function showModal() {
    if (!modal) return;
    modal.classList.add("modal-visible");
    modal.classList.remove("modal-hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function hideModal() {
    if (!modal) return;
    modal.classList.remove("modal-visible");
    modal.classList.add("modal-hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  if (openButton) {
    openButton.addEventListener("click", showModal);
  }

  closeButtons.forEach((button) => {
    button.addEventListener("click", hideModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideModal();
    }
  });
});
