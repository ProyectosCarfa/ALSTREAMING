<?php

declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=utf-8');


/*
|--------------------------------------------------------------------------
| Generar token CSRF
|--------------------------------------------------------------------------
*/


if(
    empty($_SESSION['csrf'])
)
{

    $_SESSION['csrf'] = bin2hex(
        random_bytes(32)
    );

}



echo json_encode([

    "success" => true,

    "token" => $_SESSION['csrf']

],
JSON_UNESCAPED_UNICODE
);