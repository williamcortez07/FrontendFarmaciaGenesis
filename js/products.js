(function () {
  var modal = document.getElementById("productModal");
  var openBtn = document.getElementById("btnAddProduct");
  var form = document.getElementById("productForm");
  if (!modal || !openBtn) return;

  var closeSelector = "[data-close-modal]";

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var firstInput = form && form.querySelector("input, select");
    if (firstInput) firstInput.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  openBtn.addEventListener("click", openModal);

  modal.querySelectorAll(closeSelector).forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      closeModal();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  const API_CONFIG = {
    baseURL: "https:localhost:7204/api",
    endpoints: {
      products: "/Products",
      suppliers: "/Suppliers",
      categories: "/Categories",
      presentations: "/Presentation",
      brands: "/Brands",
    },
  };

  async function getSuppliers() {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}`,
      );
      const resultado = await response.json();

      const select = document.getElementById("fieldProvider");
      resultado.data.forEach((supplier) => {
        const option = document.createElement("option");
        option.value = supplier.supplierId;
        option.textContent = supplier.supplierName;
        select.appendChild(option);
      });
    } catch (error) {
      console.log("se generó un error:", error);
      return [];
    }
  }

  async function getCategories() {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.categories}`,
      );
      const resultado = await response.json();
      const select = document.getElementById("fieldCategory");
      resultado.data.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
      });
    } catch (error) {
      console.log("se generó un error:", error);
      return [];
    }
  }

  async function getPresentations() {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.presentations}`,
      );
      const resulatdo = await response.json();
      const select = document.getElementById("fieldPresentation");
      resulatdo.data.forEach((presentation) => {
        const option = document.createElement("option");
        option.value = presentation.id;
        option.textContent = presentation.description;
        select.appendChild(option);
      });
    } catch (error) {
      console.log("ha ocuurido un error", error);
      return [];
    }
  }

  async function getBrands() {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.brands}`,
      );

      const resultado = await response.json();
      const select = document.getElementById("fieldBrand");
      resultado.data.forEach((brands) => {
        const option = document.createElement("option");
        option.value = brands.brandId;
        option.textContent = brands.brandName;
        select.appendChild(option);
      });
    } catch (error) {
      console.log("ha ocurrido un error", error);
      return [];
    }
  }

  async function getProducts() {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.products}`,
        {
          method: "GET",
          headers: {
            Accept: "applicaction/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Error HTTP: ${response.status}- ${response.statusText}`,
        );
      }

      const data = await response.json();
      const products = data.data || data;
      renderProductsTable(products);
      return products;
    } catch (error) {
      console.log(error);
      // showErrorState(error.message);
      return [];
    }
  }

  function renderProductsTable(products) {
    const tbody = document.querySelector(".products-table tbody");
    if (!tbody) return;

    if (!products || products.length === 0) {
      tbody.innerHTML = `

     <tr>
                <td colspan="5" class="empty-state">
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

    tbody.innerHTML = products
      .map(
        (product) => `
      <tr data-product-id="${product.productId}">
            <td>${formatId(product.productId)}</td>
            <td><span class="cell-main">${escapeHtml(product.tradeName)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.genericName)}</span></td>
            <td><span class="cell-main">${escapeHtml(product.categoryName)}</span></td>
             <td><span class="cell-main">${escapeHtml(product.presentationName)}</span></td>
              <td><span class="cell-main">${escapeHtml(product.porcentage)}</span></td>
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
                    onclick="editBrand(${products.productsId})"
                    title="Editar ${escapeHtml(products.productGenericName)}"
                    aria-label="Editar marca ${escapeHtml(products.productGenericName)}"
                >
                    <i class="fas fa-edit" aria-hidden="true"></i>
                </button>
            </td>
        </tr>

  `,
      )
      .join("");
  }

  async function addProducts() {
    const btnsubmit = document.getElementById("btnSaveProduct");
    if (!btnsubmit) return;

    try {
      btnsubmit.addEventListener("click", async (event) => {
        event.preventDefault();
        const genericName = document.getElementById("fieldGenericName").value;
        const tradeName = document.getElementById("fieldTradeName").value;
        const idSupplier = document.getElementById("fieldProvider").value;
        const idCategory = document.getElementById("fieldCategory").value;
        const idPresentation =
          document.getElementById("fieldPresentation").value;
        const idbrand = document.getElementById("fieldBrand").value;

        parseInt(idSupplier);
        parseInt(idCategory);
        parseInt(idPresentation);
        parseInt(idbrand);
        if (
          !genericName ||
          !tradeName ||
          idSupplier === 0 ||
          idCategory === 0 ||
          idbrand === 0
        ) {
          alert("debe completar los campos solicitados");
          return;
        }
        const response = await fetch(
          `${API_CONFIG.baseURL}${API_CONFIG.endpoints.products}`,
          {
            method: "POST",
            headers: {
              "content-Type": "application/json",
            },
            body: JSON.stringify({
              genericName: genericName,
              tradeName: tradeName,
              supplierId: idSupplier,
              categoryId: idCategory,
              concentrationId: 1,
              presentationId: idPresentation,
              brandId: idbrand,
            }),
          },
        );

        if (response.ok) {
          alert("producto guardado con exito");
          closeModal();
          getProducts();
        }
      });
    } catch (error) {
      console.log("ocurrió un error", error);
      return [];
    }
  }

  function formatId(id) {
    return `#${String(id).padStart(3, "0")}`;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  document.addEventListener("DOMContentLoaded", () => {
    getSuppliers();
    getCategories();
    getPresentations();
    getBrands();
    getProducts();
    addProducts();
  });
})();
