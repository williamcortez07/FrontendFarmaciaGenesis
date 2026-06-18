const API_CONFIG = {
  baseURL: "https://localhost:7204/api",
  endpoints: {
    products: "/Products",
    suppliers: "/Suppliers",
    categories: "/Categories",
    presentations: "/Presentation",
    brands: "/Brands",
    purchases: "/Purchase",
  },
};

// Declaración del estado global de la compra en memoria
let currentPurchase = {
  supplierId: 0,
  userId: 0,
  observation: "",
  details: [],
};

/**
 * ==========================================
 * REFERENCIAS DEL DOM
 * ==========================================
 */
const modal = document.getElementById("f-Modal");
const btnAddDetail = document.getElementById("btn-add-detail");
const btnSavePurchase = document.getElementById("btn-save-purchase");
const closeButtons = document.querySelectorAll("[data-close-modal]");
const purchaseForm = document.getElementById("purchaseForm");

/**
 * ==========================================
 * UTILIDAD: Sistema de Notificaciones Toast
 * ==========================================
 * Reemplaza los alert() nativos por notificaciones
 * no intrusivas con estados semánticos.
 */
function showToast(message, type = "info", duration = 4000) {
  const ICONS = {
    success: "fa-circle-check",
    error: "fa-circle-xmark",
    warning: "fa-triangle-exclamation",
    info: "fa-circle-info",
  };

  // Crear contenedor si no existe
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
    <button type="button" class="toast__close" aria-label="Cerrar notificación">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
  `;

  // Cerrar al hacer clic en la X
  toast.querySelector(".toast__close").addEventListener("click", () => {
    dismissToast(toast);
  });

  container.appendChild(toast);

  // Forzar reflow para activar la animación de entrada
  toast.offsetHeight;
  toast.classList.add("toast--visible");

  // Auto-cierre
  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }
}

function dismissToast(toast) {
  if (!toast || toast.classList.contains("toast--dismissing")) return;
  toast.classList.add("toast--dismissing");
  toast.addEventListener("animationend", () => toast.remove(), { once: true });
}

/**
 * ==========================================
 * UTILIDAD: Obtener Headers para peticiones
 * ==========================================
 */
function getHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  return headers;
}

/**
 * ==========================================
 * MODAL: Apertura y Cierre
 * ==========================================
 * Usa clases CSS (is-open) en lugar de style.display
 * para mantener consistencia con los demás módulos.
 */
function openModal() {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  // Focus en el primer campo interactivo
  setTimeout(() => {
    const productSelect = document.getElementById("product-select");
    if (productSelect) productSelect.focus();
  }, 100);
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  clearDetailInputs();
  clearFieldErrors();
}

// Eventos del Modal
if (btnAddDetail) {
  btnAddDetail.addEventListener("click", openModal);
}

closeButtons.forEach((btn) => {
  btn.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && modal.classList.contains("is-open")) {
    closeModal();
  }
});

if (purchaseForm) {
  purchaseForm.addEventListener("submit", function (e) {
    e.preventDefault();
    addPurchaseDetail();
  });
}

/**
 * ==========================================
 * VALIDACIÓN: Formulario de Detalle
 * ==========================================
 * Valida todos los campos del modal antes de
 * agregar un detalle a la tabla de compra.
 */
function validateDetailForm() {
  const errors = [];
  clearFieldErrors();

  // 1. Producto seleccionado
  const productSelect = document.getElementById("product-select");
  const productId = productSelect ? productSelect.value : "";
  if (!productId) {
    errors.push("Debes seleccionar un producto.");
    markFieldError("product-select");
  }

  // 2. Número de lote no vacío
  const batchInput = document.getElementById("batch-input");
  const batchNumber = batchInput ? batchInput.value.trim() : "";
  if (!batchNumber) {
    errors.push("El número de lote es obligatorio.");
    markFieldError("batch-input");
  }

  // 3. Cantidad > 0 y entero
  const qtyInput = document.getElementById("qty-input");
  const quantity = qtyInput ? parseInt(qtyInput.value, 10) : 0;
  if (!qtyInput.value || isNaN(quantity) || quantity < 1) {
    errors.push("La cantidad debe ser un número entero mayor a cero.");
    markFieldError("qty-input");
  } else if (!Number.isInteger(Number(qtyInput.value))) {
    errors.push("La cantidad debe ser un número entero, sin decimales.");
    markFieldError("qty-input");
  }

  // 4. Precio unitario >= 0.01
  const priceInput = document.getElementById("price-input");
  const unitPrice = priceInput ? parseFloat(priceInput.value) : 0;
  if (!priceInput.value || isNaN(unitPrice) || unitPrice < 0.01) {
    errors.push("El costo unitario debe ser al menos C$ 0.01.");
    markFieldError("price-input");
  }

  // 5. Fecha de vencimiento presente
  const expInput = document.getElementById("exp-date-input");
  const expirationDate = expInput ? expInput.value : "";
  if (!expirationDate) {
    errors.push("La fecha de vencimiento es obligatoria.");
    markFieldError("exp-date-input");
  } else {
    const expDate = new Date(expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(expDate.getTime())) {
      errors.push("La fecha de vencimiento no es válida.");
      markFieldError("exp-date-input");
    } else if (expDate <= today) {
      errors.push("La fecha de vencimiento debe ser una fecha futura.");
      markFieldError("exp-date-input");
    }
  }

  // 6. Fecha de fabricación < fecha de vencimiento (cuando se proporciona)
  const mfgInput = document.getElementById("mfg-date-input");
  const manufacturingDate = mfgInput ? mfgInput.value : "";
  if (manufacturingDate && expirationDate) {
    const mfgDate = new Date(manufacturingDate);
    const expDate = new Date(expirationDate);
    if (isNaN(mfgDate.getTime())) {
      errors.push("La fecha de fabricación no es válida.");
      markFieldError("mfg-date-input");
    } else if (mfgDate >= expDate) {
      errors.push(
        "La fecha de fabricación debe ser anterior a la fecha de vencimiento."
      );
      markFieldError("mfg-date-input");
    }
  }

  // 7. Duplicidad de producto + lote en detalles existentes
  if (productId && batchNumber) {
    const duplicate = currentPurchase.details.find(
      (d) =>
        d.productId === parseInt(productId, 10) &&
        d.batchNumber.toLowerCase() === batchNumber.toLowerCase()
    );
    if (duplicate) {
      errors.push(
        `El producto "${productSelect.options[productSelect.selectedIndex].text}" con lote "${batchNumber}" ya fue agregado.`
      );
      markFieldError("product-select");
      markFieldError("batch-input");
    }
  }

  return errors;
}

/**
 * Marca visualmente un campo con error
 */
function markFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.add("is-invalid");
  }
}

/**
 * Limpia las marcas de error de todos los campos del modal
 */
function clearFieldErrors() {
  const invalidFields = document.querySelectorAll(
    "#purchaseForm .is-invalid"
  );
  invalidFields.forEach((field) => field.classList.remove("is-invalid"));
}

/**
 * ==========================================
 * DETALLE: Agregar línea de detalle
 * ==========================================
 */
function addPurchaseDetail() {
  // Ejecutar validaciones antes de procesar
  const errors = validateDetailForm();
  if (errors.length > 0) {
    showToast(errors[0], "warning");
    return;
  }

  const productSelect = document.getElementById("product-select");
  const productId = productSelect.value;
  const productName = productSelect.options[productSelect.selectedIndex].text;

  const batchNumber = document.getElementById("batch-input").value;
  const expirationDate = document.getElementById("exp-date-input").value;
  const manufacturingDate = document.getElementById("mfg-date-input").value;
  const quantity = document.getElementById("qty-input").value;
  const unitPrice = document.getElementById("price-input").value;

  const isoExpiration = new Date(expirationDate).toISOString();
  const isoManufacturing = manufacturingDate
    ? new Date(manufacturingDate).toISOString()
    : new Date().toISOString();

  const newDetail = {
    productId: parseInt(productId, 10),
    productName: productName,
    batchNumber: batchNumber.trim(),
    expirationDate: isoExpiration,
    manufacturingDate: isoManufacturing,
    quantity: parseInt(quantity, 10),
    unitPrice: parseFloat(unitPrice),
  };

  currentPurchase.details.push(newDetail);
  renderPurchaseTable();
  closeModal();
  showToast(
    `"${productName}" agregado correctamente a la factura.`,
    "success",
    3000
  );
}

/**
 * ==========================================
 * DETALLE: Eliminar línea de detalle
 * ==========================================
 */
function removeDetail(index) {
  const removedName =
    currentPurchase.details[index]?.productName || "Producto";
  currentPurchase.details.splice(index, 1);
  renderPurchaseTable();
  showToast(`"${removedName}" eliminado de la factura.`, "info", 3000);
}

/**
 * ==========================================
 * TABLA: Renderizado del detalle de compra
 * ==========================================
 */
function renderPurchaseTable() {
  const tbody = document.getElementById("purchase-table-body");
  const totalAmountSpan = document.getElementById("purchase-total-amount");

  if (!tbody || !totalAmountSpan) return;

  tbody.innerHTML = "";

  if (currentPurchase.details.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="purchase-table__empty-state">
          <i class="fa-solid fa-box-open" aria-hidden="true"></i>
          No hay productos agregados a la factura todavía.
        </td>
      </tr>
    `;
    totalAmountSpan.textContent = "C$ 0.00";
    return;
  }

  let totalEstimado = 0;

  currentPurchase.details.forEach((detail, index) => {
    const subtotal = detail.quantity * detail.unitPrice;
    totalEstimado += subtotal;

    const expDateFormatted = new Date(
      detail.expirationDate
    ).toLocaleDateString("es-NI");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${detail.productName || "N/A"}</td>
      <td>${detail.batchNumber}</td>
      <td>${expDateFormatted}</td>
      <td>${detail.quantity}</td>
      <td>C$ ${detail.unitPrice.toFixed(2)}</td>
      <td>C$ ${subtotal.toFixed(2)}</td>
      <td class="purchase-table__actions-cell">
        <button
          type="button"
          class="purchase-btn-delete"
          onclick="removeDetail(${index})"
          title="Eliminar ${detail.productName || "producto"}"
          aria-label="Eliminar ${detail.productName || "producto"} de la factura"
        >
          <i class="fa-solid fa-trash" aria-hidden="true"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  totalAmountSpan.textContent = `C$ ${totalEstimado.toFixed(2)}`;
}

/**
 * ==========================================
 * FORMULARIO: Reset completo
 * ==========================================
 */
function resetPurchaseForm() {
  currentPurchase.supplierId = 0;
  currentPurchase.observation = "";
  currentPurchase.details = [];

  const supplierSelect = document.getElementById("supplier-select");
  const observationInput = document.getElementById("observation-input");

  if (supplierSelect) supplierSelect.value = "";
  if (observationInput) observationInput.value = "";

  renderPurchaseTable();
}

function clearDetailInputs() {
  if (purchaseForm) purchaseForm.reset();
}

/**
 * ==========================================
 * CARGA DE DATOS: Proveedores
 * ==========================================
 */
async function loadSuppliers() {
  const supplierSelect = document.getElementById("supplier-select");

  try {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}`,
      {
        headers: getHeaders(),
      }
    );

    if (!response.ok) throw new Error("Error en la respuesta del servidor");

    const responseJson = await response.json();
    const suppliers = responseJson.data || responseJson;

    if (!suppliers || suppliers.length === 0) {
      showToast(
        "No se encontraron proveedores registrados. Registra uno antes de crear una compra.",
        "warning",
        6000
      );
      return;
    }

    suppliers.forEach((supplier) => {
      const option = document.createElement("option");
      option.value = supplier.id;
      option.textContent = supplier.supplierName;
      supplierSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando proveedores:", error);
    showToast(
      "No fue posible cargar la lista de proveedores. Verifica tu conexión e intenta recargar la página.",
      "error",
      6000
    );
  }
}

/**
 * ==========================================
 * CARGA DE DATOS: Productos
 * ==========================================
 */
async function loadProducts() {
  const productSelect = document.getElementById("product-select");

  try {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.products}`,
      {
        headers: getHeaders(),
      }
    );

    if (!response.ok) throw new Error("Error en la respuesta del servidor");

    const responseJson = await response.json();
    const products = responseJson.data || responseJson;

    if (!products || products.length === 0) {
      showToast(
        "No se encontraron productos registrados. Registra uno antes de crear una compra.",
        "warning",
        6000
      );
      return;
    }

    products.forEach((product) => {
      const option = document.createElement("option");
      option.value = product.id;
      option.textContent = product.tradeName;
      productSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando productos:", error);
    showToast(
      "No fue posible cargar la lista de productos. Verifica tu conexión e intenta recargar la página.",
      "error",
      6000
    );
  }
}

/**
 * ==========================================
 * GUARDAR COMPRA: Envío al backend
 * ==========================================
 */
async function savePurchase() {
  // 1. Validar que la tabla no esté vacía
  if (currentPurchase.details.length === 0) {
    showToast(
      "Debes agregar al menos un producto a la factura para poder guardar la compra.",
      "warning"
    );
    return;
  }

  // 2. Validar sesión
  const storedUserId = localStorage.getItem("currentUserId") || "0";
  const currentUserId = parseInt(storedUserId, 10);
  if (!currentUserId || isNaN(currentUserId) || currentUserId <= 0) {
    showToast(
      "Tu sesión no es válida o ha expirado. Por favor, inicia sesión nuevamente.",
      "error",
      6000
    );
    return;
  }

  // 3. Validar Proveedor
  const supplierSelect = document.getElementById("supplier-select");
  const supplierSelectValue = supplierSelect ? supplierSelect.value : "";
  if (!supplierSelectValue || isNaN(parseInt(supplierSelectValue, 10))) {
    showToast(
      "Debes seleccionar un proveedor de la lista antes de guardar.",
      "warning"
    );
    if (supplierSelect) supplierSelect.focus();
    return;
  }

  // Asignar los valores validados al estado
  currentPurchase.supplierId = parseInt(supplierSelectValue, 10);
  currentPurchase.observation = document
    .getElementById("observation-input")
    .value.trim();
  currentPurchase.userId = currentUserId;

  // Bloqueo de UX — deshabilitar botón durante el envío
  const btnSave = document.getElementById("btn-save-purchase");
  const originalBtnText = btnSave.innerHTML;
  btnSave.disabled = true;
  btnSave.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

  // Preparar el Payload exacto para el endpoint C#
  const payloadToAPI = {
    supplierId: currentPurchase.supplierId,
    userId: currentPurchase.userId,
    observation: currentPurchase.observation,
    details: currentPurchase.details.map((d) => ({
      productId: d.productId,
      batchNumber: d.batchNumber,
      expirationDate: d.expirationDate,
      manufacturingDate: d.manufacturingDate,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
    })),
  };

  try {
    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.purchases}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify(payloadToAPI),
      }
    );

    if (response.ok) {
      showToast(
        "¡La compra se registró correctamente y el inventario fue actualizado!",
        "success",
        5000
      );
      resetPurchaseForm();
    } else {
      // Manejo de errores seguro
      const errorText = await response.text();
      let errorMessage = "Ocurrió un problema inesperado.";
      try {
        const errorJson = JSON.parse(errorText);
        console.error("Detalles del servidor:", errorJson);
        errorMessage =
          errorJson.title ||
          errorJson.message ||
          "Revisa los datos e inténtalo nuevamente.";
      } catch (e) {
        errorMessage =
          errorText || "No fue posible procesar la solicitud.";
      }
      showToast(
        `No fue posible registrar la compra: ${errorMessage}`,
        "error",
        6000
      );
    }
  } catch (error) {
    console.error("Error de red:", error);
    showToast(
      "No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo nuevamente.",
      "error",
      6000
    );
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = originalBtnText;
  }
}

/**
 * ==========================================
 * INICIALIZACIÓN
 * ==========================================
 */
document.addEventListener("DOMContentLoaded", () => {
  loadSuppliers();
  loadProducts();
  renderPurchaseTable();

  // Vincular el botón de guardado global
  if (btnSavePurchase) {
    btnSavePurchase.addEventListener("click", savePurchase);
  }
});
