$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$reportDir = Join-Path $projectRoot 'reportes'
$outputPath = Join-Path $reportDir 'seguimiento_practica_pufa.docx'

if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir | Out-Null
}

try {
    $word = New-Object -ComObject Word.Application
} catch {
    throw 'No se pudo iniciar Microsoft Word por COM. Verifica que Word esté instalado.'
}

$word.Visible = $false
$doc = $word.Documents.Add()
$sel = $word.Selection

function Add-Heading {
    param([string]$text, [int]$size = 16)
    $sel.Font.Bold = 1
    $sel.Font.Size = $size
    $sel.TypeText($text)
    $sel.TypeParagraph()
    $sel.Font.Bold = 0
    $sel.Font.Size = 11
}

function Add-Para {
    param([string]$text)
    $sel.TypeText($text)
    $sel.TypeParagraph()
}

Add-Heading 'Seguimiento de Trabajo - Proyecto PUFA' 18
Add-Para 'Fecha de elaboracion: 07 de mayo de 2026'
Add-Para ''

Add-Heading '1. Seguimiento semanal' 14
$bloques = @(
    'Semana del 16 al 20 de marzo: Se dio inicio al desarrollo del backend. Se estructuro la base del proyecto en NestJS, la configuracion inicial de TypeORM y las primeras validaciones de conexion a base de datos.',
    'Semana del 23 al 27 de marzo: Se implementaron modulos base de autenticacion y registro. Se trabajo sobre DTOs, controladores y validacion de datos para el flujo de usuarios.',
    'Semana del 30 de marzo al 3 de abril: Se avanzo con entidades y relaciones principales (proyectos y tramites), ajustando el modelo de datos para soportar la creacion y vinculacion correcta.',
    'Semana del 6 al 10 de abril: Se desarrollo la gestion de documentos: carga, listado y descarga, incluyendo almacenamiento en servidor y hash de integridad.',
    'Semana del 13 al 17 de abril: Se agrego la generacion del recibo en PDF para tramites, con endpoint de descarga para uso desde la interfaz.',
    'Semana del 20 al 24 de abril: Se integro frontend con backend en formularios criticos, corrigiendo payloads y mapeos de campos para registro y creacion de tramites.',
    'Semana del 27 de abril al 1 de mayo: Se fortalecio el modulo administrativo para la gestion de imagenes de locaciones (subir, listar, eliminar, reordenar) y se corrigieron errores de modal.',
    'Semana del 4 al 8 de mayo: Se completaron mejoras de portafolio proveedor (servicios y galeria), visualizacion de tramites en detalle de proyecto y ajuste del script de arranque productivo.'
)

foreach ($b in $bloques) {
    Add-Para ("- $b")
    Add-Para ''
}

Add-Heading '2. Capturas recomendadas por apartado' 14
$capturas = @(
    'Login e ingreso: pantalla de inicio de sesion centrada (public/iniciar-sesion/index.html).',
    'Registro: formulario completo y mensaje de confirmacion de alta (public/registro/index.html).',
    'Crear tramite: seleccion de locacion existente y seccion de adjuntos (public/crear-tramite/index.html).',
    'Detalle de tramite: listado de documentos y boton de descarga de recibo PDF (public/detalle-tramite/index.html).',
    'Detalle de proyecto: seccion de tramites asociados al proyecto (public/detalle-proyecto/index.html).',
    'Crear proyecto: selector de servicio del proveedor y carga de documentos (public/crear-proyecto/index.html).',
    'Administracion: modal de imagenes de locacion con carga y gestion (public/admin/admin-4.html).',
    'Proveedor/Portafolio: bloques de servicios y galeria con acciones de agregar (public/proveedor/proveedor-2.html).'
)

for ($i = 0; $i -lt $capturas.Count; $i++) {
    Add-Para ("$($i + 1). $($capturas[$i])")
}

Add-Para ''
Add-Heading '3. Evidencias tecnicas sugeridas' 14
Add-Para 'Complementar con capturas de endpoints y archivos clave en backend: src/modules/documentos/documentos.controller.ts, src/modules/tramites/tramites.controller.ts, src/app.controller.ts.'

$doc.SaveAs($outputPath)
$doc.Close()
$word.Quit()

[System.Runtime.Interopservices.Marshal]::ReleaseComObject($sel) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null

Write-Output "OK: $outputPath"
