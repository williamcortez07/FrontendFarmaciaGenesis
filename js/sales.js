document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURACIÓN Y ESTADO GLOBAL ---
  const API_CONFIG = {
    baseURL: "https://localhost:7204/api",
    endpoints: {
      sales: "/Sales",
      inventory: "/Inventory",
      stock: "/Stock",
      paymentMethods: "/PaymentMethod",
    },
    tokenKey: "tokenFarmacia",
  };

  // Estado reactivo local de la venta (Carrito)
  let currentSale = {
    clientName: "Cliente común",
    paymentMethodId: "",
    discount: 0,
    details: [], // Estructura: { productId, productName, price, quantity, subtotal, stock }
  };

  let pagination = {
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
  };

  // Cachés centralizadas de Negocio
  let productsCache = []; // Contiene la colección unificada de productos
  let paymentMethodsCache = [];
  let salesCache = []; // Historial de la página actual
  let selectedSaleId = null;

  // --- ELEMENTOS DEL DOM ---
  const modal = document.getElementById("sale-modal");
  const btnNewSale = document.getElementById("btn-new-sale");
  const btnCloseModal = modal
    ? modal.querySelectorAll("[data-close-modal]")
    : [];
  const clientNameInput = document.getElementById("sale-client-name");
  const paymentMethodSelect = document.getElementById("sale-payment-method");
  const productSelect = document.getElementById("sale-product-select");
  const productPriceInput = document.getElementById("sale-product-price");
  const productStockInput = document.getElementById("sale-product-stock");
  const productQtyInput = document.getElementById("sale-product-qty");
  const btnAddToCart = document.getElementById("btn-add-to-cart");
  const cartTableBody = document.getElementById("cart-table-body");
  const cartCountBadge = document.getElementById("cart-count");
  const discountInput = document.getElementById("sale-discount-input");
  const btnApplyDiscount = document.getElementById("btn-apply-discount");
  const cartSubtotalSpan = document.getElementById("cart-subtotal");
  const cartDiscountSpan = document.getElementById("cart-discount-amount");
  const cartTotalSpan = document.getElementById("cart-total");
  const btnCompleteSale = document.getElementById("btn-complete-sale");
  const salesTableBody = document.getElementById("sales-table-body");
  const saleSearchInput = document.getElementById("sale-search-input");
  const salesErrorState = document.getElementById("sales-error-state");
  const btnRetrySales = document.getElementById("btn-retry-sales");
  const detailSubtitle = document.getElementById("detail-subtitle");
  const detailTableBody = document.getElementById("detail-table-body");
  const detailSummary = document.getElementById("detail-summary");
  const detailSubtotalSpan = document.getElementById("detail-subtotal");
  const detailDiscountSpan = document.getElementById("detail-discount");
  const detailTotalSpan = document.getElementById("detail-total");

  // --- TOAST NOTIFICATIONS (Estilo Uniforme con Compras) ---
  function showToast(message, type = "info", duration = 4000) {
    const ICONS = {
      success: "fa-circle-check",
      error: "fa-circle-xmark",
      warning: "fa-triangle-exclamation",
      info: "fa-circle-info",
    };
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
      <i class="fa-solid ${ICONS[type] || ICONS.info} toast__icon" aria-hidden="true"></i>
      <span class="toast__message">${message}</span>
      <button type="button" class="toast__close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
    `;
    toast
      .querySelector(".toast__close")
      .addEventListener("click", () => toast.remove());
    container.appendChild(toast);
    toast.offsetHeight; // Reflow
    toast.classList.add("toast--visible");
    if (duration > 0) setTimeout(() => toast.remove(), duration);
  }

  // --- CONTROL DE HEADERS Y TOKEN JWT ---
  function getHeaders(includeContentType = true) {
    const token = localStorage.getItem(API_CONFIG.tokenKey);
    const headers = { Accept: "application/json" };
    if (includeContentType) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  function getUserIdFromToken() {
    const token = localStorage.getItem(API_CONFIG.tokenKey);
    if (!token) return null;
    try {
      const payloadBase64 = token.split(".")[1];
      const payloadJson = atob(
        payloadBase64.replace(/-/g, "+").replace(/_/g, "/"),
      );
      const payload = JSON.parse(payloadJson);
      const userId =
        payload.nameid ||
        payload.sub ||
        payload.userId ||
        payload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];
      return userId ? parseInt(userId, 10) : null;
    } catch (e) {
      console.error("[Ventas] Excepción decodificando JWT:", e);
      return null;
    }
  }

  // --- ESTRATEGIA PROMISE.ALL() PARA UNIFICAR PRODUCTOS ---
  async function loadUnifiedProducts() {
    if (!productSelect) return;
    try {
      productSelect.innerHTML = `<option value="">Seleccione un producto...</option>`;
      console.log(
        "[Ventas] Ejecutando peticiones paralelas de catálogo e inventario...",
      );

      const [inventoryResponse, stockResponse] = await Promise.all([
        fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.inventory}`, {
          headers: getHeaders(false),
        }),
        fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.stock}`, {
          headers: getHeaders(false),
        }),
      ]);

      if (!inventoryResponse.ok || !stockResponse.ok) {
        throw new Error(
          `Inconsistencia HTTP. Inventario: ${inventoryResponse.status}, Stock: ${stockResponse.status}`,
        );
      }

      const invResult = await inventoryResponse.json();
      const stockResult = await stockResponse.json();

      const inventoryData = invResult.data || invResult || [];
      const stockData = stockResult.data || stockResult || [];

      // Mapear y acumular cantidades disponibles del lote agrupadas por productId
      const stockAggregation = {};
      stockData.forEach((item) => {
        const pId = item.productId;
        if (pId) {
          stockAggregation[pId] =
            (stockAggregation[pId] || 0) + (item.availableQuantity || 0);
        }
      });

      // Cruce estructurado y centralizado
      productsCache = inventoryData.map((invItem) => {
        const id = invItem.productId;
        return {
          productId: id,
          productName:
            invItem.productGenericname || "Medicamento sin descripción",
          price: invItem.salePrice || 0,
          stock: stockAggregation[id] || 0,
        };
      });

      console.log(
        "[Ventas] Colección de productos unificada exitosamente:",
        productsCache,
      );

      // Renderizar el combobox ordenado
      productsCache.forEach((product) => {
        const option = document.createElement("option");
        option.value = product.productId;
        option.textContent = `${product.productName} (Disp: ${product.stock})`;
        productSelect.appendChild(option);
      });
    } catch (error) {
      console.error(
        "[Ventas] Error en la construcción del estado unificado de productos:",
        error,
      );
      showToast(
        "No se pudo estructurar el catálogo unificado de productos.",
        "error",
      );
    }
  }

  // Sincronización del combo de productos
  if (productSelect) {
    productSelect.addEventListener("change", () => {
      const selectedId = parseInt(productSelect.value, 10);
      if (isNaN(selectedId)) {
        productPriceInput.value = "—";
        productStockInput.value = "—";
        return;
      }

      const matchedProduct = productsCache.find(
        (p) => p.productId === selectedId,
      );
      if (matchedProduct) {
        productPriceInput.value = `C$ ${matchedProduct.price.toFixed(2)}`;
        productStockInput.value = matchedProduct.stock;
        productQtyInput.max = matchedProduct.stock;
        productQtyInput.value = 1;
      }
    });
  }

  // --- CARGA DE MÉTODOS DE PAGO ---
  async function loadPaymentMethods() {
    if (!paymentMethodSelect) return;
    try {
      paymentMethodSelect.innerHTML = `<option value="">Seleccione...</option>`;
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.paymentMethods}`,
        { headers: getHeaders(false) },
      );
      const result = await response.json();
      paymentMethodsCache = result.data || result || [];

      paymentMethodsCache.forEach((m) => {
        const option = document.createElement("option");
        option.value = m.paymentMethodId || m.id;
        option.textContent = m.name || "Método";
        paymentMethodSelect.appendChild(option);
      });
    } catch (e) {
      console.warn("[Ventas] Usando fallback para métodos de pago.");
      [
        { id: 7, name: "Efectivo" },
        { id: 8, name: "Tarjeta" },
      ].forEach((m) => {
        const option = document.createElement("option");
        option.value = m.id;
        option.textContent = m.name;
        paymentMethodSelect.appendChild(option);
      });
    }
  }

  // --- HISTORIAL DE VENTAS PAGINADO ---
  async function loadSalesHistory(page = 1) {
    showSalesSkeleton();
    if (salesErrorState) salesErrorState.style.display = "none";
    try {
      const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.sales}?pageNumber=${page}&pageSize=${pagination.pageSize}`;
      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(false),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      salesCache = result.invoices || [];
      pagination.currentPage = result.currentPage || page;
      pagination.totalPages = result.totalPages || 1;
      pagination.totalRecords = result.totalRecords || 0;

      renderSalesTable(salesCache);
      renderPaginationControls();
    } catch (error) {
      console.error("[Ventas] Error trayendo el historial:", error);
      showSalesError();
    }
  }

  function renderSalesTable(sales) {
    if (!salesTableBody) return;
    if (sales.length === 0) {
      salesTableBody.innerHTML = `<tr><td colspan="7" class="sale-table__empty-state"><i class="fa-solid fa-receipt"></i>No se registran facturas en esta página.</td></tr>`;
      return;
    }
    salesTableBody.innerHTML = sales
      .map((sale) => {
        const id = sale.invoiceId;
        const formattedDate = new Date(sale.registeredDate).toLocaleDateString(
          "es-NI",
          { day: "2-digit", month: "2-digit", year: "numeric" },
        );
        return `
        <tr data-sale-id="${id}" class="${selectedSaleId === id ? "is-selected" : ""}" style="cursor:pointer">
          <td>#${String(id).padStart(3, "0")}</td>
          <td><span class="cell-main">Usuario #${sale.userId}</span></td>
          <td>${escapeHtml(sale.clientName || "Cliente común")}</td>
          <td>${formattedDate}</td>
          <td><strong>C$ ${sale.total.toLocaleString("es-NI", { minimumFractionDigits: 2 })}</strong></td>
          <td><span class="badge" style="background:rgba(16,185,129,0.1); color:rgb(16,185,129); padding:2px 8px; border-radius:12px; font-size:11px;">Completada</span></td>
          <td class="sale-col-actions">
            <button type="button" class="sale-btn-view" data-id="${id}"><i class="fa-solid fa-file-invoice"></i></button>
          </td>
        </tr>
      `;
      })
      .join("");

    salesTableBody.querySelectorAll(".sale-btn-view").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        showSaleDetail(parseInt(btn.dataset.id, 10));
      });
    });
    salesTableBody.querySelectorAll("tr").forEach((tr) => {
      tr.addEventListener("click", () => {
        const id = parseInt(tr.dataset.saleId, 10);
        if (!isNaN(id)) showSaleDetail(id);
      });
    });
  }

  function renderPaginationControls() {
    let container = document.getElementById("sales-pagination");
    if (!container && salesTableBody) {
      container = document.createElement("div");
      container.id = "sales-pagination";
      container.style.cssText =
        "display:flex; justify-content:space-between; align-items:center; padding: 15px; background: var(--color-neutral-50); border-top:1px solid var(--border-color); font-size:12px;";
      salesTableBody.parentElement.after(container);
    }
    if (!container) return;
    container.innerHTML = `
      <div>Mostrando página <strong>${pagination.currentPage}</strong> de <strong>${pagination.totalPages}</strong> (${pagination.totalRecords} facturas)</div>
      <div style="display:flex; gap:10px;">
        <button type="button" class="sale-btn sale-btn--outline sale-btn--sm" id="btn-page-prev" ${pagination.currentPage === 1 ? "disabled" : ""}>Anterior</button>
        <button type="button" class="sale-btn sale-btn--outline sale-btn--sm" id="btn-page-next" ${pagination.currentPage === pagination.totalPages ? "disabled" : ""}>Siguiente</button>
      </div>
    `;
    document
      .getElementById("btn-page-prev")
      ?.addEventListener("click", () =>
        loadSalesHistory(pagination.currentPage - 1),
      );
    document
      .getElementById("btn-page-next")
      ?.addEventListener("click", () =>
        loadSalesHistory(pagination.currentPage + 1),
      );
  }

  async function showSaleDetail(saleId) {
    selectedSaleId = saleId;
    salesTableBody.querySelectorAll("tr").forEach((r) => {
      if (parseInt(r.dataset.saleId, 10) === saleId)
        r.classList.add("is-selected");
      else r.classList.remove("is-selected");
    });

    if (detailTableBody)
      detailTableBody.innerHTML = `<tr><td colspan="4" class="sale-table__empty-state"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>`;

    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.sales}/${saleId}`,
        { headers: getHeaders(false) },
      );
      const sale = await response.json();
      if (detailSubtitle)
        detailSubtitle.textContent = `Venta #${String(saleId).padStart(3, "0")} — ${sale.clientName || "Cliente"}`;

      const details = sale.details || [];
      if (details.length === 0) {
        detailTableBody.innerHTML = `<tr><td colspan="4" class="sale-table__empty-state">Sin registros detallados.</td></tr>`;
        if (detailSummary) detailSummary.style.display = "none";
        return;
      }

      detailTableBody.innerHTML = details
        .map((item) => {
          const name =
            item.productTradeName || item.productGenericName || "Medicamento";
          return `
          <tr>
            <td><span class="cell-main">${escapeHtml(name)}</span></td>
            <td>C$ ${(item.unitPrice || 0).toFixed(2)}</td>
            <td>${item.quantity || 0}</td>
            <td><strong>C$ ${(item.totalPrice || 0).toFixed(2)}</strong></td>
          </tr>
        `;
        })
        .join("");

      if (detailSubtotalSpan)
        detailSubtotalSpan.textContent = `C$ ${(sale.subTotal || 0).toFixed(2)}`;
      if (detailDiscountSpan)
        detailDiscountSpan.textContent = `- C$ ${(sale.discount || 0).toFixed(2)}`;
      if (detailTotalSpan)
        detailTotalSpan.textContent = `C$ ${(sale.totalAmount || 0).toFixed(2)}`;
      if (detailSummary) detailSummary.style.display = "flex";
    } catch (e) {
      console.error("[Ventas] Error al consultar detalle id:", saleId, e);
    }
  }

  // --- COMPORTAMIENTO INTERNO DEL CARRITO ---
  function openSaleModal() {
    if (!modal) return;
    currentSale = {
      clientName: "Cliente común",
      paymentMethodId: "",
      discount: 0,
      details: [],
    };
    if (clientNameInput) clientNameInput.value = "Cliente común";
    if (paymentMethodSelect) paymentMethodSelect.value = "";
    if (productSelect) productSelect.value = "";
    if (productPriceInput) productPriceInput.value = "—";
    if (productStockInput) productStockInput.value = "—";
    if (productQtyInput) productQtyInput.value = 1;
    if (discountInput) discountInput.value = 0;
    renderCartTable();
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeSaleModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  if (btnNewSale) btnNewSale.addEventListener("click", openSaleModal);
  btnCloseModal.forEach((btn) => btn.addEventListener("click", closeSaleModal));

  function addProductToCart() {
    const productId = parseInt(productSelect.value, 10);
    const qty = parseInt(productQtyInput.value, 10);

    if (isNaN(productId))
      return showToast("Por favor, elija un producto válido.", "warning");
    if (isNaN(qty) || qty < 1)
      return showToast("Cantidad debe ser mayor a 0.", "warning");

    const targetProduct = productsCache.find((p) => p.productId === productId);
    if (!targetProduct) return;

    const existingIndex = currentSale.details.findIndex(
      (d) => d.productId === productId,
    );
    let totalRequested = qty;
    if (existingIndex !== -1)
      totalRequested += currentSale.details[existingIndex].quantity;

    if (totalRequested > targetProduct.stock) {
      return showToast(
        `Stock insuficiente. Solo restan ${targetProduct.stock} unidades en el inventario real.`,
        "warning",
      );
    }

    if (existingIndex !== -1) {
      currentSale.details[existingIndex].quantity = totalRequested;
      currentSale.details[existingIndex].subtotal =
        totalRequested * targetProduct.price;
    } else {
      currentSale.details.push({
        productId: productId,
        productName: targetProduct.productName,
        price: targetProduct.price,
        quantity: qty,
        subtotal: qty * targetProduct.price,
        stock: targetProduct.stock,
      });
    }

    productSelect.value = "";
    productPriceInput.value = "—";
    productStockInput.value = "—";
    productQtyInput.value = 1;
    renderCartTable();
    showToast(
      `"${targetProduct.productName}" agregado al flujo de la venta.`,
      "success",
      1500,
    );
  }

  if (btnAddToCart) btnAddToCart.addEventListener("click", addProductToCart);

  window.updateCartQty = function (productId, delta) {
    const item = currentSale.details.find((d) => d.productId === productId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      removeCartItem(productId);
      return;
    }
    if (newQty > item.stock)
      return showToast(
        "Se alcanzó el límite del stock físico disponible.",
        "warning",
      );
    item.quantity = newQty;
    item.subtotal = newQty * item.price;
    renderCartTable();
  };

  window.removeCartItem = function (productId) {
    currentSale.details = currentSale.details.filter(
      (d) => d.productId !== productId,
    );
    renderCartTable();
  };

  function applyDiscount() {
    let disc = parseFloat(discountInput.value);
    if (isNaN(disc) || disc < 0) disc = 0;
    if (disc > 100) disc = 100;
    discountInput.value = disc;
    currentSale.discount = disc;
    recalculateCartTotals();
    showToast(`Descuento del ${disc}% configurado.`, "info", 1500);
  }
  if (btnApplyDiscount)
    btnApplyDiscount.addEventListener("click", applyDiscount);

  function recalculateCartTotals() {
    let subtotal = 0;
    currentSale.details.forEach((item) => (subtotal += item.subtotal));
    const amountDiscount = subtotal * (currentSale.discount / 100);
    const total = subtotal - amountDiscount;

    if (cartSubtotalSpan)
      cartSubtotalSpan.textContent = `C$ ${subtotal.toFixed(2)}`;
    if (cartDiscountSpan)
      cartDiscountSpan.textContent = `- C$ ${amountDiscount.toFixed(2)}`;
    if (cartTotalSpan) cartTotalSpan.textContent = `C$ ${total.toFixed(2)}`;
    if (cartCountBadge) cartCountBadge.textContent = currentSale.details.length;
  }

  function renderCartTable() {
    if (!cartTableBody) return;
    if (currentSale.details.length === 0) {
      cartTableBody.innerHTML = `<tr><td colspan="5" class="sale-table__empty-state"><i class="fa-solid fa-basket-shopping"></i>El carrito está vacío.</td></tr>`;
      recalculateCartTotals();
      return;
    }
    cartTableBody.innerHTML = currentSale.details
      .map(
        (item) => `
      <tr>
        <td><span class="cell-main">${escapeHtml(item.productName)}</span></td>
        <td>C$ ${item.price.toFixed(2)}</td>
        <td>
          <div class="sale-qty-control">
            <button type="button" class="sale-qty-btn" onclick="updateCartQty(${item.productId}, -1)">-</button>
            <input type="text" class="sale-qty-input" value="${item.quantity}" readonly />
            <button type="button" class="sale-qty-btn" onclick="updateCartQty(${item.productId}, 1)">+</button>
          </div>
        </td>
        <td>C$ ${item.subtotal.toFixed(2)}</td>
        <td style="text-align: center;">
          <button type="button" class="sale-btn-delete-cart" onclick="removeCartItem(${item.productId})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `,
      )
      .join("");
    recalculateCartTotals();
  }

  // --- METODO POST: DEPURACIÓN Y REGISTRO ---
  async function submitSale() {
    // Mecanismos de validaciones preventivas antes del Payload
    if (currentSale.details.length === 0)
      return showToast(
        "El carrito debe poseer al menos un artículo.",
        "warning",
      );

    const clientName = clientNameInput ? clientNameInput.value.trim() : "";
    if (!clientName)
      return showToast("Ingrese el nombre del comprador formal.", "warning");

    const paymentMethodId = parseInt(paymentMethodSelect.value, 10);
    if (isNaN(paymentMethodId))
      return showToast(
        "Por favor seleccione un método de pago válido.",
        "warning",
      );

    const userId = getUserIdFromToken();
    if (!userId)
      return showToast(
        "Sesión de usuario inválida. Inicie sesión nuevamente.",
        "error",
      );

    // LOG ESTRATÉGICO DE DIAGNÓSTICO (Objetivo 2)
    console.group("🚀 [Proceso de Venta] Iniciando Transmisión de Payload");

    const payload = {
      userId: userId,
      clientName: clientName,
      paymentMethodId: paymentMethodId,
      discount: parseFloat(currentSale.discount),
      details: currentSale.details.map((d) => ({
        productId: d.productId,
        quantity: d.quantity,
      })),
    };

    console.log(
      "1. Endpoint Destino:",
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.sales}`,
    );
    console.log(
      "2. Payload JSON Construido:",
      JSON.stringify(payload, null, 2),
    );
    console.log("3. Estado de Headers Autenticados:", getHeaders(true));
    console.groupEnd();

    // Bloqueo de UI (UX consistente con Compras)
    const originalText = btnCompleteSale.innerHTML;
    btnCompleteSale.disabled = true;
    btnCompleteSale.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Procesando...`;

    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.sales}`,
        {
          method: "POST",
          headers: getHeaders(true),
          body: JSON.stringify(payload),
        },
      );

      console.log(
        `[Ventas] Respuesta de red recibida: Código HTTP ${response.status}`,
      );

      if (response.ok) {
        showToast("¡Venta guardada y procesada de forma exitosa!", "success");
        closeSaleModal();
        await loadSalesHistory(1); // Recargar desde página 1 para ver el cambio inmediato
      } else {
        const errorText = await response.text();
        console.error("[Ventas] Servidor rechazó la petición:", errorText);
        let errorMsg =
          "Stock insuficiente en lotes o inconsistencia en la base de datos.";
        try {
          const errObj = JSON.parse(errorText);
          errorMsg = errObj.message || errObj.title || errorMsg;
        } catch (e) {}
        showToast(`Error al facturar: ${errorMsg}`, "error");
      }
    } catch (networkError) {
      console.error(
        "[Ventas] Excepción de enlace / red en Fetch:",
        networkError,
      );
      showToast(
        "Excepción de enlace de red con el servidor de la Farmacia.",
        "error",
      );
    } finally {
      btnCompleteSale.disabled = false;
      btnCompleteSale.innerHTML = originalText;
      console.log("[Ventas] Flujo HTTP completado.");
    }
  }

  if (btnCompleteSale) btnCompleteSale.addEventListener("click", submitSale);

  // --- FUNCIONES AUXILIARES ---
  function showSalesSkeleton() {
    if (!salesTableBody) return;
    salesTableBody.innerHTML = `
      <tr class="sale-skeleton-row"><td colspan="7"><div class="sale-shimmer"></div></td></tr>
      <tr class="sale-skeleton-row"><td colspan="7"><div class="sale-shimmer"></div></td></tr>
      <tr class="sale-skeleton-row"><td colspan="7"><div class="sale-shimmer"></div></td></tr>
    `;
  }

  function showSalesError() {
    if (salesTableBody) salesTableBody.innerHTML = "";
    if (salesErrorState) salesErrorState.style.display = "block";
  }

  if (btnRetrySales)
    btnRetrySales.addEventListener("click", () => loadSalesHistory(1));

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // --- ARRANQUE INICIAL ---
  async function initModule() {
    await loadPaymentMethods();
    await loadUnifiedProducts();
    await loadSalesHistory(1);
  }

  initModule();
});
