<?php
// proveedores.php - Backend CRUD para módulo de proveedores en IPTA-INTI

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a base de datos MySQL
$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $mysqli->connect_error]);
    exit();
}

// GET - Listar proveedores
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $mysqli->query("SELECT * FROM proveedor");
    $proveedores = [];
    while ($row = $result->fetch_assoc()) {
        $proveedores[] = [
            "idProveedor" => $row["idProveedor"],
            "nombre"      => $row["nombre"],
            "telefono"    => $row["telefono"],
            "email"       => $row["email"] ?? "" // Ajusta si el campo tiene otro nombre
        ];
    }
    echo json_encode($proveedores);
    exit();
}

// POST - Agregar proveedor
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data     = json_decode(file_get_contents("php://input"), true);
    $nombre   = trim($data['nombre'] ?? "");
    $telefono = trim($data['telefono'] ?? "");
    $email    = trim($data['email'] ?? "");

    // Validación de campos
    if (!$nombre || !$telefono || !$email) {
        http_response_code(400);
        echo json_encode(["error" => "Todos los campos son obligatorios."]);
        exit();
    }

    $stmt = $mysqli->prepare("INSERT INTO proveedor (nombre, telefono, email) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $nombre, $telefono, $email);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "idProveedor" => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    exit();
}

// PUT - Actualizar proveedor
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data        = json_decode(file_get_contents("php://input"), true);
    $idProveedor = intval($data['idProveedor'] ?? 0);
    $nombre      = trim($data['nombre'] ?? "");
    $telefono    = trim($data['telefono'] ?? "");
    $email       = trim($data['email'] ?? "");

    if (!$idProveedor || !$nombre || !$telefono || !$email) {
        http_response_code(400);
        echo json_encode(["error" => "Todos los campos son obligatorios."]);
        exit();
    }

    $stmt = $mysqli->prepare("UPDATE proveedor SET nombre=?, telefono=?, email=? WHERE idProveedor=?");
    $stmt->bind_param("sssi", $nombre, $telefono, $email, $idProveedor);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    exit();
}

// DELETE - Eliminar proveedor
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data        = json_decode(file_get_contents("php://input"), true);
    $idProveedor = intval($data['idProveedor'] ?? 0);

    if (!$idProveedor) {
        http_response_code(400);
        echo json_encode(["error" => "ID de proveedor requerido."]);
        exit();
    }

    $stmt = $mysqli->prepare("DELETE FROM proveedor WHERE idProveedor=?");
    $stmt->bind_param("i", $idProveedor);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    exit();
}

// Método no permitido
http_response_code(405);
echo json_encode(["error" => "Método no permitido."]);
exit();
?>
