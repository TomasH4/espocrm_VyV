param(
    [switch]$Coverage
)

$covFlags = if ($Coverage) { "--coverage-text" } else { "--no-coverage" }

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Ejecutando Pruebas Automatizadas de CAJA NEGRA (Andres Bedoya)" -ForegroundColor Cyan
Write-Host " Matriz CP-CN-01 a CP-CN-32: Particiones de Equivalencia y Limites" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

docker exec espocrm bash -c "cd /var/www/html && phpunit tests/unit/Espo/VyV/Andres/BlackBox/BlackBoxAndresTest.php $covFlags --colors=always"
