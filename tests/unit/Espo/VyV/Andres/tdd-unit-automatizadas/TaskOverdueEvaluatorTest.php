<?php
/**
 * TaskOverdueEvaluatorTest.php
 *
 * Suite de pruebas unitarias automatizadas para TaskOverdueEvaluator
 * aplicando TDD (Red -> Green -> Refactor), FIRST, AAA y Test Doubles.
 *
 * Funcionalidad 4 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Andres;

use Espo\VyV\TaskOverdue\TaskOverdueEvaluator;
use Espo\VyV\TaskOverdue\TaskOverdueResult;
use Espo\VyV\TaskOverdue\TaskRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class TaskOverdueEvaluatorTest extends TestCase
{
    /**
     * @var TaskRepository&MockObject
     */
    private TaskRepository&MockObject $repositoryMock;

    private TaskOverdueEvaluator $sut;

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(TaskRepository::class);
        $this->sut = new TaskOverdueEvaluator($this->repositoryMock);
    }

    /**
     * [Camino P1]: Rechazo cuando taskId es vacio.
     */
    public function testEvaluateFailsWhenTaskIdIsEmpty(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveEvaluation');

        $input = ['taskId' => ''];

        // Act
        $result = $this->sut->evaluate($input);

        // Assert
        $this->assertInstanceOf(TaskOverdueResult::class, $result);
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('taskId es obligatorio', $result->getError());
    }

    /**
     * [Camino P2]: Rechazo cuando status no pertenece al catalogo permitido.
     */
    public function testEvaluateFailsWhenStatusIsInvalid(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveEvaluation');

        $input = [
            'taskId' => 'task-001',
            'status' => 'ArchivedUnknown',
        ];

        // Act
        $result = $this->sut->evaluate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('no valido', $result->getError());
    }

    /**
     * [Camino P3]: Rechazo cuando dueDate no tiene formato de fecha valido.
     */
    public function testEvaluateFailsWhenDueDateIsInvalid(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveEvaluation');

        $input = [
            'taskId'  => 'task-002',
            'status'  => 'Started',
            'dueDate' => 'fecha-invalida',
        ];

        // Act
        $result = $this->sut->evaluate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('dueDate no es valido', $result->getError());
    }

    /**
     * [Camino P4]: Tarea ya finalizada ('Completed') retorna 200 sin mora ni escalado.
     */
    public function testEvaluateReturnsZeroOverdueForCompletedTask(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveEvaluation');

        $input = [
            'taskId'  => 'task-completed',
            'status'  => 'Completed',
            'dueDate' => '2026-11-10 10:00:00',
        ];

        // Act
        $result = $this->sut->evaluate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame(0, $result->getOverdueDays());
        $this->assertSame('None', $result->getSeverity());
        $this->assertFalse($result->isEscalated());
        $this->assertNull($result->getEscalatedToUserId());
    }

    /**
     * [Camino P5]: Tarea en tiempo (evalDate <= dueDate), mora = 0, severidad = None.
     */
    public function testEvaluateReturnsNoneSeverityWhenTaskIsOnTime(): void
    {
        // Arrange
        $taskId = 'task-ontime';
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveEvaluation')
            ->with($taskId, 0, 'None', false, null)
            ->willReturn(true);

        $input = [
            'taskId'                => $taskId,
            'status'                => 'Started',
            'dueDate'               => '2026-11-20 18:00:00',
            'currentEvaluationDate' => '2026-11-18 10:00:00', // Previo a la fecha límite
        ];

        // Act
        $result = $this->sut->evaluate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(0, $result->getOverdueDays());
        $this->assertSame('None', $result->getSeverity());
        $this->assertFalse($result->isEscalated());
    }

    /**
     * [Camino P6 / BVA]: Mora menor (2 dias de mora, prioridad Normal) -> Severidad Minor, sin escalado.
     */
    public function testEvaluateClassifiesMinorOverdueWithoutEscalation(): void
    {
        // Arrange: 2 días de atraso
        $taskId = 'task-minor';
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveEvaluation')
            ->with($taskId, 2, 'Minor', false, null)
            ->willReturn(true);

        $input = [
            'taskId'                => $taskId,
            'status'                => 'Started',
            'priority'              => 'Normal',
            'dueDate'               => '2026-11-10 00:00:00',
            'currentEvaluationDate' => '2026-11-12 12:00:00', // 2.5 días -> 2 días floor
        ];

        // Act
        $result = $this->sut->evaluate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(2, $result->getOverdueDays());
        $this->assertSame('Minor', $result->getSeverity());
        $this->assertFalse($result->isEscalated());
    }

    /**
     * [Camino P7 / BVA]: Mora moderada (5 dias de mora) -> Severidad Moderate, escalado a Supervisor.
     */
    public function testEvaluateEscalatesToSupervisorOnModerateOverdue(): void
    {
        // Arrange: 5 días de retraso
        $taskId = 'task-mod';
        $userId = 'user-agent-01';
        $supervisorId = 'user-supervisor-01';

        $this->repositoryMock
            ->expects($this->once())
            ->method('findSupervisorId')
            ->with($userId)
            ->willReturn($supervisorId);

        $this->repositoryMock
            ->expects($this->once())
            ->method('saveEvaluation')
            ->with($taskId, 5, 'Moderate', true, $supervisorId)
            ->willReturn(true);

        $input = [
            'taskId'                => $taskId,
            'assignedUserId'        => $userId,
            'status'                => 'Started',
            'priority'              => 'Normal',
            'dueDate'               => '2026-11-05 00:00:00',
            'currentEvaluationDate' => '2026-11-10 08:00:00',
        ];

        // Act
        $result = $this->sut->evaluate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(5, $result->getOverdueDays());
        $this->assertSame('Moderate', $result->getSeverity());
        $this->assertTrue($result->isEscalated());
        $this->assertSame($supervisorId, $result->getEscalatedToUserId());
    }

    /**
     * [Camino P8]: Mora moderada con fallback al administrador si no existe supervisor registrado.
     */
    public function testEvaluateAppliesFallbackUserWhenSupervisorNotFound(): void
    {
        // Arrange
        $taskId = 'task-mod-fallback';
        $this->repositoryMock->method('findSupervisorId')->willReturn(null); // Sin supervisor

        $this->repositoryMock
            ->expects($this->once())
            ->method('saveEvaluation')
            ->with($taskId, 4, 'Moderate', true, TaskOverdueEvaluator::DEFAULT_FALLBACK_ESCALATION_USER)
            ->willReturn(true);

        $input = [
            'taskId'                => $taskId,
            'assignedUserId'        => 'isolated-user',
            'status'                => 'Not Started',
            'priority'              => 'Normal',
            'dueDate'               => '2026-11-06 00:00:00',
            'currentEvaluationDate' => '2026-11-10 08:00:00',
        ];

        // Act
        $result = $this->sut->evaluate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(TaskOverdueEvaluator::DEFAULT_FALLBACK_ESCALATION_USER, $result->getEscalatedToUserId());
    }

    /**
     * [Camino P9 / BVA]: Mora critica (> 7 dias) -> Severidad Critical, escalado a Gerente.
     */
    public function testEvaluateEscalatesToManagerOnCriticalOverdue(): void
    {
        // Arrange: 10 días de retraso
        $taskId = 'task-crit';
        $userId = 'user-agent-02';
        $managerId = 'user-manager-general';

        $this->repositoryMock
            ->expects($this->once())
            ->method('findManagerId')
            ->with($userId)
            ->willReturn($managerId);

        $this->repositoryMock
            ->expects($this->once())
            ->method('saveEvaluation')
            ->with($taskId, 10, 'Critical', true, $managerId)
            ->willReturn(true);

        $input = [
            'taskId'                => $taskId,
            'assignedUserId'        => $userId,
            'status'                => 'Started',
            'priority'              => 'Normal',
            'dueDate'               => '2026-11-01 00:00:00',
            'currentEvaluationDate' => '2026-11-11 08:00:00',
        ];

        // Act
        $result = $this->sut->evaluate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(10, $result->getOverdueDays());
        $this->assertSame('Critical', $result->getSeverity());
        $this->assertTrue($result->isEscalated());
        $this->assertSame($managerId, $result->getEscalatedToUserId());
    }

    /**
     * [Camino P10]: Tarea con prioridad Urgent pasa de inmediato a severidad Critical aun con 1 solo dia de mora.
     */
    public function testEvaluateEscalatesUrgentPriorityTaskImmediatelyToCritical(): void
    {
        // Arrange
        $taskId = 'task-urgent-crit';
        $userId = 'user-agent-03';
        $managerId = 'user-manager-03';

        $this->repositoryMock->method('findManagerId')->willReturn($managerId);
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveEvaluation')
            ->with($taskId, 1, 'Critical', true, $managerId)
            ->willReturn(true);

        $input = [
            'taskId'                => $taskId,
            'assignedUserId'        => $userId,
            'status'                => 'Started',
            'priority'              => 'Urgent', // Prioridad urgente activa severidad crítica
            'dueDate'               => '2026-11-13 00:00:00',
            'currentEvaluationDate' => '2026-11-14 08:00:00',
        ];

        // Act
        $result = $this->sut->evaluate($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(1, $result->getOverdueDays());
        $this->assertSame('Critical', $result->getSeverity());
        $this->assertTrue($result->isEscalated());
    }

    /**
     * [Camino P11]: Error 500 cuando el repositorio falla en persistir la evaluacion.
     */
    public function testEvaluateFailsWhenRepositoryFailsToSave(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveEvaluation')
            ->willReturn(false);

        $input = [
            'taskId'                => 'task-err-500',
            'status'                => 'Started',
            'dueDate'               => '2026-11-10 00:00:00',
            'currentEvaluationDate' => '2026-11-11 00:00:00',
        ];

        // Act
        $result = $this->sut->evaluate($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
        $this->assertStringContainsString('Fallo en la persistencia', $result->getError());
    }
}
