(function () {
  var modal = document.getElementById("productModal");
  var openBtn = document.getElementById("btnAddProduct");
  var form = document.getElementById("productForm");
  if (!modal || !openBtn) return;

  var closeSelector = "[data-close-modal]";

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var firstInput = form && form.querySelector("input, select");
    if (firstInput) firstInput.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  openBtn.addEventListener("click", openModal);

  modal.querySelectorAll(closeSelector).forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      closeModal();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      closeModal();
    });
  }
})();
