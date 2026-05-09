(function() {
  // Elementos
  const showBtn = document.getElementById('showFormBtn');
  const formContainer = document.getElementById('presentationFormContainer');
  const cancelBtn = document.getElementById('cancelFormBtn');
  const saveBtn = document.getElementById('savePresentationBtn');
  const nameInput = document.getElementById('presentationName');
  const abbrInput = document.getElementById('presentationAbbr');
  const categoryInput = document.getElementById('presentationCategory');
  const presentationsList = document.getElementById('presentationsList');

  showBtn.addEventListener('click', function() {
    formContainer.classList.remove('hidden');
    showBtn.classList.add('hidden');
  });

  cancelBtn.addEventListener('click', function() {
    formContainer.classList.add('hidden');
    showBtn.classList.remove('hidden');
  });

})();
