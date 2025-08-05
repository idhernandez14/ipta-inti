// dashboard.js - Dashboard dinámico con gráficos y reportes para IPTA-INTI

// === Colores institucionales para gráficos ===
const colores = {
  verde: '#50C878',
  terracota: '#E2725B',
  dorado: '#D4AF37',
  azul: '#0044FF',
  turquesa: '#40E0D0'
};

// === Cargar datos desde el backend cuando el DOM esté listo ===
document.addEventListener("DOMContentLoaded", () => {
  fetch("../backend/dashboard.php")
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        mostrarError(data.error);
        return;
      }

      if (data.ventasSemana) generarGraficoVentas(data.ventasSemana);
      if (data.stockProductos) generarGraficoStock(data.stockProductos);
      if (data.reportes) renderizarTablaReportes(data.reportes);
      if (data.ventas) renderizarTablaVentas(data.ventas);
    })
    .catch(err => {
      console.error("❌ Error al cargar datos del dashboard:", err);
      mostrarError("No se pudo conectar con el servidor.");
    });
});

// === Mostrar mensaje de error visual ===
function mostrarError(mensaje) {
  alert(`⚠️ Error en el dashboard: ${mensaje}`);
}

// === Gráfico de barras: Ventas por día ===
function generarGraficoVentas(ventasPorDia) {
  const ctx = document.getElementById("graficoVentas");
  if (!ctx) return;

  const diasOrdenados = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  const datos = diasOrdenados.map(dia => ventasPorDia[dia] || 0);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: diasOrdenados.map(d => d.charAt(0).toUpperCase() + d.slice(1)),
      datasets: [{
        label: "Ventas (COP)",
        data: datos,
        backgroundColor: colores.verde,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `$${value.toLocaleString("es-CO")}`
          }
        }
      }
    }
  });
}

// === Gráfico doughnut: Stock de productos top 5 ===
function generarGraficoStock(productos) {
  const ctx = document.getElementById("graficoStock");
  if (!ctx) return;

  const labels = productos.map(p => p.nombre);
  const datos = productos.map(p => p.cantidad);

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        label: "Stock",
        data: datos,
        backgroundColor: [
          colores.verde,
          colores.terracota,
          colores.dorado,
          colores.azul,
          colores.turquesa
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

// === Renderizar tabla de ventas recientes ===
function renderizarTablaVentas(ventas) {
  const tbody = document.getElementById("datosVentas");
  if (!tbody || !Array.isArray(ventas)) return;

  tbody.innerHTML = "";

  if (ventas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No hay ventas registradas.</td></tr>`;
    return;
  }

  ventas.forEach(v => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${v.idVenta}</td>
      <td>${v.fecha}</td>
      <td>$${parseFloat(v.total).toLocaleString("es-CO")}</td>
      <td>${v.cliente}</td>
      <td>${v.empleado}</td>
    `;
    tbody.appendChild(fila);
  });
}

// === Renderizar tabla de reportes recientes ===
function renderizarTablaReportes(reportes) {
  const tbody = document.getElementById("datosReportes");
  if (!tbody || !Array.isArray(reportes)) return;

  tbody.innerHTML = "";

  if (reportes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">No hay reportes disponibles.</td></tr>`;
    return;
  }

  reportes.forEach(rep => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${rep.idReporte}</td>
      <td>${rep.tipoReporte}</td>
      <td>${rep.datos}</td>
    `;
    tbody.appendChild(fila);
  });
}
