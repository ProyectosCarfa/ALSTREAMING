<?php

declare(strict_types=1);
const DB_HOST = "localhost";
const DB_PORT = "3306";
const DB_NAME = "alstreaming";
const DB_USER = "root";
const DB_PASSWORD = "";
function getConnection(): PDO {
    static $pdo = null;
    if($pdo instanceof PDO){
        return $pdo;
    } try {
        $dsn =
            "mysql:" .
            "host=" . DB_HOST .
            ";port=" . DB_PORT .
            ";dbname=" . DB_NAME .
            ";charset=utf8mb4";
        $pdo = new PDO(
            $dsn,
            DB_USER,
            DB_PASSWORD,
            [
                PDO::ATTR_ERRMODE =>
                    PDO::ERRMODE_EXCEPTION,

                PDO::ATTR_DEFAULT_FETCH_MODE =>
                    PDO::FETCH_ASSOC,

                PDO::ATTR_EMULATE_PREPARES =>
                    false
            ]
        );

        return $pdo;
    } catch(PDOException $e){
       http_response_code(500);
        echo json_encode([
           "success"=>false,
            "message"=>"Error conectando con la base de datos.",
            "error"=>$e->getMessage()
        ]);
        exit;
    }
}