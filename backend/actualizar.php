<?php
// Actualiza la base de datos del hosting desde el navegador (Ferozo no tiene consola).
// Pide la misma "clave de instalación" que está en api/config.php. Antes de cambiar nada guarda una copia
// de las notas y las fichas. Se usa después de subir una versión nueva; al terminar, borrar este archivo del hosting.

require __DIR__ . '/api/lib/base.php';
require __DIR__ . '/api/lib/actualizar.php';

function pagina(string $titulo, string $cuerpo): never {
    header('Content-Type: text/html; charset=utf-8');
    header('X-Robots-Tag: noindex');
    header('Cache-Control: no-store');
    echo '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>Actualización – Mujeres en Red</title><style>'
        . 'body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;box-sizing:border-box;font:17px/1.55 system-ui,sans-serif;color:#2a1f3d;background:#614491}'
        . '.caja{width:100%;max-width:520px;background:#fff;border-radius:24px;padding:28px}h1{margin:0 0 12px;font-size:1.5rem;color:#614491}'
        . 'input{width:100%;box-sizing:border-box;min-height:46px;padding:8px 12px;border:1px solid #cfc6d8;border-radius:10px;font:inherit}'
        . 'button{margin-top:16px;width:100%;min-height:50px;border:0;border-radius:999px;background:#614491;color:#fff;font:inherit;font-weight:800;cursor:pointer}'
        . '.aviso{padding:12px 14px;border-radius:12px;background:#fdecea;color:#b3261e;font-weight:600}'
        . "</style></head><body><main class=\"caja\"><h1>$titulo</h1>$cuerpo</main></body></html>";
    exit;
}

$claveReal = (string) config('clave_instalacion');
if (strlen($claveReal) < 12) pagina('Falta la clave', '<p>En <b>api/config.php</b> tiene que haber una clave de instalación de al menos 12 caracteres.</p>');

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($claveReal, (string) ($_POST['clave'] ?? ''))) {
        sleep(2); // para que no se pueda probar una clave detrás de otra
        $error = 'La clave no es correcta.';
    } else {
        @set_time_limit(300);
        try {
            // La copia es un .php que no muestra nada si alguien lo abre desde internet
            $copia = [];
            foreach (['portfolio', 'notas'] as $tabla) $copia[$tabla] = q("SELECT * FROM $tabla")->fetchAll();
            $archivo = 'contenido/copia-antes-de-actualizar-' . date('Ymd-His') . '.php';
            $json = json_encode($copia, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            // "<?" dentro de los textos no puede quedar como código
            $json = str_replace('<?', '\\u003c?', $json);
            if (file_put_contents(RAIZ . "/$archivo", "<?php exit; ?>\n$json") === false) throw new RuntimeException('No se pudo guardar la copia; no se cambió nada.');
            actualizarBase();
            $fichas = (int) q('SELECT COUNT(*) FROM portfolio WHERE publicada = 1 AND borrada IS NULL')->fetchColumn();
            pagina('¡Listo, la web quedó actualizada!', "<p>Hay $fichas fichas publicadas en Qué hacemos. La copia de antes quedó en <b>$archivo</b>.</p>"
                . '<p class="aviso">Ahora, por seguridad, hay que borrar <b>actualizar.php</b> del hosting.</p><p><a href="/">Ver la web</a></p>');
        } catch (Throwable $ex) {
            error_log('Actualización: ' . $ex->getMessage());
            pagina('Algo salió mal', '<p>No se terminó de actualizar. Mandale esta pantalla a quien te ayuda con la web.</p><p><small>'
                . htmlspecialchars($ex->getMessage()) . '</small></p>');
        }
    }
}

pagina('Actualizar la web', '<p>Agrega a la base de datos lo nuevo de la web. No borra lo que se cargó en el panel.</p>'
    . ($error ? "<p class=\"aviso\">$error</p>" : '')
    . '<form method="post" autocomplete="off"><label>Clave de instalación<input name="clave" type="password" required></label><button>Actualizar</button></form>');
