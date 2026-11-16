# language: es
@CUR @CUR-F2
Característica: CUR-F2 Aritmética decimal exacta de montos
  Como responsable financiero
  Quiero que las conversiones se calculen con aritmética decimal exacta
  Para no perder centavos por errores de coma flotante

  Antecedentes:
    Dado que Alejandro administra un CRM con USD como moneda base

  @exitoso
  Esquema del escenario: Resultados exactos con 14 decimales (<caso>)
    Dado la tasa de COP es <tasa> USD
    Cuando Alejandro convierte el monto "<monto>" de "<origen>" a "<destino>"
    Entonces el resultado de la conversión es "<resultado>"

    Ejemplos:
      | caso         | tasa    | monto     | origen | destino | resultado           |
      | CN-CUR-F2-01 | 0.00025 | 0.1       | USD    | COP     | 400.00000000000000  |
      | CN-CUR-F2-02 | 0.00025 | 0.1 + 0.2 | USD    | USD     | 0.30000000000000    |
      | CN-CUR-F2-05 | 0.0003  | 1         | USD    | COP     | 3333.33333333333333 |

  @alternativo @OBS-CUR-03 @CN-CUR-F2-08
  Escenario: La ida y vuelta no recupera el monto por el truncamiento
    Dado la tasa de COP es 0.0003 USD
    Cuando Alejandro convierte el monto "'3333.33333333333333'" de "COP" a "USD"
    Entonces el resultado de la conversión es "0.99999999999999"
