<?php

declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../../db/db.php";
require_once __DIR__ . "/../../actions/accionesproductos.php";

$pdo = getConnection();

try {
    $action = $_GET["action"] ?? "";

    switch ($action) {

        // ================================================
        // LISTAR PRODUCTOS
        // ================================================
        case "getAll":
            echo json_encode(getProducts($pdo));
            break;

        // ================================================
        // OBTENER UN PRODUCTO POR ID
        // ================================================
        case "get":
            $id = intval($_GET["id"] ?? 0);

            if ($id <= 0) {
                echo json_encode([
                    "success" => false,
                    "message" => "ID de producto no válido"
                ]);
                break;
            }

            echo json_encode(getProduct($pdo, $id));
            break;

        // ================================================
        // CATEGORIAS PARA SELECT
        // ================================================
        case "categories":
            echo json_encode(getProductCategories($pdo));
            break;

        // ================================================
        // SUBIR IMAGEN PRODUCTO
        // ================================================
        case "upload":
            if (!isset($_FILES["image"])) {
                echo json_encode([
                    "success" => false,
                    "message" => "No se recibió ninguna imagen"
                ]);
                exit;
            }

            $carpeta = __DIR__ . "/../../../uploads/products/";

            // Crear carpeta si no existe
            if (!is_dir($carpeta)) {
                mkdir($carpeta, 0777, true);
            }

            $permitidos = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (!in_array($_FILES["image"]["type"], $permitidos)) {
                echo json_encode([
                    "success" => false,
                    "message" => "Formato de imagen no permitido"
                ]);
                exit;
            }

            $nombreArchivo = time() . "_" . basename($_FILES["image"]["name"]);
            $rutaDestino = $carpeta . $nombreArchivo;

            if (move_uploaded_file($_FILES["image"]["tmp_name"], $rutaDestino)) {
                echo json_encode([
                    "success" => true,
                    "message" => "Imagen subida correctamente",
                    "url" => "uploads/products/" . $nombreArchivo
                ]);
            } else {
                echo json_encode([
                    "success" => false,
                    "message" => "No se pudo guardar la imagen"
                ]);
            }
            break;

        // ================================================
        // AGREGAR PRODUCTO
        // ================================================
        case "add":
            $data = json_decode(file_get_contents("php://input"), true);

            if (!$data) {
                echo json_encode([
                    "success" => false,
                    "message" => "Datos inválidos"
                ]);
                break;
            }

            echo json_encode(addProduct($pdo, $data));
            break;

        // ================================================
        // ELIMINAR PRODUCTO
        // ================================================
        case "delete":
            $data = json_decode(file_get_contents("php://input"), true);

            if (!isset($data["id"]) || intval($data["id"]) <= 0) {
                echo json_encode([
                    "success" => false,
                    "message" => "ID de producto no válido"
                ]);
                break;
            }

            echo json_encode(deleteProduct($pdo, intval($data["id"])));
            break;

        // ================================================
        // ACTUALIZAR PRODUCTO
        // ================================================
        case "update":
            $data = json_decode(file_get_contents("php://input"), true);

            if (!isset($data["id"]) || intval($data["id"]) <= 0) {
                echo json_encode([
                    "success" => false,
                    "message" => "ID de producto no válido"
                ]);
                break;
            }

            echo json_encode(updateProduct($pdo, intval($data["id"]), $data));
            break;

        default:
            echo json_encode([
                "success" => false,
                "message" => "Acción no válida"
            ]);
            break;
    }
} catch (Throwable $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error del servidor: " . $e->getMessage()
    ]);
}