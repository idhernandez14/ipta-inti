// proveedores.js - CRUD profesional para gestión de proveedores en IPTA-INTI con backend y búsqueda

const API_URL = "http://localhost/proyecto-ipta-inti/backend/proveedores.php";
let proveedoresCache = [];
let editando = false;
let idProveedorEditar = null;

document.addEventListener("DOMContentLoaded", () => {
  // Protección de sesión (si usas roles.js)
  if (typeof inicializarSesion === "function") {
    inicializarSesion();
  }
  mostrarProveedores();
  document.getElementById("formProveedor").addEventListener("submit", function(e) {
    e.preventDefault();
    if (editando) {
      actualizarProveedor();
    } else {
      agregarProveedor();
    }
  });
});

// Escapa caracteres para prevenir XSS
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Obtener y mostrar todos los proveedores
function mostrarProveedores() {
  fetch(API_URL)
    .then(res => res.json())
    .then(proveedores => {
      proveedoresCache = proveedores;
      renderizarProveedores(proveedores);
      limpiarFormulario();
    })
    .catch(() => {
      document.getElementById("tablaProveedores").innerHTML =
        `<tr><td colspan="4">No se pudo cargar la lista de proveedores.</td></tr>`;
    });
}

function renderizarProveedores(lista) {
  const tbody = document.getElementById("tablaProveedores");
  tbody.innerHTML = "";
  if (!lista || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No hay proveedores registrados.</td></tr>`;
    return;
  }
  lista.forEach(prov => {
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(prov.nombre)}</td>
        <td>${escapeHtml(prov.telefono)}</td>
        <td>${escapeHtml(prov.email)}</td>
        <td>
          <button class="btn" style="background:#D4AF37; color:white;" onclick="editarProveedor(${prov.idProveedor})">Editar</button>
          <button class="btn" style="background:#FF6347; color:white;" onclick="eliminarProveedor(${prov.idProveedor})">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

// Buscador dinámico
function filtrarProveedores() {
  const texto = document.getElementById("buscarProveedor").value.toLowerCase();
  const filtrados = proveedoresCache.filter(p =>
    (p.nombre && p.nombre.toLowerCase().includes(texto)) ||
    (p.telefono && p.telefono.toLowerCase().includes(texto)) ||
    (p.email && p.email.toLowerCase().includes(texto))
  );
  renderizarProveedores(filtrados);
}

// Agregar proveedor (POST)
function agregarProveedor() {
  const proveedor = {
    nombre: document.getElementById("nombreProveedor").value.trim(),
    telefono: document.getElementById("telefonoProveedor").value.trim(),
    email: document.getElementById("emailProveedor").value.trim()
  };

  if (!proveedor.nombre || !proveedor.telefono || !proveedor.email) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proveedor)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarProveedores();
        limpiarFormulario();
      } else {
        alert("Error al guardar: " + (data.error || "Desconocido"));
      }
    });
}

// Eliminar proveedor (DELETE)
window.eliminarProveedor = function(idProveedor) {
  if (!confirm("¿Deseas eliminar este proveedor?")) return;
  fetch(API_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idProveedor })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) mostrarProveedores();
      else alert("No se pudo eliminar");
    });
};

// Editar proveedor: carga los datos en el formulario
window.editarProveedor = function(idProveedor) {
  const prov = proveedoresCache.find(p => p.idProveedor == idProveedor);
  if (!prov) return;
  editando = true;
  idProveedorEditar = idProveedor;
  document.getElementById("nombreProveedor").value = prov.nombre;
  document.getElementById("telefonoProveedor").value = prov.telefono;
  document.getElementById("emailProveedor").value = prov.email;
  document.querySelector("#formProveedor .btn").textContent = "Actualizar Proveedor";
};

// Actualizar proveedor (PUT)
function actualizarProveedor() {
  const proveedor = {
    idProveedor: idProveedorEditar,
    nombre: document.getElementById("nombreProveedor").value.trim(),
    telefono: document.getElementById("telefonoProveedor").value.trim(),
    email: document.getElementById("emailProveedor").value.trim()
  };

  if (!proveedor.nombre || !proveedor.telefono || !proveedor.email) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proveedor)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarProveedores();
        limpiarFormulario();
      } else {
        alert("Error al actualizar: " + (data.error || "Desconocido"));
      }
    });
}

// Limpiar formulario y restaurar estado
function limpiarFormulario() {
  editando = false;
  idProveedorEditar = null;
  document.getElementById("formProveedor").reset();
  document.querySelector("#formProveedor .btn").textContent = "Agregar Proveedor";
}
