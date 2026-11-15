<?php
// Piezas comunes de la API: configuración, base de datos, respuestas JSON y sesión de la administradora

// Raíz donde viven api/ y uploads/: backend/ en la compu, public_html/ en el hosting
define('RAIZ', dirname(__DIR__, 2));

// Las fechas de las notas se guardan en hora de Argentina (igual que venían de WordPress)
date_default_timezone_set('America/Argentina/Tucuman');

function config(string $clave) {
    static $config;
    // config.php no se sube a GitHub (tiene la contraseña de la base); ver config.ejemplo.php
    $config ??= (is_file(RAIZ . '/api/config.php') ? require RAIZ . '/api/config.php' : []) + [
        'db' => 'sqlite:' . RAIZ . '/datos/local.sqlite',
        'db_usuario' => null,
        'db_clave' => null,
        'mail_destino' => 'info@mujeresenred.com.ar',
        'mail_remitente' => 'web@mujeresenred.com.ar',
        'uploads_url' => '/uploads',
        // Dirección de la web, para los links que se comparten (WhatsApp, Facebook) y el mapa del sitio de Google
        'url_sitio' => 'https://mujeresenred.com.ar',
        // Clave que pide instalar.php (la instalación en el hosting). Vacía = la instalación no funciona.
        'clave_instalacion' => '',
    ];
    return $config[$clave];
}

// --- Base de datos ---------------------------------------------------------------------------
// En la compu se usa SQLite (un archivo, sin instalar nada) y en el hosting la MySQL de Ferozo.

function db(): PDO {
    static $pdo;
    if ($pdo) return $pdo;
    $dsn = config('db');
    if (str_starts_with($dsn, 'sqlite:')) @mkdir(dirname(substr($dsn, 7)), 0777, true);
    $pdo = new PDO($dsn, config('db_usuario'), config('db_clave'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    if (esSqlite()) $pdo->exec('PRAGMA foreign_keys = ON');
    return $pdo;
}

function esSqlite(): bool {
    return str_starts_with(config('db'), 'sqlite:');
}

function q(string $sql, array $params = []): PDOStatement {
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function ahora(): string {
    return date('Y-m-d H:i:s');
}

// "2025-04-27 12:30:27" -> "2025-04-27T12:30:27" (el formato que entiende el navegador)
function iso(?string $fecha): ?string {
    return $fecha ? str_replace(' ', 'T', $fecha) : null;
}

// --- Respuestas ------------------------------------------------------------------------------

function responder($datos, int $codigo = 200): never {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function error(string $mensaje, int $codigo = 400): never {
    responder(['error' => $mensaje], $codigo);
}

// Datos enviados por el panel (JSON)
function cuerpo(): array {
    $datos = json_decode(file_get_contents('php://input'), true);
    return is_array($datos) ? $datos : [];
}

function ip(): string {
    return $_SERVER['REMOTE_ADDR'] ?? '';
}

// --- Sesión ----------------------------------------------------------------------------------

function iniciarSesion(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    ini_set('session.gc_maxlifetime', '28800'); // 8 horas, para no perder una nota a mitad de escribirla
    session_name('mer_sesion');
    session_set_cookie_params([
        'path' => '/',
        'httponly' => true,
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'samesite' => 'Lax',
    ]);
    session_start();
}

function usuaria(): ?array {
    iniciarSesion();
    $id = $_SESSION['usuaria'] ?? null;
    if (!$id) return null;
    return q('SELECT id, email, nombre, rol FROM usuarias WHERE id = ? AND borrada IS NULL', [$id])->fetch() ?: null;
}

// Para todo lo del panel. Los cambios además tienen que venir con el encabezado X-Requested-With,
// que otra página web no puede agregar: así nadie puede hacer cambios "desde afuera" con la sesión abierta.
function requerirUsuaria(): array {
    $u = usuaria();
    if (!$u) error('Tenés que iniciar sesión', 401);
    if ($_SERVER['REQUEST_METHOD'] !== 'GET' && ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'fetch') {
        error('Pedido no permitido', 403);
    }
    return $u;
}

// Para lo que solo puede hacer una administradora: papelera, actividad y cuentas
function requerirAdmin(): array {
    $u = requerirUsuaria();
    if ($u['rol'] !== 'admin') error('Esto solo lo puede hacer una administradora', 403);
    return $u;
}

// --- Textos ----------------------------------------------------------------------------------

// "¡Mujeres en Acción 2025!" -> "mujeres-en-accion-2025"
function slugify(string $texto): string {
    $texto = mb_strtolower(trim($texto));
    $texto = strtr($texto, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n', 'ç' => 'c',
        'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u', 'â' => 'a', 'ê' => 'e', 'ô' => 'o']);
    $texto = preg_replace('/[^a-z0-9]+/', '-', $texto);
    return trim(substr($texto, 0, 120), '-') ?: 'sin-titulo';
}

// Direcciones que ya usa la web: una nota no puede llamarse así porque las notas viven en la raíz (/titulo)
const SLUGS_RESERVADOS = ['inicio', 'quienes-somos', 'portfolio', 'eventos', 'privacidad', 'sitemap', 'equipo', 'blog', 'catalogo', 'contacto', 'donar', 'admin', 'api', 'uploads'];

// Cómo se agrupa cada ficha en la página "Qué hacemos" (/portfolio)
const CATEGORIAS_PORTFOLIO = ['programa', 'proyecto', 'networking'];

// Agrega -2, -3... si la dirección ya existe en la tabla
function slugUnico(string $base, string $tabla, ?int $id = null): string {
    $base = slugify($base);
    for ($i = 1; ; $i++) {
        $slug = $i === 1 ? $base : "$base-$i";
        // Notas y páginas comparten la raíz de la web (/titulo)
        $otra = ['notas' => 'paginas', 'paginas' => 'notas'][$tabla] ?? null;
        if ($otra && (in_array($slug, SLUGS_RESERVADOS) || q("SELECT id FROM $otra WHERE slug = ?", [$slug])->fetch())) continue;
        $existe = q("SELECT id FROM $tabla WHERE slug = ? AND id <> ?", [$slug, $id ?? 0])->fetch();
        if (!$existe) return $slug;
    }
}

function textoPlano(?string $html): string {
    return trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($html ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
}

// Primeras palabras del texto, para el resumen de una nota
function recortar(string $texto, int $palabras = 40): string {
    $partes = preg_split('/\s+/u', $texto);
    return count($partes) > $palabras ? implode(' ', array_slice($partes, 0, $palabras)) . '…' : $texto;
}

// Fotos que aparecen dentro del texto (para el mosaico de las notas sin foto propia)
function imagenesDe(?string $html, int $max = 4): array {
    preg_match_all('/<img[^>]+src="([^"]+)"/', $html ?? '', $m);
    return array_slice(array_values(array_unique($m[1])), 0, $max);
}

// Solo links normales (nada de "javascript:" u otras cosas raras)
function urlValida(?string $url): bool {
    return (bool) preg_match('#^(https?://[^\s]+\.[^\s]+|mailto:[^\s]+@[^\s]+)$#i', trim($url ?? ''));
}
