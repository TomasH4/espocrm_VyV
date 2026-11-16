"""Genera la caja blanca de CUR-F2 a CUR-F5, solo con diagramas Mermaid.

Salida: docs/CUR/CUR-Fn/caja-blanca.md (n = 2..5).
Uso:   python docs/CUR/herramientas/generar_cur_f2_f5.py

Cada grafo se valida antes de escribirse: la rama Sí debe quedar a la derecha y la No a la
izquierda (columna estrictamente mayor o menor) y E − N + 2 debe ser igual a P + 1.
En Mermaid, la arista No se declara antes que la Sí para que el dibujo la ponga a la izquierda.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from diagramas import Graph, Seq, mermaid, mermaid_seq  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
KIND = {"start": "Inicio", "end": "Fin", "proc": "Proceso", "dec": "Decisión", "err": "Salida de error"}


def G(title, nodes, edges):
    g = Graph(title)
    for n in nodes:
        g.node(*n)
    for e in edges.split():
        ab, _, lab = e.partition(":")
        a, b = ab.split(">")
        g.edge(a, b, {"S": "Sí", "N": "No"}.get(lab, ""))
    g.validate()
    return g


def md_graph(g, file, lines, paths, nota=""):
    m = g.cyclomatic()
    rows = "\n".join(f"| {n.id} | {KIND[n.kind]} | {lines.get(int(n.id), '')} | {n.text} |" for n in g.nodes)
    preds = ", ".join(n.id for n in g.predicates())
    prows = "\n".join(f"| {c} | {p} | {d} | {cov} |" for c, p, d, cov in paths)
    return f"""### {g.title}

Archivo: `{file}`.{(' ' + nota) if nota else ''}

**Diagrama de flujo**

```mermaid
{mermaid(g)}
```

**Grafo de control de flujo**

```mermaid
{mermaid(g, circles=True)}
```

| Nodo | Tipo | Líneas | Descripción |
| :--- | :--- | :--- | :--- |
{rows}

| Método | Cálculo | V(G) |
| :--- | :--- | :--- |
| Aristas y nodos | E − N + 2 = {m['E']} − {m['N']} + 2 | {m['V_EN']} |
| Nodos de decisión | P + 1 = {m['P']} + 1 (nodos {preds}) | {m['V_P']} |
| Regiones | Regiones del grafo plano, incluida la exterior | {m['V_EN']} |

| Camino | Secuencia de nodos | Qué recorre | Escenario y casos que lo cubren |
| :--- | :--- | :--- | :--- |
{prows}
"""


def seq(title, parts):
    s = Seq(title)
    for p in parts:
        s.participant(*p)
    return s


def md_seq(esc, s, nota):
    return f"""### {esc}

```mermaid
{mermaid_seq(s).replace(";", "#59;")}
```

{nota}
"""


CONV = ("**Convenciones.** Rama **Sí** a la derecha y rama **No** a la izquierda en todas las decisiones; en Mermaid la "
        "arista No se declara primero para que quede a la izquierda. Un grafo por método; la tabla de caminos indica qué "
        "escenario y casos de la caja negra recorren cada camino. Los documentos se generan con "
        "`docs/CUR/herramientas/generar_cur_f2_f5.py`, que valida la orientación de las ramas y que E − N + 2 = P + 1.")


def write(n, title, intro, fe, be, integ, cover, cb, hallazgos):
    out = ROOT / f"CUR-F{n}"
    out.mkdir(parents=True, exist_ok=True)
    doc = f"""# CUR-F{n} — Pruebas de caja blanca: {title}

{intro}

**Versión analizada:** EspoCRM 10.1.1. **Fecha:** 15 de noviembre de 2026.

{CONV}

---

## 1. Frontend

{fe}

---

## 2. Backend

{be}

---

## 3. Integración (un diagrama por escenario)

{integ}

---

## 4. Cobertura por escenario

{cover}

## 5. Casos de prueba de caja blanca nuevos

{cb}

## 6. Hallazgos del análisis de código

{hallazgos}

## 7. Ejecución de las pruebas unitarias

{EJEC_COMUN}

{EJEC[n]}
"""
    (out / "caja-blanca.md").write_text(doc, encoding="utf-8")
    print("ok", out / "caja-blanca.md")


EJEC_COMUN = """Las pruebas están en `tests/unit/Espo/VyV/Currency/` y se ejecutaron el 15 de noviembre de 2026 en el contenedor `espocrm` (PHPUnit 11.5.58, PHP 8.4.27). El código de las seis clases probadas es idéntico en la imagen y en el repositorio (comparado por MD5). Las dependencias se reemplazan por dobles de prueba de PHPUnit, así que no se toca la base de datos.

```bash
docker exec espocrm sh -c "cd /var/www/html && phpunit tests/unit/Espo/VyV/Currency --no-coverage --testdox"
```

```bash
docker exec espocrm sh -c "cd /var/www/html && php -n /usr/local/bin/phpunit tests/unit/Espo/VyV/Currency/CalculatorUtilSinBcmathTest.php --no-coverage"
```

**Resultado del conjunto:** 57 pruebas y 151 aserciones; todas pasan y 7 se omiten. Las 7 omitidas son las de `CalculatorUtilSinBcmathTest`, que solo corren sin bcmath; con `php -n` pasan las 7 (10 aserciones).

**Cobertura de líneas medida con Xdebug:**

| Clase | Métodos | Líneas |
| :--- | :--- | :--- |
| `CurrencyType` | 5/5 | 44/44 (100 %) |
| `RateService` | 6/6 | 32/32 (100 %) |
| `SyncManager` | 11/11 | 55/55 (100 %) |
| `AfterSave` / `AfterDelete` | 2/2 cada uno | 7/7 cada uno (100 %) |
| `CalculatorUtil` | — | 18/28 (64 %) con bcmath. Nueve de las diez líneas restantes son las ramas sin bcmath, que se ejecutan con `php -n` (sin Xdebug, así que no se miden). La décima es la línea 98, código muerto |"""

EJEC = {
    2: """| Prueba | Pruebas | Caminos que recorre |
| :--- | :--- | :--- |
| `CalculatorUtilTest` | 10 | multiply/add/subtract/compare C1, divide C2 y nodo 4 (divisor cero), round C2 y C3 |
| `CalculatorUtilSinBcmathTest` (`php -n`) | 7 | multiply/add/subtract/compare C2, divide C1, round C1 |

**Cobertura de caminos tras las pruebas unitarias:** `multiply` 2/2, `divide` 2/3 (C3 es código muerto), `round` 3/3. Sin bcmath, `add('0.1', '0.2')` devuelve `'0.3'`: `floatToString` oculta el error de coma flotante al cortar en 14 decimales. En cambio `divide('2', '0.0003')` ya no coincide con el resultado exacto de bcdiv.""",
    3: """| Prueba | Pruebas | Caminos que recorre |
| :--- | :--- | :--- |
| `CurrencyTypeTest` | 17 | checkValid C1 a C4; checkInPermittedRange C1 a C7 (C3 con un doble de `Entity`); checkValidCurrency C1 a C5 (C5 con una configuración sin `currencyList`) |

**Cobertura de caminos tras las pruebas unitarias:** `checkValid` 4/4, `checkInPermittedRange` 7/7 y `checkValidCurrency` 5/5. El frontend (`fetch()`) sigue en 2 de 4: las pruebas CB-CUR-F3-01 y 02 son de JavaScript y requieren compilar el cliente (`frontend/test`, Jasmine).""",
    4: """| Prueba | Pruebas | Caminos que recorre |
| :--- | :--- | :--- |
| `RateServiceTest` | 13 | checkEditAccess C1 y C2 por separado; checkReadAccess C1, C2 y C3; get C2; set C2, C3 y C4; writeOne C1, C2 y C3; DEF-CUR-03 y DEF-CUR-04 documentados |

**Cobertura de caminos tras las pruebas unitarias:** permisos 3/3 (ahora se distingue C1 de C2), `get` 1/1 factible, `set` 3/3 factibles y `writeOne` 3/3 (C1 con un doble que lanza `NotEnabled`). Las pruebas `testDefCur03…` y `testDefCur04…` pasan porque describen el comportamiento actual. En el ciclo TDD se reescriben para esperar `BadRequest`: primero fallan (rojo) y pasan cuando se corrige `set()`.""",
    5: """| Prueba | Pruebas | Caminos que recorre |
| :--- | :--- | :--- |
| `RateSyncTest` | 10 | Hooks AfterSave y AfterDelete C1 y C2; updateCode C1 y C2; clearCache con y sin caché; syncCode C1 y C2 dentro de `sync()`; refreshCache |

**Cobertura de caminos tras las pruebas unitarias:** hooks 2/2, `updateCode` 2/2, `syncCode` 2/2 y las dos ramas de `clearCache`. El frontend (`validateRange`) sigue en los 2 caminos que aplican al campo Rate: CB-CUR-F5-02 es una prueba de JavaScript pendiente. `testDefCur05SinTasaVigenteEscribeUno` documenta DEF-CUR-05 y es el punto de partida del ciclo TDD.""",
}


# ==================================================================================== CUR-F2
CU = "application/Espo/Core/Currency/CalculatorUtil.php"
f2_mul = G("Backend — CalculatorUtil::multiply() (misma estructura: add, subtract, compare)", [
    (1, "start", "Inicio multiply(a, b)", 0, 0),
    (2, "dec", "¿Existe la función bcmul?", 0, 1),
    (3, "proc", "return bcmul(a, b, 14)", 1, 2),
    (4, "proc", "return floatToString((float) a * (float) b)", -1, 2),
    (5, "end", "Fin", 0, 4)], "1>2 2>3:S 2>4:N 3>5 4>5")
f2_div = G("Backend — CalculatorUtil::divide()", [
    (1, "start", "Inicio divide(a, b)", 0, 0),
    (2, "dec", "¿Existe la función bcdiv?", 0, 1),
    (3, "proc", "return floatToString((float) a / (float) b)", -1, 2),
    (4, "proc", "result = bcdiv(a, b, 14) (si b = 0, PHP 8 lanza DivisionByZeroError aquí)", 1, 2),
    (5, "dec", "¿result === null?", 1, 3),
    (6, "err", "throw DivisionByZeroError", 2, 4),
    (7, "proc", "return result", 0, 4),
    (8, "end", "Fin", 0.5, 6)], "1>2 2>4:S 2>3:N 3>8 4>5 5>6:S 5>7:N 6>8 7>8")
f2_round = G("Backend — CalculatorUtil::round()", [
    (1, "start", "Inicio round(arg, precision)", 0, 0),
    (2, "dec", "¿Existe la función bcadd?", 0, 1),
    (3, "proc", "return floatToString(round((float) arg, precision))", -1, 2),
    (4, "proc", "addition = '0.' + ceros + '5'", 1, 2),
    (5, "dec", "¿arg empieza por '-'?", 1, 3),
    (6, "proc", "addition = '-' + addition", 2, 4),
    (7, "proc", "addition se mantiene positiva", 0, 4),
    (8, "proc", "return bcadd(arg, addition, precision)", 1, 5),
    (9, "end", "Fin", 0, 7)], "1>2 2>4:S 2>3:N 3>9 4>5 5>6:S 5>7:N 6>8 7>8 8>9")

FE_REF = ("La capa de pantalla de {f} es el Formula Sandbox, igual que en CUR-F1. Su grafo, su V(G) = 8 y sus caminos "
          "están en [CUR-F1 §1](../CUR-F1/caja-blanca.md#1-frontend); no se repiten aquí.\n\n"
          "| Escenario | Camino del frontend `run()` |\n| :--- | :--- |\n{rows}")

PARTS_F2 = [("U", "Administrador"), ("FE", "Formula Sandbox"), ("API", "Formula Service"),
            ("CV", "Converter"), ("CU", "CalculatorUtil")]


def f2_seq(title, formula, nota_cu, salida):
    s = seq(title, PARTS_F2)
    (s.msg("U", "FE", f"Run {formula}")
      .msg("FE", "API", "POST /api/v1/Formula/action/run")
      .msg("API", "CV", "ConvertType → convert(Currency, destino)")
      .msg("CV", "CU", "multiply(monto, tasaOrigen)")
      .msg("CU", "CV", "bcmul con escala 14", ret=True)
      .msg("CV", "CU", "divide(producto, tasaDestino)")
      .note("CU", nota_cu)
      .msg("CU", "CV", "cociente con 14 decimales", ret=True)
      .msg("CV", "API", "monto convertido", ret=True)
      .msg("API", "FE", "200 {isSuccess: true, output}", ret=True)
      .msg("FE", "U", f"Output {salida}", ret=True))
    return s


f2_int = "\n".join([
    md_seq("ESC-CUR-F2-01", f2_seq("Exactitud decimal", "convert(0.1, 'USD', 'COP')",
                                   "bcmath opera sobre texto decimal: no hay error de coma flotante", "400.00000000000000"),
           "Recorre multiply C1 y divide C2. Casos CN-CUR-F2-01, 02 y 03."),
    md_seq("ESC-CUR-F2-02", f2_seq("Escala de 14 decimales y redondeo", "convert(2, 'USD', 'COP') con tasa 0.0003",
                                   "bcdiv corta en el decimal 14: trunca, no redondea (OBS-CUR-03)", "6666.66666666666666"),
           "Recorre multiply C1 y divide C2. Casos CN-CUR-F2-04 a 07; el 04 y el 06 son observaciones."),
    md_seq("ESC-CUR-F2-03", f2_seq("Ida y vuelta", "convert('3333.33333333333333', 'COP', 'USD')",
                                   "El cociente de la ida ya venía truncado: la vuelta no recupera el 1", "0.99999999999999"),
           "Dos ejecuciones encadenadas por el mismo camino. Caso CN-CUR-F2-08 (OBS-CUR-03)."),
])

write(2, "aritmética decimal exacta de montos",
      "**Funcionalidad:** `CalculatorUtil` hace la aritmética de montos con la extensión bcmath sobre texto decimal y "
      "escala fija de 14 decimales. La conversión de CUR-F1 la usa en `Converter::convertAmount()` (multiplica por la "
      "tasa de origen y divide por la de destino).",
      FE_REF.format(f="CUR-F2", rows="| ESC-CUR-F2-01, 02 y 03 | C3 (ejecución exitosa) |"),
      "\n".join([
          md_graph(f2_mul, CU, {1: "73", 2: "75", 3: "79", 4: "76", 5: "80"}, [
              ("C1", "1-2-3-5", "bcmath disponible.", "CN-CUR-F2-01 a 08 (todas las conversiones)"),
              ("C2", "1-2-4-5", "Sin bcmath: cálculo en coma flotante.",
               "No factible por la interfaz (el contenedor trae bcmath). Cubierto con `php -n`: CB-CUR-F2-03")],
              "`add` (líneas 43-50), `subtract` (57-64) y `compare` (131-138) tienen exactamente el mismo grafo, con V(G) = 2."),
          md_graph(f2_div, CU, {1: "89", 2: "91", 3: "92", 4: "95", 5: "97", 6: "98", 7: "101", 8: "102"}, [
              ("C1", "1-2-3-8", "Sin bcmath.", "Solo con `php -n`: CB-CUR-F2-03"),
              ("C2", "1-2-4-5-7-8", "Divisor distinto de cero.", "CN-CUR-F2-01 a 08"),
              ("C3", "1-2-4-5-6-8", "bcdiv devuelve null.",
               "No factible: en PHP 8 bcdiv lanza DivisionByZeroError en el nodo 4 y nunca devuelve null (código muerto). "
               "El registro de CN-CUR-F4-07 confirma que el error sale de la línea 95")]),
          md_graph(f2_round, CU, {1: "108", 2: "110", 3: "111-113", 4: "116", 5: "118", 6: "119", 7: "118",
                                  8: "124", 9: "125"}, [
              ("C1", "1-2-3-9", "Sin bcmath.", "Solo con `php -n`: CB-CUR-F2-03"),
              ("C2", "1-2-4-5-7-8-9", "Monto positivo.", "CB-CUR-F2-01 (prueba unitaria); la conversión no redondea"),
              ("C3", "1-2-4-5-6-8-9", "Monto negativo.", "CB-CUR-F2-02 (prueba unitaria)")])]),
      f2_int,
      """| Escenario | Frontend | multiply | divide | round |
| :--- | :--- | :--- | :--- | :--- |
| ESC-CUR-F2-01 Exactitud decimal | C3 | C1 | C2 | — |
| ESC-CUR-F2-02 Escala y redondeo | C3 | C1 | C2 | — |
| ESC-CUR-F2-03 Ida y vuelta | C3 | C1 | C2 | — |

| Grafo | V(G) | Caminos factibles en el entorno | Cubiertos por la caja negra |
| :--- | :--- | :--- | :--- |
| `multiply` (y `add`, `subtract`, `compare`) | 2 | 1 | 1 (100 %) |
| `divide` | 3 | 1 | 1 (100 %) |
| `round` | 3 | 2 | 0 (0 %) |""",
      """| ID | Grafo y camino | Entrada | Resultado esperado | Estado |
| :--- | :--- | :--- | :--- | :--- |
| CB-CUR-F2-01 | round C2 | `round('2.345', 2)` | `2.35` (redondeo hacia arriba en el medio) | Pasó: `CalculatorUtilTest::testRoundPositivoEnElPuntoMedio` |
| CB-CUR-F2-02 | round C3 | `round('-2.345', 2)` | `-2.35` (simétrico) | Pasó: `CalculatorUtilTest::testRoundNegativoEsSimetrico` |
| CB-CUR-F2-03 | multiply C2, divide C1 | Las mismas operaciones con bcmath deshabilitado | Mismo resultado salvo error de coma flotante | Pasó con `php -n`: `CalculatorUtilSinBcmathTest` (7 pruebas) |
| CB-CUR-F2-04 | divide (nodo 4) | `divide('1', '0')` | `DivisionByZeroError` | Pasó: `CalculatorUtilTest::testDivideEntreCeroLanzaDivisionByZeroError` |""",
      """- **Código muerto:** la rama `result === null` de `divide()` (nodos 5 y 6) no se alcanza en PHP 8, porque `bcdiv` ya lanza `DivisionByZeroError`. Igual las ramas sin bcmath, porque la extensión está instalada.
- **Truncamiento:** la escala fija de 14 decimales de `bcmul` y `bcdiv` trunca en lugar de redondear. Explica OBS-CUR-02 (el monto de 15 decimales se recorta antes de multiplicar) y OBS-CUR-03 (6666.66666666666666 y la ida y vuelta 0.99999999999999).
- **`round()` no se usa en la conversión:** existe para otros consumidores; su cobertura queda para las pruebas unitarias.""")

# ==================================================================================== CUR-F3
f3_fe = G("Frontend — currency.ts::fetch() y parse() del campo Budget", [
    (1, "start", "Inicio fetch()", 0, 0),
    (2, "proc", "Leer el texto del campo (AutoNumeric ya filtró letras y dígitos de más)", 0, 1),
    (3, "dec", "¿El texto tiene contenido? (código: if valor === '')", 0, 2),
    (4, "proc", "value = null", -1, 3),
    (5, "proc", "Quitar separador de miles; usar '.' como decimal", 1, 3),
    (6, "dec", "¿El campo es decimal?", 1, 4),
    (7, "dec", "¿Faltan decimales hasta la escala?", 2, 5),
    (8, "proc", "Completar con ceros", 3, 6),
    (9, "proc", "Mantener el texto", 1.5, 6),
    (10, "proc", "value = texto", 2, 7),
    (11, "proc", "value = parseFloat(texto)", 0, 5),
    (12, "proc", "currencyValue = moneda del selector", 0, 8),
    (13, "dec", "¿value es null?", 0, 9),
    (14, "proc", "currencyValue = null", 1, 10),
    (15, "proc", "Conservar currencyValue", -1, 10),
    (16, "proc", "Devolver {budget, budgetCurrency}", 0, 11),
    (17, "end", "Fin", 0, 12)],
    "1>2 2>3 3>4:N 3>5:S 4>12 5>6 6>7:S 6>11:N 7>8:S 7>9:N 8>10 9>10 10>12 11>12 12>13 13>14:S 13>15:N 14>16 15>16 16>17")

CT = "application/Espo/Classes/FieldValidators/CurrencyType.php"
f3_valid = G("Backend — CurrencyType::checkValid()", [
    (1, "start", "Inicio checkValid(entidad, campo)", 0, 0),
    (2, "dec", "¿isNotEmpty: hay monto y moneda?", 0, 1),
    (3, "proc", "return true (vacío)", -1, 2),
    (4, "dec", "¿El atributo es VARCHAR (campo decimal)?", 1, 2),
    (5, "proc", "return true (no aplica)", 0, 3),
    (6, "dec", "¿El texto cumple ^-?[0-9]+.?[0-9]*$?", 2, 3),
    (7, "proc", "return true", 3, 4),
    (8, "err", "return false → fallo «valid»", 1, 4),
    (9, "end", "Fin", 1, 6)], "1>2 2>3:N 2>4:S 3>9 4>5:N 4>6:S 5>9 6>7:S 6>8:N 7>9 8>9")
f3_range = G("Backend — CurrencyType::checkInPermittedRange()", [
    (1, "start", "Inicio checkInPermittedRange()", 0, 0),
    (2, "dec", "¿isNotEmpty?", 0, 1),
    (3, "proc", "return true (vacío)", -1, 2),
    (4, "dec", "¿Atributo VARCHAR?", 1, 2),
    (5, "proc", "return true (no aplica)", 0, 3),
    (6, "dec", "¿Es BaseEntity?", 2, 3),
    (7, "proc", "return true", 1, 4),
    (8, "dec", "¿El atributo define precision?", 3, 4),
    (9, "proc", "precision = la del atributo", 4, 5),
    (10, "proc", "precision = 13", 2, 5),
    (11, "proc", "currency = Currency(valor)", 3, 6),
    (12, "dec", "¿Es negativo?", 3, 7),
    (13, "proc", "currency = currency × −1", 4, 8),
    (14, "proc", "Conservar currency", 2, 8),
    (15, "proc", "limit = '9' repetido precision veces", 3, 9),
    (16, "dec", "¿currency > limit?", 3, 10),
    (17, "err", "return false → fallo «inPermittedRange»", 4, 11),
    (18, "proc", "return true", 2, 11),
    (19, "end", "Fin", 1.5, 13)],
    "1>2 2>3:N 2>4:S 3>19 4>5:N 4>6:S 5>19 6>7:N 6>8:S 7>19 8>9:S 8>10:N 9>11 10>11 11>12 12>13:S 12>14:N "
    "13>15 14>15 15>16 16>17:S 16>18:N 17>19 18>19")
f3_cur = G("Backend — CurrencyType::checkValidCurrency()", [
    (1, "start", "Inicio checkValidCurrency()", 0, 0),
    (2, "dec", "¿La entidad trae el atributo budgetCurrency?", 0, 1),
    (3, "proc", "return true", -1, 2),
    (4, "proc", "currency = budgetCurrency", 1, 2),
    (5, "dec", "¿Existe currencyList en la configuración?", 1, 3),
    (6, "proc", "lista = currencyList", 2, 4),
    (7, "proc", "lista = [moneda por defecto]", 0, 4),
    (8, "dec", "¿Hay moneda, hay monto o el registro ya existe? (código: moneda nula && monto nulo && nuevo)", 1, 5),
    (9, "proc", "return true", 0, 6),
    (10, "dec", "¿Moneda nula y monto nulo?", 2, 6),
    (11, "proc", "return true", 3, 7),
    (12, "proc", "return in_array(moneda, lista); falso → fallo «validCurrency»", 1, 7),
    (13, "end", "Fin", 0, 9)],
    "1>2 2>3:N 2>4:S 3>13 4>5 5>6:S 5>7:N 6>8 7>8 8>9:N 8>10:S 9>13 10>11:S 10>12:N 11>13 12>13")

PARTS_F3 = [("U", "Administrador"), ("FE", "Formulario Campaign (currency.ts)"), ("API", "POST /api/v1/Campaign"),
            ("VAL", "Validación de campos"), ("CT", "CurrencyType"), ("DB", "Base de datos")]


def f3_seq(title):
    return seq(title, PARTS_F3)


s1 = f3_seq("Monto y moneda válidos")
(s1.msg("U", "FE", "Budget 1000.50, moneda USD; Ctrl+Enter")
   .msg("FE", "FE", "fetch(): parseFloat → 1000.5; validaciones required, number, range")
   .msg("FE", "API", "{budget: 1000.5, budgetCurrency: 'USD'}")
   .msg("API", "VAL", "validar campos")
   .msg("VAL", "CT", "valid, validCurrency, inPermittedRange")
   .msg("CT", "VAL", "true (float: valid y rango no aplican; USD está en la lista)", ret=True)
   .msg("VAL", "DB", "INSERT campaign")
   .msg("API", "FE", "200 con el registro", ret=True)
   .msg("FE", "U", "Detalle con Budget $1,000.50", ret=True))
s2 = f3_seq("Valores límite del monto")
(s2.alt("pantalla: 14 dígitos (CN-CUR-F3-07)")
   .msg("U", "FE", "Escribe 99999999999999")
   .note("FE", "AutoNumeric descarta el dígito 14 sin avisar (OBS-CUR-04)")
   .msg("FE", "API", "{budget: 9999999999999}")
   .msg("API", "FE", "200", ret=True)
   .else_("API: 14 dígitos (CN-CUR-F3-08)")
   .msg("API", "VAL", "{budget: 99999999999999}")
   .msg("VAL", "CT", "checkInPermittedRange")
   .msg("CT", "VAL", "true: el atributo es float, el límite solo aplica a VARCHAR", ret=True)
   .msg("VAL", "DB", "INSERT con 14 dígitos")
   .end())
s3 = f3_seq("Formato de monto inválido")
(s3.alt("pantalla: '12abc' (CN-CUR-F3-09)")
   .msg("U", "FE", "Escribe 12abc y sale del campo")
   .note("FE", "AutoNumeric deja el campo vacío; fetch() → budget null, moneda null (OBS-CUR-05)")
   .msg("FE", "API", "{budget: null, budgetCurrency: null}")
   .msg("API", "FE", "200, campaña sin presupuesto", ret=True)
   .else_("API: 'abc' o '12.5.3' (CN-CUR-F3-10, 11)")
   .msg("API", "VAL", "{budget: 'abc'}")
   .note("VAL", "La validación genérica del tipo float rechaza el texto (CurrencyType::checkValid sale por el nodo 5)")
   .msg("API", "U", "400 validationFailure, type valid", ret=True)
   .end())
s4 = f3_seq("Código de moneda inválido o ausente")
(s4.alt("moneda fuera de la lista: EUR, XYZ, usd (CN-CUR-F3-13 a 15)")
   .msg("API", "VAL", "{budget: 100, budgetCurrency: 'EUR'}")
   .msg("VAL", "CT", "checkValidCurrency")
   .msg("CT", "VAL", "in_array('EUR', [USD, COP]) = false", ret=True)
   .msg("API", "U", "400 validationFailure, type validCurrency", ret=True)
   .else_("moneda vacía o ausente (CN-CUR-F3-16, 17)")
   .note("API", "El servicio asigna la moneda por defecto antes de validar")
   .msg("CT", "VAL", "in_array('USD', lista) = true", ret=True)
   .msg("VAL", "DB", "INSERT con USD")
   .else_("pantalla (CN-CUR-F3-19)")
   .note("FE", "El selector solo ofrece USD y COP: la pantalla no puede enviar otra moneda")
   .end())

write(3, "validación de campos de moneda",
      "**Funcionalidad:** el campo de moneda (aquí `Campaign.budget`) se valida en la pantalla (`currency.ts` con la "
      "máscara AutoNumeric) y en el servidor (`CurrencyType`: formato, rango permitido y código de moneda válido).",
      md_graph(f3_fe, "client/src/views/fields/currency.ts",
               {1: "352", 2: "353", 3: "280", 4: "282-283", 5: "286-287", 6: "289", 7: "296", 8: "297",
                9: "296", 10: "301-303", 11: "305", 12: "361-363", 13: "365", 14: "366", 15: "365", 16: "369-372",
                17: "373"}, [
          ("C1", "1-2-3-4-12-13-14-16-17", "Campo vacío.", "CN-CUR-F3-09 (AutoNumeric vació el '12abc')"),
          ("C2", "1-2-3-5-6-11-12-13-15-16-17", "Campo no decimal con monto.",
           "CN-CUR-F3-01, 02, 04, 05, 06 y 07 (Budget no es decimal)"),
          ("C3", "1-2-3-5-6-7-8-10-12-13-15-16-17", "Campo decimal con menos decimales que la escala.",
           "Ninguno: Budget no es decimal (caso nuevo CB-CUR-F3-01)"),
          ("C4", "1-2-3-5-6-7-9-10-12-13-15-16-17", "Campo decimal con la escala completa.",
           "Ninguno (caso nuevo CB-CUR-F3-02)"),
          ("C5", "1-2-3-5-6-11-12-13-14-16-17", "Texto no vacío que termina en value null.",
           "No factible: parseFloat nunca devuelve null")],
               "Las dos condiciones `if (this.params.decimal)` consecutivas de `parse()` se representan como una sola "
               "decisión (nodo 6), porque no hay código entre ellas. La máscara AutoNumeric (biblioteca externa) "
               "filtra la entrada antes de este método."),
      "\n".join([
          md_graph(f3_valid, CT, {1: "52", 2: "54", 3: "55", 4: "58", 5: "59", 6: "65", 7: "66", 8: "69", 9: "70"}, [
              ("C1", "1-2-3-9", "Sin monto o sin moneda.", "CN-CUR-F3-18"),
              ("C2", "1-2-4-5-9", "Atributo no VARCHAR (float).", "CN-CUR-F3-01 a 17: Budget es float"),
              ("C3", "1-2-4-6-7-9", "Campo decimal con formato válido.", "Ninguno (caso nuevo CB-CUR-F3-03)"),
              ("C4", "1-2-4-6-8-9", "Campo decimal con formato inválido.", "Ninguno (caso nuevo CB-CUR-F3-04)")],
              "`isNotEmpty` (líneas 44-50) es una condición compuesta de cinco partes."),
          md_graph(f3_range, CT, {1: "72", 2: "74", 3: "75", 4: "78", 5: "79", 6: "82", 7: "83", 8: "87 (??)",
                                  9: "87", 10: "87", 11: "89-91", 12: "93", 13: "94", 14: "93", 15: "97-101",
                                  16: "103", 17: "104", 18: "107", 19: "108"}, [
              ("C1", "1-2-3-19", "Vacío.", "CN-CUR-F3-18"),
              ("C2", "1-2-4-5-19", "Atributo float: el límite no se comprueba.",
               "CN-CUR-F3-01 a 17; explica que CN-CUR-F3-08 acepte 14 dígitos (OBS-CUR-04)"),
              ("C3", "1-2-4-6-7-19", "Entidad que no es BaseEntity.",
               "No factible por la interfaz (todas las entidades son BaseEntity); cubierto con un doble en `testRangoEntidadQueNoEsBaseEntity`"),
              ("C4", "1-2-4-6-8-9-11-12-14-15-16-18-19", "Decimal con precision propia, positivo, en rango.",
               "Ninguno (caso nuevo CB-CUR-F3-05)"),
              ("C5", "1-2-4-6-8-10-11-12-14-15-16-18-19", "Decimal sin precision (13), en rango.",
               "Ninguno (caso nuevo CB-CUR-F3-06)"),
              ("C6", "1-2-4-6-8-9-11-12-13-15-16-18-19", "Decimal negativo en rango.",
               "Ninguno (caso nuevo CB-CUR-F3-07)"),
              ("C7", "1-2-4-6-8-9-11-12-14-15-16-17-19", "Decimal fuera de rango.",
               "Ninguno (caso nuevo CB-CUR-F3-08)")]),
          md_graph(f3_cur, CT, {1: "110", 2: "114", 3: "115", 4: "118", 5: "119 (??)", 6: "119", 7: "119",
                                8: "121-125", 9: "126", 10: "129-133", 11: "134", 12: "137", 13: "138"}, [
              ("C1", "1-2-3-13", "La petición no trae el atributo de moneda.", "Ninguno (caso nuevo CB-CUR-F3-09)"),
              ("C2", "1-2-4-5-6-8-9-13", "Registro nuevo sin monto ni moneda.", "Ninguno (caso nuevo CB-CUR-F3-10)"),
              ("C3", "1-2-4-5-6-8-10-11-13", "Monto y moneda nulos.", "CN-CUR-F3-18"),
              ("C4", "1-2-4-5-6-8-10-12-13", "Moneda con valor: se busca en la lista.",
               "Verdadero: CN-CUR-F3-01 a 03, 16, 17. Falso: CN-CUR-F3-13, 14, 15"),
              ("C5", "1-2-4-5-7-8-10-12-13", "Sin currencyList en la configuración.",
               "No factible en esta instancia (currencyList siempre está definida); cubierto con un doble en `testMonedaSinCurrencyListUsaLaMonedaPorDefecto`")],
              "Las decisiones 8 y 10 son compuestas de tres condiciones cada una.")]),
      "\n".join([md_seq("ESC-CUR-F3-01", s1, "Frontend C2, checkValid C2, checkInPermittedRange C2, checkValidCurrency C4."),
                 md_seq("ESC-CUR-F3-02", s2, "Frontend C2; en el servidor checkInPermittedRange C2, por eso el límite de 13 dígitos solo existe en la pantalla."),
                 md_seq("ESC-CUR-F3-03", s3, "Frontend C1 en la pantalla; en la API el rechazo no viene de CurrencyType (checkValid C2)."),
                 md_seq("ESC-CUR-F3-04", s4, "checkValidCurrency C4 con resultado falso o verdadero.")]),
      """| Escenario | Frontend | checkValid | checkInPermittedRange | checkValidCurrency |
| :--- | :--- | :--- | :--- | :--- |
| ESC-CUR-F3-01 Válidos | C2 | C2 | C2 | C4 |
| ESC-CUR-F3-02 Límites | C2 | C2 | C2 | C4 |
| ESC-CUR-F3-03 Formato inválido | C1 | C2 | C2 | C4 |
| ESC-CUR-F3-04 Moneda inválida | C2 | C2 | C2 | C3, C4 |

| Grafo | V(G) | Caminos factibles | Cubiertos | Cobertura |
| :--- | :--- | :--- | :--- | :--- |
| Frontend `fetch()` | 5 | 4 | 2 | 50 % |
| `checkValid` | 4 | 4 | 2 | 50 % |
| `checkInPermittedRange` | 7 | 6 | 2 | 33 % |
| `checkValidCurrency` | 5 | 4 | 2 | 50 % |

La cobertura es baja porque `Campaign.budget` no es un campo decimal: las ramas de formato y rango de `CurrencyType` solo se ejecutan con campos de moneda decimales.""",
      """| ID | Grafo y camino | Entrada | Resultado esperado | Estado |
| :--- | :--- | :--- | :--- | :--- |
| CB-CUR-F3-01 / 02 | Frontend C3 y C4 | Campo de moneda decimal (escala 4) con `12.5` y con `12.5000` | `'12.5000'` en ambos | Pendiente: prueba del frontend (hay que compilar el cliente) |
| CB-CUR-F3-03 / 04 | checkValid C3 y C4 | Atributo VARCHAR con `'12.50'` y con `'12a'` | `true` y `false` | Pasó: `CurrencyTypeTest::testCheckValidDecimalConFormatoValido` y `…Invalido` |
| CB-CUR-F3-05 a 08 | checkInPermittedRange C4 a C7 | VARCHAR con precision 5 y `'99999'`; sin precision y `'1'`; `'-99999'`; `'100000'` | `true`, `true`, `true`, `false` | Pasó: `CurrencyTypeTest::testRangoConPrecisionEnElLimite`, `…SinPrecisionUsaTreceDigitos`, `…NegativoEnElLimite`, `…FueraDelLimite` |
| CB-CUR-F3-09 / 10 | checkValidCurrency C1 y C2 | Entidad sin `budgetCurrency`; entidad nueva sin monto ni moneda | `true` y `true` | Pasó: `CurrencyTypeTest::testMonedaSinAtributo` y `testMonedaNulaEnRegistroNuevoSinMonto` |""",
      """- **El límite de 13 dígitos solo vive en la pantalla (OBS-CUR-04):** `checkInPermittedRange` sale por el nodo 5 en los campos float, así que la API acepta 14 dígitos que la pantalla no deja escribir.
- **El rechazo de `'abc'` por API no lo hace `CurrencyType`:** `checkValid` también sale por el nodo 5; el fallo `valid` lo produce la validación genérica del tipo float. No se localizó esa clase en este análisis.
- **Pérdida silenciosa en la pantalla (OBS-CUR-05):** la máscara AutoNumeric descarta caracteres no numéricos y deja el campo vacío; `fetch()` envía entonces monto y moneda nulos sin avisar.
- **Formato permisivo:** la expresión regular de `checkValid` acepta `'12.'` (punto sin decimales); `testCheckValidDecimalConFormatoValido` lo deja registrado.""")

# ==================================================================================== CUR-F4
RS = "application/Espo/Tools/Currency/RateService.php"
f4_fe = G("Capa de entrada (equivale al frontend) — /api/v1/CurrencyRate", [
    (1, "start", "Petición a /api/v1/CurrencyRate", 0, 0),
    (2, "dec", "¿Trae credenciales válidas?", 0, 1),
    (3, "err", "401 Unauthorized", -1, 2),
    (4, "dec", "¿El método es PUT?", 1, 2),
    (5, "proc", "Get::process → RateService::get() → JSON", 0, 3),
    (6, "proc", "PutUpdate: rates = Rates::fromAssoc(get_object_vars(cuerpo))", 2, 3),
    (7, "proc", "RateService::set(rates); return true", 2, 4),
    (8, "end", "Fin", 1, 6)], "1>2 2>3:N 2>4:S 3>8 4>5:N 4>6:S 5>8 6>7 7>8")
f4_acl = G("Backend — RateService::checkReadAccess() y checkEditAccess()", [
    (1, "start", "Inicio check…Access()", 0, 0),
    (2, "dec", "¿acl->check('Currency')?", 0, 1),
    (3, "err", "throw Forbidden (403)", -1, 2),
    (4, "dec", "¿Nivel de lectura (o edición) = yes?", 1, 2),
    (5, "err", "throw Forbidden (403)", 0, 3),
    (6, "proc", "Continuar", 2, 3),
    (7, "end", "Fin", 1, 5)], "1>2 2>3:N 2>4:S 3>7 4>5:N 4>6:S 5>7 6>7")
f4_get = G("Backend — RateService::get()", [
    (1, "start", "Inicio get()", 0, 0),
    (2, "proc", "checkReadAccess()", 0, 1),
    (3, "proc", "rates = Rates(moneda base)", 0, 2),
    (4, "dec", "¿Quedan monedas en currencyList?", 0, 3),
    (5, "proc", "rates = rates.withRate(code, getCurrencyRate(code))", 1, 4),
    (6, "proc", "return rates", -1, 4),
    (7, "end", "Fin", -1, 6)], "1>2 2>3 3>4 4>5:S 4>6:N 5>4 6>7")
f4_set = G("Backend — RateService::set()", [
    (1, "start", "Inicio set(rates)", 0, 0),
    (2, "proc", "checkEditAccess()", 0, 1),
    (3, "proc", "codeList = lista de monedas; base = moneda base", 0, 2),
    (4, "dec", "¿Quedan pares (código, valor)?", 0, 3),
    (5, "dec", "¿valor ≥ 0? (código: if valor < 0)", 1, 4),
    (6, "err", "throw BadRequest «Bad value.» (400)", 0, 5),
    (7, "dec", "¿Código fuera de la lista o es la base?", 2, 5),
    (8, "proc", "continue (se omite)", 3, 6),
    (9, "proc", "writeOne(código, valor)", 1, 6),
    (10, "proc", "refreshCache(); databasePopulator", -1, 4),
    (11, "end", "Fin", 0, 8)], "1>2 2>3 3>4 4>5:S 4>10:N 5>6:N 5>7:S 6>11 7>8:S 7>9:N 8>4 9>4 10>11")
f4_write = G("Backend — RateService::writeOne()", [
    (1, "start", "Inicio writeOne(código, valor float)", 0, 0),
    (2, "proc", "date = hoy", 0, 1),
    (3, "dec", "¿La moneda tiene registro activo?", 0, 2),
    (4, "err", "NotEnabled → throw RuntimeException (500)", -1, 3),
    (5, "dec", "¿Ya hay una tasa del día?", 1, 3),
    (6, "proc", "rateEntry = la tasa existente", 2, 4),
    (7, "proc", "rateEntry = nueva tasa del día", 0, 4),
    (8, "proc", "setRate((string) valor); saveEntity", 1, 5),
    (9, "end", "Fin", 0, 7)], "1>2 2>3 3>4:N 3>5:S 4>9 5>6:S 5>7:N 6>8 7>8 8>9")

PARTS_F4 = [("C", "Cliente HTTP (prueba)"), ("API", "Get / PutUpdate"), ("RS", "RateService"),
            ("SM", "SyncManager"), ("CFG", "Configuración (currencyRates)")]


def f4_seq(title):
    return seq(title, PARTS_F4)


a = f4_seq("Consulta de tasas según permisos")
(a.alt("administrador (CN-CUR-F4-01)")
  .msg("C", "API", "GET /CurrencyRate")
  .msg("API", "RS", "get()")
  .msg("RS", "CFG", "getCurrencyRate por cada moneda")
  .msg("API", "C", '200 {"USD":1,"COP":0.00025}', ret=True)
  .else_("usuario normal (CN-CUR-F4-02)")
  .msg("C", "API", "GET /CurrencyRate")
  .msg("RS", "API", "checkReadAccess → Forbidden", ret=True)
  .msg("API", "C", "403", ret=True)
  .else_("sin autenticar (CN-CUR-F4-03)")
  .msg("API", "C", "401 antes de llegar a la acción", ret=True)
  .end())
b = f4_seq("Actualización válida de tasas")
(b.msg("C", "API", 'PUT /CurrencyRate {"COP":0.00026}')
  .msg("API", "RS", "set(Rates)")
  .msg("RS", "RS", "checkEditAccess; 0.00026 ≥ 0; COP en la lista")
  .msg("RS", "RS", "writeOne('COP', 0.00026): actualiza la tasa del día")
  .msg("RS", "SM", "refreshCache()")
  .msg("SM", "CFG", "currencyRates = tasas vigentes")
  .msg("API", "C", "200 true", ret=True))
c = f4_seq("Valor de tasa inválido o en el límite")
(c.alt("negativa (CN-CUR-F4-06)")
  .msg("C", "API", '{"COP":-0.5}')
  .msg("RS", "API", "valor < 0 → BadRequest", ret=True)
  .msg("API", "C", "400", ret=True)
  .else_("cero (CN-CUR-F4-07, DEF-CUR-04)")
  .msg("C", "API", '{"COP":0}')
  .note("RS", "0 no es < 0: pasa al nodo 9 y se guarda")
  .msg("SM", "CFG", "COP = 0")
  .msg("API", "C", "200 true; después la conversión a COP divide por cero", ret=True)
  .else_("texto 'abc' (CN-CUR-F4-08, DEF-CUR-03)")
  .msg("C", "API", '{"COP":"abc"}')
  .note("RS", "'abc' < 0 es falso; writeOne(string, float) lanza TypeError")
  .msg("API", "C", "500", ret=True)
  .end())
d = f4_seq("Cuerpo con monedas no aplicables o mal formado")
(d.alt("EUR o USD (CN-CUR-F4-09, 10)")
  .msg("C", "API", '{"EUR":0.9} o {"USD":2}')
  .msg("RS", "RS", "fuera de la lista o base → continue")
  .msg("API", "C", "200 true, sin cambios", ret=True)
  .else_("arreglo [1,2] (CN-CUR-F4-11, OBS-CUR-06)")
  .msg("C", "API", "[1,2]")
  .msg("RS", "RS", "solo la base ficticia '___' → continue; refreshCache")
  .msg("API", "C", "200 true", ret=True)
  .end())
e = f4_seq("Actualización sin permisos")
(e.alt("usuario normal (CN-CUR-F4-12)")
  .msg("C", "API", 'PUT {"COP":0.0003}')
  .msg("RS", "API", "checkEditAccess → Forbidden", ret=True)
  .msg("API", "C", "403", ret=True)
  .else_("sin autenticar (CN-CUR-F4-13)")
  .msg("API", "C", "401", ret=True)
  .end())

write(4, "consulta y actualización de tasas (API)",
      "**Funcionalidad:** `GET` y `PUT /api/v1/CurrencyRate` leen y escriben las tasas vigentes con control de permisos. "
      "La pantalla web no usa esta ruta, así que, como se acordó, la capa de «frontend» es la entrada de la API que "
      "ve el cliente.",
      md_graph(f4_fe, "application/Espo/Tools/Currency/Api/Get.php y PutUpdate.php",
               {2: "(autenticación del núcleo)", 5: "Get.php 48-50", 6: "PutUpdate.php 49-51",
                7: "PutUpdate.php 53-55"}, [
          ("C1", "1-2-3-8", "Sin credenciales.", "CN-CUR-F4-03 y 13"),
          ("C2", "1-2-4-5-8", "GET.", "CN-CUR-F4-01 y 02"),
          ("C3", "1-2-4-6-7-8", "PUT.", "CN-CUR-F4-04 a 12")]),
      "\n".join([
          md_graph(f4_acl, RS, {1: "119 / 133", 2: "121 / 135", 3: "122 / 136", 4: "125 / 139", 5: "126 / 140",
                                6: "128 / 142", 7: "128 / 142"}, [
              ("C1", "1-2-3-7", "Sin acceso al ámbito Currency.",
               "CN-CUR-F4-02 y 12 recorren C1 o C2: la respuesta 403 no permite distinguirlos"),
              ("C2", "1-2-4-5-7", "Acceso al ámbito sin nivel suficiente.", "Ver C1 (caso nuevo CB-CUR-F4-01 para separarlos)"),
              ("C3", "1-2-4-6-7", "Administrador.", "CN-CUR-F4-01 y 04 a 11")],
              "Los dos métodos tienen el mismo grafo; cambia solo la acción consultada (lectura o edición)."),
          md_graph(f4_get, RS, {1: "60", 2: "62", 3: "64", 4: "66", 5: "67", 6: "70", 7: "71"}, [
              ("C1", "1-2-3-4-6-7", "Lista de monedas vacía.", "No factible: siempre está al menos la moneda base"),
              ("C2", "1-2-3-4-5-4-6-7", "Una o más monedas.", "CN-CUR-F4-01")]),
          md_graph(f4_set, RS, {1: "77", 2: "79", 3: "81-82", 4: "84", 5: "85", 6: "86", 7: "89", 8: "90",
                                9: "93", 10: "96-97", 11: "98"}, [
              ("C1", "1-2-3-4-10-11", "Sin pares en el cuerpo.", "No factible: `PutUpdate` arma las tasas con la base ficticia '___' y `toAssoc()` siempre la agrega, así que el bucle da al menos una vuelta (`testElCuerpoVacioIgualRecorreLaBase`)"),
              ("C2", "1-2-3-4-5-6-11", "Valor negativo.", "CN-CUR-F4-06"),
              ("C3", "1-2-3-4-5-7-8-4-10-11", "Código omitido.", "CN-CUR-F4-09, 10 y 11 (en el 11 solo se recorre la base ficticia '___')"),
              ("C4", "1-2-3-4-5-7-9-4-10-11", "Código escrito.",
               "CN-CUR-F4-04, 05 y 07 (el 0 pasa el nodo 5: DEF-CUR-04); CN-CUR-F4-08 llega al nodo 9 y falla en writeOne (DEF-CUR-03)")],
              "La decisión 7 es compuesta (`!in_array || code === base`)."),
          md_graph(f4_write, RS, {1: "100", 2: "102", 3: "105 (NotEnabled)", 4: "107-108", 5: "105 (??)",
                                  6: "105", 7: "106", 8: "111-113", 9: "114"}, [
              ("C1", "1-2-3-4-9", "Moneda sin registro activo.",
               "No factible desde la API: set() ya omite los códigos fuera de la lista"),
              ("C2", "1-2-3-5-6-8-9", "Ya existe la tasa del día.",
               "CN-CUR-F4-04, 05 y 07 (la tasa de hoy ya se había creado desde la pantalla)"),
              ("C3", "1-2-3-5-7-8-9", "Primera tasa del día.", "Ninguno (caso nuevo CB-CUR-F4-02)")],
              "Con `'abc'` el `TypeError` ocurre al llamar el método (firma `float`), antes del nodo 1.")]),
      "\n".join([md_seq("ESC-CUR-F4-01", a, "Entrada C1 y C2; checkReadAccess C1/C2 y C3; get C2."),
                 md_seq("ESC-CUR-F4-02", b, "Entrada C3; checkEditAccess C3; set C4; writeOne C2."),
                 md_seq("ESC-CUR-F4-03", c, "set C2 (negativa) y C4 (cero y texto)."),
                 md_seq("ESC-CUR-F4-04", d, "set C3 en los tres casos."),
                 md_seq("ESC-CUR-F4-05", e, "Entrada C1; checkEditAccess C1/C2.")]),
      """| Escenario | Entrada | Permisos | get | set | writeOne |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ESC-CUR-F4-01 Consulta | C1, C2 | C1/C2, C3 | C2 | — | — |
| ESC-CUR-F4-02 Actualización válida | C3 | C3 | — | C4 | C2 |
| ESC-CUR-F4-03 Valor inválido | C3 | C3 | — | C2, C4 | C2 |
| ESC-CUR-F4-04 No aplicables | C3 | C3 | — | C3 | — |
| ESC-CUR-F4-05 Sin permisos | C1, C3 | C1/C2 | — | — | — |

| Grafo | V(G) | Caminos factibles | Cubiertos | Cobertura |
| :--- | :--- | :--- | :--- | :--- |
| Entrada | 3 | 3 | 3 | 100 % |
| `check…Access` | 3 | 3 | 2 o 3 | 67–100 % |
| `get` | 2 | 1 | 1 | 100 % |
| `set` | 4 | 3 | 3 | 100 % |
| `writeOne` | 3 | 2 | 1 | 50 % |""",
      """| ID | Grafo y camino | Entrada | Resultado esperado | Estado |
| :--- | :--- | :--- | :--- | :--- |
| CB-CUR-F4-01 | check…Access C1 y C2 | Doble de `Acl`: `check()` falso; `check()` verdadero con nivel `no` | `Forbidden` en ambos, desde nodos distintos | Pasó: `RateServiceTest::testSinAccesoAlAmbitoEsForbidden` y `testNivelDeEdicionNoEsForbidden` |
| CB-CUR-F4-02 | writeOne C3 | PUT de COP en un día sin tasa | Se crea una tasa nueva con fecha de hoy | Pasó: `RateServiceTest::testCreaLaTasaDelDiaSiNoExiste` |
| CB-CUR-F4-03 | set nodo 5 (límite) | `{"COP":0}` | 400 (comportamiento esperado tras corregir DEF-CUR-04) | Candidato para el ciclo TDD; hoy `RateServiceTest::testDefCur04LaTasaCeroSeGuarda` documenta el defecto |""",
      """- **DEF-CUR-04:** el nodo 5 de `set()` solo rechaza `valor < 0`; el cero pasa, aunque el formulario de tasas exige como mínimo 0.0001. Corregirlo a `valor < 0.0001` (o `<= 0`) alinea la API con la pantalla.
- **DEF-CUR-03:** `set()` no comprueba que el valor sea numérico antes de llamar `writeOne(string, float)`; el `TypeError` resultante sale como 500.
- **OBS-CUR-06:** un cuerpo que no es objeto llega a `set()` solo con la base ficticia `'___'` y devuelve `true`; la entrada debería responder 400.""")

# ==================================================================================== CUR-F5
f5_fe = G("Frontend — decimal.ts::validateRange() del campo Rate", [
    (1, "start", "Inicio validateRange()", 0, 0),
    (2, "dec", "¿value es null?", 0, 1),
    (3, "proc", "return false (no aplica)", 1, 2),
    (4, "proc", "Leer min y max del campo", -1, 2),
    (5, "dec", "¿Hay min y max?", -1, 3),
    (6, "dec", "¿value < min o value > max?", 0, 4),
    (7, "err", "Mensaje «entre min y max»; return true", 1, 5),
    (8, "proc", "return false", -0.6, 5),
    (9, "dec", "¿Hay min?", -2, 4),
    (10, "dec", "¿value < min?", -1.3, 5),
    (11, "err", "Mensaje «Rate shouldn't be less than 0.0001»; return true", -0.7, 6),
    (12, "proc", "return false", -1.9, 6),
    (13, "dec", "¿Hay max?", -3, 5),
    (14, "dec", "¿value > max?", -2.5, 6),
    (15, "err", "Mensaje «no mayor que max»; return true", -2.2, 7),
    (16, "proc", "return false", -2.9, 7),
    (17, "proc", "return false", -3.6, 6),
    (18, "end", "Fin", -1, 9)],
    "1>2 2>3:S 2>4:N 3>18 4>5 5>6:S 5>9:N 6>7:S 6>8:N 7>18 8>18 9>10:S 9>13:N 10>11:S 10>12:N 11>18 12>18 "
    "13>14:S 13>17:N 14>15:S 14>16:N 15>18 16>18 17>18")
f5_hook = G("Backend — RecordHooks CurrencyRecordRate AfterSave / AfterDelete::process()", [
    (1, "start", "Inicio process(tasa)", 0, 0),
    (2, "proc", "code = código de la moneda de la tasa", 0, 1),
    (3, "proc", "SyncManager::updateCode(code)", 0, 2),
    (4, "dec", "¿updateCode lanzó NotEnabled?", 0, 3),
    (5, "err", "throw Conflict (409)", 1, 4),
    (6, "proc", "databasePopulator; submit appParamsUpdate", -1, 4),
    (7, "end", "Fin", 0, 6)], "1>2 2>3 3>4 4>5:S 4>6:N 5>7 6>7")
f5_upd = G("Backend — SyncManager::updateCode()", [
    (1, "start", "Inicio updateCode(code)", 0, 0),
    (2, "proc", "rates = currencyRates de la configuración", 0, 1),
    (3, "dec", "¿getRate(code) devuelve una tasa vigente (fecha ≤ hoy)?", 0, 2),
    (4, "proc", "rate = esa tasa", 1, 3),
    (5, "proc", "rate = '1.0' (DEF-CUR-05)", -1, 3),
    (6, "proc", "rates[code] = (float) rate; guardar currencyRates", 0, 4),
    (7, "proc", "dispatchUpdateEvent(); clearCache()", 0, 5),
    (8, "end", "Fin", 0, 6)], "1>2 2>3 3>4:S 3>5:N 4>6 5>6 6>7 7>8")
f5_sync = G("Backend — SyncManager::syncCode() (alta de monedas desde Administration › Currency)", [
    (1, "start", "Inicio syncCode(code)", 0, 0),
    (2, "proc", "Buscar CurrencyRecord por código", 0, 1),
    (3, "dec", "¿Existe el registro?", 0, 2),
    (4, "proc", "Usar el registro existente", 1, 3),
    (5, "proc", "Crear registro nuevo con el código", -1, 3),
    (6, "proc", "status = Active; guardar", 0, 4),
    (7, "end", "Fin", 0, 5)], "1>2 2>3 3>4:S 3>5:N 4>6 5>6 6>7")

SM = "application/Espo/Tools/Currency/SyncManager.php"
PARTS_F5 = [("U", "Administrador"), ("FE", "Pantalla Currencies › COP"), ("API", "API CurrencyRecordRate"),
            ("HK", "Hook AfterSave / AfterDelete"), ("SM", "SyncManager"), ("CFG", "currencyRates")]


def f5_seq(title):
    return seq(title, PARTS_F5)


t1 = f5_seq("Alta de moneda y creación de tasa")
(t1.msg("U", "FE", "Administration › Currency: añade COP y guarda")
   .msg("FE", "API", "PUT Settings {currencyList: [USD, COP]}")
   .msg("API", "SM", "sync(): syncCode(USD), syncCode(COP)")
   .note("SM", "COP no existe: syncCode crea el registro (C2); USD existe (C1)")
   .msg("U", "FE", "Panel Rates › Create: 0.00025, fecha de hoy")
   .msg("FE", "FE", "validateRange: 0.00025 ≥ 0.0001")
   .msg("FE", "API", "POST /CurrencyRecordRate")
   .msg("API", "HK", "AfterSave")
   .msg("HK", "SM", "updateCode('COP')")
   .msg("SM", "CFG", "COP = 0.00025")
   .msg("API", "FE", "200; aviso «Created»", ret=True))
t2 = f5_seq("Edición de la tasa vigente")
(t2.msg("U", "FE", "Edit: 0.0003 → 0.00025")
   .msg("FE", "API", "PUT /CurrencyRecordRate/{id}")
   .msg("API", "HK", "AfterSave")
   .msg("HK", "SM", "updateCode('COP'): getRate = 0.00025")
   .msg("SM", "CFG", "COP = 0.00025"))
t3 = f5_seq("Tasas con fecha pasada o futura")
(t3.msg("U", "FE", "Create 01.11.2026 = 0.0005 y 20.11.2026 = 0.0004")
   .msg("FE", "API", "POST /CurrencyRecordRate (dos veces)")
   .msg("API", "HK", "AfterSave")
   .msg("HK", "SM", "updateCode('COP')")
   .note("SM", "getRate toma la tasa más reciente con fecha ≤ hoy: sigue la de hoy")
   .msg("SM", "CFG", "COP = 0.00025 (sin cambios)"))
t4 = f5_seq("Eliminación de tasas")
(t4.alt("queda una tasa anterior (CN-CUR-F5-06)")
   .msg("FE", "API", "DELETE tasa de hoy")
   .msg("API", "HK", "AfterDelete")
   .msg("HK", "SM", "updateCode: getRate = 0.0005 (01 Nov)")
   .msg("SM", "CFG", "COP = 0.0005")
   .else_("solo queda una tasa futura (CN-CUR-F5-07, DEF-CUR-05)")
   .msg("FE", "API", "DELETE tasa de 01 Nov")
   .msg("API", "HK", "AfterDelete")
   .msg("HK", "SM", "updateCode: getRate = null")
   .note("SM", "rate = '1.0' sin avisar")
   .msg("SM", "CFG", "COP = 1")
   .msg("API", "FE", "Detalle «Rate: None», configuración en 1", ret=True)
   .end())
t5 = f5_seq("Validación del valor de la tasa en el formulario")
(t5.alt("−1, 0 o 0.00009 (CN-CUR-F5-08 a 10)")
   .msg("U", "FE", "Rate < 0.0001; Ctrl+Enter")
   .msg("FE", "FE", "validateRange: value < min")
   .msg("FE", "U", "«Rate shouldn't be less than 0.0001»; no se envía nada", ret=True)
   .else_("0.0001 (CN-CUR-F5-11)")
   .msg("FE", "API", "POST /CurrencyRecordRate")
   .msg("API", "HK", "AfterSave → updateCode")
   .msg("SM", "CFG", "COP = 0.0001")
   .end())
t6 = f5_seq("Acceso sin privilegios")
(t6.msg("U", "API", "GET /CurrencyRecord como usuario normal")
   .msg("API", "U", "403 (control de acceso del registro)", ret=True))

write(5, "sincronización de tasas vigentes hacia la configuración",
      "**Funcionalidad:** al crear, editar o borrar una tasa en *Currencies › COP › Rates*, los hooks del registro "
      "llaman `SyncManager::updateCode()`, que escribe en la configuración (`currencyRates`) la tasa vigente. Al "
      "cambiar la lista de monedas, `SyncManager::sync()` crea o activa los registros de moneda.",
      md_graph(f5_fe, "client/src/views/fields/decimal.ts",
               {1: "200", 2: "203", 3: "204", 4: "207-208", 5: "210", 6: "211", 7: "212-219", 8: "222",
                9: "225", 10: "226", 11: "227-233", 12: "246", 13: "235", 14: "236", 15: "237-243", 16: "246",
                17: "246", 18: "247"}, [
          ("C1", "1-2-3-18", "Valor nulo.", "Ninguno: el campo es requerido y lo frena la validación required"),
          ("C2", "1-2-4-5-6-7-18", "Con min y max, fuera de rango.", "No aplica al campo Rate (solo tiene min)"),
          ("C3", "1-2-4-5-6-8-18", "Con min y max, en rango.", "No aplica al campo Rate"),
          ("C4", "1-2-4-5-9-10-11-18", "Menor que el mínimo.", "CN-CUR-F5-08, 09 y 10"),
          ("C5", "1-2-4-5-9-10-12-18", "Mayor o igual que el mínimo.", "CN-CUR-F5-02 a 05 y 11"),
          ("C6", "1-2-4-5-9-13-14-15-18", "Solo max, superado.", "No aplica al campo Rate"),
          ("C7", "1-2-4-5-9-13-14-16-18", "Solo max, en rango.", "No aplica al campo Rate"),
          ("C8", "1-2-4-5-9-13-17-18", "Sin límites.", "No aplica al campo Rate")],
               "El campo Rate define `min: 0.0001` en `entityDefs/CurrencyRecordRate.json`; los caminos con `max` se "
               "cubren con otro campo decimal en las pruebas unitarias."),
      "\n".join([
          md_graph(f5_hook, "application/Espo/Classes/RecordHooks/CurrencyRecordRate/AfterSave.php y AfterDelete.php",
                   {}, [
              ("C1", "1-2-3-4-5-7", "Moneda no habilitada.", "Ninguno (caso nuevo CB-CUR-F5-01)"),
              ("C2", "1-2-3-4-6-7", "Moneda habilitada.", "CN-CUR-F5-02 a 07 y 11")],
                   "AfterSave y AfterDelete tienen el mismo cuerpo."),
          md_graph(f5_upd, SM, {1: "150", 2: "152", 3: "154 (??)", 4: "154", 5: "154", 6: "156-159", 7: "161-162",
                                8: "163"}, [
              ("C1", "1-2-3-4-6-7-8", "Hay tasa vigente.", "CN-CUR-F5-02 a 06 y 11"),
              ("C2", "1-2-3-5-6-7-8", "No hay tasa vigente.", "CN-CUR-F5-07 (Fallido, DEF-CUR-05)")],
                   "`getRate()` toma la tasa más reciente con fecha menor o igual a hoy; por eso las fechas pasadas y "
                   "futuras de CN-CUR-F5-04 y 05 no cambian la configuración."),
          md_graph(f5_sync, SM, {1: "82", 2: "84-87", 3: "89", 4: "89", 5: "90-92", 6: "95-97", 7: "98"}, [
              ("C1", "1-2-3-4-6-7", "La moneda ya tiene registro.", "CN-CUR-F5-01 (USD)"),
              ("C2", "1-2-3-5-6-7", "Moneda nueva.", "CN-CUR-F5-01 (COP)")])]),
      "\n".join([md_seq("ESC-CUR-F5-01", t1, "syncCode C1 y C2; validateRange C5; hook C2; updateCode C1."),
                 md_seq("ESC-CUR-F5-02", t2, "Hook C2; updateCode C1."),
                 md_seq("ESC-CUR-F5-03", t3, "Hook C2; updateCode C1 sin cambio de valor."),
                 md_seq("ESC-CUR-F5-04", t4, "updateCode C1 y luego C2 (DEF-CUR-05)."),
                 md_seq("ESC-CUR-F5-05", t5, "validateRange C4 y C5."),
                 md_seq("ESC-CUR-F5-06", t6, "No llega al módulo: lo frena el control de acceso del registro.")]),
      """| Escenario | Frontend | Hook | updateCode | syncCode |
| :--- | :--- | :--- | :--- | :--- |
| ESC-CUR-F5-01 Alta y creación | C5 | C2 | C1 | C1, C2 |
| ESC-CUR-F5-02 Edición | C5 | C2 | C1 | — |
| ESC-CUR-F5-03 Fechas pasada y futura | C5 | C2 | C1 | — |
| ESC-CUR-F5-04 Eliminación | — | C2 | C1, C2 | — |
| ESC-CUR-F5-05 Validación del formulario | C4, C5 | C2 | C1 | — |
| ESC-CUR-F5-06 Sin privilegios | — | — | — | — |

| Grafo | V(G) | Caminos que aplican al campo Rate o al flujo | Cubiertos | Cobertura |
| :--- | :--- | :--- | :--- | :--- |
| Frontend `validateRange` | 8 | 2 (C4, C5) | 2 | 100 % de los aplicables; 25 % del total |
| Hook | 2 | 2 | 1 | 50 % |
| `updateCode` | 2 | 2 | 2 | 100 % |
| `syncCode` | 2 | 2 | 2 | 100 % |""",
      """| ID | Grafo y camino | Entrada | Resultado esperado | Estado |
| :--- | :--- | :--- | :--- | :--- |
| CB-CUR-F5-01 | Hook C1 | Guardar una tasa de una moneda con registro inactivo | 409 Conflict | Pasó: `RateSyncTest::testAfterSaveConMonedaNoHabilitadaEsConflict` y la de AfterDelete |
| CB-CUR-F5-02 | validateRange C2, C3, C6 a C8 | Campo decimal de prueba con min y max | Mensajes «entre», «no mayor que» y sin mensaje | Pendiente: prueba del frontend (hay que compilar el cliente) |
| CB-CUR-F5-03 | updateCode C2 | Doble de RateEntryProvider que devuelve null | Hoy: tasa 1.0. Esperado tras corregir DEF-CUR-05: conservar la última o avisar | Candidato para el ciclo TDD; hoy `RateSyncTest::testDefCur05SinTasaVigenteEscribeUno` documenta el defecto |""",
      """- **DEF-CUR-05 en el código:** el nodo 5 de `updateCode()` (`?? '1.0'`) escribe 1 en la configuración cuando no hay tasa vigente. Es el mismo valor por defecto que `getCurrencyRate()` de CUR-F1 (nodo 7).
- **Validación solo en la pantalla:** el mínimo de 0.0001 lo aplica `validateRange()` en el navegador y la definición del campo; `RateService::set()` (CUR-F4) no lo comprueba, por eso la API acepta 0 (DEF-CUR-04).
- **Hooks de registro y no de entidad:** `writeOne()` de CUR-F4 guarda con `EntityManager` y no dispara estos hooks; por eso `set()` llama `refreshCache()` aparte.""")
