<?php

declare(strict_types=1);


require_once __DIR__ . "/../db/db.php";



/*=========================================================
=            CREAR CARPETA DE IMAGENES                    =
=========================================================*/

function createCategoryImageFolder(): string
{

    $folder = __DIR__ . "/../../uploads/categories/";


    if(!is_dir($folder))
    {

        mkdir(
            $folder,
            0777,
            true
        );

    }


    return $folder;

}






/*=========================================================
=            SUBIR IMAGEN CATEGORIA                       =
=========================================================*/

function uploadCategoryImage(array $file): array
{


    if(!isset($file["tmp_name"]))
    {

        return [

            "success"=>false,

            "message"=>"No se recibió ninguna imagen."

        ];

    }





    if($file["error"] !== UPLOAD_ERR_OK)
    {

        return [

            "success"=>false,

            "message"=>"Error al subir la imagen."

        ];

    }





    $allowed = [

        "jpg",
        "jpeg",
        "png",
        "webp"

    ];





    $extension = strtolower(

        pathinfo(

            $file["name"],

            PATHINFO_EXTENSION

        )

    );





    if(!in_array($extension,$allowed))
    {

        return [

            "success"=>false,

            "message"=>"Solo se permiten imágenes JPG, PNG o WEBP."

        ];

    }






    /*
    CREAR CARPETA
    */

    $folder =
    createCategoryImageFolder();






    /*
    NOMBRE UNICO
    */

    $filename =

    uniqid(
        "category_",
        true
    )
    .
    "."
    .
    $extension;






    $destination =
    $folder.$filename;







    if(
        !move_uploaded_file(
            $file["tmp_name"],
            $destination
        )
    )
    {

        return [

            "success"=>false,

            "message"=>"No se pudo guardar la imagen."

        ];

    }







    return [

        "success"=>true,

        "message"=>"Imagen subida correctamente.",

        "url"=>"/Alex/uploads/categories/".$filename

    ];


}









/*=========================================================
=            AGREGAR CATEGORIA                            =
=========================================================*/

function addCategory(PDO $pdo,array $data):array
{


    $name =
    trim($data["name"] ?? "");


    $description =
    $data["description"] ?? null;


    $image =
    $data["image"] ?? null;





    if(empty($name))
    {

        return [

            "success"=>false,

            "message"=>"El nombre de la categoría es obligatorio."

        ];

    }






    $check=$pdo->prepare(

        "SELECT id FROM categories WHERE name=?"

    );


    $check->execute([$name]);





    if($check->fetch())
    {

        return [

            "success"=>false,

            "message"=>"La categoría ya existe."

        ];

    }






    $stmt=$pdo->prepare(

        "
        INSERT INTO categories
        (
            image,
            name,
            description
        )

        VALUES
        (
            ?,
            ?,
            ?
        )

        "

    );





    $stmt->execute([

        $image,

        $name,

        $description

    ]);






    return [

        "success"=>true,

        "message"=>"Categoría creada correctamente.",

        "id"=>$pdo->lastInsertId()

    ];


}









/*=========================================================
=            OBTENER TODAS LAS CATEGORIAS                 =
=========================================================*/

function getAllCategories(PDO $pdo):array
{


    $stmt=$pdo->query(

        "
        SELECT

        c.*,

        COUNT(p.id) AS total_products


        FROM categories c


        LEFT JOIN products p

        ON p.category_id=c.id


        GROUP BY c.id


        ORDER BY c.id DESC

        "

    );



    return $stmt->fetchAll(PDO::FETCH_ASSOC);


}









/*=========================================================
=            OBTENER UNA CATEGORIA                        =
=========================================================*/

function getCategory(PDO $pdo,int $id):?array
{


    $stmt=$pdo->prepare(

        "
        SELECT *

        FROM categories

        WHERE id=?

        "

    );


    $stmt->execute([$id]);



    $data=$stmt->fetch(PDO::FETCH_ASSOC);



    return $data ?: null;


}









/*=========================================================
=            EDITAR CATEGORIA                             =
=========================================================*/

function updateCategory(PDO $pdo,int $id,array $data):array
{


    $name =
    trim($data["name"] ?? "");


    $description =
    $data["description"] ?? null;


    $image =
    $data["image"] ?? null;





    if(empty($name))
    {

        return [

            "success"=>false,

            "message"=>"El nombre es obligatorio."

        ];

    }






    $check=$pdo->prepare(

        "
        SELECT id

        FROM categories

        WHERE name=?

        AND id!=?

        "

    );



    $check->execute([

        $name,

        $id

    ]);






    if($check->fetch())
    {

        return [

            "success"=>false,

            "message"=>"La categoría ya existe."

        ];

    }








    if(empty($image))
    {


        $old=$pdo->prepare(

            "
            SELECT image

            FROM categories

            WHERE id=?

            "

        );



        $old->execute([$id]);



        $image=$old->fetchColumn();


    }









    $stmt=$pdo->prepare(

        "
        UPDATE categories SET

        image=?,

        name=?,

        description=?


        WHERE id=?

        "

    );





    $stmt->execute([

        $image,

        $name,

        $description,

        $id

    ]);







    return [

        "success"=>true,

        "message"=>"Categoría actualizada correctamente."

    ];

}









/*=========================================================
=            ELIMINAR CATEGORIA                           =
=========================================================*/

function deleteCategory(PDO $pdo,int $id):array
{


    $check=$pdo->prepare(

        "
        SELECT COUNT(*)

        FROM products

        WHERE category_id=?

        "

    );


    $check->execute([$id]);




    if(
        (int)$check->fetchColumn()>0
    )
    {

        return [

            "success"=>false,

            "message"=>"No puedes eliminar una categoría con productos."

        ];

    }







    $img=$pdo->prepare(

        "
        SELECT image

        FROM categories

        WHERE id=?

        "

    );


    $img->execute([$id]);


    $image=$img->fetchColumn();






    $stmt=$pdo->prepare(

        "
        DELETE FROM categories

        WHERE id=?

        "

    );


    $stmt->execute([$id]);








    if(
        $image &&
        str_contains(
            $image,
            "/uploads/categories/"
        )
    )
    {


        $file =
        $_SERVER["DOCUMENT_ROOT"]
        .$image;



        if(file_exists($file))
        {

            unlink($file);

        }

    }







    return [

        "success"=>true,

        "message"=>"Categoría eliminada correctamente."

    ];


}









/*=========================================================
=            BUSCAR CATEGORIAS                            =
=========================================================*/

function searchCategories(PDO $pdo,string $search):array
{


    $search="%".$search."%";



    $stmt=$pdo->prepare(

        "
        SELECT *

        FROM categories

        WHERE name LIKE ?

        OR description LIKE ?

        ORDER BY name ASC

        "

    );



    $stmt->execute([

        $search,

        $search

    ]);



    return $stmt->fetchAll(PDO::FETCH_ASSOC);


}









/*=========================================================
=            CONTAR PRODUCTOS                             =
=========================================================*/

function countProductsByCategory(PDO $pdo,int $categoryId):int
{


    $stmt=$pdo->prepare(

        "
        SELECT COUNT(*)

        FROM products

        WHERE category_id=?

        "

    );


    $stmt->execute([$categoryId]);



    return (int)$stmt->fetchColumn();


}