<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    |
    | Set via CORS_ALLOWED_ORIGINS in .env for production, e.g.:
    | CORS_ALLOWED_ORIGINS=https://dashboard.yourdomain.com
    |
    | Multiple origins separated by comma:
    | CORS_ALLOWED_ORIGINS=https://dashboard.yourdomain.com,https://app.yourdomain.com
    |
    */
    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
