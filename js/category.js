import {
  renderGlobalPagination,
  updatePaginationInfo,
} from "./utils/pagination.js";

document.addEventListener("DOMContentLoaded", () => {
  let currentPage = 1;
  const pageSize = 10;
  const modal = document.getElementById("categoryModal");
  const btnOpen = document.getElementById("btnOpenModal");
  const btnClose = document.getElementById("btnCloseModal");
  const btnCancel = document.getElementById("btnCancelModal");
  const searchInput = document.getElementById("categoriesSearch");

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
      categories: "/Categories",
    },
  };

  async function GetAllCategory(page = currentPage, size = pageSize) {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.categories}/paged?page=${page}&limit=${size}`,
        {
          method: "GET",
          headers: {
            accept: "Application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Error http: ${response.status} - ${response.statusText}`,
        );
      }

      const result = await response.json();
      renderCategoriesTable(result.data);
      updatePaginationInfo(
        result.meta.currentPage,
        result.meta.itemsPerPage,
        result.meta.totalItems,
        "paginationInfo",
        "Categorías",
      );

      renderGlobalPagination(
        result.meta.totalPages,
        result.meta.currentPage,
        "paginationContainer",
        async (newPage) => {
          currentPage = newPage;
          await GetAllCategory(currentPage, pageSize);
        },
      );
    } catch (error) {
      console.log("Ha ocurrido un error al obtener las categorias: ", error);
    }
  }

  function renderCategoriesTable(categories) {
    const tbody = document.querySelector(".categories-table tbody");
    if (!tbody) return;

    if (!categories || categories.length === 0) {
      tbody.innerHTML = `
        <tr>
             <td>
                    <i class="fas fa-box-open" style="font-size: 48px; color: #6c757d;"></i>
                     <p> No hay categorias registradas </p>
                    <button id="btnOpenModalEmpty" class="btn btn-primary btn-sm">
                        <i class="fas fa-plus"></i> Registrar primera categoría
                    </button>
             </td>
        </tr>
      `;
      const emptyBtn = document.getElementById("btnOpenModalEmpty");
      if (emptyBtn) {
        // Corregida la asignación del evento
        emptyBtn.addEventListener("click", () => modal.classList.add("active"));
      }
      return;
    }

    // Corregidas las propiedades categoryName a name y description
    tbody.innerHTML = categories
      .map(
        (category) => `
        <tr data-categories-id="${category.id}">
            <td>${formatId(category.id)}</td>
            <td><span class="cell-main">${escapeHtml(category.name)}</span></td>
            <td class="cell-main">${escapeHtml(category.description || "Sin descripción")}</td>
            <td>
                <span class="badge ${category.isActive ? "status-active" : "status-inactive"}">
                    ${category.isActive ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td class="col-actions">
                <button
                    class="btn-icon btn-icon--edit"
                    onclick="editCategory(${category.id})"
                    title="Editar ${escapeHtml(category.name)}"
                    aria-label="Editar marca ${escapeHtml(category.description)}"
                >
                    <i class="fas fa-edit" aria-hidden="true"></i>
                </button>
            </td>
        </tr>
        `,
      )
      .join("");
  }

  function formatId(id) {
    return `#${String(id).padStart(3, "0")}`;
  }

  // Función para escapar HTML (seguridad)
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async function addCategory() {
    const btnSubmit = document.getElementById("btn-Submit");
    if (btnSubmit) {
      btnSubmit.addEventListener("click", async (event) => {
        event.preventDefault();
        const categoryName = document.getElementById("categoryName").value;
        const categoryDescription =
          document.getElementById("categoryDesc").value;

        if (!categoryName || !categoryDescription) {
          alert("Por favor complete los campos");
          return;
        }

        try {
          const response = await fetch(
            `${API_CONFIG.baseURL}${API_CONFIG.endpoints.categories}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: categoryName, // Cambiado para que coincida con tu backend
                description: categoryDescription, // Cambiado para que coincida con tu backend
              }),
            },
          );

          if (response.ok) {
            alert("Categoria agregada con éxito");
            refresh();
            closeModal();
          } else {
            // Corregido el error matemático del alert usando template literals
            alert(
              `Ocurrió un error: ${response.status} ${response.statusText}`,
            );
          }
        } catch (error) {
          console.log("Ocurrió un error", error);
        }
      });
    }
  }

  function editCategory(id) {
    try {
      const btnEdit = document.querySelectorAll("btn-icon--edit");
      if (!btnEdit) {
        alert("error", btnEdit.Error);
      }

      btnEdit.addEventListener("click");
    } catch (error) {}
  }

  async function searchCategories(
    searchTerm,
    page = currentPage,
    size = pageSize,
  ) {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.categories}/paged?page=${page}&limit=${size}`,
        {
          headers: {
            accept: "Application/json",
          },
          //headers: getHeaders(false),
        },
      );
      const data = await response.json();
      const categories = data.data || data;

      const filteredCategory = categories.filter((category) => {
        const name = category.categoryName || category.name || "";
        const desc = category.description || "";
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          desc.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      renderCategoriesTable(filteredCategory);
    } catch (error) {
      console.error("Error al buscar categorias:", error);
    }
  }

  function refresh() {
    GetAllCategory();
  }

  GetAllCategory();
  addCategory();
  searchCategories();
  editCategory();
});
