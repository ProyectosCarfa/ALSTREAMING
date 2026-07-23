<?php

declare(strict_types=1);


header("Content-Type: application/json; charset=UTF-8");


require_once "../../actions/accionesCategorias.php";



$pdo = getConnection();


$action = $_GET["action"] ?? "";



try {


    switch($action)
    {


        /*=====================================================
        =            SUBIR IMAGEN CATEGORIA                   =
        =====================================================*/


        case "upload":



            if(!isset($_FILES["image"]))
            {


                echo json_encode([


                    "success"=>false,


                    "message"=>"No se recibió ninguna imagen."


                ]);


                exit;


            }





            echo json_encode(


                uploadCategoryImage(

                    $_FILES["image"]

                )


            );



        break;







        /*=====================================================
        =            OBTENER TODAS LAS CATEGORIAS             =
        =====================================================*/


        case "getAll":



            echo json_encode([


                "success"=>true,


                "data"=>getAllCategories($pdo)


            ]);



        break;








        /*=====================================================
        =            AGREGAR CATEGORIA                        =
        =====================================================*/


        case "add":



            $data = json_decode(

                file_get_contents("php://input"),

                true

            );





            if(!is_array($data))
            {


                echo json_encode([


                    "success"=>false,


                    "message"=>"Datos inválidos."


                ]);


                exit;


            }






            echo json_encode(


                addCategory(

                    $pdo,

                    $data

                )


            );



        break;









        /*=====================================================
        =            OBTENER UNA CATEGORIA                    =
        =====================================================*/


        case "get":



            $id = intval(

                $_GET["id"] ?? 0

            );





            echo json_encode([


                "success"=>true,


                "data"=>getCategory(

                    $pdo,

                    $id

                )


            ]);



        break;









        /*=====================================================
        =            ACTUALIZAR CATEGORIA                     =
        =====================================================*/


        case "update":



            $data = json_decode(

                file_get_contents("php://input"),

                true

            );






            if(!isset($data["id"]))
            {


                echo json_encode([


                    "success"=>false,


                    "message"=>"ID requerido."


                ]);


                exit;


            }






            echo json_encode(


                updateCategory(


                    $pdo,


                    intval($data["id"]),


                    $data


                )


            );



        break;









        /*=====================================================
        =            ELIMINAR CATEGORIA                       =
        =====================================================*/


        case "delete":



            $data = json_decode(

                file_get_contents("php://input"),

                true

            );







            if(!isset($data["id"]))
            {


                echo json_encode([


                    "success"=>false,


                    "message"=>"ID requerido."


                ]);


                exit;


            }








            echo json_encode(


                deleteCategory(


                    $pdo,


                    intval($data["id"])


                )


            );



        break;









        /*=====================================================
        =            BUSCAR CATEGORIAS                        =
        =====================================================*/


        case "search":



            $search =

            $_GET["q"] ?? "";






            echo json_encode([


                "success"=>true,


                "data"=>searchCategories(


                    $pdo,


                    $search


                )


            ]);



        break;









        /*=====================================================
        =            CONTAR PRODUCTOS                         =
        =====================================================*/


        case "count":



            $id = intval(

                $_GET["id"] ?? 0

            );






            echo json_encode([


                "success"=>true,


                "total"=>countProductsByCategory(


                    $pdo,


                    $id


                )


            ]);



        break;









        default:




            echo json_encode([



                "success"=>false,



                "message"=>"Acción no encontrada."



            ]);



        break;



    }





} catch(PDOException $e) {



    http_response_code(500);



    echo json_encode([


        "success"=>false,


        "message"=>"Error del servidor.",


        "error"=>$e->getMessage()


    ]);

}