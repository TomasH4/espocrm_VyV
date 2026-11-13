@echo off
echo ========================================================
echo Ejecutando Suite de Regresion Unitaria (PHPUnit - Docker)
echo ========================================================
docker exec espocrm phpunit tests/unit/Espo/VyV/Regression
echo.

