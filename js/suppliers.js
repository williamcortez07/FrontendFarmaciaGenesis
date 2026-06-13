(function () {
  var modal = document.getElementById("supplier-Modal");
  var openBtn = document.getElementById("btnAddSupp");
  var form = document.getElementById("supplierForm");
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
  document.addEventListener("DOMContentLoaded", () => {
    const API_CONFIG = {
      baseURL: "https:/localhost:7204/api",
      endpoints: {
        suppliers: "/Suppliers",
      },
    };

    async function GetAllSuppliers() {
      try {
        const response = await fetch(
          `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}`,
          {
            method: "GET",
            headers: {
              accept: "Application/json",
              //Authoritation :"data.Token"
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `ERROR HTTP: ${response.status} - ${response.statusText}`,
          );
        }

        const data = await response.json();

        const suppliers = data.data || data;
        renderSupplierTable(suppliers);
        return suppliers;
      } catch (error) {
        console.log("ha ocurrido un error en obtener los proveedores", error);
        return [];
      }
    }

    function renderSupplierTable(suppliers) {
      const tboby = document.querySelector(".suppliers-table tbody");
      if (!tboby) return;

      if (!suppliers || suppliers.length === 0) {
        tdoby.innerHTML = `

             <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-box-open" style="font-size: 48px; color: #6c757d;"></i>
                    <p>No hay proveedores registrados</p>
                    <button id="btnOpenModalEmpty" class="btn btn-primary btn-sm">
                        <i class="fas fa-plus"></i> Registrar primer proveedor
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

      tboby.innerHTML = suppliers
        .map(
          (supplier) => `
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
                    onclick="editBrand(${supplier.supplierId})"
                    title="Editar ${escapeHtml(supplier.supplierName)}"
                    aria-label="Editar marca ${escapeHtml(supplier.supplierName)}"
                >
                    <i class="fas fa-edit" aria-hidden="true"></i>
                </button>
            </td>
        </tr>


  `,
        )
        .join("");
    }

    function formatId(Id) {
      return `#${String(Id).padStart(3, "0")}`;
    }

    function escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }

    async function AddSupplier() {
      try {
        const btnSubmmit = document.getElementById("btnSavesupplier");
        if (btnSubmmit) {
          btnSubmmit.addEventListener("click", async (event) => {
            event.preventDefault();
            const supplierName = document.getElementById("fieldName").value;
            const supplierRnc = document.getElementById("fieldrcn").value;
            const supplierMail = document.getElementById("fieldMail").value;
            const supplierPhone = document.getElementById("fieldPhone").value;
            const supplierAddress =
              document.getElementById("fieldAddress").value;

            if (
              !supplierName ||
              !supplierRnc ||
              !supplierMail ||
              !supplierPhone ||
              !supplierAddress
            ) {
              alert("Debe completar los campos");
              return;
            }

            const response = await fetch(
              `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}`,
              {
                method: "POST",
                headers: {
                  "content-type": "Application/json",
                },
                body: JSON.stringify({
                  supplierName: supplierName,
                  rnc: supplierRnc,
                  Mail: supplierMail,
                  supplierPhone: supplierPhone,
                  supplierAddress: supplierAddress,
                }),
              },
            );

            if (response.ok) {
              alert("proveedor agregado con exito");
              closeModal();
              refresh();
            }
          });
        }
      } catch (error) {
        console.log("error al agregar al proveedor", error);
      }
    }

    function refresh() {
      GetAllSuppliers();
    }

    GetAllSuppliers();
    AddSupplier();
  });
})();
