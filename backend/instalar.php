<?php
// Instalación de la web en el hosting, desde el navegador (Ferozo no tiene consola).
// Se usa UNA sola vez: crea las tablas, carga el contenido que vino de WordPress y crea la cuenta
// de la administradora. Pide la "clave de instalación" que está en api/config.php.
// Si ya hay alguna cuenta creada, no hace nada. Después de usarlo, borrar este archivo del hosting.
//
// Este comienzo está escrito para que funcione en PHP viejo: así puede avisar si hay que cambiar la versión.

if (version_compare(PHP_VERSION, '8.1', '<')) {
    instalarPagina('Falta cambiar la versión de PHP',
        '<p>El hosting tiene <b>PHP ' . htmlspecialchars(PHP_VERSION) . '</b> y la web necesita <b>PHP 8.3</b>.</p>'
        . '<p>En el panel de Ferozo: <b>Mi Sitio Web → Configuración de PHP</b>, elegí <b>8.3</b> y guardá. '
        . 'Después volvé a abrir esta página.</p>', 'error');
}
if (!is_file(__DIR__ . '/api/config.php')) {
    instalarPagina('Falta el archivo de configuración',
        '<p>No encontré <b>api/config.php</b>. Tiene que estar en la carpeta <b>api</b>, con los datos de la base de datos.</p>', 'error');
}

require __DIR__ . '/api/lib/base.php';
require __DIR__ . '/api/lib/esquema.php';
require __DIR__ . '/api/lib/importar.php';

function instalarPagina(string $titulo, string $cuerpo, string $tipo = 'info'): void {
    $color = $tipo === 'error' ? '#b3261e' : ($tipo === 'ok' ? '#2e7d32' : '#614491');
    header('Content-Type: text/html; charset=utf-8');
    header('X-Robots-Tag: noindex');
    echo '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>Instalación – Mujeres en Red</title><style>'
        . 'body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;box-sizing:border-box;font:17px/1.55 system-ui,sans-serif;color:#2a1f3d;'
        . 'background:linear-gradient(135deg,#de6f20,#eb5d9d 35%,#614491 65%,#0eabe2 85%,#78b833)}'
        . '.caja{width:100%;max-width:560px;background:#fff;border-radius:24px;padding:28px;box-shadow:0 30px 60px -30px rgba(0,0,0,.6)}'
        . 'h1{margin:0 0 12px;font-size:1.6rem;color:' . $color . '}label{display:block;margin:14px 0 4px;font-weight:700}'
        . 'input{width:100%;box-sizing:border-box;min-height:46px;padding:8px 12px;border:1px solid #cfc6d8;border-radius:10px;font:inherit}'
        . 'button{margin-top:20px;width:100%;min-height:50px;border:0;border-radius:999px;background:#614491;color:#fff;font:inherit;font-weight:800;cursor:pointer}'
        . 'small{color:#6b6080}code{background:#f3eef8;padding:1px 6px;border-radius:6px}li{margin:4px 0}'
        . '.aviso{padding:12px 14px;border-radius:12px;background:#fdecea;color:#b3261e;font-weight:600}'
        . '</style></head><body><main class="caja"><h1>' . $titulo . '</h1>' . $cuerpo . '</main></body></html>';
    exit;
}

$e = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');

// 1. La clave de instalación tiene que estar puesta en config.php
$claveInstalacion = (string) config('clave_instalacion');
if (strlen($claveInstalacion) < 12) {
    instalarPagina('Falta la clave de instalación',
        '<p>En <b>api/config.php</b> tiene que haber una <code>clave_instalacion</code> de al menos 12 caracteres.</p>', 'error');
}

// 2. La base de datos tiene que responder
try {
    db()->query('SELECT 1');
} catch (Throwable $ex) {
    instalarPagina('No me pude conectar a la base de datos',
        '<p>Revisá en <b>api/config.php</b> el nombre de la base, el usuario y la contraseña: tienen que ser los mismos '
        . 'que creaste en Ferozo, en <b>Bases de datos</b>.</p><p><small>Detalle: ' . $e($ex->getMessage()) . '</small></p>', 'error');
}

// 3. Si ya hay cuentas, la web ya está instalada: no se toca nada
crearTablas();
if ((int) q('SELECT COUNT(*) FROM usuarias')->fetchColumn() > 0) {
    instalarPagina('La web ya está instalada',
        '<p>Ya hay cuentas creadas, así que no hice nada.</p><p>Por seguridad, <b>borrá el archivo instalar.php</b> del hosting '
        . '(con el Administrador de archivos de Ferozo).</p><p><a href="/admin">Ir al panel</a></p>', 'ok');
}

// 4. Formulario
$error = '';
$d = $_POST;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = trim($d['nombre'] ?? '');
    $email = trim($d['email'] ?? '');
    $clave = (string) ($d['clave'] ?? '');
    if (!hash_equals($claveInstalacion, (string) ($d['clave_instalacion'] ?? ''))) $error = 'La clave de instalación no es correcta.';
    elseif ($nombre === '') $error = 'Escribí el nombre de la administradora.';
    elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $error = 'El correo no parece válido.';
    elseif (mb_strlen($clave) < 8) $error = 'La contraseña tiene que tener al menos 8 caracteres.';
    elseif ($clave !== ($d['clave2'] ?? '')) $error = 'Las dos contraseñas no son iguales.';

    if ($error === '') {
        @set_time_limit(300);
        try {
            $resultado = null;
            if ((int) q('SELECT COUNT(*) FROM notas')->fetchColumn() === 0) {
                $resultado = importarContenido(RAIZ . '/contenido');
            } else {
                cargarDatosIniciales();
            }
            q('INSERT INTO usuarias (email, nombre, clave, rol, creada) VALUES (?, ?, ?, ?, ?)',
                [$email, $nombre, password_hash($clave, PASSWORD_DEFAULT), 'admin', ahora()]);
        } catch (Throwable $ex) {
            error_log('Instalación: ' . $ex->getMessage());
            instalarPagina('Algo salió mal al cargar el contenido',
                '<p>No se terminó de instalar. Mandale esta pantalla a quien te ayuda con la web.</p>'
                . '<p><small>Detalle: ' . $e($ex->getMessage()) . '</small></p><p><a href="">Probar de nuevo</a></p>', 'error');
        }

        $resumen = $resultado
            ? "<ul><li>{$resultado['notas']} notas del blog</li><li>{$resultado['proyectos']} fichas de Qué hacemos</li>"
                . "<li>{$resultado['emprendimientos']} emprendimientos en {$resultado['rubros']} rubros</li>"
                . '<li>Equipo, instituciones y datos de contacto</li></ul>'
                . ($resultado['sin_foto'] ? '<p><small>' . count($resultado['sin_foto']) . ' fotos no estaban en la carpeta uploads y siguen apuntando a WordPress.</small></p>' : '')
            : '<p>El contenido ya estaba cargado; no lo volví a cargar.</p>';
        instalarPagina('¡Listo, la web quedó instalada! 🎉',
            '<p>Se cargó:</p>' . $resumen
            . '<p>Ya podés entrar al panel con <b>' . $e($email) . '</b> y la contraseña que elegiste.</p>'
            . '<p class="aviso">Ahora, por seguridad, borrá el archivo <b>instalar.php</b> del hosting.</p>'
            . '<p><a href="/admin">Ir al panel</a> · <a href="/">Ver la web</a></p>', 'ok');
    }
}

instalarPagina('Instalar la web de Mujeres en Red',
    '<p>Esto se hace <b>una sola vez</b>: carga todo el contenido y crea la cuenta de la administradora.</p>'
    . ($error ? '<p class="aviso">' . $e($error) . '</p>' : '')
    . '<form method="post" autocomplete="off">'
    . '<label for="ci">Clave de instalación</label><input id="ci" name="clave_instalacion" type="password" required>'
    . '<small>Está en el archivo api/config.php.</small>'
    . '<label for="n">Nombre de la administradora</label><input id="n" name="nombre" required value="' . $e($d['nombre'] ?? '') . '">'
    . '<label for="m">Correo (con este entra al panel)</label><input id="m" name="email" type="email" required value="' . $e($d['email'] ?? '') . '">'
    . '<label for="c1">Contraseña para el panel</label><input id="c1" name="clave" type="password" minlength="8" required autocomplete="new-password">'
    . '<small>Al menos 8 caracteres. Anotala en un lugar seguro.</small>'
    . '<label for="c2">Repetí la contraseña</label><input id="c2" name="clave2" type="password" minlength="8" required autocomplete="new-password">'
    . '<button>Instalar</button></form>');
