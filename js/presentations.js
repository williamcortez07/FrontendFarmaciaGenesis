document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("presentatationModal");
  const btnOpen = document.getElementById("btnOpenModal");
  const btnClose = document.getElementById("btnCloseModal");
  const btnCancel = document.getElementById("btnCancelModal");

  const closeModal = () => {
    if (modal) {
      modal.classList.remove("active");
    }
  };

  if (btnOpen && modal) {
    btnOpen.addEventListener("click", () => modal.classList.add("active"));
  }

  if (btnClose) {
    btnClose.addEventListener("click", closeModal);
  }

  if (btnCancel) {
    btnCancel.addEventListener("click", closeModal);
  }

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
});
