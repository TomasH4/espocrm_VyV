<?php
/**
 * Proyecto VyV 2026-2 — Módulo Moneda y tasas de cambio.
 * CUR-F3 Validación de campos de moneda: pruebas de caja blanca de
 * Espo\Classes\FieldValidators\CurrencyType (checkValid, checkInPermittedRange, checkValidCurrency).
 *
 * La entidad y la configuración son dobles de prueba: así se recorren las ramas de campos
 * decimales (atributo VARCHAR) que Campaign.budget, un float, no alcanza por la interfaz.
 * Grafos y caminos: docs/CUR/CUR-F3/caja-blanca.md.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Currency;

use Espo\Classes\FieldValidators\CurrencyType;
use Espo\Core\Utils\Config;
use Espo\ORM\BaseEntity;
use Espo\ORM\Entity;
use PHPUnit\Framework\TestCase;

class CurrencyTypeTest extends TestCase
{
    private const FIELD = 'budget';

    /**
     * Crea un doble de entidad con los atributos dados.
     *
     * @param array<string, mixed> $values Atributos presentes (has() es verdadero solo para estas claves).
     */
    private function entity(
        array $values,
        string $type = Entity::VARCHAR,
        ?int $precision = null,
        bool $isNew = false,
        bool $baseEntity = true
    ): Entity {
        $entity = $this->createMock($baseEntity ? BaseEntity::class : Entity::class);

        $entity->method('has')->willReturnCallback(fn (string $a) => array_key_exists($a, $values));
        $entity->method('get')->willReturnCallback(fn (string $a) => $values[$a] ?? null);
        $entity->method('getAttributeType')->willReturn($type);
        $entity->method('isNew')->willReturn($isNew);

        if ($baseEntity) {
            $entity->method('getAttributeParam')->willReturn($precision);
        }

        return $entity;
    }

    /** @param ?string[] $currencyList */
    private function validator(?array $currencyList = ['USD', 'COP'], string $default = 'USD'): CurrencyType
    {
        $config = $this->createMock(Config::class);
        $config->method('get')->willReturnMap([
            ['currencyList', null, $currencyList],
            ['defaultCurrency', null, $default],
        ]);

        return new CurrencyType($config);
    }

    private function money(mixed $amount, ?string $currency = 'USD'): array
    {
        return [self::FIELD => $amount, self::FIELD . 'Currency' => $currency];
    }

    // ---------------------------------------------------------------- checkValid

    /** checkValid C1 (1-2-3-9): sin monto no hay nada que validar. */
    public function testCheckValidVacio(): void
    {
        $this->assertTrue($this->validator()->checkValid($this->entity($this->money(null)), self::FIELD));
    }

    /** checkValid C2 (1-2-4-5-9): en un atributo float no se revisa el formato; explica por qué 'abc' no lo rechaza CurrencyType. */
    public function testCheckValidAtributoFloatNoRevisaFormato(): void
    {
        $entity = $this->entity($this->money('abc'), Entity::FLOAT);

        $this->assertTrue($this->validator()->checkValid($entity, self::FIELD));
    }

    /** CB-CUR-F3-03 — checkValid C3 (1-2-4-6-7-9): decimal con formato válido. */
    public function testCheckValidDecimalConFormatoValido(): void
    {
        $validator = $this->validator();

        foreach (['12.50', '-12.5', '12', '12.'] as $value) {
            $this->assertTrue($validator->checkValid($this->entity($this->money($value)), self::FIELD), $value);
        }
    }

    /** CB-CUR-F3-04 — checkValid C4 (1-2-4-6-8-9): decimal con formato inválido. */
    public function testCheckValidDecimalConFormatoInvalido(): void
    {
        $validator = $this->validator();

        foreach (['12a', '12.5.3', 'abc', '1,000.50', '.5'] as $value) {
            $this->assertFalse($validator->checkValid($this->entity($this->money($value)), self::FIELD), $value);
        }
    }

    // ---------------------------------------------------------------- checkInPermittedRange

    /** checkInPermittedRange C1 (1-2-3-19). */
    public function testRangoVacio(): void
    {
        $entity = $this->entity($this->money('1', null));

        $this->assertTrue($this->validator()->checkInPermittedRange($entity, self::FIELD));
    }

    /** checkInPermittedRange C2 (1-2-4-5-19): en float no hay límite; por eso la API acepta 14 dígitos (OBS-CUR-04). */
    public function testRangoAtributoFloatNoTieneLimite(): void
    {
        $entity = $this->entity($this->money(99999999999999.0), Entity::FLOAT);

        $this->assertTrue($this->validator()->checkInPermittedRange($entity, self::FIELD));
    }

    /** checkInPermittedRange C3 (1-2-4-6-7-19): entidad que no es BaseEntity (factible solo con un doble). */
    public function testRangoEntidadQueNoEsBaseEntity(): void
    {
        $entity = $this->entity($this->money('100000000000000'), baseEntity: false);

        $this->assertTrue($this->validator()->checkInPermittedRange($entity, self::FIELD));
    }

    /** CB-CUR-F3-05 — checkInPermittedRange C4: precision propia (5), positivo, en el límite. */
    public function testRangoConPrecisionEnElLimite(): void
    {
        $entity = $this->entity($this->money('99999'), precision: 5);

        $this->assertTrue($this->validator()->checkInPermittedRange($entity, self::FIELD));
    }

    /** CB-CUR-F3-06 — checkInPermittedRange C5: sin precision se usan 13 dígitos (valores límite 13 y 14 dígitos). */
    public function testRangoSinPrecisionUsaTreceDigitos(): void
    {
        $validator = $this->validator();

        $this->assertTrue($validator->checkInPermittedRange($this->entity($this->money('1')), self::FIELD));
        $this->assertTrue($validator->checkInPermittedRange($this->entity($this->money('9999999999999')), self::FIELD));
        $this->assertFalse($validator->checkInPermittedRange($this->entity($this->money('10000000000000')), self::FIELD));
    }

    /** CB-CUR-F3-07 — checkInPermittedRange C6: el negativo se compara por su valor absoluto. */
    public function testRangoNegativoEnElLimite(): void
    {
        $validator = $this->validator();

        $this->assertTrue($validator->checkInPermittedRange($this->entity($this->money('-99999'), precision: 5), self::FIELD));
        $this->assertFalse($validator->checkInPermittedRange($this->entity($this->money('-100000'), precision: 5), self::FIELD));
    }

    /** CB-CUR-F3-08 — checkInPermittedRange C7: fuera de rango. */
    public function testRangoFueraDelLimite(): void
    {
        $entity = $this->entity($this->money('100000'), precision: 5);

        $this->assertFalse($this->validator()->checkInPermittedRange($entity, self::FIELD));
    }

    // ---------------------------------------------------------------- checkValidCurrency

    /** CB-CUR-F3-09 — checkValidCurrency C1 (1-2-3-13): la entidad no trae el atributo de moneda. */
    public function testMonedaSinAtributo(): void
    {
        $entity = $this->entity([self::FIELD => '10'], Entity::FLOAT);

        $this->assertTrue($this->validator()->checkValidCurrency($entity, self::FIELD));
    }

    /** CB-CUR-F3-10 — checkValidCurrency C2: registro nuevo sin monto y con moneda nula. */
    public function testMonedaNulaEnRegistroNuevoSinMonto(): void
    {
        $entity = $this->entity([self::FIELD . 'Currency' => null], Entity::FLOAT, isNew: true);

        $this->assertTrue($this->validator()->checkValidCurrency($entity, self::FIELD));
    }

    /** checkValidCurrency C3: monto y moneda nulos (CN-CUR-F3-18). */
    public function testMonedaYMontoNulos(): void
    {
        $entity = $this->entity($this->money(null, null), Entity::FLOAT);

        $this->assertTrue($this->validator()->checkValidCurrency($entity, self::FIELD));
    }

    /** checkValidCurrency C4: la moneda se busca en currencyList (CN-CUR-F3-01, 13, 14, 15). */
    public function testMonedaSeBuscaEnLaLista(): void
    {
        $validator = $this->validator();

        $this->assertTrue($validator->checkValidCurrency($this->entity($this->money(10.0, 'USD'), Entity::FLOAT), self::FIELD));
        $this->assertTrue($validator->checkValidCurrency($this->entity($this->money(10.0, 'COP'), Entity::FLOAT), self::FIELD));

        foreach (['EUR', 'XYZ', 'usd'] as $code) {
            $entity = $this->entity($this->money(10.0, $code), Entity::FLOAT);

            $this->assertFalse($validator->checkValidCurrency($entity, self::FIELD), $code);
        }
    }

    /** checkValidCurrency C4: moneda nula con monto en un registro existente no pasa (no está en la lista). */
    public function testMonedaNulaConMonto(): void
    {
        $entity = $this->entity($this->money(10.0, null), Entity::FLOAT);

        $this->assertFalse($this->validator()->checkValidCurrency($entity, self::FIELD));
    }

    /** checkValidCurrency C5 (1-2-4-5-7-…): sin currencyList se acepta solo la moneda por defecto (factible solo con un doble). */
    public function testMonedaSinCurrencyListUsaLaMonedaPorDefecto(): void
    {
        $validator = $this->validator(null, 'USD');

        $this->assertTrue($validator->checkValidCurrency($this->entity($this->money(10.0, 'USD'), Entity::FLOAT), self::FIELD));
        $this->assertFalse($validator->checkValidCurrency($this->entity($this->money(10.0, 'COP'), Entity::FLOAT), self::FIELD));
    }
}
