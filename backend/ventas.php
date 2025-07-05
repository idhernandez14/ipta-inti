<?php
// ventas.php - Backend de ventas y POS para IPTA-INTI

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $mysqli->connect_error]);
    exit();
}

// === LISTAR VENTAS Y DETALLES ===
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $ventas = [];
    $sql = "SELECT v.idVenta, v.fecha, v.total, c.nombre AS cliente, e.nombre AS empleado
            FROM venta v
            LEFT JOIN cliente c ON v.idCliente = c.idCliente
            LEFT JOIN empleado e ON v.idEmpleado = e.idEmpleado
            ORDER BY v.idVenta DESC";
    $result = $mysqli->query($sql);

    while ($row = $result->fetch_assoc()) {
        $idVenta = $row['idVenta'];
        // Detalles de productos (seguro contra inyección con prepare)
        $stmtDet = $mysqli->prepare(
            "SELECT d.idDetalle, d.cantidad, d.precioUnitario, d.subtotal, 
                    p.nombre AS producto, p.codigoDeBarras
             FROM detalle_venta d
             JOIN producto p ON d.idProducto = p.idProducto
             WHERE d.idVenta = ?"
        );
        $stmtDet->bind_param("i", $idVenta);
        $stmtDet->execute();
        $detResult = $stmtDet->get_result();
        $detalles = [];
        while ($d = $detResult->fetch_assoc()) $detalles[] = $d;
        $stmtDet->close();

        $row['detalles'] = $detalles;
        $ventas[] = $row;
    }
    echo json_encode($ventas);
    exit();
}

// === REGISTRAR NUEVA VENTA ===
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $idCliente = isset($data['idCliente']) ? $data['idCliente'] : null;
    $idEmpleado = isset($data['idEmpleado']) ? $data['idEmpleado'] : null;
    $productos = $data['productos'];
    $fecha = date('Y-m-d');
    $total = 0;
    $detalleInsertados = [];
    $conn = $mysqli;

    // 1. Calcular el total y verificar stock (seguro contra inyección)
    foreach ($productos as $prod) {
        $codigo = $prod['codigo'];
        $cantidad = intval($prod['cantidad']);
        $descuento = isset($prod['descuento']) ? floatval($prod['descuento']) : 0;

        $stmtProd = $conn->prepare("SELECT idProducto, precioVenta, cantidadStock FROM producto WHERE codigoDeBarras=? LIMIT 1");
        $stmtProd->bind_param("s", $codigo);
        $stmtProd->execute();
        $prodRes = $stmtProd->get_result();
        if (!$prodRow = $prodRes->fetch_assoc()) {
            echo json_encode(["error" => "Producto no encontrado: $codigo"]);
            exit();
        }
        $idProducto = $prodRow['idProducto'];
        $precio = $prodRow['precioVenta'];
        $stock = $prodRow['cantidadStock'];
        if ($cantidad > $stock) {
            echo json_encode(["error" => "Stock insuficiente para el producto: $codigo"]);
            exit();
        }
        $precioFinal = $precio * (1 - $descuento);
        $subtotal = $precioFinal * $cantidad;
        $total += $subtotal;
        $detalleInsertados[] = [
            'idProducto' => $idProducto,
            'cantidad' => $cantidad,
            'precioUnitario' => $precioFinal,
            'subtotal' => $subtotal
        ];
        $stmtProd->close();
    }

    // 2. Insertar venta
    $stmt = $conn->prepare("INSERT INTO venta (fecha, total, idCliente, idEmpleado) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("sdii", $fecha, $total, $idCliente, $idEmpleado);
    if ($stmt->execute()) {
        $idVenta = $stmt->insert_id;
        // 3. Insertar detalles y actualizar stock
        foreach ($detalleInsertados as $d) {
            $stmtDet = $conn->prepare("INSERT INTO detalle_venta (idVenta, idProducto, cantidad, precioUnitario, subtotal) VALUES (?, ?, ?, ?, ?)");
            $stmtDet->bind_param("iiidd", $idVenta, $d['idProducto'], $d['cantidad'], $d['precioUnitario'], $d['subtotal']);
            $stmtDet->execute();
            $stmtDet->close();
            // Descontar stock del producto
            $stmtProd = $conn->prepare("UPDATE producto SET cantidadStock = cantidadStock - ? WHERE idProducto = ?");
            $stmtProd->bind_param("ii", $d['cantidad'], $d['idProducto']);
            $stmtProd->execute();
            $stmtProd->close();
        }
        echo json_encode(["success" => true, "idVenta" => $idVenta]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
    exit();
}

// === ELIMINAR VENTA (Opcional) ===
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $idVenta = intval($data['idVenta'] ?? 0);
    if (!$idVenta) {
        http_response_code(400);
        echo json_encode(["error" => "ID de venta requerido."]);
        exit();
    }
    // Elimina detalles primero
    $stmtDet = $mysqli->prepare("DELETE FROM detalle_venta WHERE idVenta=?");
    $stmtDet->bind_param("i", $idVenta);
    $stmtDet->execute();
    $stmtDet->close();
    // Elimina la venta principal
    $stmtVenta = $mysqli->prepare("DELETE FROM venta WHERE idVenta=?");
    $stmtVenta->bind_param("i", $idVenta);
    $stmtVenta->execute();
    $stmtVenta->close();
    echo json_encode(["success" => true]);
    exit();
}

// OPTIONS - Respuesta vacía para preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Método no soportado
http_response_code(405);
echo json_encode(["error" => "Método no permitido."]);
exit();
?>
