document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("presentatationModal");
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

  const API_CONFINF = {
    baseURL: "https:localhost:7204/api",
    endpoints: {
      presentation: "/Presentation",
    },
  };

  async function GetPresentation() {
    try {
      const response = await fetch(
        `${API_CONFINF.baseURL}${API_CONFINF.endpoints.presentation}`,
        {
          method: "GET",
          headers: {
            accept: "Application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `ERROR HTTP: ${response.status} - ${response.statusText}`,
        );
      }

      const data = await response.json();
      const presentation = data.data || data;
      renderPresentationTable(presentation);
      return presentation;
    } catch (error) {
      console.error("Ocurrión un error", error);
      return [];
    }
  }

  function renderPresentationTable(presentation) {
    const tbody = document.querySelector(".presentations-table tbody");
    if (!tbody) {
      return;
    }

    if (!presentation || presentation.length === 0) {
      tbody.innerHTML = `

             <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-box-open" style="font-size: 48px; color: #6c757d;"></i>
                    <p>No hay presentaciones registradas</p>
                    <button id="btnOpenModalEmpty" class="btn btn-primary btn-sm">
                        <i class="fas fa-plus"></i> Registrar primer presentación
                    </button>
                </td>
            </tr>

    `;

      const btnEmpty = document.getElementById("btnOpenModal");
      if (btnEmpty) {
        btnEmpty.addEventListener("click", () => openModal());
      }
      return;
    }

    tbody.innerHTML = presentation
      .map(
        (presentations) => `
<tr data-presentations-id="${presentations.id}">
            <td>${formatId(presentations.id)}</td>
            <td><span class="cell-main">${escapeHtml(presentations.description)}</span></td>
            <td><span class="cell-main">${escapeHtml(presentations.quantity)}</span></td>
            <td><span class="cell-main">${escapeHtml(presentations.unitMeasure)}</span></td>
            <td>
                <span class="badge ${presentations.isActive ? "status-active" : "status-inactive"}">
                    ${presentations.isActive ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td class="col-actions">
                <button
                    class="btn-icon btn-icon--edit"
                    onclick="editpresentation(${presentations.id})"
                    title="Editar ${escapeHtml(presentations.description)}"
                    aria-label="Editar presentación ${escapeHtml(presentations.description)}"
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

  function openModal() {
    const modal = document.getElementById("presentatationModal");
    if (modal) {
      modal.style.display = "flex";
      document.getElementById("presentatationModalTitle").textContent =
        "Registrar Nueva Presentación";
      document.getElementById("presentatationForm").reset();
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async function AddPresentation() {
    const btnSave = document.getElementById("btn-save");
    if (!btnSave) {
      return;
    }

    if (btnSave) {
      try {
        btnSave.addEventListener("click", async (event) => {
          event.preventDefault();

          const description =
            document.getElementById("presentatationName").value;
          const unitMeasure =
            document.getElementById("presentatationunit").value;
          const quantity = document.getElementById(
            "presentatationquantity",
          ).value;

          if (!description || !unitMeasure || !quantity) {
            alert("Los campos son necesearios, debe completarlos");
            return;
          }

          const response = await fetch(
            `${API_CONFINF.baseURL}${API_CONFINF.endpoints.presentation}`,
            {
              method: "POST",
              headers: {
                "content-type": "Application/json",
              },
              body: JSON.stringify({
                description: description,
                unitMeasure: unitMeasure,
                quantity,
                quantity,
              }),
            },
          );

          if (response.ok) {
            alert("Presentación agregada con exito");
            refresh();
            closeModal();
          } else {
            console.error("error http:", response.status - response.statusText);
          }
        });
      } catch (error) {
        console.error("se ha originado un error", error);
      }
    }
  }

  function refresh() {
    GetPresentation();
  }

  GetPresentation();
  AddPresentation();
});
