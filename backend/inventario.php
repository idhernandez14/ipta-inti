<?php
// inventario.php - Backend API Inventario IPTA-INTI

header("Content-Type: application/json; charset=UTF-8");

// Conexión a BD
$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión"]);
    exit();
}

// === LISTAR TODOS LOS MOVIMIENTOS ===
if ($_SERVER["REQUEST_METHOD"] === "GET" && !isset($_GET["id"]) && !isset($_GET["eliminar"])) {
    $res = $mysqli->query("SELECT * FROM inventario ORDER BY idInventario DESC");
    $inventario = [];
    while ($row = $res->fetch_assoc()) {
        $inventario[] = $row;
    }
    echo json_encode($inventario);
    exit();
}

// === OBTENER UN MOVIMIENTO POR ID ===
if (isset($_GET["id"])) {
    $id = intval($_GET["id"]);
    $stmt = $mysqli->prepare("SELECT * FROM inventario WHERE idInventario = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $res = $stmt->get_result();
    echo json_encode($res->fetch_assoc());
    exit();
}

// === ELIMINAR MOVIMIENTO ===
if (isset($_GET["eliminar"])) {
    $id = intval($_GET["eliminar"]);
    $stmt = $mysqli->prepare("DELETE FROM inventario WHERE idInventario = ?");
    $stmt->bind_param("i", $id);
    echo json_encode(["status" => $stmt->execute() ? "ok" : "error"]);
    exit();
}

// === CREAR O ACTUALIZAR MOVIMIENTO ===
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);

    $idInventario = isset($data["idInventario"]) ? intval($data["idInventario"]) : 0;
    $producto = trim($data["producto"]);
    $cantidad = intval($data["cantidad"]);
    $tipoMovimiento = trim($data["tipoMovimiento"]);

    if (!in_array($tipoMovimiento, ["entrada", "salida"])) {
        echo json_encode(["status" => "error", "mensaje" => "Movimiento no válido"]);
        exit();
    }

    if ($idInventario > 0) {
        // ACTUALIZAR
        $stmt = $mysqli->prepare("UPDATE inventario SET producto=?, cantidad=?, tipoMovimiento=? WHERE idInventario=?");
        $stmt->bind_param("sisi", $producto, $cantidad, $tipoMovimiento, $idInventario);
    } else {
        // INSERTAR
        $stmt = $mysqli->prepare("INSERT INTO inventario (producto, cantidad, tipoMovimiento, fecha) VALUES (?, ?, ?, NOW())");
        $stmt->bind_param("sis", $producto, $cantidad, $tipoMovimiento);
    }

    echo json_encode(["status" => $stmt->execute() ? "ok" : "error"]);
    exit();
}

// === MÉTODO NO PERMITIDO ===
http_response_code(405);
echo json_encode(["error" => "Método no permitido"]);
exit();
?>
