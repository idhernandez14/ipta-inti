// logicadecaja.js - Lógica profesional de caja registradora para IPTA-INTI con integración backend

let productos = [];
let promociones = [];
let clientes = [];
let venta = [];
let clienteSeleccionado = null;
let metodoSeleccionado = null;

document.addEventListener("DOMContentLoaded", () => {
  // 1. Obtener productos del backend
  fetch("http://localhost/proyecto-ipta-inti/backend/productos.php")
    .then(res => res.json())
    .then(data => {
      productos = data;
      inicializarBuscadorProductos();
    });

  // 2. Obtener promociones del backend
  fetch("http://localhost/proyecto-ipta-inti/backend/promociones.php")
    .then(res => res.json())
    .then(data => {
      promociones = data;
    });

  // 3. Obtener clientes del backend
  fetch("http://localhost/proyecto-ipta-inti/backend/clientes.php")
    .then(res => res.json())
    .then(data => {
      clientes = data;
      inicializarSelectorClientes();
    });

  // 4. Inicializadores y eventos
  document.getElementById("formAgregarProducto").addEventListener("submit", agregarProductoVenta);
  document.getElementById("btnEfectivo").addEventListener("click", () => seleccionarMetodo("efectivo"));
  document.getElementById("btnTarjeta").addEventListener("click", () => seleccionarMetodo("tarjeta"));
  document.getElementById("btnDescuentoGlobal").addEventListener("click", aplicarDescuentoGlobal);
  actualizarVisualMetodoPago();
});

// ========== Buscador visual de productos ==========

function inicializarBuscadorProductos() {
  const input = document.getElementById('codigoProducto');
  input.setAttribute('list', 'listaCodigos');
  let oldDatalist = document.getElementById('listaCodigos');
  if (oldDatalist) oldDatalist.remove();
  let datalist = document.createElement('datalist');
  datalist.id = 'listaCodigos';
  productos.forEach(p => {
    let option = document.createElement('option');
    option.value = p.codigoDeBarras;
    option.label = p.nombre;
    datalist.appendChild(option);
  });
  input.parentNode.appendChild(datalist);
}

// ========== Selector de clientes ==========

function inicializarSelectorClientes() {
  const selector = document.getElementById('selectorCliente');
  if (!selector) return;
  selector.innerHTML = '<option value="">Venta sin cliente</option>';
  clientes.forEach(cli => {
    let opt = document.createElement('option');
    opt.value = cli.idCliente;
    opt.textContent = cli.nombre + (cli.fidelizacion === "Sí" ? " ⭐" : "");
    selector.appendChild(opt);
  });
  selector.onchange = function() {
    clienteSeleccionado = clientes.find(c => c.idCliente == this.value) || null;
    renderizarResumenCliente();
  };
}

function renderizarResumenCliente() {
  const resumen = document.getElementById('resumenCliente');
  if (!resumen) return;
  if (!clienteSeleccionado) {
    resumen.textContent = "Sin cliente seleccionado.";
    return;
  }
  resumen.innerHTML = `
    <strong>${clienteSeleccionado.nombre}</strong> <br>
    Tel: ${clienteSeleccionado.telefono || '-'} <br>
    Email: ${clienteSeleccionado.email || '-'} <br>
    Fidelización: ${clienteSeleccionado.fidelizacion || '-'}
  `;
}

// ========== Lógica de la venta ==========

function agregarProductoVenta(event) {
  event.preventDefault();
  const codigo = document.getElementById("codigoProducto").value.trim();
  let cantidad = parseInt(document.getElementById("cantidad").value);

  const prod = productos.find(p => p.codigoDeBarras === codigo);
  if (!prod) return mostrarModal("Producto no encontrado", "error");
  if (cantidad > prod.cantidadStock) return mostrarModal("Stock insuficiente", "error");

  let descuentoExtra = 0;
  promociones.forEach(promo => {
    if (promo.codigo === codigo) descuentoExtra = (promo.descuento / 100);
  });

  let enVenta = venta.find(p => p.codigo === codigo);
  if (enVenta) {
    if ((enVenta.cantidad + cantidad) > prod.cantidadStock) return mostrarModal("No hay suficiente stock", "error");
    enVenta.cantidad += cantidad;
  } else {
    let descuentoLinea = (prod.descuento || 0) + descuentoExtra;
    venta.push({ codigo, cantidad, descuentoLinea });
  }
  renderizarTablaVenta();
  document.getElementById("formAgregarProducto").reset();
  document.getElementById("codigoProducto").focus();
}

function renderizarTablaVenta() {
  const tbody = document.getElementById("tablaVenta");
  tbody.innerHTML = "";
  let total = 0;
  venta.forEach((item, index) => {
    const prod = productos.find(p => p.codigoDeBarras === item.codigo);
    let descuentoTotal = (item.descuentoLinea !== undefined && item.descuentoLinea !== null) ? item.descuentoLinea : (prod.descuento || 0);
    const precioConDescuento = prod.precioVenta * (1 - descuentoTotal);
    const subtotal = precioConDescuento * item.cantidad;
    total += subtotal;
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${item.codigo}</td>
      <td>${prod.nombre}</td>
      <td>$${prod.precioVenta}</td>
      <td>
        <input type="number" min="1" max="${prod.cantidadStock}" value="${item.cantidad}" 
          onchange="actualizarCantidad(${index}, this.value)" style="width: 60px;" />
        <span style="font-size:0.9em;color:${prod.cantidadStock - item.cantidad < 5 ? '#FF6347':'#888'};">
          Stock: ${prod.cantidadStock - item.cantidad}
        </span>
      </td>
      <td>
        <input type="number" min="0" max="100" value="${Math.round((descuentoTotal)*100)}" 
          onchange="actualizarDescuento(${index}, this.value)" style="width:60px;" />%
      </td>
      <td>$${subtotal.toFixed(2)}</td>
      <td>
        <button onclick="eliminarProducto(${index})" class="btn btn-secundario" 
          style="background: var(--color-terracota); color: white;">Eliminar</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
  document.getElementById("totalVenta").textContent = total.toFixed(2);
}

function actualizarCantidad(index, nuevaCantidad) {
  const item = venta[index];
  const prod = productos.find(p => p.codigoDeBarras === item.codigo);
  nuevaCantidad = parseInt(nuevaCantidad);
  if (nuevaCantidad > prod.cantidadStock) return mostrarModal("No hay suficiente stock.", "error");
  if (nuevaCantidad < 1) return mostrarModal("La cantidad mínima es 1.", "error");
  venta[index].cantidad = nuevaCantidad;
  renderizarTablaVenta();
}

function actualizarDescuento(index, descuento) {
  let desc = parseFloat(descuento) / 100;
  if (desc < 0 || desc > 1) return mostrarModal("Descuento inválido.", "error");
  venta[index].descuentoLinea = desc;
  renderizarTablaVenta();
}

function eliminarProducto(index) {
  venta.splice(index, 1);
  renderizarTablaVenta();
}

function aplicarDescuentoGlobal() {
  let porc = parseFloat(window.prompt("Descuento global a toda la venta (%)", "0"));
  if (isNaN(porc) || porc < 0 || porc > 100) return mostrarModal("Valor no válido.", "error");
  venta.forEach(v => v.descuentoLinea = (v.descuentoLinea || 0) + (porc / 100));
  renderizarTablaVenta();
}

// Métodos de pago
function seleccionarMetodo(metodo) {
  metodoSeleccionado = metodo;
  actualizarVisualMetodoPago();
}

function actualizarVisualMetodoPago() {
  const efectivoBtn = document.getElementById("btnEfectivo");
  const tarjetaBtn = document.getElementById("btnTarjeta");
  const texto = document.getElementById("metodoPagoSeleccionado");
  if (!efectivoBtn || !tarjetaBtn || !texto) return;
  efectivoBtn.style.background = metodoSeleccionado === "efectivo" ? "var(--color-verde)" : "#003220";
  tarjetaBtn.style.background = metodoSeleccionado === "tarjeta" ? "var(--color-verde)" : "var(--color-dorado)";
  tarjetaBtn.style.color = metodoSeleccionado === "tarjeta" ? "#fff" : "#333";
  texto.textContent = metodoSeleccionado ? `Seleccionado: ${metodoSeleccionado.charAt(0).toUpperCase() + metodoSeleccionado.slice(1)}` : "";
}

// Finalizar venta: ENVÍA AL BACKEND y muestra factura
function finalizarVenta() {
  if (venta.length === 0) return mostrarModal("No hay productos en la venta.", "error");
  if (!metodoSeleccionado) return mostrarModal("Selecciona un método de pago.", "error");

  let ventaData = {
    idCliente: clienteSeleccionado ? clienteSeleccionado.idCliente : null,
    metodoPago: metodoSeleccionado,
    productos: venta.map(item => ({
      codigo: item.codigo,
      cantidad: item.cantidad,
      descuento: item.descuentoLinea || 0
    }))
  };

  fetch("http://localhost/proyecto-ipta-inti/backend/ventas.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ventaData)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        mostrarFacturaLateral();
        fetch("http://localhost/proyecto-ipta-inti/backend/productos.php")
          .then(res => res.json())
          .then(data => { productos = data; });
        venta = [];
        metodoSeleccionado = null;
        renderizarTablaVenta();
        actualizarVisualMetodoPago();
      } else {
        mostrarModal("Error al registrar la venta: " + (data.error || "Desconocido"), "error");
      }
    })
    .catch(() => mostrarModal("Error de conexión con el servidor.", "error"));
}

function calcularTotalVenta() {
  let total = 0;
  venta.forEach(item => {
    const prod = productos.find(p => p.codigoDeBarras === item.codigo);
    let descuentoTotal = (item.descuentoLinea !== undefined && item.descuentoLinea !== null) ? item.descuentoLinea : (prod.descuento || 0);
    total += prod.precioVenta * (1 - descuentoTotal) * item.cantidad;
  });
  return total;
}

// Factura lateral (solo visual, no actualiza stock localmente)
function mostrarFacturaLateral(efectivo = null) {
  let total = calcularTotalVenta();
  let vuelto = (efectivo !== null) ? (efectivo - total) : 0;
  let html = `
    <div id="factura" class="factura-lateral-content">
      <h2>Factura IPTA-INTI</h2>
      <p>Fecha: ${new Date().toLocaleString()}</p>
      <p>Cliente: ${clienteSeleccionado ? clienteSeleccionado.nombre : "Sin cliente"}</p>
      <table style="width:100%; border-collapse: collapse; text-align: center;">
        <thead>
          <tr>
            <th>Código</th><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Desc.</th><th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
  `;
  venta.forEach(item => {
    const prod = productos.find(p => p.codigoDeBarras === item.codigo);
    let descuentoTotal = (item.descuentoLinea !== undefined && item.descuentoLinea !== null) ? item.descuentoLinea : (prod.descuento || 0);
    const precioConDesc = prod.precioVenta * (1 - descuentoTotal);
    const subtotal = precioConDesc * item.cantidad;
    html += `
      <tr>
        <td>${prod.codigoDeBarras}</td>
        <td>${prod.nombre}</td>
        <td>${item.cantidad}</td>
        <td>$${prod.precioVenta}</td>
        <td>${Math.round(descuentoTotal*100)}%</td>
        <td>$${subtotal.toFixed(2)}</td>
      </tr>
    `;
  });
  html += `</tbody></table>`;
  html += `<p style="text-align:right; margin-top: 20px;"><strong>Total: $${total.toFixed(2)}</strong></p>`;
  if (efectivo !== null) {
    html += `<p style="text-align:right;">Recibido: $${efectivo.toFixed(2)}</p>`;
    html += `<p style="text-align:right;">Vuelto: $${vuelto.toFixed(2)}</p>`;
  }
  html += `<p style="text-align:right;">Método de pago: ${metodoSeleccionado ? metodoSeleccionado.toUpperCase() : ""}</p>`;
  html += `<div style="text-align:center; margin-top: 20px;">
    <button onclick="imprimirFactura()" class="btn">Imprimir Factura</button>
    <button onclick="nuevaVenta()" id="btnNuevaVenta" class="btn btn-secundario" style="margin-left: 1rem;">Nueva Venta</button>
    </div>
    </div>`;
  const lateral = document.getElementById('facturaLateral');
  lateral.innerHTML = html;
  lateral.style.display = "block";
}

// Resto de funciones utilitarias
function imprimirFactura() {
  const factura = document.getElementById("factura");
  const ventana = window.open("", "_blank");
  ventana.document.write(`<html><head><title>Factura</title></head><body>${factura.innerHTML}</body></html>`);
  ventana.document.close();
  ventana.print();
}
function cancelarVenta() {
  if (confirm("¿Estás seguro de cancelar la venta?")) {
    venta = [];
    metodoSeleccionado = null;
    renderizarTablaVenta();
    actualizarVisualMetodoPago();
  }
}
function nuevaVenta() {
  window.location.reload();
}
function mostrarModal(mensaje, tipo = "info") {
  let modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0'; modal.style.left = '0'; modal.style.width = '100vw'; modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.3)';
  modal.style.display = 'flex'; modal.style.justifyContent = 'center'; modal.style.alignItems = 'center';
  modal.innerHTML = `<div style="background:#fff;padding:2em;border-radius:8px;max-width:340px;text-align:center;">
    <div style="color:${tipo==='error'?'#FF6347':'#50C878'};font-weight:bold;font-size:1.1em;margin-bottom:8px;">
      ${tipo==='error'?'Error':'Info'}
    </div>
    <div>${mensaje}</div>
    <button class="btn" style="margin-top:18px;" onclick="this.closest('div').parentNode.remove()">Aceptar</button>
    </div>`;
  document.body.appendChild(modal);
}

// Exportar funciones a window para el HTML
window.actualizarCantidad = actualizarCantidad;
window.actualizarDescuento = actualizarDescuento;
window.eliminarProducto = eliminarProducto;
window.finalizarVenta = finalizarVenta;
window.cancelarVenta = cancelarVenta;
window.imprimirFactura = imprimirFactura;
window.nuevaVenta = nuevaVenta;
