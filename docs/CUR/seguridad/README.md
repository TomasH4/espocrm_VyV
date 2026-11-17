# CUR — Pruebas de seguridad (OWASP Top 10 2021)

**Criterio de la rúbrica:** 13 (Seguridad). **Fecha:** 16 de noviembre de 2026.
**Alcance:** módulo Moneda y tasas de cambio.
- Endpoints `/CurrencyRate`, `/CurrencyRecord`, `/CurrencyRecordRate`, `/Formula/action/run` y `/Campaign` (campo de moneda).
- Código `Tools/Currency`, `Core/Currency/CalculatorUtil`, `FieldValidators/CurrencyType` y los RecordHooks de `CurrencyRecordRate`.

| Técnica | Herramienta | Resultado |
| :--- | :--- | :--- |
| Análisis dinámico (DAST) | Cypress contra la aplicación en Docker: [`cypress/e2e/cur/security/CUR_seguridad.cy.js`](../../../cypress/e2e/cur/security/CUR_seguridad.cy.js) | 20 pruebas, las 20 pasan ([`ejecucion-dast.txt`](ejecucion-dast.txt)) |
| Análisis estático (SAST) | Revisión manual del código del módulo (§3). SonarQube no se usó en este criterio (§4) | 7 aspectos revisados, 3 hallazgos |
| Revisión de dependencias (SCA) | `composer audit` y `npm audit` | 5 paquetes PHP con avisos; 16 avisos npm, **0 en producción** (§5) |
| Configuración | Cabeceras HTTP y `php.ini` del contenedor | §2 y §3 |

Las pruebas «[Hallazgo …]» verifican el estado actual de una debilidad confirmada; las demás, que el control funciona.

```bash
npx cypress run --spec "cypress/e2e/cur/security/CUR_seguridad.cy.js" --config trashAssetsBeforeRuns=false
```

## 1. Matriz OWASP Top 10 de las pruebas dinámicas

| OWASP | Prueba | Qué se verifica | Resultado |
| :--- | :--- | :--- | :--- |
| **A01** Control de acceso | SEC-CUR-01 a 04 | GET/PUT `/CurrencyRate`, `POST /Formula/action/run` y `GET /CurrencyRecord`: 401 sin credenciales y 403 con un usuario normal sin rol | ✔ 8/8 |
| | SEC-CUR-05 | Un usuario normal no puede crear tasas por `/CurrencyRecordRate`; la tasa no cambia | ✔ |
| | SEC-CUR-06 | Con clave incorrecta o con un usuario inexistente la respuesta es idéntica (401), así que no se pueden enumerar usuarios | ✔ |
| **A03** Inyección | SEC-CUR-07 a 09 | SQL (`' OR '1'='1`), SQL apilada (`; DROP TABLE …`) y XSS (`<script>`) en la tasa: 400 «must be a number» y la tasa no cambia | ✔ 3/3 |
| | SEC-CUR-10 | Inyección en `budgetCurrency`: 400 `validCurrency` | ✔ |
| | SEC-CUR-11 | Inyección SQL en la fecha de una tasa: 400, sin mensajes de SQL en la respuesta | ✔ |
| **A04** Diseño inseguro | SEC-CUR-12 | La API aplica la misma regla que el formulario (tasa ≥ 0.0001; DEF-CUR-04 corregido con TDD) y la conversión sigue funcionando | ✔ |
| **A05** Configuración | SEC-CUR-14 [Hallazgo] | Un error interno de la fórmula (DEF-CUR-01) responde **500**, pero sin cuerpo: no filtra rutas, trazas ni SQL | ✔ ([evidencia](evidencias/respuesta-500-formula.txt)) |
| | SEC-CUR-15 [Hallazgo] | Cabeceras de endurecimiento en la API | ✔ registrado ([evidencia](evidencias/cabeceras-api.json)) |
| | SEC-CUR-16 | Cabeceras de la pantalla principal | ✔ registrado ([evidencia](evidencias/cabeceras-ui.json)) |
| **A02 / A07** Transporte y autenticación | SEC-CUR-17 [Hallazgo] | La API acepta autenticación Basic sobre HTTP sin cifrar en este entorno | ✔ registrado |

**No aplican al módulo:**
- A06 se cubre con SCA en §5.
- A08 no aplica: el módulo no deserializa ni descarga código.
- A09 se comenta en §3.
- A10 (SSRF) no aplica: las tasas no se obtienen de URL externas.

## 2. Cabeceras HTTP observadas

| Cabecera | API (`/api/v1/CurrencyRate`) | Pantalla (`/`) | Valoración |
| :--- | :--- | :--- | :--- |
| `Content-Security-Policy` | — | `script-src 'self' 'nonce-…' 'unsafe-eval' …; form-action 'self'; frame-ancestors 'self'` | Bien en la pantalla, salvo `'unsafe-eval'` |
| `X-Content-Type-Options` | — | `nosniff` | Falta en la API (bajo riesgo, porque responde JSON) |
| `X-Frame-Options` | — | — | Cubierto por `frame-ancestors 'self'` en la pantalla |
| `Strict-Transport-Security` | — | — | No aplica sin HTTPS; necesaria en producción |
| `Cache-Control` | `no-store, no-cache, must-revalidate` | — | Bien: las tasas no quedan en caché |
| `Server` | `Apache/2.4.69 (Debian)` | `Apache/2.4.69 (Debian)` | Revela la versión exacta del servidor web |
| `X-Powered-By` | — | — | Bien: no revela PHP (`expose_php = Off`) |

## 3. Revisión manual del código del módulo (SAST)

| Revisión | Resultado |
| :--- | :--- |
| Acceso a datos | `RateService`, `SyncManager` y `RateEntryProvider` usan el ORM con consultas parametrizadas (`where([...])`, `UpdateBuilder`). No hay SQL concatenado. Coincide con SEC-CUR-07, 08 y 11 |
| Control de acceso | `RateService::checkReadAccess()` y `checkEditAccess()` comprueban el ámbito `Currency` y el nivel `yes` antes de leer o escribir. Lo cubren las pruebas unitarias (CB-CUR-F4-01) y SEC-CUR-01 y 02 |
| Validación de entradas | Antes del TDD, `set()` solo rechazaba valores negativos (DEF-CUR-03 y 04). Ahora `validateRate()` exige un número ≥ al mínimo del campo. El código de moneda se valida contra `currencyList` (`CurrencyType::checkValidCurrency`) |
| Manejo de errores | `ConvertType` (fórmula) deja escapar `RuntimeException` y `AssertionError` sin convertirlos en un error de fórmula (DEF-CUR-01 y 02): el cliente recibe 500 en lugar de un mensaje controlado |
| Aserciones en producción | El contenedor corre sin `php.ini` (solo existen `php.ini-development` y `php.ini-production`), así que **`zend.assertions = 1`**. El `assert(is_numeric($amount))` de `ConvertType` terminaba en `AssertionError` con datos del usuario (DEF-CUR-02). Con la configuración de producción (`zend.assertions = -1`) el `assert` no se evalúa y el dato inválido seguiría adelante. La validación debe ser explícita, no un `assert` |
| Registro y auditoría (A09) | El campo `rate` de `CurrencyRecordRate` es `audited: true`, así que los cambios por el registro quedan en el historial. `RateService::writeOne()` guarda con `EntityManager`: hay que comprobar si los cambios por `PUT /CurrencyRate` también quedan auditados (pendiente) |
| Integridad de datos (A04) | Sin tasa vigente, `SyncManager::updateCode()` escribe 1.0 sin avisar (DEF-CUR-05). Una tasa equivocada en silencio es un riesgo de integridad financiera |

## 4. SonarQube

**No se usó en este criterio, por decisión del 16 de noviembre de 2026.** Las credenciales de administrador de `setup_sonar.ps1` no son válidas en la instancia local, y el análisis estático del módulo se cubrió con la revisión manual de §3.

Hay que tener presente que el proyecto del equipo (`espocrm_VyV`) solo analiza `application/Espo/VyV` y `custom` (`sonar.sources`). Por eso su Quality Gate **no incluye** el código de CUR. Si más adelante se quiere analizar el módulo (criterio 9) sin alterar las métricas del equipo, basta un proyecto aparte limitado a los archivos de CUR:

```bash
docker run --rm --network espocrm_vyv_default -v "$PWD:/usr/src" -e SONAR_HOST_URL=http://sonarqube:9000 -e SONAR_TOKEN=<token> sonarsource/sonar-scanner-cli:latest -Dsonar.projectKey=espocrm_VyV_CUR -Dsonar.sources=application/Espo/Tools/Currency,application/Espo/Core/Currency,application/Espo/Classes/FieldValidators/CurrencyType.php,application/Espo/Classes/RecordHooks/CurrencyRecordRate -Dsonar.tests= -Dsonar.exclusions=
```

## 5. Revisión de dependencias (SCA)

**PHP (`composer audit` sobre `composer.lock`, [evidencia](evidencias/composer-audit.json)):**

| Paquete | Versión | Avisos | Ejemplo | ¿Lo usa CUR? |
| :--- | :--- | :---: | :--- | :--- |
| `phpseclib/phpseclib` | 3.0.57 | 1 | Iteraciones PBKDF sin límite que permiten agotar la CPU (corregido en 3.0.58) | No |
| `symfony/http-client` | 7.4.3 | 2 | CVE-2026-121971: envía credenciales a otros orígenes; CVE-2026-123119: DNS rebinding | No |
| `symfony/http-foundation` | 7.4.21 | 4 | CVE-2026-118514: HEAD evita reglas `access_control`; CVE-2026-121619: proxies de confianza | No: ningún archivo de `application/Espo` lo importa (llega como dependencia transitiva) |
| `symfony/mime` | 7.4.13 | 1 | CVE-2026-45070 (media): inyección de cabeceras de correo | No |
| `symfony/routing` | 7.4.21 | 1 | CVE-2026-118516: marcadores de host en el enrutador compilado | No |

**Node (`npm audit`, [completo](evidencias/npm-audit.json) y [solo producción](evidencias/npm-audit-produccion.json)):** 16 avisos (5 altos, 9 moderados y 2 bajos), por ejemplo `basic-ftp`, `proxy-agent`, `glob` y `minimatch`. **Todos están en dependencias de desarrollo** (Cypress, chromedriver, herramientas de compilación); las de producción tienen **0**. El riesgo queda en la máquina de desarrollo y el pipeline, no en el CRM desplegado.

## 6. Hallazgos, severidad y recomendaciones

Severidad estimada con CVSS v3.1 para el contexto del módulo.

| # | Hallazgo | OWASP | Severidad | Recomendación |
| :--- | :--- | :--- | :--- | :--- |
| SEC-H-01 | La API aceptaba tasas 0, no numéricas y `true` (DEF-CUR-03 y 04): denegación de servicio en la conversión y datos financieros corruptos | A04 / A03 | **Alta**, CVSS 6.5 (AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:H/A:H). **Corregido** con TDD | Mantener `validateRate()` y su suite de regresión |
| SEC-H-02 | `assert()` usado como validación, con `zend.assertions = 1` en el contenedor | A05 | **Media**, 5.3 | **Parcial:** el `assert()` de `ConvertType` que causaba DEF-CUR-02 se reemplazó por una validación explícita (refactorización final). Falta usar `php.ini-production` (`zend.assertions = -1`) en la imagen |
| SEC-H-03 | Errores internos de la fórmula responden 500 (DEF-CUR-01 y 02) | A05 | **Baja**, 3.1. No filtra información, porque el cuerpo va vacío | **Corregido** en la refactorización final ([docs/CUR/refactor](../refactor/README.md)): `ConvertType` valida monto y monedas y devuelve un error de fórmula controlado |
| SEC-H-04 | Sin tasa vigente la configuración queda en 1 sin avisar (DEF-CUR-05) | A04 | **Media**, 5.0 (integridad) | **Corregido** en la refactorización final: se conserva la última tasa conocida |
| SEC-H-05 | Basic Auth sobre HTTP en el entorno | A02 / A07 | **Media** en producción; no aplica en local | Servir solo por HTTPS con HSTS y preferir claves de API o HMAC para integraciones |
| SEC-H-06 | Cabecera `Server` con la versión de Apache; API sin `nosniff`; CSP con `'unsafe-eval'` | A05 | **Baja**, 2.0 | `ServerTokens Prod`, agregar `X-Content-Type-Options` a la API y revisar la necesidad de `'unsafe-eval'` |
| SEC-H-07 | Dependencias PHP con avisos (symfony 7.4.x, phpseclib 3.0.57) | A06 | **Media** | Actualizar a las versiones corregidas (`composer update` de esos paquetes) y volver a correr la suite |
| SEC-H-08 | 16 avisos npm en dependencias de desarrollo | A06 | **Baja** (no se despliegan) | `npm audit fix` en el entorno de desarrollo |

**Controles que funcionan bien:**
- control de acceso por ámbito y nivel (401 y 403 correctos);
- respuesta idéntica ante usuario inexistente o clave incorrecta;
- consultas parametrizadas;
- validación del código de moneda;
- `display_errors` y `expose_php` apagados;
- CSP con `frame-ancestors 'self'` en la pantalla.
