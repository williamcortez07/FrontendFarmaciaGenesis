/**
 * ==========================================
 * CONFIGURACIÓN GLOBAL Y ESTADO
 * ==========================================
 */
const API_CONFIG = {
    baseURL: "https://localhost:7204/api",
    endpoints: {
        products: "/Products",
        suppliers: "/Suppliers",
        categories: "/Categories",
        presentations: "/Presentation",
        brands: "/Brands",
        purchases: "/Purchase"
    },
};

// Declaración del estado global de la compra en memoria
let currentPurchase = {
    supplierId: 0,
    userId: 0,
    observation: "",
    details: []
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

function getHeaders() {
    const headers = {
        "Content-Type": "application/json"
    }; 
}


function openModal() {
    modal.style.display = "flex";
    setTimeout(() => {
        const productSelect = document.getElementById("product-select");
        if (productSelect) productSelect.focus();
    }, 100);
}

function closeModal() {
    modal.style.display = "none";
    clearDetailInputs(); 
}

// Eventos del Modal
if (btnAddDetail) {
    btnAddDetail.addEventListener("click", openModal);
}

closeButtons.forEach(btn => {
    btn.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "flex") {
        closeModal();
    }
});

if (purchaseForm) {
    purchaseForm.addEventListener("submit", function (e) {
        e.preventDefault();
        addPurchaseDetail();
        closeModal();
    });
}

function addPurchaseDetail() {
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
        unitPrice: parseFloat(unitPrice)
    };
    console.log(newDetail )

    

    currentPurchase.details.push(newDetail);
    renderPurchaseTable(); 
}

function removeDetail(index) {
    currentPurchase.details.splice(index, 1);
    renderPurchaseTable();
}


function renderPurchaseTable() {
    const tbody = document.getElementById("purchase-table-body");
    const totalAmountSpan = document.getElementById("purchase-total-amount");

    tbody.innerHTML = "";

    if (currentPurchase.details.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: #6c757d;">
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

        const expDateFormatted = new Date(detail.expirationDate).toLocaleDateString('es-NI');

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="padding: 10px;">${detail.productName || 'N/A'}</td>
            <td style="padding: 10px;">${detail.batchNumber}</td>
            <td style="padding: 10px;">${expDateFormatted}</td>
            <td style="padding: 10px;">${detail.quantity}</td>
            <td style="padding: 10px;">C$ ${detail.unitPrice.toFixed(2)}</td>
            <td style="padding: 10px;">C$ ${subtotal.toFixed(2)}</td>
            <td style="padding: 10px; text-align: center;">
                <button type="button" onclick="removeDetail(${index})" style="background: none; border: none; color: #dc3545; cursor: pointer; font-size: 16px;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    totalAmountSpan.textContent = `C$ ${totalEstimado.toFixed(2)}`;
}

function resetPurchaseForm() {
    currentPurchase.supplierId = 0;
    currentPurchase.observation = "";
    currentPurchase.details = [];

    document.getElementById("supplier-select").value = "";
    document.getElementById("observation-input").value = "";

    renderPurchaseTable();
}

function clearDetailInputs() {
    if (purchaseForm) purchaseForm.reset();
}



async function loadSuppliers() {
    try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.suppliers}`, {
            headers: getHeaders()
        });

        if (!response.ok) throw new Error("Error en la respuesta del servidor");

        const responseJson = await response.json();
        const suppliers = responseJson.data || responseJson;
        const supplierSelect = document.getElementById("supplier-select");

        suppliers.forEach(supplier => {
            const option = document.createElement("option");
            option.value = supplier.id;
            option.textContent = supplier.supplierName;
            supplierSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando proveedores:", error);
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.products}`, {
            headers: getHeaders()
        });

        if (!response.ok) throw new Error("Error en la respuesta del servidor");

        const responseJson = await response.json();
        const products = responseJson.data || responseJson;
        const productSelect = document.getElementById("product-select");

        products.forEach(product => {
            const option = document.createElement("option");
            option.value = product.id;
            option.textContent = product.tradeName; 
            productSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}


async function savePurchase() {
    // 1. Validar que la tabla no esté vacía
    if (currentPurchase.details.length === 0) {
        alert("No puedes guardar una compra vacía.");
        return;
    }

    // 2. Validar sesión
    const currentUserId = parseInt(localStorage.getItem("currentUserId"), 10 || 1); 
    if (!currentUserId || isNaN(currentUserId)) {
        alert("Sesión no válida. Por favor, inicie sesión nuevamente.");
        return; 
    }

    // 3. Validar Proveedor
    const supplierSelectValue = document.getElementById("supplier-select").value;
    if (!supplierSelectValue || isNaN(supplierSelectValue)) {
        alert("Por favor, seleccione un proveedor de la lista.");
        return;
    }

    // ==========================================
    // CORRECCIÓN: Asignar los valores validados al estado
    // ==========================================
    currentPurchase.supplierId = parseInt(supplierSelectValue,10);
    currentPurchase.observation = document.getElementById("observation-input").value.trim();
    currentPurchase.userId = parseInt(currentUserId); // <--- ESTA ES LA LÍNEA QUE FALTABA

    // Bloqueo de UX
    const btnSave = document.getElementById("btn-save-purchase");
    const originalBtnText = btnSave.innerHTML;
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    // Preparar el Payload exacto para C#
    const payloadToAPI = {
        supplierId: currentPurchase.supplierId,
        userId: currentPurchase.userId,
        observation: currentPurchase.observation,
        details: currentPurchase.details.map(d => ({
            productId: d.productId,
            batchNumber: d.batchNumber,
            expirationDate: d.expirationDate,
            manufacturingDate: d.manufacturingDate,
            quantity: d.quantity,
            unitPrice: d.unitPrice
        }))
    };

    try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.purchases}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "*/*" 
            },
            body: JSON.stringify(payloadToAPI) 
        });

        if (response.ok) {
            alert("Compra registrada exitosamente.");
            resetPurchaseForm(); 
        } else {
            // CORRECCIÓN: Manejo de errores seguro
            const errorText = await response.text(); 
            let errorMessage = "Error desconocido";
            try {
                const errorJson = JSON.parse(errorText);
                console.error("Detalles del servidor:", errorJson);
                errorMessage = errorJson.title || "Revisa la consola para más detalles";
            } catch (e) {
                errorMessage = errorText || `Error HTTP ${response.status}`;
            }
            alert(`Hubo un error al registrar la compra: ${errorMessage}`);
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("No se pudo conectar con el servidor.");
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

    // Vincular el botón de guardado global
    if (btnSavePurchase) {
        btnSavePurchase.addEventListener("click", savePurchase);
    }
});