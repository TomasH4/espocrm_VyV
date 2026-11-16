<?php
/**
 * QuoteDiscountResult.php
 *
 * Value Object inmutable que representa el desglose y resultado del calculo
 * de descuentos escalonados en Cotizaciones.
 *
 * Funcionalidad 3 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\QuoteDiscount;

final class QuoteDiscountResult
{
    private bool    $success;
    private int     $code;
    private ?string $error;
    private ?string $quoteId;
    private ?float  $subtotal;
    private ?float  $volumeDiscountPercent;
    private ?float  $vipDiscountPercent;
    private ?float  $couponDiscountPercent;
    private ?float  $totalDiscountPercent;
    private ?float  $discountAmount;
    private ?float  $finalTotal;
    private ?bool   $isCapped;

    private function __construct(
        bool    $success,
        int     $code,
        ?string $error,
        ?string $quoteId,
        ?float  $subtotal,
        ?float  $volumeDiscountPercent,
        ?float  $vipDiscountPercent,
        ?float  $couponDiscountPercent,
        ?float  $totalDiscountPercent,
        ?float  $discountAmount,
        ?float  $finalTotal,
        ?bool   $isCapped
    ) {
        $this->success               = $success;
        $this->code                  = $code;
        $this->error                 = $error;
        $this->quoteId               = $quoteId;
        $this->subtotal              = $subtotal;
        $this->volumeDiscountPercent = $volumeDiscountPercent;
        $this->vipDiscountPercent    = $vipDiscountPercent;
        $this->couponDiscountPercent = $couponDiscountPercent;
        $this->totalDiscountPercent  = $totalDiscountPercent;
        $this->discountAmount        = $discountAmount;
        $this->finalTotal            = $finalTotal;
        $this->isCapped              = $isCapped;
    }

    public static function failure(int $code, string $error): self
    {
        return new self(
            false, $code, $error, null, null, null, null, null, null, null, null, null
        );
    }

    public static function success(
        string $quoteId,
        float  $subtotal,
        float  $volumeDiscountPercent,
        float  $vipDiscountPercent,
        float  $couponDiscountPercent,
        float  $totalDiscountPercent,
        float  $discountAmount,
        float  $finalTotal,
        bool   $isCapped
    ): self {
        return new self(
            true,
            200,
            null,
            $quoteId,
            $subtotal,
            $volumeDiscountPercent,
            $vipDiscountPercent,
            $couponDiscountPercent,
            $totalDiscountPercent,
            $discountAmount,
            $finalTotal,
            $isCapped
        );
    }

    public function isSuccess(): bool               { return $this->success; }
    public function getCode(): int                  { return $this->code; }
    public function getError(): ?string             { return $this->error; }
    public function getQuoteId(): ?string           { return $this->quoteId; }
    public function getSubtotal(): ?float           { return $this->subtotal; }
    public function getVolumeDiscountPercent(): ?float { return $this->volumeDiscountPercent; }
    public function getVipDiscountPercent(): ?float    { return $this->vipDiscountPercent; }
    public function getCouponDiscountPercent(): ?float { return $this->couponDiscountPercent; }
    public function getTotalDiscountPercent(): ?float  { return $this->totalDiscountPercent; }
    public function getDiscountAmount(): ?float        { return $this->discountAmount; }
    public function getFinalTotal(): ?float            { return $this->finalTotal; }
    public function isCapped(): ?bool                  { return $this->isCapped; }
}
