# language: es
Característica: F3 - Cálculo de Descuentos Escalonados en Ventas
  Como ejecutivo comercial en EspoCRM
  Quiero cotizar oportunidades de venta aplicando descuentos automáticos por volumen
  Para incentivar compras corporativas protegiendo el margen de utilidad de la empresa

  Antecedentes:
    Dado que Andres inicia sesión en la plataforma con credenciales válidas
    Y navega al módulo de "Opportunity"

  Escenario: Registro de cotización en tramo de volumen 4 (mayor a 15000 USD)
    Cuando Andres registra una cotización corporativa con monto de 20000 USD y etapa "Prospecting"
    Entonces la cotización debe registrarse con monto de 20000 USD
    Y el valor debe verse reflejado en la vista de detalle de la venta

  Escenario: Registro de cotización en tramo regular
    Cuando Andres registra una cotización estándar con monto de 4500 USD
    Entonces la cotización debe registrarse con monto de 4500 USD
