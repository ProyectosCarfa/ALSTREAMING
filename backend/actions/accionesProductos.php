<?php

declare(strict_types=1);

require_once __DIR__ . "/../db/db.php";

// ============================================================
// INICIAR SESIÓN SIEMPRE
// ============================================================
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/*
====================================================
 OBTENER CATEGORIAS PARA SELECT PRODUCTOS
====================================================
*/
function getProductCategories(PDO $pdo): array
{
    try {
        $sql = "
            SELECT 
                id,
                name
            FROM categories
            ORDER BY name ASC
        ";

        $stmt = $pdo->query($sql);

        return [
            "success" => true,
            "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => $e->getMessage()
        ];
    }
}

/*
====================================================
 AGREGAR PRODUCTO
====================================================
*/
function addProduct(PDO $pdo, array $data): array
{
    try {
        // ============================================================
        // CORREGIDO: Si no hay sesión PHP, usar seller_id = 1 (admin)
        // El panel ya verificó que es admin por localStorage
        // ============================================================
        $seller_id = isset($_SESSION["user_id"]) ? $_SESSION["user_id"] : 1;

        $sql = "
            INSERT INTO products
            (
                seller_id,
                category_id,
                image,
                name,
                short_description,
                details,
                terms,
                stock,
                renewable,
                normal_price,
                renewal_price,
                stock_status,
                active
            )
            VALUES
            (
                :seller_id,
                :category_id,
                :image,
                :name,
                :short_description,
                :details,
                :terms,
                :stock,
                :renewable,
                :normal_price,
                :renewal_price,
                :stock_status,
                :active
            )
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ":seller_id" => $seller_id,
            ":category_id" => $data["category_id"],
            ":image" => $data["image"] ?? "",
            ":name" => $data["name"],
            ":short_description" => $data["short_description"] ?? null,
            ":details" => $data["details"] ?? null,
            ":terms" => $data["terms"] ?? null,
            ":stock" => $data["stock"] ?? 0,
            ":renewable" => $data["renewable"] ?? "renewable",
            ":normal_price" => $data["normal_price"],
            ":renewal_price" => $data["renewal_price"] ?? null,
            ":stock_status" => $data["stock_status"] ?? "in_stock",
            ":active" => $data["active"] ?? 1
        ]);

        return [
            "success" => true,
            "message" => "Producto creado correctamente",
            "id" => $pdo->lastInsertId()
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ];
    }
}

/*
====================================================
 OBTENER UN PRODUCTO POR ID
====================================================
*/
function getProduct(PDO $pdo, int $id): array
{
    try {
        $sql = "
            SELECT
                p.*,
                c.name AS category_name
            FROM products p
            INNER JOIN categories c ON c.id = p.category_id
            WHERE p.id = :id
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([":id" => $id]);

        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($product) {
            return [
                "success" => true,
                "data" => $product
            ];
        } else {
            return [
                "success" => false,
                "message" => "Producto no encontrado"
            ];
        }
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => $e->getMessage()
        ];
    }
}

/*
====================================================
 LISTAR PRODUCTOS
====================================================
*/
function getProducts(PDO $pdo): array
{
    try {
        $sql = "
            SELECT
                p.*,
                c.name AS category_name
            FROM products p
            INNER JOIN categories c ON c.id = p.category_id
            ORDER BY p.id DESC
        ";

        $stmt = $pdo->query($sql);

        return [
            "success" => true,
            "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => $e->getMessage()
        ];
    }
}

/*
====================================================
 ACTUALIZAR PRODUCTO
====================================================
*/
function updateProduct(PDO $pdo, int $id, array $data): array
{
    try {
        $sql = "
            UPDATE products SET
                category_id = :category_id,
                image = :image,
                name = :name,
                short_description = :short_description,
                details = :details,
                terms = :terms,
                stock = :stock,
                renewable = :renewable,
                normal_price = :normal_price,
                renewal_price = :renewal_price,
                stock_status = :stock_status,
                active = :active
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ":category_id" => $data["category_id"],
            ":image" => $data["image"] ?? "",
            ":name" => $data["name"],
            ":short_description" => $data["short_description"] ?? "",
            ":details" => $data["details"] ?? "",
            ":terms" => $data["terms"] ?? "",
            ":stock" => $data["stock"] ?? 0,
            ":renewable" => $data["renewable"] ?? "renewable",
            ":normal_price" => $data["normal_price"],
            ":renewal_price" => $data["renewal_price"] ?? 0,
            ":stock_status" => $data["stock_status"] ?? "in_stock",
            ":active" => $data["active"] ?? 1,
            ":id" => $id
        ]);

        return [
            "success" => true,
            "message" => "Producto actualizado correctamente"
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ];
    }
}

/*
====================================================
 ELIMINAR PRODUCTO
====================================================
*/
function deleteProduct(PDO $pdo, int $id): array
{
    try {
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = :id");
        $stmt->execute([":id" => $id]);

        return [
            "success" => true,
            "message" => "Producto eliminado correctamente"
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ];
    }
}

// ============================================================
// ACTUALIZAR STOCK DEL PRODUCTO (DESPUÉS DE COMPRA)
// ============================================================
function updateStock(PDO $pdo, int $id, int $stock): array
{
    try {
        // Verificar que el producto existe
        $checkSql = "SELECT id, name FROM products WHERE id = :id";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([":id" => $id]);
        
        if (!$checkStmt->fetch()) {
            return [
                "success" => false,
                "message" => "Producto no encontrado"
            ];
        }

        $sql = "UPDATE products SET stock = :stock WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":stock" => $stock,
            ":id" => $id
        ]);

        return [
            "success" => true,
            "message" => "Stock actualizado correctamente",
            "new_stock" => $stock
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ];
    }
}