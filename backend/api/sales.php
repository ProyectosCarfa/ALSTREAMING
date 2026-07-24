<?php

declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../db/db.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$pdo = getConnection();

try {
    $action = $_GET["action"] ?? "";

    switch ($action) {
        
        // ================================================
        // CREAR VENTA (CUANDO EL CLIENTE COMPRA)
        // ================================================
        case "create":
            $data = json_decode(file_get_contents("php://input"), true);
            echo json_encode(createSale($pdo, $data));
            break;

        // ================================================
        // OBTENER VENTAS DE UN USUARIO
        // ================================================
        case "getByUser":
            $userId = intval($_GET["user_id"] ?? 0);
            
            if ($userId <= 0) {
                echo json_encode([
                    "success" => false,
                    "message" => "ID de usuario no válido"
                ]);
                break;
            }
            
            echo json_encode(getSalesByUser($pdo, $userId));
            break;

        // ================================================
        // OBTENER TODAS LAS VENTAS (ADMIN)
        // ================================================
        case "getAll":
            echo json_encode(getAllSales($pdo));
            break;

        // ================================================
        // CONFIRMAR VENTA (ADMIN)
        // ================================================
        case "confirm":
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!isset($data["ticket"])) {
                echo json_encode([
                    "success" => false,
                    "message" => "Ticket no proporcionado"
                ]);
                break;
            }
            
            echo json_encode(confirmSale($pdo, $data["ticket"]));
            break;

        // ================================================
        // ACTUALIZAR VENTA (ADMIN LLENA DATOS)
        // ================================================
        case "update":
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!isset($data["ticket"])) {
                echo json_encode([
                    "success" => false,
                    "message" => "Ticket no proporcionado"
                ]);
                break;
            }
            
            echo json_encode(updateSale($pdo, $data));
            break;

        default:
            echo json_encode([
                "success" => false,
                "message" => "Acción no válida: " . $action
            ]);
            break;
    }
} catch (Throwable $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error del servidor: " . $e->getMessage()
    ]);
}

// ============================================================
// FUNCIÓN: CREAR VENTA
// ============================================================
function createSale(PDO $pdo, array $data): array
{
    try {
        if (empty($data["ticket"]) || empty($data["product_id"]) || empty($data["customer_id"])) {
            return [
                "success" => false,
                "message" => "Faltan datos requeridos (ticket, product_id, customer_id)"
            ];
        }

        // Verificar que el ticket no exista
        $checkSql = "SELECT id FROM sales WHERE ticket = :ticket";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([":ticket" => $data["ticket"]]);
        
        if ($checkStmt->fetch()) {
            return [
                "success" => false,
                "message" => "El ticket ya existe"
            ];
        }

        // 🔥 Obtener producto Y VERIFICAR STOCK
        $productSql = "SELECT id, name, normal_price, stock FROM products WHERE id = :product_id";
        $productStmt = $pdo->prepare($productSql);
        $productStmt->execute([":product_id" => $data["product_id"]]);
        $product = $productStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product) {
            return [
                "success" => false,
                "message" => "Producto no encontrado"
            ];
        }

        // 🔥 VERIFICAR QUE HAY STOCK DISPONIBLE
        if ($product["stock"] <= 0) {
            return [
                "success" => false,
                "message" => "Producto agotado. No hay stock disponible."
            ];
        }

        // Insertar venta
        $sql = "
            INSERT INTO sales (
                ticket,
                product_id,
                customer_id,
                email,
                password,
                profile,
                pin,
                customer_name,
                customer_whatsapp,
                start_date,
                end_date,
                status,
                notes
            ) VALUES (
                :ticket,
                :product_id,
                :customer_id,
                :email,
                :password,
                :profile,
                :pin,
                :customer_name,
                :customer_whatsapp,
                :start_date,
                :end_date,
                :status,
                :notes
            )
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":ticket" => $data["ticket"],
            ":product_id" => $data["product_id"],
            ":customer_id" => $data["customer_id"],
            ":email" => $data["email"] ?? null,
            ":password" => $data["password"] ?? null,
            ":profile" => $data["profile"] ?? null,
            ":pin" => $data["pin"] ?? null,
            ":customer_name" => $data["customer_name"] ?? null,
            ":customer_whatsapp" => $data["customer_whatsapp"] ?? null,
            ":start_date" => $data["start_date"] ?? date("Y-m-d"),
            ":end_date" => $data["end_date"] ?? null,
            ":status" => "available",
            ":notes" => $data["notes"] ?? "Compra de producto: " . $product["name"]
        ]);

        // 🔥 ACTUALIZAR CONTADOR DE VENTAS +1 Y REDUCIR STOCK -1
        $updateSql = "UPDATE products SET sales = sales + 1, stock = stock - 1 WHERE id = :product_id AND stock > 0";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([":product_id" => $data["product_id"]]);

        // Calcular stock restante
        $stockRestante = $product["stock"] - 1;

        return [
            "success" => true,
            "message" => "Venta registrada correctamente",
            "ticket" => $data["ticket"],
            "product_name" => $product["name"],
            "price" => $product["normal_price"],
            "stock_anterior" => $product["stock"],
            "stock_restante" => $stockRestante
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ];
    }
}

// ============================================================
// FUNCIÓN: OBTENER VENTAS POR USUARIO
// ============================================================
function getSalesByUser(PDO $pdo, int $userId): array
{
    try {
        $sql = "
            SELECT 
                s.*,
                p.name AS product_name,
                p.image AS product_image,
                p.normal_price AS product_price
            FROM sales s
            INNER JOIN products p ON p.id = s.product_id
            WHERE s.customer_id = :user_id
            ORDER BY s.created_at DESC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([":user_id" => $userId]);

        return [
            "success" => true,
            "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ];
    }
}

// ============================================================
// FUNCIÓN: OBTENER TODAS LAS VENTAS (ADMIN)
// ============================================================
function getAllSales(PDO $pdo): array
{
    try {
        $sql = "
            SELECT 
                s.*,
                p.name AS product_name,
                p.image AS product_image,
                p.normal_price AS product_price,
                u.username AS customer_username,
                u.email AS customer_email
            FROM sales s
            INNER JOIN products p ON p.id = s.product_id
            INNER JOIN users u ON u.id = s.customer_id
            ORDER BY s.created_at DESC
        ";

        $stmt = $pdo->query($sql);

        return [
            "success" => true,
            "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ];
    }
}

// ============================================================
// FUNCIÓN: CONFIRMAR VENTA (ADMIN)
// ============================================================
function confirmSale(PDO $pdo, string $ticket): array
{
    try {
        $checkSql = "SELECT id, status FROM sales WHERE ticket = :ticket";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([":ticket" => $ticket]);
        $sale = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$sale) {
            return [
                "success" => false,
                "message" => "Venta no encontrada"
            ];
        }

        $sql = "UPDATE sales SET status = 'support', notes = CONCAT(notes, '\nConfirmado por admin el: ', NOW()) WHERE ticket = :ticket";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([":ticket" => $ticket]);

        return [
            "success" => true,
            "message" => "Venta confirmada correctamente"
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ];
    }
}

// ============================================================
// FUNCIÓN: ACTUALIZAR VENTA (ADMIN LLENA DATOS)
// ============================================================
function updateSale(PDO $pdo, array $data): array
{
    try {
        // Verificar que el ticket existe
        $checkSql = "SELECT id FROM sales WHERE ticket = :ticket";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([":ticket" => $data["ticket"]]);
        
        if (!$checkStmt->fetch()) {
            return [
                "success" => false,
                "message" => "Venta no encontrada"
            ];
        }

        $sql = "
            UPDATE sales SET
                email = :email,
                password = :password,
                pin = :pin,
                profile = :profile,
                start_date = :start_date,
                end_date = :end_date,
                customer_name = :customer_name,
                customer_whatsapp = :customer_whatsapp,
                status = :status,
                notes = :notes
            WHERE ticket = :ticket
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":email" => $data["email"] ?? null,
            ":password" => $data["password"] ?? null,
            ":pin" => $data["pin"] ?? null,
            ":profile" => $data["profile"] ?? null,
            ":start_date" => $data["start_date"] ?? null,
            ":end_date" => $data["end_date"] ?? null,
            ":customer_name" => $data["customer_name"] ?? null,
            ":customer_whatsapp" => $data["customer_whatsapp"] ?? null,
            ":status" => $data["status"] ?? "available",
            ":notes" => $data["notes"] ?? null,
            ":ticket" => $data["ticket"]
        ]);
        
        return [
            "success" => true,
            "message" => "Venta actualizada correctamente"
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ];
    }
}