<?php
// Carga en la base de datos el contenido que se sacó de WordPress (contenido/*.json) y cambia las direcciones
// de las fotos para que apunten a /uploads. La usan herramientas/importar-contenido.php (en la compu)
// e instalar.php (en el hosting, desde el navegador). Las tablas tienen que existir y estar vacías.

// https://mujeresenred.com.ar/wp-content/uploads/2025/04/foto-1024x768.jpg -> /uploads/2025/04/foto.jpg
// Si la foto no está en uploads/, se deja como estaba y se anota en $sinFoto.
function fotoLocal(?string $url, array &$sinFoto = []): ?string {
    if (!$url || !preg_match('#^https?://(?:www\.)?mujeresenred\.com\.ar/wp-content/uploads/(.+)$#', $url, $m)) return $url;
    $rel = urldecode($m[1]);
    foreach ([preg_replace('/-(\d+x\d+|scaled)(\.\w+)$/', '$2', $rel), $rel] as $intento) {
        if (is_file(RAIZ . "/uploads/$intento")) {
            return config('uploads_url') . '/' . implode('/', array_map('rawurlencode', explode('/', $intento)));
        }
    }
    $sinFoto[$url] = true;
    return $url;
}

function fotosLocales(?string $html, array &$sinFoto = []): ?string {
    // Las fotos del tema de WordPress que usa "Qué hacemos" están copiadas en uploads/sitio
    $html = preg_replace('#https?://(?:www\.)?mujeresenred\.com\.ar/wp-content/themes/[^"\'\s)]*/([^/"\'\s)]+\.jpg)#',
        config('uploads_url') . '/sitio/$1', $html ?? '');
    return preg_replace_callback('#https?://(?:www\.)?mujeresenred\.com\.ar/wp-content/uploads/[^"\'\s)]+#',
        function ($m) use (&$sinFoto) { return fotoLocal($m[0], $sinFoto); }, $html ?? '');
}

// Devuelve cuánto cargó: ['notas' => 27, ..., 'sin_foto' => [urls que siguen apuntando a WordPress]]
function importarContenido(string $dir): array {
    $leer = function (string $archivo) use ($dir) {
        $datos = json_decode((string) @file_get_contents("$dir/$archivo"), true);
        if (!is_array($datos)) throw new RuntimeException("No se pudo leer contenido/$archivo");
        return $datos;
    };
    $fecha = fn($iso) => str_replace('T', ' ', $iso);
    $sinFoto = [];

    db()->beginTransaction();
    try {
        // Categorías, etiquetas y notas (se mantienen los mismos números que en WordPress)
        foreach ($leer('categorias.json') as $c) {
            q('INSERT INTO categorias (id, nombre, slug) VALUES (?, ?, ?)', [$c['id'], $c['nombre'], $c['slug']]);
        }
        foreach ($leer('etiquetas.json') as $t) {
            q('INSERT INTO etiquetas (id, nombre, slug) VALUES (?, ?, ?)', [$t['id'], $t['nombre'], $t['slug']]);
        }
        $notas = $leer('notas.json');
        foreach ($notas as $n) {
            q('INSERT INTO notas (id, slug, titulo, fecha, modificada, resumen, contenido, foto, autora, publicada)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)', [
                $n['id'], $n['slug'], $n['titulo'], $fecha($n['fecha']), $fecha($n['modificada']),
                preg_replace('/\s*\[…\]$/u', '…', $n['resumen']), // WordPress cortaba con "[…]"
                fotosLocales($n['contenido'], $sinFoto), fotoLocal($n['foto'], $sinFoto), $n['autora'],
            ]);
            foreach (array_unique($n['categorias']) as $c) q('INSERT INTO nota_categoria (nota_id, categoria_id) VALUES (?, ?)', [$n['id'], $c]);
            foreach (array_unique($n['etiquetas']) as $t) q('INSERT INTO nota_etiqueta (nota_id, etiqueta_id) VALUES (?, ?)', [$n['id'], $t]);
        }

        // Qué hacemos (portfolio) y páginas sueltas
        $portfolio = $leer('portfolio.json');
        foreach ($portfolio as $p) {
            q('INSERT INTO portfolio (id, slug, titulo, categoria, fecha, contenido, foto, publicada) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
                [$p['id'], $p['slug'], $p['titulo'], $p['categoria'] ?? 'proyecto', $fecha($p['fecha']),
                    fotosLocales($p['contenido'], $sinFoto), fotoLocal($p['foto'], $sinFoto)]);
        }
        $paginas = $leer('paginas.json');
        foreach ($paginas as $p) {
            q('INSERT INTO paginas (id, slug, titulo, contenido) VALUES (?, ?, ?, ?)',
                [$p['id'], $p['slug'], $p['titulo'], fotosLocales($p['contenido'], $sinFoto)]);
        }

        // Catálogo: rubros y fichas
        $catalogo = $leer('catalogo.json');
        $rubros = [];
        foreach ($catalogo['fichas'] as $i => $f) {
            if (!isset($rubros[$f['rubro']])) {
                $orden = array_search($f['rubro'], $catalogo['rubros']);
                q('INSERT INTO rubros (nombre, orden) VALUES (?, ?)', [$f['rubro'], $orden === false ? 99 : $orden + 1]);
                $rubros[$f['rubro']] = (int) db()->lastInsertId();
            }
            q('INSERT INTO emprendimientos (rubro_id, nombre, descripcion, foto, links, orden, publicado) VALUES (?, ?, ?, ?, ?, ?, 1)', [
                $rubros[$f['rubro']], $f['nombre'], $f['descripcion'], fotoLocal($f['foto'], $sinFoto),
                json_encode(array_map(fn($l) => ['tipo' => $l['tipo'], 'url' => $l['url'], 'texto' => $l['texto']], $f['links']),
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                $i + 1,
            ]);
        }

        // Equipo, instituciones y datos de la web (WhatsApp, redes, donaciones)
        cargarDatosIniciales();

        db()->commit();
    } catch (Throwable $e) {
        if (db()->inTransaction()) db()->rollBack();
        throw $e;
    }

    return [
        'notas' => count($notas),
        'proyectos' => count($portfolio),
        'paginas' => count($paginas),
        'rubros' => count($rubros),
        'emprendimientos' => count($catalogo['fichas']),
        'sin_foto' => array_keys($sinFoto),
    ];
}
