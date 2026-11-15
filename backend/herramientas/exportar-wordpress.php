<?php
// Exporta el contenido público de WordPress (notas, portfolio, páginas, catálogo) a backend/contenido/
// y arma la lista de fotos que se usan de verdad.
//
//   php exportar-wordpress.php              -> exporta textos y mide cuánto pesan las fotos
//   php exportar-wordpress.php --descargar  -> además descarga las fotos a backend/uploads/
//
// Solo lee la API pública: no necesita usuario ni contraseña y no cambia nada en WordPress.

const WP = 'https://mujeresenred.com.ar';
const API = WP . '/wp-json/wp/v2';

$base = dirname(__DIR__);
$outDir = "$base/contenido";
$uploadsDir = "$base/uploads";
@mkdir($outDir, 0777, true);

function http(string $url, bool $head = false): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_NOBODY => $head,
        CURLOPT_HEADER => $head,
        CURLOPT_TIMEOUT => 120,
        CURLOPT_USERAGENT => 'MujeresEnRed-export',
        CURLOPT_SSL_OPTIONS => CURLSSLOPT_NATIVE_CA, // en Windows, usa los certificados del sistema
    ]);
    $body = curl_exec($ch);
    $info = curl_getinfo($ch);
    if ($body === false) fwrite(STDERR, 'curl: ' . curl_error($ch) . " ($url)\n");
    curl_close($ch);
    return [$info['http_code'], $body, $info];
}

function api(string $path): array {
    [$code, $body] = http(API . $path);
    if ($code !== 200) throw new RuntimeException("Error $code en $path");
    return json_decode($body, true);
}

// Trae todas las páginas de resultados de un listado
function all(string $type, string $extra = ''): array {
    $items = [];
    for ($page = 1; ; $page++) {
        $batch = api("/$type?per_page=100&page=$page$extra");
        $items = array_merge($items, $batch);
        if (count($batch) < 100) return $items;
    }
}

function text(string $html): string {
    return trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
}

function save(string $file, $data): void {
    global $outDir;
    file_put_contents("$outDir/$file", json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    echo "  $file\n";
}

// --- Fotos -----------------------------------------------------------------------------------

$fotos = []; // url original => true

// "foto-1024x768.jpg" -> "foto.jpg" (WordPress guarda varias copias achicadas de cada foto)
function original(string $url): string {
    return preg_replace('/-\d+x\d+(\.\w+)$/', '$1', $url);
}

function useImage(?string $url): ?string {
    global $fotos;
    if (!$url || !str_starts_with($url, WP . '/wp-content/uploads/')) return $url;
    $url = original($url);
    $fotos[$url] = true;
    return $url;
}

function useContentImages(string $html): string {
    // srcset y sizes apuntan a las copias achicadas: se sacan y queda solo el src original
    $html = preg_replace('/\s(srcset|sizes)="[^"]*"/', '', $html);
    return preg_replace_callback('/(<img[^>]+src=")([^"]+)(")/', fn($m) => $m[1] . useImage($m[2]) . $m[3], $html);
}

function featured(array $item): ?string {
    $media = $item['_embedded']['wp:featuredmedia'][0] ?? null;
    if (!$media || ($item['featured_media'] ?? 0) === 2538) return null; // 2538 = imagen genérica de relleno
    return useImage($media['source_url'] ?? null);
}

// --- Notas, categorías y etiquetas ---------------------------------------------------------

echo "Exportando textos a backend/contenido/\n";

$categorias = array_map(fn($c) => [
    'id' => $c['id'], 'nombre' => html_entity_decode($c['name']), 'slug' => $c['slug'],
], array_filter(all('categories'), fn($c) => $c['id'] !== 1)); // 1 = "Sin categoría"
save('categorias.json', array_values($categorias));

$etiquetas = array_map(fn($t) => [
    'id' => $t['id'], 'nombre' => html_entity_decode($t['name']), 'slug' => $t['slug'],
], all('tags'));
save('etiquetas.json', $etiquetas);

$notas = array_map(fn($p) => [
    'id' => $p['id'],
    'slug' => $p['slug'],
    'titulo' => text($p['title']['rendered']),
    'fecha' => $p['date'],
    'modificada' => $p['modified'],
    'resumen' => text($p['excerpt']['rendered']),
    'contenido' => useContentImages($p['content']['rendered']),
    'foto' => featured($p),
    'autora' => $p['_embedded']['author'][0]['name'] ?? null,
    'categorias' => array_values(array_filter($p['categories'], fn($id) => $id !== 1)),
    'etiquetas' => $p['tags'],
], all('posts', '&_embed=wp:featuredmedia,author'));
save('notas.json', $notas);

// --- Portfolio -----------------------------------------------------------------------------

$portfolio = array_map(fn($p) => [
    'id' => $p['id'],
    'slug' => $p['slug'],
    'titulo' => text($p['title']['rendered']),
    'fecha' => $p['date'],
    'contenido' => useContentImages($p['content']['rendered']),
    'foto' => featured($p),
], all('portfolio_item', '&_embed=wp:featuredmedia'));
save('portfolio.json', $portfolio);

// --- Páginas y catálogo --------------------------------------------------------------------

$paginas = all('pages');
save('paginas.json', array_map(fn($p) => [
    'id' => $p['id'],
    'slug' => $p['slug'],
    'titulo' => text($p['title']['rendered']),
    'contenido' => useContentImages($p['content']['rendered']),
], $paginas));

// El catálogo es una página larga: cada h2 es un rubro y cada bloque "imagen + texto" un emprendimiento.
// Se pasa a fichas separadas (misma lógica que frontend/src/api/catalog.js).
function linkType(string $href): string {
    return match (true) {
        (bool) preg_match('/wa\.link|wa\.me|whatsapp/i', $href) => 'whatsapp',
        (bool) preg_match('/instagram\.com/i', $href) => 'instagram',
        (bool) preg_match('/facebook\.com|fb\.com/i', $href) => 'facebook',
        (bool) preg_match('/tiktok\.com/i', $href) => 'tiktok',
        (bool) preg_match('/^mailto:/i', $href) => 'email',
        (bool) preg_match('/linkedin\.com/i', $href) => 'linkedin',
        default => 'web',
    };
}

function parseCatalog(string $html): array {
    $doc = new DOMDocument();
    @$doc->loadHTML('<?xml encoding="utf-8"?><body>' . $html . '</body>');
    $xp = new DOMXPath($doc);
    $clean = fn($s) => trim(preg_replace('/\s+/u', ' ', $s));

    $rubros = [];
    $fichas = [];
    $rubro = 'Otros';
    $nodes = $xp->query('//h2 | //*[contains(concat(" ", normalize-space(@class), " "), " wp-block-media-text ")]');
    foreach ($nodes as $el) {
        if ($el->nodeName === 'h2') {
            $rubro = rtrim($clean($el->textContent), '.');
            if ($rubro && !in_array($rubro, $rubros)) $rubros[] = $rubro;
            continue;
        }
        $content = $xp->query('.//*[contains(@class, "wp-block-media-text__content")]', $el)->item(0) ?? $el;
        $img = $xp->query('.//img', $el)->item(0)?->getAttribute('src');
        $nombre = $clean($xp->query('.//strong', $content)->item(0)?->textContent ?? '');
        if (!$nombre) continue;

        $parrafos = [];
        foreach ($xp->query('.//p', $content) as $p) {
            $t = $clean($p->textContent);
            if ($t && $t !== $nombre && !$xp->query('.//a', $p)->length) $parrafos[] = $t;
        }
        $descripcion = implode(' ', $parrafos);
        if (str_starts_with($descripcion, $nombre)) $descripcion = trim(substr($descripcion, strlen($nombre)));

        $links = [];
        foreach ($xp->query('.//a[@href]', $content) as $a) {
            $href = trim($a->getAttribute('href'));
            if (!preg_match('/^(https?:|mailto:)/i', $href) || preg_match('/\s/', $href) || isset($links[$href])) continue;
            if (preg_match('/^https?:/i', $href) && !str_contains(parse_url($href, PHP_URL_HOST) ?? '', '.')) continue;
            $tipo = linkType($href);
            $texto = $clean($a->textContent);
            if ($tipo === 'whatsapp') $texto = preg_replace('/^(cel\.?|[:\s])*/i', '', $texto);
            $links[$href] = ['tipo' => $tipo, 'url' => $href, 'texto' => $texto];
        }

        $fichas[] = [
            'nombre' => $nombre,
            'rubro' => $rubro,
            'descripcion' => $descripcion,
            'foto' => useImage($img),
            'links' => array_values($links),
        ];
    }
    return ['rubros' => $rubros, 'fichas' => $fichas];
}

$catalogo = current(array_filter($paginas, fn($p) => $p['slug'] === 'catalogo'));
save('catalogo.json', parseCatalog($catalogo['content']['rendered']));

// --- Medir y descargar fotos ----------------------------------------------------------------

$descargar = in_array('--descargar', $argv);
echo "\nFotos usadas: " . count($fotos) . "\n";

$lista = [];
$total = 0;
foreach (array_keys($fotos) as $url) {
    [$code, $headers, $info] = http($url, true);
    if ($code !== 200) {
        // Si la original no existe, WordPress pudo haberla guardado como "-scaled"
        $alt = preg_replace('/(\.\w+)$/', '-scaled$1', $url);
        [$code, $headers, $info] = http($alt, true);
        if ($code === 200) $url = $alt;
    }
    $bytes = $code === 200 ? (int) $info['download_content_length'] : 0;
    $total += max($bytes, 0);
    $lista[] = ['url' => $url, 'bytes' => $bytes, 'ok' => $code === 200];
}
save('fotos.json', $lista);

$faltan = count(array_filter($lista, fn($f) => !$f['ok']));
printf("Peso total: %.1f MB%s\n", $total / 1048576, $faltan ? " ($faltan no se encontraron)" : '');

require dirname(__DIR__) . '/api/lib/fotos.php'; // optimizar()

if ($descargar) {
    echo "Descargando y achicando a backend/uploads/ ...\n";
    $final = 0;
    foreach ($lista as $i => $f) {
        printf("\r  %d / %d", $i + 1, count($lista));
        if (!$f['ok']) continue;
        // Se guarda con el mismo camino que en WordPress (2025/04/foto.jpg), sin el "-scaled"
        $rel = urldecode(substr(parse_url($f['url'], PHP_URL_PATH), strlen('/wp-content/uploads/')));
        $dest = "$uploadsDir/" . preg_replace('/-scaled(\.\w+)$/', '$1', $rel);
        if (!is_file($dest)) {
            [$code, $body] = http($f['url']);
            if ($code !== 200) continue;
            @mkdir(dirname($dest), 0777, true);
            file_put_contents($dest, optimizar($body, strtolower(pathinfo($dest, PATHINFO_EXTENSION))));
        }
        $final += filesize($dest);
    }
    printf("\nListo: %.1f MB en backend/uploads/\n", $final / 1048576);
}
