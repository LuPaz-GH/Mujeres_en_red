<?php
// Crea una cuenta para entrar al panel, o le pone una contraseña nueva si ya existe.
//
//   php crear-usuaria.php correo@ejemplo.com "Nombre Apellido"
//
// La cuenta queda como administradora. Las de las voluntarias se crean desde el panel, en Cuentas.
// Inventa una contraseña y la muestra una sola vez; después se puede cambiar desde el panel.

require dirname(__DIR__) . '/api/lib/base.php';
require dirname(__DIR__) . '/api/lib/esquema.php';

[, $email, $nombre] = $argv + [null, null, null];
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !$nombre) {
    exit("Uso: php crear-usuaria.php correo@ejemplo.com \"Nombre Apellido\"\n");
}

crearTablas();
$clave = substr(str_replace(['+', '/', '='], '', base64_encode(random_bytes(12))), 0, 12);
$hash = password_hash($clave, PASSWORD_DEFAULT);

if (q('SELECT id FROM usuarias WHERE email = ?', [$email])->fetch()) {
    q('UPDATE usuarias SET nombre = ?, clave = ?, rol = ?, borrada = NULL, borrada_por = NULL, borrada_por_id = NULL WHERE email = ?', [$nombre, $hash, 'admin', $email]);
    echo "Contraseña nueva para $email\n";
} else {
    q('INSERT INTO usuarias (email, nombre, clave, rol, creada) VALUES (?, ?, ?, ?, ?)', [$email, $nombre, $hash, 'admin', ahora()]);
    echo "Cuenta creada para $nombre ($email)\n";
}
echo "Contraseña: $clave\n";
