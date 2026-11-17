# CUR — Evaluación heurística de usabilidad

**Criterio de la rúbrica:** 12 (Usabilidad y UX), parte de evaluación heurística. **Fecha:** 16 de noviembre de 2026.
**Plantilla:** *Evaluación Heurística — Nueva propuesta v2021* (Granollers). Integra los 10 principios de Nielsen con los de Tognazzini en **15 principios y 60 preguntas**.
**Archivo:** [`Evaluacion-Heuristica-CUR.xlsx`](Evaluacion-Heuristica-CUR.xlsx).
**Evaluador:** Alejandro Bustamante. Es **una** evaluación de experto; para más rigor se recomiendan de 3 a 5 evaluadores independientes.

**Alcance:** las pantallas del módulo Moneda y tasas de cambio en EspoCRM 10.1.1:
- Formula Sandbox (conversión, CUR-F1 y F2);
- formulario de Campaign con presupuesto en moneda (CUR-F3);
- Currencies › COP con el panel Rates (CUR-F5);
- Administration › Currency.

CUR-F4 es una funcionalidad de API sin pantalla.

## 1. Método y evidencia

Cada una de las 60 respuestas lleva en la columna *Comentarios* la evidencia que la sustenta. Las fuentes son:
- las pruebas ya ejecutadas en el proyecto: caja negra, Cypress, accesibilidad (axe y comprobaciones manuales), Playwright MCP y regresión;
- datos de la interfaz recogidos el 16-11-2026 con Cypress ([`datos/`](datos/)): títulos y rutas, íconos de ayuda, atajos de teclado, campos obligatorios, botones de solo ícono y el texto de confirmación al borrar;
- una prueba de tolerancia del buscador por API: «USD» encuentra 1 moneda y «UDS» encuentra 0.

Las respuestas y los comentarios están también en [`respuestas_heuristica.py`](respuestas_heuristica.py), para revisarlas o regenerar el Excel. El libro se llenó con Excel (COM), así que conserva las fórmulas, las listas de respuestas y las imágenes de la plantilla.

## 2. Resultados

| Resultado | Valor |
| :--- | :--- |
| **Porcentaje de usabilidad** (hoja RESULTADOS) | **56,8 %** |
| Prueba completa | 60 de 60 preguntas respondidas |
| Preguntas contables | 55 |
| No contables (No aplica / No es un problema) | 4 |
| Avisos (Imposible de comprobar) | 1: respuesta ante cortes de red o de energía, no probada |

| # | Principio | Contables | Puntaje | % |
| :---: | :--- | :---: | :---: | :---: |
| 1 | Visibilidad y estado del sistema | 5 | 3,31 | 66 % |
| 2 | Conexión entre el sistema y el mundo real | 4 | 2,65 | 66 % |
| 3 | Control y libertad del usuario | 3 | 1,66 | 55 % |
| 4 | Consistencia y estándares | 6 | 3,98 | 66 % |
| 5 | Reconocimiento antes que memoria | 5 | 2,97 | 59 % |
| 6 | Flexibilidad y eficiencia de uso | 5 | 3,32 | 66 % |
| 7 | Reconocer, diagnosticar y recuperarse de errores | 4 | 2,32 | 58 % |
| 8 | Prevención de errores | 3 | 0,99 | **33 %** |
| 9 | Diseño estético y minimalista | 4 | 2,99 | 75 % |
| 10 | Ayuda y documentación | 5 | 1,32 | **26 %** |
| 11 | Guardar el estado y proteger el trabajo | 2 | 0,66 | **33 %** |
| 12 | Color y legibilidad | 3 | 1,66 | 55 % |
| 13 | Autonomía | 3 | 2,32 | 77 % |
| 14 | Valores por defecto | 2 | 1,00 | 50 % |
| 15 | Reducción de la latencia | 1 | 0,66 | 66 % |

Valores de las respuestas: Sí en todos los casos = 1; Sí pero faltan casos = 0,66; No siempre = 0,33; No en ningún caso = 0.

## 3. Problemas de usabilidad priorizados

| # | Problema | Principios | Severidad | Recomendación |
| :--- | :--- | :--- | :--- | :--- |
| UX-CUR-01 | No hay ayuda para convertir monedas: el Sandbox exige conocer `ext\currency\convert`, no hay ejemplos y el campo Rate no tiene ayuda | 10, 5 | **Alta** | Un conversor visual (monto, moneda origen y destino) para usuarios de negocio, y ayuda contextual con un ejemplo en el Sandbox y en Rate |
| UX-CUR-02 | El campo Rate no indica el sentido de la tasa («1 COP = X USD») ni el mínimo 0.0001 hasta que falla | 8, 2 | **Alta** | Texto de ayuda permanente bajo el campo, con el sentido y el rango |
| UX-CUR-03 | Los errores de la fórmula solo dicen «Internal server error – Check logs» (DEF-CUR-01 y 02) | 7, 1 | **Alta** | Mensajes que nombren la causa («La moneda EUR no está configurada») |
| UX-CUR-04 | COP y USD usan el mismo símbolo «$», así que los montos no se distinguen (OBS-CUR-01) | 4, 9 | Media | Mostrar el código de la moneda (COP, USD) o el símbolo «COL$» |
| UX-CUR-05 | Las letras en el monto se borran sin aviso (OBS-CUR-05) y la pantalla corta a 13 dígitos sin explicarlo (OBS-CUR-04) | 7, 8, 4 | Media | Avisar en línea en lugar de descartar en silencio |
| UX-CUR-06 | Cambiar la tasa vigente afecta de inmediato a todas las conversiones sin pedir confirmación, y no se puede deshacer | 8, 3 | Media | Confirmar el cambio de la tasa vigente mostrando el impacto, y poder restaurar desde el historial |
| UX-CUR-07 | Contraste bajo de las etiquetas (2.95:1) y zoom bloqueado en móviles | 12 | Media | Ver A11Y-CUR-03 y 06 en [docs/CUR/accesibilidad](../accesibilidad/README.md) |
| UX-CUR-08 | El buscador no tolera errores de tipeo («UDS» no encuentra USD) | 8 | Baja | Búsqueda aproximada o sugerencias |
| UX-CUR-09 | Los atajos de teclado solo aparecen al pasar el mouse | 6 | Baja | Una ayuda de atajos (por ejemplo, con «?») |

**Fortalezas:**
- títulos y rutas claras en todas las pantallas;
- confirmación antes de borrar;
- atajos de teclado para las acciones frecuentes;
- diseño adaptable hasta 320 px;
- personalización por usuario;
- respuesta inmediata, sin esperas.

## 4. Pendiente para completar el criterio 12

La rúbrica pide también **pruebas con usuarios reales** sobre tareas definidas, con el cuestionario **SUS**, tasa de finalización, tiempos y errores. Esa parte requiere participantes reales y no está incluida en este documento. Los cuestionarios SUMI, UES, SAM y QUIM no se incluyen, por decisión del 16-11-2026.
