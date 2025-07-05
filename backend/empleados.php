<?php
// empleados.php - Backend REST para el módulo de Empleados del sistema IPTA-INTI

// === Encabezados de seguridad y CORS ===
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// === Conexión a la base de datos ===
$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $mysqli->connect_error]);
    exit();
}

// === Respuesta rápida a preflight CORS ===
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// === Obtener datos JSON del body ===
function getRequestData() {
    return json_decode(file_get_contents("php://input"), true);
}

// ==============================
// MÉTODO: GET (Listar empleados)
// ==============================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $mysqli->query("SELECT * FROM empleado");
    $empleados = [];
    while ($row = $result->fetch_assoc()) {
        $empleados[] = [
            "idEmpleado"        => $row["idEmpleado"],
            "nombre"            => $row["nombre"],
            "cargo"             => $row["cargo"],
            "salario"           => $row["salario"],
            "fechaIngreso"      => $row["fechaIngreso"],
            "controlHorarios"   => $row["controlHorarios"],
            "asignacionTareas"  => $row["asignacionTareas"]
        ];
    }
    echo json_encode($empleados);
    exit();
}

// ==============================
// MÉTODO: POST (Agregar empleado)
// ==============================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getRequestData();
    $nombre = trim($data['nombre'] ?? "");
    $cargo = trim($data['cargo'] ?? "");
    $salario = floatval($data['salario'] ?? 0);
    $controlHorarios = trim($data['controlHorarios'] ?? "");
    $asignacionTareas = trim($data['asignacionTareas'] ?? "");
    $fechaIngreso = date('Y-m-d');

    if (!$nombre || !$cargo || $salario <= 0) {
        http_response_code(400);
        echo json_encode(["error" => "Nombre, cargo y salario válidos son obligatorios."]);
        exit();
    }

    $stmt = $mysqli->prepare(
        "INSERT INTO empleado (nombre, cargo, salario, fechaIngreso, controlHorarios, asignacionTareas)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("ssdsss", $nombre, $cargo, $salario, $fechaIngreso, $controlHorarios, $asignacionTareas);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "idEmpleado" => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
    exit();
}

// ==============================
// MÉTODO: PUT (Actualizar empleado)
// ==============================
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = getRequestData();
    $idEmpleado = intval($data['idEmpleado'] ?? 0);
    $nombre = trim($data['nombre'] ?? "");
    $cargo = trim($data['cargo'] ?? "");
    $salario = floatval($data['salario'] ?? 0);
    $controlHorarios = trim($data['controlHorarios'] ?? "");
    $asignacionTareas = trim($data['asignacionTareas'] ?? "");

    if (!$idEmpleado || !$nombre || !$cargo || $salario <= 0) {
        http_response_code(400);
        echo json_encode(["error" => "ID, nombre, cargo y salario válidos son obligatorios."]);
        exit();
    }

    $stmt = $mysqli->prepare(
        "UPDATE empleado 
         SET nombre=?, cargo=?, salario=?, controlHorarios=?, asignacionTareas=?
         WHERE idEmpleado=?"
    );
    $stmt->bind_param("ssdssi", $nombre, $cargo, $salario, $controlHorarios, $asignacionTareas, $idEmpleado);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
    exit();
}

// ==============================
// MÉTODO: DELETE (Eliminar empleado)
// ==============================
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = getRequestData();
    $idEmpleado = intval($data['idEmpleado'] ?? 0);

    if (!$idEmpleado) {
        http_response_code(400);
        echo json_encode(["error" => "ID de empleado requerido."]);
        exit();
    }

    $stmt = $mysqli->prepare("DELETE FROM empleado WHERE idEmpleado=?");
    $stmt->bind_param("i", $idEmpleado);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
    exit();
}

// ==============================
// MÉTODO NO SOPORTADO
// ==============================
http_response_code(405);
echo json_encode(["error" => "Método no permitido."]);
exit();
?>
