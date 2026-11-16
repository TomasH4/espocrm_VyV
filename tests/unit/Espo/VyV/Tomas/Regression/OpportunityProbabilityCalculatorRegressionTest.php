<?php
/**
 * OpportunityProbabilityCalculatorRegressionTest.php
 *
 * Suite de pruebas unitarias de REGRESION para OpportunityProbabilityCalculator.
 * Protege la inmutabilidad de la matriz de negocio (etapa -> probabilidad),
 * la sensibilidad de mayusculas y el manejo de identificadores nulos.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Regression;

use Espo\VyV\Opportunity\OpportunityProbabilityCalculator;
use Espo\VyV\Opportunity\OpportunityProbabilityResult;
use Espo\VyV\Opportunity\OpportunityRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class OpportunityProbabilityCalculatorRegressionTest extends TestCase
{
    private OpportunityRepository&MockObject $repositoryMock;
    private OpportunityProbabilityCalculator $sut;

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(OpportunityRepository::class);
        $this->sut = new OpportunityProbabilityCalculator($this->repositoryMock);
    }

    /**
     * REG-O1: Invariante critico de la Matriz de Negocio: cada etapa mapea a su probabilidad fija.
     */
    #[DataProvider('stageProbabilityMatrixProvider')]
    public function testMatrixInvariantsStageToProbabilityMapping(string $stage, int $expectedProbability): void
    {
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveProbability')
            ->with($this->identicalTo('opt-regression'), $this->identicalTo($expectedProbability))
            ->willReturn(true);

        $result = $this->sut->calculate([
            'id'    => 'opt-regression',
            'stage' => $stage,
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame($stage, $result->getStage());
        $this->assertSame($expectedProbability, $result->getProbability());
        $this->assertNull($result->getError());
    }

    public static function stageProbabilityMatrixProvider(): array
    {
        return [
            'Etapa Prospecting debe ser 10%' => ['Prospecting', 10],
            'Etapa Proposal debe ser 50%'    => ['Proposal', 50],
            'Etapa Closed Won debe ser 100%' => ['Closed Won', 100],
            'Etapa Closed Lost debe ser 0%'  => ['Closed Lost', 0],
        ];
    }

    /**
     * REG-O2: Sensibilidad estricta de mayusculas y etapas mal escritas son rechazadas con 422.
     */
    #[DataProvider('invalidOrMispelledStagesProvider')]
    public function testCalculatorRejectsInvalidOrMispelledStagesWith422(string $invalidStage): void
    {
        $this->repositoryMock->expects($this->never())->method('saveProbability');

        $result = $this->sut->calculate([
            'id'    => 'opt-1',
            'stage' => $invalidStage,
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
        $this->assertSame('Etapa de oportunidad no valida', $result->getError());
        $this->assertNull($result->getProbability());
    }

    public static function invalidOrMispelledStagesProvider(): array
    {
        return [
            ['prospecting'],
            ['PROSPECTING'],
            ['closed won'],
            ['CLOSED WON'],
            ['ProposalStage'],
            ['Unknown'],
            ['Negotiating'],
        ];
    }

    /**
     * REG-O3: Invariante del Value Object OpportunityProbabilityResult.
     */
    public function testResultObjectContract(): void
    {
        // En exito
        $success = OpportunityProbabilityResult::success(200, 'Proposal', 50);
        $this->assertTrue($success->isSuccess());
        $this->assertSame(200, $success->getCode());
        $this->assertSame('Proposal', $success->getStage());
        $this->assertSame(50, $success->getProbability());
        $this->assertNull($success->getError());

        // En fallo 400
        $failure = OpportunityProbabilityResult::failure(400, 'Stage obligatorio');
        $this->assertFalse($failure->isSuccess());
        $this->assertSame(400, $failure->getCode());
        $this->assertSame('Stage obligatorio', $failure->getError());
        $this->assertNull($failure->getStage());
        $this->assertNull($failure->getProbability());
    }

    /**
     * REG-O4: Soporte adecuado cuando id es nulo o cadena vacia (creacion de nueva oportunidad).
     */
    public function testCalculatorHandlesNullOrEmptyOpportunityId(): void
    {
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveProbability')
            ->with($this->isNull(), $this->identicalTo(10))
            ->willReturn(true);

        $result = $this->sut->calculate([
            'stage' => 'Prospecting',
            // id omitido intencionalmente
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(10, $result->getProbability());
    }

    /**
     * REG-O5: Manejo consistente de error 500 ante fallo de persistencia en repositorio.
     */
    public function testCalculatorReturns500WhenPersistenceFails(): void
    {
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveProbability')
            ->willReturn(false);

        $result = $this->sut->calculate([
            'id'    => 'opt-fail',
            'stage' => 'Proposal',
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
        $this->assertSame('Fallo en la persistencia de base de datos', $result->getError());
    }
}

