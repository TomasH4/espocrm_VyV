"""Genera la caja blanca de CUR-F1 (conversión de montos entre monedas).

Salida: docs/CUR/CUR-F1/caja-blanca.md y los SVG en docs/CUR/CUR-F1/img/.
Uso:   python docs/CUR/herramientas/generar_cur_f1.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from diagramas import Graph, Seq, cfg_svg, flowchart_svg, mermaid, mermaid_seq, sequence_svg

OUT = Path(__file__).resolve().parents[1] / "CUR-F1"
IMG = OUT / "img"
IMG.mkdir(parents=True, exist_ok=True)

KIND = {"start": "Inicio", "end": "Fin", "proc": "Proceso", "dec": "Decisión", "err": "Salida de error"}

# =============================================================================== FRONTEND
fe = Graph("Frontend — index.js::run() del Formula Sandbox")
(fe.node(1, "start", "Inicio run()", 0, 0)
   .node(2, "proc", "Limpiar output y errorMessage; leer el script", 0, 1)
   .node(3, "dec", "¿El script está vacío?", 0, 2)
   .node(4, "proc", "Aviso «emptyScript»", 1, 3)
   .node(5, "proc", "Deshabilitar acciones; POST Formula/action/run", -1, 3)
   .node(6, "dec", "¿La petición respondió con error HTTP?", -1, 4)
   .node(7, "err", "Habilitar acciones; aviso global «Internal server error»", 0, 5)
   .node(8, "proc", "Habilitar acciones; output = response.output", -2, 5)
   .node(9, "dec", "¿response.isSuccess?", -2, 6)
   .node(10, "proc", "errorMessage queda en null", -1, 7)
   .node(11, "proc", "errorMessage = response.message", -3, 7)
   .node(12, "proc", "Mostrar errorMessage en el formulario", -2, 8)
   .node(13, "dec", "¿response.isSuccess?", -2, 9)
   .node(14, "proc", "Aviso «Executed successfully.»", -0.3, 10)
   .node(15, "dec", "¿response.isSyntaxError?", -3, 10)
   .node(16, "proc", "msg = «Syntax error»", -2, 11)
   .node(17, "dec", "¿response.message?", -2, 12)
   .node(18, "proc", "msg += response.message", -1, 13)
   .node(19, "proc", "Aviso de error de sintaxis (msg)", -2.5, 14)
   .node(20, "proc", "msg = «Error.»", -4, 11)
   .node(21, "dec", "¿response.message?", -4, 12)
   .node(22, "proc", "msg += response.message", -3.3, 13)
   .node(23, "proc", "Aviso de error de ejecución (msg)", -4.6, 14)
   .node(24, "end", "Fin", 0, 16))
for a, b, lab in [(1, 2, ""), (2, 3, ""), (3, 4, "Sí"), (3, 5, "No"), (4, 24, ""), (5, 6, ""), (6, 7, "Sí"),
                  (6, 8, "No"), (7, 24, ""), (8, 9, ""), (9, 10, "Sí"), (9, 11, "No"), (10, 12, ""), (11, 12, ""),
                  (12, 13, ""), (13, 14, "Sí"), (13, 15, "No"), (14, 24, ""), (15, 16, "Sí"), (15, 20, "No"),
                  (16, 17, ""), (17, 18, "Sí"), (17, 19, "No"), (18, 19, ""), (19, 24, ""), (20, 21, ""),
                  (21, 22, "Sí"), (21, 23, "No"), (22, 23, ""), (23, 24, "")]:
    fe.edge(a, b, lab)

FE_LINES = {1: "166", 2: "167-172", 3: "174", 4: "175-181", 5: "185-195", 6: "196", 7: "197-199", 8: "202-204",
            9: "208", 10: "206", 11: "209", 12: "212", 13: "214", 14: "215-219", 15: "222", 16: "223",
            17: "225", 18: "226", 19: "229-231", 20: "234", 21: "236", 22: "237", 23: "240", 24: "241"}

FE_PATHS = [
    ("C1", "1-2-3-4-24", "Script vacío: aviso «emptyScript».", "Ninguno (caso nuevo CB-CUR-F1-FE-01)"),
    ("C2", "1-2-3-5-6-7-24", "El servidor responde con error HTTP (500).",
     "ESC-CUR-F1-04 (CN-CUR-F1-11, 12, 13) y ESC-CUR-F1-05 (CN-CUR-F1-17)"),
    ("C3", "1-2-3-5-6-8-9-10-12-13-14-24", "Conversión exitosa.", "ESC-CUR-F1-01, 02 y 03 (CN-CUR-F1-01 a 10)"),
    ("C4", "1-2-3-5-6-8-9-11-12-13-15-16-17-18-19-24", "Error de sintaxis con mensaje.",
     "Ninguno (caso nuevo CB-CUR-F1-FE-02)"),
    ("C5", "1-2-3-5-6-8-9-11-12-13-15-16-17-19-24", "Error de sintaxis sin mensaje.",
     "Ninguno: solo ocurre si la excepción de sintaxis llega sin texto (RunResult copia su mensaje); ninguna fórmula de CUR-F1 lo produce"),
    ("C6", "1-2-3-5-6-8-9-11-12-13-15-20-21-22-23-24", "Error de ejecución de la fórmula con mensaje.",
     "ESC-CUR-F1-05 (CN-CUR-F1-14, 15 y 16)"),
    ("C7", "1-2-3-5-6-8-9-11-12-13-15-20-21-23-24", "Error de ejecución sin mensaje.",
     "Ninguno: solo ocurre si el error de fórmula llega sin texto; las excepciones de ConvertType siempre traen mensaje"),
    ("C8", "1-2-3-5-6-8-9-11-12-13-14-24", "isSuccess falso en el nodo 9 y verdadero en el 13.",
     "No factible: los nodos 9 y 13 evalúan la misma condición (decisiones correlacionadas)"),
]

# =============================================================================== BACKEND
be1 = Graph("Backend — ConvertType::process() (función de fórmula ext\\currency\\convert)")
(be1.node(1, "start", "Inicio process(arguments)", 0, 0)
    .node(2, "dec", "¿Hay menos de 2 argumentos?", 0, 1)
    .node(3, "err", "throw TooFewArguments", 4, 2)
    .node(4, "proc", "amount = arg 1; fromCode = arg 2", -1, 2)
    .node(5, "dec", "¿Existe el argumento 3?", -1, 3)
    .node(6, "proc", "toCode = arg 3", 0, 4)
    .node(7, "proc", "toCode = moneda por defecto", -2, 4)
    .node(8, "dec", "¿amount es string, int o float?", -1, 5)
    .node(9, "err", "throw BadArgumentType (posición 1)", -2, 6)
    .node(10, "dec", "¿fromCode es string?", 0, 6)
    .node(11, "err", "throw BadArgumentType (posición 2)", -1, 7)
    .node(12, "dec", "¿toCode es string?", 1, 7)
    .node(13, "err", "throw BadArgumentType (posición 3)", 0, 8)
    .node(14, "dec", "¿is_numeric(amount)? (assert)", 2, 8)
    .node(15, "err", "AssertionError → HTTP 500 (DEF-CUR-02)", 1, 9)
    .node(16, "proc", "value = Currency::create; Converter::convert(value, toCode)", 3, 9)
    .node(17, "proc", "return monto convertido como texto", 3, 10)
    .node(18, "end", "Fin", 1, 12))
for a, b, lab in [(1, 2, ""), (2, 3, "Sí"), (2, 4, "No"), (3, 18, ""), (4, 5, ""), (5, 6, "Sí"), (5, 7, "No"),
                  (6, 8, ""), (7, 8, ""), (8, 10, "Sí"), (8, 9, "No"), (9, 18, ""), (10, 12, "Sí"), (10, 11, "No"),
                  (11, 18, ""), (12, 14, "Sí"), (12, 13, "No"), (13, 18, ""), (14, 16, "Sí"), (14, 15, "No"),
                  (15, 18, ""), (16, 17, ""), (17, 18, "")]:
    be1.edge(a, b, lab)
BE1_LINES = {1: "46", 2: "49", 3: "50", 4: "53-54", 5: "55 (??)", 6: "55", 7: "55", 8: "57-61", 9: "62", 10: "65",
             11: "66", 12: "69", 13: "70", 14: "73", 15: "73", 16: "75-77", 17: "79", 18: "80"}
BE1_PATHS = [
    ("C1", "1-2-3-18", "Menos de 2 argumentos.", "CN-CUR-F1-14"),
    ("C2", "1-2-4-5-6-8-9-18", "Monto de tipo no admitido (booleano).", "CN-CUR-F1-15"),
    ("C3", "1-2-4-5-7-8-10-12-14-16-17-18", "Dos argumentos: se usa la moneda por defecto.", "CN-CUR-F1-04"),
    ("C4", "1-2-4-5-6-8-10-11-18", "Moneda origen que no es texto.", "CN-CUR-F1-16"),
    ("C5", "1-2-4-5-6-8-10-12-13-18", "Moneda destino que no es texto.", "Ninguno (caso nuevo CB-CUR-F1-BE-01)"),
    ("C6", "1-2-4-5-6-8-10-12-14-15-18", "Monto de texto no numérico.", "CN-CUR-F1-17 (Fallido, DEF-CUR-02)"),
    ("C7", "1-2-4-5-6-8-10-12-14-16-17-18", "Tres argumentos válidos.",
     "CN-CUR-F1-01 a 03 y 05 a 10; también CN-CUR-F1-11 a 13, que fallan después dentro de Converter"),
]

be2 = Graph("Backend — Converter::convert()")
(be2.node(1, "start", "Inicio convert(value, targetCode)", 0, 0)
    .node(2, "dec", "¿hasCurrency(targetCode)?", 0, 1)
    .node(3, "err", "throw RuntimeException «unknown currency» (DEF-CUR-01)", -1, 2)
    .node(4, "proc", "rate = getCurrencyRate(moneda origen)", 1, 2)
    .node(5, "proc", "targetRate = getCurrencyRate(targetCode)", 1, 3)
    .node(6, "proc", "monto = divide(multiply(monto, rate), targetRate) — CUR-F2", 1, 4)
    .node(7, "proc", "return new Currency(monto, targetCode)", 1, 5)
    .node(8, "end", "Fin", 0, 7))
for a, b, lab in [(1, 2, ""), (2, 4, "Sí"), (2, 3, "No"), (3, 8, ""), (4, 5, ""), (5, 6, ""), (6, 7, ""), (7, 8, "")]:
    be2.edge(a, b, lab)
BE2_LINES = {1: "53", 2: "55", 3: "56", 4: "59", 5: "60", 6: "62", 7: "64", 8: "65"}
BE2_PATHS = [
    ("C1", "1-2-3-8", "Moneda destino no configurada.", "CN-CUR-F1-11 y CN-CUR-F1-13 (Fallidos, DEF-CUR-01)"),
    ("C2", "1-2-4-5-6-7-8", "Moneda destino configurada.",
     "CN-CUR-F1-01 a 10; también CN-CUR-F1-12, que falla dentro de getCurrencyRate"),
]

be3 = Graph("Backend — ConfigDataProvider::getCurrencyRate()")
(be3.node(1, "start", "Inicio getCurrencyRate(code)", 0, 0)
    .node(2, "proc", "rates = tasas de la moneda base", 0, 1)
    .node(3, "dec", "¿hasCurrency(code)?", 0, 2)
    .node(4, "err", "throw RuntimeException «Can't get currency rate»", -1, 3)
    .node(5, "dec", "¿Existe rates[code]?", 1, 3)
    .node(6, "proc", "return rates[code]", 2, 4)
    .node(7, "proc", "return 1.0 (sin tasa registrada)", 0, 4)
    .node(8, "end", "Fin", 0.5, 6))
for a, b, lab in [(1, 2, ""), (2, 3, ""), (3, 5, "Sí"), (3, 4, "No"), (4, 8, ""), (5, 6, "Sí"), (5, 7, "No"),
                  (6, 8, ""), (7, 8, "")]:
    be3.edge(a, b, lab)
BE3_LINES = {1: "89", 2: "91", 3: "93", 4: "94", 5: "97 (??)", 6: "97", 7: "97", 8: "98"}
BE3_PATHS = [
    ("C1", "1-2-3-4-8", "Moneda origen no configurada.", "CN-CUR-F1-12 (Fallido, DEF-CUR-01)"),
    ("C2", "1-2-3-5-6-8", "Moneda configurada con tasa registrada.", "CN-CUR-F1-01 a 10"),
    ("C3", "1-2-3-5-7-8", "Moneda configurada sin tasa en la configuración: vale 1.",
     "Ninguno de CUR-F1 (caso nuevo CB-CUR-F1-BE-02); relacionado con DEF-CUR-05"),
]

GRAPHS = [
    ("fe-run", fe, FE_LINES, FE_PATHS, "client/src/views/admin/formula-sandbox/index.js"),
    ("be-convert-type", be1, BE1_LINES, BE1_PATHS,
     "application/Espo/Core/Formula/Functions/ExtGroup/CurrencyGroup/ConvertType.php"),
    ("be-converter", be2, BE2_LINES, BE2_PATHS, "application/Espo/Core/Currency/Converter.php"),
    ("be-rate", be3, BE3_LINES, BE3_PATHS, "application/Espo/Core/Currency/ConfigDataProvider.php"),
]

# =============================================================================== INTEGRACIÓN
PARTS = [("U", "Administrador"), ("FE", "Formula Sandbox (index.js)"), ("API", "FormulaController y Formula Service"),
         ("CT", "ConvertType (fórmula)"), ("CV", "Converter"), ("CFG", "ConfigDataProvider")]


def seq(title):
    s = Seq(title)
    for pid, label in PARTS:
        s.participant(pid, label)
    return s


def inicio(s, formula):
    (s.msg("U", "FE", f"Escribe {formula} y pulsa Run")
      .msg("FE", "API", "POST /api/v1/Formula/action/run {expression}")
      .msg("API", "API", "checkSyntax: sintaxis correcta")
      .msg("API", "CT", "Manager::run → process(argumentos)"))
    return s


def exito(s, salida):
    (s.msg("CT", "CV", "convert(Currency, destino)")
      .msg("CV", "CFG", "hasCurrency(destino)")
      .msg("CFG", "CV", "true", ret=True)
      .msg("CV", "CFG", "getCurrencyRate(origen), getCurrencyRate(destino)")
      .msg("CFG", "CV", "tasas", ret=True)
      .msg("CV", "CV", "divide(multiply(monto, tasa), tasaDestino)")
      .msg("CV", "CT", "Currency convertido", ret=True)
      .msg("CT", "API", "monto como texto", ret=True)
      .msg("API", "FE", "200 {isSuccess: true, output}", ret=True)
      .msg("FE", "U", f"Output {salida}; aviso «Executed successfully.»", ret=True))
    return s


SEQS = []
s = inicio(seq("Integración ESC-CUR-F1-01 — Conversión válida entre monedas configuradas"),
           "ext\\currency\\convert(100, 'USD', 'COP')")
SEQS.append(("int-esc-01", "ESC-CUR-F1-01", exito(s, "400000.00000000000000"),
             "Recorre FE C3, ConvertType C7, Converter C2 y getCurrencyRate C2. Casos CN-CUR-F1-01 y 02."))

s = inicio(seq("Integración ESC-CUR-F1-02 — Moneda destino omitida"), "ext\\currency\\convert(400000, 'COP')")
s.note("CT", "Sin argumento 3: toCode = moneda por defecto (USD)", "#fef9e7")
SEQS.append(("int-esc-02", "ESC-CUR-F1-02", exito(s, "100.00000000000000"),
             "Recorre ConvertType C3 (rama No del nodo 5). Casos CN-CUR-F1-03, 04 y 05."))

s = inicio(seq("Integración ESC-CUR-F1-03 — Valores límite del monto"), "ext\\currency\\convert(-100, 'USD', 'COP')")
s.note("CV", "La aritmética decimal conserva signo y escala (CUR-F2)", "#fef9e7")
SEQS.append(("int-esc-03", "ESC-CUR-F1-03", exito(s, "-400000.00000000000000"),
             "Mismo recorrido que ESC-CUR-F1-01; cambia el valor. Casos CN-CUR-F1-06 a 10."))

s = inicio(seq("Integración ESC-CUR-F1-04 — Moneda no configurada o mal escrita"),
           "ext\\currency\\convert(100, 'USD', 'EUR')")
(s.msg("CT", "CV", "convert(Currency, 'EUR')")
  .msg("CV", "CFG", "hasCurrency('EUR')")
  .msg("CFG", "CV", "false", ret=True)
  .note("CV", "throw RuntimeException «Can't convert currency to unknown currency 'EUR.»", "#fdedec")
  .note("API", "Formula Service solo captura errores de fórmula (Error): la RuntimeException sube sin capturar",
        "#fdedec")
  .msg("API", "FE", "500 Internal Server Error", ret=True)
  .msg("FE", "U", "Aviso global «Internal server error – Check logs»; Output None", ret=True))
SEQS.append(("int-esc-04", "ESC-CUR-F1-04", s,
             "Recorre FE C2, ConvertType C7 hasta el nodo 16 y Converter C1 (o getCurrencyRate C1 si la moneda "
             "inválida es el origen). Casos CN-CUR-F1-11, 12 y 13: Fallidos, DEF-CUR-01."))

s = inicio(seq("Integración ESC-CUR-F1-05 — Argumentos inválidos"), "ext\\currency\\convert(true, 'USD', 'COP')")
(s.alt("tipo o número de argumentos incorrecto (CN-CUR-F1-14, 15, 16)")
  .note("CT", "throw BadArgumentType / TooFewArguments (son Error de fórmula)", "#fdedec")
  .msg("CT", "API", "Error de fórmula", ret=True)
  .msg("API", "API", "catch (Error): RunResult::createError")
  .msg("API", "FE", "200 {isSuccess: false, message}", ret=True)
  .msg("FE", "U", "Aviso «Error. Function ext\\currency\\convert; Bad argument type…»", ret=True)
  .else_("monto de texto no numérico 'abc' (CN-CUR-F1-17)")
  .note("CT", "assert(is_numeric) falla: AssertionError, que no es Error de fórmula", "#fdedec")
  .msg("API", "FE", "500 Internal Server Error", ret=True)
  .msg("FE", "U", "Aviso global «Internal server error»", ret=True)
  .end())
SEQS.append(("int-esc-05", "ESC-CUR-F1-05", s,
             "La primera rama recorre FE C6 y ConvertType C1, C2 o C4; la segunda recorre FE C2 y ConvertType C6 "
             "(DEF-CUR-02)."))


# =============================================================================== MARKDOWN
def md_graph(key, g, lines, paths, path_file):
    m = g.cyclomatic()
    flow_file, cfg_file = f"img/{key}-flujo.svg", f"img/{key}-grafo.svg"
    (OUT / flow_file).write_text(flowchart_svg(g), encoding="utf-8")
    (OUT / cfg_file).write_text(cfg_svg(g), encoding="utf-8")
    rows = "\n".join(f"| {n.id} | {KIND[n.kind]} | {lines.get(int(n.id), '')} | {n.text} |" for n in g.nodes)
    preds = ", ".join(n.id for n in g.predicates())
    prows = "\n".join(f"| {c} | {p} | {d} | {cov} |" for c, p, d, cov in paths)
    return f"""### {g.title}

Archivo: `{path_file}`.

![Diagrama de flujo]({flow_file})

![Grafo de control de flujo]({cfg_file})

| Nodo | Tipo | Líneas | Descripción |
| :--- | :--- | :--- | :--- |
{rows}

**Complejidad ciclomática**

| Método | Cálculo | V(G) |
| :--- | :--- | :--- |
| Aristas y nodos | E − N + 2 = {m['E']} − {m['N']} + 2 | {m['V_EN']} |
| Nodos de decisión | P + 1 = {m['P']} + 1 (nodos {preds}) | {m['V_P']} |
| Regiones | Regiones del grafo plano, incluida la exterior | {m['V_EN']} |

**Caminos independientes**

| Camino | Secuencia de nodos | Qué recorre | Escenario y casos que lo cubren |
| :--- | :--- | :--- | :--- |
{prows}

<details><summary>Fuente Mermaid</summary>

```mermaid
{mermaid(g)}
```

</details>
"""


def md_seq(key, esc, s, nota):
    f = f"img/{key}.svg"
    (OUT / f).write_text(sequence_svg(s), encoding="utf-8")
    return f"""### {esc}

![{s.title}]({f})

{nota}

<details><summary>Fuente Mermaid</summary>

```mermaid
{mermaid_seq(s)}
```

</details>
"""


sections = [md_graph(*g) for g in GRAPHS]
fe_md, be_md = sections[0], "\n".join(sections[1:])
int_md = "\n".join(md_seq(*x) for x in SEQS)

CB_CASES = """| ID | Grafo y camino | Entrada | Resultado esperado | Estado |
| :--- | :--- | :--- | :--- | :--- |
| CB-CUR-F1-FE-01 | Frontend C1 | Script vacío y pulsar Run | Aviso «emptyScript» sin petición al servidor | Pendiente de ejecutar |
| CB-CUR-F1-FE-02 | Frontend C4 | `output\\print(ext\\currency\\convert(100, 'USD', 'COP')` (falta un paréntesis) | Aviso «Syntax error» con el detalle del servidor | Pendiente de ejecutar |
| CB-CUR-F1-BE-01 | ConvertType C5 | `ext\\currency\\convert(100, 'USD', 1)` | Error de fórmula «Bad argument type at position 3, must be string.» | Pendiente de ejecutar |
| CB-CUR-F1-BE-02 | getCurrencyRate C3 | Moneda en la lista pero sin entrada en `currencyRates` | Devuelve 1.0 (comportamiento actual; ver DEF-CUR-05) | Pendiente; se cubrirá con prueba unitaria y un doble de la configuración |

Los demás caminos factibles ya quedaron ejecutados en la caja negra (columna «Escenario y casos que lo cubren»). Los cuatro casos nuevos están pendientes porque los servicios Docker están detenidos; se ejecutarán como pruebas unitarias en el criterio 6."""

COVER = """| Escenario | Frontend | ConvertType | Converter | getCurrencyRate |
| :--- | :--- | :--- | :--- | :--- |
| ESC-CUR-F1-01 Conversión válida | C3 | C7 | C2 | C2 |
| ESC-CUR-F1-02 Argumentos opcionales o variantes | C3 | C3, C7 | C2 | C2 |
| ESC-CUR-F1-03 Valores límite del monto | C3 | C7 | C2 | C2 |
| ESC-CUR-F1-04 Moneda no configurada | C2 | C7 (hasta el nodo 16) | C1, C2 | C1 |
| ESC-CUR-F1-05 Argumentos inválidos | C2, C6 | C1, C2, C4, C6 | — | — |

| Grafo | V(G) | Caminos factibles | Cubiertos por la caja negra | Cobertura de caminos |
| :--- | :--- | :--- | :--- | :--- |
| Frontend `run()` | 8 | 5 (C8 no es factible; C5 y C7 no se pueden provocar desde CUR-F1) | 3 (C2, C3, C6) | 60 % |
| `ConvertType::process()` | 7 | 7 | 6 | 86 % |
| `Converter::convert()` | 2 | 2 | 2 | 100 % |
| `getCurrencyRate()` | 3 | 3 | 2 | 67 % |"""

doc = f"""# CUR-F1 — Pruebas de caja blanca: conversión de montos entre monedas

**Funcionalidad:** la función de fórmula `ext\\currency\\convert(MONTO, DESDE, HACIA)` convierte un monto entre monedas configuradas usando las tasas vigentes.
**Versión analizada:** EspoCRM 10.1.1 (el código del módulo es idéntico entre el repositorio y la imagen Docker).
**Fecha:** 15 de noviembre de 2026.

Se analiza el código de las tres capas que recorre una conversión desde la pantalla:

| Capa | Código | V(G) |
| :--- | :--- | :--- |
| Frontend | `index.js::run()` del Formula Sandbox | {fe.cyclomatic()['V_EN']} |
| Backend | `ConvertType::process()`, `Converter::convert()`, `ConfigDataProvider::getCurrencyRate()` | {be1.cyclomatic()['V_EN']}, {be2.cyclomatic()['V_EN']}, {be3.cyclomatic()['V_EN']} |
| Integración | Pantalla → `POST /api/v1/Formula/action/run` → fórmula → conversor → configuración | Un diagrama de secuencia por escenario |

**Convenciones de los diagramas.** En todas las decisiones la rama **Sí** sale hacia la **derecha** (verde) y la rama **No** hacia la **izquierda** (rojo). Las salidas de error van en rojo claro. Hay un grafo por método; la tabla de caminos de cada grafo indica qué escenario de prueba recorre cada camino. Los diagramas se generan con `docs/CUR/herramientas/generar_cur_f1.py`, que además comprueba que E − N + 2 = P + 1 y que cada Sí quede a la derecha y cada No a la izquierda.

**Condiciones compuestas.** El nodo 3 del frontend (`script === '' || script === null`) y el nodo 8 de `ConvertType` (`!is_string && !is_int && !is_float`) son decisiones compuestas: la cobertura de condición exige dos subcasos adicionales en el primero (vacío y nulo) y tres en el segundo (texto, entero y decimal).

---

## 1. Frontend

{fe_md}

---

## 2. Backend

{be_md}

---

## 3. Integración (un diagrama por escenario)

{int_md}

---

## 4. Cobertura por escenario

{COVER}

## 5. Casos de prueba de caja blanca nuevos

{CB_CASES}

## 6. Hallazgos del análisis de código

- **DEF-CUR-01:** `Converter::convert()` (nodo 3) y `getCurrencyRate()` (nodo 4) lanzan `RuntimeException`, que el servicio de fórmulas no captura porque solo captura `Error` de fórmula. Por eso la pantalla muestra «Internal server error» en vez de un mensaje sobre la moneda. Los mensajes de las líneas 56, 78 y 82 de `Converter.php` además no cierran la comilla.
- **DEF-CUR-02:** el nodo 14 de `ConvertType` es un `assert`. Con las aserciones activas, un monto de texto no numérico produce `AssertionError` (HTTP 500) en lugar del `BadArgumentType` que sí recibe un booleano en el nodo 8.
- **Decisiones correlacionadas en el frontend:** los nodos 9 y 13 evalúan `response.isSuccess`, así que el camino C8 no es factible. Fusionar ambas decisiones bajaría V(G) de 8 a 7 sin cambiar el comportamiento.
- **Tasa por defecto:** el nodo 7 de `getCurrencyRate()` devuelve 1.0 cuando una moneda configurada no tiene tasa. Es la misma raíz que DEF-CUR-05 (CUR-F5).
"""

(OUT / "caja-blanca.md").write_text(doc, encoding="utf-8")
for key, g, *_ in GRAPHS:
    print(key, g.cyclomatic())
print("ok", OUT / "caja-blanca.md")
