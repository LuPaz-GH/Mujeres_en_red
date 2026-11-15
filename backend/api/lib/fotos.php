<?php
// Fotos: se achican a un máximo de 1920 px y se recomprimen al guardarlas.
// Las fotos de celular pesan 5-10 MB y para la web alcanza con ~300 KB.

const MAX_LADO = 1920;
const MAX_SUBIDA = 20 * 1024 * 1024;

function optimizar(string $datos, string $ext): string {
    // Los GIF se dejan como están (pueden ser animados)
    if ($ext === 'gif' || !($img = @imagecreatefromstring($datos))) return $datos;

    // Las fotos de celular vienen "acostadas" con una marca de cómo girarlas
    if (($ext === 'jpg' || $ext === 'jpeg') && function_exists('exif_read_data')) {
        $exif = @exif_read_data('data://image/jpeg;base64,' . base64_encode($datos));
        $giro = [3 => 180, 6 => -90, 8 => 90][$exif['Orientation'] ?? 1] ?? 0;
        if ($giro) $img = imagerotate($img, $giro, 0);
    }

    $w = imagesx($img);
    $h = imagesy($img);
    $escala = min(1, MAX_LADO / max($w, $h));
    if ($escala < 1) $img = imagescale($img, (int) round($w * $escala), (int) round($h * $escala), IMG_BICUBIC);

    ob_start();
    if ($ext === 'png') {
        imagesavealpha($img, true);
        imagepng($img, null, 9);
    } elseif ($ext === 'webp') {
        imagewebp($img, null, 82);
    } else {
        imageinterlace($img, true);
        imagejpeg($img, null, 82);
    }
    $salida = ob_get_clean();
    return strlen($salida) < strlen($datos) ? $salida : $datos;
}

// Guarda una foto subida desde el panel en uploads/AAAA/MM/ y devuelve su dirección
function guardarFoto(array $archivo): string {
    // Si el pedido entero supera el límite del hosting, PHP no entrega nada: también es una foto muy pesada
    if (!$archivo && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) error('La foto es demasiado pesada');
    $problema = $archivo['error'] ?? UPLOAD_ERR_NO_FILE;
    if ($problema !== UPLOAD_ERR_OK) {
        error($problema === UPLOAD_ERR_INI_SIZE ? 'La foto es demasiado pesada' : 'No llegó ninguna foto');
    }
    if ($archivo['size'] > MAX_SUBIDA) error('La foto es demasiado pesada (máximo 20 MB)');

    // Se mira el contenido real del archivo, no el nombre: así no se puede subir otra cosa disfrazada de foto
    $tipo = @getimagesize($archivo['tmp_name'])[2] ?? null;
    $ext = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp', IMAGETYPE_GIF => 'gif'][$tipo] ?? null;
    if (!$ext) error('El archivo no es una foto (se aceptan JPG, PNG, WEBP y GIF)');

    $carpeta = date('Y/m');
    $dir = RAIZ . "/uploads/$carpeta";
    @mkdir($dir, 0755, true);
    $base = slugify(pathinfo($archivo['name'] ?? 'foto', PATHINFO_FILENAME));
    $nombre = "$base.$ext";
    for ($i = 2; is_file("$dir/$nombre"); $i++) $nombre = "$base-$i.$ext";

    file_put_contents("$dir/$nombre", optimizar(file_get_contents($archivo['tmp_name']), $ext));
    return config('uploads_url') . "/$carpeta/$nombre";
}
