<?php
// promociones.php - Backend CRUD para módulo de promociones en IPTA-INTI

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $mysqli->connect_error]);
    exit();
}

// GET - listar promociones
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $mysqli->query("SELECT * FROM promocion");
    $promos = [];
    while ($row = $result->fetch_assoc()) {
        // Si tu tabla NO tiene columna "nombre", usamos "descripcion" como nombre amigable
        $promos[] = [
            "idPromocion"  => $row["idPromocion"],
            "nombre"       => isset($row["nombre"]) ? $row["nombre"] : $row["descripcion"],
            "descripcion"  => $row["descripcion"],
            "descuento"    => isset($row["valorDescuento"]) ? $row["valorDescuento"] : $row["descuento"]
        ];
    }
    echo json_encode($promos);
    exit();
}

// POST - agregar promoción
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $nombre       = trim($data['nombre'] ?? "");
    $descripcion  = trim($data['descripcion'] ?? "");
    $descuento    = floatval($data['descuento'] ?? 0);

    // Si tu tabla promocion NO tiene columna "nombre", solo guarda la descripción
    $descGuardar = $nombre ? ($nombre . " - " . $descripcion) : $descripcion;

    $stmt = $mysqli->prepare("INSERT INTO promocion (descripcion, valorDescuento) VALUES (?, ?)");
    $stmt->bind_param("sd", $descGuardar, $descuento);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "idPromocion" => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    exit();
}

// PUT - actualizar promoción
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $idPromocion  = intval($data['idPromocion'] ?? 0);
    $nombre       = trim($data['nombre'] ?? "");
    $descripcion  = trim($data['descripcion'] ?? "");
    $descuento    = floatval($data['descuento'] ?? 0);

    if (!$idPromocion) {
        http_response_code(400);
        echo json_encode(["error" => "ID de promoción requerido."]);
        exit();
    }

    $descGuardar = $nombre ? ($nombre . " - " . $descripcion) : $descripcion;

    $stmt = $mysqli->prepare("UPDATE promocion SET descripcion=?, valorDescuento=? WHERE idPromocion=?");
    $stmt->bind_param("sdi", $descGuardar, $descuento, $idPromocion);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    exit();
}

// DELETE - eliminar promoción
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $idPromocion = intval($data['idPromocion'] ?? 0);
    if (!$idPromocion) {
        http_response_code(400);
        echo json_encode(["error" => "ID de promoción requerido."]);
        exit();
    }
    $stmt = $mysqli->prepare("DELETE FROM promocion WHERE idPromocion=?");
    $stmt->bind_param("i", $idPromocion);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    exit();
}

// MÉTODO NO SOPORTADO
http_response_code(405);
echo json_encode(["error" => "Método no permitido."]);
exit();
?>