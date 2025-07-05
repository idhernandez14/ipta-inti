<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$mysqli = new mysqli("localhost", "root", "", "ipta_inti");
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $mysqli->connect_error]);
    exit();
}

// LISTAR HISTORIAL DE INVENTARIO
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $mysqli->query("
        SELECT i.idInventario, p.nombre AS producto, i.tipoMovimiento, i.cantidad, i.fechaMovimiento,
            (
                SELECT SUM(CASE WHEN tipoMovimiento='entrada' THEN cantidad ELSE -cantidad END)
                FROM inventario
                WHERE idProducto = i.idProducto AND idInventario <= i.idInventario
            ) AS stockActual
        FROM inventario i
        JOIN producto p ON i.idProducto = p.idProducto
        ORDER BY i.idInventario DESC
    ");
    $historial = [];
    while ($row = $result->fetch_assoc()) {
        $historial[] = [
            "idInventario"   => $row["idInventario"],
            "producto"       => $row["producto"],
            "tipoMovimiento" => $row["tipoMovimiento"],
            "cantidad"       => $row["cantidad"],
            "fechaMovimiento"=> $row["fechaMovimiento"],
            "stockActual"    => $row["stockActual"]
        ];
    }
    echo json_encode($historial);
    exit();
}

// REGISTRAR MOVIMIENTO (ENTRADA/SALIDA)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $producto = trim($data['producto'] ?? "");
    $tipoMovimiento = trim($data['tipoMovimiento'] ?? "");
    $cantidad = intval($data['cantidad'] ?? 0);

    // Validar producto existe
    $stmt = $mysqli->prepare("SELECT idProducto, cantidadStock FROM producto WHERE nombre = ?");
    $stmt->bind_param("s", $producto);
    $stmt->execute();
    $res = $stmt->get_result();
    if (!$row = $res->fetch_assoc()) {
        http_response_code(400);
        echo json_encode(["error" => "Producto no existe"]);
        exit();
    }
    $idProducto = $row['idProducto'];
    $stockActual = $row['cantidadStock'];

    if ($tipoMovimiento === "salida" && $cantidad > $stockActual) {
        http_response_code(400);
        echo json_encode(["error" => "Stock insuficiente"]);
        exit();
    }

    $fecha = date('Y-m-d');
    $stmt2 = $mysqli->prepare("
        INSERT INTO inventario (idProducto, fechaMovimiento, tipoMovimiento, cantidad, observacion)
        VALUES (?, ?, ?, ?, '')
    ");
    $stmt2->bind_param("isss", $idProducto, $fecha, $tipoMovimiento, $cantidad);
    if ($stmt2->execute()) {
        // Actualizar stock en producto
        $nuevoStock = $tipoMovimiento === "entrada"
            ? $stockActual + $cantidad
            : $stockActual - $cantidad;
        $stmt3 = $mysqli->prepare("UPDATE producto SET cantidadStock=? WHERE idProducto=?");
        $stmt3->bind_param("ii", $nuevoStock, $idProducto);
        $stmt3->execute();

        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt2->error]);
    }
    exit();
}

// ELIMINAR MOVIMIENTO
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $idInventario = intval($data['idInventario'] ?? 0);

    // Recuperar datos del movimiento para ajustar stock
    $stmt = $mysqli->prepare("SELECT idProducto, tipoMovimiento, cantidad FROM inventario WHERE idInventario=?");
    $stmt->bind_param("i", $idInventario);
    $stmt->execute();
    $res = $stmt->get_result();
    if (!$row = $res->fetch_assoc()) {
        http_response_code(400);
        echo json_encode(["error" => "Movimiento no existe"]);
        exit();
    }
    $idProducto = $row['idProducto'];
    $tipo = $row['tipoMovimiento'];
    $cantidad = $row['cantidad'];

    // Eliminar movimiento
    $stmtDel = $mysqli->prepare("DELETE FROM inventario WHERE idInventario=?");
    $stmtDel->bind_param("i", $idInventario);
    if ($stmtDel->execute()) {
        // Ajustar stock en producto
        if ($tipo === "entrada") {
            $mysqli->query("UPDATE producto SET cantidadStock = cantidadStock - $cantidad WHERE idProducto = $idProducto");
        } else {
            $mysqli->query("UPDATE producto SET cantidadStock = cantidadStock + $cantidad WHERE idProducto = $idProducto");
        }
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmtDel->error]);
    }
    exit();
}

// EDITAR MOVIMIENTO
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $idInventario = intval($data['idInventario'] ?? 0);
    $cantidadNueva = intval($data['cantidad'] ?? 0);
    $tipoNueva = trim($data['tipoMovimiento'] ?? "");

    // Recuperar datos anteriores
    $stmt = $mysqli->prepare("SELECT idProducto, tipoMovimiento, cantidad FROM inventario WHERE idInventario=?");
    $stmt->bind_param("i", $idInventario);
    $stmt->execute();
    $res = $stmt->get_result();
    if (!$row = $res->fetch_assoc()) {
        http_response_code(400);
        echo json_encode(["error" => "Movimiento no existe"]);
        exit();
    }
    $idProducto = $row['idProducto'];
    $tipoVieja = $row['tipoMovimiento'];
    $cantidadVieja = $row['cantidad'];

    // Calcular stock actual
    $resStock = $mysqli->query("SELECT cantidadStock FROM producto WHERE idProducto=$idProducto");
    $rowStock = $resStock->fetch_assoc();
    $stockActual = $rowStock['cantidadStock'];

    // Revertir efecto del movimiento anterior
    if ($tipoVieja === "entrada") {
        $stockActual -= $cantidadVieja;
    } else {
        $stockActual += $cantidadVieja;
    }

    // Validar no dejar stock negativo
    if ($tipoNueva === "salida" && $cantidadNueva > $stockActual) {
        http_response_code(400);
        echo json_encode(["error" => "Stock insuficiente para salida"]);
        exit();
    }

    // Aplicar efecto del nuevo movimiento
    $stockNuevo = ($tipoNueva === "entrada")
        ? $stockActual + $cantidadNueva
        : $stockActual - $cantidadNueva;

    // Actualizar inventario y producto
    $stmtUpd = $mysqli->prepare("UPDATE inventario SET tipoMovimiento=?, cantidad=? WHERE idInventario=?");
    $stmtUpd->bind_param("sii", $tipoNueva, $cantidadNueva, $idInventario);
    if ($stmtUpd->execute()) {
        $mysqli->query("UPDATE producto SET cantidadStock = $stockNuevo WHERE idProducto = $idProducto");
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmtUpd->error]);
    }
    exit();
}

// MÉTODO NO SOPORTADO
http_response_code(405);
echo json_encode(["error" => "Método no permitido."]);
exit();
?>
