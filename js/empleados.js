// empleados.js - Módulo Empleados IPTA-INTI

const API_URL = window.location.origin + "/proyecto-ipta-inti/backend/empleados.php";
const form = document.getElementById("formEmpleado");
const tablaBody = document.getElementById("cuerpoTablaEmpleados");
const buscadorInput = document.getElementById("buscadorInput");
const feedback = document.getElementById("mensajeFeedback");

// Escapar HTML
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[match]));
}

// Mostrar mensajes de éxito o error
function mostrarMensaje(msg, tipo = "exito") {
  feedback.textContent = msg;
  feedback.className = "mensaje-feedback " + tipo;
  feedback.style.display = "block";
  setTimeout(() => { feedback.style.display = "none"; }, 4000);
}

// Cargar empleados desde PHP
async function cargarEmpleados() {
  tablaBody.innerHTML = `<tr><td colspan="5">Cargando empleados...</td></tr>`;
  try {
    const res = await fetch(API_URL);
    const empleados = await res.json();

    if (!Array.isArray(empleados) || empleados.length === 0) {
      tablaBody.innerHTML = `<tr><td colspan="5">No hay empleados registrados.</td></tr>`;
      return;
    }

    tablaBody.innerHTML = "";
    empleados.forEach(e => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${e.idEmpleado}</td>
        <td>${escapeHtml(e.nombre)}</td>
        <td>${escapeHtml(e.cargo)}</td>
        <td>$${parseInt(e.salario).toLocaleString()}</td>
        <td>
          <button class="btn-editar" onclick="editarEmpleado(${e.idEmpleado})">🖊️</button>
          <button class="btn-eliminar" onclick="eliminarEmpleado(${e.idEmpleado})">🗑️</button>
        </td>
      `;
      tablaBody.appendChild(fila);
    });
  } catch (err) {
    mostrarMensaje("Error al cargar empleados", "error");
    tablaBody.innerHTML = `<tr><td colspan="5">Error al cargar empleados.</td></tr>`;
  }
}

// Guardar o actualizar empleado
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = form.nombreEmpleado.value.trim();
  const cargo = form.cargoEmpleado.value.trim();
  const salario = parseFloat(form.salarioEmpleado.value);

  if (isNaN(salario) || salario <= 0) {
    mostrarMensaje("Salario no válido", "error");
    return;
  }

  const datos = {
    idEmpleado: form.idEmpleado.value || null,
    nombre, cargo, salario
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
      mostrarMensaje("Empleado guardado correctamente");
      form.reset();
      cargarEmpleados();
    } else {
      mostrarMensaje("Error al guardar", "error");
    }
  } catch (err) {
    mostrarMensaje("Fallo en la conexión", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar";
  }
});

// Editar empleado
function editarEmpleado(id) {
  fetch(API_URL + `?id=${id}`)
    .then(res => res.json())
    .then(e => {
      form.idEmpleado.value = e.idEmpleado;
      form.nombreEmpleado.value = e.nombre;
      form.cargoEmpleado.value = e.cargo;
      form.salarioEmpleado.value = e.salario;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// Eliminar empleado
function eliminarEmpleado(id) {
  if (!confirm("¿Deseas eliminar este empleado?")) return;

  fetch(API_URL + `?eliminar=${id}`)
    .then(res => res.json())
    .then(r => {
      if (r.status === "ok") {
        mostrarMensaje("Empleado eliminado");
        cargarEmpleados();
      } else {
        mostrarMensaje("Error al eliminar", "error");
      }
    });
}

// Filtro de búsqueda
buscadorInput.addEventListener("keyup", () => {
  const texto = buscadorInput.value.toLowerCase();
  const filas = tablaBody.getElementsByTagName("tr");
  for (let fila of filas) {
    const visible = fila.textContent.toLowerCase().includes(texto);
    fila.style.display = visible ? "" : "none";
  }
});

// Iniciar módulo
document.addEventListener("DOMContentLoaded", cargarEmpleados);
