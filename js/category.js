document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("categoryModal");
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
    baseURL: "https:/localhost:7204/api",
    endpoints: {
      categories: "/Categories",
    },
  };

  async function GetAllCategory() {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.categories}`,
        {
          method: "GET",
          headers: {
            accept: "Application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Error http: ${response.status}- ${response.statusText}`,
        );
      }

      const data = await response.json();
      const categories = data.data || data;
      renderCategoriesTable(categories);

      return categories;
    } catch (error) {
      console.log("ha ocurrido un error al obtener las categorias: ", error);
      return [];
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
                        <i class="fas fa-plus"></i> Registrar primera marca
                    </button>

         </td>
    </tr>


    `;
      const emptyBtn = document.getElementById("btnOpenModalEmpty");
      if (emptyBtn) {
        emptyBtn = addEventListener("click", () => openModal());
      }
      return;
    }

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
                    title="Editar ${escapeHtml(category.categoryName)}"
                    aria-label="Editar marca ${escapeHtml(category.categoryDescription)}"
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
      try {
        btnSubmit.addEventListener("click", async (event) => {
          event.preventDefault();
          const categoryName = document.getElementById("categoryName").value;
          const categoryDescription =
            document.getElementById("categoryDesc").value;

          if (!categoryName || !categoryDescription) {
            alert("Por favor complete los campos");
            return;
          }

          const response = await fetch(
            `${API_CONFIG.baseURL}${API_CONFIG.endpoints.categories}`,
            {
              method: "POST",
              headers: { "content-Type": "Application/json" },
              body: JSON.stringify({
                categoryName: categoryName,
                categoryDescription: categoryDescription,
              }),
            },
          );

          if (response.ok) {
            alert("Categoria agregada con exito");
            refresh();
            closeModal();
          } else {
            alert("ocurrio un error", response.status - response.statusText);
          }
        });
      } catch (error) {
        console.log("Ocurrio un error", error);
      }
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

  function refresh() {
    GetAllCategory();
  }

  GetAllCategory();
  addCategory();
  editCategory();
});
