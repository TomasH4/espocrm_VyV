# language: es
@CUR @CUR-F4
Característica: CUR-F4 Consulta y actualización de tasas por la API
  Como integrador que sincroniza las tasas desde un sistema externo
  Quiero consultar y actualizar las tasas vigentes por la API
  Para que el CRM convierta con la tasa del día sin intervención manual

  Antecedentes:
    Dado que Alejandro administra un CRM con USD como moneda base
    Y la tasa de COP es 0.00025 USD

  @exitoso @CN-CUR-F4-04
  Escenario: Actualizar la tasa de COP
    Cuando Alejandro actualiza las tasas con '{"COP":0.00026}'
    Entonces la API responde 200
    Y la tasa configurada de "COP" es 0.00026

  @error @DEF-CUR-03 @DEF-CUR-04
  Esquema del escenario: Tasas inválidas rechazadas tras la corrección del TDD (<caso>)
    Cuando Alejandro actualiza las tasas con '<cuerpo>'
    Entonces la API responde 400
    Y el motivo del error contiene "<motivo>"
    Y la tasa configurada de "COP" es 0.00025

    Ejemplos:
      | caso                 | cuerpo            | motivo                          |
      | CN-CUR-F4-06         | {"COP":-0.5}      | must not be less than 0.0001    |
      | CN-CUR-F4-07         | {"COP":0}         | must not be less than 0.0001    |
      | Valor límite inferior | {"COP":0.00009}   | must not be less than 0.0001    |
      | CN-CUR-F4-08         | {"COP":"abc"}     | must be a number                |
      | Booleano             | {"COP":true}      | must be a number                |
      | CN-CUR-F4-11         | [1,2]             | must be a number                |

  @alternativo
  Esquema del escenario: Monedas que no aplican se omiten (<caso>)
    Cuando Alejandro actualiza las tasas con '<cuerpo>'
    Entonces la API responde 200
    Y la tasa configurada de "COP" es 0.00025

    Ejemplos:
      | caso         | cuerpo       |
      | CN-CUR-F4-09 | {"EUR":0.9}  |
      | CN-CUR-F4-10 | {"USD":2}    |

  @error @seguridad
  Esquema del escenario: Acceso a las tasas según el perfil (<caso>)
    Dado que Alejandro llama a la API como "<perfil>"
    Cuando Alejandro <accion> las tasas
    Entonces la API responde <codigo>

    Ejemplos:
      | caso         | perfil         | accion   | codigo |
      | CN-CUR-F4-02 | usuario normal | consulta | 403    |
      | CN-CUR-F4-12 | usuario normal | modifica | 403    |
      | CN-CUR-F4-03 | anónimo        | consulta | 401    |
      | CN-CUR-F4-13 | anónimo        | modifica | 401    |
