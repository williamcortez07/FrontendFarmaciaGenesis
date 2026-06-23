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
    endpoints: { brands: "/Brands" },
    tokenKey: "tokenFarmacia", // este es el nombre que le pusimos en el router para el login
  };

  let currentBrandId = null;

  // --- ELEMENTOS DEL DOM ---
  const modal = document.getElementById("brandModal");
  const modalTitle = document.getElementById("brandModalTitle");
  const brandForm = document.getElementById("brandForm");
  const btnOpen = document.getElementById("btnOpenModal");
  const btnClose = document.getElementById("btnCloseModal");
  const btnCancel = document.getElementById("btnCancelModal");
  const tableBody = document.querySelector(".brands-table tbody");
  const searchInput = document.getElementById("brandSearch");

  // --- HELPER PARA AUTENTICACIÓN (HEADERS) ---
  // Recupera el token de localStorage en tiempo real para cada petición
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

  // --- FUNCIONES DEL MODAL Y FORMULARIO ---
  const openModal = (isEdit = false) => {
    if (!modal) return;
    modal.classList.add("active");

    if (isEdit) {
      modalTitle.textContent = "Editar Marca";
      toggleStatusField(true);
    } else {
      currentBrandId = null;
      modalTitle.textContent = "Registrar Nueva Marca";
      if (brandForm) brandForm.reset();
      toggleStatusField(false);
    }
  };

  const closeModal = () => {
    if (modal) modal.classList.remove("active");
    if (brandForm) brandForm.reset();
    currentBrandId = null;
  };

  const toggleStatusField = (show) => {
    let statusGroup = document.getElementById("statusFormGroup");
    const formGrid = document.querySelector(".form-grid");

    if (show) {
      if (!statusGroup && formGrid) {
        statusGroup = document.createElement("div");
        statusGroup.id = "statusFormGroup";
        statusGroup.className = "form-group";
        statusGroup.innerHTML = `
          <label class="form-label" for="brandStatus">Estado de la Marca</label>
          <select class="form-control" id="brandStatus" name="isActive">
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        `;
        formGrid.appendChild(statusGroup);
      }
    } else {
      if (statusGroup) statusGroup.remove();
    }
  };

  // --- ESCUCHADORES DE EVENTOS ---
  if (btnOpen) btnOpen.addEventListener("click", () => openModal(false));
  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);

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
    searchInput.addEventListener("input", (e) => searchBrands(e.target.value));
  }

  // --- OPERACIONES API (CRUD) ---

  // Obtener todas las marcas
  async function getAllBrands(page = currentPage, size = pageSize) {
    try {
      showLoadingState();
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.brands}/paged?page=${page}&limit=${size}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem(API_CONFIG.tokenKey)}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const result = await response.json();
      renderBrandsTable(result.data);
      updatePaginationInfo(
        result.meta.currentPage,
        result.meta.itemsPerPage,
        result.meta.totalItems,
        "paginationInfo",
        "Marcas",
      );

      renderGlobalPagination(
        result.meta.totalPages,
        result.meta.currentPage,
        "paginationContainer",
        async (newPage) => {
          currentPage = newPage;
          await getAllBrands(currentPage, pageSize);
        },
      );
    } catch (error) {
      console.error("Error al obtener las marcas:", error);
      showErrorState(error.message);
    }
  }

  // Obtener marca por ID y rellenar formulario
  // 13/06/26 -- revisar esta función ya que no me rellena los campos para una marca
  async function prepareEditModal(id) {
    try {
      openModal(true);
      currentBrandId = id;

      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.brands}/${id}`,
        {
          method: "GET",
          headers: getHeaders(false),
        },
      );

      if (!response.ok)
        throw new Error("No se pudo obtener la información de la marca.");

      const data = await response.json();
      const brand = data.data || data;

      const finalName =
        brand.brandName || brand.nombre || brand.BrandName || "";
      const finalDesc =
        brand.brandDescription ||
        brand.descripcion ||
        brand.BrandDescription ||
        "";
      const finalStatus =
        brand.isActive !== undefined
          ? brand.isActive
          : brand.activo !== undefined
            ? brand.activo
            : true;

      document.getElementById("brandName").value = finalName;
      document.getElementById("brandDesc").value = finalDesc;

      const statusSelect = document.getElementById("brandStatus");
      if (statusSelect) {
        statusSelect.value = finalStatus.toString();
      }
    } catch (error) {
      console.error(error);
      showNotification("Error al cargar datos de la marca", "error");
      closeModal();
    }
  }

  // Guardar (POST) o Editar (PUT) con Token de seguridad
  if (brandForm) {
    brandForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const brandName = document.getElementById("brandName").value.trim();
      const brandDescription = document
        .getElementById("brandDesc")
        .value.trim();

      if (!brandName) {
        showNotification("El nombre de la marca es obligatorio", "error");
        return;
      }

      const payload = { brandName, brandDescription };
      let url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.brands}`;
      let method = "POST";

      if (currentBrandId) {
        method = "PUT";
        url = `${url}/${currentBrandId}`;

        const statusSelect = document.getElementById("brandStatus");
        payload.brandId = parseInt(currentBrandId);
        payload.isActive = statusSelect ? statusSelect.value === "true" : true;
      }

      try {
        const response = await fetch(url, {
          method: method,
          headers: getHeaders(true),
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          showNotification(
            currentBrandId
              ? "Marca actualizada correctamente"
              : "Marca registrada correctamente",
            "success",
          );
          closeModal();
          getAllBrands();
        } else {
          if (response.status === 401 || response.status === 403) {
            showNotification("No tienes permisos o tu sesión expiró", "error");
          } else {
            throw new Error("Error en la respuesta del servidor");
          }
        }
      } catch (error) {
        console.error("Error al procesar la marca:", error);
        showNotification("Ocurrió un error al guardar los cambios", "error");
      }
    });
  }

  // --- RENDERS Y AUXILIARES ---
  async function searchBrands(searchTerm, page = currentPage, size = pageSize) {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.brands}/paged?page=${page}&limit=${size}`,
        {
          headers: getHeaders(false),
        },
      );
      const data = await response.json();
      const brands = data.data || data;

      const filteredBrands = brands.filter((brand) => {
        const name = brand.brandName || brand.nombre || "";
        const desc = brand.brandDescription || brand.descripcion || "";
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          desc.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      renderBrandsTable(filteredBrands);
    } catch (error) {
      console.error("Error al buscar marcas:", error);
    }
  }

  let allBrandsCache = [];
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

  async function loadAllBrandsToCache() {
    if (isCacheLoaded) return;

    try {
      showLoadingState();

      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.brands}`,
        { headers: getHeaders(false) },
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      allBrandsCache = result.data || result || [];
      isCacheLoaded = true;
    } catch (error) {
      console.error("Error cargando caché de marcas:", error);
      showToast("Error al cargar datos para búsqueda", "error");
    }
  }

  function searchBrandsLocal(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    currentSearchTerm = term;

    if (!term) {
      currentPage = 1;
      getAllBrands(1, pageSize);
      return;
    }

    if (!isCacheLoaded) {
      loadAllBrandsToCache().then(() => {
        searchBrandsLocal(searchTerm);
      });
      return;
    }

    const filtered = allBrandsCache.filter((brand) => {
      const name = (brand.brandName || "").toLowerCase();
      const desc = (brand.brandDescription || "").toLowerCase();
      return name.includes(term) || desc.includes(term);
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    currentPage = 1;

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

    renderBrandsTable(paginatedData);
    updatePaginationInfo(
      currentPage,
      pageSize,
      totalItems,
      "paginationInfo",
      "productos",
    );

    renderGlobalPagination(
      totalPages,
      currentPage,
      "paginationContainer",
      (newPage) => {
        currentPage = newPage;
        const start = (currentPage - 1) * pageSize;
        const pageData = filtered.slice(start, start + pageSize);
        renderBrandsTable(pageData);
        updatePaginationInfo(
          currentPage,
          pageSize,
          totalItems,
          "paginationInfo",
          "marcas",
        );
      },
    );
  }

  const debouncedSearch = debounce((e) => {
    searchBrandsLocal(e.target.value);
  }, 300);

  if (searchInput) {
    searchInput.removeEventListener("input", searchBrands); // Limpia el anterior si existe
    searchInput.addEventListener("input", debouncedSearch);
  }

  function renderBrandsTable(brands) {
    if (!tableBody) return;

    if (!brands || brands.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">
            <i class="fas fa-box-open" style="font-size: 48px; color: #6c757d;"></i>
            <p>No hay marcas registradas</p>
            <button id="btnOpenModalEmpty" class="btn btn-primary btn-sm">
              <i class="fas fa-plus"></i> Registrar primera marca
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = brands
      .map((brand) => {
        const id = brand.brandId || brand.id;
        const name = brand.brandName || brand.nombre || "Sin nombre";
        const desc =
          brand.brandDescription || brand.descripcion || "Sin descripción";
        const active =
          brand.isActive !== undefined ? brand.isActive : brand.activo;

        return `
          <tr data-brand-id="${id}">
            <td>${formatId(id)}</td>
            <td><span class="cell-main">${escapeHtml(name)}</span></td>
            <td class="cell-main">${escapeHtml(desc)}</td>
            <td>
              <span class="badge ${active ? "status-active" : "status-inactive"}">
                ${active ? "Activo" : "Inactivo"}
              </span>
            </td>
            <td class="col-actions">
              <button
                class="btn-icon btn-icon--edit"
                data-id="${id}"
                title="Editar ${escapeHtml(name)}"
                aria-label="Editar marca ${escapeHtml(name)}"
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
      tableBody.innerHTML = `<tr><td colspan="5" class="loading-state"><div class="skeleton-loader" style="height: 50px;"></div><p>Cargando marcas...</p></td></tr>`;
    }
  }

  function showErrorState(errorMessage) {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="error-state">
            <i class="fas fa-exclamation-triangle" style="color: #dc3545; font-size: 24px;"></i>
            <p>Error al cargar las marcas: ${errorMessage}</p>
            <button id="btnRetryBrands" class="btn btn-primary btn-sm"><i class="fas fa-sync-alt"></i> Reintentar</button>
          </td>
        </tr>`;
      document
        .getElementById("btnRetryBrands")
        ?.addEventListener("click", getAllBrands);
    }
  }

  function formatId(Id) {
    return `#${String(Id).padStart(3, "0")}`;
  }
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function showNotification(message, type = "info") {
    let notification = document.querySelector(".notification-toast");
    if (!notification) {
      notification = document.createElement("div");
      notification.className = "notification-toast";
      document.body.appendChild(notification);
    }
    notification.textContent = message;
    notification.className = `notification-toast notification-${type}`;
    notification.style.display = "block";
    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
  }

  getAllBrands();
});
