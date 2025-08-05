<?php
// clientes.php - API REST para el módulo Clientes IPTA-INTI

header("Content-Type: application/json; charset=UTF-8");

// Conexión
$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Fallo de conexión"]);
    exit();
}

// === OBTENER TODOS LOS CLIENTES ===
if ($_SERVER["REQUEST_METHOD"] === "GET" && !isset($_GET["id"]) && !isset($_GET["eliminar"])) {
    $res = $mysqli->query("SELECT * FROM cliente ORDER BY idCliente DESC");
    $clientes = [];
    while ($row = $res->fetch_assoc()) {
        $clientes[] = $row;
    }
    echo json_encode($clientes);
    exit();
}

// === OBTENER UN CLIENTE POR ID (para editar) ===
if (isset($_GET["id"])) {
    $id = intval($_GET["id"]);
    $stmt = $mysqli->prepare("SELECT * FROM cliente WHERE idCliente = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $res = $stmt->get_result();
    echo json_encode($res->fetch_assoc());
    exit();
}

// === ELIMINAR UN CLIENTE ===
if (isset($_GET["eliminar"])) {
    $id = intval($_GET["eliminar"]);
    $stmt = $mysqli->prepare("DELETE FROM cliente WHERE idCliente = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(["status" => "ok"]);
    } else {
        echo json_encode(["status" => "error"]);
    }
    exit();
}

// === GUARDAR O ACTUALIZAR CLIENTE (POST JSON) ===
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);

    $idCliente = isset($data["idCliente"]) ? intval($data["idCliente"]) : 0;
    $nombre = $data["nombre"];
    $telefono = $data["telefono"];
    $email = $data["email"];
    $direccion = $data["direccion"];

    if ($idCliente > 0) {
        // ACTUALIZAR
        $stmt = $mysqli->prepare("UPDATE cliente SET nombre=?, telefono=?, email=?, direccion=? WHERE idCliente=?");
        $stmt->bind_param("ssssi", $nombre, $telefono, $email, $direccion, $idCliente);
    } else {
        // INSERTAR NUEVO
        $stmt = $mysqli->prepare("INSERT INTO cliente (nombre, telefono, email, direccion) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $nombre, $telefono, $email, $direccion);
    }

    if ($stmt->execute()) {
        echo json_encode(["status" => "ok"]);
    } else {
        echo json_encode(["status" => "error"]);
    }
    exit();
}

// === MÉTODO NO SOPORTADO ===
http_response_code(405);
echo json_encode(["error" => "Método no permitido"]);
exit();
?>
