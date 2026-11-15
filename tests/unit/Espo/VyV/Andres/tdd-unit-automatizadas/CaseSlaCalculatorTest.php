<?php
/**
 * CaseSlaCalculatorTest.php
 *
 * Suite de pruebas unitarias automatizadas para CaseSlaCalculator
 * aplicando TDD (Red -> Green -> Refactor), FIRST, AAA y Test Doubles.
 *
 * Funcionalidad 2 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Andres;

use Espo\VyV\CaseSla\AccountSlaRepository;
use Espo\VyV\CaseSla\CaseSlaCalculator;
use Espo\VyV\CaseSla\CaseSlaResult;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class CaseSlaCalculatorTest extends TestCase
{
    /**
     * @var AccountSlaRepository&MockObject
     */
    private AccountSlaRepository&MockObject $repositoryMock;

    private CaseSlaCalculator $sut;

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(AccountSlaRepository::class);
        $this->sut = new CaseSlaCalculator($this->repositoryMock);
    }

    /**
     * [Camino P1]: Rechazo cuando caseId es vacio.
     */
    public function testCalculateFailsWhenCaseIdIsEmpty(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveSlaLimits');

        $input = ['caseId' => ''];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertInstanceOf(CaseSlaResult::class, $result);
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('caseId es obligatorio', $result->getError());
    }

    /**
     * [Camino P2]: Rechazo cuando la prioridad no esta en el catalogo.
     */
    public function testCalculateFailsWhenPriorityIsInvalid(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveSlaLimits');

        $input = [
            'caseId'   => 'case-sla-001',
            'priority' => 'SuperCritical', // Inválida
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('Prioridad de caso no valida', $result->getError());
    }

    /**
     * [Camino P3]: Rechazo cuando el formato de fecha createdAt no es valido.
     */
    public function testCalculateFailsWhenCreatedAtDateIsInvalid(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveSlaLimits');

        $input = [
            'caseId'    => 'case-sla-002',
            'createdAt' => 'fecha-invalida-no-parseable',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('createdAt no es valido', $result->getError());
    }

    /**
     * [Camino P4 / Happy Path]: Calculo exitoso con cuenta Platinum y prioridad Urgent (0.5x horas).
     */
    public function testCalculateSucceedsForPlatinumAccountWithUrgentPriority(): void
    {
        // Arrange: Platinum base (1h resp, 4h resol) * Urgent (0.5) = 0.5h resp, 2.0h resol.
        $caseId = 'case-sla-100';
        $accountId = 'acc-plat-01';

        $this->repositoryMock
            ->expects($this->once())
            ->method('findSlaTierByAccountId')
            ->with($this->identicalTo($accountId))
            ->willReturn('Platinum');

        $this->repositoryMock
            ->expects($this->once())
            ->method('saveSlaLimits')
            ->with(
                $this->identicalTo($caseId),
                $this->identicalTo(0.5),
                $this->identicalTo(2.0),
                $this->anything(),
                $this->anything(),
                $this->identicalTo('OnTrack')
            )
            ->willReturn(true);

        $input = [
            'caseId'             => $caseId,
            'accountId'          => $accountId,
            'priority'           => 'Urgent',
            'createdAt'          => '2026-11-16 09:00:00', // Lunes 9:00 AM UTC
            'businessHoursOnly'  => true,
            'currentTime'        => '2026-11-16 09:15:00',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame('Platinum', $result->getSlaTier());
        $this->assertSame(0.5, $result->getTargetResponseHours());
        $this->assertSame(2.0, $result->getTargetResolutionHours());
        $this->assertSame('2026-11-16 09:30:00', $result->getFirstResponseDue());
        $this->assertSame('2026-11-16 11:00:00', $result->getResolutionDue());
        $this->assertSame('OnTrack', $result->getSlaStatus());
    }

    /**
     * [Camino P5 / BVA]: Deteccion de estado 'AtRisk' cuando queda <= 20% del tiempo disponible.
     */
    public function testCalculateDetectsAtRiskStatusWhenTimeIsNearExpiration(): void
    {
        // Arrange: Standard base (8h resp, 48h resol) * Normal (1.0)
        $caseId = 'case-sla-101';
        $accountId = 'acc-gold-02';

        $this->repositoryMock
            ->method('findSlaTierByAccountId')
            ->willReturn('Gold'); // Gold base: 2h resp, 8h resol

        $this->repositoryMock
            ->expects($this->once())
            ->method('saveSlaLimits')
            ->with(
                $this->identicalTo($caseId),
                $this->identicalTo(2.0),
                $this->identicalTo(8.0),
                $this->anything(),
                $this->anything(),
                $this->identicalTo('AtRisk')
            )
            ->willReturn(true);

        // Creado lunes 9:00, resolucion lunes 17:00 (8h). Evaluado lunes 16:00 (queda 1h de 8h = 12.5% <= 20%)
        $input = [
            'caseId'             => $caseId,
            'accountId'          => $accountId,
            'priority'           => 'Normal',
            'createdAt'          => '2026-11-16 09:00:00',
            'businessHoursOnly'  => true,
            'currentTime'        => '2026-11-16 16:00:00',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame('AtRisk', $result->getSlaStatus());
    }

    /**
     * [Camino P6 / BVA]: Deteccion de estado 'Breached' cuando el tiempo actual supero el plazo de resolucion.
     */
    public function testCalculateDetectsBreachedStatusWhenTimeHasExpired(): void
    {
        // Arrange
        $caseId = 'case-sla-102';

        $this->repositoryMock->method('findSlaTierByAccountId')->willReturn('Silver');
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveSlaLimits')
            ->with($this->anything(), $this->anything(), $this->anything(), $this->anything(), $this->anything(), 'Breached')
            ->willReturn(true);

        $input = [
            'caseId'             => $caseId,
            'accountId'          => 'acc-silver-01',
            'priority'           => 'Normal',
            'createdAt'          => '2026-11-16 09:00:00',
            'currentTime'        => '2026-11-20 18:00:00', // Muy posterior a la fecha límite
            'businessHoursOnly'  => true,
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame('Breached', $result->getSlaStatus());
    }

    /**
     * [Camino P7]: Fallback a Standard cuando la cuenta no tiene tier configurado o no existe.
     */
    public function testCalculateDefaultsToStandardTierWhenAccountNotFound(): void
    {
        // Arrange
        $caseId = 'case-sla-103';
        $this->repositoryMock->method('findSlaTierByAccountId')->willReturn(null);
        $this->repositoryMock->method('saveSlaLimits')->willReturn(true);

        $input = [
            'caseId'    => $caseId,
            'accountId' => 'non-existent-account',
            'priority'  => 'Normal',
            'createdAt' => '2026-11-16 09:00:00',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame('Standard', $result->getSlaTier());
        $this->assertSame(8.0, $result->getTargetResponseHours());
        $this->assertSame(48.0, $result->getTargetResolutionHours());
    }

    /**
     * [Camino P8]: Calculo en modalidad horas calendario continuas (businessHoursOnly = false).
     */
    public function testCalculateWithCalendarHoursOnly(): void
    {
        // Arrange
        $caseId = 'case-sla-104';
        $this->repositoryMock->method('findSlaTierByAccountId')->willReturn('Platinum');
        $this->repositoryMock->method('saveSlaLimits')->willReturn(true);

        $input = [
            'caseId'            => $caseId,
            'accountId'         => 'acc-plat-02',
            'priority'          => 'Normal', // 1h resp, 4h resol
            'createdAt'         => '2026-11-14 20:00:00', // Sábado por la noche
            'businessHoursOnly' => false,
            'currentTime'       => '2026-11-14 20:10:00',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame('2026-11-14 21:00:00', $result->getFirstResponseDue());
        $this->assertSame('2026-11-15 00:00:00', $result->getResolutionDue());
    }

    /**
     * [Camino P10]: Error 500 cuando el repositorio falla en guardar los limites.
     */
    public function testCalculateFailsWhenRepositoryFailsToSave(): void
    {
        // Arrange
        $caseId = 'case-sla-105';
        $this->repositoryMock->method('findSlaTierByAccountId')->willReturn('Gold');
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveSlaLimits')
            ->willReturn(false); // Fallo de persistencia

        $input = [
            'caseId'    => $caseId,
            'accountId' => 'acc-gold-03',
            'createdAt' => '2026-11-16 09:00:00',
        ];

        // Act
        $result = $this->sut->calculate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
        $this->assertStringContainsString('Fallo en la persistencia', $result->getError());
    }
}
