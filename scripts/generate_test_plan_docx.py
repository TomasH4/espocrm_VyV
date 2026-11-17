#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_test_plan_docx.py
Genera el Technical Blueprint de Verificación y Pruebas para EspoCRM Enterprise Core.
Cumple estrictamente con la guía de estilo institucional, paleta de colores EspoCRM,
tono técnico de arquitectura y las 20 secciones del formato oficial.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

# --- PALETA INSTITUCIONAL ESPOCRM ---
COLOR_PRIMARY = RGBColor(21, 120, 193)       # #1578C1 Azul Corporativo EspoCRM
HEX_PRIMARY = "1578C1"
COLOR_NAVY = RGBColor(28, 40, 54)           # #1C2836 Azul Oscuro
HEX_NAVY = "1C2836"
COLOR_SLATE = RGBColor(73, 80, 87)          # #495057 Gris Pizarra Encabezados H2/H3
HEX_SLATE = "495057"
COLOR_BODY = RGBColor(33, 37, 41)           # #212529 Texto Principal
HEX_BODY = "212529"
COLOR_MUTED = RGBColor(108, 117, 125)       # #6C757D
HEX_BG_LIGHT = "F4F6F9"                     # Fondo bloques código / métricas
HEX_BORDER = "E5E7EB"                       # Borde sutil gris claro

# Colores Semánticos EspoCRM UI
COLOR_SUCCESS = RGBColor(40, 167, 69)       # #28A745 Verde
HEX_SUCCESS = "28A745"
COLOR_INFO = RGBColor(139, 92, 246)         # #8B5CF6 Violeta
HEX_INFO = "8B5CF6"
COLOR_DANGER = RGBColor(220, 53, 69)        # #DC3545 Rojo
HEX_DANGER = "DC3545"

FONT_MAIN = "Segoe UI"
FONT_CODE = "Consolas"

def set_cell_shading(cell, color_hex):
    """Aplica color de fondo hexadecimal a una celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Aplica padding en dxa a una celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color_hex=HEX_BORDER, sz="4", val="single"):
    """Aplica bordes horizontales sutiles a la tabla."""
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color_hex}"/>'
        f'<w:left w:val="none"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color_hex}"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color_hex}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_callout(doc, title, paragraphs_content, border_hex=HEX_PRIMARY, bg_hex=HEX_BG_LIGHT):
    """Crea una tarjeta de énfasis técnico con borde izquierdo acentuado."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.8)
    
    cell = tbl.cell(0, 0)
    set_cell_shading(cell, bg_hex)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_hex}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    # Párrafo del título
    p_title = cell.paragraphs[0]
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_t = p_title.add_run(title)
    run_t.font.name = FONT_MAIN
    run_t.font.size = Pt(10)
    run_t.font.bold = True
    run_t.font.color.rgb = COLOR_NAVY
    
    for item in paragraphs_content:
        p = cell.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(item)
        run.font.name = FONT_MAIN
        run.font.size = Pt(9.5)
        run.font.color.rgb = COLOR_BODY
        
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_code_block(doc, code_lines):
    """Crea un bloque de especificación o código estilizado."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.8)
    
    cell = tbl.cell(0, 0)
    set_cell_shading(cell, HEX_BG_LIGHT)
    set_cell_margins(cell, top=120, bottom=120, left=180, right=160)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>'
        f'<w:left w:val="single" w:sz="16" w:space="0" w:color="{HEX_INFO}"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    for i, line in enumerate(code_lines):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.line_spacing = 1.05
        
        # Colorizado sutil de palabras clave BDD
        tokens = line.split(" ")
        for token in tokens:
            run = p.add_run(token + " ")
            run.font.name = FONT_CODE
            run.font.size = Pt(8.5)
            if token in ["Feature:", "Scenario:", "Given", "When", "Then", "And", "SELECT", "FROM", "WHERE"]:
                run.font.bold = True
                run.font.color.rgb = COLOR_PRIMARY
            elif token.startswith("@") or token.startswith("http"):
                run.font.color.rgb = COLOR_INFO
            elif token.isdigit() or token.endswith("ms") or token.endswith("%"):
                run.font.color.rgb = COLOR_SUCCESS
                run.font.bold = True
            else:
                run.font.color.rgb = COLOR_NAVY
                
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = FONT_MAIN
    run.font.size = Pt(13)
    run.font.bold = True
    run.font.color.rgb = COLOR_PRIMARY
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = FONT_MAIN
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.color.rgb = COLOR_SLATE
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = FONT_MAIN
    run.font.size = Pt(10)
    run.font.bold = True
    run.font.color.rgb = COLOR_NAVY
    return p

def add_body(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.name = FONT_MAIN
    run.font.size = Pt(9.5)
    run.font.color.rgb = COLOR_BODY
    return p

def add_bullet(doc, bold_prefix, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run_pre = p.add_run(bold_prefix)
    run_pre.font.name = FONT_MAIN
    run_pre.font.size = Pt(9.5)
    run_pre.font.bold = True
    run_pre.font.color.rgb = COLOR_NAVY
    
    run_txt = p.add_run(text)
    run_txt.font.name = FONT_MAIN
    run_txt.font.size = Pt(9.5)
    run_txt.font.color.rgb = COLOR_BODY
    return p

def add_c_d_i(doc, context, decision, impact):
    """Enfoque Contexto -> Decisión -> Impacto."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    
    r1 = p.add_run("• Contexto: ")
    r1.font.name, r1.font.size, r1.font.bold = FONT_MAIN, Pt(9.5), True
    r1.font.color.rgb = COLOR_SLATE
    r1b = p.add_run(context + " ")
    r1b.font.name, r1b.font.size = FONT_MAIN, Pt(9.5)
    r1b.font.color.rgb = COLOR_BODY
    
    r2 = p.add_run("Decisión: ")
    r2.font.name, r2.font.size, r2.font.bold = FONT_MAIN, Pt(9.5), True
    r2.font.color.rgb = COLOR_PRIMARY
    r2b = p.add_run(decision + " ")
    r2b.font.name, r2b.font.size = FONT_MAIN, Pt(9.5)
    r2b.font.color.rgb = COLOR_BODY
    
    r3 = p.add_run("Impacto: ")
    r3.font.name, r3.font.size, r3.font.bold = FONT_MAIN, Pt(9.5), True
    r3.font.color.rgb = COLOR_SUCCESS
    r3b = p.add_run(impact)
    r3b.font.name, r3b.font.size = FONT_MAIN, Pt(9.5)
    r3b.font.color.rgb = COLOR_BODY

def build_test_plan_document():
    doc = docx.Document()
    
    # Configuración de márgenes
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        section.header_distance = Inches(0.4)
        section.footer_distance = Inches(0.4)
        
        # Header
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("EspoCRM Enterprise Core | Technical Blueprint de Verificación y Pruebas")
        hrun.font.name = FONT_MAIN
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = COLOR_MUTED
        
        # Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("Ingeniería de Software (VyV 2026-2) — Andrés Bedoya Cano — Página ")
        frun.font.name = FONT_MAIN
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = COLOR_MUTED
        fld_run = fp.add_run()
        fld_run.font.name = FONT_MAIN
        fld_run.font.size = Pt(8.5)
        fld_run.font.color.rgb = COLOR_MUTED
        fldChar1 = parse_xml(r'<w:fldSimple %s w:instr="PAGE"/>' % nsdecls('w'))
        fld_run._r.append(fldChar1)

    # ==========================================
    # PORTADA / METADATOS TÉCNICOS
    # ==========================================
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(8)
    p_title.paragraph_format.space_after = Pt(2)
    r_main = p_title.add_run("PLAN DE PRUEBAS")
    r_main.font.name = FONT_MAIN
    r_main.font.size = Pt(22)
    r_main.font.bold = True
    r_main.font.color.rgb = COLOR_PRIMARY
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(12)
    r_sub = p_sub.add_run("TECHNICAL BLUEPRINT DE VERIFICACIÓN, VALIDACIÓN Y QUALITY GATES")
    r_sub.font.name = FONT_MAIN
    r_sub.font.size = Pt(11)
    r_sub.font.bold = True
    r_sub.font.color.rgb = COLOR_SLATE

    # Tabla de Metadatos
    tbl_meta = doc.add_table(rows=4, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_meta.autofit = False
    tbl_meta.columns[0].width = Inches(2.2)
    tbl_meta.columns[1].width = Inches(4.6)
    set_table_borders(tbl_meta, HEX_BORDER)
    
    meta_rows = [
        ("Proyecto:", "EspoCRM Enterprise Core (VyV 2026-2)"),
        ("Versión de Release:", "10.1.0-rc2 (Backend PHP 8.4 / Marionette.js / MySQL 8.0)"),
        ("Fecha de Publicación:", "17 de Noviembre de 2026"),
        ("Equipo de Ingeniería:", "Andrés Bedoya Cano — QA Automation Lead & Software Architect")
    ]
    for idx, (label, val) in enumerate(meta_rows):
        c0, c1 = tbl_meta.cell(idx, 0), tbl_meta.cell(idx, 1)
        set_cell_shading(c0, HEX_BG_LIGHT)
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(1); p0.paragraph_format.space_after = Pt(1)
        r0 = p0.add_run(label)
        r0.font.name, r0.font.size, r0.font.bold = FONT_MAIN, Pt(9), True
        r0.font.color.rgb = COLOR_NAVY
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(1); p1.paragraph_format.space_after = Pt(1)
        r1 = p1.add_run(val)
        r1.font.name, r1.font.size = FONT_MAIN, Pt(9)
        r1.font.color.rgb = COLOR_BODY

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Metadatos del Blueprint (Requisito 3.1)
    add_callout(
        doc,
        "METADATOS DEL BLUEPRINT & STACK OPERATIVO",
        [
            "• Stack Tecnológico: PHPUnit 11.5 (Clover/Xdebug 3.5), Cypress 15.2 (Cucumber BDD Screenplay), Jenkins 2.440+ LTS (Pipeline Dockerizado), SonarQube Community 10.x, Stagehand 4.4, DeepEval 4.3.4, Microsoft Playwright MCP 1.66.",
            "• Foco Arquitectónico: Shift-Left Continuous Testing, GitOps declarativo, ejecución desatendida en contenedores Docker y evaluación matemática determinista mediante Quality Gates algorítmicos."
        ],
        border_hex=HEX_PRIMARY
    )

    # Fundamento Empírico (Requisito 3.2)
    add_callout(
        doc,
        "DECLARACIÓN DE FUNDAMENTO EMPÍRICO (ZERO-MANUAL TOLERANCE)",
        [
            "Este documento constituye un Technical Blueprint formal que certifica el abandono total de la inspección manual subjetiva en favor de una topología de verificación determinista, reproducible y algorítmica. Ninguna característica o refactorización del código fuente alcanza el entorno de integración sin haber superado un pipeline continuo gobernado por aserciones formales de caja blanca, intercepciones asíncronas de red en pruebas de caja negra, análisis estático de vulnerabilidades y verificación probabilística con modelos de evaluación cuantitativa."
        ],
        border_hex=HEX_SUCCESS
    )

    # ==========================================
    # SECCIÓN 1: INTRODUCCIÓN
    # ==========================================
    add_heading_1(doc, "1. INTRODUCCIÓN")
    add_heading_2(doc, "1.1 Propósito del documento")
    add_body(doc, "Definir formalmente la topología, los umbrales algorítmicos y las estrategias de verificación automatizada aplicadas sobre la plataforma EspoCRM versión 10.1.0, estableciendo criterios matemáticos de aceptación para el módulo crítico de soporte y cálculo de SLA (Service Level Agreement).")

    add_heading_2(doc, "1.2 Alcance del documento")
    add_body(doc, "Cubre la totalidad del ciclo de vida de aseguramiento de calidad: análisis estático de código fuente (SAST), pruebas de caja blanca unitarias y de mutación, pruebas funcionales de caja negra End-to-End bajo el patrón Screenplay, auditorías no funcionales especializadas (Accesibilidad WCAG 2.1 AA, Ciberseguridad OWASP Top 10, Usabilidad Heurística GRIHO) y la Tríada de Inteligencia Artificial (Stagehand, DeepEval y Playwright MCP).")

    add_heading_2(doc, "1.3 Referencias")
    add_bullet(doc, "ISO/IEC/IEEE 29119-3: ", "Software and Systems Engineering — Software Testing — Test Documentation.")
    add_bullet(doc, "W3C WCAG 2.1: ", "Web Content Accessibility Guidelines — Nivel de Conformidad AA.")
    add_bullet(doc, "OWASP Top 10 (2021): ", "The Ten Most Critical Web Application Security Risks.")
    add_bullet(doc, "GRIHO Framework: ", "Guía de Evaluación Heurística de Usabilidad para Sistemas de Gestión y Comercio Electrónico.")

    # ==========================================
    # SECCIÓN 2: DESCRIPCIÓN DEL PRODUCTO
    # ==========================================
    add_heading_1(doc, "2. DESCRIPCIÓN DEL PRODUCTO")
    add_heading_2(doc, "2.1 Descripción general del software")
    add_body(doc, "EspoCRM es una plataforma empresarial orientada a la gestión de relaciones con clientes, administración de procesos de negocio (BPM), seguimiento de cotizaciones y soporte técnico mediante gestión transaccional de casos e incidentes.")

    add_heading_2(doc, "2.2 Contexto organizacional")
    add_body(doc, "Implementación en infraestructura de alta disponibilidad donde los tiempos de respuesta y atención a clientes corporativos están regidos por contratos de SLA vinculantes. Fallos en el cómputo de tiempos o desbordamiento de colas de atención conllevan penalizaciones financieras severas.")

    add_heading_2(doc, "2.3 Arquitectura general")
    add_c_d_i(
        doc,
        "Separación estricta entre capa transaccional y capa de presentación asíncrona.",
        "Arquitectura cliente-servidor desacoplada. Backend PHP 8.4 con contenedor de inyección de dependencias (DI), ORM relacional y API RESTful autenticada mediante tokens Bearer JWT. Frontend Single Page Application (SPA) modular estructurado sobre Backbone.js y Marionette.js.",
        "Aislamiento total de lógica de negocio en servicios PHP y consumo declarativo mediante endpoints REST."
    )

    add_heading_2(doc, "2.4 Procesos, módulos y funcionalidades")
    add_bullet(doc, "Módulo de Casos (Case): ", "Ciclo de vida de incidentes, clasificación por severidad (Urgent, High, Normal, Low) y asignación jerárquica a ingenieros de soporte.")
    add_bullet(doc, "Motor de SLA (CaseSlaCalculator): ", "Cálculo en tiempo real de fechas límite en horario comercial hábil (08:00 - 18:00 UTC-5), exclusión de fines de semana y escalado automático a nivel L3.")
    add_bullet(doc, "Motor Comercial y Cotizaciones: ", "Validación de tramos de descuento volumétrico y aprobación de márgenes de rentabilidad.")

    # ==========================================
    # SECCIÓN 3: BASE DE PRUEBAS (TEST BASIS)
    # ==========================================
    add_heading_1(doc, "3. BASE DE PRUEBAS (TEST BASIS)")
    add_body(doc, "La formulación de escenarios y aserciones se deriva directamente de las siguientes fuentes formales:")
    add_bullet(doc, "Especificación de Reglas de Negocio de SLA: ", "Contrato algorítmico del servicio CaseSlaCalculator (Prioridad Urgent: 4 horas hábiles; High: 8 horas hábiles; Normal: 24 horas hábiles; Low: 72 horas hábiles).")
    add_bullet(doc, "Contratos de API REST v1: ", "Definición OpenAPI del endpoint POST /api/v1/Case y esquemas de payload JSON.")
    add_bullet(doc, "Rúbrica de Verificación y Validación VyV (2026-2): ", "14 criterios cuantitativos que exigen cobertura de código, pirámide de pruebas, CI/CD y evaluación con IA.")

    # ==========================================
    # SECCIÓN 4: OBJETIVOS DE LAS PRUEBAS
    # ==========================================
    add_heading_1(doc, "4. OBJETIVOS DE LAS PRUEBAS")
    add_bullet(doc, "Determinismo Funcional: ", "Garantizar 0% de regresiones en las rutas críticas de cálculo de SLA y creación de casos en el CRM.")
    add_bullet(doc, "Gobernanza de Calidad Algorítmica: ", "Hacer cumplir el Quality Gate de SonarQube bloqueando cualquier build con vulnerabilidades o cobertura inferior al 80%.")
    add_bullet(doc, "Resiliencia de Interfaz: ", "Validar que los flujos de usuario operen sin depender de selectores CSS frágiles mediante automatización semántica con Stagehand y Playwright MCP.")
    add_bullet(doc, "Conformidad No Funcional: ", "Validar cumplimiento estricto de accesibilidad WCAG 2.1 AA (0 violaciones críticas) y ciberseguridad OWASP Top 10 (0 vulnerabilidades explotables).")

    # ==========================================
    # SECCIÓN 5: ALCANCE
    # ==========================================
    add_heading_1(doc, "5. ALCANCE")
    add_heading_2(doc, "5.1 Funcionalidades incluidas")
    add_bullet(doc, "Lógica Central de Soporte: ", "application/Espo/VyV/CaseSla/CaseSlaCalculator.php.")
    add_bullet(doc, "Flujos E2E / BDD: ", "Creación de casos de soporte (F1), asignación y escalado de SLA a L3 (F2), y validación de descuentos escalonados (F3).")
    add_bullet(doc, "Auditorías Especializadas: ", "Accesibilidad (cypress-axe), DAST OWASP Top 10 (cypress/e2e/andres/security/), Usabilidad GRIHO (5 evaluadores) y Tríada de IA.")

    add_heading_2(doc, "5.2 Funcionalidades excluidas")
    add_body(doc, "Módulos heredados desvinculados de las reglas de soporte: integración con telefonía VoIP Asterisk legacy, sincronización de correo vía IMAP no transaccional y portal de autoservicio B2B externo.")

    add_heading_2(doc, "5.3 Supuestos")
    add_body(doc, "Infraestructura orquestada mediante Docker Compose con contenedores espocrm (8080), espocrm-mysql (3306), jenkins (8085) y sonarqube (9000) operativos en red bridge local.")

    add_heading_2(doc, "5.4 Restricciones")
    add_body(doc, "Ejecución obligatoria bajo PHP 8.4+ y MySQL 8.0 con aislamiento transaccional InnoDB para prevenir condiciones de carrera durante pruebas concurrentes.")

    # ==========================================
    # SECCIÓN 6: ENFOQUE Y ESTRATEGIA DE PRUEBAS
    # ==========================================
    add_heading_1(doc, "6. ENFOQUE Y ESTRATEGIA DE PRUEBAS")
    add_c_d_i(
        doc,
        "Validaciones manuales lentas y propensas a errores humanos en ciclos de release continuos.",
        "Implementar Shift-Left Continuous Testing soportado en la Pirámide de Automatización de Cohn.",
        "Detección de defectos en fase de codificación (unit testing < 100ms), validación de contratos en capa intermedia y verificación de integración en CI/CD antes de cualquier despliegue."
    )

    # Umbrales Inflexibles de Calidad (Requisito 3.3)
    add_callout(
        doc,
        "CALIDAD INFLEXIBLE: QUALITY GATES MATEMÁTICOS",
        [
            "• Cobertura de Código (Line/Branch Coverage): >= 80.0% certificado en PHPUnit Clover y Cypress.",
            "• Technical Debt Ratio: < 5.0% (Maintainability Rating A en SonarQube).",
            "• Severidad de Vulnerabilidades: 0 Blocker, 0 Critical, 0 Major abiertas.",
            "• Security Hotspots: 100% auditados y con resolución formal aplicada.",
            "• Complejidad Cognitiva: < 15 por método (Promedio arquitectónico obtenido < 5 en CaseSlaCalculator).",
            "• Accesibilidad Digital: 0 violaciones Críticas o Serias bajo estándar WCAG 2.1 AA (axe-core).",
            "• Evaluación Cuantitativa de IA: G-Eval >= 0.85, Faithfulness >= 0.85, Answer Relevancy >= 0.80."
        ],
        border_hex=HEX_PRIMARY
    )

    # ==========================================
    # SECCIÓN 7: NIVELES DE PRUEBA
    # ==========================================
    add_heading_1(doc, "7. NIVELES DE PRUEBA")
    add_bullet(doc, "Nivel Unitario (L1): ", "Aislamiento estricto de componentes lógicos sin dependencias de base de datos ni red. Framework: PHPUnit 11.5.")
    add_bullet(doc, "Nivel de Integración (L2): ", "Interacción entre servicios del núcleo EspoCRM, middleware de autenticación y transacciones ORM en base de datos MySQL.")
    add_bullet(doc, "Nivel de Sistema / E2E (L3): ", "Validación de flujos de usuario completos sobre la interfaz SPA Marionette.js en navegadores headless. Framework: Cypress 15.2.")
    add_bullet(doc, "Nivel de Aceptación (L4): ", "Verificación declarativa de especificaciones Gherkin vinculadas a requerimientos de negocio.")

    # ==========================================
    # SECCIÓN 8: TIPOS DE PRUEBA
    # ==========================================
    add_heading_1(doc, "8. TIPOS DE PRUEBA")
    add_heading_2(doc, "8.1 Pruebas funcionales (Design of BDD Scenarios)")
    add_body(doc, "Sustitución de tablas manuales por especificaciones ejecutables BDD con intercepciones de red JWT, validación de estado en base de datos relacional y rendering de componentes DOM en tiempos específicos.")

    # Bloque BDD de Diseño Declarativo (Requisito 3.4)
    add_code_block(doc, [
        "@regression @critical @sla_validation",
        "Feature: Determinación Algorítmica de SLA y Asignación de Casos Críticos",
        "",
        "  Scenario: Creación de Incidente Crítico con Intercepción JWT y Validación en Base de Datos",
        "    Given el usuario autenticado 'andres' con token JWT en sesión activa",
        "    And se intercepta la llamada REST 'POST /api/v1/Case' con alias 'createCaseRequest'",
        "    When el usuario ingresa a la vista '/#Case/create' y el DOM completa el render en < 1500ms",
        "    And diligencia el formulario con nombre 'Fallo crítico pasarela de pago' y prioridad 'Urgent'",
        "    And ejecuta la acción de guardado en interfaz",
        "    Then la solicitud REST 'createCaseRequest' responde con status code 200 en < 250ms",
        "    And la consulta SQL 'SELECT priority, status FROM `case` WHERE name LIKE \"%pasarela%\"'",
        "    And la base de datos retorna priority='Urgent' y status='Assigned'",
        "    And el motor CaseSlaCalculator proyecta fecha límite de resolución en exactamente 4 horas hábiles"
    ])

    add_heading_2(doc, "8.2 Pruebas no funcionales")
    add_bullet(doc, "Accesibilidad WCAG 2.1 AA: ", "Auditoría DOM con axe-core sobre 6 vistas operativas. Contraste cromático >= 4.5:1, etiquetas ARIA y navegación por teclado.")
    add_bullet(doc, "Ciberseguridad OWASP Top 10: ", "Pruebas DAST sobre 9 vectores: inyecciones SQL boolean-based y time-based, cross-site scripting (XSS reflejado y persistente), Broken Auth y fijación de sesión.")
    add_bullet(doc, "Usabilidad Heurística GRIHO: ", "Evaluación empírica estructurada sobre 17 dimensiones con 5 evaluadores independientes. Score global alcanzado: 83.32% (Excelente / Nivel Verde) correlacionado con SUS 82.5.")
    add_bullet(doc, "Latencia y Rendimiento: ", "Tiempos de respuesta de endpoints de SLA <= 200ms y renderizado completo del SPA Marionette <= 1500ms.")

    add_heading_2(doc, "8.3 Pruebas estáticas")
    add_body(doc, "Inspección continua de código fuente mediante SonarQube Scanner. Control de estándares PSR-12, detección temprana de antipatrones arquitectónicos y eliminación de deuda técnica.")

    add_heading_2(doc, "8.4 Pruebas de regresión")
    add_body(doc, "Suite automatizada de regresión (cypress/e2e/andres/regression/regression_andres.cy.js) incorporada al pipeline de Jenkins para certificar integridad ante refactorizaciones.")

    # ==========================================
    # SECCIÓN 9: TÉCNICAS DE DISEÑO DE PRUEBAS
    # ==========================================
    add_heading_1(doc, "9. TÉCNICAS DE DISEÑO DE PRUEBAS")
    add_bullet(doc, "Partición de Equivalencia (EP): ", "Segmentación de prioridades de incidentes en clases válidas (Urgent, High, Normal, Low) y clases inválidas (Null, Empty, Cadena aleatoria).")
    add_bullet(doc, "Análisis de Valores Límite (BVA): ", "Validación en fronteras de horario hábil comercial: 07:59 (inactiva), 08:00 (inicio de jornada), 17:59 (último minuto hábil), 18:00 (cierre).")
    add_bullet(doc, "Cobertura de Condiciones Múltiples (MC/DC): ", "Verificación de cada condición booleana en bifurcaciones de CaseSlaCalculator para garantizar que cada rama afecta el resultado independientemente.")

    # ==========================================
    # SECCIÓN 10: ENTORNO DE PRUEBAS
    # ==========================================
    add_heading_1(doc, "10. ENTORNO DE PRUEBAS")
    add_body(doc, "Topología de infraestructura completamente contenerizada mediante Docker:")
    
    tbl_env = doc.add_table(rows=5, cols=4)
    tbl_env.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_env.autofit = False
    tbl_env.columns[0].width = Inches(1.5)
    tbl_env.columns[1].width = Inches(2.2)
    tbl_env.columns[2].width = Inches(1.1)
    tbl_env.columns[3].width = Inches(2.0)
    set_table_borders(tbl_env, HEX_BORDER)
    
    env_headers = ["Contenedor", "Imagen / Stack Base", "Puerto", "Propósito en el Blueprint"]
    for j, h in enumerate(env_headers):
        c = tbl_env.cell(0, j)
        set_cell_shading(c, HEX_NAVY)
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.font.name, r.font.size, r.font.bold = FONT_MAIN, Pt(8.5), True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    env_data = [
        ("espocrm", "espocrm/espocrm:latest (PHP 8.4)", "8080:80", "Aplicación CRM bajo prueba"),
        ("espocrm-mysql", "mysql:8.0 (InnoDB engine)", "3306:3306", "Persistencia transaccional"),
        ("jenkins", "jenkins/jenkins:lts (Docker-in-Docker)", "8085:8080", "Orquestador de CI/CD Pipelines"),
        ("sonarqube", "sonarqube:community (v10.x)", "9000:9000", "Servidor SAST y Quality Gates")
    ]
    for i, row in enumerate(env_data):
        for j, val in enumerate(row):
            c = tbl_env.cell(i+1, j)
            if i % 2 == 1:
                set_cell_shading(c, HEX_BG_LIGHT)
            set_cell_margins(c, 60, 60, 100, 100)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.name, r.font.size = FONT_MAIN, Pt(8.5)
            r.font.color.rgb = COLOR_BODY

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ==========================================
    # SECCIÓN 11: DATOS DE PRUEBA
    # ==========================================
    add_heading_1(doc, "11. DATOS DE PRUEBA")
    add_c_d_i(
        doc,
        "Colisiones de datos y efectos secundarios de ejecuciones concurrentes en bases de datos compartidas.",
        "Generación determinista de fixtures mediante identificadores dinámicos con timestamps (e.g. AI-Test-1731675200) y ejecución de scripts de limpieza (teardown) transaccional.",
        "Aislamiento total entre pruebas sin interferencia en los estados de persistencia de MySQL."
    )

    # ==========================================
    # SECCIÓN 12: CRITERIOS
    # ==========================================
    add_heading_1(doc, "12. CRITERIOS")
    add_heading_2(doc, "12.1 Criterios de entrada")
    add_bullet(doc, "Disponibilidad de Contenedores: ", "Contenedores espocrm, mysql, jenkins y sonarqube con healthcheck 'healthy'.")
    add_bullet(doc, "Integridad de Compilación: ", "Vendor PHP y dependencias npm resueltas sin conflictos de dependencias.")

    add_heading_2(doc, "12.2 Criterios de salida")
    add_bullet(doc, "Tasa de Aprobación: ", "100% de casos unitarios, E2E, BDD y de regresión aprobados en el pipeline.")
    add_bullet(doc, "Estado de Quality Gate: ", "SonarQube Quality Gate en estado PASSED (OK) sin excepciones temporales.")

    add_heading_2(doc, "12.3 Criterios de aceptación")
    add_body(doc, "El release es apto para producción si la cobertura total es >= 80%, 0 vulnerabilidades de severidad mayor, tiempo de resolución de pipeline < 4 minutos y cero alucinaciones en pruebas de IA.")

    # ==========================================
    # SECCIÓN 13: GESTIÓN DE DEFECTOS
    # ==========================================
    add_heading_1(doc, "13. GESTIÓN DE DEFECTOS")
    add_heading_2(doc, "13.1 Flujo de defectos")
    add_body(doc, "Detección desatendida en Jenkins -> Bloqueo automático del Build -> Creación de Issue en SonarQube -> Notificación al Lead de Automatización -> Corrección en rama local -> Nueva evaluación por pipeline -> Cierre formal auditado.")

    add_heading_2(doc, "13.2 Clasificación de defectos")
    add_bullet(doc, "Blocker (Severidad 1): ", "Caída del servicio, desbordamiento del motor de SLA o inyección SQL explotable. SLA de corrección: < 2 horas.")
    add_bullet(doc, "Critical (Severidad 2): ", "Falla en intercepciones REST o bloqueo en guardado de formularios. SLA: < 6 horas.")
    add_bullet(doc, "Major (Severidad 3): ", "Desviación en reglas de descuento o latencia DOM > 1500ms. SLA: < 24 horas.")
    add_bullet(doc, "Minor (Severidad 4): ", "Advertencia menor de estilo de código o contraste no crítico. SLA: Próximo sprint.")

    add_heading_2(doc, "13.3 Herramienta de gestión")
    add_body(doc, "Dashboard de SonarQube para seguimiento estático, consola de Jenkins Pipeline para trazabilidad de builds y sistema de control de versiones Git.")

    # ==========================================
    # SECCIÓN 14: IDENTIFICACIÓN Y ANÁLISIS DE RIESGOS
    # ==========================================
    add_heading_1(doc, "14. IDENTIFICACIÓN Y ANÁLISIS DE RIESGOS")
    
    tbl_risk = doc.add_table(rows=4, cols=4)
    tbl_risk.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_risk.autofit = False
    tbl_risk.columns[0].width = Inches(2.2)
    tbl_risk.columns[1].width = Inches(1.0)
    tbl_risk.columns[2].width = Inches(1.0)
    tbl_risk.columns[3].width = Inches(2.6)
    set_table_borders(tbl_risk, HEX_BORDER)
    
    r_headers = ["Riesgo Identificado", "Probabilidad", "Impacto", "Estrategia de Mitigación Algorítmica"]
    for j, h in enumerate(r_headers):
        c = tbl_risk.cell(0, j)
        set_cell_shading(c, HEX_NAVY)
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.font.name, r.font.size, r.font.bold = FONT_MAIN, Pt(8.5), True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    risk_data = [
        ("Flakiness en pruebas de UI Marionette", "Media", "Alto", "Reemplazo de pausas fijas por cy.intercept() en endpoints REST."),
        ("No determinismo en respuestas de LLMs", "Alta", "Alto", "Evaluación estadística con DeepEval y fijación de temperatura <= 0.2."),
        ("Degradación de latencia en análisis SonarQube", "Media", "Medio", "Optimización de sonar.tests y exclusión estricta de librerías vendor.")
    ]
    for i, row in enumerate(risk_data):
        for j, val in enumerate(row):
            c = tbl_risk.cell(i+1, j)
            if i % 2 == 1:
                set_cell_shading(c, HEX_BG_LIGHT)
            set_cell_margins(c, 60, 60, 100, 100)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.name, r.font.size = FONT_MAIN, Pt(8.5)
            r.font.color.rgb = COLOR_BODY

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ==========================================
    # SECCIÓN 15: ORGANIZACIÓN Y RESPONSABILIDADES
    # ==========================================
    add_heading_1(doc, "15. ORGANIZACIÓN Y RESPONSABILIDADES")
    add_bullet(doc, "Andrés Bedoya Cano (QA Lead & Architect): ", "Diseño de la topología de pruebas, codificación de suites unitarias y E2E, auditorías de seguridad, accesibilidad y orquestación de la Tríada de IA.")
    add_bullet(doc, "Jenkins CI Server (Agente Autónomo): ", "Ejecución desatendida del pipeline, generación de reportes JUnit/Clover y verificación del webhook de Quality Gate.")
    add_bullet(doc, "SonarQube Engine (Evaluador Estático): ", "Cálculo de métricas de deuda técnica, cobertura de código y aplicación de políticas de bloqueo de merge.")

    # ==========================================
    # SECCIÓN 16: CRONOGRAMA
    # ==========================================
    add_heading_1(doc, "16. CRONOGRAMA")
    add_bullet(doc, "Hito 1 (Semanas 1-2): ", "Refactorización arquitectónica de CaseSlaCalculator y suite de pruebas de caja blanca PHPUnit 11.5.")
    add_bullet(doc, "Hito 2 (Semanas 3-4): ", "Implementación de suites E2E y BDD Screenplay con Cypress 15.2 y Cucumber.")
    add_bullet(doc, "Hito 3 (Semana 5): ", "Auditorías no funcionales: Accesibilidad WCAG 2.1 AA, Ciberseguridad OWASP y Evaluación Heurística GRIHO.")
    add_bullet(doc, "Hito 4 (Semana 6): ", "Implementación de la Tríada de IA: Stagehand, DeepEval 4.3.4 y Microsoft Playwright MCP.")
    add_bullet(doc, "Hito 5 (Semana 7): ", "Pipeline continuo en Jenkins, SonarQube Quality Gate al 100% Green y certificación de release.")

    # ==========================================
    # SECCIÓN 17: MÉTRICAS Y SEGUIMIENTO
    # ==========================================
    add_heading_1(doc, "17. MÉTRICAS Y SEGUIMIENTO")
    
    tbl_metrics = doc.add_table(rows=6, cols=4)
    tbl_metrics.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_metrics.autofit = False
    tbl_metrics.columns[0].width = Inches(2.2)
    tbl_metrics.columns[1].width = Inches(1.2)
    tbl_metrics.columns[2].width = Inches(1.2)
    tbl_metrics.columns[3].width = Inches(2.2)
    set_table_borders(tbl_metrics, HEX_BORDER)
    
    m_headers = ["Dimensión / Indicador", "Meta Exigida", "Valor Obtenido", "Veredicto Técnico"]
    for j, h in enumerate(m_headers):
        c = tbl_metrics.cell(0, j)
        set_cell_shading(c, HEX_NAVY)
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.font.name, r.font.size, r.font.bold = FONT_MAIN, Pt(8.5), True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    metrics_data = [
        ("Cobertura de Código (Clover)", ">= 80.0%", "84.2%", "APROBADO (Quality Gate OK)"),
        ("Deuda Técnica (Maintainability)", "< 5.0%", "0.0% (Rating A)", "APROBADO (36 smells resueltos)"),
        ("Vulnerabilidades de Seguridad", "0 Críticas", "0 Detectadas", "APROBADO (DAST 9/9 Green)"),
        ("Accesibilidad WCAG 2.1 AA", "0 Críticas", "0 Violaciones", "APROBADO (axe-core 6/6 Green)"),
        ("Evaluación de IA (DeepEval)", "G-Eval >= 0.85", "1.00 (100%)", "APROBADO (0 Alucinaciones)")
    ]
    for i, row in enumerate(metrics_data):
        for j, val in enumerate(row):
            c = tbl_metrics.cell(i+1, j)
            if i % 2 == 1:
                set_cell_shading(c, HEX_BG_LIGHT)
            set_cell_margins(c, 60, 60, 100, 100)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.name, r.font.size = FONT_MAIN, Pt(8.5)
            if j == 3:
                r.font.bold = True
                r.font.color.rgb = COLOR_SUCCESS
            else:
                r.font.color.rgb = COLOR_BODY

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ==========================================
    # SECCIÓN 18: ENTREGABLES DE PRUEBA
    # ==========================================
    add_heading_1(doc, "18. ENTREGABLES DE PRUEBA")
    add_bullet(doc, "Suites de Código de Pruebas: ", "Directorios tests/unit/, cypress/e2e/, tests_stagehand/, tests_deepeval_andres/, tests_playwright_mcp_andres/.")
    add_bullet(doc, "Reporte de Accesibilidad WCAG: ", "docs/andres/accesibilidad_wcag_andres.md.")
    add_bullet(doc, "Reporte de Ciberseguridad OWASP: ", "docs/andres/seguridad_owasp_andres.md.")
    add_bullet(doc, "Cuadernos Heurísticos GRIHO: ", "docs/andres/evaluacion_heuristica_griho/ (5 archivos Excel y reporte consolidado).")
    add_bullet(doc, "Informe de Tríada de IA: ", "docs/andres/ia_testing_andres.md y artefactos JSON asociados.")
    add_bullet(doc, "Technical Blueprint (Este documento): ", "docs/plan-de-pruebas-espocrm.docx.")

    # ==========================================
    # SECCIÓN 19: INFORME FINAL DE PRUEBAS
    # ==========================================
    add_heading_1(doc, "19. INFORME FINAL DE PRUEBAS")
    add_c_d_i(
        doc,
        "Evaluación global de la versión 10.1.0-rc2 de EspoCRM frente a los requerimientos de calidad.",
        "Certificar formalmente el release tras verificar el 100% de cumplimiento en pruebas unitarias, de integración, no funcionales y con IA.",
        "Aprobación definitiva de Quality Gate en Jenkins Build #6 y SonarQube Server. Sistema listo para sustentación académica y puesta en producción."
    )

    # ==========================================
    # SECCIÓN 20: GESTIÓN DEL DOCUMENTO
    # ==========================================
    add_heading_1(doc, "20. GESTIÓN DEL DOCUMENTO")
    add_heading_2(doc, "20.1 Historial de versiones")
    
    tbl_ver = doc.add_table(rows=4, cols=4)
    tbl_ver.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_ver.autofit = False
    tbl_ver.columns[0].width = Inches(1.0)
    tbl_ver.columns[1].width = Inches(1.3)
    tbl_ver.columns[2].width = Inches(1.8)
    tbl_ver.columns[3].width = Inches(2.7)
    set_table_borders(tbl_ver, HEX_BORDER)
    
    v_headers = ["Versión", "Fecha", "Autor", "Descripción del Cambio"]
    for j, h in enumerate(v_headers):
        c = tbl_ver.cell(0, j)
        set_cell_shading(c, HEX_NAVY)
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.font.name, r.font.size, r.font.bold = FONT_MAIN, Pt(8.5), True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    ver_data = [
        ("1.0.0", "15-Nov-2026", "Andrés Bedoya Cano", "Línea base inicial del plan de verificación técnica."),
        ("1.1.0", "16-Nov-2026", "Andrés Bedoya Cano", "Adición de suites de accesibilidad, ciberseguridad y heurísticas GRIHO."),
        ("1.2.0", "17-Nov-2026", "Andrés Bedoya Cano", "Incorporación de la Tríada de IA y certificación de Quality Gate en CI/CD.")
    ]
    for i, row in enumerate(ver_data):
        for j, val in enumerate(row):
            c = tbl_ver.cell(i+1, j)
            if i % 2 == 1:
                set_cell_shading(c, HEX_BG_LIGHT)
            set_cell_margins(c, 60, 60, 100, 100)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.name, r.font.size = FONT_MAIN, Pt(8.5)
            r.font.color.rgb = COLOR_BODY

    add_heading_2(doc, "20.2 Control de cambios")
    add_body(doc, "Trazabilidad formal mediante commits atómicos y firmados en la rama dev del repositorio Git https://github.com/TomasH4/espocrm_VyV.git.")

    add_heading_2(doc, "20.3 Aprobaciones")
    add_body(doc, "Documento validado y aprobado por Andrés Bedoya Cano (QA Automation Lead & Software Architect) para su archivo definitivo en docs/plan-de-pruebas-espocrm.docx.")

    return doc

if __name__ == "__main__":
    os.makedirs("docs", exist_ok=True)
    out_path = os.path.join("docs", "plan-de-pruebas-espocrm.docx")
    print(f"Generando blueprint técnico en: {out_path}...")
    doc = build_test_plan_document()
    doc.save(out_path)
    print("Documento .docx generado exitosamente con formato institucional EspoCRM.")
