<?php

declare(strict_types=1);

require_once __DIR__ . "/db/db.php";


try
{

    $db = getConnection();


    echo "MYSQL INFINITYFREE CONECTADO CORRECTAMENTE";


}
catch(Throwable $e)
{

    echo "ERROR: " . $e->getMessage();

}