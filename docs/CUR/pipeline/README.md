# CUR — Integración en el pipeline Jenkins, Docker y SonarQube

**Criterio de la rúbrica:** 9 (Pipeline Jenkins + Docker + SonarQube). **Fecha:** 16 de noviembre de 2026.
**Objetivo:** que el pipeline del equipo construya, pruebe y analice también el módulo Moneda y tasas de cambio (CUR).

## 1. Cambios

| Archivo | Cambio | Por qué |
| :--- | :--- | :--- |
| `sonar-project.properties` | `sonar.sources` agrega `application/Espo/Tools/Currency`, `application/Espo/Core/Currency`, `CurrencyType.php`, los RecordHooks de `CurrencyRecordRate` y `ExtGroup/CurrencyGroup` | Antes solo se analizaban `application/Espo/VyV` y `custom`: el código de CUR quedaba fuera de SonarQube y de su Quality Gate |
| `Jenkinsfile`, etapa 3 | Sin cambios: `phpunit tests/unit/Espo/VyV/` ya incluye `tests/unit/Espo/VyV/Currency` (78 pruebas de CUR) y genera la cobertura Clover que lee SonarQube | — |
| `Jenkinsfile`, etapa **3b** (nueva) | Ejecuta `CalculatorUtilSinBcmathTest` con `php -n` y publica su JUnit | Esas 7 pruebas se omiten con bcmath cargada; sin esta etapa el pipeline no las ejecuta nunca |
| `Jenkinsfile`, etapa 4 | Sin cambios: `npx cypress run` ya recorre `cypress/e2e/cur/**` y `tests_bdd_screenplay/features/alejandro/**` | — |
| `Jenkinsfile`, etapa 5 | La red del escáner se toma del contenedor `espocrm` en lugar de `espo-crm_default` fijo | En este equipo la red se llama `espocrm_vyv_default` (depende de la carpeta del proyecto): con el nombre fijo el escáner no alcanza SonarQube |
| `Jenkinsfile`, etapa 6 | Lee el estado del Quality Gate y **falla si no es `OK`** | Antes solo imprimía la respuesta, así que el pipeline pasaba aunque el Quality Gate fallara. La rúbrica pide verificarlo |
| `run_sonar.ps1` | Incluye `tests/unit/Espo/VyV/Currency/` en la cobertura y toma la red del contenedor | Igual que en Jenkins, para el análisis manual |
| `docker-compose.yml` | Monta `application/Espo/Tools/Currency` y `application/Espo/Core/Formula/Functions/ExtGroup/CurrencyGroup` en `espocrm` y `espocrm-daemon` | El contenedor ejecuta el código corregido del repositorio (TDD y refactorización), no el de la imagen |

## 2. Verificación

- **Extracción del Quality Gate**, probada con respuestas de ejemplo: `OK` → pasa; `ERROR` → falla; respuesta sin estado (por ejemplo, sin permisos) → falla.
- **Pruebas que el pipeline ejecuta para CUR**, corridas después del despliegue final (ver [docs/CUR/refactor](../refactor/README.md#4-pruebas-posteriores-al-despliegue)): unitarias 78 + 7 sin bcmath, Cypress 46, regresión 20, BDD 37, accesibilidad 19 y seguridad 20, todas en verde.

## 3. Pendiente para ejecutarlo de punta a punta

- **Jenkins:** el `Jenkinsfile` espera un contenedor llamado `jenkins` (por `--volumes-from jenkins`) y la credencial `sonar-token`. En este equipo solo hay contenedores antiguos de Jenkins sin configurar para este proyecto, así que el pipeline completo no se ejecutó aquí.
- **SonarQube:** las credenciales de administrador de `setup_sonar.ps1` no son válidas en la instancia local, y no existe `.sonar_token`. Para el análisis hace falta un token creado en http://localhost:9000 (*My Account › Security*), guardado en `.sonar_token` (ignorado por git):

```bash
powershell -ExecutionPolicy Bypass -File run_sonar.ps1
```

- **Riesgo para el Quality Gate:** al sumar el código de CUR, `CalculatorUtil` aporta 64 % de cobertura medida con Xdebug, porque sus ramas sin bcmath solo se ejecutan con `php -n`, sin Xdebug. El resto de las clases de CUR está al 100 %.
