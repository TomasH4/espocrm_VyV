<?php
/**
 * Proyecto VyV 2026-2 — Módulo Moneda y tasas de cambio.
 * CUR-F2 Aritmética decimal: pruebas de caja blanca de Espo\Core\Currency\CalculatorUtil
 * con la extensión bcmath cargada (camino normal del entorno).
 *
 * Grafos y caminos: docs/CUR/CUR-F2/caja-blanca.md.
 * Ejecutar: phpunit tests/unit/Espo/VyV/Currency/CalculatorUtilTest.php --no-coverage
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Currency;

use DivisionByZeroError;
use Espo\Core\Currency\CalculatorUtil;
use PHPUnit\Framework\TestCase;

class CalculatorUtilTest extends TestCase
{
    protected function setUp(): void
    {
        if (!function_exists('bcadd')) {
            $this->markTestSkipped('Requiere bcmath; las ramas sin bcmath están en CalculatorUtilSinBcmathTest.');
        }
    }

    /** multiply C1 (1-2-3-5): bcmul sobre texto decimal, sin error de coma flotante (CN-CUR-F2-01). */
    public function testMultiplyConBcmathEsExacto(): void
    {
        $this->assertSame('400.00000000000000', CalculatorUtil::multiply('0.1', '4000'));
    }

    /** add C1: 0.1 + 0.2 da exactamente 0.3 con escala 14. */
    public function testAddConBcmathEsExacto(): void
    {
        $this->assertSame('0.30000000000000', CalculatorUtil::add('0.1', '0.2'));
    }

    /** subtract C1. */
    public function testSubtractConBcmath(): void
    {
        $this->assertSame('0.10000000000000', CalculatorUtil::subtract('0.3', '0.2'));
    }

    /** divide C2 (1-2-4-5-7-8): la escala fija de 14 decimales trunca, no redondea (OBS-CUR-03). */
    public function testDivideConBcmathTruncaEnElDecimal14(): void
    {
        $this->assertSame('6666.66666666666666', CalculatorUtil::divide('2', '0.0003'));
    }

    /** CB-CUR-F2-04 — divide, nodo 4: bcdiv lanza la excepción antes del nodo 5 (la rama null es código muerto). */
    public function testDivideEntreCeroLanzaDivisionByZeroError(): void
    {
        $this->expectException(DivisionByZeroError::class);

        CalculatorUtil::divide('1', '0');
    }

    /** CB-CUR-F2-01 — round C2 (1-2-4-5-7-8-9): monto positivo en el punto medio sube. */
    public function testRoundPositivoEnElPuntoMedio(): void
    {
        $this->assertSame('2.35', CalculatorUtil::round('2.345', 2));
    }

    /** round C2: por debajo del punto medio baja. */
    public function testRoundPositivoPorDebajoDelPuntoMedio(): void
    {
        $this->assertSame('2.34', CalculatorUtil::round('2.344', 2));
    }

    /** CB-CUR-F2-02 — round C3 (1-2-4-5-6-8-9): monto negativo, redondeo simétrico. */
    public function testRoundNegativoEsSimetrico(): void
    {
        $this->assertSame('-2.35', CalculatorUtil::round('-2.345', 2));
    }

    /** round C2 con precisión 0. */
    public function testRoundSinDecimales(): void
    {
        $this->assertSame('3', CalculatorUtil::round('2.5'));
    }

    /** compare C1: compara con la escala 14, así que el número de ceros a la derecha no importa. */
    public function testCompareConBcmath(): void
    {
        $this->assertSame(0, CalculatorUtil::compare('0.30000000000000', '0.3'));
        $this->assertSame(-1, CalculatorUtil::compare('0.1', '0.2'));
        $this->assertSame(1, CalculatorUtil::compare('0.2', '0.1'));
    }
}
