# language: es
@CUR @CUR-F5
Característica: CUR-F5 Sincronización de la tasa vigente con la configuración
  Como administrador de monedas
  Quiero que la configuración use siempre la tasa más reciente que no esté en el futuro
  Para que las conversiones reflejen la tasa del día

  Antecedentes:
    Dado que Alejandro administra un CRM con USD como moneda base
    Y la tasa de COP es 0.00025 USD

  @exitoso @CN-CUR-F5-03
  Escenario: Editar la tasa vigente actualiza la configuración
    Cuando Alejandro cambia la tasa vigente de COP de 0.00025 a 0.0002
    Entonces la tasa configurada de "COP" es 0.0002

  @alternativo
  Esquema del escenario: Una tasa pasada o futura no reemplaza a la vigente (<caso>)
    Cuando Alejandro registra para COP la tasa <tasa> con fecha "<fecha>"
    Entonces la API responde 200
    Y la tasa configurada de "COP" es 0.00025

    Ejemplos:
      | caso         | fecha      | tasa   |
      | CN-CUR-F5-04 | 2026-10-01 | 0.0005 |
      | CN-CUR-F5-05 | 2026-12-31 | 0.0004 |

  @error @interfaz
  Esquema del escenario: El formulario de tasas rechaza valores menores que el mínimo (<caso>)
    Dado que Alejandro inició sesión como administrador
    Cuando Alejandro intenta guardar en Currencies › COP una tasa de "<valor>"
    Entonces la pantalla avisa que la tasa no es válida
    Y no se envía ninguna tasa al servidor

    Ejemplos:
      | caso         | valor   |
      | CN-CUR-F5-08 | -1      |
      | CN-CUR-F5-09 | 0       |
      | CN-CUR-F5-10 | 0.00009 |
