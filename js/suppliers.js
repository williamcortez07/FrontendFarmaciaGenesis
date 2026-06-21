import {
  renderGlobalPagination,
  updatePaginationInfo,
} from "./utils/pagination.js";

document.addEventListener("DOMContentLoaded", () => {
  const currentpage = 1;
  const pageSize = 10;

  const API_CONFIG = {
    baseURL: "https:/localhost:7204/api",
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
  const tableBody = document.querySelector("suppliers-table tbody ");
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
      supplierForm && supplierForm.querySelector("supplier-modal__actions");
    if (show) {
      if (!statusGroup && actionsSection) {
        statusGroup = document.getElementById("div");
        statusGroup.id = "statusFormGroup";
        statusGroup.className = "supplier-form__row supplier-form__row--2";
        statusGroup.innerHTML = `
          <div class="supplier-field">
            <label for="supplierStatus">Estado del proveedor</label>
            <select id="suppliertStatus" name="isActive">
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
    searchInput.addEventListener("input", (e) => searchInputs(e.target.value));
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
      const response = await fetch(
        `${API_CONFIG.baseURL}${endpoint.suppliers}`,
        {
          headers: getHeaders(false),
        },
      );
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

  async function getSupplier(page = currentpage, size = pageSize) {
    try {
      showLoadingState();
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}/paged?page = ${page}&limit=${size}`,
        {
          method: "GET",
          headers: getHeaders(false),
        },
      );
      if (!response.ok)
        throw new Error(
          `Error HTTP: ${response.status}- ${response.statusText}`,
        );
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

  async function preparedEditModal(id) {
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
      const supplierRnc = document.getElementById("fieldrcn").value.trim();
      const supplierMail = document.getElementById("fieldMail").value.trim();
      const supplierPhone = document.getElementById("fieldPhone").value.trim();
      const supplierAddress = document
        .getElementById("fieldAddress")
        .value.trim();

      if (!supplierName) {
        showToast(
          "El nombre del proveedor es obligatorio y no puede estar vacío",
          "warnig",
        );
        return;
      }
      if (!rnc) {
        showToast(
          "El Registro nacional de contribuyente del proveedor es obligatorio y no puede estar vacío",
          "warnig",
        );
        return;
      }
      if (!supplierMail && !supplierPhone) {
        showToast(
          "El correo o el telefono del proveedor es obligatorio y no puede estar vacío",
          "warnig",
        );
        return;
      }

      if (!supplierAddress) {
        showToast(
          "La direción del proveedor es obligatorio y no puede estar vacío",
          "warnig",
        );
        return;
      }

      const payload = {
        supplierName,
        supplierRnc,
        supplierMail,
        supplierPhone,
        supplierAddress,
      };

      let url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}`;
      let method = "POST";
      const btnSave = document.getElementById("");
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
          await getSupplier(currentSupplierId ? currentpage : 1, pageSize);
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

  function renderSupplierTable(supplers) {
    if (!tableBody) return;

    if (!supplers || supplers.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" class="empty-state">
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

    tableBody.innerHTML = supplers
      .map((suppler) => {
        const id = suppler.supplierId;
        const active = suppler.isActive;

        return;
        `
  <tr data-supplier-id="${supplier.supplierId}">
            <td>${formatId(supplier.supplierId)}</td>
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
                    data-id="${supplier.supplierId}"
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
          <td colspan="10" class="loading-state">
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
          <td colspan="10" class="error-state">
            <i class="fas fa-exclamation-triangle" style="color: #dc3545; font-size: 24px;"></i>
            <p>Error de conexión con el servidor: ${escapeHtml(errorMessage)}</p>
            <button id="btnRetrysuppliers" class="btn btn-primary btn-sm"><i class="fas fa-sync-alt"></i> Reintentar</button>
          </td>
        </tr>`;

      const btnRetry = document.getElementById("btnRetrysuppliers");
      if (btnRetry)
        btnRetry.addEventListener("click", () =>
          getSupplier(currentPage, pageSize),
        );
    }
  }
  function formatId(id) {
    return `#${String(id).padStart(3, "0")}`;
  }

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
