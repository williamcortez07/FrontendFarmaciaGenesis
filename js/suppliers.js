import {
  renderGlobalPagination,
  updatePaginationInfo,
} from "./utils/pagination.js";

document.addEventListener("DOMContentLoaded", () => {
  let currentPage = 1;
  const pageSize = 10;
  const API_CONFIG = {
    baseURL: "https://localhost:7204/api",
    endpoints: {
      suppliers: "/Suppliers",
    },
    tokenKey: "tokenFarmacia",
  };

  let currentSupplierId = null;
  const modal = document.getElementById("supplier-Modal");
  const modalTitle = document.getElementById("supplierModalTitle");
  const supplierForm = document.getElementById("supplierForm");
  const btnOpen = document.getElementById("btnAddSupp");
  const tableBody = document.querySelector(".suppliers-table tbody ");
  const searchInput = document.getElementById("suppliersearch");

  function getHeaders(includeContentType = true) {
    const token = localStorage.getItem(API_CONFIG.tokenKey);
    const headers = {
      accept: "application/json",
    };
    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn(
        "No se encontró ningun token de autentication en localstorage",
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
      if (modalTitle) modalTitle.textContent = "Editar proveedor";
      toggleStatusField(true);
    } else {
      currentSupplierId = null;
      if (modalTitle) modalTitle.textContent = "Registrar nuevo proveedor";
      if (supplierForm) supplierForm.reset();
      toggleStatusField(false);
    }
    const firstInput =
      supplierForm && supplierForm.querySelector("input, select");
    if (firstInput) firstInput.focus();
  };

  const closeModal = () => {
    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "";
    if (supplierForm) supplierForm.reset();
    currentSupplierId = null;
  };

  const toggleStatusField = (show) => {
    let statusGroup = document.getElementById("statusFormGroup");
    const actionsSection =
      supplierForm && supplierForm.querySelector(".supplier-modal__actions");
    if (show) {
      if (!statusGroup && actionsSection) {
        statusGroup = document.createElement("div");
        statusGroup.id = "statusFormGroup";
        statusGroup.className = "supplier-form__row supplier-form__row--2";
        statusGroup.innerHTML = `
          <div class="supplier-field">
            <label for="supplierStatus">Estado del proveedor</label>
            <select id="supplierStatus" name="isActive">
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
        `;
        supplierForm.insertBefore(statusGroup, actionsSection);
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
    if (e.key === "Escape" && modal.classList.contains("active")) {
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
    searchInput.addEventListener("input", (e) =>
      searchSuppliers(e.target.value),
    );
  }

  // carga de catalogos auxiliaress

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

  async function getSupplier(page = currentPage, size = pageSize) {
    try {
      showLoadingState();
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}/paged?page=${page}&limit=${size}`,
        {
          method: "GET",
          headers: getHeaders(false),
        },
      );
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const result = await response.json();
      renderSupplierTable(result.data);
      updatePaginationInfo(
        result.meta.currentPage,
        result.meta.itemsPerPage,
        result.meta.totalItems,
        "paginationInfo",
        "proveedores",
      );
      renderGlobalPagination(
        result.meta.totalPages,
        result.meta.currentPage,
        "paginationContainer",
        async (newPage) => {
          currentPage = newPage;
          await getSupplier(currentPage, pageSize);
        },
      );
    } catch (error) {
      console.error("Error al obtener los proveedores:", error);
      showErrorState(error.message);
    }
  }

  async function prepareEditModal(id) {
    try {
      showToast("Cargando datos del proveedor...", "info", 1500);
      currentSupplierId = id;
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}/${id}`,
        {
          method: "GET",
          headers: getHeaders(false),
        },
      );

      if (!response.ok) throw new Error();
      const result = await response.json();
      const supplier = result.data || result;
      openModal(true);

      document.getElementById("fieldName").value = supplier.supplierName || "";
      document.getElementById("fieldrcn").value = supplier.rnc || "";
      document.getElementById("fieldMail").value = supplier.mail || "";
      document.getElementById("fieldPhone").value =
        supplier.supplierPhone || "";
      document.getElementById("fieldAddress").value =
        supplier.supplierAddress || "";
      const statusSelect = document.getElementById("supplierStatus");
      if (statusSelect && supplier.isActive !== undefined) {
        statusSelect.value = supplier.isActive.toString();
      }
    } catch (error) {
      console.error(error);
      showToast("Error al cargar la información del proveedor", "error");
      closeModal();
    }
  }
  if (supplierForm) {
    supplierForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const supplierName = document.getElementById("fieldName").value.trim();
      const rnc = document.getElementById("fieldrcn").value.trim();
      const mail = document.getElementById("fieldMail").value.trim();
      const supplierPhone = document.getElementById("fieldPhone").value.trim();
      const supplierAddress = document
        .getElementById("fieldAddress")
        .value.trim();

      if (!supplierName) {
        showToast(
          "El nombre del proveedor es obligatorio y no puede estar vacío",
          "warning",
        );
        return;
      }
      if (!rnc) {
        showToast(
          "El Registro nacional de contribuyente del proveedor es obligatorio y no puede estar vacío",
          "warning",
        );
        return;
      }
      if (!mail && !supplierPhone) {
        showToast(
          "El correo o el telefono del proveedor es obligatorio y no puede estar vacío",
          "warning",
        );
        return;
      }

      if (!supplierAddress) {
        showToast(
          "La direción del proveedor es obligatorio y no puede estar vacío",
          "warning",
        );
        return;
      }

      const payload = {
        supplierName,
        rnc,
        mail,
        supplierPhone,
        supplierAddress,
      };

      let url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}`;
      let method = "POST";
      const btnSave = document.getElementById("btnSavesupplier");
      if (currentSupplierId) {
        method = "PUT";
        url = `${url}/${currentSupplierId}`;
        payload.supplierId = parseInt(currentSupplierId);
        const statusSelect = document.getElementById("supplierStatus");
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
            currentSupplierId
              ? "Proveedor actualizado correctamente"
              : "proveedor registrado correctamente",
            "success",
          );
          closeModal();
          await getSupplier(currentSupplierId ? currentPage : 1, pageSize);
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
        console.error("Error en operación de proveedores:", error);
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

  function renderSupplierTable(supplier) {
    if (!tableBody) return;

    if (!supplier || supplier.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">
            <i class="fas fa-box-open" style="font-size: 48px; color: #6c757d;"></i>
            <p>No hay proveedores registrados en el sistema</p>
            <button id="btnOpenModalEmpty" class="btn btn-primary btn-sm">
              <i class="fas fa-plus"></i> Registrar primer proveedor
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = supplier
      .map((supplier) => {
        const id = supplier.supplierId;
        const active = supplier.isActive;

        return `
  <tr data-supplier-id="${id}">
            <td>${formatId(id)}</td>
            <td><span class="cell-main">${escapeHtml(supplier.supplierName)}</span></td>
            <td><span class="cell-main">${escapeHtml(supplier.rnc)}</span></td>
            <td><span class="cell-main">${escapeHtml(supplier.mail)}</span></td>
             <td><span class="cell-main">${escapeHtml(supplier.supplierPhone)}</span></td>
              <td><span class="cell-main">${escapeHtml(supplier.supplierAddress)}</span></td>
            <td>
                <span class="badge ${supplier.isActive ? "status-active" : "status-inactive"}">
                    ${supplier.isActive ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td class="col-actions">
                <button
                    class="btn-icon btn-icon--edit"
                    data-id="${id}"
                    title="Editar ${escapeHtml(supplier.supplierName)}"
                    aria-label="Editar proveedor ${escapeHtml(supplier.supplierName)}"
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
          <td colspan="8" class="loading-state">
            <div class="skeleton-loader" style="height: 45px; margin-bottom: 10px;"></div>
            <p>Cargando catálogo de proveedores...</p>
          </td>
        </tr>`;
    }
  }

  function showErrorState(errorMessage) {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="error-state">
            <i class="fas fa-exclamation-triangle" style="color: #dc3545; font-size: 24px;"></i>
            <p>Error de conexión con el servidor: ${escapeHtml(errorMessage)}</p>
            <button id="btnRetrySuppliers" class="btn btn-primary btn-sm"><i class="fas fa-sync-alt"></i> Reintentar</button>
          </td>
        </tr>`;

      const btnRetry = document.getElementById("btnRetrySuppliers");
      if (btnRetry)
        btnRetry.addEventListener("click", () =>
          getSupplier(currentPage, pageSize),
        );
    }
  }
  function formatId(id) {
    return `#${String(id).padStart(3, "0")}`;
  }

  //--------------------------------------------------------------------

  async function searchSuppliers(
    searchTerm,
    page = currentPage,
    size = pageSize,
  ) {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}/paged?page=${page}&limit=${size}`,
        {
          headers: getHeaders(false),
        },
      );
      const data = await response.json();
      const suppliers = data.data || data;

      const filteredSupplier = suppliers.filter((supplier) => {
        const name = supplier.supplierName || supplier.suppliername || "";
        const desc =
          supplier.supplierPhone ||
          supplier.supplierAddress ||
          supplier.supplierName ||
          "";
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          desc.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      renderSupplierTable(filteredSupplier);
    } catch (error) {
      console.error("Error al buscar proveedores:", error);
    }
  }
  /* ==========================================================================
   CACHÉ LOCAL + BÚSQUEDA POR LETRA

   primero se traen todos los proveedores existentes, y se almacenan en cache,
   talvez van a decir, eso no es eficiente que la web se va a pegar que no se que
   que no se cuando, pero ya que se ha hecho un análisis de negocio y la farmacia no
   tiene muchos proveedores, no es que se amazon que tiene 100 mil proveedores,
  que hay q pensar en la escalabilidad, sí, se puedo hacer desde la api, pero es mucho
  trabajo y asi se mira tuani.
   ========================================================================== */

  let allSuppliersCache = [];
  let isCacheLoaded = false;
  let currentSearchTerm = "";

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async function loadAllSuppliersToCache() {
    if (isCacheLoaded) return;

    try {
      showLoadingState();

      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}`,
        { headers: getHeaders(false) },
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      allSuppliersCache = result.data || result || [];
      isCacheLoaded = true;
    } catch (error) {
      console.error("Error cargando caché de proveedores:", error);
      showToast("Error al cargar datos para búsqueda", "error");
    }
  }

  function searchSuppliersLocal(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    currentSearchTerm = term;

    if (!term) {
      currentPage = 1;
      getSupplier(1, pageSize);
      return;
    }

    if (!isCacheLoaded) {
      loadAllSuppliersToCache().then(() => {
        searchSuppliersLocal(searchTerm);
      });
      return;
    }

    const filtered = allSuppliersCache.filter((supplier) => {
      const name = (supplier.supplierName || "").toLowerCase();
      const rnc = (supplier.rnc || "").toLowerCase();
      const mail = (supplier.mail || "").toLowerCase();
      const phone = (supplier.supplierPhone || "").toLowerCase();
      const address = (supplier.supplierAddress || "").toLowerCase();

      return (
        name.includes(term) ||
        rnc.includes(term) ||
        mail.includes(term) ||
        phone.includes(term) ||
        address.includes(term)
      );
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    currentPage = 1;

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

    renderSupplierTable(paginatedData);
    updatePaginationInfo(
      currentPage,
      pageSize,
      totalItems,
      "paginationInfo",
      "proveedores",
    );

    renderGlobalPagination(
      totalPages,
      currentPage,
      "paginationContainer",
      (newPage) => {
        currentPage = newPage;
        const start = (currentPage - 1) * pageSize;
        const pageData = filtered.slice(start, start + pageSize);
        renderSupplierTable(pageData);
        updatePaginationInfo(
          currentPage,
          pageSize,
          totalItems,
          "paginationInfo",
          "proveedores",
        );
      },
    );
  }

  const debouncedSearch = debounce((e) => {
    searchSuppliersLocal(e.target.value);
  }, 300);

  if (searchInput) {
    searchInput.removeEventListener("input", searchSuppliers); // Limpia el anterior si existe
    searchInput.addEventListener("input", debouncedSearch);
  }

  //____________________________________________________________
  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

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

  getSupplier();
});
