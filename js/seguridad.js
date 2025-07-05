// seguridad.js - CRUD profesional para gestión de usuarios y roles en IPTA-INTI

const API_URL = "http://localhost/proyecto-ipta-inti/backend/seguridad.php";
let usuariosCache = [];
let editando = false;
let idUsuarioEditar = null;

// ==================== INICIALIZACIÓN ====================
document.addEventListener("DOMContentLoaded", () => {
  if (typeof inicializarSesion === "function") {
    inicializarSesion(); // Protege acceso según roles definidos
  }

  mostrarUsuarios(); // Carga usuarios al iniciar

  // Evento para agregar o actualizar usuario
  document.getElementById("formUsuario").addEventListener("submit", function (e) {
    e.preventDefault();
    editando ? actualizarUsuario() : agregarUsuario();
  });
});

// ==================== SANITIZACIÓN ====================
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ==================== MOSTRAR USUARIOS ====================
function mostrarUsuarios() {
  fetch(API_URL)
    .then(res => res.json())
    .then(usuarios => {
      usuariosCache = usuarios;
      renderizarUsuarios(usuarios);
      limpiarFormulario();
    })
    .catch(() => {
      document.getElementById("tablaUsuarios").innerHTML =
        `<tr><td colspan="4">No se pudo cargar la lista de usuarios.</td></tr>`;
    });
}

// ==================== RENDERIZAR TABLA ====================
function renderizarUsuarios(lista) {
  const tbody = document.getElementById("tablaUsuarios");
  tbody.innerHTML = "";

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No hay usuarios registrados.</td></tr>`;
    return;
  }

  lista.forEach(user => {
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(user.nombreUsuario)}</td>
        <td>${escapeHtml(user.rol)}</td>
        <td>${escapeHtml(user.estado)}</td>
        <td>
          <button class="btn" style="background:#D4AF37;" onclick="editarUsuario(${user.idUsuario}, '${escapeHtml(user.nombreUsuario)}', '', '${escapeHtml(user.rol)}', '${escapeHtml(user.estado)}')">Editar</button>
          <button class="btn" style="background:#FF6347;" onclick="eliminarUsuario(${user.idUsuario})">Eliminar</button>
        </td>
      </tr>`;
  });
}

// ==================== BUSCADOR ====================
function filtrarUsuarios() {
  const texto = document.getElementById("buscarUsuario").value.toLowerCase();
  const filtrados = usuariosCache.filter(u =>
    (u.nombreUsuario && u.nombreUsuario.toLowerCase().includes(texto)) ||
    (u.rol && u.rol.toLowerCase().includes(texto)) ||
    (u.estado && u.estado.toLowerCase().includes(texto))
  );
  renderizarUsuarios(filtrados);
}

// ==================== AGREGAR USUARIO ====================
function agregarUsuario() {
  const nombreUsuario = document.getElementById("nombre").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();
  const rol = document.getElementById("rol").value;
  const estado = document.getElementById("estado").value;

  if (!nombreUsuario || !contrasena || !rol || !estado) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  if (usuariosCache.some(u => u.nombreUsuario === nombreUsuario)) {
    alert("El usuario ya existe.");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombreUsuario, contrasena, rol, estado })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarUsuarios();
      } else {
        alert("Error al guardar: " + (data.error || "Desconocido"));
      }
    });
}

// ==================== ELIMINAR USUARIO ====================
window.eliminarUsuario = function (idUsuario) {
  if (!confirm("¿Eliminar este usuario?")) return;

  fetch(API_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idUsuario })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarUsuarios();
      } else {
        alert("No se pudo eliminar");
      }
    });
};

// ==================== EDITAR USUARIO ====================
window.editarUsuario = function (idUsuario, nombreUsuario, _, rol, estado) {
  editando = true;
  idUsuarioEditar = idUsuario;
  document.getElementById("nombre").value = nombreUsuario;
  document.getElementById("contrasena").value = "";
  document.getElementById("rol").value = rol;
  document.getElementById("estado").value = estado;
  document.querySelector("#formUsuario .btn").textContent = "Actualizar Usuario";
};

// ==================== ACTUALIZAR USUARIO ====================
function actualizarUsuario() {
  const nombreUsuario = document.getElementById("nombre").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();
  const rol = document.getElementById("rol").value;
  const estado = document.getElementById("estado").value;

  if (!nombreUsuario || !rol || !estado) {
    alert("Nombre, rol y estado son obligatorios.");
    return;
  }

  const datos = {
    idUsuario: idUsuarioEditar,
    nombreUsuario,
    rol,
    estado
  };

  if (contrasena !== "") {
    datos.contrasena = contrasena;
  }

  fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarUsuarios();
      } else {
        alert("Error al actualizar: " + (data.error || "Desconocido"));
      }
    });
}

// ==================== LIMPIAR FORMULARIO ====================
function limpiarFormulario() {
  editando = false;
  idUsuarioEditar = null;
  document.getElementById("formUsuario").reset();
  document.querySelector("#formUsuario .btn").textContent = "Agregar Usuario";
}
