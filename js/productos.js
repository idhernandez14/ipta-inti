// productos.js - CRUD profesional para gestión de productos en IPTA-INTI con backend y buscador

const API_URL = "http://localhost/proyecto-ipta-inti/backend/productos.php";
let productosCache = [];
let editando = false;
let idProductoEditar = null;

document.addEventListener("DOMContentLoaded", () => {
  // Protección de sesión si usas roles.js
  if (typeof inicializarSesion === "function") {
    inicializarSesion();
  }
  mostrarProductos();
  document.getElementById("formProducto").addEventListener("submit", function(e) {
    e.preventDefault();
    if (editando) {
      actualizarProducto();
    } else {
      agregarProducto();
    }
  });
});

// Obtener y mostrar todos los productos
function mostrarProductos() {
  fetch(API_URL)
    .then(res => res.json())
    .then(productos => {
      productosCache = productos;
      renderizarProductos(productos);
      limpiarFormulario();
    })
    .catch(() => {
      document.getElementById("tablaProductos").innerHTML =
        `<tr><td colspan="8">No se pudo cargar la lista de productos.</td></tr>`;
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

// Renderiza la tabla de productos (soporta búsqueda)
function renderizarProductos(lista) {
  const tbody = document.getElementById("tablaProductos");
  tbody.innerHTML = "";
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8">No hay productos registrados.</td></tr>`;
    return;
  }
  lista.forEach(prod => {
    tbody.innerHTML += `
      <tr>
        <td>${escapeHtml(prod.nombre)}</td>
        <td>${escapeHtml(prod.codigoDeBarras)}</td>
        <td>${escapeHtml(prod.descripcion || "")}</td>
        <td>$${parseFloat(prod.precioCompra).toLocaleString("es-CO")}</td>
        <td>$${parseFloat(prod.precioVenta).toLocaleString("es-CO")}</td>
        <td>${prod.cantidadStock}</td>
        <td>${escapeHtml(prod.idProveedor)}</td>
        <td>
          <button class="btn" style="background:#D4AF37; color:white;" onclick="editarProducto(${prod.idProducto})">Editar</button>
          <button class="btn" style="background:#FF6347; color:white;" onclick="eliminarProducto(${prod.idProducto})">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

// Buscador dinámico
function filtrarProductos() {
  const texto = document.getElementById("buscarProducto").value.toLowerCase();
  const filtrados = productosCache.filter(p =>
    (p.nombre && p.nombre.toLowerCase().includes(texto)) ||
    (p.codigoDeBarras && p.codigoDeBarras.toLowerCase().includes(texto)) ||
    (p.descripcion && p.descripcion.toLowerCase().includes(texto)) ||
    (p.idProveedor && String(p.idProveedor).toLowerCase().includes(texto))
  );
  renderizarProductos(filtrados);
}

// Agregar producto (POST)
function agregarProducto() {
  const producto = {
    nombre: document.getElementById("nombre").value.trim(),
    codigoDeBarras: document.getElementById("codigo").value.trim(),
    descripcion: document.getElementById("descripcion").value.trim(),
    precioCompra: parseFloat(document.getElementById("precioCompra").value),
    precioVenta: parseFloat(document.getElementById("precioVenta").value),
    cantidadStock: parseInt(document.getElementById("stock").value),
    idProveedor: document.getElementById("proveedor").value.trim()
  };

  // Validación avanzada
  if (
    !producto.nombre ||
    !producto.codigoDeBarras ||
    isNaN(producto.precioCompra) || producto.precioCompra < 0 ||
    isNaN(producto.precioVenta) || producto.precioVenta < 0 ||
    isNaN(producto.cantidadStock) || producto.cantidadStock < 0 ||
    !producto.idProveedor
  ) {
    alert("Por favor, completa los campos obligatorios correctamente.");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarProductos();
        limpiarFormulario();
      } else {
        alert("Error al guardar: " + (data.error || "Desconocido"));
      }
    });
}

// Eliminar producto (DELETE)
window.eliminarProducto = function(idProducto) {
  if (!confirm("¿Deseas eliminar este producto?")) return;
  fetch(API_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idProducto })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) mostrarProductos();
      else alert("No se pudo eliminar");
    });
};

// Editar producto: carga los datos en el formulario
window.editarProducto = function(idProducto) {
  const prod = productosCache.find(p => p.idProducto == idProducto);
  if (!prod) return;
  editando = true;
  idProductoEditar = idProducto;
  document.getElementById("nombre").value = prod.nombre;
  document.getElementById("codigo").value = prod.codigoDeBarras;
  document.getElementById("descripcion").value = prod.descripcion || "";
  document.getElementById("precioCompra").value = prod.precioCompra;
  document.getElementById("precioVenta").value = prod.precioVenta;
  document.getElementById("stock").value = prod.cantidadStock;
  document.getElementById("proveedor").value = prod.idProveedor;
  document.querySelector("#formProducto .btn").textContent = "Actualizar Producto";
};

// Actualizar producto (PUT)
function actualizarProducto() {
  const producto = {
    idProducto: idProductoEditar,
    nombre: document.getElementById("nombre").value.trim(),
    codigoDeBarras: document.getElementById("codigo").value.trim(),
    descripcion: document.getElementById("descripcion").value.trim(),
    precioCompra: parseFloat(document.getElementById("precioCompra").value),
    precioVenta: parseFloat(document.getElementById("precioVenta").value),
    cantidadStock: parseInt(document.getElementById("stock").value),
    idProveedor: document.getElementById("proveedor").value.trim()
  };

  // Validación avanzada
  if (
    !producto.nombre ||
    !producto.codigoDeBarras ||
    isNaN(producto.precioCompra) || producto.precioCompra < 0 ||
    isNaN(producto.precioVenta) || producto.precioVenta < 0 ||
    isNaN(producto.cantidadStock) || producto.cantidadStock < 0 ||
    !producto.idProveedor
  ) {
    alert("Por favor, completa los campos obligatorios correctamente.");
    return;
  }

  fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarProductos();
        limpiarFormulario();
      } else {
        alert("Error al actualizar: " + (data.error || "Desconocido"));
      }
    });
}

// Limpiar formulario y restaurar estado
function limpiarFormulario() {
  editando = false;
  idProductoEditar = null;
  document.getElementById("formProducto").reset();
  document.querySelector("#formProducto .btn").textContent = "Agregar Producto";
}