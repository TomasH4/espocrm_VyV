# language: es
Característica: F5 - Detección y Creación de Cuentas Corporativas
  Como administrador de datos de clientes
  Quiero registrar cuentas corporativas con identificadores tributarios únicos y dominios web
  Para mantener un catálogo de empresas confiable y libre de duplicados

  Antecedentes:
    Dado que Andres inicia sesión en la plataforma con credenciales válidas
    Y navega al módulo de "Account"

  Escenario: Creación exitosa de una cuenta corporativa única
    Cuando Andres registra una empresa con nombre único, NIT tributario y sitio web
    Entonces la cuenta debe ser creada exitosamente con sus datos tributarios
    Y debe listarse en el directorio principal de cuentas

  Escenario: Rechazo de creación de empresa sin nombre
    Cuando intenta registrar una empresa con el nombre vacío
    Entonces el sistema debe impedir el guardado de la cuenta
