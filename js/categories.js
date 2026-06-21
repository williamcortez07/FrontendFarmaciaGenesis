
(function() {
  // Elementos
  const showBtn = document.getElementById('showFormBtn');
  const formContainer = document.getElementById('categoryFormContainer');
  const cancelBtn = document.getElementById('cancelFormBtn');
  const saveBtn = document.getElementById('saveCategoryBtn');
  const nameInput = document.getElementById('newCatName');
  const descInput = document.getElementById('newCatDesc');
  const countInput = document.getElementById('newCatCount');
  const categoriesList = document.getElementById('categoriesList');

  showBtn.addEventListener('click', function() {
    formContainer.classList.remove('hidden');
    showBtn.classList.add('hidden');
  });


  cancelBtn.addEventListener('click', function() {
    formContainer.classList.add('hidden');
    showBtn.classList.remove('hidden');

  });

})();