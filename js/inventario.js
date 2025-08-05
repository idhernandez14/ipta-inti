// inventario.js - Módulo Inventario IPTA-INTI

const API_URL = window.location.origin + "/proyecto-ipta-inti/backend/inventario.php";
const form = document.getElementById("formInventario");
const tablaBody = document.getElementById("cuerpoTablaInventario");
const buscadorInput = document.getElementById("buscadorInput");
const feedback = document.getElementById("mensajeFeedback");

// Escapar texto para evitar XSS
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[match]));
}

// Mostrar mensaje visual
function mostrarMensaje(mensaje, tipo = "exito") {
  feedback.textContent = mensaje;
  feedback.className = "mensaje-feedback " + tipo;
  feedback.style.display = "block";
  setTimeout(() => feedback.style.display = "none", 4000);
}

// Cargar inventario
async function cargarInventario() {
  tablaBody.innerHTML = `<tr><td colspan="6">Cargando inventario...</td></tr>`;
  try {
    const res = await fetch(API_URL);
    const inventario = await res.json();

    if (!Array.isArray(inventario) || inventario.length === 0) {
      tablaBody.innerHTML = `<tr><td colspan="6">No hay registros en el inventario.</td></tr>`;
      return;
    }

    tablaBody.innerHTML = "";
    inventario.forEach(i => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${i.idInventario}</td>
        <td>${escapeHtml(i.producto)}</td>
        <td>${i.cantidad}</td>
        <td>${escapeHtml(i.tipoMovimiento)}</td>
        <td>${i.fecha}</td>
        <td>
          <button class="btn-editar" onclick="editarInventario(${i.idInventario})">🖊️</button>
          <button class="btn-eliminar" onclick="eliminarInventario(${i.idInventario})">🗑️</button>
        </td>
      `;
      tablaBody.appendChild(fila);
    });
  } catch (err) {
    mostrarMensaje("Error al cargar inventario", "error");
    tablaBody.innerHTML = `<tr><td colspan="6">Error al cargar datos.</td></tr>`;
  }
}

// Enviar formulario (registrar o actualizar)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const producto = form.productoInventario.value.trim();
  const cantidad = parseInt(form.cantidadInventario.value);
  const tipo = form.tipoMovimiento.value;

  if (!producto || !cantidad || cantidad <= 0 || !tipo) {
    mostrarMensaje("Completa todos los campos correctamente", "error");
    return;
  }

  const datos = {
    idInventario: form.idInventario.value || null,
    producto, cantidad, tipoMovimiento: tipo
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
      mostrarMensaje("Movimiento guardado correctamente");
      form.reset();
      cargarInventario();
    } else {
      mostrarMensaje("Error al guardar", "error");
    }
  } catch {
    mostrarMensaje("Error de red", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar";
  }
});

// Editar registro
function editarInventario(id) {
  fetch(API_URL + `?id=${id}`)
    .then(res => res.json())
    .then(i => {
      form.idInventario.value = i.idInventario;
      form.productoInventario.value = i.producto;
      form.cantidadInventario.value = i.cantidad;
      form.tipoMovimiento.value = i.tipoMovimiento;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// Eliminar registro
function eliminarInventario(id) {
  if (!confirm("¿Eliminar este movimiento del inventario?")) return;

  fetch(API_URL + `?eliminar=${id}`)
    .then(res => res.json())
    .then(r => {
      if (r.status === "ok") {
        mostrarMensaje("Eliminado correctamente");
        cargarInventario();
      } else {
        mostrarMensaje("Error al eliminar", "error");
      }
    });
}

// Filtro por texto
buscadorInput.addEventListener("input", () => {
  const texto = buscadorInput.value.toLowerCase();
  const filas = tablaBody.getElementsByTagName("tr");
  for (let fila of filas) {
    const visible = fila.textContent.toLowerCase().includes(texto);
    fila.style.display = visible ? "" : "none";
  }
});

// Iniciar
document.addEventListener("DOMContentLoaded", cargarInventario);
