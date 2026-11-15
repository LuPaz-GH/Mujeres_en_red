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
try {
    db()->exec("ALTER TABLE usuarias ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT 'empleada'");
    db()->exec("UPDATE usuarias SET rol = 'admin'");
} catch (PDOException) {
    // ya estaba: no se tocan los roles
}
echo "Base actualizada\n";
