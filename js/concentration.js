(function() {
    

    // --- 1. ELEMENTOS DEL DOM ---
    const showBtn = document.getElementById('showFormBtn');
    const formContainer = document.getElementById('concentrationFormContainer');
    const cancelBtn = document.getElementById('cancelFormBtn');
    const saveBtn = document.getElementById('saveConcentrationBtn');
    const list = document.getElementById('concentrationsList');

    // Inputs específicos de concentración
    const valInput = document.getElementById('concentrationValue');
    const unitInput = document.getElementById('concentrationUnit');
    const catInput = document.getElementById('concentrationCategory');


    // --- 2. FUNCIONES DE INTERFAZ ---

    // Abrir formulario
    if (showBtn) {
        showBtn.addEventListener('click', () => {
            formContainer.classList.remove('hidden');
            showBtn.classList.add('hidden');
            valInput.focus();
        });
    }

    // Cerrar/Cancelar formulario
    const closeForm = () => {
        formContainer.classList.add('hidden');
        showBtn.classList.remove('hidden');
        // Limpiar campos
        valInput.value = '';
        unitInput.value = '';
        catInput.selectedIndex = 0;
    };

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeForm);
    }

})();