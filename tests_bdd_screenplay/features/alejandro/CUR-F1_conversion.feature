# language: es
@CUR @CUR-F1
Característica: CUR-F1 Conversión de montos entre monedas
  Como administrador de un CRM que maneja dólares y pesos colombianos
  Quiero convertir montos entre las monedas configuradas
  Para conocer el valor de un monto en la moneda que necesito

  Antecedentes:
    Dado que Alejandro administra un CRM con USD como moneda base
    Y la tasa de COP es 0.00025 USD

  @exitoso @interfaz @CN-CUR-F1-01
  Escenario: Convertir dólares a pesos desde el Formula Sandbox
    Dado que Alejandro inició sesión como administrador
    Cuando Alejandro convierte "100" de "USD" a "COP" en el Formula Sandbox
    Entonces el Formula Sandbox muestra "400000.00000000000000"

  @exitoso
  Esquema del escenario: Conversión entre monedas configuradas (<caso>)
    Cuando Alejandro convierte el monto "<monto>" de "<origen>" a "<destino>"
    Entonces el resultado de la conversión es "<resultado>"

    Ejemplos:
      | caso         | monto  | origen | destino | resultado             |
      | CN-CUR-F1-01 | 100    | USD    | COP     | 400000.00000000000000 |
      | CN-CUR-F1-02 | 400000 | COP    | USD     | 100.00000000000000    |
      | CN-CUR-F1-03 | 100    | USD    | USD     | 100                   |

  @error @DEF-CUR-01 @DEF-CUR-02
  Esquema del escenario: Conversión con datos inválidos explica la causa (<caso>)
    Cuando Alejandro convierte el monto "<monto>" de "<origen>" a "<destino>"
    Entonces la conversión se rechaza con el mensaje "<mensaje>"

    Ejemplos:
      | caso         | monto | origen | destino | mensaje                          |
      | CN-CUR-F1-11 | 100   | USD    | EUR     | Currency 'EUR' is not configured |
      | CN-CUR-F1-13 | 100   | usd    | cop     | Currency 'usd' is not configured |
      | CN-CUR-F1-17 | 'abc' | USD    | COP     | The amount 'abc' is not a number |
