# Servidor local para SOLO-GELATOS (Windows PowerShell 5+)
# Uso:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\servir.ps1
# Luego abre: http://localhost:8080/
#
# Se usa un servidor local porque la app hace fetch a Supabase y registra un
# Service Worker; abrir index.html con doble clic (file://) puede fallar.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$port = 8080

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host ""
Write-Host "  Solo Gelatos disponible en: http://localhost:$port/"
Write-Host "  Carpeta: $root"
Write-Host "  Presiona Ctrl+C para detener."
Write-Host ""

$mime = @{
  '.html'        = 'text/html; charset=utf-8'
  '.css'         = 'text/css; charset=utf-8'
  '.js'          = 'application/javascript; charset=utf-8'
  '.json'        = 'application/json; charset=utf-8'
  '.md'          = 'text/markdown; charset=utf-8'
  '.txt'         = 'text/plain; charset=utf-8'
  '.webmanifest' = 'application/manifest+json'
  '.png'         = 'image/png'
  '.jpg'         = 'image/jpeg'
  '.jpeg'        = 'image/jpeg'
  '.gif'         = 'image/gif'
  '.svg'         = 'image/svg+xml'
  '.ico'         = 'image/x-icon'
  '.woff'        = 'font/woff'
  '.woff2'       = 'font/woff2'
  '.mp4'         = 'video/mp4'
}

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $rawPath = $ctx.Request.Url.LocalPath
    $path = [System.Uri]::UnescapeDataString($rawPath).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($path)) { $path = 'index.html' }

    $full = [System.IO.Path]::GetFullPath((Join-Path $root $path))
    $rootFull = [System.IO.Path]::GetFullPath($root)

    # Evita salir de la carpeta del proyecto.
    if (-not $full.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
      $ctx.Response.StatusCode = 403
      $ctx.Response.Close()
      continue
    }

    if (Test-Path -LiteralPath $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $ctx.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $ctx.Response.ContentType = 'text/plain; charset=utf-8'
      $msg = [System.Text.Encoding]::UTF8.GetBytes('404 - Archivo no encontrado')
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $ctx.Response.Close()
  } catch {
    # Un cliente que cancela la peticion no debe tumbar el servidor.
  }
}
