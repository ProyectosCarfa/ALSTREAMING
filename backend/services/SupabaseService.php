<?php

declare(strict_types=1);

require_once __DIR__ . '/../db/db.php';


final class SupabaseService
{


    private static function request(
        string $method,
        string $path,
        ?array $body = null,
        ?string $token = null
    ): array {


        $curl = curl_init(
            SUPABASE_URL . $path
        );


        $headers = [

            'apikey: ' . SUPABASE_PUBLISHABLE_KEY,

            'Content-Type: application/json',

            'Accept: application/json'

        ];



        if($token !== null && $token !== '')
        {

            $headers[] =
                'Authorization: Bearer ' . $token;

        }



        curl_setopt_array(

            $curl,

            [

                CURLOPT_CUSTOMREQUEST => $method,

                CURLOPT_HTTPHEADER => $headers,

                CURLOPT_RETURNTRANSFER => true,

                CURLOPT_TIMEOUT => 20,

                CURLOPT_SSL_VERIFYPEER => true

            ]

        );



        if($body !== null)
        {

            curl_setopt(

                $curl,

                CURLOPT_POSTFIELDS,

                json_encode(

                    $body,

                    JSON_UNESCAPED_UNICODE

                )

            );

        }



        $raw = curl_exec($curl);



        if($raw === false)
        {

            throw new RuntimeException(
                curl_error($curl)
            );

        }



        $status =
        (int)
        curl_getinfo(

            $curl,

            CURLINFO_HTTP_CODE

        );



        curl_close($curl);



        $data =
        json_decode(

            $raw,

            true

        );



        return [

            $status,

            is_array($data)
            ? $data
            : []

        ];

    }








    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */


    public static function signIn(

        string $email,

        string $password

    ): array {


        return self::request(

            'POST',

            '/auth/v1/token?grant_type=password',

            [

                'email'=>$email,

                'password'=>$password

            ]

        );

    }










    /*
    |--------------------------------------------------------------------------
    | REGISTRO
    |--------------------------------------------------------------------------
    */


    public static function signUp(

        string $email,

        string $password,

        string $fullName

    ): array {


        return self::request(

            'POST',

            '/auth/v1/signup',

            [

                'email'=>$email,

                'password'=>$password,


                'data'=>[

                    'full_name'=>$fullName

                ],


                'options'=>[

                    'email_redirect_to'=>

                    'http://localhost/Alex/frontend/pages/login.html'

                ]

            ]

        );

    }










    /*
    |--------------------------------------------------------------------------
    | PERFIL
    |--------------------------------------------------------------------------
    */


    public static function profile(

        string $userId,

        string $token

    ): array {


        return self::request(

            'GET',

            '/rest/v1/profiles?id=eq.'
            .
            rawurlencode($userId)
            .
            '&select=id,full_name,role',

            null,

            $token

        );

    }










    /*
    |--------------------------------------------------------------------------
    | USUARIO ACTUAL
    |--------------------------------------------------------------------------
    */


    public static function user(

        string $token

    ): array {


        return self::request(

            'GET',

            '/auth/v1/user',

            null,

            $token

        );

    }










    /*
    |--------------------------------------------------------------------------
    | CERRAR SESION
    |--------------------------------------------------------------------------
    */


    public static function signOut(

        string $token

    ): array {


        return self::request(

            'POST',

            '/auth/v1/logout',

            [],

            $token

        );

    }










    /*
    |--------------------------------------------------------------------------
    | REFRESH TOKEN
    |--------------------------------------------------------------------------
    */


    public static function refresh(

        string $refreshToken

    ): array {


        return self::request(

            'POST',

            '/auth/v1/token?grant_type=refresh_token',

            [

                'refresh_token'=>$refreshToken

            ]

        );

    }










    /*
    |--------------------------------------------------------------------------
    | ACTUALIZAR PERFIL
    |--------------------------------------------------------------------------
    */


    public static function updateProfile(

        string $userId,

        string $token,

        array $data

    ): array {


        return self::request(

            'PATCH',

            '/rest/v1/profiles?id=eq.'
            .
            rawurlencode($userId),

            $data,

            $token

        );

    }










    /*
    |--------------------------------------------------------------------------
    | REQUEST ADMIN SUPABASE
    |--------------------------------------------------------------------------
    |
    | Usa SERVICE ROLE KEY
    | Solo backend
    |
    */


    private static function adminRequest(

        string $method,

        string $path

    ): array {


        $curl = curl_init(

            SUPABASE_URL . $path

        );



        $headers = [

            'apikey: ' . SUPABASE_SERVICE_ROLE_KEY,

            'Authorization: Bearer ' . SUPABASE_SERVICE_ROLE_KEY,

            'Content-Type: application/json',

            'Accept: application/json'

        ];



        curl_setopt_array(

            $curl,

            [

                CURLOPT_CUSTOMREQUEST=>$method,

                CURLOPT_HTTPHEADER=>$headers,

                CURLOPT_RETURNTRANSFER=>true,

                CURLOPT_TIMEOUT=>20,

                CURLOPT_SSL_VERIFYPEER=>true

            ]

        );



        $raw=curl_exec($curl);



        if($raw===false)
        {

            throw new RuntimeException(
                curl_error($curl)
            );

        }



        $status=(int)
        curl_getinfo(

            $curl,

            CURLINFO_HTTP_CODE

        );



        curl_close($curl);



        $data=json_decode(

            $raw,

            true

        );



        return [

            $status,

            is_array($data)
            ?
            $data
            :
            []

        ];

    }










    /*
    |--------------------------------------------------------------------------
    | VERIFICAR EMAIL EXISTENTE
    |--------------------------------------------------------------------------
    */


    public static function checkEmailExists(

        string $email

    ): bool {


        [

            $status,

            $data

        ] = self::adminRequest(

            'GET',

            '/auth/v1/admin/users?per_page=1000'

        );



        if($status !== 200)
        {

            return false;

        }




        foreach(

            $data['users'] ?? []

            as $user

        )
        {


            if(

                strtolower(
                    $user['email'] ?? ''
                )

                ===

                strtolower($email)

            )
            {

                return true;

            }


        }




        return false;

    }


}