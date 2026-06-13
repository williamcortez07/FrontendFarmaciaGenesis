document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("brandModal");
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

  const API_CONFIG = {
    baseURL: "https://localhost:7204/api",
    endpoints: {
      brands: "/Brands",
    },
  };

  // Función principal para obtener todas las marcas
  async function getAllBrands() {
    try {
      showLoadingState();

      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.brands}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            //Authorization: `Bearer ${Token()}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Error HTTP: ${response.status} - ${response.statusText}`,
        );
      }

      const data = await response.json();

      const brands = data.data || data;
      // Renderizar las marcas en la tabla
      renderBrandsTable(brands);

      // Actualizar la información de paginación
      updatePaginationInfo(brands.length);

      return brands;
    } catch (error) {
      console.error("Error al obtener las marcas:", error);
      showErrorState(error.message);
      return [];
    }
  }

  // Función para mostrar estado de carga
  function showLoadingState() {
    const tbody = document.querySelector(".brands-table tbody");
    if (tbody) {
      tbody.innerHTML = `
            <tr>
                <td colspan="5" class="loading-state">
                    <div class="skeleton-loader" style="height: 50px;"></div>
                    <p>Cargando marcas...</p>
                </td>
            </tr>
        `;
    }
  }

  // Función para mostrar error
  function showErrorState(errorMessage) {
    const tbody = document.querySelector(".brands-table tbody");
    if (tbody) {
      tbody.innerHTML = `
            <tr>
                <td colspan="5" class="error-state">
                    <i class="fas fa-exclamation-triangle" style="color: #dc3545; font-size: 24px;"></i>
                    <p>Error al cargar las marcas: ${errorMessage}</p>
                    <button onclick="getAllBrands()" class="btn btn-primary btn-sm">
                        <i class="fas fa-sync-alt"></i> Reintentar
                    </button>
                </td>
            </tr>
        `;
    }
  }

  function renderBrandsTable(brands) {
    const tbody = document.querySelector(".brands-table tbody");
    if (!tbody) return;

    if (!brands || brands.length === 0) {
      tbody.innerHTML = `
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

      const emptyBtn = document.getElementById("btnOpenModalEmpty");
      if (emptyBtn) {
        emptyBtn.addEventListener("click", () => openModal());
      }
      return;
    }

    // Renderizar las filas de la tabla
    tbody.innerHTML = brands
      .map(
        (brand) => `
        <tr data-brand-id="${brand.brandId}">
            <td>${formatId(brand.brandId)}</td>
            <td><span class="cell-main">${escapeHtml(brand.brandName)}</span></td>
            <td class="cell-main">${escapeHtml(brand.brandDescription || "Sin descripción")}</td>
            <td>
                <span class="badge ${brand.isActive ? "status-active" : "status-inactive"}">
                    ${brand.isActive ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td class="col-actions">
                <button
                    class="btn-icon btn-icon--edit"
                    onclick="editBrand(${brand.brandId})"
                    title="Editar ${escapeHtml(brand.brandName)}"
                    aria-label="Editar marca ${escapeHtml(brand.brandName)}"
                >
                    <i class="fas fa-edit" aria-hidden="true"></i>
                </button>
            </td>
        </tr>
    `,
      )
      .join("");
  }

  // Función auxiliar para formatear ID
  function formatId(Id) {
    return `#${String(Id).padStart(3, "0")}`;
  }

  // Función para escapar HTML (seguridad)
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Función para actualizar información de paginación
  function updatePaginationInfo(totalItems) {
    const paginationInfo = document.querySelector(".pagination-bar__info");
    if (paginationInfo) {
      const start = 1;
      const end = Math.min(10, totalItems);
      paginationInfo.textContent = `Mostrando ${start} a ${end} de ${totalItems} marcas`;
    }
  }

  // Función para obtener una marca específica (útil para editar)
  async function getBrandById(id) {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.brands}/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error(`Error al obtener la marca ${id}:`, error);
      showNotification("Error al cargar la marca", "error");
      return null;
    }
  }

  async function searchBrands(searchTerm) {
    try {
      // Opción 1: Filtrar localmente
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.brands}`,
      );
      const data = await response.json();
      const brands = data.data || data;

      const filteredBrands = brands.filter(
        (brand) =>
          brand.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (brand.descripcion &&
            brand.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
      );

      renderBrandsTable(filteredBrands);
    } catch (error) {
      console.error("Error al buscar marcas:", error);
      showNotification("Error al realizar la búsqueda", "error");
    }
  }

  // Función para mostrar notificaciones
  function showNotification(message, type = "info") {
    // Crear elemento de notificación si no existe
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

  async function addBrands() {
    try {
      const btnSubmit = document.getElementById("btn-submit-brand");
      if (btnSubmit) {
        btnSubmit.addEventListener("click", async (event) => {
          event.preventDefault();

          const brandName = document.getElementById("brandName").value;
          const brandDescription = document.getElementById("brandDesc").value;

          if (!brandName || !brandDescription) {
            alert(
              "Por favor debe llenar los campos {brandname} & {brandDescription} ",
            );
            return;
          }

          const response = await fetch(
            `${API_CONFIG.baseURL}${API_CONFIG.endpoints.brands}`,
            {
              method: "POST",
              headers: {
                "content-Type": "Application/json",
              },
              body: JSON.stringify({
                brandName: brandName,
                brandDescription: brandDescription,
              }),
            },
          );

          if (response.ok) {
            alert("Marca registrada correctamente");
            refreshBrandsTable();
            closeModal();
          } else {
            console.log("error http", response.status - response.statusText);
          }
        });
      }
    } catch (error) {
      console.log("ocurrió un error al registar a la marca: ", error);
    }
  }

  // Función para recargar la tabla después de guardar/editar
  function refreshBrandsTable() {
    getAllBrands();
  }

  function editBrand(id) {
    console.log(`Editar marca con ID: ${id}`);

    openModalForEdit(id);
  }

  // Función para abrir modal (ejemplo básico)
  function openModal() {
    const modal = document.getElementById("brandModal");
    if (modal) {
      modal.style.display = "flex";
      document.getElementById("brandModalTitle").textContent =
        "Registrar Nueva Marca";
      document.getElementById("brandForm").reset();
    }
  }

  function openModalForEdit(id) {
    let brandname = document.getElementById("brandName");

    console.log("Editar marca:", id);
  }

  getAllBrands();
  addBrands();
  editBrand();
});
