<?php
// Agrega a una base ya cargada lo nuevo del panel y de la web (ver api/lib/actualizar.php).
// Se puede correr más de una vez. Una base importada desde cero no lo necesita.
//
//   php actualizar-base.php

require dirname(__DIR__) . '/api/lib/base.php';
require dirname(__DIR__) . '/api/lib/actualizar.php';

actualizarBase();
echo "Base actualizada\n";
