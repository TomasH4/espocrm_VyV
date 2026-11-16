<?php
/**
 * Proyecto VyV 2026-2 — Módulo Moneda y tasas de cambio.
 * CUR-F2 Aritmética decimal: CB-CUR-F2-03, ramas de CalculatorUtil cuando bcmath NO está cargada
 * (multiply/add/subtract/compare C2, divide C1, round C1).
 *
 * Con bcmath cargada estas pruebas se omiten. Para ejecutarlas, arrancar PHP sin php.ini
 * (en la imagen de EspoCRM bcmath es una extensión compartida que se carga desde conf.d):
 *   php -n /usr/local/bin/phpunit tests/unit/Espo/VyV/Currency/CalculatorUtilSinBcmathTest.php --no-coverage
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Currency;

use DivisionByZeroError;
use Espo\Core\Currency\CalculatorUtil;
use PHPUnit\Framework\TestCase;

class CalculatorUtilSinBcmathTest extends TestCase
{
    protected function setUp(): void
    {
        if (function_exists('bcadd')) {
            $this->markTestSkipped('bcmath está cargada; ejecutar con php -n para recorrer las ramas sin bcmath.');
        }
    }

    /** add C2: la coma flotante da 0.30000000000000004, pero floatToString lo oculta al cortar en 14 decimales. */
    public function testAddSinBcmathOcultaElErrorDeComaFlotante(): void
    {
        $this->assertSame('0.3', CalculatorUtil::add('0.1', '0.2'));
    }

    /** multiply C2: el resultado sale sin ceros a la derecha, distinto del formato con bcmath. */
    public function testMultiplySinBcmathCambiaElFormato(): void
    {
        $this->assertSame('400', CalculatorUtil::multiply('0.1', '4000'));
    }

    /** subtract C2. */
    public function testSubtractSinBcmath(): void
    {
        $this->assertSame('0.1', CalculatorUtil::subtract('0.3', '0.2'));
    }

    /** divide C1: con coma flotante los últimos decimales no coinciden con el resultado exacto de bcdiv. */
    public function testDivideSinBcmathPierdeExactitud(): void
    {
        $result = CalculatorUtil::divide('2', '0.0003');

        $this->assertStringStartsWith('6666.666666666666', $result);
        $this->assertNotSame('6666.66666666666666', $result);
    }

    /** divide C1 con divisor cero: en PHP 8 el operador / también lanza DivisionByZeroError. */
    public function testDivideEntreCeroSinBcmath(): void
    {
        $this->expectException(DivisionByZeroError::class);

        CalculatorUtil::divide('1', '0');
    }

    /** round C1: usa round() de PHP; coincide con bcmath en el punto medio. */
    public function testRoundSinBcmath(): void
    {
        $this->assertSame('2.35', CalculatorUtil::round('2.345', 2));
        $this->assertSame('-2.35', CalculatorUtil::round('-2.345', 2));
    }

    /** compare C2: operador <=> sobre float. */
    public function testCompareSinBcmath(): void
    {
        $this->assertSame(-1, CalculatorUtil::compare('0.1', '0.2'));
        $this->assertSame(0, CalculatorUtil::compare('0.3', '0.30'));
    }
}
