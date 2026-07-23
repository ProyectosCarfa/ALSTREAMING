<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__.'/../db/db.php';

session_start();



function response(array $data, int $code = 200): void
{
    http_response_code($code);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}




if($_SERVER['REQUEST_METHOD'] !== 'POST')
{
    response([
        "success"=>false,
        "message"=>"Método no permitido."
    ],405);
}




$data=json_decode(
    file_get_contents("php://input"),
    true
);



$identifier = trim($data['identifier'] ?? '');

$password = trim($data['password'] ?? '');





if($identifier==='' || $password==='')
{
    response([
        "success"=>false,
        "message"=>"Complete todos los campos."
    ],422);
}




try{


    $pdo = getConnection();



    /*
    BUSCAR USUARIO
    */


    $sql="
    SELECT

        id,
        username,
        email,
        phone,
        password,
        role,
        status

    FROM users

    WHERE

        username = ?

        OR email = ?

        OR phone = ?

    LIMIT 1
    ";



    $stmt=$pdo->prepare($sql);



    $stmt->execute([

        $identifier,
        $identifier,
        $identifier

    ]);



    $user=$stmt->fetch(PDO::FETCH_ASSOC);





    if(!$user)
    {
        response([

            "success"=>false,

            "message"=>"Usuario no encontrado."

        ],401);
    }






    /*
    ESTADO
    */


    if(
        isset($user['status']) &&
        $user['status'] !== "active"
    )
    {

        response([

            "success"=>false,

            "message"=>"Cuenta suspendida."

        ],403);

    }





    /*
    PASSWORD
    */


    if(!password_verify(
        $password,
        $user['password']
    ))
    {

        response([

            "success"=>false,

            "message"=>"Contraseña incorrecta."

        ],401);

    }







    /*
    CREAR SESION
    */


    $_SESSION['user']=[

        "id"=>$user['id'],

        "username"=>$user['username'],

        "email"=>$user['email'],

        "phone"=>$user['phone'],

        "role"=>$user['role']

    ];







    response([

        "success"=>true,

        "message"=>"Bienvenido.",


        "user"=>[

            "id"=>$user['id'],

            "username"=>$user['username'],

            "email"=>$user['email'],

            "phone"=>$user['phone'],

            "role"=>$user['role']

        ]

    ]);





}
catch(PDOException $e)
{

    response([

        "success"=>false,

        "message"=>"Error SQL",

        "error"=>$e->getMessage()

    ],500);

}
catch(Throwable $e)
{

    response([

        "success"=>false,

        "message"=>"Error interno",

        "error"=>$e->getMessage()

    ],500);

}