// inventario.js - CRUD profesional para Inventario IPTA-INTI con backend PHP, buscador y funciones avanzadas

const API_URL = "http://localhost/proyecto-ipta-inti/backend/inventario.php";
let movimientosCache = [];

// Inicialización de sesión y eventos
document.addEventListener("DOMContentLoaded", () => {
  // Asegura la protección de sesión si usas roles.js
  if (typeof inicializarSesion === "function") {
    inicializarSesion();
  }
  document.getElementById("formInventario").addEventListener("submit", onSubmitInventario);
  mostrarHistorial();
});

// Maneja registrar o editar movimiento según el estado
function onSubmitInventario(event) {
  event.preventDefault();
  const form = event.target;
  const editandoId = form.dataset.editando;

  if (editandoId) {
    actualizarMovimiento(editandoId);
    delete form.dataset.editando;
  } else {
    manejarMovimiento(event);
  }
}

// Registrar movimiento (entrada/salida)
function manejarMovimiento(event) {
  const producto = document.getElementById("producto").value.trim();
  const tipoMovimiento = document.getElementById("tipoMovimiento").value;
  const cantidad = parseInt(document.getElementById("cantidadMovimiento").value);

  if (!producto || isNaN(cantidad) || cantidad <= 0) {
    alert("Datos inválidos.");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ producto, tipoMovimiento, cantidad }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarHistorial();
        event.target.reset();
      } else {
        alert("Error al registrar: " + (data.error || "Desconocido"));
      }
    })
    .catch(() => alert("Error de conexión con el servidor."));
}

// Mostrar historial completo
function mostrarHistorial() {
  fetch(API_URL)
    .then(res => res.json())
    .then(movimientos => {
      movimientosCache = movimientos;
      renderizarHistorial(movimientos);
    })
    .catch(() => {
      document.getElementById("tablaInventario").innerHTML =
        `<tr><td colspan="5">No se pudo cargar el historial.</td></tr>`;
    });
}

// Escapa caracteres especiales para prevenir XSS
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Renderiza la tabla (incluye botones Editar y Eliminar)
function renderizarHistorial(lista) {
  const tbody = document.getElementById("tablaInventario");
  tbody.innerHTML = "";
  if (!lista || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No hay movimientos registrados.</td></tr>`;
    return;
  }
  lista.forEach((mov) => {
    let color = mov.stockActual <= 5 ? "#FF6347" : "#000";
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(mov.producto)}</td>
        <td>${mov.tipoMovimiento.charAt(0).toUpperCase() + mov.tipoMovimiento.slice(1)}</td>
        <td>${mov.cantidad}</td>
        <td style="color:${color};"><strong>${mov.stockActual}</strong> ${mov.stockActual <= 5 ? "⚠️ Bajo stock" : ""}</td>
        <td>
          <button onclick="eliminarMovimiento(${mov.idInventario})" class="btn" style="background:#FF6347;color:white;">Eliminar</button>
          <button onclick="mostrarEditarMovimiento(${mov.idInventario}, '${mov.tipoMovimiento}', '${mov.cantidad}', '${escapeHtml(mov.producto)}')" class="btn" style="background:#D4AF37;color:white;">Editar</button>
        </td>
      </tr>
    `;
  });
}

// Eliminar movimiento
window.eliminarMovimiento = function(idInventario) {
  if (!confirm("¿Seguro que deseas eliminar este movimiento?")) return;
  fetch(API_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idInventario }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) mostrarHistorial();
      else alert("No se pudo eliminar");
    });
};

// Preparar formulario para editar movimiento
window.mostrarEditarMovimiento = function(idInventario, tipoMovimiento, cantidad, producto) {
  document.getElementById("tipoMovimiento").value = tipoMovimiento;
  document.getElementById("cantidadMovimiento").value = cantidad;
  document.getElementById("producto").value = producto;
  document.getElementById("formInventario").dataset.editando = idInventario;
  document.querySelector("#formInventario .btn").textContent = "Actualizar Movimiento";
};

// Actualizar movimiento (PUT)
function actualizarMovimiento(idInventario) {
  const tipoMovimiento = document.getElementById("tipoMovimiento").value;
  const cantidad = parseInt(document.getElementById("cantidadMovimiento").value);
  if (isNaN(cantidad) || cantidad <= 0) {
    alert("Cantidad inválida.");
    return;
  }
  fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idInventario, tipoMovimiento, cantidad }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarHistorial();
        limpiarFormulario();
      } else {
        alert("Error al actualizar: " + (data.error || "Desconocido"));
      }
    });
}

// Limpiar formulario y restaurar estado
function limpiarFormulario() {
  document.getElementById("formInventario").reset();
  document.querySelector("#formInventario .btn").textContent = "Registrar Movimiento";
  delete document.getElementById("formInventario").dataset.editando;
}

// Buscador dinámico
function filtrarInventario() {
  const texto = document.getElementById("buscarInventario").value.toLowerCase();
  const filtrados = movimientosCache.filter(mov =>
    (mov.producto && mov.producto.toLowerCase().includes(texto)) ||
    (mov.tipoMovimiento && mov.tipoMovimiento.toLowerCase().includes(texto))
  );
  renderizarHistorial(filtrados);
}

// Filtros avanzados por fecha y cantidad
function filtrarAvanzado() {
  const fecha = document.getElementById("filtroFecha").value;
  const cantidad = parseInt(document.getElementById("filtroCantidad").value);
  let filtrados = movimientosCache;
  if (fecha) filtrados = filtrados.filter(mov => mov.fechaMovimiento === fecha);
  if (!isNaN(cantidad)) filtrados = filtrados.filter(mov => mov.cantidad >= cantidad);
  renderizarHistorial(filtrados);
}

// Descarga historial a Excel (CSV)
function descargarExcel() {
  let csv = "Producto,Tipo,Cantidad,Stock Actual\n";
  movimientosCache.forEach(mov => {
    csv += `"${mov.producto}","${mov.tipoMovimiento}","${mov.cantidad}","${mov.stockActual}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "historial_inventario.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
