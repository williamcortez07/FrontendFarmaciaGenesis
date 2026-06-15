export function renderGlobalPagination(totalPages, currentPage, containerId, onPageChangeCallback) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`No existe el contenedor: ${containerId}`);
        return;
    }

    container.innerHTML = "";

    // 1.  Anterior
    container.innerHTML += `
        <li>
            <button
                class="page-link"
                ${currentPage === 1 ? "disabled" : ""}
                data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        </li>
    `;

    let pages = [];
    
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        pages.push(1);

        if (currentPage > 3) {
            pages.push('...');
        }

        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage === 1) end = 3;
        if (currentPage === totalPages) start = totalPages - 2;

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 2) {
            pages.push('...');
        }

        pages.push(totalPages);
    }

    pages.forEach(p => {
        if (p === '...') {
            // Elemento inactivo para los puntos suspensivos
            container.innerHTML += `
                <li>
                    <span class="page-link" style="pointer-events: none; background: transparent; border: none;">...</span>
                </li>
            `;
        } else {
            container.innerHTML += `
                <li>
                    <button
                        class="page-link ${p === currentPage ? "is-active" : ""}"
                        data-page="${p}">
                        ${p}
                    </button>
                </li>
            `;
        }
    });

    //Siguiente
    container.innerHTML += `
        <li>
            <button
                class="page-link"
                ${currentPage === totalPages ? "disabled" : ""}
                data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        </li>
    `;

    //Se asigna los eventos a los botones
    container.querySelectorAll("button.page-link[data-page]").forEach(button => {
        button.addEventListener("click", async () => {
            const page = parseInt(button.dataset.page);

            if (page < 1 || page > totalPages || page === currentPage) return;

            await onPageChangeCallback(page);
        });
    });
}
export function updatePaginationInfo(currentPage, pageSize, totalRecords, infoId, itemName = "registros") {

    const info = document.getElementById(infoId);

    if (!info) {
      console.log(`No existe el contenedor de info: ${infoId}`);
      return;
    }

    if (totalRecords === 0) {
        info.textContent = `Mostrando 0 a 0 de 0 ${itemName}`;
        return;
    }

    const start = ((currentPage - 1) * pageSize) + 1;
    const end = Math.min(currentPage * pageSize, totalRecords);

    info.textContent = `Mostrando ${start} a ${end} de ${totalRecords} ${itemName}`;
}
