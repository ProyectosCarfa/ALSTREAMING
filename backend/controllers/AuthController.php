<?php
declare(strict_types=1);
require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../services/SupabaseService.php';

final class AuthController {
    public static function login(): never {
        if (Request::method() !== 'POST') Response::json(['error' => 'Método no permitido'], 405);
        $input = Request::body(); $email = filter_var(trim((string)($input['email'] ?? '')), FILTER_VALIDATE_EMAIL); $password = (string)($input['password'] ?? '');
        if (!$email || strlen($password) < 8) Response::json(['error' => 'Credenciales inválidas.'], 422);
        [$status, $session] = SupabaseService::signIn($email, $password);
        if ($status !== 200 || empty($session['access_token']) || empty($session['user']['id'])) Response::json(['error' => 'Correo o contraseña incorrectos.'], 401);
        [, $profile] = SupabaseService::profile((string)$session['user']['id'], (string)$session['access_token']);
        $role = $profile['role'] ?? 'customer';
        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
        setcookie(APP_COOKIE_PREFIX . 'access', $session['access_token'], ['expires' => time() + (int)($session['expires_in'] ?? 3600), 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax']);
        setcookie(APP_COOKIE_PREFIX . 'refresh', $session['refresh_token'] ?? '', ['expires' => time() + 2592000, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax']);
        Response::json(['ok' => true, 'role' => $role, 'redirect' => $role === 'admin' ? '/frontend/pages/admin.html' : '/frontend/pages/perfil.html']);
    }
    public static function logout(): never {
        foreach (['access', 'refresh'] as $name) setcookie(APP_COOKIE_PREFIX . $name, '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
        Response::json(['ok' => true]);
    }
}
