// clientes.js - CRUD completo con backend PHP y MySQL para IPTA-INTI
// Incluye búsqueda en vivo, validaciones y protección contra XSS

const API_URL = "http://localhost/proyecto-ipta-inti/backend/clientes.php";

let editando = false;
let idClienteEditar = null;
let clientesCache = []; // Almacena clientes para búsqueda dinámica

// Inicializar al cargar
document.addEventListener("DOMContentLoaded", () => {
  if (typeof inicializarSesion === "function") inicializarSesion();
  mostrarClientes();

  document.getElementById("formCliente").addEventListener("submit", function (e) {
    e.preventDefault();
    if (editando) {
      actualizarCliente();
    } else {
      agregarCliente();
    }
  });
});

// Cargar clientes desde el backend
function mostrarClientes() {
  fetch(API_URL)
    .then(res => res.json())
    .then(clientes => {
      clientesCache = clientes;
      renderTablaClientes(clientes);
      limpiarFormulario();
      mostrarMensaje("");
    })
    .catch(() => {
      renderTablaClientes([]);
      mostrarMensaje("No se pudo cargar la lista de clientes.", "error");
    });
}

// Pintar la tabla en pantalla
function renderTablaClientes(lista) {
  const tbody = document.getElementById("tablaClientes");
  tbody.innerHTML = "";
  if (!Array.isArray(lista) || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay clientes registrados.</td></tr>`;
    return;
  }
  lista.forEach((cli) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${cli.idCliente}</td>
      <td>${cli.nombre}</td>
      <td>${cli.direccion || ""}</td>
      <td>${cli.telefono || ""}</td>
      <td>${cli.email || ""}</td>
      <td>${cli.fidelizacion || ""}</td>
      <td>
        <button onclick="editarCliente(
            ${cli.idCliente}, 
            '${escapeHtml(cli.nombre)}', 
            '${escapeHtml(cli.direccion || "")}', 
            '${escapeHtml(cli.telefono || "")}', 
            '${escapeHtml(cli.email || "")}', 
            '${escapeHtml(cli.fidelizacion || "No")}'
          )" 
          class="btn" style="background:#D4AF37; color:white;">Editar</button>
        <button onclick="eliminarCliente(${cli.idCliente})" class="btn" style="background:#FF6347; color:white;">Eliminar</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

// Sanitiza texto para prevenir inyecciones de HTML
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Filtro en vivo de clientes (por todos los campos relevantes)
function filtrarClientes() {
  const texto = document.getElementById("buscarCliente").value.toLowerCase();
  const filtrados = clientesCache.filter(cli =>
    (cli.nombre && cli.nombre.toLowerCase().includes(texto)) ||
    (cli.direccion && cli.direccion.toLowerCase().includes(texto)) ||
    (cli.telefono && cli.telefono.toLowerCase().includes(texto)) ||
    (cli.email && cli.email.toLowerCase().includes(texto)) ||
    (cli.fidelizacion && cli.fidelizacion.toLowerCase().includes(texto))
  );
  renderTablaClientes(filtrados);
}

// Crear cliente
function agregarCliente() {
  const nombre = document.getElementById("nombreCliente").value.trim();
  const direccion = document.getElementById("direccionCliente").value.trim();
  const telefono = document.getElementById("telefonoCliente").value.trim();
  const email = document.getElementById("emailCliente").value.trim();
  const fidelizacion = document.getElementById("fidelizacionCliente").value;

  if (!nombre) {
    mostrarMensaje("El nombre es obligatorio.", "error");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, direccion, telefono, email, fidelizacion }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarClientes();
        mostrarMensaje("Cliente registrado exitosamente.", "ok");
        limpiarFormulario();
      } else {
        mostrarMensaje("Error al guardar: " + (data.error || "Desconocido"), "error");
      }
    })
    .catch(() => mostrarMensaje("Error de conexión con el servidor.", "error"));
}

// Eliminar cliente
window.eliminarCliente = function (idCliente) {
  if (!confirm("¿Seguro que quieres eliminar este cliente?")) return;
  fetch(API_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idCliente }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarClientes();
        mostrarMensaje("Cliente eliminado correctamente.", "ok");
      } else {
        mostrarMensaje("No se pudo eliminar.", "error");
      }
    });
};

// Cargar datos en formulario para editar
window.editarCliente = function (id, nombre, direccion, telefono, email, fidelizacion) {
  editando = true;
  idClienteEditar = id;
  document.getElementById("nombreCliente").value = nombre;
  document.getElementById("direccionCliente").value = direccion;
  document.getElementById("telefonoCliente").value = telefono;
  document.getElementById("emailCliente").value = email;
  document.getElementById("fidelizacionCliente").value = fidelizacion || "No";
  document.querySelector("#formCliente .btn").textContent = "Actualizar Cliente";
  mostrarMensaje("");
};

// Actualizar cliente
function actualizarCliente() {
  const nombre = document.getElementById("nombreCliente").value.trim();
  const direccion = document.getElementById("direccionCliente").value.trim();
  const telefono = document.getElementById("telefonoCliente").value.trim();
  const email = document.getElementById("emailCliente").value.trim();
  const fidelizacion = document.getElementById("fidelizacionCliente").value;

  if (!nombre) {
    mostrarMensaje("El nombre es obligatorio.", "error");
    return;
  }

  fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idCliente: idClienteEditar,
      nombre,
      direccion,
      telefono,
      email,
      fidelizacion,
    }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarClientes();
        mostrarMensaje("Cliente actualizado correctamente.", "ok");
        limpiarFormulario();
      } else {
        mostrarMensaje("Error al actualizar: " + (data.error || "Desconocido"), "error");
      }
    });
}

// Reset del formulario
function limpiarFormulario() {
  editando = false;
  idClienteEditar = null;
  document.getElementById("formCliente").reset();
  document.querySelector("#formCliente .btn").textContent = "Registrar Cliente";
}

// Mostrar mensajes dinámicos
function mostrarMensaje(msg, tipo = "info") {
  const div = document.getElementById("mensajeCliente");
  if (!div) return;
  if (!msg) {
    div.style.display = "none";
    div.textContent = "";
    return;
  }
  div.style.display = "block";
  div.style.color = tipo === "error" ? "#FF6347" : (tipo === "ok" ? "#008f39" : "#333");
  div.textContent = msg;
}
