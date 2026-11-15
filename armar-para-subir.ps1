# Arma la carpeta "para-subir" con todo lo que va al hosting (public_html de Ferozo), y un .zip con lo mismo.
# Se corre desde esta carpeta, en PowerShell:   .\armar-para-subir.ps1
#
# - Compila la web (npm run build) y junta: la web, la API, las fotos (uploads), el contenido y el instalador.
# - La configuración (base de datos y clave de instalación) se guarda aparte, en para-subir\config.php,
#   así no se pierde al volver a armar. La primera vez se crea con una clave de instalación nueva.
# - para-subir NO va a GitHub (está en .gitignore): tiene contraseñas.

$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot
$salida = Join-Path $raiz 'para-subir'
$destino = Join-Path $salida 'public_html'
$config = Join-Path $salida 'config.php'

Write-Host '1/4  Compilando la web...'
Push-Location (Join-Path $raiz 'frontend')
npm run build | Out-Null
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'No se pudo compilar la web (npm run build).' }
Pop-Location

Write-Host '2/4  Juntando los archivos...'
if (Test-Path $destino) { Remove-Item -Recurse -Force $destino }
New-Item -ItemType Directory -Force $destino | Out-Null
Copy-Item -Recurse -Force (Join-Path $raiz 'frontend\dist\*') $destino
$backend = Join-Path $raiz 'backend'
foreach ($cosa in 'index.php', 'instalar.php', 'api', 'uploads', 'contenido') {
    Copy-Item -Recurse -Force (Join-Path $backend $cosa) $destino
}
# Nunca se sube una config.php que esté en la compu: la del hosting es la de para-subir
Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $destino 'api\config.php')
# El contenido de respaldo (los .json) no se puede abrir desde internet: solo lo lee el instalador
Set-Content -Encoding ascii (Join-Path $destino 'contenido\.htaccess') "Require all denied"

Write-Host '3/4  Configuracion...'
if (-not (Test-Path $config)) {
    $letras = [char[]]'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    $clave = -join (1..20 | ForEach-Object { $letras | Get-Random })
    $modelo = Get-Content -Raw -Encoding utf8 (Join-Path $backend 'api\config.ejemplo.php')
    $modelo = $modelo.Replace("'clave_instalacion' => '',", "'clave_instalacion' => '$clave',")
    [IO.File]::WriteAllText($config, $modelo, (New-Object Text.UTF8Encoding $false))
    Write-Host "     Se creo para-subir\config.php con una clave de instalacion nueva: $clave"
}
Copy-Item -Force $config (Join-Path $destino 'api\config.php')

Write-Host '4/4  Armando el .zip...'
$zip = Join-Path $salida 'web-mujeresenred.zip'
if (Test-Path $zip) { Remove-Item -Force $zip }
# tar arma el zip con barras "/" (Compress-Archive de Windows usa "\" y en el hosting se descomprime mal)
# Con "." entra todo, también los archivos que empiezan con punto (.htaccess)
tar -a -c -f $zip -C $destino .
if ($LASTEXITCODE -ne 0) { throw 'No se pudo armar el zip.' }

$mb = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Host ""
Write-Host "Listo: $salida"
Write-Host "  - public_html\               (todo lo que va al hosting, suelto)"
Write-Host "  - web-mujeresenred.zip ($mb MB)  (lo mismo, en un solo archivo)"
Write-Host "  - config.php                 (completar con los datos de la base de datos de Ferozo)"
