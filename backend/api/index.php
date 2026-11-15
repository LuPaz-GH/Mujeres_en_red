<?php
// Entrada de la API: todos los pedidos a /api/... pasan por acá y se mandan a la función que corresponde

require __DIR__ . '/lib/base.php';
require __DIR__ . '/lib/fotos.php';
require __DIR__ . '/lib/publico.php';
require __DIR__ . '/lib/panel.php';

const RUTAS = [
    // Web pública
    ['GET', '/notas', 'listarNotas'],
    ['GET', '/notas/([\w-]+)', 'verNota'],
    ['GET', '/categorias', 'listarCategorias'],
    ['GET', '/portfolio', 'listarPortfolio'],
    ['GET', '/portfolio/([\w-]+)', 'verProyecto'],
    ['GET', '/paginas/([\w-]+)', 'verPagina'],
    ['GET', '/catalogo', 'verCatalogo'],
    ['GET', '/equipo', 'listarEquipo'],
    ['GET', '/eventos', 'listarEventos'],
    ['GET', '/instituciones', 'listarInstituciones'],
    ['GET', '/testimonios', 'listarTestimonios'],
    ['GET', '/ajustes', 'verAjustes'],
    ['POST', '/contacto', 'enviarContacto'],
    ['POST', '/visita', 'registrarVisita'],

    // Sesión del panel
    ['GET', '/sesion', 'verSesion'],
    ['POST', '/sesion', 'entrar'],
    ['DELETE', '/sesion', 'salir'],
    ['PUT', '/admin/clave', 'cambiarClave'],

    // Panel
    ['GET', '/admin/resumen', 'panelResumen'],
    ['POST', '/admin/fotos', 'subirFoto'],
    ['GET', '/admin/notas', 'panelNotas'],
    ['POST', '/admin/notas', 'guardarNota'],
    ['GET', '/admin/notas/(\d+)', 'panelNota'],
    ['PUT', '/admin/notas/(\d+)', 'guardarNota'],
    ['DELETE', '/admin/notas/(\d+)', 'borrarNota'],
    ['GET', '/admin/categorias', 'panelCategorias'],
    ['POST', '/admin/categorias', 'guardarCategoria'],
    ['PUT', '/admin/categorias/(\d+)', 'guardarCategoria'],
    ['DELETE', '/admin/categorias/(\d+)', 'borrarCategoria'],
    ['GET', '/admin/portfolio', 'panelPortfolio'],
    ['POST', '/admin/portfolio', 'guardarProyecto'],
    ['GET', '/admin/portfolio/(\d+)', 'panelProyecto'],
    ['PUT', '/admin/portfolio/(\d+)', 'guardarProyecto'],
    ['DELETE', '/admin/portfolio/(\d+)', 'borrarProyecto'],
    ['GET', '/admin/rubros', 'panelRubros'],
    ['POST', '/admin/rubros', 'guardarRubro'],
    ['PUT', '/admin/rubros/(\d+)', 'guardarRubro'],
    ['DELETE', '/admin/rubros/(\d+)', 'borrarRubro'],
    ['GET', '/admin/emprendimientos', 'panelFichas'],
    ['POST', '/admin/emprendimientos', 'guardarFicha'],
    ['GET', '/admin/emprendimientos/(\d+)', 'panelFicha'],
    ['PUT', '/admin/emprendimientos/(\d+)', 'guardarFicha'],
    ['DELETE', '/admin/emprendimientos/(\d+)', 'borrarFicha'],
    ['GET', '/admin/mensajes', 'panelMensajes'],
    ['PUT', '/admin/mensajes/(\d+)', 'marcarMensaje'],
    ['DELETE', '/admin/mensajes/(\d+)', 'borrarMensaje'],
    ['GET', '/admin/eventos', 'panelEventos'],
    ['POST', '/admin/eventos', 'guardarEvento'],
    ['GET', '/admin/eventos/(\d+)', 'panelEvento'],
    ['PUT', '/admin/eventos/(\d+)', 'guardarEvento'],
    ['DELETE', '/admin/eventos/(\d+)', 'borrarEvento'],
    ['GET', '/admin/testimonios', 'panelTestimonios'],
    ['POST', '/admin/testimonios', 'guardarTestimonio'],
    ['PUT', '/admin/testimonios/orden', 'ordenarTestimonios'],
    ['GET', '/admin/testimonios/(\d+)', 'panelTestimonio'],
    ['PUT', '/admin/testimonios/(\d+)', 'guardarTestimonio'],
    ['DELETE', '/admin/testimonios/(\d+)', 'borrarTestimonio'],
    ['GET', '/admin/instituciones', 'panelInstituciones'],
    ['POST', '/admin/instituciones', 'guardarInstitucion'],
    ['PUT', '/admin/instituciones/orden', 'ordenarInstituciones'],
    ['GET', '/admin/instituciones/(\d+)', 'panelInstitucion'],
    ['PUT', '/admin/instituciones/(\d+)', 'guardarInstitucion'],
    ['DELETE', '/admin/instituciones/(\d+)', 'borrarInstitucion'],
    ['GET', '/admin/equipo', 'panelEquipo'],
    ['POST', '/admin/equipo', 'guardarIntegrante'],
    ['PUT', '/admin/equipo/orden', 'ordenarEquipo'],
    ['GET', '/admin/equipo/(\d+)', 'panelIntegrante'],
    ['PUT', '/admin/equipo/(\d+)', 'guardarIntegrante'],
    ['DELETE', '/admin/equipo/(\d+)', 'borrarIntegrante'],

    // Solo administradoras
    ['GET', '/admin/ajustes', 'panelAjustes'],
    ['PUT', '/admin/ajustes', 'guardarAjustes'],
    ['GET', '/admin/visitas', 'panelVisitas'],
    ['GET', '/admin/usuarias', 'panelCuentas'],
    ['POST', '/admin/usuarias', 'guardarCuenta'],
    ['GET', '/admin/usuarias/(\d+)', 'panelCuenta'],
    ['PUT', '/admin/usuarias/(\d+)', 'guardarCuenta'],
    ['DELETE', '/admin/usuarias/(\d+)', 'borrarCuenta'],
    ['GET', '/admin/actividad', 'panelActividad'],
    ['GET', '/admin/papelera', 'panelPapelera'],
    ['POST', '/admin/papelera/(\w+)/(\d+)', 'restaurar'],
    ['DELETE', '/admin/papelera/(\w+)/(\d+)', 'eliminarDefinitivo'],
];

// "/api/notas/mi-nota" -> "/notas/mi-nota"
$ruta = '/' . trim(preg_replace('#^.*?/api(?=/|$)#', '', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)), '/');
$metodo = $_SERVER['REQUEST_METHOD'];

try {
    $existe = false;
    foreach (RUTAS as [$m, $patron, $funcion]) {
        if (!preg_match("#^$patron$#", $ruta, $partes)) continue;
        $existe = true;
        if ($m === $metodo) $funcion(...array_slice($partes, 1));
    }
    error($existe ? 'Método no permitido' : 'No existe esa dirección', $existe ? 405 : 404);
} catch (Throwable $e) {
    try {
        if (db()->inTransaction()) db()->rollBack();
    } catch (Throwable) {
        // si lo que falló fue la conexión a la base, no hay nada que deshacer
    }
    error_log('API: ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
    error('Hubo un problema en el servidor. Probá de nuevo en un rato.', 500);
}
