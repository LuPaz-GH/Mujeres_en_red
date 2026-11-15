<?php
// Configuración del hosting. Copiar este archivo como config.php (en la misma carpeta) y completar.
// config.php NO se sube a GitHub: tiene la contraseña de la base de datos.
// En la compu no hace falta: sin config.php se usa una base SQLite en backend/datos/.

return [
    // Base MySQL de Ferozo (panel → Bases de datos → MySQL)
    'db' => 'mysql:host=localhost;dbname=NOMBRE_DE_LA_BASE;charset=utf8mb4',
    'db_usuario' => 'USUARIO',
    'db_clave' => 'CONTRASEÑA',

    // A dónde llegan los mensajes del formulario de contacto
    'mail_destino' => 'info@mujeresenred.com.ar',
    // Desde qué dirección salen (tiene que ser del dominio para que no caigan en spam)
    'mail_remitente' => 'web@mujeresenred.com.ar',

    // Clave que pide instalar.php la única vez que se instala la web (al menos 12 caracteres)
    'clave_instalacion' => '',
];
