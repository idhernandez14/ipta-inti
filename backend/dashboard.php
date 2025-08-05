<?php
// dashboard.php - Backend para módulo Dashboard (IPTA-INTI)

header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos
$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $mysqli->connect_error]);
    exit();
}

// === Inicializar estructura de días de la semana ===
$diasOrdenados = [2 => 'lunes', 3 => 'martes', 4 => 'miércoles', 5 => 'jueves', 6 => 'viernes', 7 => 'sábado', 1 => 'domingo'];
$ventasSemana = array_fill_keys(array_values($diasOrdenados), 0.0);

// === CONSULTA 1: Ventas por día numérico ===
$sqlSemana = "
    SELECT DAYOFWEEK(fecha) AS dia_num, SUM(total) AS total
    FROM venta
    WHERE fecha >= CURDATE() - INTERVAL 6 DAY
    GROUP BY dia_num
";
$resultSemana = $mysqli->query($sqlSemana);
if (!$resultSemana) {
    http_response_code(500);
    echo json_encode(["error" => "Error en consulta de ventas semanales"]);
    exit();
}
while ($row = $resultSemana->fetch_assoc()) {
    $diaNum = intval($row['dia_num']);
    if (isset($diasOrdenados[$diaNum])) {
        $ventasSemana[$diasOrdenados[$diaNum]] = floatval($row['total']);
    }
}

// === CONSULTA 2: Productos con mayor stock (top 5) ===
$stockProductos = [];
$sqlStock = "SELECT nombre, cantidadStock FROM producto ORDER BY cantidadStock DESC LIMIT 5";
$resultStock = $mysqli->query($sqlStock);
if (!$resultStock) {
    http_response_code(500);
    echo json_encode(["error" => "Error en consulta de stock de productos"]);
    exit();
}
while ($row = $resultStock->fetch_assoc()) {
    $stockProductos[] = [
        "nombre" => $row["nombre"],
        "cantidad" => intval($row["cantidadStock"])
    ];
}

// === CONSULTA 3: Últimos reportes ===
$listaReportes = [];
$sqlReportes = "SELECT idReporte, tipoReporte, datos FROM reporte ORDER BY idReporte DESC LIMIT 10";
$resultReportes = $mysqli->query($sqlReportes);
if (!$resultReportes) {
    http_response_code(500);
    echo json_encode(["error" => "Error en consulta de reportes"]);
    exit();
}
while ($row = $resultReportes->fetch_assoc()) {
    $listaReportes[] = [
        "idReporte" => intval($row["idReporte"]),
        "tipoReporte" => $row["tipoReporte"],
        "datos" => $row["datos"]
    ];
}

// === CONSULTA 4: Últimas ventas ===
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
if (!$resultVentas) {
    http_response_code(500);
    echo json_encode(["error" => "Error en consulta de ventas recientes"]);
    exit();
}
while ($row = $resultVentas->fetch_assoc()) {
    $ventasTabla[] = [
        "idVenta" => intval($row["idVenta"]),
        "fecha" => $row["fecha"],
        "total" => floatval($row["total"]),
        "cliente" => $row["cliente"],
        "empleado" => $row["empleado"]
    ];
}

// === RESPUESTA JSON ===
echo json_encode([
    "ventasSemana"   => $ventasSemana,
    "stockProductos" => $stockProductos,
    "reportes"       => $listaReportes,
    "ventas"         => $ventasTabla
]);
exit();
?>
