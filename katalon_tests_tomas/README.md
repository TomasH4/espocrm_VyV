# 🧪 Pruebas E2E con Katalon Recorder (Chrome Extension) - Tomás

Suite completa de pruebas End-to-End (E2E) desarrolladas para la extensión oficial de **Katalon Recorder** en Google Chrome, cubriendo las 5 funcionalidades asignadas y la autenticación en **EspoCRM VyV** (`http://localhost:8080`).

---

## 📁 Estructura del Directorio

La estructura sigue rigurosamente el formato de suite y casos de prueba XHTML de Katalon Recorder, idéntica a la convención del proyecto de referencia:

```text
katalon_tests_tomas/
├── login/
│   ├── CP01_Login_Exitoso.html
│   ├── CP02_Login_Credenciales_Invalidas.html
│   └── CP03_Login_Campos_Vacios.html
│
├── F1_lead_creation/
│   ├── CP01_Crear_Lead_Completo_Exitoso.html
│   ├── CP02_Crear_Lead_Solo_Apellido_Minimo.html
│   ├── CP03_Crear_Lead_Apellido_Vacio_Error.html
│   └── CP04_Crear_Lead_Email_Invalido_Error.html
│
├── F2_opportunity_probability/
│   ├── CP01_Oportunidad_Prospecting_10_Porciento.html
│   ├── CP02_Oportunidad_Closed_Won_100_Porciento.html
│   ├── CP03_Oportunidad_Closed_Lost_0_Porciento.html
│   └── CP04_Oportunidad_Transicion_Etapas_Actualiza_Probabilidad.html
│
├── F3_contact_search/
│   ├── CP01_Busqueda_Parcial_Contactos.html
│   ├── CP02_Busqueda_Exacta_Contactos.html
│   ├── CP03_Busqueda_Sin_Resultados.html
│   └── CP04_Limpiar_Filtro_Restaura_Listado.html
│
├── F4_meeting_scheduling/
│   ├── CP01_Agendar_Reunion_Duracion_Automatica_90Min.html
│   ├── CP02_Reunion_Fecha_Fin_Anterior_A_Inicio_Error.html
│   └── CP03_Agendar_Reunion_Sin_Nombre_Error.html
│
└── F5_lead_conversion/
    ├── CP01_Conversion_Lead_B2B_Contacto_Y_Cuenta.html
    ├── CP02_Conversion_Lead_Solo_Contacto_B2C.html
    └── CP03_Conversion_Lead_Sin_Seleccion_Error.html
```

---

## 🎯 Cobertura de Funcionalidades

| Funcionalidad | Casos de Prueba | Descripción |
| :--- | :--- | :--- |
| **Login / Auth** | CP01 a CP03 | Login exitoso como `Tomas`, manejo de credenciales erróneas y validación de campos vacíos. |
| **F1: Lead Creation** | CP01 a CP04 | Creación completa (nombre, apellido, email, teléfono), creación mínima solo con apellido obligatorio, rechazo por apellido vacío y rechazo por email inválido. |
| **F2: Opportunity Probability** | CP01 a CP04 | Asignación automática de probabilidad según etapa: Prospecting (10%), Closed Won (100%), Closed Lost (0%) y reactividad en transiciones dinámicas. |
| **F3: Contact Search & Filter** | CP01 a CP04 | Búsqueda parcial (`LIKE %Gom%`), búsqueda exacta entre comillas (`"Carlos"`), búsqueda de contacto inexistente (No Data) y restauración de lista al limpiar filtro. |
| **F4: Meeting Scheduling** | CP01 a CP03 | Cálculo automático de duración de reunión (90 min) entre fechas/horas inicio-fin, rechazo cuando fecha fin es anterior a fecha inicio y validación de nombre obligatorio. |
| **F5: Lead Conversion** | CP01 a CP03 | Conversión transaccional completa B2B (Lead ➔ Contacto + Cuenta vinculada), conversión B2C (Lead ➔ solo Contacto) y validación de error si no se selecciona ninguna entidad destino. |

---

## 🚀 Cómo Ejecutar las Pruebas en Katalon Recorder

### 1. Prerrequisitos
- Tener levantado el contenedor de EspoCRM en `http://localhost:8080`.
- Tener instalada la extensión **Katalon Recorder (Selenium tests generator, runner, reporter)** en Google Chrome.

### 2. Abrir la Extensión
1. En Google Chrome, haz clic en el icono de extensiones y abre **Katalon Recorder**.
2. Verifica que la barra superior tenga configurada la URL base: `http://localhost:8080`.

### 3. Cargar las Pruebas
Puedes cargar los casos de dos formas:
- **Abrir Test Suite o Caso individual**:
  - En el menú superior de Katalon Recorder, haz clic en **Open** (ícono de carpeta 📂).
  - Selecciona cualquiera de los archivos `.html` de las carpetas `F1_...`, `F2_...`, etc.
- **Crear Suites por Carpeta**:
  - Haz clic en **+** (New Test Suite), nómbrala por ejemplo `F1_Lead_Creation`.
  - Agrega o abre los archivos `.html` de esa carpeta.

### 4. Ejecución
1. Ajusta la velocidad de ejecución en el control deslizante (**Play Speed**) en velocidad media (`Medium`) para permitir que la interfaz Backbone/Marionette de EspoCRM complete sus animaciones.
2. Haz clic en **Play** (para el caso seleccionado) o **Play Suite** (para ejecutar todos los casos de la suite en secuencia).
3. Observa los logs en la pestaña **Log** de Katalon Recorder; los pasos exitosos se marcarán en verde (`PASSED`).
