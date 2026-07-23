<?php
declare(strict_types=1);
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../services/SupabaseService.php';
final class AuthMiddleware {
    public static function user(): array {
        $token = $_COOKIE[APP_COOKIE_PREFIX . 'access'] ?? '';
        if (!$token) Response::json(['error' => 'Sesión requerida.'], 401);
        [$status, $user] = SupabaseService::user($token);
        if ($status !== 200 || empty($user['id'])) Response::json(['error' => 'Sesión inválida.'], 401);
        [, $profile] = SupabaseService::profile((string)$user['id'], $token);
        return ['user' => $user, 'profile' => $profile ?? ['role' => 'customer'], 'token' => $token];
    }
    public static function admin(): array { $session = self::user(); if (($session['profile']['role'] ?? '') !== 'admin') Response::json(['error' => 'Acceso restringido.'], 403); return $session; }
}
