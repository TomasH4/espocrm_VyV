<?php
/**
 * Proyecto VyV 2026-2 — Módulo Moneda y tasas de cambio.
 * CUR-F5 Sincronización de tasas: pruebas de caja blanca de los RecordHooks AfterSave y AfterDelete
 * de CurrencyRecordRate y de SyncManager::updateCode() / clearCache().
 *
 * Grafos y caminos: docs/CUR/CUR-F5/caja-blanca.md.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Currency;

use Espo\Classes\RecordHooks\CurrencyRecordRate\AfterDelete;
use Espo\Classes\RecordHooks\CurrencyRecordRate\AfterSave;
use Espo\Core\Currency\ConfigDataProvider;
use Espo\Core\Currency\Rates;
use Espo\Core\Exceptions\Conflict;
use Espo\Core\Record\DeleteParams;
use Espo\Core\Utils\Config\ConfigWriter;
use Espo\Core\Utils\Config\SystemConfig;
use Espo\Core\Utils\Currency\DatabasePopulator;
use Espo\Core\Utils\DataCache;
use Espo\Core\Utils\Event\EventDispatcher;
use Espo\Core\WebSocket\Submission;
use Espo\Entities\CurrencyRecord;
use Espo\Entities\CurrencyRecordRate;
use Espo\ORM\Collection;
use Espo\ORM\EntityManager;
use Espo\ORM\Executor\QueryExecutor;
use Espo\ORM\Repository\RDBRepository;
use Espo\ORM\Repository\RDBSelectBuilder;
use Espo\ORM\TransactionManager;
use Espo\Tools\Currency\Events\CurrencyRateUpdate;
use Espo\Tools\Currency\Exceptions\NotEnabled;
use Espo\Tools\Currency\RateEntryProvider;
use Espo\Tools\Currency\SyncManager;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class RateSyncTest extends TestCase
{
    // ---------------------------------------------------------------- hooks

    private SyncManager&MockObject $syncManager;
    private Submission&MockObject $submission;
    private DatabasePopulator&MockObject $populator;

    private function rateOf(string $code): CurrencyRecordRate
    {
        $record = $this->createMock(CurrencyRecord::class);
        $record->method('getCode')->willReturn($code);

        $rate = $this->createMock(CurrencyRecordRate::class);
        $rate->method('getRecord')->willReturn($record);

        return $rate;
    }

    private function hookDoubles(): void
    {
        $this->syncManager = $this->createMock(SyncManager::class);
        $this->submission = $this->createMock(Submission::class);
        $this->populator = $this->createMock(DatabasePopulator::class);
    }

    /** Hook C2 (1-2-3-4-6-7): moneda habilitada, se sincroniza y se avisa a los clientes (CN-CUR-F5-02). */
    public function testAfterSaveSincronizaLaMoneda(): void
    {
        $this->hookDoubles();
        $this->syncManager->expects($this->once())->method('updateCode')->with('COP');
        $this->populator->expects($this->once())->method('process');
        $this->submission->expects($this->once())->method('submit')->with('appParamsUpdate');

        (new AfterSave($this->syncManager, $this->submission, $this->populator))->process($this->rateOf('COP'));
    }

    /** CB-CUR-F5-01 — Hook C1 (1-2-3-4-5-7): moneda no habilitada, NotEnabled se convierte en Conflict (409). */
    public function testAfterSaveConMonedaNoHabilitadaEsConflict(): void
    {
        $this->hookDoubles();
        $this->syncManager->method('updateCode')->willThrowException(new NotEnabled('Currency COP is not enabled.'));
        $this->populator->expects($this->never())->method('process');
        $this->submission->expects($this->never())->method('submit');

        $this->expectException(Conflict::class);
        $this->expectExceptionMessage('Currency COP is not enabled.');

        (new AfterSave($this->syncManager, $this->submission, $this->populator))->process($this->rateOf('COP'));
    }

    /** AfterDelete C2: mismo cuerpo que AfterSave (CN-CUR-F5-06). */
    public function testAfterDeleteSincronizaLaMoneda(): void
    {
        $this->hookDoubles();
        $this->syncManager->expects($this->once())->method('updateCode')->with('COP');
        $this->submission->expects($this->once())->method('submit')->with('appParamsUpdate');

        (new AfterDelete($this->syncManager, $this->submission, $this->populator))
            ->process($this->rateOf('COP'), DeleteParams::create());
    }

    /** CB-CUR-F5-01 en AfterDelete: Hook C1. */
    public function testAfterDeleteConMonedaNoHabilitadaEsConflict(): void
    {
        $this->hookDoubles();
        $this->syncManager->method('updateCode')->willThrowException(new NotEnabled('No enabled.'));

        $this->expectException(Conflict::class);

        (new AfterDelete($this->syncManager, $this->submission, $this->populator))
            ->process($this->rateOf('COP'), DeleteParams::create());
    }

    // ---------------------------------------------------------------- SyncManager::updateCode

    private ConfigWriter&MockObject $configWriter;
    private RateEntryProvider&MockObject $entryProvider;
    private DataCache&MockObject $dataCache;
    private SystemConfig&MockObject $systemConfig;
    private EventDispatcher&MockObject $eventDispatcher;
    private EntityManager&MockObject $entityManager;
    private ConfigDataProvider&MockObject $configProvider;

    private function syncManager(bool $useCache = true): SyncManager
    {
        $config = $this->createMock(ConfigDataProvider::class);
        $config->method('getCurrencyRates')->willReturn(Rates::create('USD')->withRate('COP', 0.0003));
        $config->method('getCurrencyList')->willReturn(['USD', 'COP']);
        $this->configProvider = $config;
        $this->entityManager = $this->createMock(EntityManager::class);

        $this->configWriter = $this->createMock(ConfigWriter::class);
        $this->entryProvider = $this->createMock(RateEntryProvider::class);
        $this->dataCache = $this->createMock(DataCache::class);
        $this->systemConfig = $this->createMock(SystemConfig::class);
        $this->eventDispatcher = $this->createMock(EventDispatcher::class);

        $this->systemConfig->method('useCache')->willReturn($useCache);

        return new SyncManager(
            $config,
            $this->entityManager,
            $this->configWriter,
            $this->entryProvider,
            $this->dataCache,
            $this->systemConfig,
            $this->eventDispatcher,
        );
    }

    /** @param array<string, float> $expected */
    private function expectRatesWritten(array $expected): void
    {
        $this->configWriter->expects($this->once())->method('set')
            ->with('currencyRates', $this->callback(function ($rates) use ($expected) {
                $this->assertEqualsCanonicalizing($expected, $rates);

                return true;
            }));
        $this->configWriter->expects($this->once())->method('save');
    }

    /** updateCode C1 (1-2-3-4-6-7-8): hay tasa vigente y se escribe en la configuración (CN-CUR-F5-02 a 06). */
    public function testUpdateCodeEscribeLaTasaVigente(): void
    {
        $sut = $this->syncManager();
        $this->entryProvider->method('getRate')->with('COP')->willReturn('0.00025');
        $this->expectRatesWritten(['USD' => 1.0, 'COP' => 0.00025]);
        $this->eventDispatcher->expects($this->once())->method('dispatch')
            ->with($this->isInstanceOf(CurrencyRateUpdate::class));
        $this->dataCache->expects($this->once())->method('clear')->with('currencyRates');

        $sut->updateCode('COP');
    }

    /**
     * CB-CUR-F5-03 — updateCode C2 (1-2-3-5-6-7-8): sin tasa vigente se escribe 1.0 sin avisar.
     * Documenta DEF-CUR-05 (CN-CUR-F5-07); cuando se corrija (ciclo TDD) esta prueba debe cambiar.
     */
    public function testDefCur05SinTasaVigenteEscribeUno(): void
    {
        $sut = $this->syncManager();
        $this->entryProvider->method('getRate')->willReturn(null);
        $this->expectRatesWritten(['USD' => 1.0, 'COP' => 1.0]);

        $sut->updateCode('COP');
    }

    /** clearCache, rama sin caché del sistema: no se limpia nada. */
    public function testUpdateCodeSinCacheNoLimpiaLaCache(): void
    {
        $sut = $this->syncManager(useCache: false);
        $this->entryProvider->method('getRate')->willReturn('0.00025');
        $this->dataCache->expects($this->never())->method('clear');

        $sut->updateCode('COP');
    }

    /** updateCode propaga NotEnabled de RateEntryProvider, que los hooks convierten en Conflict. */
    public function testUpdateCodePropagaNotEnabled(): void
    {
        $sut = $this->syncManager();
        $this->entryProvider->method('getRate')->willThrowException(new NotEnabled('No enabled.'));
        $this->configWriter->expects($this->never())->method('save');

        $this->expectException(NotEnabled::class);

        $sut->updateCode('COP');
    }

    // ---------------------------------------------------------------- SyncManager::sync / syncCode / refreshCache

    /** Prepara el ORM: transacciones que ejecutan su función, bloqueo y búsqueda de CurrencyRecord por código. */
    private function ormDoubles(?CurrencyRecord $usd, CurrencyRecord $new): void
    {
        $transactions = $this->createMock(TransactionManager::class);
        $transactions->method('run')->willReturnCallback(fn (\Closure $f) => $f());

        $lock = $this->createMock(RDBSelectBuilder::class);
        $lock->method('sth')->willReturnSelf();
        $lock->method('select')->willReturnSelf();
        $lock->method('find')->willReturn($this->createMock(Collection::class));

        $repository = $this->createMock(RDBRepository::class);
        $repository->method('forUpdate')->willReturn($lock);
        $repository->method('getNew')->willReturn($new);
        $repository->method('where')->willReturnCallback(function (array $clause) use ($usd) {
            $builder = $this->createMock(RDBSelectBuilder::class);
            $builder->method('findOne')->willReturn($clause[CurrencyRecord::FIELD_CODE] === 'USD' ? $usd : null);

            return $builder;
        });

        $this->entityManager->method('getTransactionManager')->willReturn($transactions);
        $this->entityManager->method('getRDBRepositoryByClass')->with(CurrencyRecord::class)->willReturn($repository);
    }

    /**
     * syncCode C1 (USD ya tiene registro) y C2 (COP es nueva y se crea), y luego refreshCache
     * (CN-CUR-F5-01: alta de COP desde Administration › Currency).
     */
    public function testSyncActivaLaMonedaExistenteYCreaLaNueva(): void
    {
        $sut = $this->syncManager();

        $usd = $this->createMock(CurrencyRecord::class);
        $usd->expects($this->never())->method('setCode');
        $usd->expects($this->once())->method('setStatus')->with(CurrencyRecord::STATUS_ACTIVE);

        $cop = $this->createMock(CurrencyRecord::class);
        $cop->expects($this->once())->method('setCode')->with('COP');
        $cop->expects($this->once())->method('setStatus')->with(CurrencyRecord::STATUS_ACTIVE);

        $this->ormDoubles($usd, $cop);

        $saved = [];
        $this->entityManager->expects($this->exactly(2))->method('saveEntity')
            ->willReturnCallback(function ($entity) use (&$saved) { $saved[] = $entity; });

        $executor = $this->createMock(QueryExecutor::class);
        $executor->expects($this->once())->method('execute');
        $this->entityManager->method('getQueryExecutor')->willReturn($executor);

        $this->expectRatesWritten(['USD' => 1.0, 'COP' => 0.0003]);
        $this->eventDispatcher->expects($this->once())->method('dispatch');
        $this->dataCache->expects($this->once())->method('clear')->with('currencyRates');

        $sut->sync();

        $this->assertSame([$usd, $cop], $saved);
    }

    /** refreshCache: escribe en la configuración las tasas vigentes; es lo que llama RateService::set() (CUR-F4). */
    public function testRefreshCacheEscribeLasTasasVigentes(): void
    {
        $sut = $this->syncManager();
        $this->ormDoubles(null, $this->createMock(CurrencyRecord::class));

        $this->expectRatesWritten(['USD' => 1.0, 'COP' => 0.0003]);
        $this->eventDispatcher->expects($this->once())->method('dispatch')
            ->with($this->isInstanceOf(CurrencyRateUpdate::class));

        $sut->refreshCache();
    }
}
