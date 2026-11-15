<?php
// Servidor para probar la API en la compu (no se usa en el hosting). Desde la carpeta backend:
//   php -S 127.0.0.1:8000 servidor-local.php
// La web en React (npm run dev) le pasa los pedidos a /api y /uploads.

$ruta = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (str_starts_with($ruta, '/uploads/') && is_file(__DIR__ . urldecode($ruta))) return false; // la foto tal cual
if ($ruta === '/api' || str_starts_with($ruta, '/api/')) {
    require __DIR__ . '/api/index.php';
    return true;
}
http_response_code(404);
echo 'No existe';
