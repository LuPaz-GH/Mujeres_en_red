<?php
// Lo que usa el panel de administración (/admin). Todo pide haber iniciado sesión.
// Borrar nunca borra de verdad: manda a la papelera, y solo una administradora puede eliminar del todo.

// --- Ayuda -----------------------------------------------------------------------------------

// INSERT si no hay $id, UPDATE si hay. Devuelve el id.
function guardarFila(string $tabla, array $datos, ?int $id = null): int {
    $columnas = array_keys($datos);
    if ($id) {
        $set = implode(', ', array_map(fn($c) => "$c = ?", $columnas));
        q("UPDATE $tabla SET $set WHERE id = ?", [...array_values($datos), $id]);
        return $id;
    }
    $marcas = implode(', ', array_fill(0, count($columnas), '?'));
    q("INSERT INTO $tabla (" . implode(', ', $columnas) . ") VALUES ($marcas)", array_values($datos));
    return (int) db()->lastInsertId();
}

// Listado de a 7 por página. $desde es "FROM tabla WHERE ..."; $preparar convierte cada fila.
function paginar(string $desde, array $params, string $orden, callable $preparar, string $columnas = '*'): array {
    $porPagina = min(max((int) ($_GET['por_pagina'] ?? 7), 1), 100);
    $pagina = max((int) ($_GET['pagina'] ?? 1), 1);
    $salto = ($pagina - 1) * $porPagina;
    $total = (int) q("SELECT COUNT(*) $desde", $params)->fetchColumn();
    return [
        'items' => array_map($preparar, q("SELECT $columnas $desde ORDER BY $orden LIMIT $porPagina OFFSET $salto", $params)->fetchAll()),
        'total' => $total,
        'paginas' => max(1, (int) ceil($total / $porPagina)),
    ];
}

function filtroBuscar(array $columnas, array &$donde, array &$params): void {
    $buscar = trim($_GET['buscar'] ?? '');
    if ($buscar === '') return;
    $donde[] = '(' . implode(' OR ', array_map(fn($c) => "$c LIKE ?", $columnas)) . ')';
    array_push($params, ...array_fill(0, count($columnas), "%$buscar%"));
}

// Queda anotado todo lo que se hace en el panel, para que la administradora lo pueda ver
function registrar(array $u, string $accion, string $tipo, ?int $id = null, ?string $titulo = null): void {
    q('INSERT INTO actividad (fecha, usuaria_id, usuaria, accion, tipo, elemento_id, titulo) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ahora(), $u['id'], $u['nombre'], $accion, $tipo, $id, $titulo]);
}

// Qué se puede mandar a la papelera: tipo => [tabla, columna con el nombre]
const PAPELERA = [
    'nota' => ['notas', 'titulo'],
    'proyecto' => ['portfolio', 'titulo'],
    'emprendimiento' => ['emprendimientos', 'nombre'],
    'rubro' => ['rubros', 'nombre'],
    'categoria' => ['categorias', 'nombre'],
    'mensaje' => ['mensajes', 'asunto'],
    'integrante' => ['equipo', 'nombre'],
    'evento' => ['eventos', 'titulo'],
    'institucion' => ['instituciones', 'nombre'],
    'testimonio' => ['testimonios', 'nombre'],
    'cuenta' => ['usuarias', 'nombre'],
];

// Lo que se muestra en "Lo último que pasó" del inicio: cambios en el contenido (no entradas, mensajes leídos ni cuentas)
const TIPOS_NOVEDADES = ['nota', 'proyecto', 'evento', 'institucion', 'testimonio', 'emprendimiento', 'rubro', 'categoria', 'integrante', 'equipo', 'ajustes'];

// Devuelve el nombre del elemento, o null si no existe o no está en ese estado
function nombreDe(string $tipo, int $id, bool $enPapelera = false): ?string {
    [$tabla, $columna] = PAPELERA[$tipo];
    $estado = $enPapelera ? 'IS NOT NULL' : 'IS NULL';
    $nombre = q("SELECT $columna FROM $tabla WHERE id = ? AND borrada $estado", [$id])->fetchColumn();
    return $nombre === false ? null : $nombre;
}

function aPapelera(string $tipo, int $id, array $u): void {
    $nombre = nombreDe($tipo, $id);
    if ($nombre === null) error('No encontramos eso. Puede que ya esté en la papelera.', 404);
    q('UPDATE ' . PAPELERA[$tipo][0] . ' SET borrada = ?, borrada_por = ?, borrada_por_id = ? WHERE id = ?', [ahora(), $u['nombre'], $u['id'], $id]);
    registrar($u, 'mandó a la papelera', $tipo, $id, $nombre);
}

// --- Sesión ----------------------------------------------------------------------------------

// GET /sesion: quién está conectada (o null)
function verSesion(): never {
    responder(['usuaria' => usuaria()]);
}

// POST /sesion {email, clave}
function entrar(): never {
    iniciarSesion();
    $d = cuerpo();
    // Después de 5 intentos fallidos hay que esperar 15 minutos
    $hace15 = date('Y-m-d H:i:s', time() - 900);
    $fallidos = q('SELECT COUNT(*) FROM intentos WHERE ip = ? AND fecha > ?', [ip(), $hace15])->fetchColumn();
    if ($fallidos >= 5) error('Demasiados intentos. Esperá 15 minutos y probá de nuevo.', 429);

    $u = q('SELECT * FROM usuarias WHERE email = ? AND borrada IS NULL', [trim($d['email'] ?? '')])->fetch();
    if (!$u || !password_verify($d['clave'] ?? '', $u['clave'])) {
        q('INSERT INTO intentos (ip, fecha) VALUES (?, ?)', [ip(), ahora()]);
        error('El correo o la contraseña no son correctos.', 401);
    }
    q('DELETE FROM intentos WHERE ip = ? OR fecha < ?', [ip(), $hace15]);
    session_regenerate_id(true);
    $_SESSION['usuaria'] = (int) $u['id'];
    $datos = ['id' => (int) $u['id'], 'email' => $u['email'], 'nombre' => $u['nombre'], 'rol' => $u['rol']];
    registrar($datos, 'entró al panel', 'sesion');
    responder(['usuaria' => $datos]);
}

// DELETE /sesion
function salir(): never {
    iniciarSesion();
    if ($u = usuaria()) registrar($u, 'salió del panel', 'sesion');
    $_SESSION = [];
    session_destroy();
    responder(['ok' => true]);
}

// PUT /admin/clave {actual, nueva}
function cambiarClave(): never {
    $u = requerirUsuaria();
    $d = cuerpo();
    $guardada = q('SELECT clave FROM usuarias WHERE id = ?', [$u['id']])->fetchColumn();
    if (!password_verify($d['actual'] ?? '', $guardada)) error('La contraseña actual no es correcta.');
    if (mb_strlen($d['nueva'] ?? '') < 8) error('La contraseña nueva tiene que tener al menos 8 caracteres.');
    q('UPDATE usuarias SET clave = ? WHERE id = ?', [password_hash($d['nueva'], PASSWORD_DEFAULT), $u['id']]);
    registrar($u, 'cambió su contraseña', 'cuenta', (int) $u['id'], $u['nombre']);
    responder(['ok' => true]);
}

// --- Inicio ----------------------------------------------------------------------------------

// GET /admin/resumen: los números de la primera pantalla del panel
function panelResumen(): never {
    $u = requerirUsuaria();
    $cantidad = fn($tabla, $donde = '1 = 1') => (int) q("SELECT COUNT(*) FROM $tabla WHERE borrada IS NULL AND $donde")->fetchColumn();
    $papelera = 0;
    foreach (PAPELERA as [$tabla]) {
        // Cada voluntaria cuenta solo lo que borró ella
        $mia = $u['rol'] === 'admin' ? [] : [$u['id']];
        $papelera += (int) q("SELECT COUNT(*) FROM $tabla WHERE borrada IS NOT NULL" . ($mia ? ' AND borrada_por_id = ?' : ''), $mia)->fetchColumn();
    }
    responder([
        'notas' => $cantidad('notas'),
        'borradores' => $cantidad('notas', 'publicada = 0'),
        'proyectos' => $cantidad('portfolio'),
        'emprendimientos' => $cantidad('emprendimientos'),
        'mensajes' => $cantidad('mensajes'),
        'no_leidos' => $cantidad('mensajes', 'leido = 0'),
        'equipo' => $cantidad('equipo'),
        'eventos' => $cantidad('eventos', "fecha >= '" . date('Y-m-d') . "'"),
        'papelera' => $papelera,
        'novedades' => array_map(fn($a) => [
            'id' => (int) $a['id'], 'fecha' => iso($a['fecha']), 'usuaria' => $a['usuaria'],
            'accion' => $a['accion'], 'tipo' => $a['tipo'], 'titulo' => $a['titulo'],
        ], q("SELECT * FROM actividad WHERE tipo IN ('" . implode("', '", TIPOS_NOVEDADES) . "') ORDER BY fecha DESC, id DESC LIMIT 6")->fetchAll()),
    ]);
}

// --- Fotos -----------------------------------------------------------------------------------

// POST /admin/fotos (formulario con el archivo en "foto") -> {url}
function subirFoto(): never {
    $u = requerirUsuaria();
    $url = guardarFoto($_FILES['foto'] ?? []);
    registrar($u, 'subió', 'foto', null, $url);
    responder(['url' => $url]);
}

// --- Notas -----------------------------------------------------------------------------------

// GET /admin/notas: igual que el listado público pero incluye borradores
function panelNotas(): never {
    requerirUsuaria();
    $_GET['por_pagina'] ??= 7;
    responder(paginarNotas(false));
}

// GET /admin/notas/{id}
function panelNota(string $id): never {
    requerirUsuaria();
    $fila = q('SELECT * FROM notas WHERE id = ? AND borrada IS NULL', [(int) $id])->fetch();
    if (!$fila) error('No encontramos esa nota', 404);
    responder(prepararNotas([$fila], true)[0]);
}

// POST /admin/notas y PUT /admin/notas/{id}
// {titulo, slug?, fecha?, resumen?, contenido, foto?, autora?, publicada, categorias: [ids], etiquetas: ["nombre", ...]}
function guardarNota(?string $id = null): never {
    $u = requerirUsuaria();
    $id = $id !== null ? (int) $id : null;
    $anterior = $id ? q('SELECT publicada FROM notas WHERE id = ? AND borrada IS NULL', [$id])->fetch() : null;
    if ($id && !$anterior) error('No encontramos esa nota', 404);
    $d = cuerpo();
    $titulo = trim($d['titulo'] ?? '');
    if ($titulo === '') error('La nota necesita un título.');
    $contenido = $d['contenido'] ?? '';
    $fecha = !empty($d['fecha']) ? date('Y-m-d H:i:s', strtotime($d['fecha'])) : ahora();
    $publicada = !empty($d['publicada']) ? 1 : 0;
    $datos = [
        'slug' => slugUnico(($d['slug'] ?? '') ?: $titulo, 'notas', $id),
        'titulo' => $titulo,
        'fecha' => $fecha,
        'modificada' => ahora(),
        'resumen' => trim($d['resumen'] ?? '') ?: recortar(textoPlano($contenido)),
        'contenido' => $contenido,
        'foto' => ($d['foto'] ?? '') ?: null,
        'autora' => trim($d['autora'] ?? '') ?: $u['nombre'],
        'publicada' => $publicada,
    ];

    db()->beginTransaction();
    $nueva = !$id;
    $id = guardarFila('notas', $datos, $id);
    q('DELETE FROM nota_categoria WHERE nota_id = ?', [$id]);
    foreach (array_unique(array_map('intval', $d['categorias'] ?? [])) as $cat) {
        if (q('SELECT id FROM categorias WHERE id = ? AND borrada IS NULL', [$cat])->fetch()) {
            q('INSERT INTO nota_categoria (nota_id, categoria_id) VALUES (?, ?)', [$id, $cat]);
        }
    }
    // Las etiquetas se escriben a mano: si no existe, se crea
    q('DELETE FROM nota_etiqueta WHERE nota_id = ?', [$id]);
    $puestas = [];
    foreach (array_filter(array_map('trim', $d['etiquetas'] ?? [])) as $nombre) {
        $slug = slugify($nombre);
        $tag = (int) q('SELECT id FROM etiquetas WHERE slug = ?', [$slug])->fetchColumn();
        if (!$tag) {
            q('INSERT INTO etiquetas (nombre, slug) VALUES (?, ?)', [$nombre, $slug]);
            $tag = (int) db()->lastInsertId();
        }
        if (isset($puestas[$tag])) continue; // "Mujer" y "mujer" son la misma etiqueta
        $puestas[$tag] = true;
        q('INSERT INTO nota_etiqueta (nota_id, etiqueta_id) VALUES (?, ?)', [$id, $tag]);
    }
    db()->commit();
    registrar($u, accionDeGuardar($nueva, (bool) ($anterior['publicada'] ?? false), (bool) $publicada), 'nota', $id, $titulo);
    panelNota((string) $id);
}

function accionDeGuardar(bool $nueva, bool $antes, bool $ahora): string {
    if ($nueva) return $ahora ? 'creó y publicó' : 'creó como borrador';
    if ($antes === $ahora) return 'editó';
    return $ahora ? 'publicó' : 'pasó a borrador';
}

function borrarNota(string $id): never {
    aPapelera('nota', (int) $id, requerirUsuaria());
    responder(['ok' => true]);
}

// --- Categorías ------------------------------------------------------------------------------

// GET /admin/categorias: todas, con cuántas notas tiene cada una
function panelCategorias(): never {
    requerirUsuaria();
    responder(array_map(fn($c) => ['id' => (int) $c['id'], 'nombre' => $c['nombre'], 'slug' => $c['slug'], 'cantidad' => (int) $c['cantidad']],
        q('SELECT c.id, c.nombre, c.slug, COUNT(n.id) AS cantidad FROM categorias c
            LEFT JOIN nota_categoria nc ON nc.categoria_id = c.id
            LEFT JOIN notas n ON n.id = nc.nota_id AND n.borrada IS NULL
            WHERE c.borrada IS NULL
            GROUP BY c.id, c.nombre, c.slug ORDER BY c.nombre')->fetchAll()));
}

// POST /admin/categorias y PUT /admin/categorias/{id} {nombre}
function guardarCategoria(?string $id = null): never {
    $u = requerirUsuaria();
    $nombre = trim(cuerpo()['nombre'] ?? '');
    if ($nombre === '') error('La categoría necesita un nombre.');
    $guardada = guardarFila('categorias', ['nombre' => $nombre, 'slug' => slugUnico($nombre, 'categorias', $id ? (int) $id : null)], $id ? (int) $id : null);
    registrar($u, $id ? 'editó' : 'creó', 'categoria', $guardada, $nombre);
    panelCategorias();
}

// Las notas no se borran: solo dejan de mostrar esa categoría mientras esté en la papelera
function borrarCategoria(string $id): never {
    aPapelera('categoria', (int) $id, requerirUsuaria());
    panelCategorias();
}

// --- Portfolio -------------------------------------------------------------------------------

function panelPortfolio(): never {
    requerirUsuaria();
    $donde = ['borrada IS NULL'];
    $params = [];
    filtroBuscar(['titulo', 'contenido'], $donde, $params);
    filtroFechas('fecha', $donde, $params);
    responder(paginar('FROM portfolio WHERE ' . implode(' AND ', $donde), $params, 'fecha DESC', 'prepararProyecto'));
}

function panelProyecto(string $id): never {
    requerirUsuaria();
    $p = q('SELECT * FROM portfolio WHERE id = ? AND borrada IS NULL', [(int) $id])->fetch();
    if (!$p) error('No encontramos ese proyecto', 404);
    responder(prepararProyecto($p));
}

// POST /admin/portfolio y PUT /admin/portfolio/{id} {titulo, categoria, slug?, fecha?, contenido, foto?, publicada}
function guardarProyecto(?string $id = null): never {
    $u = requerirUsuaria();
    $id = $id !== null ? (int) $id : null;
    $anterior = $id ? q('SELECT publicada FROM portfolio WHERE id = ? AND borrada IS NULL', [$id])->fetch() : null;
    if ($id && !$anterior) error('No encontramos ese proyecto', 404);
    $d = cuerpo();
    $titulo = trim($d['titulo'] ?? '');
    if ($titulo === '') error('El proyecto necesita un título.');
    $categoria = $d['categoria'] ?? '';
    if (!in_array($categoria, CATEGORIAS_PORTFOLIO, true)) error('Elegí si es un programa, un proyecto o networking.');
    $publicada = !empty($d['publicada']) ? 1 : 0;
    $guardado = guardarFila('portfolio', [
        'slug' => slugUnico(($d['slug'] ?? '') ?: $titulo, 'portfolio', $id),
        'titulo' => $titulo,
        'categoria' => $categoria,
        'fecha' => !empty($d['fecha']) ? date('Y-m-d H:i:s', strtotime($d['fecha'])) : ahora(),
        'contenido' => $d['contenido'] ?? '',
        'foto' => ($d['foto'] ?? '') ?: null,
        'publicada' => $publicada,
    ], $id);
    registrar($u, accionDeGuardar(!$id, (bool) ($anterior['publicada'] ?? false), (bool) $publicada), 'proyecto', $guardado, $titulo);
    panelProyecto((string) $guardado);
}

function borrarProyecto(string $id): never {
    aPapelera('proyecto', (int) $id, requerirUsuaria());
    responder(['ok' => true]);
}

// --- Catálogo: rubros y emprendimientos ------------------------------------------------------

// GET /admin/rubros: todos, con cuántos emprendimientos tiene cada uno
function panelRubros(): never {
    requerirUsuaria();
    $rubros = q('SELECT r.id, r.nombre, r.orden, COUNT(e.id) AS cantidad FROM rubros r
        LEFT JOIN emprendimientos e ON e.rubro_id = r.id AND e.borrada IS NULL
        WHERE r.borrada IS NULL GROUP BY r.id, r.nombre, r.orden ORDER BY r.orden, r.id')->fetchAll();
    responder(array_map(fn($r) => ['id' => (int) $r['id'], 'nombre' => $r['nombre'], 'orden' => (int) $r['orden'], 'cantidad' => (int) $r['cantidad']], $rubros));
}

// GET /admin/emprendimientos?pagina=&buscar=&desde=&hasta=
function panelFichas(): never {
    requerirUsuaria();
    $donde = ['e.borrada IS NULL'];
    $params = [];
    filtroBuscar(['e.nombre', 'e.descripcion', 'r.nombre'], $donde, $params);
    filtroFechas('e.creada', $donde, $params);
    responder(paginar('FROM emprendimientos e JOIN rubros r ON r.id = e.rubro_id WHERE ' . implode(' AND ', $donde), $params,
        'r.orden, r.id, e.orden, e.id', 'prepararFicha', 'e.*, r.nombre AS rubro'));
}

function panelFicha(string $id): never {
    requerirUsuaria();
    $f = q('SELECT e.*, r.nombre AS rubro FROM emprendimientos e JOIN rubros r ON r.id = e.rubro_id
        WHERE e.id = ? AND e.borrada IS NULL', [(int) $id])->fetch();
    if (!$f) error('No encontramos ese emprendimiento', 404);
    responder(prepararFicha($f));
}

// POST /admin/rubros y PUT /admin/rubros/{id} {nombre, orden?}
function guardarRubro(?string $id = null): never {
    $u = requerirUsuaria();
    $d = cuerpo();
    $nombre = trim($d['nombre'] ?? '');
    if ($nombre === '') error('El rubro necesita un nombre.');
    $orden = isset($d['orden']) ? (int) $d['orden'] : (int) q('SELECT COALESCE(MAX(orden), 0) + 1 FROM rubros')->fetchColumn();
    $guardado = guardarFila('rubros', ['nombre' => $nombre, 'orden' => $orden], $id ? (int) $id : null);
    registrar($u, $id ? 'editó' : 'creó', 'rubro', $guardado, $nombre);
    panelRubros();
}

function borrarRubro(string $id): never {
    $u = requerirUsuaria();
    if (q('SELECT COUNT(*) FROM emprendimientos WHERE rubro_id = ? AND borrada IS NULL', [(int) $id])->fetchColumn() > 0) {
        error('Este rubro todavía tiene emprendimientos. Pasalos a otro rubro o borralos primero.', 409);
    }
    aPapelera('rubro', (int) $id, $u);
    panelRubros();
}

// POST /admin/emprendimientos y PUT /admin/emprendimientos/{id}
// {nombre, rubro_id, descripcion, foto?, links: [{url, texto?, tipo?}], publicado, orden?}
function guardarFicha(?string $id = null): never {
    $u = requerirUsuaria();
    $id = $id !== null ? (int) $id : null;
    if ($id && nombreDe('emprendimiento', $id) === null) error('No encontramos ese emprendimiento', 404);
    $d = cuerpo();
    $nombre = trim($d['nombre'] ?? '');
    if ($nombre === '') error('El emprendimiento necesita un nombre.');
    $rubro = (int) ($d['rubro_id'] ?? 0);
    if (!q('SELECT id FROM rubros WHERE id = ? AND borrada IS NULL', [$rubro])->fetch()) error('Elegí un rubro.');

    $links = [];
    foreach ($d['links'] ?? [] as $l) {
        $escrito = trim($l['url'] ?? '');
        if ($escrito === '') continue;
        $url = completarLink($escrito, $l['tipo'] ?? 'web');
        if (!urlValida($url)) error("Este link no parece válido: $escrito");
        $tipo = ($l['tipo'] ?? 'web') === 'web' ? tipoDeLink($url) : $l['tipo'];
        $texto = trim($l['texto'] ?? '') ?: ($tipo === 'whatsapp' && $url !== $escrito ? $escrito : '');
        $links[] = ['tipo' => $tipo, 'url' => $url, 'texto' => $texto];
    }

    $orden = isset($d['orden']) ? (int) $d['orden']
        : (int) q('SELECT COALESCE(MAX(orden), 0) + 1 FROM emprendimientos WHERE rubro_id = ?', [$rubro])->fetchColumn();
    $datos = [
        'rubro_id' => $rubro,
        'nombre' => $nombre,
        'descripcion' => trim($d['descripcion'] ?? ''),
        'foto' => ($d['foto'] ?? '') ?: null,
        'links' => json_encode($links, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'orden' => $orden,
        'publicado' => !empty($d['publicado']) ? 1 : 0,
    ];
    if (!$id) $datos['creada'] = ahora();
    $guardada = guardarFila('emprendimientos', $datos, $id);
    registrar($u, $id ? 'editó' : 'creó', 'emprendimiento', $guardada, $nombre);
    panelFicha((string) $guardada);
}

function borrarFicha(string $id): never {
    aPapelera('emprendimiento', (int) $id, requerirUsuaria());
    responder(['ok' => true]);
}

// La administradora puede escribir "381 5134073", "@usuaria", "algo.com" o un mail: se completa la dirección entera
function completarLink(string $texto, string $tipo): string {
    if (preg_match('#^(https?://|mailto:)#i', $texto)) return $texto;
    if (filter_var($texto, FILTER_VALIDATE_EMAIL)) return "mailto:$texto";

    if ($tipo === 'whatsapp' && preg_match('/^[\d\s()+-]{8,}$/', $texto)) {
        // Formato de WhatsApp en Argentina: 549 + característica + número, sin 0 ni 15
        $numero = preg_replace('/^(00)?(54)?9?0?/', '', preg_replace('/\D/', '', $texto));
        if (strlen($numero) === 12) $numero = preg_replace('/^(\d{2,4})15/', '$1', $numero);
        return "https://wa.me/549$numero";
    }

    $redes = ['instagram' => 'https://www.instagram.com/', 'facebook' => 'https://www.facebook.com/',
        'tiktok' => 'https://www.tiktok.com/@', 'linkedin' => 'https://www.linkedin.com/in/'];
    if (isset($redes[$tipo]) && preg_match('/^@?[\w.-]+$/u', $texto) && !preg_match('/\.(com|ar|net|org)$/i', $texto)) {
        return $redes[$tipo] . ltrim($texto, '@');
    }
    return "https://$texto";
}

function tipoDeLink(string $url): string {
    return match (true) {
        (bool) preg_match('/wa\.link|wa\.me|whatsapp/i', $url) => 'whatsapp',
        (bool) preg_match('/instagram\.com/i', $url) => 'instagram',
        (bool) preg_match('/facebook\.com|fb\.com/i', $url) => 'facebook',
        (bool) preg_match('/tiktok\.com/i', $url) => 'tiktok',
        (bool) preg_match('/^mailto:/i', $url) => 'email',
        (bool) preg_match('/linkedin\.com/i', $url) => 'linkedin',
        default => 'web',
    };
}

// --- Mensajes de contacto --------------------------------------------------------------------

function panelMensajes(): never {
    requerirUsuaria();
    $donde = ['borrada IS NULL'];
    $params = [];
    filtroBuscar(['nombre', 'email', 'asunto', 'mensaje'], $donde, $params);
    filtroFechas('fecha', $donde, $params);
    responder(paginar('FROM mensajes WHERE ' . implode(' AND ', $donde), $params, 'fecha DESC, id DESC', fn($m) => [
        'id' => (int) $m['id'], 'nombre' => $m['nombre'], 'email' => $m['email'], 'asunto' => $m['asunto'],
        'mensaje' => $m['mensaje'], 'telefono' => $m['telefono'] ?? '', 'fecha' => iso($m['fecha']), 'leido' => (bool) $m['leido'],
    ]) + ['no_leidos' => (int) q('SELECT COUNT(*) FROM mensajes WHERE leido = 0 AND borrada IS NULL')->fetchColumn()]);
}

// PUT /admin/mensajes/{id} {leido}
function marcarMensaje(string $id): never {
    $u = requerirUsuaria();
    $asunto = nombreDe('mensaje', (int) $id);
    if ($asunto === null) error('No encontramos ese mensaje', 404);
    $leido = !empty(cuerpo()['leido']);
    q('UPDATE mensajes SET leido = ? WHERE id = ?', [$leido ? 1 : 0, (int) $id]);
    registrar($u, $leido ? 'leyó' : 'marcó como no leído', 'mensaje', (int) $id, $asunto);
    responder(['ok' => true]);
}

function borrarMensaje(string $id): never {
    aPapelera('mensaje', (int) $id, requerirUsuaria());
    responder(['ok' => true]);
}

// --- Equipo ----------------------------------------------------------------------------------

// GET /admin/equipo: todas las integrantes, en el orden en que se ven en la web (son pocas: sin páginas)
function panelEquipo(): never {
    requerirUsuaria();
    responder(array_map('prepararIntegrante', q('SELECT * FROM equipo WHERE borrada IS NULL ORDER BY orden, id')->fetchAll()));
}

function panelIntegrante(string $id): never {
    requerirUsuaria();
    $m = q('SELECT * FROM equipo WHERE id = ? AND borrada IS NULL', [(int) $id])->fetch();
    if (!$m) error('No encontramos a esa integrante', 404);
    responder(prepararIntegrante($m));
}

// POST /admin/equipo y PUT /admin/equipo/{id} {nombre, cargo, foto, bio: [líneas], redes: {linkedin, instagram, ...}, color, publicado}
function guardarIntegrante(?string $id = null): never {
    $u = requerirUsuaria();
    $id = $id !== null ? (int) $id : null;
    if ($id && nombreDe('integrante', $id) === null) error('No encontramos a esa integrante', 404);
    $d = cuerpo();
    $nombre = trim(mb_substr($d['nombre'] ?? '', 0, 190));
    if ($nombre === '') error('Escribí el nombre de la integrante.');
    $color = $d['color'] ?? '';
    if (!in_array($color, COLORES_EQUIPO, true)) error('Elegí un color para la tarjeta.');

    $bio = is_array($d['bio'] ?? null) ? $d['bio'] : explode("\n", (string) ($d['bio'] ?? ''));
    $bio = array_values(array_filter(array_map(fn($l) => trim(mb_substr((string) $l, 0, 255)), $bio), 'strlen'));

    $redes = [];
    foreach (REDES_EQUIPO as $red) {
        $escrito = trim($d['redes'][$red] ?? '');
        if ($escrito === '') continue;
        $url = completarLink($escrito, $red);
        if (!urlValida($url)) error("Este link no parece válido: $escrito");
        $redes[$red] = $url;
    }

    $datos = [
        'nombre' => $nombre,
        'cargo' => trim(mb_substr($d['cargo'] ?? '', 0, 190)),
        'foto' => ($d['foto'] ?? '') ?: null,
        'bio' => implode("\n", $bio),
        'redes' => json_encode((object) $redes, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'color' => $color,
        'publicado' => !empty($d['publicado']) ? 1 : 0,
    ];
    if (!$id) $datos['orden'] = (int) q('SELECT COALESCE(MAX(orden), 0) + 1 FROM equipo')->fetchColumn();
    $guardada = guardarFila('equipo', $datos, $id);
    registrar($u, $id ? 'editó' : 'agregó', 'integrante', $guardada, $nombre);
    panelIntegrante((string) $guardada);
}

function borrarIntegrante(string $id): never {
    aPapelera('integrante', (int) $id, requerirUsuaria());
    responder(['ok' => true]);
}

// PUT /admin/equipo/orden {ids: [3, 1, 2]}: el orden en que aparecen en la web
function ordenarEquipo(): never {
    $u = requerirUsuaria();
    $ids = array_map('intval', cuerpo()['ids'] ?? []);
    foreach ($ids as $i => $id) q('UPDATE equipo SET orden = ? WHERE id = ?', [$i + 1, $id]);
    registrar($u, 'cambió el orden del equipo', 'equipo');
    panelEquipo();
}

// --- Eventos ---------------------------------------------------------------------------------

// GET /admin/eventos?pagina=&buscar=&desde=&hasta=: primero los próximos (el más cercano arriba), después los pasados
function panelEventos(): never {
    requerirUsuaria();
    $donde = ['borrada IS NULL'];
    $params = [];
    filtroBuscar(['titulo', 'lugar', 'descripcion'], $donde, $params);
    // La fecha del evento es solo día (sin hora): se compara día con día
    foreach (['desde' => '>=', 'hasta' => '<='] as $filtro => $signo) {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET[$filtro] ?? '')) {
            $donde[] = "fecha $signo ?";
            $params[] = $_GET[$filtro];
        }
    }
    $hoy = date('Y-m-d');
    responder(paginar('FROM eventos WHERE ' . implode(' AND ', $donde), $params,
        "CASE WHEN fecha >= '$hoy' THEN 0 ELSE 1 END, CASE WHEN fecha >= '$hoy' THEN fecha END, fecha DESC, id DESC", 'prepararEvento'));
}

function panelEvento(string $id): never {
    requerirUsuaria();
    $e = q('SELECT * FROM eventos WHERE id = ? AND borrada IS NULL', [(int) $id])->fetch();
    if (!$e) error('No encontramos ese evento', 404);
    responder(prepararEvento($e));
}

// POST /admin/eventos y PUT /admin/eventos/{id} {titulo, fecha (AAAA-MM-DD), hora, lugar, descripcion, foto, link, publicado}
function guardarEvento(?string $id = null): never {
    $u = requerirUsuaria();
    $id = $id !== null ? (int) $id : null;
    if ($id && nombreDe('evento', $id) === null) error('No encontramos ese evento', 404);
    $d = cuerpo();
    $titulo = trim(mb_substr($d['titulo'] ?? '', 0, 255));
    if ($titulo === '') error('El evento necesita un nombre.');
    $fecha = $d['fecha'] ?? '';
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha) || !strtotime($fecha)) error('Elegí la fecha del evento.');
    $link = trim($d['link'] ?? '');
    if ($link !== '') {
        $link = completarLink($link, 'web');
        if (!urlValida($link)) error('El link de inscripción no parece válido.');
    }
    $publicado = !empty($d['publicado']) ? 1 : 0;
    $guardado = guardarFila('eventos', [
        'slug' => slugUnico(($d['slug'] ?? '') ?: $titulo, 'eventos', $id),
        'titulo' => $titulo,
        'fecha' => $fecha,
        'hora' => trim(mb_substr($d['hora'] ?? '', 0, 60)),
        'lugar' => trim(mb_substr($d['lugar'] ?? '', 0, 255)),
        'descripcion' => trim(mb_substr($d['descripcion'] ?? '', 0, 5000)),
        'foto' => ($d['foto'] ?? '') ?: null,
        'link' => $link ?: null,
        'publicado' => $publicado,
    ], $id);
    registrar($u, $id ? 'editó' : 'creó', 'evento', $guardado, $titulo);
    panelEvento((string) $guardado);
}

function borrarEvento(string $id): never {
    aPapelera('evento', (int) $id, requerirUsuaria());
    responder(['ok' => true]);
}

// --- Instituciones que nos acompañan ---------------------------------------------------------

// GET /admin/instituciones: todas, en el orden en que se ven en la web (son pocas: sin páginas)
function panelInstituciones(): never {
    requerirUsuaria();
    responder(array_map('prepararInstitucion', q('SELECT * FROM instituciones WHERE borrada IS NULL ORDER BY orden, id')->fetchAll()));
}

function panelInstitucion(string $id): never {
    requerirUsuaria();
    $i = q('SELECT * FROM instituciones WHERE id = ? AND borrada IS NULL', [(int) $id])->fetch();
    if (!$i) error('No encontramos esa institución', 404);
    responder(prepararInstitucion($i));
}

// POST /admin/instituciones y PUT /admin/instituciones/{id} {nombre, detalle, logo, link, publicado}
function guardarInstitucion(?string $id = null): never {
    $u = requerirUsuaria();
    $id = $id !== null ? (int) $id : null;
    if ($id && nombreDe('institucion', $id) === null) error('No encontramos esa institución', 404);
    $d = cuerpo();
    $nombre = trim(mb_substr($d['nombre'] ?? '', 0, 190));
    if ($nombre === '') error('Escribí el nombre de la institución.');
    $link = trim($d['link'] ?? '');
    if ($link !== '') {
        $link = completarLink($link, 'web');
        if (!urlValida($link)) error('El link no parece válido.');
    }
    $datos = [
        'nombre' => $nombre,
        'detalle' => trim(mb_substr($d['detalle'] ?? '', 0, 255)) ?: null,
        'logo' => ($d['logo'] ?? '') ?: null,
        'link' => $link ?: null,
        'publicado' => !empty($d['publicado']) ? 1 : 0,
    ];
    if (!$id) $datos['orden'] = (int) q('SELECT COALESCE(MAX(orden), 0) + 1 FROM instituciones')->fetchColumn();
    $guardada = guardarFila('instituciones', $datos, $id);
    registrar($u, $id ? 'editó' : 'agregó', 'institucion', $guardada, $nombre);
    panelInstitucion((string) $guardada);
}

function borrarInstitucion(string $id): never {
    aPapelera('institucion', (int) $id, requerirUsuaria());
    responder(['ok' => true]);
}

// PUT /admin/instituciones/orden {ids: [3, 1, 2]}
function ordenarInstituciones(): never {
    $u = requerirUsuaria();
    foreach (array_map('intval', cuerpo()['ids'] ?? []) as $i => $id) q('UPDATE instituciones SET orden = ? WHERE id = ?', [$i + 1, $id]);
    registrar($u, 'cambió el orden de las instituciones', 'institucion');
    panelInstituciones();
}

// --- Testimonios -----------------------------------------------------------------------------

function panelTestimonios(): never {
    requerirUsuaria();
    responder(array_map('prepararTestimonio', q('SELECT * FROM testimonios WHERE borrada IS NULL ORDER BY orden, id')->fetchAll()));
}

function panelTestimonio(string $id): never {
    requerirUsuaria();
    $t = q('SELECT * FROM testimonios WHERE id = ? AND borrada IS NULL', [(int) $id])->fetch();
    if (!$t) error('No encontramos ese testimonio', 404);
    responder(prepararTestimonio($t));
}

// POST /admin/testimonios y PUT /admin/testimonios/{id} {nombre, detalle, texto, foto, publicado}
function guardarTestimonio(?string $id = null): never {
    $u = requerirUsuaria();
    $id = $id !== null ? (int) $id : null;
    if ($id && nombreDe('testimonio', $id) === null) error('No encontramos ese testimonio', 404);
    $d = cuerpo();
    $nombre = trim(mb_substr($d['nombre'] ?? '', 0, 190));
    $texto = trim(mb_substr($d['texto'] ?? '', 0, 600));
    if ($nombre === '') error('Escribí el nombre de quien da el testimonio.');
    if ($texto === '') error('Escribí lo que dijo.');
    $datos = [
        'nombre' => $nombre,
        'detalle' => trim(mb_substr($d['detalle'] ?? '', 0, 255)) ?: null,
        'texto' => trim($texto, " \"“”"),
        'foto' => ($d['foto'] ?? '') ?: null,
        'publicado' => !empty($d['publicado']) ? 1 : 0,
    ];
    if (!$id) $datos['orden'] = (int) q('SELECT COALESCE(MAX(orden), 0) + 1 FROM testimonios')->fetchColumn();
    $guardado = guardarFila('testimonios', $datos, $id);
    registrar($u, $id ? 'editó' : 'agregó', 'testimonio', $guardado, $nombre);
    panelTestimonio((string) $guardado);
}

function borrarTestimonio(string $id): never {
    aPapelera('testimonio', (int) $id, requerirUsuaria());
    responder(['ok' => true]);
}

// PUT /admin/testimonios/orden {ids: [3, 1, 2]}
function ordenarTestimonios(): never {
    $u = requerirUsuaria();
    foreach (array_map('intval', cuerpo()['ids'] ?? []) as $i => $id) q('UPDATE testimonios SET orden = ? WHERE id = ?', [$i + 1, $id]);
    registrar($u, 'cambió el orden de los testimonios', 'testimonio');
    panelTestimonios();
}

// --- Datos de la web (solo administradoras) --------------------------------------------------

// GET /admin/ajustes
function panelAjustes(): never {
    requerirAdmin();
    responder(leerAjustes());
}

// PUT /admin/ajustes {whatsapp, email, instagram, ...}: lo que queda vacío deja de mostrarse en la web
function guardarAjustes(): never {
    $u = requerirAdmin();
    $d = cuerpo();
    $nuevos = [];
    foreach (AJUSTES as $clave) {
        if ($clave === 'impacto') {
            // Llega como lista [{numero, texto}]; se guarda como JSON. Número: "14", "+2.000", "95%"
            $lista = is_array($d['impacto'] ?? null) ? $d['impacto'] : (json_decode((string) ($d['impacto'] ?? ''), true) ?: []);
            $limpia = [];
            foreach (array_slice($lista, 0, 4) as $item) {
                $numero = trim(mb_substr((string) ($item['numero'] ?? ''), 0, 12));
                $texto = trim(mb_substr((string) ($item['texto'] ?? ''), 0, 80));
                if ($numero !== '' && !preg_match('/^\+?\d[\d.,]*\s?[%+]?$/u', $numero)) error("En los números de impacto, \"$numero\" no es un número. Ejemplos: 14, +2.000, 95%.");
                if ($numero !== '' && $texto === '') error("Al número $numero le falta el texto que lo explica.");
                $limpia[] = ['numero' => $numero, 'texto' => $texto];
            }
            $nuevos[$clave] = json_encode($limpia, JSON_UNESCAPED_UNICODE);
            continue;
        }
        $valor = trim(mb_substr((string) ($d[$clave] ?? ''), 0, 500));
        if ($valor !== '') {
            switch ($clave) {
                case 'cuit':
                    if (!preg_match('/^\d{2}-?\d{8}-?\d$/', $valor)) error('El CUIT tiene que tener 11 números, por ejemplo 30-12345678-9.');
                    break;
                case 'memoria':
                    $url = completarLink($valor, 'web');
                    if (!urlValida($url)) error('El link de la memoria anual no parece válido.');
                    $valor = $url;
                    break;
                case 'whatsapp':
                    if (!preg_match('/^[\d\s()+-]{8,}$/', $valor)) error('El WhatsApp tiene que ser un número, por ejemplo 381 641-0228.');
                    break;
                case 'email':
                    if (!filter_var($valor, FILTER_VALIDATE_EMAIL)) error('El correo no parece válido.');
                    break;
                case 'instagram':
                case 'facebook':
                case 'twitter':
                case 'linkedin':
                case 'mercadopago':
                case 'paypal':
                    $url = in_array($clave, ['instagram', 'facebook'], true) ? completarLink($valor, $clave) : completarLink($valor, 'web');
                    if (!urlValida($url)) error("Este link no parece válido: $valor");
                    $valor = $url;
                    break;
                case 'qr':
                    if (!preg_match('#^(/|https?://)#', $valor)) error('La imagen del QR no es válida. Volvé a subirla.');
                    break;
            }
        }
        $nuevos[$clave] = $valor;
    }
    foreach ($nuevos as $clave => $valor) {
        $existe = q('SELECT clave FROM ajustes WHERE clave = ?', [$clave])->fetch();
        q($existe ? 'UPDATE ajustes SET valor = ? WHERE clave = ?' : 'INSERT INTO ajustes (valor, clave) VALUES (?, ?)', [$valor, $clave]);
    }
    registrar($u, 'editó los datos de la web', 'ajustes');
    responder(leerAjustes());
}

// --- Visitas (solo administradoras) ----------------------------------------------------------

// "/mi-nota" -> "Nota: Título de la nota", "/portfolio/coaching" -> "Qué hacemos: Coaching Fest"
function nombreDeRuta(string $ruta): string {
    $fijas = ['/' => 'Inicio', '/quienes-somos' => 'Quiénes somos', '/portfolio' => 'Qué hacemos', '/equipo' => 'Equipo',
        '/blog' => 'Blog', '/catalogo' => 'Catálogo', '/contacto' => 'Contacto', '/donar' => 'Doná'];
    if (isset($fijas[$ruta])) return $fijas[$ruta];
    if (preg_match('#^/portfolio/([\w-]+)$#', $ruta, $m)) {
        $titulo = q('SELECT titulo FROM portfolio WHERE slug = ?', [$m[1]])->fetchColumn();
        return 'Qué hacemos: ' . ($titulo ?: $m[1]);
    }
    if (preg_match('#^/([\w-]+)$#', $ruta, $m)) {
        $titulo = q('SELECT titulo FROM notas WHERE slug = ?', [$m[1]])->fetchColumn()
            ?: q('SELECT titulo FROM paginas WHERE slug = ?', [$m[1]])->fetchColumn();
        if ($titulo) return $titulo;
    }
    return $ruta;
}

// GET /admin/visitas?dias=30: todo lo que muestran los gráficos, para los últimos N días (hoy incluido)
function panelVisitas(): never {
    requerirAdmin();
    $dias = in_array((int) ($_GET['dias'] ?? 30), [7, 30, 90, 365], true) ? (int) $_GET['dias'] : 30;
    $desde = date('Y-m-d', strtotime('-' . ($dias - 1) . ' days'));
    $hoy = date('Y-m-d');

    // Un renglón por día, también los días sin visitas (para que el gráfico no tenga huecos)
    $contados = [];
    foreach (q('SELECT dia, COUNT(*) AS visitas, COUNT(DISTINCT visitante) AS personas FROM visitas WHERE dia >= ? GROUP BY dia', [$desde])->fetchAll() as $f) {
        $contados[substr($f['dia'], 0, 10)] = ['visitas' => (int) $f['visitas'], 'personas' => (int) $f['personas']];
    }
    $porDia = [];
    for ($t = strtotime($desde); $t <= strtotime($hoy); $t = strtotime('+1 day', $t)) {
        $dia = date('Y-m-d', $t);
        $porDia[] = ['dia' => $dia] + ($contados[$dia] ?? ['visitas' => 0, 'personas' => 0]);
    }

    $grupo = fn(string $columna, string $extra = '') => array_map(
        fn($f) => [$columna => $f[$columna], 'visitas' => (int) $f['visitas']],
        q("SELECT $columna, COUNT(*) AS visitas FROM visitas WHERE dia >= ? $extra GROUP BY $columna ORDER BY visitas DESC LIMIT 10", [$desde])->fetchAll()
    );

    responder([
        'dias' => $dias,
        'visitas' => array_sum(array_column($porDia, 'visitas')),
        // Personas distintas: se suman las de cada día (el código cambia todos los días), así que es aproximado
        'personas' => array_sum(array_column($porDia, 'personas')),
        'hoy' => end($porDia)['visitas'],
        'por_dia' => $porDia,
        'paginas' => array_map(fn($p) => $p + ['nombre' => nombreDeRuta($p['ruta'])], $grupo('ruta')),
        'origenes' => $grupo('origen', "AND origen <> 'interna'"),
        'dispositivos' => $grupo('dispositivo'),
    ]);
}

// --- Cuentas (solo administradoras) ----------------------------------------------------------

function prepararCuenta(array $c): array {
    return ['id' => (int) $c['id'], 'nombre' => $c['nombre'], 'email' => $c['email'], 'rol' => $c['rol'], 'creada' => iso($c['creada'])];
}

function panelCuentas(): never {
    requerirAdmin();
    $donde = ['borrada IS NULL'];
    $params = [];
    filtroBuscar(['nombre', 'email'], $donde, $params);
    filtroFechas('creada', $donde, $params);
    responder(paginar('FROM usuarias WHERE ' . implode(' AND ', $donde), $params, 'nombre', 'prepararCuenta'));
}

function panelCuenta(string $id): never {
    requerirAdmin();
    $c = q('SELECT * FROM usuarias WHERE id = ? AND borrada IS NULL', [(int) $id])->fetch();
    if (!$c) error('No encontramos esa cuenta', 404);
    responder(prepararCuenta($c));
}

function otrasAdmins(int $id): int {
    return (int) q("SELECT COUNT(*) FROM usuarias WHERE rol = 'admin' AND borrada IS NULL AND id <> ?", [$id])->fetchColumn();
}

// POST /admin/usuarias y PUT /admin/usuarias/{id} {nombre, email, rol, clave?}
function guardarCuenta(?string $id = null): never {
    $u = requerirAdmin();
    $id = $id !== null ? (int) $id : null;
    if ($id && nombreDe('cuenta', $id) === null) error('No encontramos esa cuenta', 404);
    $d = cuerpo();
    $nombre = trim($d['nombre'] ?? '');
    $email = trim($d['email'] ?? '');
    $rol = ($d['rol'] ?? '') === 'admin' ? 'admin' : 'empleada';
    $clave = $d['clave'] ?? '';
    if ($nombre === '') error('La cuenta necesita un nombre.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) error('El correo electrónico no parece válido.');
    if ((!$id || $clave !== '') && mb_strlen($clave) < 8) error('La contraseña tiene que tener al menos 8 caracteres.');
    if ($id && $rol !== 'admin' && !otrasAdmins($id)) error('Tiene que quedar al menos una administradora.');
    $repetida = q('SELECT borrada FROM usuarias WHERE email = ? AND id <> ?', [$email, $id ?? 0])->fetch();
    if ($repetida) {
        error($repetida['borrada'] ? 'Ese correo es de una cuenta que está en la papelera. Restaurala desde ahí.' : 'Ya hay una cuenta con ese correo.', 409);
    }

    $datos = ['nombre' => $nombre, 'email' => $email, 'rol' => $rol];
    if ($clave !== '') $datos['clave'] = password_hash($clave, PASSWORD_DEFAULT);
    if (!$id) $datos['creada'] = ahora();
    $guardada = guardarFila('usuarias', $datos, $id);
    registrar($u, $id ? ($clave !== '' ? 'editó y cambió la contraseña de' : 'editó') : 'creó', 'cuenta', $guardada, $nombre);
    responder(prepararCuenta(q('SELECT * FROM usuarias WHERE id = ?', [$guardada])->fetch()));
}

function borrarCuenta(string $id): never {
    $u = requerirAdmin();
    if ((int) $id === (int) $u['id']) error('No podés borrar tu propia cuenta.');
    if (!otrasAdmins((int) $id)) error('Tiene que quedar al menos una administradora.');
    aPapelera('cuenta', (int) $id, $u);
    responder(['ok' => true]);
}

// --- Actividad (solo administradoras) --------------------------------------------------------

// GET /admin/actividad?pagina=&buscar=&desde=&hasta=&usuaria=
function panelActividad(): never {
    requerirAdmin();
    $donde = ['1 = 1'];
    $params = [];
    filtroBuscar(['usuaria', 'titulo', 'accion'], $donde, $params);
    filtroFechas('fecha', $donde, $params);
    if ($cuenta = (int) ($_GET['usuaria'] ?? 0)) {
        $donde[] = 'usuaria_id = ?';
        $params[] = $cuenta;
    }
    responder(paginar('FROM actividad WHERE ' . implode(' AND ', $donde), $params, 'fecha DESC, id DESC', fn($a) => [
        'id' => (int) $a['id'], 'fecha' => iso($a['fecha']), 'usuaria' => $a['usuaria'],
        'accion' => $a['accion'], 'tipo' => $a['tipo'], 'titulo' => $a['titulo'],
    ]));
}

// --- Papelera --------------------------------------------------------------------------------
// Cada voluntaria ve y recupera lo que borró ella. Las administradoras ven todo, y solo ellas eliminan del todo.

// GET /admin/papelera?pagina=&tipo=&buscar=&desde=&hasta= (las fechas son las del borrado)
function panelPapelera(): never {
    $u = requerirUsuaria();
    $partes = [];
    foreach (PAPELERA as $tipo => [$tabla, $columna]) {
        $partes[] = "SELECT '$tipo' AS tipo, id, $columna AS titulo, borrada, borrada_por, borrada_por_id FROM $tabla WHERE borrada IS NOT NULL";
    }
    $donde = ['1 = 1'];
    $params = [];
    if ($u['rol'] !== 'admin') {
        $donde[] = 'borrada_por_id = ?';
        $params[] = $u['id'];
    }
    filtroBuscar(['titulo', 'borrada_por'], $donde, $params);
    filtroFechas('borrada', $donde, $params);
    if (isset(PAPELERA[$_GET['tipo'] ?? ''])) {
        $donde[] = 'tipo = ?';
        $params[] = $_GET['tipo'];
    }
    responder(paginar('FROM (' . implode(' UNION ALL ', $partes) . ') p WHERE ' . implode(' AND ', $donde), $params, 'borrada DESC, id DESC', fn($f) => [
        'tipo' => $f['tipo'], 'id' => (int) $f['id'], 'titulo' => $f['titulo'],
        'borrada' => iso($f['borrada']), 'borrada_por' => $f['borrada_por'],
    ]));
}

function enPapelera(string $tipo, string $id): string {
    if (!isset(PAPELERA[$tipo])) error('No existe esa dirección', 404);
    $nombre = nombreDe($tipo, (int) $id, true);
    if ($nombre === null) error('Eso ya no está en la papelera.', 404);
    return $nombre;
}

// POST /admin/papelera/{tipo}/{id}: lo vuelve a poner en su lugar
function restaurar(string $tipo, string $id): never {
    $u = requerirUsuaria();
    $nombre = enPapelera($tipo, $id);
    if ($u['rol'] !== 'admin' && (int) q('SELECT borrada_por_id FROM ' . PAPELERA[$tipo][0] . ' WHERE id = ?', [(int) $id])->fetchColumn() !== (int) $u['id']) {
        error('Solo podés recuperar lo que borraste vos.', 403);
    }
    if ($tipo === 'emprendimiento') {
        $rubro = q('SELECT r.borrada FROM rubros r JOIN emprendimientos e ON e.rubro_id = r.id WHERE e.id = ?', [(int) $id])->fetchColumn();
        if ($rubro) error('Su rubro también está en la papelera. Restaurá primero el rubro.', 409);
    }
    q('UPDATE ' . PAPELERA[$tipo][0] . ' SET borrada = NULL, borrada_por = NULL, borrada_por_id = NULL WHERE id = ?', [(int) $id]);
    registrar($u, 'restauró', $tipo, (int) $id, $nombre);
    responder(['ok' => true]);
}

// DELETE /admin/papelera/{tipo}/{id}: lo elimina del todo. Esto sí que no tiene vuelta atrás.
function eliminarDefinitivo(string $tipo, string $id): never {
    $u = requerirAdmin();
    $nombre = enPapelera($tipo, $id);
    if ($tipo === 'rubro' && q('SELECT COUNT(*) FROM emprendimientos WHERE rubro_id = ?', [(int) $id])->fetchColumn() > 0) {
        error('Hay emprendimientos de este rubro en la papelera. Eliminalos primero.', 409);
    }
    q('DELETE FROM ' . PAPELERA[$tipo][0] . ' WHERE id = ?', [(int) $id]);
    registrar($u, 'eliminó definitivamente', $tipo, (int) $id, $nombre);
    responder(['ok' => true]);
}
