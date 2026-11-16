# Convierte a PNG todos los SVG de una carpeta usando Microsoft Edge sin interfaz.
# Uso: powershell -File renderizar_png.ps1 -Origen <carpeta con .svg> -Destino <carpeta de salida>
param(
    [Parameter(Mandatory = $true)][string]$Origen,
    [Parameter(Mandatory = $true)][string]$Destino
)
$edge = @("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
          "C:\Program Files\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw "No se encontró Microsoft Edge." }
New-Item -ItemType Directory -Force -Path $Destino | Out-Null
$perfil = Join-Path $Destino ".edge-profile"
Get-ChildItem -Path $Origen -Filter *.svg | ForEach-Object {
    $head = Get-Content $_.FullName -TotalCount 1
    if ($head -match 'width="(\d+)" height="(\d+)"') { $w = $matches[1]; $h = $matches[2] } else { $w = 1200; $h = 900 }
    $png = Join-Path $Destino ($_.BaseName + ".png")
    $uri = ([System.Uri]$_.FullName).AbsoluteUri
    Start-Process -FilePath $edge -ArgumentList @('--headless', '--disable-gpu', '--hide-scrollbars',
        "--user-data-dir=`"$perfil`"", "--screenshot=`"$png`"", "--window-size=$w,$h", $uri) -Wait -WindowStyle Hidden
    "{0} {1}x{2} -> {3}" -f $_.Name, $w, $h, (Test-Path $png)
}
