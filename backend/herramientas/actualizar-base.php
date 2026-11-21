<?php
// Agrega a una base ya cargada lo nuevo del panel: papelera, roles, actividad, categorías de Qué hacemos,
// equipo y datos de la web. Se puede correr más de una vez.
// Las cuentas que ya existían pasan a ser administradoras. Una base importada desde cero no lo necesita.
//
//   php actualizar-base.php

require dirname(__DIR__) . '/api/lib/base.php';
require dirname(__DIR__) . '/api/lib/esquema.php';

// Devuelve true si la columna es nueva
function agregarColumna(string $tabla, string $columna): bool {
    try {
        db()->exec("ALTER TABLE $tabla ADD COLUMN $columna");
        return true;
    } catch (PDOException) {
        return false; // ya estaba
    }
}

crearTablas();
foreach (['usuarias', 'categorias', 'notas', 'portfolio', 'paginas', 'rubros', 'emprendimientos', 'mensajes'] as $tabla) {
    agregarColumna($tabla, 'borrada DATETIME');
    agregarColumna($tabla, 'borrada_por VARCHAR(190)');
    agregarColumna($tabla, 'borrada_por_id INTEGER');
    // Lo que ya estaba en la papelera se le asigna a quien lo borró, para que lo pueda recuperar
    if ($tabla !== 'usuarias') q("UPDATE $tabla SET borrada_por_id = (SELECT MIN(u.id) FROM usuarias u WHERE u.nombre = $tabla.borrada_por)
        WHERE borrada IS NOT NULL AND borrada_por_id IS NULL");
}
agregarColumna('emprendimientos', 'creada DATETIME');
agregarColumna('mensajes', 'telefono VARCHAR(40)');
// Galería de fotos y videos de cada ficha, y notas asociadas a una ficha (noviembre 2026)
agregarColumna('portfolio', db()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite' ? 'galeria TEXT' : 'galeria MEDIUMTEXT');
agregarColumna('notas', 'portfolio_id INTEGER');

// Equipo y datos de la web (WhatsApp, redes, donaciones), que ahora se cambian desde el panel
cargarDatosIniciales();

// Portfolio dividido en programas, proyectos y networking. Solo la primera vez: después lo maneja el panel.
if (agregarColumna('portfolio', "categoria VARCHAR(20) NOT NULL DEFAULT 'proyecto'")) {
    $categorias = [1775 => 'networking', 1780 => 'networking', 203 => 'programa', 201 => 'programa', 104 => 'programa', 30 => 'proyecto'];
    foreach ($categorias as $id => $categoria) q('UPDATE portfolio SET categoria = ? WHERE id = ?', [$categoria, $id]);
    // La categoría ya se muestra como etiqueta: se saca "Programa:" o "Proyecto:" del título
    foreach (q('SELECT id, titulo FROM portfolio')->fetchAll() as $p) {
        $titulo = preg_replace('/^(Proyecto|Programa)\s*:\s*/iu', '', $p['titulo']);
        if ($p['id'] == 203) $titulo = 'Bienestar Integral';
        if ($titulo !== $p['titulo']) q('UPDATE portfolio SET titulo = ? WHERE id = ?', [$titulo, $p['id']]);
    }
}
// Noviembre 2026: "Qué hacemos" pasa a Programas, Networking, Voluntariado y DeporVida (sin Proyectos).
// Solo cambia lo que todavía está como venía de antes, para no pisar lo que se haya cambiado en el panel.
q("UPDATE portfolio SET categoria = 'voluntariado' WHERE id = 1775 AND categoria = 'networking'");
q("UPDATE portfolio SET publicada = 0 WHERE categoria = 'proyecto'"); // quedan en el panel para pasarlas a otra categoría
// Fichas nuevas (Movimiento Rosa y Evento ACTIVA) y fotos de Coaching Fest y Voluntariado, si todavía no están
require_once dirname(__DIR__) . '/api/lib/importar.php';
foreach (json_decode(file_get_contents(dirname(__DIR__) . '/contenido/portfolio.json'), true) as $p) {
    if (!in_array($p['slug'], ['movimiento-rosa', 'evento-activa', 'proyecto-coaching-fest', 'reuniones-de-voluntariado'], true)) continue;
    $galeria = array_map(fn($g) => ['tipo' => $g['tipo'], 'url' => fotoLocal($g['url'])], $p['galeria'] ?? []);
    $existe = q('SELECT id, galeria FROM portfolio WHERE slug = ?', [$p['slug']])->fetch();
    if ($existe) {
        // Coaching Fest y Voluntariado ya estaban: se les suma el texto nuevo y las fotos, solo si todavía no tiene galería
        if (!leerGaleria($existe['galeria'])) q('UPDATE portfolio SET contenido = ?, galeria = ?, foto = ? WHERE id = ?',
            [fotosLocales($p['contenido']), json_encode($galeria, JSON_UNESCAPED_SLASHES), fotoLocal($p['foto']), $existe['id']]);
        continue;
    }
    q('INSERT INTO portfolio (slug, titulo, categoria, fecha, contenido, foto, galeria, publicada) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [$p['slug'], $p['titulo'], $p['categoria'], str_replace('T', ' ', $p['fecha']), fotosLocales($p['contenido']), fotoLocal($p['foto']),
            json_encode($galeria, JSON_UNESCAPED_SLASHES)]);
}

try {
    db()->exec("ALTER TABLE usuarias ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT 'empleada'");
    db()->exec("UPDATE usuarias SET rol = 'admin'");
} catch (PDOException) {
    // ya estaba: no se tocan los roles
}
echo "Base actualizada\n";
