<?php
/**
 * CouponRepository.php
 *
 * Interfaz de repositorio para validar cupones de descuento
 * y persistir el calculo de descuentos en las cotizaciones (Quotes).
 *
 * Funcionalidad 3 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\QuoteDiscount;

interface CouponRepository
{
    /**
     * Busca un cupon promocional y retorna su porcentaje de descuento si esta activo.
     *
     * @param string $couponCode Codigo alfanumerico del cupon.
     *
     * @return float|null Porcentaje de descuento (ej. 10.0) o null si no existe / expiro.
     */
    public function findDiscountByCode(string $couponCode): ?float;

    /**
     * Persiste los montos calculados de descuento y total final en la cotizacion.
     *
     * @param string $quoteId          Identificador de la cotizacion.
     * @param float  $subtotal         Subtotal base antes de descuentos.
     * @param float  $discountAmount   Monto total descontado en moneda.
     * @param float  $finalTotal       Total final a pagar.
     * @param float  $effectivePercent Porcentaje de descuento efectivo aplicado.
     * @param bool   $isCapped         Indica si el descuento fue limitado por el tope maximo.
     *
     * @return bool True si la actualizacion fue exitosa, false en caso contrario.
     */
    public function applyQuoteDiscount(
        string $quoteId,
        float  $subtotal,
        float  $discountAmount,
        float  $finalTotal,
        float  $effectivePercent,
        bool   $isCapped
    ): bool;
}
