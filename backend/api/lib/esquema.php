<?php
// Tablas de la base de datos. Sirve igual para SQLite (compu) y MySQL (hosting).

function crearTablas(): void {
    $sqlite = esSqlite();
    $id = $sqlite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY';
    $ref = $sqlite ? 'INTEGER' : 'INT UNSIGNED';
    $largo = $sqlite ? 'TEXT' : 'MEDIUMTEXT';
    $fin = $sqlite ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
    // Borrado lógico: lo borrado queda en la papelera hasta que una administradora lo elimina del todo
    $papelera = "borrada DATETIME, borrada_por VARCHAR(190), borrada_por_id $ref";

    $tablas = [
        "usuarias (
            id $id,
            email VARCHAR(190) NOT NULL UNIQUE,
            nombre VARCHAR(190) NOT NULL,
            clave VARCHAR(255) NOT NULL,
            rol VARCHAR(20) NOT NULL DEFAULT 'empleada',
            creada DATETIME NOT NULL,
            $papelera
        )",
        // Intentos fallidos de entrar al panel, para frenar a quien prueba contraseñas
        "intentos (
            id $id,
            ip VARCHAR(64) NOT NULL,
            fecha DATETIME NOT NULL
        )",
        "categorias (
            id $id,
            nombre VARCHAR(190) NOT NULL,
            slug VARCHAR(190) NOT NULL UNIQUE,
            $papelera
        )",
        "etiquetas (
            id $id,
            nombre VARCHAR(190) NOT NULL,
            slug VARCHAR(190) NOT NULL UNIQUE
        )",
        "notas (
            id $id,
            slug VARCHAR(190) NOT NULL UNIQUE,
            titulo VARCHAR(255) NOT NULL,
            fecha DATETIME NOT NULL,
            modificada DATETIME NOT NULL,
            resumen TEXT,
            contenido $largo,
            foto VARCHAR(500),
            autora VARCHAR(190),
            portfolio_id INTEGER,
            publicada TINYINT NOT NULL DEFAULT 1,
            $papelera
        )",
        "nota_categoria (
            nota_id $ref NOT NULL,
            categoria_id $ref NOT NULL,
            PRIMARY KEY (nota_id, categoria_id),
            FOREIGN KEY (nota_id) REFERENCES notas(id) ON DELETE CASCADE,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
        )",
        "nota_etiqueta (
            nota_id $ref NOT NULL,
            etiqueta_id $ref NOT NULL,
            PRIMARY KEY (nota_id, etiqueta_id),
            FOREIGN KEY (nota_id) REFERENCES notas(id) ON DELETE CASCADE,
            FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE
        )",
        "portfolio (
            id $id,
            slug VARCHAR(190) NOT NULL UNIQUE,
            titulo VARCHAR(255) NOT NULL,
            categoria VARCHAR(20) NOT NULL DEFAULT 'proyecto',
            fecha DATETIME NOT NULL,
            contenido $largo,
            foto VARCHAR(500),
            galeria $largo,
            publicada TINYINT NOT NULL DEFAULT 1,
            $papelera
        )",
        // Páginas sueltas que venían de WordPress (ej. "Qué hacemos")
        "paginas (
            id $id,
            slug VARCHAR(190) NOT NULL UNIQUE,
            titulo VARCHAR(255) NOT NULL,
            contenido $largo,
            $papelera
        )",
        // Catálogo: rubros y emprendimientos (cada uno es una ficha)
        "rubros (
            id $id,
            nombre VARCHAR(190) NOT NULL,
            orden INT NOT NULL DEFAULT 0,
            $papelera
        )",
        "emprendimientos (
            id $id,
            rubro_id $ref NOT NULL,
            nombre VARCHAR(190) NOT NULL,
            descripcion TEXT,
            foto VARCHAR(500),
            links TEXT,
            orden INT NOT NULL DEFAULT 0,
            publicado TINYINT NOT NULL DEFAULT 1,
            creada DATETIME,
            $papelera,
            FOREIGN KEY (rubro_id) REFERENCES rubros(id)
        )",
        // Integrantes de la página Equipo. bio: una línea por renglón; redes: JSON {linkedin, instagram, facebook, tiktok}
        "equipo (
            id $id,
            nombre VARCHAR(190) NOT NULL,
            cargo VARCHAR(190),
            foto VARCHAR(500),
            bio TEXT,
            redes TEXT,
            color VARCHAR(20) NOT NULL DEFAULT 'rosa',
            orden INT NOT NULL DEFAULT 0,
            publicado TINYINT NOT NULL DEFAULT 1,
            $papelera
        )",
        // Próximos eventos (página /eventos y bloque del inicio). hora es texto libre: "18 hs", "de 9 a 13"
        "eventos (
            id $id,
            slug VARCHAR(190) NOT NULL UNIQUE,
            titulo VARCHAR(255) NOT NULL,
            fecha DATE NOT NULL,
            hora VARCHAR(60),
            lugar VARCHAR(255),
            descripcion TEXT,
            foto VARCHAR(500),
            link VARCHAR(500),
            publicado TINYINT NOT NULL DEFAULT 1,
            $papelera
        )",
        // "Instituciones que nos acompañan" (inicio de la web). detalle: una línea, ej. "Marca Tucumán"
        "instituciones (
            id $id,
            nombre VARCHAR(190) NOT NULL,
            detalle VARCHAR(255),
            logo VARCHAR(500),
            link VARCHAR(500),
            orden INT NOT NULL DEFAULT 0,
            publicado TINYINT NOT NULL DEFAULT 1,
            $papelera
        )",
        // Testimonios del inicio: frase de una mujer que participó, con su nombre y en qué participó
        "testimonios (
            id $id,
            nombre VARCHAR(190) NOT NULL,
            detalle VARCHAR(255),
            texto TEXT NOT NULL,
            foto VARCHAR(500),
            orden INT NOT NULL DEFAULT 0,
            publicado TINYINT NOT NULL DEFAULT 1,
            $papelera
        )",
        // Datos de la web que se cambian desde el panel: WhatsApp, correo, redes, formas de donar
        "ajustes (
            clave VARCHAR(60) NOT NULL PRIMARY KEY,
            valor TEXT
        )",
        // Visitas a la web, para los gráficos del panel. Sin datos personales: "visitante" es un código que
        // cambia todos los días (no se puede saber quién es) y sirve solo para contar personas distintas en el día.
        "visitas (
            id $id,
            fecha DATETIME NOT NULL,
            dia DATE NOT NULL,
            ruta VARCHAR(255) NOT NULL,
            origen VARCHAR(30) NOT NULL,
            dispositivo VARCHAR(20) NOT NULL,
            visitante CHAR(16) NOT NULL
        )",
        // Mensajes del formulario de contacto (además de llegar por mail, quedan guardados acá)
        "mensajes (
            id $id,
            nombre VARCHAR(190) NOT NULL,
            email VARCHAR(190) NOT NULL,
            asunto VARCHAR(255),
            mensaje TEXT,
            telefono VARCHAR(40),
            fecha DATETIME NOT NULL,
            ip VARCHAR(64),
            leido TINYINT NOT NULL DEFAULT 0,
            enviado TINYINT NOT NULL DEFAULT 0,
            $papelera
        )",
        // Todo lo que se hace en el panel. Guarda el nombre tal como era, por si después se borra la cuenta.
        "actividad (
            id $id,
            fecha DATETIME NOT NULL,
            usuaria_id $ref,
            usuaria VARCHAR(190) NOT NULL,
            accion VARCHAR(60) NOT NULL,
            tipo VARCHAR(30) NOT NULL,
            elemento_id $ref,
            titulo VARCHAR(255)
        )",
    ];

    foreach ($tablas as $tabla) db()->exec("CREATE TABLE IF NOT EXISTS $tabla$fin");
}

// Para volver a importar desde cero (en orden, por las relaciones entre tablas)
function borrarTablas(): void {
    foreach (['testimonios', 'instituciones', 'eventos', 'visitas', 'ajustes', 'equipo', 'actividad', 'mensajes', 'emprendimientos', 'rubros', 'paginas', 'portfolio', 'nota_etiqueta', 'nota_categoria',
        'notas', 'etiquetas', 'categorias', 'intentos', 'usuarias'] as $tabla) {
        db()->exec("DROP TABLE IF EXISTS $tabla");
    }
}

// Equipo y datos de la web tal como estaban escritos en el código (backend/contenido/equipo.json y ajustes.json).
// Solo carga lo que falta: no pisa lo que ya se cambió desde el panel.
function cargarDatosIniciales(): void {
    $dir = RAIZ . '/contenido';
    if (!q('SELECT COUNT(*) FROM equipo')->fetchColumn() && is_file("$dir/equipo.json")) {
        foreach (json_decode(file_get_contents("$dir/equipo.json"), true) as $i => $m) {
            q('INSERT INTO equipo (nombre, cargo, foto, bio, redes, color, orden, publicado) VALUES (?, ?, ?, ?, ?, ?, ?, 1)', [
                $m['nombre'], $m['cargo'], $m['foto'], implode("\n", $m['bio']),
                json_encode($m['redes'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $m['color'], $i + 1,
            ]);
        }
    }
    if (!q('SELECT COUNT(*) FROM instituciones')->fetchColumn() && is_file("$dir/instituciones.json")) {
        foreach (json_decode(file_get_contents("$dir/instituciones.json"), true) as $i => $inst) {
            q('INSERT INTO instituciones (nombre, detalle, logo, link, orden, publicado) VALUES (?, ?, ?, ?, ?, 1)',
                [$inst['nombre'], $inst['detalle'] ?: null, $inst['logo'] ?: null, $inst['link'] ?: null, $i + 1]);
        }
    }
    if (!is_file("$dir/ajustes.json")) return;
    foreach (json_decode(file_get_contents("$dir/ajustes.json"), true) as $clave => $valor) {
        if (!q('SELECT clave FROM ajustes WHERE clave = ?', [$clave])->fetch()) q('INSERT INTO ajustes (clave, valor) VALUES (?, ?)', [$clave, $valor]);
    }
}
