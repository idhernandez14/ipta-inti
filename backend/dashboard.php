<?php
// dashboard.php - Datos dinámicos para el Dashboard (gráficos y tablas) IPTA-INTI

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos
$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $mysqli->connect_error]);
    exit();
}

// Forzar nombres de días en español
$mysqli->query("SET lc_time_names = 'es_ES'");

// === CONSULTA 1: Ventas por día (últimos 7 días) ===
$sqlVentasSemana = "
    SELECT 
        DATE_FORMAT(fecha, '%W') AS dia, 
        SUM(total) AS total
    FROM venta
    WHERE fecha >= CURDATE() - INTERVAL 6 DAY
    GROUP BY dia
";
$resultSemana = $mysqli->query($sqlVentasSemana);

// Inicializar días de la semana en orden correcto
$ventasSemana = [
    "lunes"     => 0,
    "martes"    => 0,
    "miércoles" => 0,
    "jueves"    => 0,
    "viernes"   => 0,
    "sábado"    => 0,
    "domingo"   => 0
];

// Asignar valores a días correspondientes
while ($row = $resultSemana->fetch_assoc()) {
    $dia = strtolower($row['dia']);
    if (isset($ventasSemana[$dia])) {
        $ventasSemana[$dia] = floatval($row["total"]);
    }
}

// === CONSULTA 2: Productos con mayor stock (top 5) ===
$stockProductos = [];
$sqlStock = "SELECT nombre, cantidadStock FROM producto ORDER BY cantidadStock DESC LIMIT 5";
$resultStock = $mysqli->query($sqlStock);
while ($row = $resultStock->fetch_assoc()) {
    $stockProductos[] = [
        "nombre" => $row["nombre"],
        "cantidad" => intval($row["cantidadStock"])
    ];
}

// === CONSULTA 3: Últimos 10 reportes (tabla: reporte) ===
$listaReportes = [];
$sqlReportes = "SELECT idReporte, tipoReporte, datos FROM reporte ORDER BY idReporte DESC LIMIT 10";
$resultReportes = $mysqli->query($sqlReportes);
while ($row = $resultReportes->fetch_assoc()) {
    $listaReportes[] = [
        "idReporte" => $row["idReporte"],
        "tipoReporte" => $row["tipoReporte"],
        "datos" => $row["datos"]
    ];
}

// === CONSULTA 4: Últimas ventas (con cliente y empleado) ===
$ventasTabla = [];
$sqlVentas = "
    SELECT v.idVenta, v.fecha, v.total, 
           COALESCE(c.nombre, 'No registrado') AS cliente, 
           COALESCE(e.nombre, 'Sin empleado') AS empleado
    FROM venta v
    LEFT JOIN cliente c ON v.idCliente = c.idCliente
    LEFT JOIN empleado e ON v.idEmpleado = e.idEmpleado
    ORDER BY v.fecha DESC
    LIMIT 10
";
$resultVentas = $mysqli->query($sqlVentas);
while ($row = $resultVentas->fetch_assoc()) {
    $ventasTabla[] = [
        "idVenta" => $row["idVenta"],
        "fecha" => $row["fecha"],
        "total" => number_format(floatval($row["total"]), 2),
        "cliente" => $row["cliente"],
        "empleado" => $row["empleado"]
    ];
}

// === Enviar respuesta JSON al frontend ===
echo json_encode([
    "ventasSemana"    => $ventasSemana,
    "stockProductos"  => $stockProductos,
    "reportes"        => $listaReportes,
    "ventas"          => $ventasTabla
]);
exit();
?>
