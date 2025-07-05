document.addEventListener("DOMContentLoaded", () => {
  inicializarSesion();
});

/**
 * Inicializa la sesión del usuario:
 * - Verifica si hay usuario y rol guardados.
 * - Si no, redirige a login.
 * - Si sí, muestra info y ajusta visibilidad según el rol.
 */
function inicializarSesion() {
  const usuario = localStorage.getItem("usuario");
  const rol = localStorage.getItem("rolActivo");

  if (!usuario || !rol) {
    redirigirLogin();
    return;
  }
  mostrarUsuarioYRol(usuario, rol);
  controlarVisibilidadPorRol(rol);
}

/**
 * Redirige al login si no hay sesión activa.
 * Soporta módulos en la raíz y en carpetas ("../index.html" o "index.html").
 */
function redirigirLogin() {
  if (window.location.pathname.includes("/html/") || window.location.pathname.includes("/pages/")) {
    window.location.href = "../index.html";
  } else {
    window.location.href = "index.html";
  }
}

/**
 * Muestra el nombre del usuario y el rol en los elementos correspondientes del HTML
 * (solo si existen los elementos con id="usuario" e id="rol").
 */
function mostrarUsuarioYRol(usuario, rol) {
  const usuarioSpan = document.getElementById("usuario");
  const rolSpan = document.getElementById("rol");
  if (usuarioSpan) usuarioSpan.textContent = usuario;
  if (rolSpan) rolSpan.textContent = rol;
}

/**
 * Controla la visibilidad de los paneles/modulos según el rol activo.
 * Soporta varios roles por panel usando data-role="Rol1,Rol2".
 */
function controlarVisibilidadPorRol(rol) {
  const paneles = document.querySelectorAll("[data-role]");
  paneles.forEach(panel => {
    // Soporta varios roles separados por coma
    const rolesPermitidos = panel.dataset.role.split(",").map(r => r.trim());
    // Admin ve todo
    if (rolesPermitidos.includes(rol) || rol === "Administrador") {
      panel.style.display = "block";
    } else {
      panel.style.display = "none";
    }
  });
}

/**
 * Cierra la sesión del usuario, borra todos los datos del localStorage y redirige a login.
 */
function cerrarSesion() {
  localStorage.clear();
  redirigirLogin();
}

// Exporta la función para que pueda usarse en botones HTML
window.cerrarSesion = cerrarSesion;
