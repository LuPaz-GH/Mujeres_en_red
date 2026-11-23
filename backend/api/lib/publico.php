<?php
// Lo que lee la web pública: notas, categorías, portfolio, catálogo, páginas y el formulario de contacto

// --- Notas -----------------------------------------------------------------------------------

// Categorías o etiquetas de varias notas a la vez: [nota_id => [{id, nombre, slug}, ...]]
function terminosDe(array $ids, string $tabla, string $union, string $columna): array {
    if (!$ids) return [];
    $lista = implode(',', array_map('intval', $ids));
    $res = [];
    $vigente = $tabla === 'categorias' ? 'AND t.borrada IS NULL' : ''; // las etiquetas no van a la papelera
    $filas = q("SELECT u.nota_id, t.id, t.nombre, t.slug FROM $union u JOIN $tabla t ON t.id = u.$columna
        WHERE u.nota_id IN ($lista) $vigente ORDER BY t.nombre")->fetchAll();
    foreach ($filas as $f) $res[$f['nota_id']][] = ['id' => (int) $f['id'], 'nombre' => $f['nombre'], 'slug' => $f['slug']];
    return $res;
}

// Convierte filas de la tabla en lo que recibe la web. Sin $completa no manda el texto entero (para listados).
function prepararNotas(array $filas, bool $completa = false): array {
    $ids = array_column($filas, 'id');
    $categorias = terminosDe($ids, 'categorias', 'nota_categoria', 'categoria_id');
    $etiquetas = terminosDe($ids, 'etiquetas', 'nota_etiqueta', 'etiqueta_id');
    return array_map(fn($n) => [
        'id' => (int) $n['id'],
        'slug' => $n['slug'],
        'titulo' => $n['titulo'],
        'fecha' => iso($n['fecha']),
        'resumen' => $n['resumen'],
        'foto' => $n['foto'],
        'autora' => $n['autora'],
        'publicada' => (bool) $n['publicada'],
        'portfolio_id' => !empty($n['portfolio_id']) ? (int) $n['portfolio_id'] : null,
        'categorias' => $categorias[$n['id']] ?? [],
        'etiquetas' => $etiquetas[$n['id']] ?? [],
        'imagenes' => imagenesDe($n['contenido']),
    ] + ($completa ? ['contenido' => $n['contenido'], 'modificada' => iso($n['modificada'])] : []), $filas);
}

// Filtros comunes del listado de notas (los usa también el panel)
function filtrosNotas(bool $soloPublicadas): array {
    $donde = ['n.borrada IS NULL'];
    if ($soloPublicadas) $donde[] = 'n.publicada = 1';
    $params = [];
    if ($cat = $_GET['categoria'] ?? '') {
        $donde[] = 'n.id IN (SELECT nc.nota_id FROM nota_categoria nc JOIN categorias c ON c.id = nc.categoria_id
            WHERE c.slug = ? OR c.id = ?)';
        array_push($params, $cat, (int) $cat);
    }
    if ($buscar = trim($_GET['buscar'] ?? '')) {
        $donde[] = '(n.titulo LIKE ? OR n.contenido LIKE ?)';
        array_push($params, "%$buscar%", "%$buscar%");
    }
    filtroFechas('n.fecha', $donde, $params);
    if ($excluir = (int) ($_GET['excluir'] ?? 0)) {
        $donde[] = 'n.id <> ?';
        $params[] = $excluir;
    }
    return [implode(' AND ', $donde), $params];
}

// Rango de fechas "AAAA-MM-DD" que llega en ?desde= y ?hasta=
function filtroFechas(string $columna, array &$donde, array &$params): void {
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['desde'] ?? '')) {
        $donde[] = "$columna >= ?";
        $params[] = $_GET['desde'] . ' 00:00:00';
    }
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['hasta'] ?? '')) {
        $donde[] = "$columna <= ?";
        $params[] = $_GET['hasta'] . ' 23:59:59';
    }
}

function paginarNotas(bool $soloPublicadas): array {
    [$donde, $params] = filtrosNotas($soloPublicadas);
    $porPagina = min(max((int) ($_GET['por_pagina'] ?? 9), 1), 100);
    $pagina = max((int) ($_GET['pagina'] ?? 1), 1);
    $desde = ($pagina - 1) * $porPagina;
    $total = (int) q("SELECT COUNT(*) FROM notas n WHERE $donde", $params)->fetchColumn();
    $filas = q("SELECT n.* FROM notas n WHERE $donde ORDER BY n.fecha DESC LIMIT $porPagina OFFSET $desde", $params)->fetchAll();
    return [
        'notas' => prepararNotas($filas),
        'total' => $total,
        'paginas' => max(1, (int) ceil($total / $porPagina)),
    ];
}

// GET /notas?pagina=1&por_pagina=9&categoria=&buscar=&desde=&hasta=&excluir=
function listarNotas(): never {
    responder(paginarNotas(true));
}

// GET /notas/{slug}: la nota completa, con la anterior, la siguiente y otras de las mismas categorías
function verNota(string $slug): never {
    $fila = q('SELECT * FROM notas WHERE slug = ? AND publicada = 1 AND borrada IS NULL', [$slug])->fetch();
    if (!$fila) error('No encontramos esa nota', 404);
    $nota = prepararNotas([$fila], true)[0];

    $vecina = fn($signo, $orden) => q("SELECT slug, titulo, fecha FROM notas
        WHERE publicada = 1 AND borrada IS NULL AND fecha $signo ? ORDER BY fecha $orden LIMIT 1", [$fila['fecha']])->fetch() ?: null;
    $formato = fn($v) => $v ? ['slug' => $v['slug'], 'titulo' => $v['titulo'], 'fecha' => iso($v['fecha'])] : null;

    $cats = array_column($nota['categorias'], 'id');
    $filtroCat = $cats ? 'AND id IN (SELECT nota_id FROM nota_categoria WHERE categoria_id IN (' . implode(',', $cats) . '))' : '';
    $relacionadas = q("SELECT * FROM notas WHERE publicada = 1 AND borrada IS NULL AND id <> ? $filtroCat ORDER BY fecha DESC LIMIT 3", [$fila['id']])->fetchAll();

    responder($nota + [
        'anterior' => $formato($vecina('<', 'DESC')),
        'siguiente' => $formato($vecina('>', 'ASC')),
        'relacionadas' => prepararNotas($relacionadas),
    ]);
}

// GET /categorias: solo las que tienen notas publicadas
function listarCategorias(): never {
    responder(array_map(fn($c) => ['id' => (int) $c['id'], 'nombre' => $c['nombre'], 'slug' => $c['slug'], 'cantidad' => (int) $c['cantidad']],
        q('SELECT c.id, c.nombre, c.slug, COUNT(n.id) AS cantidad FROM categorias c
            JOIN nota_categoria nc ON nc.categoria_id = c.id
            JOIN notas n ON n.id = nc.nota_id AND n.publicada = 1 AND n.borrada IS NULL
            WHERE c.borrada IS NULL
            GROUP BY c.id, c.nombre, c.slug ORDER BY c.nombre')->fetchAll()));
}

// --- Portfolio -------------------------------------------------------------------------------

function prepararProyecto(array $p): array {
    return [
        'id' => (int) $p['id'],
        'slug' => $p['slug'],
        'titulo' => $p['titulo'],
        'categoria' => $p['categoria'],
        'fecha' => iso($p['fecha']),
        'foto' => $p['foto'],
        'contenido' => $p['contenido'],
        'galeria' => leerGaleria($p['galeria'] ?? null),
        'publicada' => (bool) $p['publicada'],
    ];
}

// GET /portfolio?limite=6
function listarPortfolio(): never {
    $limite = min(max((int) ($_GET['limite'] ?? 50), 1), 100);
    responder(array_map('prepararProyecto', q("SELECT * FROM portfolio WHERE publicada = 1 AND borrada IS NULL ORDER BY fecha DESC LIMIT $limite")->fetchAll()));
}

// GET /portfolio/{slug}
function verProyecto(string $slug): never {
    $p = q('SELECT * FROM portfolio WHERE slug = ? AND publicada = 1 AND borrada IS NULL', [$slug])->fetch();
    if (!$p) error('No encontramos ese proyecto', 404);
    // Notas del blog que se escribieron sobre esta ficha
    $notas = q('SELECT * FROM notas WHERE portfolio_id = ? AND publicada = 1 AND borrada IS NULL ORDER BY fecha DESC LIMIT 60', [$p['id']])->fetchAll();
    responder(prepararProyecto($p) + ['notas' => prepararNotas($notas)]);
}

// --- Páginas y catálogo ----------------------------------------------------------------------

// GET /paginas/{slug}
function verPagina(string $slug): never {
    $p = q('SELECT slug, titulo, contenido FROM paginas WHERE slug = ? AND borrada IS NULL', [$slug])->fetch();
    if (!$p) error('No encontramos esa página', 404);
    responder($p);
}

function prepararFicha(array $f): array {
    return [
        'id' => (int) $f['id'],
        'nombre' => $f['nombre'],
        'rubro_id' => (int) $f['rubro_id'],
        'rubro' => $f['rubro'] ?? null,
        'descripcion' => $f['descripcion'],
        'foto' => $f['foto'],
        'links' => json_decode($f['links'] ?: '[]', true),
        'orden' => (int) $f['orden'],
        'publicado' => (bool) $f['publicado'],
        'creada' => iso($f['creada'] ?? null),
    ];
}

// GET /catalogo: rubros (solo los que tienen emprendimientos) y fichas
function verCatalogo(): never {
    $fichas = q('SELECT e.*, r.nombre AS rubro FROM emprendimientos e JOIN rubros r ON r.id = e.rubro_id
        WHERE e.publicado = 1 AND e.borrada IS NULL AND r.borrada IS NULL ORDER BY r.orden, r.id, e.orden, e.id')->fetchAll();
    $usados = array_unique(array_column($fichas, 'rubro_id'));
    $rubros = array_values(array_filter(q('SELECT id, nombre FROM rubros WHERE borrada IS NULL ORDER BY orden, id')->fetchAll(),
        fn($r) => in_array($r['id'], $usados)));
    responder([
        'rubros' => array_map(fn($r) => ['id' => (int) $r['id'], 'nombre' => $r['nombre']], $rubros),
        'fichas' => array_map('prepararFicha', $fichas),
    ]);
}

// --- Contacto --------------------------------------------------------------------------------

// POST /contacto {nombre, email, asunto, mensaje, trampa}
// El mensaje queda guardado (se ve en el panel) y además se manda por mail a la fundación.
function enviarContacto(): never {
    $d = cuerpo();
    // "trampa" es un campo invisible: si viene lleno, lo completó un robot. Se le responde "ok" y no se guarda nada.
    if (!empty($d['trampa'])) responder(['ok' => true, 'mensaje' => '¡Gracias! Tu mensaje fue enviado.']);

    $nombre = trim(mb_substr($d['nombre'] ?? '', 0, 190));
    $email = trim(mb_substr($d['email'] ?? '', 0, 190));
    $asunto = trim(mb_substr($d['asunto'] ?? '', 0, 255));
    $mensaje = trim(mb_substr($d['mensaje'] ?? '', 0, 5000));
    $telefono = trim(mb_substr($d['telefono'] ?? '', 0, 40)); // opcional, para poder responder por WhatsApp
    if ($nombre === '' || $asunto === '') error('Completá tu nombre y el asunto.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) error('El correo electrónico no parece válido.');
    if ($telefono !== '' && !preg_match('/^[\d\s()+-]{8,}$/', $telefono)) {
        error('El teléfono no parece válido. Escribí solo números, por ejemplo 381 5134073.');
    }

    // Como mucho 5 mensajes por hora desde la misma conexión
    $recientes = q('SELECT COUNT(*) FROM mensajes WHERE ip = ? AND fecha > ?', [ip(), date('Y-m-d H:i:s', time() - 3600)])->fetchColumn();
    if ($recientes >= 5) error('Ya recibimos varios mensajes tuyos. Probá de nuevo más tarde.', 429);

    q('INSERT INTO mensajes (nombre, email, asunto, mensaje, telefono, fecha, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [$nombre, $email, $asunto, $mensaje, $telefono ?: null, ahora(), ip()]);
    $id = db()->lastInsertId();

    $cuerpo = "Nombre: $nombre\nCorreo: $email\n" . ($telefono ? "Teléfono: $telefono\n" : '') . "Asunto: $asunto\n\n$mensaje\n\n--\nEnviado desde el formulario de mujeresenred.com.ar";
    $encabezados = implode("\r\n", [
        'From: Web Mujeres en Red <' . config('mail_remitente') . '>',
        'Reply-To: ' . $email, // validado arriba: no puede traer saltos de línea
        'Content-Type: text/plain; charset=UTF-8',
    ]);
    $enviado = @mail(config('mail_destino'), '=?UTF-8?B?' . base64_encode("Contacto web: $asunto") . '?=', $cuerpo, $encabezados);
    q('UPDATE mensajes SET enviado = ? WHERE id = ?', [$enviado ? 1 : 0, $id]);

    responder(['ok' => true, 'mensaje' => '¡Gracias! Tu mensaje fue enviado.']);
}

// --- Equipo ----------------------------------------------------------------------------------

const COLORES_EQUIPO = ['rosa', 'celeste', 'verde', 'violeta', 'naranja'];
const REDES_EQUIPO = ['linkedin', 'instagram', 'facebook', 'tiktok'];

function prepararIntegrante(array $m): array {
    $redes = json_decode($m['redes'] ?: '{}', true) ?: [];
    return [
        'id' => (int) $m['id'],
        'nombre' => $m['nombre'],
        'cargo' => $m['cargo'] ?? '',
        'foto' => $m['foto'] ?? '',
        // Una línea de la trayectoria por renglón
        'bio' => array_values(array_filter(array_map('trim', explode("\n", $m['bio'] ?? '')), 'strlen')),
        'redes' => array_intersect_key($redes, array_flip(REDES_EQUIPO)),
        'color' => in_array($m['color'], COLORES_EQUIPO, true) ? $m['color'] : 'rosa',
        'orden' => (int) $m['orden'],
        'publicado' => (bool) $m['publicado'],
    ];
}

// GET /equipo
function listarEquipo(): never {
    responder(array_map('prepararIntegrante', q('SELECT * FROM equipo WHERE publicado = 1 AND borrada IS NULL ORDER BY orden, id')->fetchAll()));
}

// --- Datos de la web: WhatsApp, correo, redes y formas de donar ------------------------------

const AJUSTES = ['whatsapp', 'email', 'instagram', 'facebook', 'twitter', 'linkedin', 'mercadopago', 'paypal', 'qr',
    'transferencia_titular', 'transferencia_alias', 'transferencia_cbu', 'transferencia_cuit', 'transferencia_banco',
    // Números de impacto del inicio: JSON [{numero, texto}] (hasta 4; los que no tienen número no se muestran)
    'impacto',
    // Transparencia (página Doná y pie): razón social, CUIT, personería jurídica y link a la memoria anual
    'razon_social', 'cuit', 'personeria', 'memoria'];

function leerAjustes(): array {
    $guardados = [];
    foreach (q('SELECT clave, valor FROM ajustes')->fetchAll() as $a) $guardados[$a['clave']] = $a['valor'] ?? '';
    $ajustes = [];
    foreach (AJUSTES as $clave) $ajustes[$clave] = $guardados[$clave] ?? '';
    return $ajustes;
}

// GET /ajustes
function verAjustes(): never {
    responder(leerAjustes());
}

// --- Visitas ---------------------------------------------------------------------------------
// Contador propio, sin cookies ni datos personales: no se guarda la IP. Con la IP, el navegador y el día se arma
// un código que cambia cada día; sirve para contar personas distintas en el día, no para saber quién es.

const ORIGENES = [
    'instagram' => '/instagram\./i',
    'facebook' => '/facebook\.|fb\.com|fb\.me/i',
    'whatsapp' => '/whatsapp|wa\.me/i',
    'google' => '/google\./i',
    'tiktok' => '/tiktok\./i',
    'linkedin' => '/linkedin\.|lnkd\.in/i',
    'twitter' => '/twitter\.|t\.co$|x\.com/i',
];

// "Clave secreta" del contador, inventada la primera vez. Va en la tabla ajustes, pero no se muestra (no está en AJUSTES).
function salVisitas(): string {
    $sal = q("SELECT valor FROM ajustes WHERE clave = 'sal_visitas'")->fetchColumn();
    if ($sal) return $sal;
    $sal = bin2hex(random_bytes(16));
    q("INSERT INTO ajustes (clave, valor) VALUES ('sal_visitas', ?)", [$sal]);
    return $sal;
}

// POST /visita {ruta, referrer, entrada}: la web avisa cada página que se abre
function registrarVisita(): never {
    $agente = $_SERVER['HTTP_USER_AGENT'] ?? '';
    // Robots de buscadores, vistas previas de links, etc.: no son personas
    if ($agente === '' || preg_match('/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|curl|wget|python|php/i', $agente)) {
        responder(['ok' => true]);
    }
    $d = cuerpo();
    $ruta = '/' . trim(mb_substr(parse_url((string) ($d['ruta'] ?? '/'), PHP_URL_PATH) ?: '/', 0, 250), '/');
    if (preg_match('#^/(admin|api|uploads)(/|$)#', $ruta)) responder(['ok' => true]);

    // De dónde llegó: solo cuenta en la primera página que abre (después navega dentro de la web)
    $origen = 'interna';
    if (!empty($d['entrada'])) {
        $host = strtolower(parse_url((string) ($d['referrer'] ?? ''), PHP_URL_HOST) ?: '');
        $propio = strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]);
        $origen = 'directo';
        if ($host !== '' && $host !== $propio) {
            $origen = 'otro';
            foreach (ORIGENES as $nombre => $patron) {
                if (preg_match($patron, $host)) {
                    $origen = $nombre;
                    break;
                }
            }
        }
    }
    $dispositivo = match (true) {
        (bool) preg_match('/ipad|tablet/i', $agente) => 'tablet',
        (bool) preg_match('/mobi|android|iphone/i', $agente) => 'celular',
        default => 'computadora',
    };
    $dia = date('Y-m-d');
    $visitante = substr(hash('sha256', ip() . '|' . $agente . '|' . $dia . '|' . salVisitas()), 0, 16);

    // Recargar la misma página varias veces cuenta una sola vez (por media hora)
    $repetida = q('SELECT id FROM visitas WHERE visitante = ? AND ruta = ? AND fecha > ?',
        [$visitante, $ruta, date('Y-m-d H:i:s', time() - 1800)])->fetch();
    if (!$repetida) {
        q('INSERT INTO visitas (fecha, dia, ruta, origen, dispositivo, visitante) VALUES (?, ?, ?, ?, ?, ?)',
            [ahora(), $dia, $ruta, $origen, $dispositivo, $visitante]);
    }
    // De vez en cuando se borra lo de hace más de 2 años, para que la tabla no crezca sin fin
    if (random_int(1, 500) === 1) q('DELETE FROM visitas WHERE dia < ?', [date('Y-m-d', strtotime('-2 years'))]);
    responder(['ok' => true]);
}

// --- Eventos ---------------------------------------------------------------------------------

function prepararEvento(array $e): array {
    return [
        'id' => (int) $e['id'],
        'slug' => $e['slug'],
        'titulo' => $e['titulo'],
        'fecha' => substr($e['fecha'], 0, 10),
        'hora' => $e['hora'] ?? '',
        'lugar' => $e['lugar'] ?? '',
        'descripcion' => $e['descripcion'] ?? '',
        'foto' => $e['foto'] ?? '',
        'link' => $e['link'] ?? '',
        'publicado' => (bool) $e['publicado'],
    ];
}

// GET /eventos?limite=3 -> {proximos: [del más cercano al más lejano], pasados: [los últimos 6]}
function listarEventos(): never {
    $limite = min(max((int) ($_GET['limite'] ?? 50), 1), 50);
    $hoy = date('Y-m-d');
    $base = 'SELECT * FROM eventos WHERE publicado = 1 AND borrada IS NULL';
    responder([
        'proximos' => array_map('prepararEvento', q("$base AND fecha >= ? ORDER BY fecha, id LIMIT $limite", [$hoy])->fetchAll()),
        'pasados' => array_map('prepararEvento', q("$base AND fecha < ? ORDER BY fecha DESC, id DESC LIMIT " . ($limite < 50 ? 6 : 300), [$hoy])->fetchAll()),
    ]);
}

// --- Instituciones que nos acompañan ---------------------------------------------------------

function prepararInstitucion(array $i): array {
    return [
        'id' => (int) $i['id'],
        'nombre' => $i['nombre'],
        'detalle' => $i['detalle'] ?? '',
        'logo' => $i['logo'] ?? '',
        'link' => $i['link'] ?? '',
        'orden' => (int) $i['orden'],
        'publicado' => (bool) $i['publicado'],
    ];
}

// GET /instituciones
function listarInstituciones(): never {
    responder(array_map('prepararInstitucion', q('SELECT * FROM instituciones WHERE publicado = 1 AND borrada IS NULL ORDER BY orden, id')->fetchAll()));
}

// --- Testimonios -----------------------------------------------------------------------------

function prepararTestimonio(array $t): array {
    return [
        'id' => (int) $t['id'],
        'nombre' => $t['nombre'],
        'detalle' => $t['detalle'] ?? '',
        'texto' => $t['texto'],
        'foto' => $t['foto'] ?? '',
        'orden' => (int) $t['orden'],
        'publicado' => (bool) $t['publicado'],
    ];
}

// GET /testimonios
function listarTestimonios(): never {
    responder(array_map('prepararTestimonio', q('SELECT * FROM testimonios WHERE publicado = 1 AND borrada IS NULL ORDER BY orden, id')->fetchAll()));
}

// --- Buscador de toda la web -----------------------------------------------------------------

// "Tucumán Potencia" -> "tucuman potencia": sin tildes, mayúsculas ni etiquetas, para comparar
function normalizarBusqueda(?string $texto): string {
    $t = mb_strtolower(textoPlano($texto ?? ''), 'UTF-8');
    return strtr($t, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n', 'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u']);
}

// Pedacito del texto alrededor de la primera palabra encontrada
function fragmento(string $texto, array $palabras): string {
    $plano = textoPlano($texto);
    $norm = normalizarBusqueda($plano);
    $pos = null;
    foreach ($palabras as $p) {
        $i = mb_strpos($norm, $p);
        if ($i !== false && ($pos === null || $i < $pos)) $pos = $i;
    }
    $desde = max(0, ($pos ?? 0) - 60);
    $trozo = mb_substr($plano, $desde, 180);
    return ($desde > 0 ? '…' : '') . trim($trozo) . (mb_strlen($plano) > $desde + 180 ? '…' : '');
}

// GET /buscar?q=texto : notas, fichas de Qué hacemos, eventos y emprendimientos del catálogo.
// La web tiene poco contenido, así que se compara en PHP (igual en SQLite y MySQL, y sin importar las tildes).
function buscarEnLaWeb(): never {
    $q = trim(mb_substr($_GET['q'] ?? '', 0, 80));
    $palabras = array_values(array_filter(preg_split('/\s+/u', normalizarBusqueda($q)), fn($p) => mb_strlen($p) >= 2));
    if (!$palabras) responder(['q' => $q, 'resultados' => []]);

    $resultados = [];
    // Puntaje: cuenta más si la palabra está en el título
    $probar = function (string $tipo, string $titulo, string $texto, array $extra) use ($palabras, &$resultados) {
        $t = normalizarBusqueda($titulo);
        $todo = $t . ' ' . normalizarBusqueda($texto);
        $puntos = 0;
        foreach ($palabras as $p) {
            if (!str_contains($todo, $p)) return;
            $puntos += str_contains($t, $p) ? 10 : 1;
        }
        $resultados[] = ['tipo' => $tipo, 'titulo' => $titulo, 'resumen' => fragmento($texto ?: $titulo, $palabras), 'puntos' => $puntos] + $extra;
    };

    foreach (q('SELECT slug, titulo, categoria, contenido, foto FROM portfolio WHERE publicada = 1 AND borrada IS NULL')->fetchAll() as $p) {
        $probar('proyecto', $p['titulo'], $p['contenido'], ['url' => "/portfolio/{$p['slug']}", 'foto' => $p['foto'], 'detalle' => $p['categoria']]);
    }
    foreach (q('SELECT slug, titulo, resumen, contenido, foto, fecha FROM notas WHERE publicada = 1 AND borrada IS NULL')->fetchAll() as $n) {
        $probar('nota', $n['titulo'], $n['resumen'] . ' ' . $n['contenido'], ['url' => "/{$n['slug']}", 'foto' => $n['foto'], 'detalle' => iso($n['fecha'])]);
    }
    foreach (q('SELECT titulo, fecha, lugar, descripcion, foto FROM eventos WHERE publicado = 1 AND borrada IS NULL')->fetchAll() as $e) {
        $probar('evento', $e['titulo'], $e['lugar'] . ' ' . $e['descripcion'], ['url' => '/eventos', 'foto' => $e['foto'], 'detalle' => $e['fecha']]);
    }
    foreach (q('SELECT e.nombre, e.descripcion, e.foto, r.nombre AS rubro FROM emprendimientos e JOIN rubros r ON r.id = e.rubro_id
        WHERE e.publicado = 1 AND e.borrada IS NULL AND r.borrada IS NULL')->fetchAll() as $f) {
        $probar('emprendimiento', $f['nombre'], $f['rubro'] . ' ' . $f['descripcion'],
            ['url' => '/catalogo?buscar=' . rawurlencode($f['nombre']), 'foto' => $f['foto'], 'detalle' => $f['rubro']]);
    }

    usort($resultados, fn($a, $b) => $b['puntos'] <=> $a['puntos'] ?: strcmp((string) $b['detalle'], (string) $a['detalle']));
    responder(['q' => $q, 'resultados' => array_slice($resultados, 0, 40)]);
}
