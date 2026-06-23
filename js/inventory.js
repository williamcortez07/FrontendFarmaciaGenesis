document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modalLotes");
  const btnClose = document.querySelector(".close-modal");
  const tbodyLotes = document.getElementById("tablaLotesBody");
  const nombreProductoSpan = document.getElementById("modalProductoNombre");
  const tablaPrincipal = document.getElementById("inventoryTableBody");

  const statTotalProducts = document.getElementById("totalProducts");
  const statLowStock = document.getElementById("lowStock");
  const statOutStock = document.getElementById("outStock");
  const statInventoryValue = document.getElementById("inventoryValue");

  const inputSearch = document.getElementById("searchProduct");
  const selectStatus = document.getElementById("statusFilter");
  const btnFilter = document.querySelector(".btn-filter");

  let lotesGlobales = [];
  let productosGlobales = [];

  // URL base de la API
  const API_URL = "https://localhost:7204/api/Inventory/inventary";

  // 2. Función para cargar TODO el dashboard al iniciar
  const cargarInventario = async () => {
    try {
      tablaPrincipal.innerHTML =
        '<tr><td colspan="7" style="text-align:center;">Cargando inventario...</td></tr>';

      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Error al conectar con la API");

      const apiResponse = await response.json();
      const dashboardData = apiResponse.data;

      productosGlobales = dashboardData.items;
      lotesGlobales = dashboardData.batches;

      actualizarEstadisticas(dashboardData.summary);

      renderizarTablaPrincipal(productosGlobales);
    } catch (error) {
      console.error("Error al cargar el inventario:", error);
      tablaPrincipal.innerHTML =
        '<tr><td colspan="7" style="text-align:center; color:#dc3545;">Error al cargar los datos. Verifica la conexión a la API.</td></tr>';
    }
  };

  const actualizarEstadisticas = (summary) => {
    statTotalProducts.textContent = summary.totalProductos;
    statLowStock.textContent = summary.stockBajo;
    statOutStock.textContent = summary.agotados;

    // Formatear el valor del inventario con comas y 2 decimales
    const valorFormateado = summary.valorInventario.toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    statInventoryValue.textContent = `C$ ${valorFormateado}`;
  };

  const renderizarTablaPrincipal = (items) => {
    tablaPrincipal.innerHTML = "";

    if (!items || items.length === 0) {
      tablaPrincipal.innerHTML =
        '<tr><td colspan="7" style="text-align:center;">No se encontraron productos.</td></tr>';
      return;
    }

    items.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${item.productId}</td>
                <td>${item.producto}</td>
                <td>${item.categoria}</td>
                <td>${item.existencia}</td>
                <td>C$ ${item.precio.toFixed(2)}</td>
                <td>
                    <span class="badge ${obtenerClaseEstadoHTML(item.estado)}">
                        ${item.estado}
                    </span>
                </td>
                <td>
                    <button class="action-btn btn-ver-lotes" data-id="${item.productId}" data-nombre="${item.producto}" title="Ver Lotes">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
      tablaPrincipal.appendChild(tr);
    });
  };

  // 5. Lógica de Filtros en Memoria
  btnFilter.addEventListener("click", () => {
    const searchTerm = inputSearch.value.toLowerCase().trim();
    const statusTerm = selectStatus.options[selectStatus.selectedIndex].text;
    let filtrados = productosGlobales;

    // Filtrar por Nombre
    if (searchTerm !== "") {
      filtrados = filtrados.filter((p) =>
        p.producto.toLowerCase().includes(searchTerm),
      );
    }

    // Filtrar por Estado (Mapeando el valor del select de tu HTML al texto de la BD)
    if (selectStatus.value !== "") {
      let estadoBuscado = "";
      if (selectStatus.value === "normal") estadoBuscado = "Normal";
      if (selectStatus.value === "low") estadoBuscado = "Critico";
      if (selectStatus.value === "out") estadoBuscado = "Agotado";

      filtrados = filtrados.filter((p) => p.estado === estadoBuscado);
    }

    renderizarTablaPrincipal(filtrados);
  });

  tablaPrincipal.addEventListener("click", (e) => {
    const btnVerLotes = e.target.closest(".btn-ver-lotes");
    if (btnVerLotes) {
      const productoId = parseInt(btnVerLotes.getAttribute("data-id"));
      const productoNombre = btnVerLotes.getAttribute("data-nombre");

      abrirModalLotes(productoId, productoNombre);
    }
  });

  // 7. Abrir modal y filtrar lotes
  const abrirModalLotes = (id, nombre) => {
    nombreProductoSpan.textContent = nombre;
    modal.style.display = "flex"; // Usando flex para mantener centrado si tu CSS lo usa

    const lotesDelProducto = lotesGlobales.filter(
      (lote) => lote.productId === id,
    );
    renderizarLotes(lotesDelProducto);
  };

  // 8. Renderizar filas del modal
  const renderizarLotes = (listaLotes) => {
    tbodyLotes.innerHTML = "";

    if (!listaLotes || listaLotes.length === 0) {
      tbodyLotes.innerHTML =
        '<tr><td colspan="4" style="text-align:center;">No hay lotes disponibles para este producto.</td></tr>';
      return;
    }

    listaLotes.forEach((lote) => {
      const fechaVencimiento = new Date(
        lote.fechaVencimiento,
      ).toLocaleDateString("es-NI");

      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td><strong>${lote.numeroLote}</strong></td>
                <td>${fechaVencimiento}</td>
                <td>${lote.cantidadDisponible} uds.</td>
                <td><span style="font-weight: 500;" class="${obtenerColorTextoLote(lote.estadoLote)}">${lote.estadoLote}</span></td>
            `;
      tbodyLotes.appendChild(tr);
    });
  };

  // --- Utilidades para Mapear Clases CSS de tu HTML ---
  const obtenerClaseEstadoHTML = (estado) => {
    if (estado === "Normal") return "success";
    if (estado === "Critico") return "warning";
    return "danger"; // Agotado
  };

  const obtenerColorTextoLote = (estado) => {
    if (estado === "Vigente") return "text-success"; // Asegúrate de tener estas clases en utilities.css o aplicarle style directo
    if (estado === "Por vencer") return "text-warning";
    return "text-danger"; // Vencido o Agotado
  };

  // --- Eventos para cerrar el modal ---
  btnClose.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Iniciar carga
  cargarInventario();
});
