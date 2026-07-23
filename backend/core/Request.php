<?php
declare(strict_types=1);
final class Request {
    public static function body(): array {
        $json = json_decode(file_get_contents('php://input'), true);
        return is_array($json) ? $json : [];
    }
    public static function method(): string { return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'); }
}
