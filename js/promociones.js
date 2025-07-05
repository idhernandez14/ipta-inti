// promociones.js - CRUD profesional para la gestión de promociones en IPTA-INTI con backend y búsqueda

const API_URL = "http://localhost/proyecto-ipta-inti/backend/promociones.php";
let promocionesCache = [];
let editando = false;
let idPromocionEditar = null;

document.addEventListener("DOMContentLoaded", () => {
  // Protege sesión si usas roles.js
  if (typeof inicializarSesion === "function") {
    inicializarSesion();
  }
  mostrarPromociones();
  document.getElementById("formPromocion").addEventListener("submit", function (e) {
    e.preventDefault();
    if (editando) {
      actualizarPromocion();
    } else {
      agregarPromocion();
    }
  });
});

// Mostrar todas las promociones
function mostrarPromociones() {
  fetch(API_URL)
    .then(res => res.json())
    .then(promos => {
      promocionesCache = promos;
      renderizarPromociones(promos);
      limpiarFormulario();
    })
    .catch(() => {
      document.getElementById("tablaPromociones").innerHTML =
        `<tr><td colspan="4">No se pudo cargar la lista de promociones.</td></tr>`;
    });
}

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

// Renderizar la tabla de promociones
function renderizarPromociones(lista) {
  const tbody = document.getElementById("tablaPromociones");
  tbody.innerHTML = "";
  if (!lista || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No hay promociones registradas.</td></tr>`;
    return;
  }
  lista.forEach(promo => {
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(promo.nombre)}</td>
        <td>${escapeHtml(promo.descripcion)}</td>
        <td>${parseFloat(promo.descuento).toFixed(2)}</td>
        <td>
          <button class="btn" style="background:#D4AF37; color:white;" onclick="editarPromocion(${promo.idPromocion})">Editar</button>
          <button class="btn" style="background:#FF6347; color:white;" onclick="eliminarPromocion(${promo.idPromocion})">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

// Buscador en tiempo real
function filtrarPromociones() {
  const texto = document.getElementById("buscarPromocion").value.toLowerCase();
  const filtradas = promocionesCache.filter(p =>
    (p.nombre && p.nombre.toLowerCase().includes(texto)) ||
    (p.descripcion && p.descripcion.toLowerCase().includes(texto))
  );
  renderizarPromociones(filtradas);
}

// Agregar promoción (POST)
function agregarPromocion() {
  const promo = {
    nombre: document.getElementById("nombrePromo").value.trim(),
    descripcion: document.getElementById("descripcionPromo").value.trim(),
    descuento: parseFloat(document.getElementById("descuentoPromo").value)
  };

  if (!promo.nombre || !promo.descripcion || isNaN(promo.descuento)) {
    alert("Todos los campos son obligatorios.");
    return;
  }
  if (promo.descuento < 0 || promo.descuento > 100) {
    alert("El descuento debe estar entre 0 y 100.");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(promo)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarPromociones();
        limpiarFormulario();
      } else {
        alert("Error al guardar: " + (data.error || "Desconocido"));
      }
    });
}

// Eliminar promoción (DELETE)
window.eliminarPromocion = function(idPromocion) {
  if (!confirm("¿Eliminar esta promoción?")) return;
  fetch(API_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idPromocion })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) mostrarPromociones();
      else alert("No se pudo eliminar");
    });
};

// Editar promoción (carga al formulario)
window.editarPromocion = function(idPromocion) {
  const promo = promocionesCache.find(p => p.idPromocion == idPromocion);
  if (!promo) return;
  editando = true;
  idPromocionEditar = idPromocion;
  document.getElementById("nombrePromo").value = promo.nombre;
  document.getElementById("descripcionPromo").value = promo.descripcion;
  document.getElementById("descuentoPromo").value = promo.descuento;
  document.querySelector("#formPromocion .btn").textContent = "Actualizar Promoción";
};

// Actualizar promoción (PUT)
function actualizarPromocion() {
  const promo = {
    idPromocion: idPromocionEditar,
    nombre: document.getElementById("nombrePromo").value.trim(),
    descripcion: document.getElementById("descripcionPromo").value.trim(),
    descuento: parseFloat(document.getElementById("descuentoPromo").value)
  };

  if (!promo.nombre || !promo.descripcion || isNaN(promo.descuento)) {
    alert("Todos los campos son obligatorios.");
    return;
  }
  if (promo.descuento < 0 || promo.descuento > 100) {
    alert("El descuento debe estar entre 0 y 100.");
    return;
  }

  fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(promo)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarPromociones();
        limpiarFormulario();
      } else {
        alert("Error al actualizar: " + (data.error || "Desconocido"));
      }
    });
}

// Limpiar formulario y restaurar estado
function limpiarFormulario() {
  editando = false;
  idPromocionEditar = null;
  document.getElementById("formPromocion").reset();
  document.querySelector("#formPromocion .btn").textContent = "Agregar Promoción";
}
