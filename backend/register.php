<?php
// register.php - Registro seguro de usuarios para IPTA-INTI

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos
$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $mysqli->connect_error]);
    exit();
}

// SOLO permite POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // Validar campos requeridos
    $nombre      = trim($data['nombre'] ?? '');
    $usuario     = trim($data['usuario'] ?? '');
    $contrasena  = trim($data['contrasena'] ?? '');
    $rol         = trim($data['rol'] ?? '');
    $estado      = "activo"; // Por defecto

    if (!$nombre || !$usuario || !$contrasena || !$rol) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Todos los campos son obligatorios."]);
        exit();
    }

    // Validar usuario único
    $stmt = $mysqli->prepare("SELECT idUsuario FROM usuario WHERE nombreUsuario=?");
    $stmt->bind_param("s", $usuario);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        echo json_encode(["success" => false, "error" => "El usuario ya existe."]);
        $stmt->close();
        exit();
    }
    $stmt->close();

    // Seguridad: encriptar contraseña
    $contrasenaHash = password_hash($contrasena, PASSWORD_DEFAULT);

    // Insertar usuario
    $stmt = $mysqli->prepare(
        "INSERT INTO usuario (nombreUsuario, contrasena, rol, estado) VALUES (?, ?, ?, ?)"
    );
    $stmt->bind_param("ssss", $usuario, $contrasenaHash, $rol, $estado);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    $stmt->close();
    exit();
}

// Solo permite POST
http_response_code(405);
echo json_encode(["error" => "Método no permitido."]);
exit();
?>
