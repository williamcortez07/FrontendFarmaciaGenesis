/* ==========================================================================
   INVENTORY ACTIONS & MODALS LOGIC
   Ruta: ../js/inventory.js
   ========================================================================== */

(function () {
  console.log("inventory.js cargado correctamente con soporte para modales.");

  document.addEventListener("DOMContentLoaded", function () {
    initInventory();
  });

  function initInventory() {
    // Referencias a los Modales del DOM
    const modalNuevo = document.getElementById("modal-nuevo-producto");
    const modalEditar = document.getElementById("modal-editar-producto");
    const btnNuevoProducto = document.getElementById("btn-nuevo-producto");
    const formNuevo = document.getElementById("form-nuevo-producto");
    const formEditar = document.getElementById("form-editar-producto");
    const tbodyProductos = document.getElementById("tbody-productos");
    const searchInput = document.getElementById("search-productos");
    const tabButtons = document.querySelectorAll(".report-tabs [data-tab]");
    const panels = document.querySelectorAll(".report-panel");

    // ==========================================
    // FUNCIONES DE CONTROL (APERTURA / CIERRE
    // ==========================================
    function openModal(modal) {
      if (modal) {
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        const firstInput = modal.querySelector("input, select");
        if (firstInput) firstInput.focus();
      }
    }

    function closeModal(modal) {
      if (modal) {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }
    }

    // Cierre general mediante botones [data-close-modal] o backdrop de fondo
    document.querySelectorAll("[data-close-modal]").forEach((element) => {
      element.addEventListener("click", function () {
        closeModal(modalNuevo);
        closeModal(modalEditar);
      });
    });

    // Cerrar con tecla Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeModal(modalNuevo);
        closeModal(modalEditar);
      }
    });

    // ==========================================
    // 1. CONTROL: MODAL NUEVO PRODUCTO
    // ==========================================
    if (btnNuevoProducto) {
      btnNuevoProducto.addEventListener("click", function () {
        if (formNuevo) formNuevo.reset();
        openModal(modalNuevo);
      });
    }

    if (formNuevo) {
      formNuevo.addEventListener("submit", function (e) {
        e.preventDefault();
        alert("¡Fármaco registrado exitosamente en la base de datos de Farmacia Génesis!");
        closeModal(modalNuevo);
      });
    }

    // ==========================================
    // 2. CONTROL: MODAL EDITAR PRODUCTO (Fila de la Tabla)
    // ==========================================
    if (tbodyProductos) {
      tbodyProductos.addEventListener("click", function (e) {
        const editBtn = e.target.closest("[data-edit]");
        if (editBtn) {
          const row = editBtn.closest("tr");
          const codigo = row.getAttribute("data-codigo") || "";
          const nombre = row.getAttribute("data-nombre") || "";
          const presentacion = row.getAttribute("data-presentacion") || "";
          const categoria = row.getAttribute("data-categoria") || "";
          const stock = row.getAttribute("data-stock") || "0";
          const precio = row.getAttribute("data-precio") || "0";
          // Inyectar datos recolectados en el Modal de Edición
          const fieldCodigo = document.getElementById("edit-codigo");
          const fieldNombre = document.getElementById("edit-nombre");
          const fieldPresentacion = document.getElementById("edit-presentacion");
          const fieldCategoria = document.getElementById("edit-categoria");
          const fieldStock = document.getElementById("edit-stock");
          const fieldPrecio = document.getElementById("edit-precio");
          if (fieldCodigo) fieldCodigo.value = codigo;
          if (fieldNombre) fieldNombre.value = nombre;
          if (fieldPresentacion) fieldPresentacion.value = presentacion;
          if (fieldCategoria) fieldCategoria.value = categoria;
          if (fieldStock) fieldStock.value = stock;
          if (fieldPrecio) fieldPrecio.value = precio;
          openModal(modalEditar);
        }
      });
    }

    if (formEditar) {
      formEditar.addEventListener("submit", function (e) {
        e.preventDefault();
        alert("Los cambios del fármaco han sido guardados con éxito!");
        closeModal(modalEditar);
      });
    }

    // ==========================================
    // 3. BUSCADOR INTERACTIVO EN TIEMPO REAL
    // ==========================================
    if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        const tableRows = document.querySelectorAll("#tbody-productos tr");
        tableRows.forEach(function (row) {
          const codeText = row.querySelector("td code")?.textContent.toLowerCase() || "";
          const mainText = row.querySelector(".cell-main")?.textContent.toLowerCase() || "";
          const subText = row.querySelector(".cell-sub")?.textContent.toLowerCase() || "";
          if (codeText.includes(searchTerm) || mainText.includes(searchTerm) || subText.includes(searchTerm)) {
            row.style.display = "";
          } else {
            row.style.display = "none";
          }
        });
      });
    }

    // ==========================================
    // 4. ACCIÓN: EXPORTAR EXCEL
    // ==========================================
    const btnExportar = document.getElementById("btn-exportar");
    if (btnExportar) {
      btnExportar.addEventListener("click", function () {
        alert("Generando archivo Excel (.xlsx)... Descarga iniciada!");
      });
    }

    // ==========================================
    // 5. TABS LOGIC (Cambiar entre paneles
    // ==========================================
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;
        tabButtons.forEach(b => {
          b.classList.remove("is-active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
        panels.forEach(p => {
          if (p.dataset.tab === target) {
            p.hidden = false;
          } else {
            p.hidden = true;
          }
        });
      });
    });

    console.log("inventory.js inicializado correctamente!");
  }
})();
