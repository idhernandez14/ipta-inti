// clientes.js - Lógica del módulo Clientes IPTA-INTI

const API_URL = window.location.origin + "/proyecto-ipta-inti/backend/clientes.php";
const form = document.getElementById("formCliente");
const tablaBody = document.getElementById("cuerpoTablaClientes");
const buscadorInput = document.getElementById("buscadorInput");
const feedback = document.getElementById("mensajeFeedback");

// Función para escapar HTML (XSS-safe)
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[match]));
}

// Mostrar mensaje visual
function mostrarMensaje(msg, tipo = "exito") {
  feedback.textContent = msg;
  feedback.className = "mensaje-feedback " + tipo;
  feedback.style.display = "block";
  setTimeout(() => { feedback.style.display = "none"; }, 4000);
}

// Cargar clientes
async function cargarClientes() {
  tablaBody.innerHTML = `<tr><td colspan="6">Cargando clientes...</td></tr>`;
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Respuesta no válida");

    if (data.length === 0) {
      tablaBody.innerHTML = `<tr><td colspan="6">No hay clientes registrados.</td></tr>`;
      return;
    }

    tablaBody.innerHTML = "";
    data.forEach(c => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${c.idCliente}</td>
        <td>${escapeHtml(c.nombre)}</td>
        <td>${escapeHtml(c.telefono)}</td>
        <td>${escapeHtml(c.email)}</td>
        <td>${escapeHtml(c.direccion)}</td>
        <td>
          <button class="btn-editar" onclick="editarCliente(${c.idCliente})">🖊️</button>
          <button class="btn-eliminar" onclick="eliminarCliente(${c.idCliente})">🗑️</button>
        </td>
      `;
      tablaBody.appendChild(fila);
    });
  } catch (err) {
    tablaBody.innerHTML = `<tr><td colspan="6">Error cargando datos.</td></tr>`;
    mostrarMensaje("Error al cargar clientes", "error");
  }
}

// Guardar cliente
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = form.nombreCliente.value.trim();
  const telefono = form.telefonoCliente.value.trim();
  const email = form.emailCliente.value.trim();
  const direccion = form.direccionCliente.value.trim();

  if (!/^[0-9]{7,10}$/.test(telefono)) {
    mostrarMensaje("Número de teléfono no válido", "error");
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    mostrarMensaje("Email no válido", "error");
    return;
  }

  const datos = {
    idCliente: form.idCliente.value || null,
    nombre, telefono, email, direccion
  };

  const btn = form.querySelector("button");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    const r = await res.json();

    if (r.status === "ok") {
      mostrarMensaje("Cliente guardado correctamente");
      form.reset();
      cargarClientes();
    } else {
      mostrarMensaje("Error al guardar cliente", "error");
    }
  } catch (err) {
    mostrarMensaje("Fallo en la conexión", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar";
  }
});

// Editar cliente
function editarCliente(id) {
  fetch(API_URL + `?id=${id}`)
    .then(res => res.json())
    .then(c => {
      form.idCliente.value = c.idCliente;
      form.nombreCliente.value = c.nombre;
      form.telefonoCliente.value = c.telefono;
      form.emailCliente.value = c.email;
      form.direccionCliente.value = c.direccion;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// Eliminar cliente
function eliminarCliente(id) {
  if (!confirm("¿Deseas eliminar este cliente?")) return;

  fetch(API_URL + `?eliminar=${id}`, { method: "GET" })
    .then(res => res.json())
    .then(r => {
      if (r.status === "ok") {
        mostrarMensaje("Cliente eliminado");
        cargarClientes();
      } else {
        mostrarMensaje("Error al eliminar", "error");
      }
    });
}

// Filtrar clientes
buscadorInput.addEventListener("keyup", () => {
  const texto = buscadorInput.value.toLowerCase();
  const filas = tablaBody.getElementsByTagName("tr");
  for (let fila of filas) {
    const match = fila.textContent.toLowerCase().includes(texto);
    fila.style.display = match ? "" : "none";
  }
});

// Iniciar
document.addEventListener("DOMContentLoaded", cargarClientes);
