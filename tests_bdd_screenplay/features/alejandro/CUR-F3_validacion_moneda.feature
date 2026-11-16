# language: es
@CUR @CUR-F3
Característica: CUR-F3 Validación de campos de moneda
  Como usuario que registra presupuestos de campañas
  Quiero que el sistema solo acepte montos válidos en monedas configuradas
  Para que los presupuestos se puedan sumar y convertir sin errores

  Antecedentes:
    Dado que Alejandro administra un CRM con USD como moneda base

  @exitoso @interfaz @CN-CUR-F3-01
  Escenario: Guardar un presupuesto válido desde el formulario
    Dado que Alejandro inició sesión como administrador
    Cuando Alejandro guarda una campaña con presupuesto "1000.50" en "USD" desde el formulario
    Entonces la campaña se guarda con presupuesto 1000.5 "USD"
    Y el detalle muestra el presupuesto "1,000.50"

  @exitoso @interfaz @CN-CUR-F3-19
  Escenario: El selector de moneda solo ofrece las monedas configuradas
    Dado que Alejandro inició sesión como administrador
    Cuando Alejandro abre el formulario de una campaña nueva
    Entonces el selector de moneda ofrece solo "COP, USD"

  @error
  Esquema del escenario: Presupuesto rechazado por la API (<caso>)
    Cuando Alejandro crea por API una campaña con presupuesto "<monto>" en "<moneda>"
    Entonces la API responde 400
    Y el motivo del error contiene "type: <tipo>."

    Ejemplos:
      | caso         | monto  | moneda | tipo          |
      | CN-CUR-F3-10 | abc    | USD    | valid         |
      | CN-CUR-F3-11 | 12.5.3 | USD    | valid         |
      | CN-CUR-F3-13 | 100    | EUR    | validCurrency |
      | CN-CUR-F3-15 | 100    | usd    | validCurrency |

  @alternativo @OBS-CUR-04 @CN-CUR-F3-08
  Escenario: La API acepta 14 dígitos que la pantalla no deja escribir
    Cuando Alejandro crea por API una campaña con presupuesto "99999999999999" en "USD"
    Entonces la API responde 200
