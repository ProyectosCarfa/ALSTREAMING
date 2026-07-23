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
        // OBTENER DATOS DEL PERFIL
        // ================================================
        case "get":
            $id = intval($_GET["id"] ?? 0);
            
            if ($id <= 0) {
                echo json_encode([
                    "success" => false,
                    "message" => "ID de usuario no válido"
                ]);
                break;
            }
            
            echo json_encode(getPerfil($pdo, $id));
            break;

        // ================================================
        // SUBIR AVATAR
        // ================================================
        case "upload":
            if (!isset($_FILES["avatar"])) {
                echo json_encode([
                    "success" => false,
                    "message" => "No se recibió ninguna imagen"
                ]);
                break;
            }

            $carpeta = __DIR__ . "/../../uploads/avatars/";

            if (!is_dir($carpeta)) {
                mkdir($carpeta, 0777, true);
            }

            $permitidos = ["image/jpeg", "image/png", "image/webp"];

            if (!in_array($_FILES["avatar"]["type"], $permitidos)) {
                echo json_encode([
                    "success" => false,
                    "message" => "Formato de imagen no permitido. Usa JPG, PNG o WEBP"
                ]);
                break;
            }

            // Limitar tamaño (2MB)
            if ($_FILES["avatar"]["size"] > 2 * 1024 * 1024) {
                echo json_encode([
                    "success" => false,
                    "message" => "La imagen no debe superar los 2MB"
                ]);
                break;
            }

            $extension = pathinfo($_FILES["avatar"]["name"], PATHINFO_EXTENSION);
            $nombreArchivo = "avatar_" . time() . "_" . uniqid() . "." . $extension;
            $rutaDestino = $carpeta . $nombreArchivo;

            if (move_uploaded_file($_FILES["avatar"]["tmp_name"], $rutaDestino)) {
                echo json_encode([
                    "success" => true,
                    "message" => "Avatar subido correctamente",
                    "url" => "uploads/avatars/" . $nombreArchivo
                ]);
            } else {
                echo json_encode([
                    "success" => false,
                    "message" => "No se pudo guardar la imagen"
                ]);
            }
            break;

        // ================================================
        // ACTUALIZAR PERFIL
        // ================================================
        case "update":
            $data = json_decode(file_get_contents("php://input"), true);

            if (!isset($data["id"]) || intval($data["id"]) <= 0) {
                echo json_encode([
                    "success" => false,
                    "message" => "ID de usuario no válido"
                ]);
                break;
            }

            echo json_encode(updatePerfil($pdo, intval($data["id"]), $data));
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

// ============================================================
// FUNCIÓN: OBTENER PERFIL
// ============================================================
function getPerfil(PDO $pdo, int $id): array
{
    try {
        $sql = "
            SELECT 
                id,
                username,
                email,
                phone,
                avatar,
                role,
                created_at,
                (
                    SELECT COUNT(*) 
                    FROM purchases 
                    WHERE user_id = users.id
                ) AS total_compras
            FROM users
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([":id" => $id]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // No devolver la contraseña
            unset($user["password"]);
            
            return [
                "success" => true,
                "data" => $user
            ];
        } else {
            return [
                "success" => false,
                "message" => "Usuario no encontrado"
            ];
        }
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ];
    }
}

// ============================================================
// FUNCIÓN: ACTUALIZAR PERFIL
// ============================================================
function updatePerfil(PDO $pdo, int $id, array $data): array
{
    try {
        // Verificar si el email ya existe (excepto para este usuario)
        if (isset($data["email"])) {
            $checkSql = "SELECT id FROM users WHERE email = :email AND id != :id";
            $checkStmt = $pdo->prepare($checkSql);
            $checkStmt->execute([
                ":email" => $data["email"],
                ":id" => $id
            ]);
            
            if ($checkStmt->fetch()) {
                return [
                    "success" => false,
                    "message" => "El correo electrónico ya está en uso"
                ];
            }
        }

        // Construir query dinámica
        $fields = [];
        $params = [":id" => $id];

        if (isset($data["email"])) {
            $fields[] = "email = :email";
            $params[":email"] = $data["email"];
        }

        if (isset($data["phone"])) {
            $fields[] = "phone = :phone";
            $params[":phone"] = $data["phone"];
        }

        if (isset($data["avatar"]) && !empty($data["avatar"])) {
            $fields[] = "avatar = :avatar";
            $params[":avatar"] = $data["avatar"];
        }

        if (isset($data["password"]) && !empty($data["password"])) {
            $fields[] = "password = :password";
            $params[":password"] = password_hash($data["password"], PASSWORD_DEFAULT);
        }

        if (empty($fields)) {
            return [
                "success" => false,
                "message" => "No hay datos para actualizar"
            ];
        }

        $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Obtener datos actualizados
        $selectSql = "
            SELECT 
                id,
                username,
                email,
                phone,
                avatar,
                role
            FROM users 
            WHERE id = :id
        ";
        $selectStmt = $pdo->prepare($selectSql);
        $selectStmt->execute([":id" => $id]);
        $user = $selectStmt->fetch(PDO::FETCH_ASSOC);

        return [
            "success" => true,
            "message" => "Perfil actualizado correctamente",
            "data" => $user
        ];
    } catch (PDOException $e) {
        return [
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ];
    }
}