import {
  renderGlobalPagination,
  updatePaginationInfo,
} from "./utils/pagination.js";

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

  // Variables de Paginación y Filtros
  let currentPage = 1;
  const limit = 10;
  let currentEstado = "";
  let currentSearch = "";

  const API_URL = "https://localhost:7204/api/Inventory/dashboard";

  // 1. Construir URL con parámetros
  const buildUrl = () => {
    let url = `${API_URL}?page=${currentPage}&limit=${limit}`;

    if (currentEstado) {
      url += `&estado=${encodeURIComponent(currentEstado)}`;
    }
    // Si tu C# soporta la búsqueda por nombre, descomenta esta línea:
    // if (currentSearch) url += `&searchTerm=${encodeURIComponent(currentSearch)}`;

    return url;
  };

  // 2. Función principal para cargar el inventario
  const cargarInventario = async () => {
    try {
      tablaPrincipal.innerHTML =
        '<tr><td colspan="7" style="text-align:center;">Cargando inventario...</td></tr>';

      const response = await fetch(buildUrl());
      if (!response.ok) throw new Error("Error al conectar con la API");

      const apiResponse = await response.json();

      // Accedemos a la data y la metadata según tu estructura en C#
      const dashboardData = apiResponse.data;
      const meta = apiResponse.meta;

      productosGlobales = dashboardData.items || [];
      lotesGlobales = dashboardData.batches || [];

      actualizarEstadisticas(dashboardData.summary);
      renderizarTablaPrincipal(productosGlobales);

      updatePaginationInfo(
        meta.currentPage,
        meta.itemsPerPage,
        meta.totalItems,
        "paginationInfo",
        "productos"
      );

      renderGlobalPagination(
        meta.totalPages,
        meta.currentPage,
        "paginationContainer",
        (newPage) => {
          currentPage = newPage;
          cargarInventario();
        }
      );

    } catch (error) {
      console.error("Error al cargar el inventario:", error);
      tablaPrincipal.innerHTML =
        '<tr><td colspan="7" style="text-align:center; color:#dc3545;">Error al cargar los datos. Verifica la conexión a la API.</td></tr>';
    }
  };

  const actualizarEstadisticas = (summary) => {
    if (!summary) return;
    statTotalProducts.textContent = summary.totalProductos;
    statLowStock.textContent = summary.stockBajo;
    statOutStock.textContent = summary.agotados;

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


  btnFilter.addEventListener("click", () => {
    currentSearch = inputSearch.value.toLowerCase().trim();

    currentEstado = "";
    if (selectStatus.value === "normal") currentEstado = "Normal";
    if (selectStatus.value === "low") currentEstado = "Critico";
    if (selectStatus.value === "out") currentEstado = "Agotado";

    currentPage = 1;

    cargarInventario();
  });
  

  // Evento para abrir modal
  tablaPrincipal.addEventListener("click", (e) => {
    const btnVerLotes = e.target.closest(".btn-ver-lotes");
    if (btnVerLotes) {
      const productoId = parseInt(btnVerLotes.getAttribute("data-id"));
      const productoNombre = btnVerLotes.getAttribute("data-nombre");
      abrirModalLotes(productoId, productoNombre);
    }
  });

  const abrirModalLotes = (id, nombre) => {
    nombreProductoSpan.textContent = nombre;
    modal.style.display = "flex";


    const lotesDelProducto = lotesGlobales.filter(
      (lote) => lote.productId === id,
    );
    renderizarLotes(lotesDelProducto);
  };

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

  const obtenerClaseEstadoHTML = (estado) => {
    if (estado === "Normal") return "success";
    if (estado === "Critico") return "warning";
    return "danger";
  };

  const obtenerColorTextoLote = (estado) => {
    if (estado === "Vigente") return "text-success";
    if (estado === "Por vencer") return "text-warning";
    return "text-danger";
  };

  const exportarExcel = () => {
    if (!productosGlobales || productosGlobales.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const datos = productosGlobales.map((item) => ({
      ID: item.productId,
      Producto: item.producto,
      Categoría: item.categoria,
      Existencia: item.existencia,
      Precio: item.precio.toFixed(2),
      Estado: item.estado,
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "inventario.xlsx");
  };

  const btnExportExcel = document.getElementById("btnExportExcel");
  if (btnExportExcel) btnExportExcel.addEventListener("click", exportarExcel);

  btnClose.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Iniciar carga en la página 1 al cargar el DOM
  cargarInventario();
});