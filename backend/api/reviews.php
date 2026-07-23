<?php

declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../db/db.php";

$pdo = getConnection();

try {
    $action = $_GET["action"] ?? "getAll";

    switch ($action) {
        case "getAll":
            $sql = "
                SELECT 
                    pr.*,
                    u.username,
                    p.name AS product_name
                FROM product_reviews pr
                INNER JOIN users u ON u.id = pr.user_id
                INNER JOIN products p ON p.id = pr.product_id
                ORDER BY pr.created_at DESC
                LIMIT 20
            ";
            
            $stmt = $pdo->query($sql);
            
            echo json_encode([
                "success" => true,
                "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ]);
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
        "message" => "Error: " . $e->getMessage()
    ]);
}