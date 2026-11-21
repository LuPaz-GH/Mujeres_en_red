<?php
// Entrega la web (el index.html de React) con el título, la descripción y la foto de cada página ya puestos.
// Así, al compartir un link por WhatsApp o Facebook se ve una tarjeta con foto, y Google lee bien cada página.
// También arma /sitemap.xml (el mapa del sitio para Google) con todas las notas y programas.
//
// En el hosting va en public_html/, al lado de index.html y de la carpeta api/ (ver .htaccess de frontend/public).
// Si algo falla (por ejemplo, la base de datos), igual entrega la web con los datos generales.

require __DIR__ . '/api/lib/base.php';

$ruta = '/' . trim(rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/'), '/');
$sitio = rtrim(config('url_sitio'), '/');
$absoluta = fn(?string $url) => !$url ? '' : (preg_match('#^https?://#', $url) ? $url : $sitio . '/' . ltrim($url, '/'));

// Páginas fijas: título y descripción
const PAGINAS_FIJAS = [
    '/' => ['Mujeres en Red – Construir redes de apoyo, formación y transformación', 'Fundación de Tucumán que acompaña a mujeres en su desarrollo personal, profesional y comunitario: capacitaciones, bienestar, liderazgo y emprendimiento.'],
    '/quienes-somos' => ['Quiénes somos – Mujeres en Red', 'Somos una organización de mujeres comprometidas con el cambio social. Desde 2012 creamos proyectos para mejorar las oportunidades de las mujeres tucumanas.'],
    '/portfolio' => ['Qué hacemos – Mujeres en Red', 'Programas, networking, voluntariado y DeporVida para mujeres de Tucumán y el NOA: capacitación, bienestar, liderazgo y emprendimiento.'],
    '/eventos' => ['Eventos – Mujeres en Red', 'Talleres, encuentros y celebraciones para conocernos, aprender y crecer juntas. Enterate de los próximos eventos.'],
    '/blog' => ['Blog – Mujeres en Red', 'Novedades, actividades y logros de la Fundación Mujeres en Red.'],
    '/catalogo' => ['Catálogo de emprendedoras – Mujeres en Red', 'Emprendimientos y servicios profesionales de mujeres de nuestra red: gastronomía, moda, salud, bienestar, decoración y más.'],
    '/contacto' => ['Contacto – Mujeres en Red', '¿Querés sumarte, proponer una alianza o contarnos tu idea? Escribinos.'],
    '/donar' => ['Doná – Mujeres en Red', 'Tu aporte sostiene capacitaciones gratuitas y acompañamiento para mujeres de Tucumán. Doná con tarjeta, Mercado Pago o transferencia.'],
    '/privacidad' => ['Política de privacidad – Mujeres en Red', 'Qué datos guardamos cuando nos escribís o visitás la web, y para qué los usamos.'],
];

function textoCorto(?string $texto, int $largo = 160): string {
    $texto = textoPlano($texto);
    return mb_strlen($texto) > $largo ? rtrim(mb_substr($texto, 0, $largo - 1)) . '…' : $texto;
}

// --- Mapa del sitio para Google -------------------------------------------------------------

if ($ruta === '/sitemap.xml') {
    $urls = [];
    foreach (array_keys(PAGINAS_FIJAS) as $p) $urls[] = [$p, null];
    try {
        foreach (q('SELECT slug, fecha FROM portfolio WHERE publicada = 1 AND borrada IS NULL')->fetchAll() as $f) $urls[] = ["/portfolio/{$f['slug']}", $f['fecha']];
        foreach (q('SELECT slug, modificada FROM notas WHERE publicada = 1 AND borrada IS NULL ORDER BY fecha DESC')->fetchAll() as $f) $urls[] = ["/{$f['slug']}", $f['modificada']];
    } catch (Throwable) {
        // sin base: al menos las páginas fijas
    }
    header('Content-Type: application/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($urls as [$p, $fecha]) {
        echo '  <url><loc>' . htmlspecialchars($sitio . ($p === '/' ? '/' : $p)) . '</loc>'
            . ($fecha ? '<lastmod>' . substr($fecha, 0, 10) . '</lastmod>' : '') . "</url>\n";
    }
    echo "</urlset>\n";
    exit;
}

// --- Datos de la página pedida --------------------------------------------------------------

[$titulo, $descripcion] = PAGINAS_FIJAS['/'];
$imagen = '/img/compartir.jpg';
$tipo = 'website';
$indexar = true;
$codigo = 200;

if (isset(PAGINAS_FIJAS[$ruta])) {
    [$titulo, $descripcion] = PAGINAS_FIJAS[$ruta];
} elseif (preg_match('#^/admin(/|$)#', $ruta)) {
    $titulo = 'Panel – Mujeres en Red';
    $indexar = false;
} else {
    try {
        if (preg_match('#^/portfolio/([\w-]+)$#', $ruta, $m)) {
            $p = q('SELECT titulo, contenido, foto FROM portfolio WHERE slug = ? AND publicada = 1 AND borrada IS NULL', [$m[1]])->fetch();
            if ($p) {
                $titulo = "{$p['titulo']} – Mujeres en Red";
                $descripcion = textoCorto($p['contenido']);
                $imagen = $p['foto'] ?: $imagen;
                $tipo = 'article';
            } else {
                $codigo = 404;
            }
        } elseif (preg_match('#^/([\w-]+)$#', $ruta, $m)) {
            $n = q('SELECT titulo, resumen, contenido, foto FROM notas WHERE slug = ? AND publicada = 1 AND borrada IS NULL', [$m[1]])->fetch();
            if ($n) {
                $titulo = html_entity_decode($n['titulo'], ENT_QUOTES | ENT_HTML5, 'UTF-8') . ' – Mujeres en Red';
                $descripcion = textoCorto($n['resumen'] ?: $n['contenido']);
                $imagen = $n['foto'] ?: (imagenesDe($n['contenido'], 1)[0] ?? $imagen);
                $tipo = 'article';
            } elseif ($pag = q('SELECT titulo, contenido FROM paginas WHERE slug = ? AND borrada IS NULL', [$m[1]])->fetch()) {
                $titulo = "{$pag['titulo']} – Mujeres en Red";
                $descripcion = textoCorto($pag['contenido']) ?: $descripcion;
            } else {
                $codigo = 404;
            }
        } else {
            $codigo = 404;
        }
    } catch (Throwable $e) {
        error_log('Página: ' . $e->getMessage()); // sin base de datos: datos generales
    }
}
if ($codigo === 404) {
    $titulo = 'Página no encontrada – Mujeres en Red';
    $indexar = false;
}

// --- Armar el HTML ---------------------------------------------------------------------------

$html = @file_get_contents(__DIR__ . '/index.html');
if ($html === false) {
    http_response_code(503);
    exit('La web no está publicada todavía (falta index.html).');
}

$e = fn(string $s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
$url = $sitio . ($ruta === '/' ? '/' : $ruta);
$etiquetas = implode("\n    ", [
    '<link rel="canonical" href="' . $e($url) . '" />',
    '<meta property="og:site_name" content="Mujeres en Red" />',
    '<meta property="og:locale" content="es_AR" />',
    '<meta property="og:type" content="' . $tipo . '" />',
    '<meta property="og:title" content="' . $e($titulo) . '" />',
    '<meta property="og:description" content="' . $e($descripcion) . '" />',
    '<meta property="og:url" content="' . $e($url) . '" />',
    '<meta property="og:image" content="' . $e($absoluta($imagen)) . '" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    $indexar ? '' : '<meta name="robots" content="noindex" />',
]);

$html = preg_replace('#<title>.*?</title>#s', '<title>' . $e($titulo) . '</title>', $html, 1);
$html = preg_replace('#<meta name="description"[^>]*>#', '<meta name="description" content="' . $e($descripcion) . '" />', $html, 1);
$html = str_replace('</head>', "    $etiquetas\n  </head>", $html);

http_response_code($codigo);
header('Content-Type: text/html; charset=utf-8');
// Que el navegador pregunte siempre si hay una versión nueva (el hosting por defecto la guarda 7 días
// y los cambios no se veían). Lo pesado (assets/ con nombres que cambian en cada versión) sí se guarda.
header('Cache-Control: no-cache');
echo $html;
