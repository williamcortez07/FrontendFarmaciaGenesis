import { renderGlobalPagination, updatePaginationInfo } from './utils/pagination.js';

document.addEventListener("DOMContentLoaded", () => {
  // 1. Variables de paginación
  let currentPage = 1;
  const pageSize = 10;

  const modal = document.getElementById("productModal");
  const openBtn = document.getElementById("btnAddProduct");
  const form = document.getElementById("productForm");
  const closeSelector = "[data-close-modal]";

  if (!modal || !openBtn) return;

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const firstInput = form && form.querySelector("input, select");
    if (firstInput) firstInput.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  openBtn.addEventListener("click", openModal);

  modal.querySelectorAll(closeSelector).forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  // 2. Corrección del baseURL (https://)
  const API_CONFIG = {
    baseURL: "https://localhost:7204/api",
    endpoints: {
      products: "/Products",
      suppliers: "/Suppliers",
      categories: "/Categories",
      presentations: "/Presentation",
      brands: "/Brands",
    },
    tokenKey: "tuTokenKey" // Asegúrate de tener esto definido si usas JWT
  };

  async function getSuppliers() {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}`);
      const resultado = await response.json();
      const select = document.getElementById("fieldProvider");
      resultado.data.forEach((supplier) => {
        const option = document.createElement("option");
        option.value = supplier.supplierId;
        option.textContent = supplier.supplierName;
        select.appendChild(option);
      });
    } catch (error) {
      console.log("Se generó un error:", error);
    }
  }

  async function getCategories() {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.categories}`);
      const resultado = await response.json();
      const select = document.getElementById("fieldCategory");
      resultado.data.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
      });
    } catch (error) {
      console.log("Se generó un error:", error);
    }
  }

  async function getPresentations() {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.presentations}`);
      const resultado = await response.json();
      const select = document.getElementById("fieldPresentation");
      resultado.data.forEach((presentation) => {
        const option = document.createElement("option");
        option.value = presentation.id;
        option.textContent = presentation.description;
        select.appendChild(option);
      });
    } catch (error) {
      console.log("Ha ocurrido un error", error);
    }
  }

  async function getBrands() {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.brands}`);
      const resultado = await response.json();
      const select = document.getElementById("fieldBrand");
      resultado.data.forEach((brands) => {
        const option = document.createElement("option");
        option.value = brands.brandId;
        option.textContent = brands.brandName;
        select.appendChild(option);
      });
    } catch (error) {
      console.log("Ha ocurrido un error", error);
    }
  }

  // 3. Integración de paginación en getProducts
  async function getProducts(page = currentPage, size = pageSize) {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.products}/paged?page=${page}&limit=${size}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem(API_CONFIG.tokenKey)}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      renderProductsTable(result.data);

      // Llamada a las utilidades importadas
      updatePaginationInfo(
        result.meta.currentPage,
        result.meta.itemsPerPage,
        result.meta.totalItems,
        "paginationInfo",
        "Productos"
      );

      renderGlobalPagination(
        result.meta.totalPages,
        result.meta.currentPage,
        "paginationContainer",
        async (newPage) => {
          currentPage = newPage;
          await getProducts(currentPage, pageSize);
        }
      );

    } catch (error) {
      console.log(error);
    }
  }

  // 4. Corrección de variables dentro de la tabla
  function renderProductsTable(products) {
    const tbody = document.querySelector(".products-table tbody");
    if (!tbody) return;

    if (!products || products.length === 0) {
      tbody.innerHTML = `
        <tr>
            <td colspan="9" class="empty-state">
                <i class="fas fa-box-open" style="font-size: 48px; color: #6c757d;"></i>
                <p>No hay productos registrados</p>
                <button id="btnOpenModalEmpty" class="btn btn-primary btn-sm">
                    <i class="fas fa-plus"></i> Registrar primer producto
                </button>
            </td>
        </tr>
      `;
      const emptyBtn = document.getElementById("btnOpenModalEmpty");
      if (emptyBtn) {
        emptyBtn.addEventListener("click", () => openModal());
      }
      return;
    }

    tbody.innerHTML = products.map((product) => `
        <tr data-product-id="${product.productId}">
            <td>${formatId(product.productId)}</td>
            <td><span class="cell-main">${escapeHtml(product.tradeName)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.genericName)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.categoryName)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.presentationName)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.porcentage || "")}</span></td>
            <td><span class="cell-main">${escapeHtml(product.supplierName)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.brandName)}</span></td>
            <td>
                <span class="badge ${product.isActive ? "status-active" : "status-inactive"}">
                    ${product.isActive ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td class="col-actions">
                <button
                    class="btn-icon btn-icon--edit"
                    onclick="editProduct(${product.productId})"
                    title="Editar ${escapeHtml(product.genericName)}"
                    aria-label="Editar producto ${escapeHtml(product.genericName)}"
                >
                    <i class="fas fa-edit" aria-hidden="true"></i>
                </button>
            </td>
        </tr>
      `).join("");
  }

  async function addProducts() {
    const btnsubmit = document.getElementById("btnSaveProduct");
    if (!btnsubmit) return;

    btnsubmit.addEventListener("click", async (event) => {
      event.preventDefault();
      const genericName = document.getElementById("fieldGenericName").value;
      const tradeName = document.getElementById("fieldTradeName").value;
      const idSupplier = parseInt(document.getElementById("fieldProvider").value);
      const idCategory = parseInt(document.getElementById("fieldCategory").value);
      const idPresentation = parseInt(document.getElementById("fieldPresentation").value);
      const idbrand = parseInt(document.getElementById("fieldBrand").value);

      if (!genericName || !tradeName || !idSupplier || !idCategory || !idbrand) {
        alert("Debe completar los campos solicitados");
        return;
      }

      try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.products}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            genericName: genericName,
            tradeName: tradeName,
            supplierId: idSupplier,
            categoryId: idCategory,
            concentrationId: 1, // ¿Este valor es fijo?
            presentationId: idPresentation,
            brandId: idbrand,
          }),
        });

        if (response.ok) {
          alert("Producto guardado con éxito");
          closeModal();
          // Volvemos a la página 1 después de guardar
          currentPage = 1;
          getProducts();
        } else {
            alert(`Ocurrió un error: ${response.status}`);
        }
      } catch (error) {
        console.log("Ocurrió un error", error);
      }
    });
  }

  function formatId(id) {
    return `#${String(id).padStart(3, "0")}`;
  }

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Inicialización de la pantalla
  getSuppliers();
  getCategories();
  getPresentations();
  getBrands();
  getProducts();
  addProducts();
});

// Función global para editar
window.editProduct = function(id) {
    console.log("Editando producto con ID:", id);
    // Lógica para abrir modal y cargar datos del producto
};