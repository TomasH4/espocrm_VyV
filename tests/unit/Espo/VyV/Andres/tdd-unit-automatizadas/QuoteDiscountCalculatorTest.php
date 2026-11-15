<?php
/**
 * QuoteDiscountCalculatorTest.php
 *
 * Suite de pruebas unitarias automatizadas para QuoteDiscountCalculator
 * aplicando TDD (Red -> Green -> Refactor), FIRST, AAA y Test Doubles.
 *
 * Funcionalidad 3 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Andres;

use Espo\VyV\QuoteDiscount\CouponRepository;
use Espo\VyV\QuoteDiscount\QuoteDiscountCalculator;
use Espo\VyV\QuoteDiscount\QuoteDiscountResult;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class QuoteDiscountCalculatorTest extends TestCase
{
    /**
     * @var CouponRepository&MockObject
     */
    private CouponRepository&MockObject $repositoryMock;

    private QuoteDiscountCalculator $sut;

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(CouponRepository::class);
        $this->sut = new QuoteDiscountCalculator($this->repositoryMock);
    }

    /**
     * [Camino P1]: Rechazo cuando quoteId es vacio.
     */
    public function testCalculateFailsWhenQuoteIdIsEmpty(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('applyQuoteDiscount');

        $input = [
            'quoteId'  => '',
            'subtotal' => 2500.0,
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertInstanceOf(QuoteDiscountResult::class, $result);
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('quoteId es obligatorio', $result->getError());
    }

    /**
     * [Camino P2]: Rechazo cuando subtotal es menor o igual a cero.
     */
    public function testCalculateFailsWhenSubtotalIsZeroOrNegative(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('applyQuoteDiscount');

        $input = [
            'quoteId'  => 'quote-001',
            'subtotal' => 0.0,
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('estrictamente mayor a 0', $result->getError());
    }

    /**
     * [Camino P3 / BVA]: Subtotal de $999.99 cae en Tramo 1 (0% volumen).
     */
    public function testCalculateAppliesZeroPercentForSubtotalUnder1000(): void
    {
        // Arrange
        $quoteId = 'quote-tier-1';
        $subtotal = 999.99;

        $this->repositoryMock
            ->expects($this->once())
            ->method('applyQuoteDiscount')
            ->with($quoteId, $subtotal, 0.0, $subtotal, 0.0, false)
            ->willReturn(true);

        $input = [
            'quoteId'  => $quoteId,
            'subtotal' => $subtotal,
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(0.0, $result->getVolumeDiscountPercent());
        $this->assertSame(0.0, $result->getDiscountAmount());
        $this->assertSame($subtotal, $result->getFinalTotal());
        $this->assertFalse($result->isCapped());
    }

    /**
     * [Camino P4 / BVA]: Subtotal de $1,000.00 exactos activa Tramo 2 (5% volumen).
     */
    public function testCalculateAppliesFivePercentAtLowerBoundaryOfTierTwo(): void
    {
        // Arrange
        $quoteId = 'quote-tier-2';
        $subtotal = 1000.00;
        $expectedDiscount = 50.00;
        $expectedTotal = 950.00;

        $this->repositoryMock
            ->expects($this->once())
            ->method('applyQuoteDiscount')
            ->with($quoteId, $subtotal, $expectedDiscount, $expectedTotal, 5.0, false)
            ->willReturn(true);

        $input = [
            'quoteId'  => $quoteId,
            'subtotal' => $subtotal,
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(5.0, $result->getVolumeDiscountPercent());
        $this->assertSame($expectedDiscount, $result->getDiscountAmount());
        $this->assertSame($expectedTotal, $result->getFinalTotal());
    }

    /**
     * [Camino P5 / BVA]: Subtotal de $5,000.00 exactos activa Tramo 3 (10% volumen).
     */
    public function testCalculateAppliesTenPercentAtLowerBoundaryOfTierThree(): void
    {
        // Arrange
        $quoteId = 'quote-tier-3';
        $subtotal = 5000.00;

        $this->repositoryMock
            ->expects($this->once())
            ->method('applyQuoteDiscount')
            ->with($quoteId, $subtotal, 500.0, 4500.0, 10.0, false)
            ->willReturn(true);

        $input = [
            'quoteId'  => $quoteId,
            'subtotal' => $subtotal,
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(10.0, $result->getVolumeDiscountPercent());
        $this->assertSame(500.0, $result->getDiscountAmount());
        $this->assertSame(4500.0, $result->getFinalTotal());
    }

    /**
     * [Camino P6 / BVA]: Subtotal de $15,000.00 exactos activa Tramo 4 (15% volumen).
     */
    public function testCalculateAppliesFifteenPercentAtTierFour(): void
    {
        // Arrange
        $quoteId = 'quote-tier-4';
        $subtotal = 20000.00;

        $this->repositoryMock
            ->expects($this->once())
            ->method('applyQuoteDiscount')
            ->with($quoteId, $subtotal, 3000.0, 17000.0, 15.0, false)
            ->willReturn(true);

        $input = [
            'quoteId'  => $quoteId,
            'subtotal' => $subtotal,
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(15.0, $result->getVolumeDiscountPercent());
        $this->assertSame(3000.0, $result->getDiscountAmount());
    }

    /**
     * [Camino P7]: Suma de beneficio VIP (+5% adicional).
     */
    public function testCalculateAddsVipLoyaltyDiscount(): void
    {
        // Arrange: Subtotal $2,000 (5% volumen) + VIP (5%) = 10% total
        $quoteId = 'quote-vip';
        $subtotal = 2000.00;

        $this->repositoryMock
            ->expects($this->once())
            ->method('applyQuoteDiscount')
            ->with($quoteId, $subtotal, 200.0, 1800.0, 10.0, false)
            ->willReturn(true);

        $input = [
            'quoteId'       => $quoteId,
            'subtotal'      => $subtotal,
            'isVipCustomer' => true,
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(5.0, $result->getVolumeDiscountPercent());
        $this->assertSame(5.0, $result->getVipDiscountPercent());
        $this->assertSame(10.0, $result->getTotalDiscountPercent());
        $this->assertSame(200.0, $result->getDiscountAmount());
    }

    /**
     * [Camino P8]: Rechazo cuando el cupon promocional no existe o esta expirado.
     */
    public function testCalculateFailsWhenCouponIsInvalidOrExpired(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('findDiscountByCode')
            ->with('PROMO_INVALID')
            ->willReturn(null);

        $input = [
            'quoteId'    => 'quote-coupon-err',
            'subtotal'   => 3000.0,
            'couponCode' => 'PROMO_INVALID',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('invalido o ha expirado', $result->getError());
    }

    /**
     * [Camino P9]: Cupon promocional valido aplicado exitosamente.
     */
    public function testCalculateAppliesValidPromotionalCoupon(): void
    {
        // Arrange: Subtotal $1,000 (5%) + Coupon (10%) = 15% total
        $this->repositoryMock
            ->method('findDiscountByCode')
            ->with('BLACKFRIDAY10')
            ->willReturn(10.0);

        $this->repositoryMock
            ->expects($this->once())
            ->method('applyQuoteDiscount')
            ->with('quote-coupon-ok', 1000.0, 150.0, 850.0, 15.0, false)
            ->willReturn(true);

        $input = [
            'quoteId'    => 'quote-coupon-ok',
            'subtotal'   => 1000.0,
            'couponCode' => 'BLACKFRIDAY10',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(10.0, $result->getCouponDiscountPercent());
        $this->assertSame(15.0, $result->getTotalDiscountPercent());
        $this->assertSame(150.0, $result->getDiscountAmount());
    }

    /**
     * [Camino P10 / BVA Cap]: Activacion de Cap a 35% cuando la suma supera el margen maximo.
     */
    public function testCalculateAppliesCapWhenTotalExceedsThirtyFivePercent(): void
    {
        // Arrange: Subtotal $20,000 (15%) + VIP (5%) + Coupon (20%) = 40% bruto -> Cap a 35.0%
        $quoteId = 'quote-cap-test';
        $subtotal = 10000.0; // 10% volumen

        $this->repositoryMock
            ->method('findDiscountByCode')
            ->with('MEGA25')
            ->willReturn(25.0);

        // 10% (volumen) + 5% (VIP) + 25% (cupón) = 40% -> Se limita a 35%
        $expectedDiscount = 3500.0; // 35% de 10,000
        $expectedTotal = 6500.0;

        $this->repositoryMock
            ->expects($this->once())
            ->method('applyQuoteDiscount')
            ->with($quoteId, $subtotal, $expectedDiscount, $expectedTotal, 35.0, true)
            ->willReturn(true);

        $input = [
            'quoteId'       => $quoteId,
            'subtotal'      => $subtotal,
            'isVipCustomer' => true,
            'couponCode'    => 'MEGA25',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(35.0, $result->getTotalDiscountPercent());
        $this->assertSame($expectedDiscount, $result->getDiscountAmount());
        $this->assertSame($expectedTotal, $result->getFinalTotal());
        $this->assertTrue($result->isCapped());
    }

    /**
     * [Camino P11]: Error 500 cuando el repositorio falla al persistir el calculo.
     */
    public function testCalculateFailsWhenRepositoryFails(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('applyQuoteDiscount')
            ->willReturn(false);

        $input = [
            'quoteId'  => 'quote-err-500',
            'subtotal' => 1500.0,
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
        $this->assertStringContainsString('Fallo en la persistencia', $result->getError());
    }
}
