<?php
// empleados.php - Backend API para módulo de Empleados IPTA-INTI

header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos
$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión"]);
    exit();
}

// === LISTAR TODOS LOS EMPLEADOS ===
if ($_SERVER["REQUEST_METHOD"] === "GET" && !isset($_GET["id"]) && !isset($_GET["eliminar"])) {
    $result = $mysqli->query("SELECT * FROM empleado ORDER BY idEmpleado DESC");
    $empleados = [];
    while ($row = $result->fetch_assoc()) {
        $empleados[] = $row;
    }
    echo json_encode($empleados);
    exit();
}

// === OBTENER UN EMPLEADO POR ID ===
if (isset($_GET["id"])) {
    $id = intval($_GET["id"]);
    $stmt = $mysqli->prepare("SELECT * FROM empleado WHERE idEmpleado = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $res = $stmt->get_result();
    echo json_encode($res->fetch_assoc());
    exit();
}

// === ELIMINAR UN EMPLEADO ===
if (isset($_GET["eliminar"])) {
    $id = intval($_GET["eliminar"]);
    $stmt = $mysqli->prepare("DELETE FROM empleado WHERE idEmpleado = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(["status" => "ok"]);
    } else {
        echo json_encode(["status" => "error"]);
    }
    exit();
}

// === GUARDAR O ACTUALIZAR EMPLEADO (POST JSON) ===
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);

    $idEmpleado = isset($data["idEmpleado"]) ? intval($data["idEmpleado"]) : 0;
    $nombre = $data["nombre"];
    $cargo = $data["cargo"];
    $salario = floatval($data["salario"]);

    if ($idEmpleado > 0) {
        // Actualizar
        $stmt = $mysqli->prepare("UPDATE empleado SET nombre=?, cargo=?, salario=? WHERE idEmpleado=?");
        $stmt->bind_param("ssdi", $nombre, $cargo, $salario, $idEmpleado);
    } else {
        // Insertar nuevo
        $stmt = $mysqli->prepare("INSERT INTO empleado (nombre, cargo, salario) VALUES (?, ?, ?)");
        $stmt->bind_param("ssd", $nombre, $cargo, $salario);
    }

    if ($stmt->execute()) {
        echo json_encode(["status" => "ok"]);
    } else {
        echo json_encode(["status" => "error"]);
    }
    exit();
}

// === MÉTODO NO PERMITIDO ===
http_response_code(405);
echo json_encode(["error" => "Método no permitido"]);
exit();
?>
