document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("userModal");
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
    baseURL: "https:localhost:7204/api",
    endponts: {
      user: "/User",
      roles: "/Roles",
    },
  };

  async function GetUsers() {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endponts.user}`,
        {
          method: "GET",
          headers: {
            Accept: "applicaction/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Error http ${response.status} -${response.statusText}`,
        );
      }

      const data = await response.json();

      const user = data.data || data;
      renderUserTable(user);
      return user;
    } catch (error) {
      console.log("ha ocurrido un error", error);
      return [];
    }
  }

  function renderUserTable(user) {
    const tbody = document.querySelector(".users-table tbody");
    if (!tbody) return;

    if (!user || user.length === 0) {
      tbody.innerHTML = `
       <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-box-open" style="font-size: 48px; color: #6c757d;"></i>
                    <p>No hay usuarios registrados</p>
                    <button id="btnOpenModalEmpty" class="btn btn-primary btn-sm">
                        <i class="fas fa-plus"></i> Registrar primer usuario
                    </button>
                </td>
            </tr>
      `;

      const btnEmpty = document.getElementById("btnOpenModalEmpty");
      if (btnEmpty) {
        btnEmpty.addEventListener("click", () => openModal());
      }
    }

    tbody.innerHTML = user
      .map(
        (users) => `
      <tr data-user-id="${users.id}">
            <td>${formatId(users.id)}</td>
            <td><span class="cell-main">${escapeHtml(users.userName)}</span></td>
             <td><span class="cell-main">${escapeHtml(users.userLastName)}</span></td>
              <td><span class="cell-main">${escapeHtml(users.mail)}</span></td>
              <td><span class="cell-main">${escapeHtml(users.userPhone)}</span></td>
              <td><span class="cell-main">${escapeHtml(users.rolName)}</span></td>
            <td>
                <span class="badge ${users.isActive ? "status-active" : "status-inactive"}">
                    ${users.isActive ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td class="col-actions">
                <button
                    class="btn-icon btn-icon--edit"
                    onclick="edituser(${users.id})"
                    title="Editar ${escapeHtml(users.userName)}"
                    aria-label="Editar usuario ${escapeHtml(users.userName)}"
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

  // opcion para optener los roles

  async function getRoles() {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endponts.roles}`,
      );
      const resultado = await response.json();

      const select = document.getElementById("form-control-set");
      resultado.data.forEach((rol) => {
        const option = document.createElement("option");
        option.value = rol.id;
        option.textContent = rol.rolName;
        select.appendChild(option);
      });
    } catch (error) {
      console.log("se generó un error", error);
      return [];
    }
  }

  async function AddUser() {
    const btnSubmit = document.getElementById("btnsubmit");
    if (!btnSubmit) return;
    try {
      btnSubmit.addEventListener("click", async (event) => {
        event.preventDefault();

        const userName = document.getElementById("userName").value;
        const lastName = document.getElementById("userLastName").value;
        const mail = document.getElementById("userMail").value;
        const phone = document.getElementById("userPhone").value;
        const password = document.getElementById("userPassword").value;
        const roles = document.getElementById("form-control-set").value;
        const UserRoles = [
          {
            idRoles: parseInt(roles),
          },
        ];

        if (
          !userName ||
          !lastName ||
          (!mail && !phone) ||
          !password ||
          !UserRoles
        ) {
          alert("Debe completar los campos");
          return;
        }

        const response = await fetch(
          `${API_CONFIG.baseURL}${API_CONFIG.endponts.user}`,
          {
            method: "POST",
            headers: {
              "content-Type": "application/json",
            },
            body: JSON.stringify({
              userName: userName,
              userLastName: lastName,
              password: password,
              mail: mail,
              userPhone: phone,
              rolesIds: UserRoles,
            }),
          },
        );

        if (response.ok) {
          alert("usuario agregado con éxito");
          GetUsers();
          closeModal();
        }
      });
    } catch (error) {
      console.error("ocurrió un error", error);
    }
  }

  getRoles();
  AddUser();
  GetUsers();
});
