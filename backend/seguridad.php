<?php
// seguridad.php - Backend de gestión de usuarios IPTA-INTI

// ====== Cabeceras CORS y formato de respuesta ======
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// ====== Conexión a la base de datos ======
$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $mysqli->connect_error]);
    exit();
}

// ==================== MÉTODO GET ====================
// Lista todos los usuarios (no se expone la contraseña)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $mysqli->query("SELECT idUsuario, nombreUsuario, rol, estado FROM usuario");
    $usuarios = [];
    while ($row = $result->fetch_assoc()) {
        $usuarios[] = [
            "idUsuario"     => $row["idUsuario"],
            "nombreUsuario" => $row["nombreUsuario"],
            "rol"           => $row["rol"],
            "estado"        => $row["estado"] ?? "activo"
        ];
    }
    echo json_encode($usuarios);
    exit();
}

// ==================== MÉTODO POST ====================
// Agrega un nuevo usuario (con validación y hash)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $nombreUsuario = trim($data['nombreUsuario'] ?? "");
    $contrasena    = trim($data['contrasena'] ?? "");
    $rol           = trim($data['rol'] ?? "");
    $estado        = trim($data['estado'] ?? "activo");

    if (!$nombreUsuario || !$contrasena || !$rol) {
        http_response_code(400);
        echo json_encode(["error" => "Todos los campos son obligatorios."]);
        exit();
    }

    // Validación: nombre de usuario duplicado
    $check = $mysqli->prepare("SELECT idUsuario FROM usuario WHERE nombreUsuario = ?");
    $check->bind_param("s", $nombreUsuario);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        echo json_encode(["error" => "El usuario ya existe."]);
        $check->close();
        exit();
    }
    $check->close();

    // Encriptar la contraseña
    $contrasenaHash = password_hash($contrasena, PASSWORD_DEFAULT);

    // Insertar usuario
    $stmt = $mysqli->prepare("INSERT INTO usuario (nombreUsuario, contrasena, rol, estado) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $nombreUsuario, $contrasenaHash, $rol, $estado);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "insert_id" => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
    exit();
}

// ==================== MÉTODO PUT ====================
// Actualiza un usuario (con opción de cambiar contraseña)
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $idUsuario     = intval($data['idUsuario'] ?? 0);
    $nombreUsuario = trim($data['nombreUsuario'] ?? "");
    $contrasena    = isset($data['contrasena']) ? trim($data['contrasena']) : null;
    $rol           = trim($data['rol'] ?? "");
    $estado        = trim($data['estado'] ?? "activo");

    if (!$idUsuario || !$nombreUsuario || !$rol) {
        http_response_code(400);
        echo json_encode(["error" => "ID, nombre y rol son obligatorios."]);
        exit();
    }

    // Con contraseña actualizada
    if (!empty($contrasena)) {
        $contrasenaHash = password_hash($contrasena, PASSWORD_DEFAULT);
        $stmt = $mysqli->prepare("UPDATE usuario SET nombreUsuario=?, contrasena=?, rol=?, estado=? WHERE idUsuario=?");
        $stmt->bind_param("ssssi", $nombreUsuario, $contrasenaHash, $rol, $estado, $idUsuario);
    } else {
        $stmt = $mysqli->prepare("UPDATE usuario SET nombreUsuario=?, rol=?, estado=? WHERE idUsuario=?");
        $stmt->bind_param("sssi", $nombreUsuario, $rol, $estado, $idUsuario);
    }

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
    exit();
}

// ==================== MÉTODO DELETE ====================
// Elimina un usuario por ID
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $idUsuario = intval($data['idUsuario'] ?? 0);

    if (!$idUsuario) {
        http_response_code(400);
        echo json_encode(["error" => "ID de usuario requerido."]);
        exit();
    }

    $stmt = $mysqli->prepare("DELETE FROM usuario WHERE idUsuario = ?");
    $stmt->bind_param("i", $idUsuario);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
    exit();
}

// ==================== MÉTODO OPTIONS ====================
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==================== OTROS MÉTODOS ====================
http_response_code(405);
echo json_encode(["error" => "Método no permitido."]);
exit();
?>
