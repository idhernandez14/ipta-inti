// empleados.js - CRUD completo con backend PHP y MySQL para IPTA-INTI
// Incluye buscador, protección de sesión, validaciones y control de errores

const API_URL = "http://localhost/proyecto-ipta-inti/backend/empleados.php";

// Variables globales de edición
let editando = false;
let idEmpleadoEditar = null;
let empleadosCache = []; // Caché de empleados para el buscador

document.addEventListener("DOMContentLoaded", () => {
  // Protección de sesión y roles
  if (typeof inicializarSesion === "function") {
    inicializarSesion();
  }

  // Mostrar empleados al cargar
  mostrarEmpleados();

  // Listener para envío de formulario
  document.getElementById("formEmpleado").addEventListener("submit", function (e) {
    e.preventDefault();
    editando ? actualizarEmpleado() : agregarEmpleado();
  });
});

// ==============================
// Obtener y mostrar empleados
// ==============================
function mostrarEmpleados() {
  fetch(API_URL)
    .then(res => res.json())
    .then(empleados => {
      empleadosCache = empleados;
      renderTablaEmpleados(empleados);
      limpiarFormulario();
    })
    .catch(() => {
      document.getElementById("tablaEmpleados").innerHTML =
        `<tr><td colspan="7">No se pudo cargar la lista de empleados.</td></tr>`;
    });
}

// ==============================
// Renderizar tabla de empleados
// ==============================
function renderTablaEmpleados(lista) {
  const tbody = document.getElementById("tablaEmpleados");
  tbody.innerHTML = "";

  if (!Array.isArray(lista) || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No hay empleados registrados.</td></tr>`;
    return;
  }

  lista.forEach(emp => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${emp.idEmpleado}</td>
      <td>${escapeHtml(emp.nombre)}</td>
      <td>${escapeHtml(emp.cargo)}</td>
      <td>${parseFloat(emp.salario).toLocaleString("es-CO")}</td>
      <td>${escapeHtml(emp.controlHorarios || "")}</td>
      <td>${escapeHtml(emp.asignacionTareas || "")}</td>
      <td>
        <button onclick="editarEmpleado(
            ${emp.idEmpleado}, 
            '${escapeHtml(emp.nombre)}', 
            '${escapeHtml(emp.cargo)}', 
            '${emp.salario}', 
            '${escapeHtml(emp.controlHorarios || "")}', 
            '${escapeHtml(emp.asignacionTareas || "")}'
          )" 
          class="btn" style="background:#D4AF37;color:white;">Editar</button>
        <button onclick="eliminarEmpleado(${emp.idEmpleado})" class="btn" style="background:#FF6347;color:white;">Eliminar</button>
      </td>`;
    tbody.appendChild(fila);
  });
}

// ==============================
// Evitar inyecciones XSS
// ==============================
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ==============================
// Buscador dinámico
// ==============================
function filtrarEmpleados() {
  const texto = document.getElementById("buscarEmpleado").value.toLowerCase();
  const filtrados = empleadosCache.filter(emp =>
    (emp.nombre && emp.nombre.toLowerCase().includes(texto)) ||
    (emp.cargo && emp.cargo.toLowerCase().includes(texto)) ||
    (emp.controlHorarios && emp.controlHorarios.toLowerCase().includes(texto)) ||
    (emp.asignacionTareas && emp.asignacionTareas.toLowerCase().includes(texto))
  );
  renderTablaEmpleados(filtrados);
}

// ==============================
// Agregar nuevo empleado (POST)
// ==============================
function agregarEmpleado() {
  const nombre = document.getElementById("nombreEmpleado").value.trim();
  const cargo = document.getElementById("cargoEmpleado").value.trim();
  const salario = parseFloat(document.getElementById("salarioEmpleado").value);
  const controlHorarios = document.getElementById("horarioEmpleado").value.trim();
  const asignacionTareas = document.getElementById("tareaEmpleado").value.trim();

  if (!nombre || !cargo || isNaN(salario) || salario < 0) {
    alert("Por favor, completa los campos obligatorios correctamente.");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, cargo, salario, controlHorarios, asignacionTareas }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarEmpleados();
        limpiarFormulario();
      } else {
        alert("Error al guardar: " + (data.error || "Desconocido"));
      }
    })
    .catch(() => alert("Error de conexión con el servidor."));
}

// ==============================
// Eliminar empleado (DELETE)
// ==============================
window.eliminarEmpleado = function (idEmpleado) {
  if (!confirm("¿Seguro que quieres eliminar este empleado?")) return;
  fetch(API_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idEmpleado }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) mostrarEmpleados();
      else alert("No se pudo eliminar el empleado.");
    });
};

// ==============================
// Preparar formulario para editar
// ==============================
window.editarEmpleado = function (id, nombre, cargo, salario, controlHorarios, asignacionTareas) {
  editando = true;
  idEmpleadoEditar = id;
  document.getElementById("nombreEmpleado").value = nombre;
  document.getElementById("cargoEmpleado").value = cargo;
  document.getElementById("salarioEmpleado").value = salario;
  document.getElementById("horarioEmpleado").value = controlHorarios;
  document.getElementById("tareaEmpleado").value = asignacionTareas;
  document.querySelector("#formEmpleado .btn").textContent = "Actualizar Empleado";
}

// ==============================
// Actualizar empleado (PUT)
// ==============================
function actualizarEmpleado() {
  const nombre = document.getElementById("nombreEmpleado").value.trim();
  const cargo = document.getElementById("cargoEmpleado").value.trim();
  const salario = parseFloat(document.getElementById("salarioEmpleado").value);
  const controlHorarios = document.getElementById("horarioEmpleado").value.trim();
  const asignacionTareas = document.getElementById("tareaEmpleado").value.trim();

  if (!nombre || !cargo || isNaN(salario) || salario < 0) {
    alert("Por favor, completa los campos obligatorios correctamente.");
    return;
  }

  fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idEmpleado: idEmpleadoEditar,
      nombre,
      cargo,
      salario,
      controlHorarios,
      asignacionTareas
    }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarEmpleados();
        limpiarFormulario();
      } else {
        alert("Error al actualizar el empleado.");
      }
    });
}

// ==============================
// Limpiar formulario
// ==============================
function limpiarFormulario() {
  editando = false;
  idEmpleadoEditar = null;
  document.getElementById("formEmpleado").reset();
  document.querySelector("#formEmpleado .btn").textContent = "Registrar Empleado";
}
