<?php
// productos.php - Backend CRUD para módulo de productos en IPTA-INTI

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos
$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $mysqli->connect_error]);
    exit();
}

// GET - listar productos
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $mysqli->query("SELECT * FROM producto");
    $productos = [];
    while ($row = $result->fetch_assoc()) {
        // Mapea nombres consistentes con el frontend JS
        $productos[] = [
            "idProducto"      => $row["idProducto"],
            "nombre"          => $row["nombre"],
            "codigoDeBarras"  => $row["codigoDeBarras"],
            "descripcion"     => $row["descripcion"],
            "precioCompra"    => $row["precioCompra"],
            "precioVenta"     => $row["precioVenta"],
            "cantidadStock"   => $row["cantidadStock"],
            "idProveedor"     => $row["idProveedor"]
            // Si tienes fechaVencimiento: "fechaVencimiento" => $row["fechaVencimiento"]
        ];
    }
    echo json_encode($productos);
    exit();
}

// POST - agregar producto
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $nombre = trim($data['nombre'] ?? "");
    $codigoDeBarras = trim($data['codigoDeBarras'] ?? "");
    $descripcion = trim($data['descripcion'] ?? "");
    $precioCompra = floatval($data['precioCompra'] ?? 0);
    $precioVenta = floatval($data['precioVenta'] ?? 0);
    $cantidadStock = intval($data['cantidadStock'] ?? 0);
    $idProveedor = trim($data['idProveedor'] ?? "");
    // Puedes agregar 'fechaVencimiento' aquí

    // Validación básica
    if (!$nombre || !$codigoDeBarras || !$precioCompra || !$precioVenta || !$idProveedor) {
        http_response_code(400);
        echo json_encode(["error" => "Todos los campos obligatorios deben estar completos."]);
        exit();
    }

    // Validación: código único
    $check = $mysqli->prepare("SELECT idProducto FROM producto WHERE codigoDeBarras=?");
    $check->bind_param("s", $codigoDeBarras);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        http_response_code(400);
        echo json_encode(["error" => "El código de barras ya existe."]);
        exit();
    }

    $stmt = $mysqli->prepare("INSERT INTO producto (nombre, codigoDeBarras, descripcion, precioCompra, precioVenta, cantidadStock, idProveedor) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssddis", $nombre, $codigoDeBarras, $descripcion, $precioCompra, $precioVenta, $cantidadStock, $idProveedor);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "idProducto" => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    exit();
}

// PUT - actualizar producto
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $idProducto = intval($data['idProducto'] ?? 0);
    $nombre = trim($data['nombre'] ?? "");
    $codigoDeBarras = trim($data['codigoDeBarras'] ?? "");
    $descripcion = trim($data['descripcion'] ?? "");
    $precioCompra = floatval($data['precioCompra'] ?? 0);
    $precioVenta = floatval($data['precioVenta'] ?? 0);
    $cantidadStock = intval($data['cantidadStock'] ?? 0);
    $idProveedor = trim($data['idProveedor'] ?? "");

    // Validación básica
    if (!$idProducto || !$nombre || !$codigoDeBarras || !$precioCompra || !$precioVenta || !$idProveedor) {
        http_response_code(400);
        echo json_encode(["error" => "Todos los campos obligatorios deben estar completos."]);
        exit();
    }

    // Validación: no duplicar código de barras (excepto en el mismo producto)
    $check = $mysqli->prepare("SELECT idProducto FROM producto WHERE codigoDeBarras=? AND idProducto<>?");
    $check->bind_param("si", $codigoDeBarras, $idProducto);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        http_response_code(400);
        echo json_encode(["error" => "El código de barras ya está asignado a otro producto."]);
        exit();
    }

    $stmt = $mysqli->prepare("UPDATE producto SET nombre=?, codigoDeBarras=?, descripcion=?, precioCompra=?, precioVenta=?, cantidadStock=?, idProveedor=? WHERE idProducto=?");
    $stmt->bind_param("sssddisi", $nombre, $codigoDeBarras, $descripcion, $precioCompra, $precioVenta, $cantidadStock, $idProveedor, $idProducto);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    exit();
}

// DELETE - eliminar producto
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $idProducto = intval($data['idProducto'] ?? 0);
    if (!$idProducto) {
        http_response_code(400);
        echo json_encode(["error" => "ID de producto requerido."]);
        exit();
    }
    $stmt = $mysqli->prepare("DELETE FROM producto WHERE idProducto=?");
    $stmt->bind_param("i", $idProducto);
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