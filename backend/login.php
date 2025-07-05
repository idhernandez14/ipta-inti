<?php
// login.php - Backend de inicio de sesión seguro para IPTA-INTI

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

// Solo aceptar POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $usuario = trim($data['usuario'] ?? "");
    $contrasena = trim($data['contrasena'] ?? "");
    $rol = trim($data['rol'] ?? "");

    if (!$usuario || !$contrasena || !$rol) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Datos incompletos."]);
        exit();
    }

    // Obtiene el usuario por nombreUsuario y rol
    $stmt = $mysqli->prepare(
        "SELECT idUsuario, nombreUsuario, contrasena, rol, estado
         FROM usuario
         WHERE nombreUsuario = ? AND rol = ?"
    );
    $stmt->bind_param("ss", $usuario, $rol);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        // 1. Primero intenta con password_verify (hash seguro)
        if (password_verify($contrasena, $row['contrasena'])) {
            // Si está inactivo
            if ($row["estado"] !== "activo") {
                echo json_encode(["success" => false, "error" => "Usuario inactivo."]);
            } else {
                echo json_encode([
                    "success" => true,
                    "usuario" => $row["nombreUsuario"],
                    "rol" => $row["rol"],
                    "idUsuario" => $row["idUsuario"]
                ]);
            }
            exit();
        }
        // 2. Soporte legacy: Si el password es texto plano
        if ($contrasena === $row['contrasena']) {
            // **TIP**: Puedes aquí actualizar a hash, para migrar usuarios antiguos automáticamente
            // $nuevoHash = password_hash($contrasena, PASSWORD_DEFAULT);
            // $stmtUpdate = $mysqli->prepare("UPDATE usuario SET contrasena=? WHERE idUsuario=?");
            // $stmtUpdate->bind_param("si", $nuevoHash, $row["idUsuario"]);
            // $stmtUpdate->execute();
            // $stmtUpdate->close();
            if ($row["estado"] !== "activo") {
                echo json_encode(["success" => false, "error" => "Usuario inactivo."]);
            } else {
                echo json_encode([
                    "success" => true,
                    "usuario" => $row["nombreUsuario"],
                    "rol" => $row["rol"],
                    "idUsuario" => $row["idUsuario"]
                ]);
            }
            exit();
        }

        // Contraseña incorrecta
        echo json_encode(["success" => false, "error" => "Usuario, contraseña o rol incorrectos."]);
    } else {
        // Usuario/rol no existe
        echo json_encode(["success" => false, "error" => "Usuario, contraseña o rol incorrectos."]);
    }
    exit();
}

// Respuesta para otros métodos no permitidos
http_response_code(405);
echo json_encode(["error" => "Método no permitido."]);
exit();
?>
