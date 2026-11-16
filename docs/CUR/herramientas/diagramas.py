"""Generador de diagramas SVG para las pruebas de caja blanca (módulo CUR).

Dibuja, a partir de una misma especificación:
  * el diagrama de flujo (inicio/fin ovalados, procesos rectangulares, decisiones en rombo,
    líneas ortogonales);
  * el grafo de control de flujo (nodos circulares numerados, aristas rectas);
  * diagramas de secuencia para la integración.

Regla del curso: en toda decisión la rama «Sí» sale hacia la DERECHA y la rama «No» hacia la
IZQUIERDA. El generador la impone: comprueba que el destino del Sí quede a la derecha (o en la
misma columna) y el del No a la izquierda (o en la misma columna) y falla si no es así.

Solo usa la biblioteca estándar de Python.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from xml.sax.saxutils import escape

# ----------------------------------------------------------------------------- estilo
FONT = "Segoe UI, Arial, sans-serif"
INK = "#1b2631"
MUTED = "#566573"
LINE = "#2c3e50"
YES = "#1e8449"
NO = "#c0392b"
FILL_PROC = "#eaf2f8"
FILL_DEC = "#fef9e7"
FILL_TERM = "#e8f8f5"
FILL_ERR = "#fdedec"
FILL_CIRCLE = "#ffffff"

COL_W = 190      # separación horizontal entre columnas (px)
ROW_H = 92       # separación vertical entre filas (px)
MARGIN = 40


@dataclass
class Node:
    id: str
    kind: str            # start | end | proc | dec | err
    text: str
    col: float
    row: float


@dataclass
class Edge:
    src: str
    dst: str
    label: str = ""      # "Sí" | "No" | ""


@dataclass
class Graph:
    title: str
    nodes: list[Node] = field(default_factory=list)
    edges: list[Edge] = field(default_factory=list)

    def node(self, id_, kind, text, col, row):
        self.nodes.append(Node(str(id_), kind, text, col, row))
        return self

    def edge(self, src, dst, label=""):
        self.edges.append(Edge(str(src), str(dst), label))
        return self

    # ---------------------------------------------------------------- métricas
    def by_id(self):
        return {n.id: n for n in self.nodes}

    def predicates(self):
        return [n for n in self.nodes if n.kind == "dec"]

    def cyclomatic(self):
        e, n, p = len(self.edges), len(self.nodes), len(self.predicates())
        return {"E": e, "N": n, "P": p, "V_EN": e - n + 2, "V_P": p + 1}

    def validate(self):
        ids = self.by_id()
        for e in self.edges:
            assert e.src in ids and e.dst in ids, f"arista con nodo inexistente: {e}"
            s, d = ids[e.src], ids[e.dst]
            if e.label == "Sí":
                assert d.col > s.col, f"{self.title}: el Sí de {s.id} debe ir a la derecha"
            if e.label == "No":
                assert d.col < s.col, f"{self.title}: el No de {s.id} debe ir a la izquierda"
        for n in self.predicates():
            labels = sorted(e.label for e in self.edges if e.src == n.id)
            assert labels == ["No", "Sí"], f"{self.title}: la decisión {n.id} necesita un Sí y un No ({labels})"
        m = self.cyclomatic()
        assert m["V_EN"] == m["V_P"], f"{self.title}: V(G) no coincide ({m})"
        return m


# ----------------------------------------------------------------------------- utilidades de texto
def wrap(text: str, width_chars: int) -> list[str]:
    out = []
    for para in text.split("\n"):
        line = ""
        for word in para.split():
            if line and len(line) + 1 + len(word) > width_chars:
                out.append(line)
                line = word
            else:
                line = f"{line} {word}".strip()
        out.append(line)
    return out


def text_block(x, y, lines, size=12, weight="normal", color=INK, anchor="middle", halo=False):
    h = size * 1.25
    extra = ' stroke="#ffffff" stroke-width="4" paint-order="stroke" stroke-linejoin="round"' if halo else ""
    y0 = y - (len(lines) - 1) * h / 2
    parts = []
    for i, ln in enumerate(lines):
        parts.append(
            f'<text x="{x:.1f}" y="{y0 + i * h + size * 0.35:.1f}" font-size="{size}" font-weight="{weight}" '
            f'text-anchor="{anchor}" fill="{color}"{extra}>{escape(ln)}</text>')
    return "".join(parts)


def svg_doc(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" '
            f'font-family="{FONT}">\n<title>{escape(title)}</title>\n'
            f'<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0,0 L10,5 L0,10 z" fill="{LINE}"/></marker>'
            f'<marker id="arrY" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0,0 L10,5 L0,10 z" fill="{YES}"/></marker>'
            f'<marker id="arrN" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0,0 L10,5 L0,10 z" fill="{NO}"/></marker></defs>\n'
            f'<rect width="100%" height="100%" fill="#ffffff"/>\n{body}\n</svg>\n')


def _frame(g: Graph):
    cols = [n.col for n in g.nodes]
    rows = [n.row for n in g.nodes]
    c0, c1, r0, r1 = min(cols), max(cols), min(rows), max(rows)
    w = (c1 - c0) * COL_W + 2 * MARGIN + 200
    h = (r1 - r0) * ROW_H + 2 * MARGIN + 110

    def pos(n):
        return MARGIN + 100 + (n.col - c0) * COL_W, MARGIN + 70 + (n.row - r0) * ROW_H
    return w, h, pos


def _edge_style(label):
    if label == "Sí":
        return YES, "arrY"
    if label == "No":
        return NO, "arrN"
    return LINE, "arr"


# ----------------------------------------------------------------------------- diagrama de flujo
NODE_W, NODE_H = 160, 50
DEC_W, DEC_H = 170, 70


def _shape_size(n):
    if n.kind == "dec":
        return DEC_W, DEC_H
    if n.kind in ("start", "end"):
        return 150, 42
    return NODE_W, NODE_H


def flowchart_svg(g: Graph) -> str:
    g.validate()
    w, h, pos = _frame(g)
    ids = g.by_id()
    body = [text_block(w / 2, 26, [g.title], size=15, weight="600")]
    # aristas primero (debajo de las figuras)
    for e in g.edges:
        s, d = ids[e.src], ids[e.dst]
        (x1, y1), (x2, y2) = pos(s), pos(d)
        sw, sh = _shape_size(s)
        dw, dh = _shape_size(d)
        color, marker = _edge_style(e.label)
        pts = []
        if s.kind == "dec" and e.label in ("Sí", "No") and abs(x2 - x1) > 1:
            sx = x1 + (sw / 2 if e.label == "Sí" else -sw / 2)
            pts = [(sx, y1), (x2, y1), (x2, y2 - dh / 2)] if y2 > y1 else [(sx, y1), (x2, y1)]
        elif abs(x2 - x1) < 1:
            pts = [(x1, y1 + sh / 2), (x2, y2 - dh / 2)]
        else:
            ym = y2 - dh / 2 - 16
            pts = [(x1, y1 + sh / 2), (x1, ym), (x2, ym), (x2, y2 - dh / 2)]
        path = " ".join(("M" if i == 0 else "L") + f"{px:.1f},{py:.1f}" for i, (px, py) in enumerate(pts))
        body.append(f'<path d="{path}" fill="none" stroke="{color}" stroke-width="1.6" marker-end="url(#{marker})"/>')
        if e.label:
            lx, ly = pts[0]
            dx = 14 if e.label == "Sí" else -14
            if abs(pts[0][0] - pts[1][0]) < 1:   # sale hacia abajo
                body.append(text_block(lx + dx, ly + 12, [e.label], size=11, weight="600", color=color,
                                       anchor="start" if dx > 0 else "end"))
            else:
                body.append(text_block(lx + dx * 1.4, ly - 9, [e.label], size=11, weight="600", color=color))
    for n in g.nodes:
        x, y = pos(n)
        nw, nh = _shape_size(n)
        if n.kind == "dec":
            body.append(f'<polygon points="{x},{y - nh / 2} {x + nw / 2},{y} {x},{y + nh / 2} {x - nw / 2},{y}" '
                        f'fill="{FILL_DEC}" stroke="{LINE}" stroke-width="1.4"/>')
            lines = wrap(n.text, 22)
            size = 10.5 if len(lines) <= 3 else 9.5
        elif n.kind in ("start", "end"):
            body.append(f'<rect x="{x - nw / 2}" y="{y - nh / 2}" width="{nw}" height="{nh}" rx="{nh / 2}" '
                        f'fill="{FILL_TERM}" stroke="{LINE}" stroke-width="1.4"/>')
            lines, size = wrap(n.text, 22), 11
        else:
            fill = FILL_ERR if n.kind == "err" else FILL_PROC
            body.append(f'<rect x="{x - nw / 2}" y="{y - nh / 2}" width="{nw}" height="{nh}" rx="4" '
                        f'fill="{fill}" stroke="{LINE}" stroke-width="1.4"/>')
            lines = wrap(n.text, 26)
            size = 10.5 if len(lines) <= 3 else 9.5
        body.append(text_block(x, y, lines, size=size))
        body.append(text_block(x - nw / 2 + 2, y - nh / 2 - 6, [n.id], size=9.5, color=MUTED, anchor="start"))
    return svg_doc(w, h, "\n".join(body), g.title)


# ----------------------------------------------------------------------------- grafo de control de flujo
R = 18


def cfg_svg(g: Graph) -> str:
    m = g.validate()
    w, h, pos = _frame(g)
    ids = g.by_id()
    body = [text_block(w / 2, 26, [g.title], size=15, weight="600")]
    for e in g.edges:
        s, d = ids[e.src], ids[e.dst]
        (x1, y1), (x2, y2) = pos(s), pos(d)
        color, marker = _edge_style(e.label)
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy) or 1
        ux, uy = dx / L, dy / L
        a = (x1 + ux * R, y1 + uy * R)
        b = (x2 - ux * (R + 2), y2 - uy * (R + 2))
        body.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{color}" '
                    f'stroke-width="1.6" marker-end="url(#{marker})"/>')
        if e.label:
            mx, my = x1 + ux * (R + 26), y1 + uy * (R + 26)
            off = 12 if e.label == "Sí" else -12
            body.append(text_block(mx + off, my - 4, [e.label], size=11, weight="600", color=color))
    for n in g.nodes:
        x, y = pos(n)
        stroke = NO if n.kind == "err" else (YES if n.kind in ("start", "end") else LINE)
        sw = 2.4 if n.kind == "dec" else 1.6
        body.append(f'<circle cx="{x}" cy="{y}" r="{R}" fill="{FILL_CIRCLE}" stroke="{stroke}" stroke-width="{sw}"/>')
        body.append(text_block(x, y, [n.id], size=12, weight="600"))
    legend = (f"E = {m['E']} aristas · N = {m['N']} nodos · P = {m['P']} decisiones (círculo grueso) · "
              f"V(G) = E − N + 2 = {m['V_EN']} = P + 1")
    body.append(text_block(w / 2, h - 18, [legend], size=11, color=MUTED))
    return svg_doc(w, h, "\n".join(body), g.title)


# ----------------------------------------------------------------------------- Mermaid (fuente editable)
def mermaid(g: Graph, circles=False) -> str:
    out = ["flowchart TD"]
    ids = g.by_id()
    for n in sorted(g.nodes, key=lambda n: (n.row, n.col)):
        t = n.text.replace('"', "'").replace("\n", " ")
        if circles:
            out.append(f'    N{n.id}(("{n.id}"))')
        elif n.kind == "dec":
            out.append(f'    N{n.id}{{"{n.id}. {t}"}}')
        elif n.kind in ("start", "end"):
            out.append(f'    N{n.id}(["{n.id}. {t}"])')
        else:
            out.append(f'    N{n.id}["{n.id}. {t}"]')
    # el No se declara antes que el Sí para que quede a la izquierda
    order = {"No": 0, "": 1, "Sí": 2}
    for e in sorted(g.edges, key=lambda e: (ids[e.src].row, ids[e.src].col, order[e.label])):
        lab = f"|{e.label}|" if e.label else ""
        out.append(f"    N{e.src} -->{lab} N{e.dst}")
    return "\n".join(out)


# ----------------------------------------------------------------------------- diagrama de secuencia
@dataclass
class Seq:
    title: str
    parts: list[tuple[str, str]] = field(default_factory=list)   # (id, rótulo)
    items: list[tuple] = field(default_factory=list)

    def participant(self, id_, label):
        self.parts.append((id_, label))
        return self

    def msg(self, a, b, text, ret=False):
        self.items.append(("msg", a, b, text, ret))
        return self

    def note(self, a, text, color=FILL_PROC):
        self.items.append(("note", a, text, color))
        return self

    def alt(self, label):
        self.items.append(("alt", label))
        return self

    def else_(self, label):
        self.items.append(("else", label))
        return self

    def end(self):
        self.items.append(("end",))
        return self


SEQ_COL = 210


def sequence_svg(s: Seq) -> str:
    xs = {pid: MARGIN + 90 + i * SEQ_COL for i, (pid, _) in enumerate(s.parts)}
    w = MARGIN * 2 + 180 + (len(s.parts) - 1) * SEQ_COL
    body = [text_block(w / 2, 26, [s.title], size=15, weight="600")]
    y = 60
    for pid, label in s.parts:
        lines = wrap(label, 22)
        bh = 18 + 14 * len(lines)
        body.append(f'<rect x="{xs[pid] - 85}" y="{y}" width="170" height="{bh}" rx="4" fill="{FILL_PROC}" stroke="{LINE}"/>')
        body.append(text_block(xs[pid], y + bh / 2, lines, size=11, weight="600"))
    y_top = y + 50
    y = y_top + 20
    frames = []      # pila de marcos alt: [y_inicio, etiquetas, ys de else]
    rows = []
    for it in s.items:
        kind = it[0]
        if kind == "msg":
            _, a, b, text, ret = it
            lines = wrap(text, 34)
            y += 8 + 13 * len(lines)
            x1, x2 = xs[a], xs[b]
            color = MUTED if ret else LINE
            dash = ' stroke-dasharray="5 4"' if ret else ""
            if a == b:
                rows.append(f'<path d="M{x1},{y} h40 v18 h-38" fill="none" stroke="{color}" stroke-width="1.4"{dash} marker-end="url(#arr)"/>')
                rows.append(text_block(x1 + 46, y - 4 - 13 * (len(lines) - 1), lines, size=10.5, anchor="start", halo=True))
                y += 22
            else:
                rows.append(f'<line x1="{x1}" y1="{y}" x2="{x2 - (6 if x2 > x1 else -6)}" y2="{y}" stroke="{color}" stroke-width="1.4"{dash} marker-end="url(#arr)"/>')
                rows.append(text_block((x1 + x2) / 2, y - 10 - 13 * (len(lines) - 1) / 2, lines, size=10.5, halo=True))
            y += 12
        elif kind == "note":
            _, a, text, color = it
            lines = wrap(text, 40)
            nh = 12 + 13 * len(lines)
            y += 6
            rows.append(f'<rect x="{xs[a] - 120}" y="{y}" width="240" height="{nh}" rx="3" fill="{color}" stroke="{MUTED}"/>')
            rows.append(text_block(xs[a], y + nh / 2, lines, size=10.5))
            y += nh + 8
        elif kind == "alt":
            y += 14
            frames.append([y, [(y, it[1])]])
            y += 18
        elif kind == "else":
            y += 10
            frames[-1][1].append((y, it[1]))
            y += 18
        elif kind == "end":
            y += 10
            y0, labels = frames.pop()
            depth = len(frames)
            fx0 = MARGIN + 6 + depth * 8
            fx1 = w - MARGIN - 6 - depth * 8
            rows.insert(0, f'<rect x="{fx0}" y="{y0}" width="{fx1 - fx0}" height="{y - y0}" fill="none" stroke="{MUTED}" stroke-width="1.2"/>')
            rows.append(f'<rect x="{fx0}" y="{y0}" width="34" height="16" fill="{MUTED}"/>')
            rows.append(text_block(fx0 + 17, y0 + 8, ["alt"], size=10, weight="600", color="#ffffff"))
            for i, (ly, lab) in enumerate(labels):
                if i > 0:
                    rows.append(f'<line x1="{fx0}" y1="{ly}" x2="{fx1}" y2="{ly}" stroke="{MUTED}" stroke-dasharray="6 4"/>')
                rows.append(text_block(fx0 + 42, ly + 9, [f"[{lab}]"], size=10.5, weight="600", color=MUTED, anchor="start", halo=True))
            y += 8
    y_end = y + 20
    for pid, _ in s.parts:
        body.append(f'<line x1="{xs[pid]}" y1="{y_top}" x2="{xs[pid]}" y2="{y_end}" stroke="{MUTED}" stroke-dasharray="3 4"/>')
    body.extend(rows)
    return svg_doc(w, y_end + 20, "\n".join(body), s.title)


def mermaid_seq(s: Seq) -> str:
    out = ["sequenceDiagram"]
    for pid, label in s.parts:
        out.append(f"    participant {pid} as {label}")
    for it in s.items:
        if it[0] == "msg":
            _, a, b, text, ret = it
            out.append(f"    {a}{'-->>' if ret else '->>'}{b}: {text}")
        elif it[0] == "note":
            out.append(f"    Note over {it[1]}: {it[2]}")
        elif it[0] == "alt":
            out.append(f"    alt {it[1]}")
        elif it[0] == "else":
            out.append(f"    else {it[1]}")
        elif it[0] == "end":
            out.append("    end")
    return "\n".join(out)
