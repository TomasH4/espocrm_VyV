<?php
/**
 * QuoteDiscountCalculator.php
 *
 * Servicio de aplicacion encargado de calcular descuentos escalonados en cotizaciones (Quotes),
 * combinando matriz de volumen, lealtad VIP, cupones promocionales y garantia de margen maximo (Cap).
 *
 * Matriz de Volumen:
 *   - Subtotal < $1,000      -> 0%
 *   - $1,000 <= Subtotal < $5,000  -> 5%
 *   - $5,000 <= Subtotal < $15,000 -> 10%
 *   - Subtotal >= $15,000    -> 15%
 *
 * Cliente VIP: +5% adicional.
 * Cupon promocional: porcentaje definido por el cupon.
 * Margen de proteccion: Descuento total maximo permitido = 35.0%.
 *
 * Mapeo de Nodos para Analisis Estructural de Caja Blanca (Nodos 1 al 22).
 * Complejidad Ciclomatica de McCabe V(G) = 11 (10 predicados + 1).
 *
 * Funcionalidad 3 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\QuoteDiscount;

final class QuoteDiscountCalculator
{
    public const MAX_TOTAL_DISCOUNT = 35.0;

    public function __construct(
        private readonly CouponRepository $repository
    ) {}

    /**
     * Calcula los descuentos y montos finales de una cotizacion.
     *
     * @param array<string,mixed> $data Parametros de calculo.
     *
     * @return QuoteDiscountResult Resultado estructurado en Value Object.
     */
    public function calculate(array $data): QuoteDiscountResult
    {
        // Nodo 1: Captura y normalizacion de parametros de entrada
        $quoteId       = isset($data['quoteId']) ? trim((string) $data['quoteId']) : '';
        $subtotal      = isset($data['subtotal']) && is_numeric($data['subtotal']) ? (float) $data['subtotal'] : 0.0;
        $isVipCustomer = isset($data['isVipCustomer']) && (bool) $data['isVipCustomer'];
        $couponCode    = isset($data['couponCode']) && trim((string) $data['couponCode']) !== ''
            ? trim((string) $data['couponCode'])
            : null;

        // Nodo 2: Decision 1 - Verificacion de identificador obligatorio
        if ($quoteId === '') {
            // Nodo 3: Retorno error 400 por quoteId vacio
            return QuoteDiscountResult::failure(400, 'El campo quoteId es obligatorio');
        }

        // Nodo 4: Decision 2 - Verificacion de subtotal positivo
        if ($subtotal <= 0.0) {
            // Nodo 5: Retorno error 400 por subtotal menor o igual a cero
            return QuoteDiscountResult::failure(400, 'El subtotal debe ser un valor numerico estrictamente mayor a 0');
        }

        // Nodo 6: Decision 3 - Tramo 1 de volumen (< $1,000)
        if ($subtotal < 1000.0) {
            $volumePercent = 0.0;
        } elseif ($subtotal < 5000.0) {
            // Nodo 7: Decision 4 - Tramo 2 de volumen ($1,000 a $4,999.99)
            $volumePercent = 5.0;
        } elseif ($subtotal < 15000.0) {
            // Nodo 8: Decision 5 - Tramo 3 de volumen ($5,000 a $14,999.99)
            $volumePercent = 10.0;
        } else {
            // Nodo 9: Tramo 4 de volumen (>= $15,000)
            $volumePercent = 15.0;
        }

        // Nodo 10: Decision 6 - Evaluacion de beneficio por cliente VIP
        $vipPercent = $isVipCustomer ? 5.0 : 0.0;

        // Nodo 11: Decision 7 - Evaluacion de presencia de cupon promocional
        $couponPercent = 0.0;
        if ($couponCode !== null) {
            // Nodo 12: Consulta al repositorio de cupones
            $foundDiscount = $this->repository->findDiscountByCode($couponCode);
            // Nodo 13: Decision 8 - Verificacion de validez del cupon
            if ($foundDiscount === null) {
                // Nodo 14: Retorno error 400 por cupon invalido o inexistente
                return QuoteDiscountResult::failure(400, "El cupon promocional '$couponCode' es invalido o ha expirado");
            }
            $couponPercent = $foundDiscount;
        }

        // Nodo 15: Sumatoria de descuentos y Decision 9 - Limite de proteccion de margen (Cap 35%)
        $rawTotalPercent = $volumePercent + $vipPercent + $couponPercent;
        $isCapped = false;
        if ($rawTotalPercent > self::MAX_TOTAL_DISCOUNT) {
            // Nodo 16: Aplicacion del tope de seguridad
            $effectivePercent = self::MAX_TOTAL_DISCOUNT;
            $isCapped = true;
        } else {
            $effectivePercent = $rawTotalPercent;
        }

        // Nodo 17: Computo monetario de descuento y total final
        $discountAmount = (float) round($subtotal * ($effectivePercent / 100.0), 2);
        $finalTotal     = (float) round($subtotal - $discountAmount, 2);

        // Nodo 18: Delegacion de persistencia en base de datos
        $persisted = $this->repository->applyQuoteDiscount(
            $quoteId,
            $subtotal,
            $discountAmount,
            $finalTotal,
            $effectivePercent,
            $isCapped
        );

        // Nodo 19: Decision 10 - Verificacion de exito de persistencia
        if (!$persisted) {
            // Nodo 20: Retorno error 500 por fallo de persistencia
            return QuoteDiscountResult::failure(500, 'Fallo en la persistencia de base de datos al aplicar el descuento');
        }

        // Nodo 21: Retorno exitoso 200 con Value Object completo
        return QuoteDiscountResult::success(
            $quoteId,
            $subtotal,
            $volumePercent,
            $vipPercent,
            $couponPercent,
            $effectivePercent,
            $discountAmount,
            $finalTotal,
            $isCapped
        );

        // Nodo 22: Fin del metodo
    }
}
