import {
  renderGlobalPagination,
  updatePaginationInfo,
} from "./utils/pagination.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURACIÓN Y ESTADO DE LA APP ---
  let currentPage = 1;
  const pageSize = 10;
  const API_CONFIG = {
    baseURL: "https://localhost:7204/api",
    endpoints: {
      products: "/Products",
      suppliers: "/Suppliers",
      categories: "/Categories",
      presentations: "/Presentation",
      concentration: "/Concentrations",
      brands: "/Brands",
    },
    tokenKey: "tokenFarmacia",
  };

  let currentProductId = null;
  const modal = document.getElementById("productModal");
  const modalTitle = document.getElementById("productModalTitle");
  const productForm = document.getElementById("productForm");
  const btnOpen = document.getElementById("btnAddProduct");
  const tableBody = document.querySelector(".products-table tbody");
  const searchInput = document.getElementById("productSearch");

  function getHeaders(includeContentType = true) {
    const token = localStorage.getItem(API_CONFIG.tokenKey);
    const headers = {
      Accept: "application/json",
    };

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn(
        "No se encontró ningún token de autenticación en localStorage.",
      );
    }

    return headers;
  }

  const openModal = (isEdit = false) => {
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (isEdit) {
      if (modalTitle) modalTitle.textContent = "Editar Producto";
      toggleStatusField(true);
    } else {
      currentProductId = null;
      if (modalTitle) modalTitle.textContent = "Registrar Nuevo Producto";
      if (productForm) productForm.reset();
      toggleStatusField(false);
    }

    const firstInput =
      productForm && productForm.querySelector("input, select");
    if (firstInput) firstInput.focus();
  };

  const closeModal = () => {
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "";
    if (productForm) productForm.reset();
    currentProductId = null;
  };

  const toggleStatusField = (show) => {
    let statusGroup = document.getElementById("statusFormGroup");
    const actionsSection = productForm && productForm.querySelector(".product-modal__actions");

    if (show) {
      if (!statusGroup && actionsSection) {
        statusGroup = document.createElement("div");
        statusGroup.id = "statusFormGroup";
        statusGroup.className = "product-form__row product-form__row--2";
        statusGroup.innerHTML = `
          <div class="product-field">
            <label for="productStatus">Estado del Producto</label>
            <select id="productStatus" name="isActive">
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
        `;
        productForm.insertBefore(statusGroup, actionsSection);
      }
    } else {
      if (statusGroup) statusGroup.remove();
    }
  };

  if (btnOpen) btnOpen.addEventListener("click", () => openModal(false));

  if (modal) {
    modal.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal();
      });
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeModal();
    }
  });

  if (tableBody) {
    tableBody.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".btn-icon--edit");
      const emptyBtn = e.target.closest("#btnOpenModalEmpty");

      if (editBtn) {
        const id = editBtn.dataset.id;
        prepareEditModal(id);
      } else if (emptyBtn) {
        openModal(false);
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => searchProducts(e.target.value));
  }

  // --- CARGA DE CATÁLOGOS AUXILIARES ---
  async function loadSelectData(
    endpoint,
    elementId,
    valueField,
    textField,
    errorMsg,
  ) {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
        headers: getHeaders(false),
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      const select = document.getElementById(elementId);
      if (!select) return;

      select.innerHTML =
        select.innerHTML = `<option value="">Seleccione una opción</option>`;

      result.data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item[valueField];
        option.textContent = item[textField] || item.description || item.name;
        select.appendChild(option);
      });
    } catch (error) {
      console.error(`Error al cargar datos en ${elementId}:`, error);
      showToast(errorMsg, "error");
    }
  }

  async function getProducts(page = currentPage, size = pageSize) {
    try {
      showLoadingState();
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.products}/paged?page=${page}&limit=${size}`,
        {
          method: "GET",
          headers: getHeaders(false),
        },
      );

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const result = await response.json();
      renderProductsTable(result.data);

      updatePaginationInfo(
        result.meta.currentPage,
        result.meta.itemsPerPage,
        result.meta.totalItems,
        "paginationInfo",
        "Productos",
      );

      renderGlobalPagination(
        result.meta.totalPages,
        result.meta.currentPage,
        "paginationContainer",
        async (newPage) => {
          currentPage = newPage;
          await getProducts(currentPage, pageSize);
        },
      );
    } catch (error) {
      console.error("Error al obtener productos:", error);
      showErrorState(error.message);
    }
  }

  async function prepareEditModal(id) {
    try {
      showToast("Cargando datos del producto...", "info", 1500);
      currentProductId = id;

      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.products}/${id}`,
        {
          method: "GET",
          headers: getHeaders(false),
        },
      );

      if (!response.ok) throw new Error();

      const result = await response.json();
      const product = result.data || result;

      openModal(true);

      document.getElementById("fieldTradeName").value = product.tradeName || "";
      document.getElementById("fieldGenericName").value =
        product.genericName || "";
      document.getElementById("fieldProvider").value = product.supplierId || "";
      document.getElementById("fieldCategory").value = product.categoryId || "";
      document.getElementById("fieldPresentation").value =
        product.presentationId || "";
      document.getElementById("fieldConcentration").value =
        product.concentrationValue || "";
      document.getElementById("fieldConcentrationUnit").value =
        product.concentrationId || "";

      document.getElementById("fieldBrand").value = product.brandId || "";

      const statusSelect = document.getElementById("productStatus");
      if (statusSelect && product.isActive !== undefined) {
        statusSelect.value = product.isActive.toString();
      }
    } catch (error) {
      console.error(error);
      showToast("Error al cargar la información del producto", "error");
      closeModal();
    }
  }

  if (productForm) {
    productForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      // --- VALIDACIONES OBLIGATORIAS Y SANITIZACIÓN ---
      const tradeName = document.getElementById("fieldTradeName").value.trim();
      const genericName = document
        .getElementById("fieldGenericName")
        .value.trim();
      const supplierId = parseInt(
        document.getElementById("fieldProvider").value,
      );
      const categoryId = parseInt(
        document.getElementById("fieldCategory").value,
      );
      const presentationId = parseInt(
        document.getElementById("fieldPresentation").value,
      );
      const concentrationValue = document
        .getElementById("fieldConcentration")
        .value.trim();
      const concentrationId = parseInt(
        document.getElementById("fieldConcentrationUnit").value,
      );
      const brandId = parseInt(document.getElementById("fieldBrand").value);

      if (!tradeName) {
        showToast(
          "El nombre comercial es obligatorio y no puede estar vacío",
          "warning",
        );
        return;
      }
      if (tradeName.length > 100) {
        showToast(
          "El nombre comercial excede la longitud máxima permitida",
          "warning",
        );
        return;
      }
      if (!genericName) {
        showToast("El nombre genérico es obligatorio", "warning");
        return;
      }
      if (
        isNaN(supplierId) ||
        isNaN(categoryId) ||
        isNaN(presentationId) ||
        isNaN(concentrationId) ||
        isNaN(brandId)
      ) {
        showToast(
          "Por favor, seleccione todas las clasificaciones obligatorias",
          "warning",
        );
        return;
      }

      const payload = {
        tradeName,
        genericName,
        concentrationValue,
        concentrationId,
        categoryId,
        presentationId,
        concentrationId,
        supplierId,
        brandId,
      };

      let url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.products}`;
      let method = "POST";
      const btnSave = document.getElementById("btnSaveProduct");

      if (currentProductId) {
        method = "PUT";
        url = `${url}/${currentProductId}`;
        payload.productId = parseInt(currentProductId);

        const statusSelect = document.getElementById("productStatus");
        payload.isActive = statusSelect ? statusSelect.value === "true" : true;
      }

      try {
        if (btnSave) {
          btnSave.disabled = true;
          btnSave.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Procesando...`;
        }

        const response = await fetch(url, {
          method: method,
          headers: getHeaders(true),
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          showToast(
            currentProductId
              ? "Producto actualizado correctamente"
              : "Producto registrado correctamente",
            "success",
          );
          closeModal();
          await getProducts(currentProductId ? currentPage : 1, pageSize);
        } else {
          if (response.status === 401 || response.status === 403) {
            showToast(
              "Su sesión ha expirado o no cuenta con los permisos necesarios",
              "error",
            );
          } else {
            throw new Error();
          }
        }
      } catch (error) {
        console.error("Error en operación de producto:", error);
        showToast(
          "Ocurrió un error inesperado al procesar la solicitud",
          "error",
        );
      } finally {
        if (btnSave) {
          btnSave.disabled = false;
          btnSave.innerHTML = `<i class="fas fa-save"></i> Guardar`;
        }
      }
    });
  }

  function renderProductsTable(products) {
    if (!tableBody) return;

    if (!products || products.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" class="empty-state">
            <i class="fas fa-box-open" style="font-size: 48px; color: #6c757d;"></i>
            <p>No hay productos registrados en el sistema</p>
            <button id="btnOpenModalEmpty" class="btn btn-primary btn-sm">
              <i class="fas fa-plus"></i> Registrar primer producto
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = products
      .map((product) => {
        const id = product.productId;
        const active = product.isActive;

        return `
          <tr data-product-id="${id}">
            <td>${formatId(id)}</td>
            <td><span class="cell-main">${escapeHtml(product.tradeName)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.genericName)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.categoryName)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.presentationName)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.concentrationValue + " " + product.porcentage)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.supplierName)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.brandName)}</span></td>
            <td>
              <span class="badge ${active ? "status-active" : "status-inactive"}">
                ${active ? "Activo" : "Inactivo"}
              </span>
            </td>
            <td class="col-actions">
              <button
                class="btn-icon btn-icon--edit"
                data-id="${id}"
                title="Editar ${escapeHtml(product.tradeName)}"
                aria-label="Editar producto ${escapeHtml(product.tradeName)}"
              >
                <i class="fas fa-edit" aria-hidden="true"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function showLoadingState() {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" class="loading-state">
            <div class="skeleton-loader" style="height: 45px; margin-bottom: 10px;"></div>
            <p>Cargando catálogo de productos...</p>
          </td>
        </tr>`;
    }
  }

  function showErrorState(errorMessage) {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" class="error-state">
            <i class="fas fa-exclamation-triangle" style="color: #dc3545; font-size: 24px;"></i>
            <p>Error de conexión con el servidor: ${escapeHtml(errorMessage)}</p>
            <button id="btnRetryProducts" class="btn btn-primary btn-sm"><i class="fas fa-sync-alt"></i> Reintentar</button>
          </td>
        </tr>`;

      const btnRetry = document.getElementById("btnRetryProducts");
      if (btnRetry)
        btnRetry.addEventListener("click", () =>
          getProducts(currentPage, pageSize),
        );
    }
  }

  function formatId(id) {
    return `#${String(id).padStart(3, "0")}`;
  }

  async function searchProducts(
    searchTerm,
    page = currentPage,
    size = pageSize,
  ) {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.products}/paged?page=${page}&limit=${size}`,
        {
          headers: getHeaders(false),
        },
      );
      const data = await response.json();
      const products = data.data || data;

      const filteredProducts = products.filter((product) => {
        const name = product.tradeName || product.genericName || "";
        const desc =
          product.categoryName ||
          product.presentationName ||
          product.concentrationValue ||
          "";
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          desc.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      renderProductsTable(filteredProducts);
    } catch (error) {
      console.error("Error al buscar productos:", error);
    }
  }

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // --- SISTEMA DE NOTIFICACIONES TOAST ---
  function showToast(message, type = "info", duration = 4000) {
    const ICONS = {
      success: "fa-circle-check",
      error: "fa-circle-xmark",
      warning: "fa-triangle-exclamation",
      info: "fa-circle-info",
    };

    let toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <i class="fas ${ICONS[type] || ICONS.info}"></i>
      <span class="toast-message">${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
  }

  // --- INICIALIZACIÓN DE COMPONENTES ---
  loadSelectData(
    API_CONFIG.endpoints.suppliers,
    "fieldProvider",
    "supplierId",
    "supplierName",
    "Error al cargar proveedores",
  );
  loadSelectData(
    API_CONFIG.endpoints.categories,
    "fieldCategory",
    "id",
    "name",
    "Error al cargar categorías",
  );
  loadSelectData(
    API_CONFIG.endpoints.presentations,
    "fieldPresentation",
    "id",
    "description",
    "Error al cargar presentaciones",
  );
  loadSelectData(
    API_CONFIG.endpoints.concentration,
    "fieldConcentrationUnit",
    "concentrationId",
    "porcentage",
    "Error al cargar concentraciones",
  );
  loadSelectData(
    API_CONFIG.endpoints.brands,
    "fieldBrand",
    "brandId",
    "brandName",
    "Error al cargar marcas",
  );

  getProducts();
});
