document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("sales-modal");
  const openButton = document.querySelector(".btn-new-sale");
  const closeButtons = modal ? modal.querySelectorAll("[data-close-modal]") : [];

  const detailsSubtitle = document.getElementById("details-subtitle");
  const detailsBody = document.getElementById("details-table-body");

  const salesDetails = {
    "sale-1": {
      user: "William Cortez",
      date: "20 abril 2026",
      total: "C$ 10",
      payment: "Efectivo",
      items: [
        { product: "Acetaminofén", unit: "C$ 10", quantity: 1, subtotal: "C$ 10", payment: "Efectivo", date: "20-04-2026 22:47:10" }
      ]
    },
    "sale-2": {
      user: "William Cortez",
      date: "20 abril 2026",
      total: "C$ 140",
      payment: "Tarjeta",
      items: [
        { product: "Dextrometorfano", unit: "C$ 40", quantity: 2, subtotal: "C$ 80", payment: "Tarjeta", date: "20-04-2026 22:50:12" },
        { product: "Levodropropizina", unit: "C$ 30", quantity: 2, subtotal: "C$ 60", payment: "Tarjeta", date: "20-04-2026 22:50:12" }
      ]
    },
    "sale-3": {
      user: "William Cortez",
      date: "20 abril 2026",
      total: "C$ 10",
      payment: "Depósito",
      items: [
        { product: "Cloperastina", unit: "C$ 10", quantity: 1, subtotal: "C$ 10", payment: "Depósito", date: "20-04-2026 22:52:18" }
      ]
    },
    "sale-4": {
      user: "William Cortez",
      date: "21 abril 2026",
      total: "C$ 40",
      payment: "Efectivo",
      items: [
        { product: "Omeprazol", unit: "C$ 40", quantity: 1, subtotal: "C$ 40", payment: "Efectivo", date: "21-04-2026 09:12:03" }
      ]
    },
    "sale-5": {
      user: "Roberto Mendieta",
      date: "21 abril 2026",
      total: "C$ 50",
      payment: "Efectivo",
      items: [
        { product: "Zepol", unit: "C$ 50", quantity: 1, subtotal: "C$ 50", payment: "Efectivo", date: "21-04-2026 10:05:30" }
      ]
    },
    "sale-6": {
      user: "Roberto Mendieta",
      date: "21 abril 2026",
      total: "C$ 52",
      payment: "Tarjeta",
      items: [
        { product: "Antigripal", unit: "C$ 26", quantity: 2, subtotal: "C$ 52", payment: "Tarjeta", date: "21-04-2026 10:18:55" }
      ]
    },
    "sale-7": {
      user: "Roberto Mendieta",
      date: "21 abril 2026",
      total: "C$ 53",
      payment: "Depósito",
      items: [
        { product: "Ibuprofén", unit: "C$ 26.50", quantity: 2, subtotal: "C$ 53", payment: "Depósito", date: "21-04-2026 10:26:44" }
      ]
    },
    "sale-8": {
      user: "Roberto Mendieta",
      date: "21 abril 2026",
      total: "C$ 55",
      payment: "Efectivo",
      items: [
        { product: "Vitamina C", unit: "C$ 55", quantity: 1, subtotal: "C$ 55", payment: "Efectivo", date: "21-04-2026 10:45:12" }
      ]
    }
  };

  function renderSaleDetails(saleId) {
    const sale = salesDetails[saleId];
    if (!sale || !detailsBody || !detailsSubtitle) return;

    detailsSubtitle.textContent = `Venta de ${sale.user} - ${sale.total} (${sale.date})`;
    detailsBody.innerHTML = sale.items
      .map(
        (item) =>
          `<tr><td>${item.product}</td><td>${item.unit}</td><td>${item.quantity}</td><td>${item.subtotal}</td><td>${item.payment}</td><td>${item.date}</td></tr>`
      )
      .join("");
  }

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

  const saleButtons = document.querySelectorAll(".btn-icon[data-sale-id]");
  saleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      renderSaleDetails(button.dataset.saleId);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideModal();
    }
  });
});
