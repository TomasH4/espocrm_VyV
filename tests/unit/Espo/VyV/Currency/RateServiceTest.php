<?php
/**
 * Proyecto VyV 2026-2 — Módulo Moneda y tasas de cambio.
 * CUR-F4 Consulta y actualización de tasas: pruebas de caja blanca de Espo\Tools\Currency\RateService
 * (get, set, writeOne, checkReadAccess, checkEditAccess) con dobles de sus siete dependencias.
 *
 * Las tasas se arman como lo hace Api\PutUpdate: Rates::fromAssoc(cuerpo, '___').
 * Grafos y caminos: docs/CUR/CUR-F4/caja-blanca.md.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Currency;

use Espo\Core\Acl;
use Espo\Core\Acl\Table;
use Espo\Core\Currency\ConfigDataProvider;
use Espo\Core\Currency\Rates;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Field\Date;
use Espo\Core\Utils\Currency\DatabasePopulator;
use Espo\Core\Utils\DateTime;
use Espo\Core\Utils\Metadata;
use Espo\Entities\CurrencyRecordRate;
use Espo\ORM\EntityManager;
use Espo\Tools\Currency\Exceptions\NotEnabled;
use Espo\Tools\Currency\RateEntryProvider;
use Espo\Tools\Currency\RateService;
use Espo\Tools\Currency\SyncManager;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class RateServiceTest extends TestCase
{
    private Acl&MockObject $acl;
    private DatabasePopulator&MockObject $populator;
    private ConfigDataProvider&MockObject $config;
    private SyncManager&MockObject $syncManager;
    private RateEntryProvider&MockObject $entryProvider;
    private DateTime&MockObject $dateTime;
    private EntityManager&MockObject $entityManager;
    private Date $today;

    private RateService $sut;

    protected function setUp(): void
    {
        $this->acl = $this->createMock(Acl::class);
        $this->populator = $this->createMock(DatabasePopulator::class);
        $this->config = $this->createMock(ConfigDataProvider::class);
        $this->syncManager = $this->createMock(SyncManager::class);
        $this->entryProvider = $this->createMock(RateEntryProvider::class);
        $this->dateTime = $this->createMock(DateTime::class);
        $this->entityManager = $this->createMock(EntityManager::class);

        $this->today = Date::fromString('2026-11-15');

        $this->config->method('getBaseCurrency')->willReturn('USD');
        $this->config->method('getCurrencyList')->willReturn(['USD', 'COP']);
        $this->dateTime->method('getToday')->willReturn($this->today);

        $this->sut = $this->service(0.0001);
    }

    /** Construye el servicio con un doble de Metadata cuyo campo Rate tiene el mínimo dado (null = sin definir). */
    private function service(?float $minRate): RateService
    {
        $metadata = $this->createMock(Metadata::class);
        $metadata->method('get')
            ->with(['entityDefs', 'CurrencyRecordRate', 'fields', 'rate', 'min'])
            ->willReturn($minRate);

        return new RateService(
            $this->acl,
            $this->populator,
            $this->config,
            $this->syncManager,
            $this->entryProvider,
            $this->dateTime,
            $this->entityManager,
            $metadata,
        );
    }

    private function asAdmin(): void
    {
        $this->acl->method('check')->with('Currency')->willReturn(true);
        $this->acl->method('getLevel')->willReturn(Table::LEVEL_YES);
    }

    /** @param array<string, mixed> $body */
    private function body(array $body): Rates
    {
        return Rates::fromAssoc($body, '___');
    }

    // ---------------------------------------------------------------- permisos

    /** CB-CUR-F4-01a — check…Access C1 (1-2-3-7): sin acceso al ámbito Currency. */
    public function testSinAccesoAlAmbitoEsForbidden(): void
    {
        $this->acl->method('check')->willReturn(false);
        $this->acl->expects($this->never())->method('getLevel');

        $this->expectException(Forbidden::class);

        $this->sut->set($this->body(['COP' => 0.0003]));
    }

    /** CB-CUR-F4-01b — check…Access C2 (1-2-4-5-7): acceso al ámbito pero nivel de edición distinto de yes. */
    public function testNivelDeEdicionNoEsForbidden(): void
    {
        $this->acl->method('check')->willReturn(true);
        $this->acl->expects($this->once())->method('getLevel')
            ->with('Currency', Table::ACTION_EDIT)->willReturn(Table::LEVEL_NO);
        $this->entityManager->expects($this->never())->method('saveEntity');

        $this->expectException(Forbidden::class);

        $this->sut->set($this->body(['COP' => 0.0003]));
    }

    /** checkReadAccess C1: get() sin acceso al ámbito Currency (CN-CUR-F4-02). */
    public function testConsultaSinAccesoAlAmbitoEsForbidden(): void
    {
        $this->acl->method('check')->willReturn(false);

        $this->expectException(Forbidden::class);

        $this->sut->get();
    }

    /** checkReadAccess C2: get() consulta el nivel de lectura. */
    public function testConsultaSinNivelDeLecturaEsForbidden(): void
    {
        $this->acl->method('check')->willReturn(true);
        $this->acl->expects($this->once())->method('getLevel')
            ->with('Currency', Table::ACTION_READ)->willReturn(Table::LEVEL_NO);

        $this->expectException(Forbidden::class);

        $this->sut->get();
    }

    // ---------------------------------------------------------------- get

    /** get C2 (1-2-3-4-5-4-6-7) con checkReadAccess C3: devuelve la tasa de cada moneda (CN-CUR-F4-01). */
    public function testConsultaDevuelveLasTasasDeLaConfiguracion(): void
    {
        $this->asAdmin();
        $this->config->method('getCurrencyRate')->willReturnMap([['USD', 1.0], ['COP', 0.00025]]);

        $rates = $this->sut->get();

        $this->assertSame('USD', $rates->getBase());
        $this->assertEqualsCanonicalizing(['USD' => 1.0, 'COP' => 0.00025], $rates->toAssoc());
    }

    // ---------------------------------------------------------------- set

    /** set C2 (1-2-3-4-5-6-11): tasa negativa, 400 y nada se guarda (CN-CUR-F4-06). */
    public function testTasaNegativaEsBadRequest(): void
    {
        $this->asAdmin();
        $this->entityManager->expects($this->never())->method('saveEntity');
        $this->syncManager->expects($this->never())->method('refreshCache');

        $this->expectException(BadRequest::class);

        $this->sut->set($this->body(['COP' => -0.5]));
    }

    /**
     * set C3 (…-5-7-8-4-10-11): EUR no está en la lista, USD es la base y '___' es la base ficticia de PutUpdate;
     * se omiten todos, pero igual se refresca la caché (CN-CUR-F4-09, 10 y 11).
     */
    public function testMonedasNoAplicablesSeOmiten(): void
    {
        $this->asAdmin();
        $this->entityManager->expects($this->never())->method('saveEntity');
        $this->syncManager->expects($this->once())->method('refreshCache');
        $this->populator->expects($this->once())->method('process');

        $this->sut->set($this->body(['EUR' => 0.9, 'USD' => 2.0]));
    }

    /** set C1 no es factible: toAssoc() siempre agrega la base, así que el bucle tiene al menos una vuelta. */
    public function testElCuerpoVacioIgualRecorreLaBase(): void
    {
        $this->assertSame(['___' => 1.0], $this->body([])->toAssoc());
    }

    /** set C4 + writeOne C2 (1-2-3-5-6-8-9): actualiza la tasa del día existente (CN-CUR-F4-04). */
    public function testActualizaLaTasaDelDiaExistente(): void
    {
        $this->asAdmin();

        $entry = $this->createMock(CurrencyRecordRate::class);
        $entry->expects($this->once())->method('setRate')->with('0.00026');

        $this->entryProvider->method('getRateEntryOnDate')->with('COP', $this->today)->willReturn($entry);
        $this->entryProvider->expects($this->never())->method('prepareNew');
        $this->entityManager->expects($this->once())->method('saveEntity')->with($entry);
        $this->syncManager->expects($this->once())->method('refreshCache');

        $this->sut->set($this->body(['COP' => 0.00026]));
    }

    /** CB-CUR-F4-02 — writeOne C3 (1-2-3-5-7-8-9): primera tasa del día, se crea una nueva con fecha de hoy. */
    public function testCreaLaTasaDelDiaSiNoExiste(): void
    {
        $this->asAdmin();

        $entry = $this->createMock(CurrencyRecordRate::class);
        $entry->expects($this->once())->method('setRate')->with('0.0003');

        $this->entryProvider->method('getRateEntryOnDate')->willReturn(null);
        $this->entryProvider->expects($this->once())->method('prepareNew')->with('COP', $this->today)->willReturn($entry);
        $this->entityManager->expects($this->once())->method('saveEntity')->with($entry);

        $this->sut->set($this->body(['COP' => 0.0003]));
    }

    /** writeOne C1 (1-2-3-4-9): moneda sin registro activo, NotEnabled se convierte en RuntimeException (500). */
    public function testMonedaNoHabilitadaEsRuntimeException(): void
    {
        $this->asAdmin();
        $this->entryProvider->method('getRateEntryOnDate')->willThrowException(new NotEnabled('No enabled.'));

        $this->expectException(RuntimeException::class);

        $this->sut->set($this->body(['COP' => 0.0003]));
    }

    /** @return array<string, array{float|int}> */
    public static function tasasPorDebajoDelMinimo(): array
    {
        return [
            'cero (CN-CUR-F4-07)' => [0],
            'justo debajo del mínimo' => [0.00009],
            'muy pequeña' => [0.000001],
        ];
    }

    /**
     * TDD ciclo 1 — DEF-CUR-04: la API debe rechazar, igual que el formulario, las tasas menores que el
     * mínimo del campo Rate (0.0001), y no guardar nada.
     */
    #[DataProvider('tasasPorDebajoDelMinimo')]
    public function testTasaPorDebajoDelMinimoEsBadRequest(float|int $value): void
    {
        // Arrange
        $this->asAdmin();
        $this->entityManager->expects($this->never())->method('saveEntity');
        $this->syncManager->expects($this->never())->method('refreshCache');

        // Assert (esperado)
        $this->expectException(BadRequest::class);

        // Act
        $this->sut->set($this->body(['COP' => $value]));
    }

    /** TDD ciclo 1 — valor límite: la tasa igual al mínimo (0.0001) sí se guarda (CN-CUR-F5-11 por la pantalla). */
    public function testTasaIgualAlMinimoSeGuarda(): void
    {
        // Arrange
        $this->asAdmin();

        $entry = $this->createMock(CurrencyRecordRate::class);
        $entry->expects($this->once())->method('setRate')->with('0.0001');

        $this->entryProvider->method('getRateEntryOnDate')->willReturn($entry);
        $this->entityManager->expects($this->once())->method('saveEntity')->with($entry);

        // Act
        $this->sut->set($this->body(['COP' => 0.0001]));
    }

    /** Refactor — el mínimo se lee de la definición del campo Rate: si cambia allí, la API lo respeta. */
    public function testElMinimoSaleDeLaDefinicionDelCampo(): void
    {
        // Arrange
        $this->asAdmin();
        $sut = $this->service(0.001);
        $this->entityManager->expects($this->never())->method('saveEntity');

        // Assert (esperado)
        $this->expectException(BadRequest::class);
        $this->expectExceptionMessage("Bad value for 'COP': the rate must not be less than 0.001.");

        // Act
        $sut->set($this->body(['COP' => 0.0005]));
    }

    /** Refactor — sin mínimo en la definición del campo se usa 0.0001. */
    public function testSinMinimoDefinidoSeUsaElValorPorDefecto(): void
    {
        // Arrange
        $this->asAdmin();
        $sut = $this->service(null);

        // Assert (esperado)
        $this->expectException(BadRequest::class);
        $this->expectExceptionMessage('the rate must not be less than 0.0001');

        // Act
        $sut->set($this->body(['COP' => 0.00009]));
    }

    /** @return array<string, array{mixed}> */
    public static function tasasNoNumericas(): array
    {
        return [
            "texto 'abc' (CN-CUR-F4-08)" => ['abc'],
            'booleano true' => [true],
            'arreglo' => [[1]],
            'objeto JSON' => [(object) ['a' => 1]],
        ];
    }

    /**
     * TDD ciclo 2 — DEF-CUR-03: un valor que no es numérico debe responder 400 (BadRequest),
     * no 500 (TypeError) ni guardarse convertido.
     */
    #[DataProvider('tasasNoNumericas')]
    public function testTasaNoNumericaEsBadRequest(mixed $value): void
    {
        // Arrange
        $this->asAdmin();
        $this->entityManager->expects($this->never())->method('saveEntity');

        // Assert (esperado)
        $this->expectException(BadRequest::class);

        // Act
        $this->sut->set($this->body(['COP' => $value]));
    }

    /** TDD ciclo 2 — se sigue aceptando un texto numérico, como lo envía un cliente JSON con comillas. */
    public function testTasaEnTextoNumericoSeGuarda(): void
    {
        // Arrange
        $this->asAdmin();

        $entry = $this->createMock(CurrencyRecordRate::class);
        $entry->expects($this->once())->method('setRate')->with('0.0003');

        $this->entryProvider->method('getRateEntryOnDate')->willReturn($entry);

        // Act
        $this->sut->set($this->body(['COP' => '0.0003']));
    }
}
