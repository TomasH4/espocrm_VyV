<?php
/**
 * Proyecto VyV 2026-2 — Módulo Moneda y tasas de cambio.
 * CUR-F1 Conversión: TDD sobre la función de fórmula ext\currency\convert
 * (Espo\Core\Formula\Functions\ExtGroup\CurrencyGroup\ConvertType).
 *
 * DEF-CUR-01: una moneda no configurada (EUR, XYZ, 'usd') terminaba en RuntimeException → HTTP 500.
 * DEF-CUR-02: un monto no numérico ('abc') terminaba en AssertionError → HTTP 500.
 * Comportamiento esperado: un error de fórmula (Formula\Exceptions\Error) con un mensaje que explica la causa;
 * el servicio de fórmulas lo convierte en una respuesta controlada (isSuccess = false), no en un 500.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Currency;

use Espo\Core\Currency\ConfigDataProvider;
use Espo\Core\Currency\Converter;
use Espo\Core\Field\Currency;
use Espo\Core\Formula\EvaluatedArgumentList;
use Espo\Core\Formula\Exceptions\BadArgumentType;
use Espo\Core\Formula\Exceptions\Error;
use Espo\Core\Formula\Exceptions\TooFewArguments;
use Espo\Core\Formula\Functions\ExtGroup\CurrencyGroup\ConvertType;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class ConvertTypeTest extends TestCase
{
    private ConfigDataProvider&MockObject $config;
    private Converter&MockObject $converter;
    private ConvertType $sut;

    protected function setUp(): void
    {
        $this->config = $this->createMock(ConfigDataProvider::class);
        $this->converter = $this->createMock(Converter::class);

        $this->config->method('getDefaultCurrency')->willReturn('USD');
        $this->config->method('hasCurrency')->willReturnCallback(fn (string $code) => in_array($code, ['USD', 'COP'], true));

        $this->sut = new ConvertType($this->config, $this->converter);
    }

    /** @param mixed[] $args */
    private function convert(array $args): string
    {
        return $this->sut->process(new EvaluatedArgumentList($args));
    }

    // ---------------------------------------------------------------- contrato que ya funcionaba

    /** CN-CUR-F1-01: conversión válida, delega en Converter y devuelve el monto como texto. */
    public function testConversionValidaDelegaEnElConversor(): void
    {
        // Arrange
        $this->converter->expects($this->once())->method('convert')
            ->with($this->callback(fn (Currency $c) => $c->getCode() === 'USD' && $c->getAmountAsString() === '100'), 'COP')
            ->willReturn(Currency::create('400000.00000000000000', 'COP'));

        // Act + Assert
        $this->assertSame('400000.00000000000000', $this->convert([100, 'USD', 'COP']));
    }

    /** CN-CUR-F1-04: sin moneda destino se usa la moneda por defecto. */
    public function testSinDestinoUsaLaMonedaPorDefecto(): void
    {
        $this->converter->expects($this->once())->method('convert')
            ->with($this->anything(), 'USD')->willReturn(Currency::create('100', 'USD'));

        $this->assertSame('100', $this->convert([400000, 'COP']));
    }

    /** CN-CUR-F1-14: con un solo argumento sigue siendo TooFewArguments. */
    public function testUnSoloArgumentoEsTooFewArguments(): void
    {
        $this->expectException(TooFewArguments::class);

        $this->convert([100]);
    }

    /** CN-CUR-F1-15: monto booleano → BadArgumentType (error de fórmula que ya existía). */
    public function testMontoBooleanoEsBadArgumentType(): void
    {
        $this->expectException(BadArgumentType::class);

        $this->convert([true, 'USD', 'COP']);
    }

    /** CN-CUR-F1-16: código de moneda numérico → BadArgumentType. */
    public function testCodigoNumericoEsBadArgumentType(): void
    {
        $this->expectException(BadArgumentType::class);

        $this->convert([100, 1, 'COP']);
    }

    /** El tercer argumento también debe ser texto. */
    public function testDestinoNumericoEsBadArgumentType(): void
    {
        $this->expectException(BadArgumentType::class);

        $this->convert([100, 'USD', 2]);
    }

    // ---------------------------------------------------------------- DEF-CUR-01

    /** @return array<string, array{string, string, string}> */
    public static function monedasNoConfiguradas(): array
    {
        return [
            'destino EUR (CN-CUR-F1-11)' => ['USD', 'EUR', 'EUR'],
            'origen XYZ (CN-CUR-F1-12)' => ['XYZ', 'COP', 'XYZ'],
            'minúsculas (CN-CUR-F1-13)' => ['usd', 'cop', 'usd'],
        ];
    }

    /** TDD ciclo 3 — DEF-CUR-01: moneda no configurada → error de fórmula con la causa, sin llamar al conversor. */
    #[DataProvider('monedasNoConfiguradas')]
    public function testMonedaNoConfiguradaEsErrorDeFormula(string $from, string $to, string $culpable): void
    {
        // Arrange
        $this->converter->expects($this->never())->method('convert');

        // Assert (esperado)
        $this->expectException(Error::class);
        $this->expectExceptionMessage("Currency '$culpable' is not configured");

        // Act
        $this->convert([100, $from, $to]);
    }

    // ---------------------------------------------------------------- DEF-CUR-02

    /** TDD ciclo 4 — DEF-CUR-02: monto no numérico → error de fórmula legible, no AssertionError. */
    public function testMontoNoNumericoEsErrorDeFormula(): void
    {
        $this->converter->expects($this->never())->method('convert');

        $this->expectException(Error::class);
        $this->expectExceptionMessage("The amount 'abc' is not a number");

        $this->convert(['abc', 'USD', 'COP']);
    }

    /** Un monto numérico escrito como texto se sigue aceptando (CN-CUR-F1-05). */
    public function testMontoEnTextoNumericoSeAcepta(): void
    {
        $this->converter->method('convert')->willReturn(Currency::create('400000', 'COP'));

        $this->assertSame('400000', $this->convert(['100', 'USD', 'COP']));
    }
}
