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
        
        case "getAll":
            echo json_encode(getAllClients($pdo));
            break;

        case "get":
            $id = intval($_GET["id"] ?? 0);
            if ($id <= 0) {
                echo json_encode(["success" => false, "message" => "ID no válido"]);
                break;
            }
            echo json_encode(getClient($pdo, $id));
            break;

        case "update":
            $data = json_decode(file_get_contents("php://input"), true);
            if (!isset($data["id"])) {
                echo json_encode(["success" => false, "message" => "ID no proporcionado"]);
                break;
            }
            echo json_encode(updateClient($pdo, $data));
            break;

        default:
            echo json_encode(["success" => false, "message" => "Acción no válida"]);
            break;
    }
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

// ============================================================
// FUNCIONES
// ============================================================
function getAllClients(PDO $pdo): array
{
    try {
        $sql = "
            SELECT 
                u.*,
                (SELECT COUNT(*) FROM sales WHERE customer_id = u.id) AS total_compras,
                (SELECT COUNT(*) FROM support_tickets WHERE user_id = u.id) AS total_tickets
            FROM users u
            ORDER BY u.id DESC
        ";
        $stmt = $pdo->query($sql);
        return ["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)];
    } catch (PDOException $e) {
        return ["success" => false, "message" => $e->getMessage()];
    }
}

function getClient(PDO $pdo, int $id): array
{
    try {
        $sql = "SELECT * FROM users WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([":id" => $id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            unset($user["password"]);
            return ["success" => true, "data" => $user];
        }
        return ["success" => false, "message" => "Cliente no encontrado"];
    } catch (PDOException $e) {
        return ["success" => false, "message" => $e->getMessage()];
    }
}

function updateClient(PDO $pdo, array $data): array
{
    try {
        $fields = [];
        $params = [":id" => $data["id"]];

        $allowedFields = [
            "full_name", "email", "phone", "address", "role",
            "email_verified", "phone_verified", "status", "notes"
        ];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (isset($data["password"]) && !empty($data["password"])) {
            $fields[] = "password = :password";
            $params[":password"] = password_hash($data["password"], PASSWORD_DEFAULT);
        }

        if (empty($fields)) {
            return ["success" => false, "message" => "No hay datos para actualizar"];
        }

        $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return ["success" => true, "message" => "Cliente actualizado correctamente"];
    } catch (PDOException $e) {
        return ["success" => false, "message" => $e->getMessage()];
    }
}