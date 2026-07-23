<?php

declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../db/db.php";



function response(array $data, int $status = 200): void
{

    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE
    );

    exit;

}




/*
|--------------------------------------------------------------------------
| LEER JSON
|--------------------------------------------------------------------------
*/


$input = json_decode(
    file_get_contents("php://input"),
    true
);



if(!is_array($input))
{

    response([

        "success"=>false,

        "message"=>"Solicitud inválida."

    ],400);

}





/*
|--------------------------------------------------------------------------
| DATOS RECIBIDOS
|--------------------------------------------------------------------------
*/


$username = trim(
    $input["full_name"] ?? ""
);


$email = strtolower(
    trim($input["email"] ?? "")
);


$phone = trim(
    $input["phone"] ?? ""
);


$password =
$input["password"] ?? "";





/*
|--------------------------------------------------------------------------
| VALIDACIONES
|--------------------------------------------------------------------------
*/


if(
    $username === "" ||
    $email === "" ||
    $password === ""
)
{

    response([

        "success"=>false,

        "message"=>"Complete todos los campos obligatorios."

    ],422);

}




if(!filter_var($email,FILTER_VALIDATE_EMAIL))
{

    response([

        "success"=>false,

        "message"=>"Correo electrónico inválido."

    ],422);

}




if(strlen($password) < 8)
{

    response([

        "success"=>false,

        "message"=>"La contraseña debe tener mínimo 8 caracteres."

    ],422);

}





/*
|--------------------------------------------------------------------------
| CONEXIÓN MYSQL
|--------------------------------------------------------------------------
*/


try
{

    $pdo = getConnection();


}
catch(Throwable $e)
{

    response([

        "success"=>false,

        "message"=>"Error conectando con la base de datos."

    ],500);

}







/*
|--------------------------------------------------------------------------
| VERIFICAR EMAIL EXISTENTE
|--------------------------------------------------------------------------
*/


$stmt = $pdo->prepare(

    "SELECT id 
     FROM users 
     WHERE email = ?
     LIMIT 1"

);


$stmt->execute([

    $email

]);



if($stmt->fetch())
{

    response([

        "success"=>false,

        "message"=>"Este correo ya está registrado."

    ],422);

}







/*
|--------------------------------------------------------------------------
| ENCRIPTAR PASSWORD
|--------------------------------------------------------------------------
*/


$passwordHash = password_hash(

    $password,

    PASSWORD_DEFAULT

);








/*
|--------------------------------------------------------------------------
| CREAR USUARIO
|--------------------------------------------------------------------------
*/


try
{


    $stmt = $pdo->prepare(

        "INSERT INTO users
        (
            username,
            email,
            phone,
            password,
            role,
            status
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            'customer',
            'active'
        )"

    );



    $stmt->execute([


        $username,

        $email,

        $phone,

        $passwordHash


    ]);





    $userId = $pdo->lastInsertId();





}
catch(PDOException $e)
{


    response([

        "success"=>false,

        "message"=>"No se pudo crear la cuenta.",

        "error"=>$e->getMessage()

    ],500);


}








/*
|--------------------------------------------------------------------------
| RESPUESTA
|--------------------------------------------------------------------------
*/


response([


    "success"=>true,


    "message"=>"Cuenta creada correctamente.",


    "user"=>[


        "id"=>$userId,

        "username"=>$username,

        "email"=>$email,

        "phone"=>$phone,

        "role"=>"customer"


    ]


]);