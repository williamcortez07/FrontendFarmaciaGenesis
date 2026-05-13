/*

const continer = document.querySelector(".continer");
const btnSingIn = document.getElementById("btn-sing-in"); // Este es el del panel de bienvenida
const btnSingUp = document.getElementById("btn-sing-up");
const btnLoginSubmit = document.getElementById("btn-login-submit"); // El nuevo ID del botón del formulario

btnSingIn.addEventListener("click", () => {
  continer.classList.remove("toogle");
});

if (btnSingUp) {
  btnSingUp.addEventListener("click", () => {
    continer.classList.add("toogle");
  });
}

// Evento para redireccionar al Sidebar
btnLoginSubmit.addEventListener("click", (e) => {
  // Evitamos que el formulario se envíe de forma tradicional si fuera necesario
  e.preventDefault();
  window.location.href = "pages/components/sidebar.html";
});



document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const btnSignIn = document.getElementById("btn-sign-in");
  const btnSignUp = document.getElementById("btn-sign-up");
  const btnLoginSubmit = document.getElementById("btn-login-submits");

  if (btnSignIn && container) {
    btnSignIn.addEventListener("click", () => {
      container.classList.remove("toggle");
    });
  }

  if (btnSignUp && container) {
    btnSignUp.addEventListener("click", () => {
      container.classList.add("toggle");
    });
  }

  if (btnLoginSubmit) {
    btnLoginSubmit.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "/pages/home.html";
    });
  }
});


*/

// Buscamos el botón usando el nuevo ID que le pusiste en el HTML

/*const continer = document.querySelector('.continer');
const btnSingIn = document.getElementById('btn-sing-in'); // Este es el del panel de bienvenida
const btnSingUp = document.getElementById('btn-sing-up');
const btnLoginSubmit = document.getElementById('btn-login-submit'); // El nuevo ID del botón del formulario

// Evento para cambiar entre formularios (Toggle)
btnSingIn.addEventListener("click", () => {
    continer.classList.remove("toogle");
});

// Nota: Asegúrate de que el botón 'btn-sing-up' exista en tu HTML
// o agrégale el ID correspondiente al botón de "Registrarse" del panel de bienvenida.
if (btnSingUp) {
    btnSingUp.addEventListener("click", () => {
        continer.classList.add("toogle");
    });
}*/
