<?php
// Carga en la base de datos el contenido exportado de WordPress (backend/contenido/*.json)
// y cambia las direcciones de las fotos para que apunten a /uploads (las fotos ya bajadas).
// En el hosting, donde no hay consola, lo mismo lo hace instalar.php desde el navegador.
//
//   php importar-contenido.php            -> crea las tablas y carga todo (solo si la base está vacía)
//   php importar-contenido.php --borrar   -> borra TODO lo que haya en la base y vuelve a cargar

require dirname(__DIR__) . '/api/lib/base.php';
require dirname(__DIR__) . '/api/lib/esquema.php';
require dirname(__DIR__) . '/api/lib/importar.php';

if (in_array('--borrar', $argv)) {
    borrarTablas();
} else {
    crearTablas();
    if (q('SELECT COUNT(*) FROM notas')->fetchColumn() > 0) {
        exit("La base ya tiene contenido. Para borrarlo y volver a cargar: php importar-contenido.php --borrar\n");
    }
}
crearTablas();

$r = importarContenido(dirname(__DIR__) . '/contenido');

printf("Listo: %d notas, %d proyectos, %d páginas, %d rubros, %d emprendimientos.\n",
    $r['notas'], $r['proyectos'], $r['paginas'], $r['rubros'], $r['emprendimientos']);
if ($r['sin_foto']) {
    echo count($r['sin_foto']) . " fotos siguen apuntando a WordPress (no estaban en uploads/):\n  " . implode("\n  ", $r['sin_foto']) . "\n";
}
