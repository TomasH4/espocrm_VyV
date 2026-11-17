# 🧪 Suite de Pruebas de Regresión Unitaria (PHPUnit) - VyV EspoCRM

Suite de pruebas de regresión unitaria para la capa de servicios de dominio de **VyV EspoCRM** en PHP (`Espo\VyV`), implementadas bajo **PHPUnit 11** y **PHP 8.4**.

---

## 🎯 ¿Qué protegen estas pruebas de regresión?

A diferencia de las pruebas unitarias TDD originales (que cubren caminos de decisión ciclomática de caja blanca), las pruebas de regresión unitaria garantizan que **ningún cambio futuro de código rompa invariantes de dominio, contratos de Value Objects o reglas de negocio**:

| Archivo de Regresión | Pruebas | Qué protege |
|---|---|---|
| `LeadCreatorRegressionTest.php` | 11 tests | • Invariantes del Value Object `LeadCreationResult`<br>• Preservación estricta de acentos y caracteres UTF-8 (`María José Nuñez-Gómez`)<br>• Validación RFC de correos con subdominios y alias (`+tag`)<br>• Rechazo estricto con 400 de correos con doble `@` o espacios<br>• Coerción segura de tipos numéricos sin excepciones `TypeError` |
| `OpportunityProbabilityCalculatorRegressionTest.php` | 14 tests | • **Invariante de la Matriz de Negocio**: `Prospecting`=10%, `Proposal`=50%, `Closed Won`=100%, `Closed Lost`=0%<br>• Sensibilidad estricta de mayúsculas (rechazo 422 ante `prospecting` o `closed won`)<br>• Manejo seguro de identificadores nulos en nuevas oportunidades<br>• Invariante de errores 400, 422 y 500 |
| `ContactSearcherRegressionTest.php` | 5 tests | • Límite defensivo anti-DoS: truncado a 100 caracteres exactos<br>• Sintaxis de comillas dobles: delimitadores completos generan búsqueda `exact`, comillas desbalanceadas degradan de forma segura a `partial`<br>• Paginación con límite default defensivo de 20 ante números negativos<br>• Contrato de `ContactSearchResult`: discriminación entre `getTotal() > 0` y `"No Data"` |
| `MeetingSchedulerRegressionTest.php` | 9 tests | • Cálculo exacto de minutos cruzando medianoche y días continuos (ej: 48 horas = 2880 min)<br>• Rechazo estricto con 422 ante inconsistencias cronológicas (`dateEnd <= dateStart`)<br>• Proyección automática de `dateEnd` a partir de duración manual<br>• Asignación automática de duración por defecto de 60 minutos<br>• Captura de excepciones `DateTimeImmutable` ante strings corruptos (retorna 400) |
| `LeadConverterRegressionTest.php` | 7 tests | • **Atomicidad transaccional B2B**: `beginTransaction` -> `createAccount` -> `createContact` (con `accountId`) -> `updateLead` -> `commit`<br>• **Flujo B2C**: Omisión estricta de `createAccount`, `createContact` con `accountId = null`<br>• **Rollback total** ante fallo al persistir Contacto o actualizar Lead<br>• **Idempotencia**: rechazo con código 409 ante Lead ya convertido, sin iniciar transacción |

---

## 🚀 Cómo Ejecutar las Pruebas

Dado que PHP 8.4 corre dentro del contenedor Docker `espocrm`, se ejecutan directamente con un comando:

### 1. Ejecutar solo la Suite de Regresión (46 tests)
```bash
docker exec espocrm phpunit tests/unit/Espo/VyV/Regression
```

### 2. Ejecutar toda la suite unitaria de VyV (103 tests: TDD + Regresión)
```bash
docker exec espocrm phpunit tests/unit/Espo/VyV
```

### 3. Ejecutar un módulo de regresión específico
```bash
# Leads
docker exec espocrm phpunit tests/unit/Espo/VyV/Regression/LeadCreatorRegressionTest.php

# Oportunidades
docker exec espocrm phpunit tests/unit/Espo/VyV/Regression/OpportunityProbabilityCalculatorRegressionTest.php

# Contactos
docker exec espocrm phpunit tests/unit/Espo/VyV/Regression/ContactSearcherRegressionTest.php

# Reuniones
docker exec espocrm phpunit tests/unit/Espo/VyV/Regression/MeetingSchedulerRegressionTest.php

# Conversión de Lead
docker exec espocrm phpunit tests/unit/Espo/VyV/Regression/LeadConverterRegressionTest.php
```

