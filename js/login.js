// login.js - Validación de inicio de sesión 100% conectada al backend IPTA-INTI

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", login);
  }
});

/**
 * Procesa el login enviando los datos al backend PHP
 * @param {Event} event 
 */
function login(event) {
  event.preventDefault();
  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();
  const rol = document.getElementById("rol").value;
  const errorMsg = document.getElementById("error-msg");

  if (!usuario || !contrasena || !rol) {
    mostrarError("Por favor, completa todos los campos.");
    return;
  }

  fetch("http://localhost/proyecto-ipta-inti/backend/login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contrasena, rol })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Guarda el usuario y rol en localStorage para toda la sesión web
      localStorage.setItem("usuario", data.usuario);
      localStorage.setItem("rolActivo", data.rol);
      localStorage.setItem("idUsuario", data.idUsuario);
      window.location.href = "./html/dashboard.html";
    } else {
      mostrarError(data.error || "Error de inicio de sesión.");
    }
  })
  .catch(() => {
    mostrarError("No se pudo conectar al servidor.");
  });
}

/**
 * Muestra mensajes de error en pantalla
 * @param {string} mensaje
 */
function mostrarError(mensaje) {
  const errorMsg = document.getElementById("error-msg");
  errorMsg.style.display = "block";
  errorMsg.style.color = "#FF6347";
  errorMsg.textContent = mensaje;
}
