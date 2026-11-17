#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_test_plan_docx.py
Genera el Technical Blueprint de Verificación y Pruebas para EspoCRM Enterprise Core.
Consolida la participación integral del equipo de ingeniería (Andrés Bedoya, Tomás Henao,
Alejandro Bustamante, Dubin Soto), cubriendo todos los módulos, suites automatizadas,
métricas de Quality Gates y las 20 secciones del formato oficial.
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
COLOR_SUCCESS = RGBColor(40, 167, 69)       # #28A745 Verde Éxito
HEX_SUCCESS = "28A745"
COLOR_INFO = RGBColor(139, 92, 246)         # #8B5CF6 Violeta Info
HEX_INFO = "8B5CF6"
COLOR_DANGER = RGBColor(220, 53, 69)        # #DC3545 Rojo Alerta
HEX_DANGER = "DC3545"

FONT_MAIN = "Segoe UI"
FONT_CODE = "Consolas"

def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
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
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.8)
    
    cell = tbl.cell(0, 0)
    set_cell_shading(cell, bg_hex)
    set_cell_margins(cell, top=130, bottom=130, left=180, right=160)
    
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
        
        tokens = line.split(" ")
        for token in tokens:
            run = p.add_run(token + " ")
            run.font.name = FONT_CODE
            run.font.size = Pt(8.5)
            if token in ["Feature:", "Scenario:", "Given", "When", "Then", "And", "SELECT", "FROM", "WHERE", "PUT", "POST"]:
                run.font.bold = True
                run.font.color.rgb = COLOR_PRIMARY
            elif token.startswith("@") or token.startswith("http") or token.startswith("/api"):
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
        
        # Header institucional
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("EspoCRM Enterprise Core | Technical Blueprint de Verificación y Validación")
        hrun.font.name = FONT_MAIN
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = COLOR_MUTED
        
        # Footer con identificación de equipo y paginado
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("VyV 2026-2 — Equipo de Calidad: Andrés Bedoya, Tomás Henao, Alejandro Bustamante, Dubin Soto — Página ")
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

    # Tabla de Metadatos con fecha modificada por el usuario y equipo completo
    tbl_meta = doc.add_table(rows=4, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_meta.autofit = False
    tbl_meta.columns[0].width = Inches(2.2)
    tbl_meta.columns[1].width = Inches(4.6)
    set_table_borders(tbl_meta, HEX_BORDER)
    
    meta_rows = [
        ("Proyecto:", "EspoCRM Enterprise Core (VyV 2026-2)"),
        ("Versión de Release:", "10.1.0-rc2 (Backend PHP 8.4 / Marionette.js / MySQL 8.0)"),
        ("Fecha de Entrega:", "17 de Noviembre de 2026"),
        ("Equipo de Ingeniería:", "Andrés Bedoya Cano (QA Lead & Architect)\nTomás Henao Metaute (QA Automation & DevOps Lead)\nAlejandro Bustamante (QA Automation & Currency Lead)\nDubin Soto (QA Security & Governance Lead)")
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

    # Metadatos del Blueprint y Equipo
    add_callout(
        doc,
        "METADATOS DEL BLUEPRINT & DISTRIBUCIÓN HORIZONTAL DEL EQUIPO (25% PESO C/U)",
        [
            "• Equipo de Ingeniería de Software: Andrés Bedoya Cano (Módulo Casos, SLA, Descuentos, Tareas y Deduplicación), Tomás Henao Metaute (Módulo Leads, Oportunidades, Contactos, Reuniones y Conversiones), Alejandro Bustamante (Módulo Moneda y Tasas de Cambio CUR), Dubin Soto (Módulo Autenticación Centralizada, Roles y Seguridad RBAC).",
            "• Ecosistema Tecnológico Unificado: PHPUnit 11.5 (Xdebug 3.5), Cypress 15.2 (Cucumber BDD Screenplay), Jenkins 2.440+ LTS en Docker, SonarQube Community 10.x, Stagehand 4.4, DeepEval 4.3.4, Microsoft Playwright MCP 1.66 y MySQL 8.0.",
            "• Foco Arquitectónico: Shift-Left Continuous Testing, GitOps declarativo, ejecución desatendida en contenedores Docker y evaluación matemática determinista mediante Quality Gates algorítmicos."
        ],
        border_hex=HEX_PRIMARY
    )

    # Fundamento Empírico
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
    add_body(doc, "Definir formalmente la topología, los umbrales algorítmicos y las estrategias de verificación automatizada aplicadas sobre la plataforma EspoCRM versión 10.1.0, estableciendo criterios matemáticos de aceptación para los cuatro módulos desacoplados de negocio desarrollados por el equipo: Gestión de Soporte y SLA (Andrés Bedoya), Gestión Comercial y Pipeline (Tomás Henao), Aritmética y Tasas Multimoneda (Alejandro Bustamante) y Seguridad y Control de Acceso (Dubin Soto).")

    add_heading_2(doc, "1.2 Alcance del documento")
    add_body(doc, "Cubre la totalidad del ciclo de vida de aseguramiento de calidad: análisis estático de código fuente (SAST), pruebas de caja blanca unitarias y de mutación, pruebas funcionales de caja negra End-to-End bajo el patrón Screenplay, auditorías no funcionales especializadas (Accesibilidad WCAG 2.1 AA, Ciberseguridad OWASP Top 10, Usabilidad Heurística GRIHO) y la Tríada de Inteligencia Artificial (Stagehand, DeepEval y Playwright MCP) implementada en cada uno de los sub-sistemas del CRM.")

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
    add_body(doc, "EspoCRM es una plataforma empresarial orientada a la gestión de relaciones con clientes, administración de procesos de negocio (BPM), seguimiento de cotizaciones multimoneda, conversión transaccional de leads y soporte técnico mediante gestión de incidentes con acuerdos de nivel de servicio.")

    add_heading_2(doc, "2.2 Contexto organizacional")
    add_body(doc, "Implementación en infraestructura de alta disponibilidad donde los tiempos de respuesta y atención a clientes corporativos están regidos por contratos de SLA vinculantes, la conversión de tasas financieras exige precisión decimal exacta (14 decimales) y el control de accesos RBAC previene fugas de datos comerciales confidenciales.")

    add_heading_2(doc, "2.3 Arquitectura general")
    add_c_d_i(
        doc,
        "Separación estricta entre capas transaccionales, lógica financiera y presentación asíncrona.",
        "Arquitectura cliente-servidor desacoplada. Backend PHP 8.4 con inyección de dependencias (DI), ORM relacional y API RESTful autenticada mediante tokens Bearer JWT. Frontend Single Page Application (SPA) modular estructurado sobre Backbone.js y Marionette.js.",
        "Aislamiento total de lógica de negocio en servicios PHP y consumo declarativo mediante endpoints REST."
    )

    add_heading_2(doc, "2.4 Procesos, módulos y funcionalidades del equipo")
    add_body(doc, "El alcance funcional del sistema se divide equitativamente entre los cuatro ingenieros (25% peso cada uno):")
    add_bullet(doc, "Módulo 1 — Soporte, SLA y Deduplicación (Andrés Bedoya Cano): ", "Validación de transiciones de estado de casos (F1), motor algorítmico de SLA horario hábil 08:00-18:00 UTC-5 (F2: CaseSlaCalculator), descuentos comerciales escalonados (F3: QuoteDiscountCalculator), escalado de tareas vencidas (F4: TaskOverdueEvaluator) y deduplicación fonética/Levenshtein de empresas homónimas (F5: AccountDuplicateDetector).")
    add_bullet(doc, "Módulo 2 — Comercial, Pipeline y Reuniones (Tomás Henao Metaute): ", "Creación y persistencia de Clientes Potenciales (F1: Leads), inferencia de probabilidad en Oportunidades según etapa de pipeline (F2: Opportunity Probability), búsqueda y filtrado de Contactos (F3), planificación y consistencia temporal de Reuniones (F4: Meeting Duration) y conversión transaccional de Leads B2B vs B2C (F5: Lead Conversion).")
    add_bullet(doc, "Módulo 3 — Moneda y Aritmética Financiera CUR (Alejandro Bustamante): ", "Conversión multimoneda (CUR-F1: Converter / formulaSandbox), aritmética decimal exacta de 14 decimales sin errores de redondeo (CUR-F2: CalculatorUtil), validación de campos de moneda (CUR-F3: CurrencyType en Campaign.budget), consulta y actualización de tasas vía API REST con control de permisos (CUR-F4: RateService) y sincronización automática de tasas vigentes hacia configuración (CUR-F5: SyncManager).")
    add_bullet(doc, "Módulo 4 — Seguridad y Control de Acceso RBAC (Dubin Soto): ", "Autenticación centralizada y ciclo de vida de sesiones de usuario (SEC-F1), matriz de permisos y control de acceso basado en roles (SEC-F2: RBAC), auditoría y restricción de endpoints administrativos (SEC-F3), trazabilidad de accesos no autorizados (SEC-F4) y políticas de expiración y complejidad de credenciales (SEC-F5).")

    # ==========================================
    # SECCIÓN 3: BASE DE PRUEBAS (TEST BASIS)
    # ==========================================
    add_heading_1(doc, "3. BASE DE PRUEBAS (TEST BASIS)")
    add_body(doc, "La formulación de escenarios y aserciones se deriva directamente de las siguientes fuentes formales:")
    add_bullet(doc, "Especificación de Reglas de Negocio de SLA y Descuentos: ", "Contrato algorítmico de CaseSlaCalculator (Urgent: 4h; High: 8h; Normal: 24h; Low: 72h) y matriz de bonificaciones de QuoteDiscountCalculator.")
    add_bullet(doc, "Especificación de Conversión de Monedas y Aritmética CUR: ", "Reglas de conversión cambiaria, precisión a 14 decimales de CalculatorUtil y contratos de endpoints GET/PUT /api/v1/CurrencyRate.")
    add_bullet(doc, "Especificación de Pipeline Comercial y Calificación de Leads: ", "Reglas de conversión transaccional B2B (Cuenta + Contacto) vs B2C (Contacto) y ponderación probabilística de Oportunidades.")
    add_bullet(doc, "Contratos de API REST v1 y OpenAPI: ", "Endpoints POST /api/v1/Case, POST /api/v1/Lead, PUT /api/v1/CurrencyRate y middleware de autenticación.")
    add_bullet(doc, "Rúbrica de Verificación y Validación VyV (2026-2): ", "14 criterios cuantitativos que exigen cobertura de código, pirámide de pruebas, CI/CD y evaluación con IA.")

    # ==========================================
    # SECCIÓN 4: OBJETIVOS DE LAS PRUEBAS
    # ==========================================
    add_heading_1(doc, "4. OBJETIVOS DE LAS PRUEBAS")
    add_bullet(doc, "Determinismo Funcional Global: ", "Garantizar 0% de regresiones en las rutas críticas de soporte, moneda, leads y seguridad del CRM.")
    add_bullet(doc, "Gobernanza de Calidad Algorítmica en CI/CD: ", "Hacer cumplir el Quality Gate de SonarQube bloqueando cualquier build en Jenkins con vulnerabilidades o cobertura inferior al 80%.")
    add_bullet(doc, "Resiliencia de Interfaz con IA: ", "Validar que los flujos de usuario operen sin depender de selectores CSS frágiles mediante automatización semántica con Stagehand y Playwright MCP ejecutada por cada integrante.")
    add_bullet(doc, "Conformidad No Funcional Estricta: ", "Validar cumplimiento de accesibilidad WCAG 2.1 AA (0 violaciones críticas), ciberseguridad OWASP Top 10 (0 vulnerabilidades explotables) y usabilidad heurística GRIHO (Score >= 80%).")

    # ==========================================
    # SECCIÓN 5: ALCANCE
    # ==========================================
    add_heading_1(doc, "5. ALCANCE")
    add_heading_2(doc, "5.1 Funcionalidades incluidas")
    add_bullet(doc, "Módulo Andrés Bedoya: ", "application/Espo/VyV/CaseSla/CaseSlaCalculator.php, CaseStatusTransitionValidator, QuoteDiscountCalculator, TaskOverdueEvaluator, AccountDuplicateDetector.")
    add_bullet(doc, "Módulo Tomás Henao: ", "application/Espo/VyV/Tomas/, LeadCreation, OpportunityProbability, ContactSearch, MeetingScheduling, LeadConversion.")
    add_bullet(doc, "Módulo Alejandro Bustamante: ", "Espo/Core/Currency (Converter, CalculatorUtil), Espo/Tools/Currency (RateService, SyncManager), Espo/Classes/FieldValidators/CurrencyType.")
    add_bullet(doc, "Módulo Dubin Soto: ", "Autenticación centralizada, control de acceso basado en roles (RBAC), auditoría de sesiones y permisos de entidades.")
    add_bullet(doc, "Auditorías Especializadas: ", "Accesibilidad (cypress-axe), DAST OWASP Top 10 (cypress/e2e/), Usabilidad Heurística GRIHO (5 evaluadores independientes) y Tríada de IA (Stagehand, DeepEval 4.3.4, Playwright MCP).")

    add_heading_2(doc, "5.2 Funcionalidades excluidas")
    add_body(doc, "Módulos heredados desvinculados de las 20 funcionalidades del equipo: integración con telefonía VoIP Asterisk legacy, sincronización de correo vía IMAP no transaccional y portal de autoservicio B2B externo.")

    add_heading_2(doc, "5.3 Supuestos")
    add_body(doc, "Infraestructura orquestada mediante Docker Compose con contenedores espocrm (8080), espocrm-mysql (3306), jenkins (8085) y sonarqube (9000) operativos en red bridge local.")

    add_heading_2(doc, "5.4 Restricciones")
    add_body(doc, "Ejecución obligatoria bajo PHP 8.4+ y MySQL 8.0 con aislamiento transaccional InnoDB para prevenir condiciones de carrera durante pruebas concurrentes de los 4 integrantes.")

    # ==========================================
    # SECCIÓN 6: ENFOQUE Y ESTRATEGIA DE PRUEBAS
    # ==========================================
    add_heading_1(doc, "6. ENFOQUE Y ESTRATEGIA DE PRUEBAS")
    add_c_d_i(
        doc,
        "Validaciones manuales lentas, propensas a errores y desalineadas en equipos concurrentes.",
        "Implementar Shift-Left Continuous Testing soportado en la Pirámide de Automatización de Cohn con Quality Gates algorítmicos compartidos.",
        "Detección de defectos en fase de codificación (unit testing < 100ms), validación de contratos en capa intermedia y verificación de integración en CI/CD antes de cualquier despliegue."
    )

    # Umbrales Inflexibles de Calidad
    add_callout(
        doc,
        "CALIDAD INFLEXIBLE: QUALITY GATES MATEMÁTICOS DEL EQUIPO",
        [
            "• Cobertura de Código Global (Line/Branch Coverage): >= 80.0% certificado en PHPUnit Clover y Cypress para todos los módulos.",
            "• Technical Debt Ratio: < 5.0% (Maintainability Rating A en SonarQube para todo el código nuevo).",
            "• Severidad de Vulnerabilidades: 0 Blocker, 0 Critical, 0 Major abiertas en el escaneo SAST y DAST.",
            "• Security Hotspots: 100% auditados y con resolución formal aplicada.",
            "• Complejidad Cognitiva: < 15 por método (Promedio arquitectónico obtenido < 5 en CaseSlaCalculator y CalculatorUtil).",
            "• Accesibilidad Digital: 0 violaciones Críticas o Serias bajo estándar WCAG 2.1 AA (axe-core).",
            "• Evaluación Cuantitativa de IA: G-Eval >= 0.85, Faithfulness >= 0.85, Answer Relevancy >= 0.80 en DeepEval."
        ],
        border_hex=HEX_PRIMARY
    )

    # ==========================================
    # SECCIÓN 7: NIVELES DE PRUEBA
    # ==========================================
    add_heading_1(doc, "7. NIVELES DE PRUEBA")
    add_bullet(doc, "Nivel Unitario (L1): ", "Aislamiento estricto de componentes lógicos sin dependencias de base de datos ni red. Framework: PHPUnit 11.5 (tests/unit/Espo/VyV/Andres/, Tomas/, Currency/).")
    add_bullet(doc, "Nivel de Integración (L2): ", "Interacción entre servicios del núcleo EspoCRM, middleware de autenticación, control de permisos y transacciones ORM en base de datos MySQL.")
    add_bullet(doc, "Nivel de Sistema / E2E (L3): ", "Validación de flujos de usuario completos sobre la interfaz SPA Marionette.js en navegadores headless. Framework: Cypress 15.2 (cypress/e2e/andres/, tomas/, cur/).")
    add_bullet(doc, "Nivel de Aceptación (L4): ", "Verificación declarativa de especificaciones Gherkin vinculadas a requerimientos de negocio (tests_bdd_screenplay/features/).")

    # ==========================================
    # SECCIÓN 8: TIPOS DE PRUEBA
    # ==========================================
    add_heading_1(doc, "8. TIPOS DE PRUEBA")
    add_heading_2(doc, "8.1 Pruebas funcionales (Design of BDD Scenarios del Equipo)")
    add_body(doc, "Sustitución de tablas manuales por especificaciones ejecutables BDD con intercepciones de red JWT, validación de estado en base de datos relacional y rendering de componentes DOM en tiempos específicos.")

    # Escenario BDD 1: Soporte y SLA (Andrés Bedoya)
    add_code_block(doc, [
        "@andres @regression @critical @sla_validation",
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

    # Escenario BDD 2: Tasas Multimoneda CUR (Alejandro Bustamante)
    add_code_block(doc, [
        "@alejandro @currency @cur_f1 @bdd",
        "Feature: Conversión Multimoneda y Precisión Decimal Exacta en EspoCRM",
        "",
        "  Scenario: Conversión de Monto USD a COP vía Formula Sandbox con Validación de Precisión",
        "    Given la tasa cambiaria configurada de 1 USD = 4000.00000000000000 COP",
        "    And el usuario autenticado con permisos en 'Administration > Formula Sandbox'",
        "    When se ejecuta la fórmula 'ext\\currency\\convert(100.50, \"USD\", \"COP\")'",
        "    Then el motor CalculatorUtil procesa la aritmética decimal exacta sin errores de flotante",
        "    And la respuesta devuelve exactamente '402000.00000000' en < 100ms",
        "    And la consulta SQL 'SELECT rate FROM currency_rate WHERE code=\"COP\"' verifica consistencia"
    ])

    # Escenario BDD 3: Calificación y Conversión de Leads (Tomás Henao)
    add_code_block(doc, [
        "@tomas @leads @pipeline @conversion",
        "Feature: Calificación Automatizada y Conversión Transaccional de Leads",
        "",
        "  Scenario: Conversión Exitosa de Lead B2B a Cuenta y Contacto Vinculados",
        "    Given un Lead existente en estado 'Assigned' con nombre 'Acme Corp Lead'",
        "    And se intercepta la llamada REST 'POST /api/v1/Lead/action/convert'",
        "    When el asesor ejecuta la conversión comercial en el navegador",
        "    Then el CRM genera transaccionalmente una entidad Account y una entidad Contact",
        "    And la base de datos confirma que el campo 'status' del Lead pasa a 'Converted' en < 300ms"
    ])

    add_heading_2(doc, "8.2 Pruebas no funcionales del equipo")
    add_bullet(doc, "Accesibilidad WCAG 2.1 AA (Andrés y Alejandro): ", "Auditoría DOM automatizada con cypress-axe sobre vistas de soporte, campañas, cotizaciones y moneda. Contraste cromático >= 4.5:1, etiquetas ARIA, navegación por teclado completa y 0 violaciones críticas.")
    add_bullet(doc, "Ciberseguridad OWASP Top 10 (Andrés, Alejandro, Dubin): ", "Pruebas DAST sobre 9 vectores: inyecciones SQL boolean-based y time-based, cross-site scripting (XSS reflejado y persistente), Broken Auth, fijación de sesión y control de permisos en endpoints REST.")
    add_bullet(doc, "Usabilidad Heurística GRIHO: ", "Evaluación empírica estructurada sobre 17 dimensiones con 5 evaluadores independientes. Score global alcanzado: 83.32% (Excelente / Nivel Verde) correlacionado con SUS 82.5.")
    add_bullet(doc, "Tríada de Inteligencia Artificial (Andrés, Tomás, Alejandro): ", "Automatización resiliente con Stagehand (manipulación y extracción Zod), evaluación cuantitativa con DeepEval 4.3.4 (G-Eval 100%, Relevancy 90%, Faithfulness 100%) e inspección declarativa con Microsoft Playwright MCP.")

    add_heading_2(doc, "8.3 Pruebas estáticas")
    add_body(doc, "Inspección continua de código fuente mediante SonarQube Scanner. Control de estándares PSR-12, detección temprana de antipatrones arquitectónicos y eliminación de deuda técnica en los módulos de todos los integrantes.")

    add_heading_2(doc, "8.4 Pruebas de regresión")
    add_body(doc, "Suites automatizadas de regresión (cypress/e2e/andres/regression/, cypress/e2e/cur/regresion/, cypress/e2e/tomas/) incorporadas al pipeline de Jenkins para certificar integridad ante refactorizaciones.")

    # ==========================================
    # SECCIÓN 9: TÉCNICAS DE DISEÑO DE PRUEBAS
    # ==========================================
    add_heading_1(doc, "9. TÉCNICAS DE DISEÑO DE PRUEBAS")
    add_bullet(doc, "Partición de Equivalencia (EP): ", "Segmentación de prioridades de incidentes (Urgent, High, Normal, Low), rangos de montos de cotización, tramos de presupuesto de campañas y estados de leads en clases válidas e inválidas.")
    add_bullet(doc, "Análisis de Valores Límite (BVA): ", "Validación en fronteras de horario hábil comercial (07:59, 08:00, 17:59, 18:00), límites de descuento (0%, 5%, 10%, 15%, tope 35%) y precisión de 14 decimales en CalculatorUtil.")
    add_bullet(doc, "Cobertura de Condiciones Múltiples (MC/DC): ", "Verificación de cada condición booleana en bifurcaciones de CaseSlaCalculator, RateService y FieldValidators para asegurar cobertura completa de ramas.")

    # ==========================================
    # SECCIÓN 10: ENTORNO DE PRUEBAS
    # ==========================================
    add_heading_1(doc, "10. ENTORNO DE PRUEBAS")
    add_body(doc, "Topología de infraestructura completamente contenerizada mediante Docker compartida por todo el equipo:")
    
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
        "Colisiones de datos y efectos secundarios de ejecuciones concurrentes entre los 4 módulos del equipo.",
        "Generación determinista de fixtures con prefijos por autor (e.g. AI-Test-Andres-*, Tomas-Lead-*, CUR-COP-*) y reseteo de configuración monetaria y casos post-ejecución.",
        "Aislamiento total entre pruebas sin interferencia en los estados de persistencia de MySQL."
    )

    # ==========================================
    # SECCIÓN 12: CRITERIOS
    # ==========================================
    add_heading_1(doc, "12. CRITERIOS")
    add_heading_2(doc, "12.1 Criterios de entrada")
    add_bullet(doc, "Disponibilidad de Contenedores: ", "Contenedores espocrm, mysql, jenkins y sonarqube con healthcheck 'healthy'.")
    add_bullet(doc, "Integridad de Compilación: ", "Vendor PHP y dependencias npm resueltas sin conflictos.")

    add_heading_2(doc, "12.2 Criterios de salida")
    add_bullet(doc, "Tasa de Aprobación del Equipo: ", "100% de casos unitarios, E2E, BDD y de regresión aprobados en el pipeline.")
    add_bullet(doc, "Estado de Quality Gate: ", "SonarQube Quality Gate en estado PASSED (OK) para todos los módulos.")

    add_heading_2(doc, "12.3 Criterios de aceptación")
    add_body(doc, "El release es apto para producción si la cobertura total de cada integrante es >= 80%, 0 vulnerabilidades de severidad mayor en todo el repositorio y cero alucinaciones en pruebas de IA.")

    # ==========================================
    # SECCIÓN 13: GESTIÓN DE DEFECTOS
    # ==========================================
    add_heading_1(doc, "13. GESTIÓN DE DEFECTOS")
    add_heading_2(doc, "13.1 Flujo de defectos")
    add_body(doc, "Detección desatendida en Jenkins -> Bloqueo automático del Build -> Creación de Issue en SonarQube -> Notificación al Lead de Automatización correspondiente -> Corrección en rama local vía TDD -> Nueva evaluación por pipeline -> Cierre formal auditado.")

    add_heading_2(doc, "13.2 Clasificación de defectos")
    add_bullet(doc, "Blocker (Severidad 1): ", "Caída del servicio, desbordamiento del motor de SLA, división por cero en conversiones de moneda o bypass de login. SLA: < 2 horas.")
    add_bullet(doc, "Critical (Severidad 2): ", "Falla en intercepciones REST o bloqueo en guardado de formularios. SLA: < 6 horas.")
    add_bullet(doc, "Major (Severidad 3): ", "Desviación en reglas de descuento, cálculo de probabilidades o latencia DOM > 1500ms. SLA: < 24 horas.")
    add_bullet(doc, "Minor (Severidad 4): ", "Advertencia menor de estilo de código o contraste no crítico. SLA: Próximo sprint.")

    add_heading_2(doc, "13.3 Herramienta de gestión")
    add_body(doc, "Dashboard de SonarQube para seguimiento estático, consola de Jenkins Pipeline para trazabilidad de builds y sistema de control de versiones Git en rama dev.")

    # ==========================================
    # SECCIÓN 14: IDENTIFICACIÓN Y ANÁLISIS DE RIESGOS
    # ==========================================
    add_heading_1(doc, "14. IDENTIFICACIÓN Y ANÁLISIS DE RIESGOS")
    
    tbl_risk = doc.add_table(rows=5, cols=4)
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
        ("Colisión de ramas entre integrantes", "Media", "Alto", "Aislamiento estricto de directorios por autor y no-solapamiento de módulos."),
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
    add_body(doc, "Estructura organizativa horizontal del equipo de ingeniería de calidad (25% de responsabilidad c/u):")
    
    tbl_roles = doc.add_table(rows=5, cols=4)
    tbl_roles.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_roles.autofit = False
    tbl_roles.columns[0].width = Inches(1.8)
    tbl_roles.columns[1].width = Inches(1.5)
    tbl_roles.columns[2].width = Inches(2.2)
    tbl_roles.columns[3].width = Inches(1.3)
    set_table_borders(tbl_roles, HEX_BORDER)
    
    role_headers = ["Ingeniero", "Rol Principal", "Módulo y Alcance de Verificación", "Peso / Carga"]
    for j, h in enumerate(role_headers):
        c = tbl_roles.cell(0, j)
        set_cell_shading(c, HEX_NAVY)
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.font.name, r.font.size, r.font.bold = FONT_MAIN, Pt(8.5), True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    roles_data = [
        ("Andrés Bedoya Cano", "QA Lead & Software Architect", "Módulo Soporte, SLA, Descuentos, Tareas, Deduplicación, Accesibilidad WCAG, Seguridad OWASP, Heurísticas GRIHO, Tríada IA", "25% (Lead)"),
        ("Tomás Henao Metaute", "QA Automation & DevOps Lead", "Módulo Leads, Oportunidades, Contactos, Reuniones, Conversiones, Stagehand E2E, DeepEval Copilot, Pipeline CI/CD", "25%"),
        ("Alejandro Bustamante", "QA Automation & Currency Lead", "Módulo Moneda y Tasas de Cambio CUR (Conversión, Aritmética 14 dec, RateService, SyncManager), TDD DEF-CUR, Stagehand 4/4", "25%"),
        ("Dubin Soto", "QA Security & Governance Lead", "Módulo Autenticación Centralizada, Roles y Permisos RBAC, Auditoría de Endpoints, Gobernanza de Calidad", "25%")
    ]
    for i, row in enumerate(roles_data):
        for j, val in enumerate(row):
            c = tbl_roles.cell(i+1, j)
            if i % 2 == 1:
                set_cell_shading(c, HEX_BG_LIGHT)
            set_cell_margins(c, 60, 60, 100, 100)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.name, r.font.size = FONT_MAIN, Pt(8.5)
            r.font.color.rgb = COLOR_BODY

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ==========================================
    # SECCIÓN 16: CRONOGRAMA
    # ==========================================
    add_heading_1(doc, "16. CRONOGRAMA")
    add_bullet(doc, "Hito 1 (Semanas 1-2): ", "Refactorización arquitectónica de módulos desacoplados y suites de pruebas de caja blanca PHPUnit 11.5 (Andrés: SLA; Tomás: Leads; Alejandro: Currency).")
    add_bullet(doc, "Hito 2 (Semanas 3-4): ", "Implementación de suites E2E y BDD Screenplay con Cypress 15.2 y Cucumber para los cuatro módulos.")
    add_bullet(doc, "Hito 3 (Semana 5): ", "Auditorías no funcionales: Accesibilidad WCAG 2.1 AA, Ciberseguridad OWASP y Evaluación Heurística GRIHO con 5 evaluadores independientes.")
    add_bullet(doc, "Hito 4 (Semana 6): ", "Implementación de la Tríada de IA: Stagehand, DeepEval 4.3.4 y Microsoft Playwright MCP por cada integrante.")
    add_bullet(doc, "Hito 5 (Semana 7): ", "Pipeline continuo en Jenkins, SonarQube Quality Gate al 100% Green para todo el equipo y certificación de release.")

    # ==========================================
    # SECCIÓN 17: MÉTRICAS Y SEGUIMIENTO
    # ==========================================
    add_heading_1(doc, "17. MÉTRICAS Y SEGUIMIENTO")
    
    tbl_metrics = doc.add_table(rows=7, cols=4)
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
        ("Cobertura de Código (Clover Global)", ">= 80.0%", "84.2%", "APROBADO (Quality Gate OK)"),
        ("Deuda Técnica (Maintainability Global)", "< 5.0%", "0.0% (Rating A)", "APROBADO (36 smells resueltos)"),
        ("Vulnerabilidades de Seguridad", "0 Críticas", "0 Detectadas", "APROBADO (DAST 9/9 Green)"),
        ("Accesibilidad WCAG 2.1 AA", "0 Críticas", "0 Violaciones", "APROBADO (axe-core 6/6 Green)"),
        ("Usabilidad Heurística (GRIHO)", ">= 80.0%", "83.32% (Nivel Verde)", "APROBADO (SUS = 82.5)"),
        ("Evaluación de IA (DeepEval Consolidado)", "G-Eval >= 0.85", "1.00 (100%)", "APROBADO (0 Alucinaciones)")
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
    add_bullet(doc, "Suites de Código de Pruebas: ", "Directorios tests/unit/Espo/VyV/ (Andres, Tomas, Currency), cypress/e2e/ (andres, tomas, cur), tests_stagehand/ (andres, tomas), tests_deepeval_andres/, tests_deepeval_tomas/, tests_playwright_mcp_andres/.")
    add_bullet(doc, "Reporte de Accesibilidad WCAG: ", "docs/andres/accesibilidad_wcag_andres.md y docs/CUR/accesibilidad/.")
    add_bullet(doc, "Reporte de Ciberseguridad OWASP: ", "docs/andres/seguridad_owasp_andres.md y docs/CUR/seguridad/.")
    add_bullet(doc, "Cuadernos Heurísticos GRIHO: ", "docs/andres/evaluacion_heuristica_griho/ (5 archivos Excel y reporte consolidado) y docs/CUR/usabilidad/.")
    add_bullet(doc, "Informes de Tríada de IA: ", "docs/andres/ia_testing_andres.md, docs/tomas/ia_testing_tomas.md, docs/CUR/ia/ y artefactos JSON asociados.")
    add_bullet(doc, "Technical Blueprint (Este documento): ", "docs/plan-de-pruebas-espocrm.docx.")

    # ==========================================
    # SECCIÓN 19: INFORME FINAL DE PRUEBAS
    # ==========================================
    add_heading_1(doc, "19. INFORME FINAL DE PRUEBAS")
    add_c_d_i(
        doc,
        "Evaluación global de la versión 10.1.0-rc2 de EspoCRM frente a los requerimientos de calidad.",
        "Certificar formalmente el release tras verificar el 100% de cumplimiento en pruebas unitarias, de integración, no funcionales y con IA de todos los integrantes del equipo.",
        "Aprobación definitiva de Quality Gate en Jenkins Build #6 y SonarQube Server. Sistema listo para sustentación académica y puesta en producción."
    )

    # ==========================================
    # SECCIÓN 20: GESTIÓN DEL DOCUMENTO
    # ==========================================
    add_heading_1(doc, "20. GESTIÓN DEL DOCUMENTO")
    add_heading_2(doc, "20.1 Historial de versiones")
    
    tbl_ver = doc.add_table(rows=5, cols=4)
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
        ("1.2.0", "17-Nov-2026", "Andrés Bedoya Cano", "Incorporación de la Tríada de IA y certificación de Quality Gate en CI/CD."),
        ("1.3.0", "17-Nov-2026", "Equipo de Calidad", "Consolidación de la participación integral de Tomás Henao, Alejandro Bustamante y Dubin Soto.")
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
    add_body(doc, "Documento validado y aprobado unánimemente por el equipo de calidad para su archivo definitivo en docs/plan-de-pruebas-espocrm.docx:")
    add_bullet(doc, "Andrés Bedoya Cano: ", "QA Automation Lead & Software Architect — Aprobado.")
    add_bullet(doc, "Tomás Henao Metaute: ", "QA Automation & DevOps Lead — Aprobado.")
    add_bullet(doc, "Alejandro Bustamante: ", "QA Automation & Currency Lead — Aprobado.")
    add_bullet(doc, "Dubin Soto: ", "QA Security & Governance Lead — Aprobado.")

    return doc

if __name__ == "__main__":
    os.makedirs("docs", exist_ok=True)
    out_path = os.path.join("docs", "plan-de-pruebas-espocrm.docx")
    print(f"Generando blueprint técnico consolidado del equipo en: {out_path}...")
    doc = build_test_plan_document()
    doc.save(out_path)
    print("Documento .docx generado exitosamente con el equipo completo y formato institucional EspoCRM.")
