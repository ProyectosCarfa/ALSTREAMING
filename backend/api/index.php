<?php
declare(strict_types=1);
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? ''));
header('Vary: Origin');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') exit;
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../core/Response.php';
$route = trim((string)($_GET['route'] ?? ''), '/');
if ($route === 'auth/login') AuthController::login();
if ($route === 'auth/logout') AuthController::logout();
if ($route === 'auth/session') { $session = AuthMiddleware::user(); Response::json(['user' => $session['user'], 'profile' => $session['profile']]); }
Response::json(['error' => 'Ruta no encontrada.'], 404);
