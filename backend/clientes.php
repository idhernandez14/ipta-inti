<?php
// API REST para gestión de clientes en el sistema IPTA-INTI
// Soporta: GET, POST, PUT, DELETE - Respuestas JSON

// Cabeceras para CORS y JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos MySQL
$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $mysqli->connect_error]);
    exit();
}

// Función para obtener datos JSON del cuerpo de la petición
function getRequestData() {
    return json_decode(file_get_contents("php://input"), true);
}

// Validación de email con filtro seguro
function validarEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// ======= MÉTODO GET - LISTAR CLIENTES =======
if ($method === 'GET') {
    $result = $mysqli->query("SELECT * FROM cliente");
    $clientes = [];

    while ($row = $result->fetch_assoc()) {
        $clientes[] = [
            "idCliente"    => $row["idCliente"],
            "nombre"       => $row["nombre"],
            "direccion"    => $row["direccion"],
            "telefono"     => $row["telefono"],
            "email"        => $row["email"],
            "fidelizacion" => $row["fidelizacion"]
        ];
    }

    echo json_encode($clientes);
    exit();
}

// ======= MÉTODO POST - REGISTRAR NUEVO CLIENTE =======
if ($method === 'POST') {
    $data = getRequestData();
    $nombre = trim($data['nombre'] ?? "");
    $direccion = trim($data['direccion'] ?? "");
    $telefono = trim($data['telefono'] ?? "");
    $email = trim($data['email'] ?? "");
    $fidelizacion = trim($data['fidelizacion'] ?? "No");

    // Validaciones básicas
    if (!$nombre) {
        http_response_code(400);
        echo json_encode(["error" => "El nombre es obligatorio."]);
        exit();
    }
    if ($email && !validarEmail($email)) {
        http_response_code(400);
        echo json_encode(["error" => "El email no es válido."]);
        exit();
    }

    // Inserción segura
    $stmt = $mysqli->prepare("INSERT INTO cliente (nombre, direccion, telefono, email, fidelizacion) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $nombre, $direccion, $telefono, $email, $fidelizacion);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "idCliente" => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "No se pudo registrar el cliente."]);
    }
    $stmt->close();
    exit();
}

// ======= MÉTODO PUT - ACTUALIZAR CLIENTE =======
if ($method === 'PUT') {
    $data = getRequestData();
    $idCliente = intval($data['idCliente'] ?? 0);
    $nombre = trim($data['nombre'] ?? "");
    $direccion = trim($data['direccion'] ?? "");
    $telefono = trim($data['telefono'] ?? "");
    $email = trim($data['email'] ?? "");
    $fidelizacion = trim($data['fidelizacion'] ?? "No");

    if (!$idCliente || !$nombre) {
        http_response_code(400);
        echo json_encode(["error" => "ID y nombre son obligatorios."]);
        exit();
    }
    if ($email && !validarEmail($email)) {
        http_response_code(400);
        echo json_encode(["error" => "El email no es válido."]);
        exit();
    }

    $stmt = $mysqli->prepare("UPDATE cliente SET nombre=?, direccion=?, telefono=?, email=?, fidelizacion=? WHERE idCliente=?");
    $stmt->bind_param("sssssi", $nombre, $direccion, $telefono, $email, $fidelizacion, $idCliente);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Error al actualizar el cliente."]);
    }
    $stmt->close();
    exit();
}

// ======= MÉTODO DELETE - ELIMINAR CLIENTE =======
if ($method === 'DELETE') {
    $data = getRequestData();
    $idCliente = intval($data['idCliente'] ?? 0);
    if (!$idCliente) {
        http_response_code(400);
        echo json_encode(["error" => "ID es obligatorio."]);
        exit();
    }

    $stmt = $mysqli->prepare("DELETE FROM cliente WHERE idCliente=?");
    $stmt->bind_param("i", $idCliente);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "No se pudo eliminar el cliente."]);
    }
    $stmt->close();
    exit();
}

// ======= MÉTODO NO SOPORTADO =======
http_response_code(405);
echo json_encode(["error" => "Método no permitido."]);
exit();
?>
