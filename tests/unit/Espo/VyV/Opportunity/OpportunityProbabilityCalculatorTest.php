<?php
/**
 * OpportunityProbabilityCalculatorTest.php
 *
 * Suite de pruebas unitarias automatizadas para OpportunityProbabilityCalculator
 * aplicando la metodologia TDD (Red -> Green -> Refactor).
 *
 * Funcionalidad 2: Calculo automatico de probabilidad en Oportunidades
 *
 * Principios FIRST:
 *   Fast        - Ejecucion en milisegundos sin acceso a red ni BD real.
 *   Independent - Cada prueba utiliza su propio mock del repositorio.
 *   Repeatable  - Resultados deterministicos e identicos en cualquier entorno.
 *   Self-Validating - Resultado binario PASS/FAIL automatico sin verificacion manual.
 *   Timely      - Pruebas disenadas e implementadas con anterioridad al codigo productivo.
 *
 * Patron AAA (Arrange / Act / Assert).
 * Aserciones fluidas encadenadas.
 * Test Doubles: Mock de OpportunityRepository.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Opportunity;

use Espo\VyV\Opportunity\OpportunityProbabilityCalculator;
use Espo\VyV\Opportunity\OpportunityProbabilityResult;
use Espo\VyV\Opportunity\OpportunityRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class OpportunityProbabilityCalculatorTest extends TestCase
{
    /**
     * @var OpportunityRepository&MockObject
     * Test Double - Mock del repositorio para aislar la persistencia en BD.
     */
    private OpportunityRepository&MockObject $repositoryMock;

    private OpportunityProbabilityCalculator $sut; // System Under Test

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(OpportunityRepository::class);
        $this->sut = new OpportunityProbabilityCalculator($this->repositoryMock);
    }

    // =========================================================================
    // CAMINO C1: CP-CB-01
    // Nodo 2 -> No -> Nodo 3
    // Rechazo inmediato por etapa (stage) vacia o nula.
    // =========================================================================

    /**
     * [TDD RED] Verifica que si el campo stage es una cadena vacia,
     * se retorne un error 400 y nunca se invoque al repositorio.
     */
    public function testCalculateProbabilityFailsWhenStageIsEmpty(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->never()) // El repositorio nunca debe llamarse
            ->method('saveProbability');

        $input = [
            'id'    => 'opt-100',
            'stage' => '',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert (Aserciones fluidas)
        $this->assertInstanceOf(OpportunityProbabilityResult::class, $result);
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('El campo stage es obligatorio', $result->getError());
        $this->assertNull($result->getProbability());
    }

    /**
     * Variante: clave stage ausente en el array de entrada.
     */
    public function testCalculateProbabilityFailsWhenStageKeyIsMissing(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveProbability');
        $input = ['id' => 'opt-100'];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('El campo stage es obligatorio', $result->getError());
    }

    // =========================================================================
    // CAMINO C2: CP-CB-02
    // Nodo 2->Si -> Nodo 4->Si -> Nodo 5 -> Nodo 13 -> Nodo 14->Si -> Nodo 16
    // Etapa 'Prospecting' -> Asignacion automatica de probabilidad 10%.
    // =========================================================================

    public function testCalculateProbabilityAssigns10PercentForProspecting(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveProbability')
            ->with(
                $this->identicalTo('opt-101'),
                $this->identicalTo(10)
            )
            ->willReturn(true);

        $input = [
            'id'    => 'opt-101',
            'stage' => 'Prospecting',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame('Prospecting', $result->getStage());
        $this->assertSame(10, $result->getProbability());
        $this->assertNull($result->getError());
    }

    // =========================================================================
    // CAMINO C3: CP-CB-03
    // Nodo 2->Si -> Nodo 4->No -> Nodo 6->Si -> Nodo 7 -> Nodo 13 -> Nodo 14->Si -> Nodo 16
    // Etapa 'Proposal' -> Asignacion automatica de probabilidad 50%.
    // =========================================================================

    public function testCalculateProbabilityAssigns50PercentForProposal(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveProbability')
            ->with(
                $this->identicalTo('opt-102'),
                $this->identicalTo(50)
            )
            ->willReturn(true);

        $input = [
            'id'    => 'opt-102',
            'stage' => 'Proposal',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame('Proposal', $result->getStage());
        $this->assertSame(50, $result->getProbability());
    }

    // =========================================================================
    // CAMINO C4: CP-CB-04
    // Nodo 2->Si -> Nodo 4->No -> Nodo 6->No -> Nodo 8->Si -> Nodo 9 -> Nodo 13 -> Nodo 14->Si -> Nodo 16
    // Etapa 'Closed Won' -> Asignacion automatica de probabilidad 100%.
    // =========================================================================

    public function testCalculateProbabilityAssigns100PercentForClosedWon(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveProbability')
            ->with(
                $this->identicalTo('opt-103'),
                $this->identicalTo(100)
            )
            ->willReturn(true);

        $input = [
            'id'    => 'opt-103',
            'stage' => 'Closed Won',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame('Closed Won', $result->getStage());
        $this->assertSame(100, $result->getProbability());
    }

    // =========================================================================
    // CAMINO C5: CP-CB-05
    // Nodo 2->Si -> Nodo 4->No -> Nodo 6->No -> Nodo 8->No -> Nodo 10->Si -> Nodo 11 -> Nodo 13 -> Nodo 14->Si -> Nodo 16
    // Etapa 'Closed Lost' -> Asignacion automatica de probabilidad 0%.
    // =========================================================================

    public function testCalculateProbabilityAssigns0PercentForClosedLost(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveProbability')
            ->with(
                $this->identicalTo('opt-104'),
                $this->identicalTo(0)
            )
            ->willReturn(true);

        $input = [
            'id'    => 'opt-104',
            'stage' => 'Closed Lost',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame('Closed Lost', $result->getStage());
        $this->assertSame(0, $result->getProbability());
    }

    // =========================================================================
    // CAMINO C6: CP-CB-06
    // Nodo 2->Si -> Nodo 4->No -> Nodo 6->No -> Nodo 8->No -> Nodo 10->No -> Nodo 12
    // Etapa no valida o no contemplada en la regla de negocio -> Error 422.
    // =========================================================================

    public function testCalculateProbabilityFailsForInvalidOrUnknownStage(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveProbability');

        $input = [
            'id'    => 'opt-105',
            'stage' => 'EnRevision', // Etapa desconocida
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
        $this->assertSame('Etapa de oportunidad no valida', $result->getError());
        $this->assertNull($result->getProbability());
    }

    /**
     * Variante: etapa en minusculas ('prospecting') debe ser rechazada
     * por no coincidir exactamente con el catalogo oficial de EspoCRM.
     */
    public function testCalculateProbabilityRejectsLowercaseStage(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveProbability');
        $input = ['id' => 'opt-105', 'stage' => 'prospecting'];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
    }

    // =========================================================================
    // CAMINO C7: CP-CB-07
    // Nodo 2->Si -> Nodo 4->Si -> Nodo 5 -> Nodo 13 -> Nodo 14->No -> Nodo 15
    // Etapa valida provista, pero ocurre fallo de persistencia en base de datos.
    // =========================================================================

    public function testCalculateProbabilityFailsWhenRepositoryPersistenceFails(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveProbability')
            ->willReturn(false); // Simulacion de fallo en base de datos

        $input = [
            'id'    => 'opt-106',
            'stage' => 'Prospecting',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
        $this->assertSame('Fallo en la persistencia de base de datos', $result->getError());
        $this->assertNull($result->getProbability());
    }

    // =========================================================================
    // PRUEBAS ADICIONALES: Sanitizacion y Valores de Borde
    // =========================================================================

    /**
     * Verifica que los espacios en blanco antes o despues del nombre de etapa
     * sean removidos mediante trim antes de evaluar la regla de negocio.
     */
    public function testCalculateProbabilityHandlesWhitespaceInStage(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveProbability')
            ->with(
                $this->identicalTo('opt-107'),
                $this->identicalTo(50)
            )
            ->willReturn(true);

        $input = [
            'id'    => 'opt-107',
            'stage' => '  Proposal  ',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame('Proposal', $result->getStage());
        $this->assertSame(50, $result->getProbability());
    }

    /**
     * Verifica que la omision de ID opcional se maneje correctamente
     * pasando null o string vacio al repositorio.
     */
    public function testCalculateProbabilityHandlesNullOpportunityId(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveProbability')
            ->with(
                $this->isNull(),
                $this->identicalTo(100)
            )
            ->willReturn(true);

        $input = [
            'stage' => 'Closed Won',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(100, $result->getProbability());
    }
}

