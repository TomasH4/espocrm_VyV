<?php
/**
 * CaseStatusTransitionValidatorTest.php
 *
 * Suite de pruebas unitarias automatizadas para CaseStatusTransitionValidator
 * aplicando la metodologia TDD (Red -> Green -> Refactor).
 *
 * Principios FIRST:
 *   Fast        - Ejecucion en milisegundos con Mocks, sin dependencias de red ni BD.
 *   Independent - Cada prueba crea su propio Mock aislado en setUp().
 *   Repeatable  - Determinista y reproducible en cualquier entorno Docker o CI.
 *   Self-Validating - Solo aserciones binarias de PHPUnit, sin inspeccion manual.
 *   Timely      - Definidas cubriendo todos los caminos independientes del CFG.
 *
 * Patron AAA (Arrange / Act / Assert).
 * Test Doubles: Mock de CaseRepository.
 *
 * Funcionalidad 1 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Andres;

use Espo\VyV\CaseStatus\CaseRepository;
use Espo\VyV\CaseStatus\CaseStatusTransitionResult;
use Espo\VyV\CaseStatus\CaseStatusTransitionValidator;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class CaseStatusTransitionValidatorTest extends TestCase
{
    /**
     * @var CaseRepository&MockObject
     */
    private CaseRepository&MockObject $repositoryMock;

    private CaseStatusTransitionValidator $sut; // System Under Test

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(CaseRepository::class);
        $this->sut = new CaseStatusTransitionValidator($this->repositoryMock);
    }

    // =========================================================================
    // CICLO TDD: RED -> GREEN -> REFACTOR
    //
    //   FASE RED:   testTransitionFailsWhenCaseIdIsEmpty              [CP-CB-01]
    //   FASE GREEN: Implementacion inicial de validacion de caseId.
    //   FASE REFACTOR: Extraccion de CaseStatusTransitionResult como Value Object,
    //                  incorporacion de matriz VALID_TRANSITIONS y cobertura total
    //                  de caminos independientes P1 a P10.
    // =========================================================================

    /**
     * [TDD RED / Camino P1]: Rechazo inmediato cuando caseId es vacio.
     */
    public function testTransitionFailsWhenCaseIdIsEmpty(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('updateStatus');

        $input = [
            'caseId'        => '',
            'currentStatus' => 'New',
            'targetStatus'  => 'Assigned',
        ];

        // Act
        $result = $this->sut->transition($input);

        // Assert
        $this->assertInstanceOf(CaseStatusTransitionResult::class, $result);
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('El identificador caseId es obligatorio', $result->getError());
        $this->assertNull($result->getCaseId());
    }

    /**
     * [Camino P2]: Rechazo cuando el estado destino no existe en el catalogo.
     */
    public function testTransitionFailsWhenTargetStatusIsInvalid(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('updateStatus');

        $input = [
            'caseId'        => 'case-uuid-001',
            'currentStatus' => 'New',
            'targetStatus'  => 'InReview', // No existe en catálogo
        ];

        // Act
        $result = $this->sut->transition($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('Estado destino invalido o no reconocido', $result->getError());
    }

    /**
     * [Camino P3]: Rechazo por transicion redundante (currentStatus === targetStatus).
     */
    public function testTransitionFailsWhenCurrentAndTargetAreIdentical(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('updateStatus');

        $input = [
            'caseId'        => 'case-uuid-002',
            'currentStatus' => 'Assigned',
            'targetStatus'  => 'Assigned',
        ];

        // Act
        $result = $this->sut->transition($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('El estado destino debe ser diferente al actual', $result->getError());
    }

    /**
     * [Camino P4]: Rechazo por estado terminal Rejected (inmutable).
     */
    public function testTransitionFailsWhenCurrentStatusIsRejected(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('updateStatus');

        $input = [
            'caseId'        => 'case-uuid-003',
            'currentStatus' => 'Rejected',
            'targetStatus'  => 'Assigned',
        ];

        // Act
        $result = $this->sut->transition($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
        $this->assertStringContainsString('Rejected es terminal', $result->getError());
    }

    /**
     * [Camino P5 / BVA]: Rechazo de reapertura de caso Closed con justificacion menor a 15 caracteres.
     */
    public function testTransitionFailsWhenReopeningClosedCaseWithShortJustification(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('updateStatus');

        $input = [
            'caseId'             => 'case-uuid-004',
            'currentStatus'      => 'Closed',
            'targetStatus'       => 'Assigned',
            'assignedUserId'     => 'user-tech-01',
            'resolutionComment'  => 'Reabrir caso!', // 13 caracteres (< 15)
        ];

        // Act
        $result = $this->sut->transition($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
        $this->assertStringContainsString('al menos 15 caracteres', $result->getError());
    }

    /**
     * [Camino P5 variante]: Rechazo de reapertura desde Closed hacia un estado diferente a Assigned.
     */
    public function testTransitionFailsWhenReopeningClosedCaseToNonAssignedStatus(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('updateStatus');

        $input = [
            'caseId'             => 'case-uuid-005',
            'currentStatus'      => 'Closed',
            'targetStatus'       => 'Pending',
            'assignedUserId'     => 'user-tech-01',
            'resolutionComment'  => 'Justificacion tecnica detallada valida',
        ];

        // Act
        $result = $this->sut->transition($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
    }

    /**
     * [Camino P7]: Rechazo por transicion no permitida en el flujo general (ej. New -> Closed directo).
     */
    public function testTransitionFailsWhenIllegalTransitionFromNewToClosed(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('updateStatus');

        $input = [
            'caseId'        => 'case-uuid-006',
            'currentStatus' => 'New',
            'targetStatus'  => 'Closed', // Ilegal: no puede cerrarse sin ser asignado
        ];

        // Act
        $result = $this->sut->transition($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
        $this->assertStringContainsString('Transicion ilegal', $result->getError());
    }

    /**
     * [Camino P8]: Rechazo al transicionar a Assigned o Pending sin usuario asignado.
     */
    public function testTransitionFailsWhenAssignedUserIdIsMissing(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('updateStatus');

        $input = [
            'caseId'         => 'case-uuid-007',
            'currentStatus'  => 'New',
            'targetStatus'   => 'Assigned',
            'assignedUserId' => '', // Faltante
        ];

        // Act
        $result = $this->sut->transition($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
        $this->assertStringContainsString('assignedUserId', $result->getError());
    }

    /**
     * [Camino P9]: Error 500 cuando el repositorio retorna fallo de persistencia.
     */
    public function testTransitionFailsWhenRepositoryReturnsFalse(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('updateStatus')
            ->willReturn(false);

        $input = [
            'caseId'         => 'case-uuid-008',
            'currentStatus'  => 'New',
            'targetStatus'   => 'Assigned',
            'assignedUserId' => 'user-support-01',
        ];

        // Act
        $result = $this->sut->transition($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
        $this->assertStringContainsString('Fallo en la persistencia', $result->getError());
    }

    /**
     * [Camino P10 / Happy Path]: Transicion exitosa valida de New a Assigned con persistencia.
     */
    public function testTransitionSucceedsFromNewToAssigned(): void
    {
        // Arrange
        $caseId = 'case-uuid-100';
        $this->repositoryMock
            ->expects($this->once())
            ->method('updateStatus')
            ->with(
                $this->identicalTo($caseId),
                $this->identicalTo('Assigned'),
                $this->identicalTo('user-andres-01'),
                $this->isNull()
            )
            ->willReturn(true);

        $input = [
            'caseId'         => $caseId,
            'currentStatus'  => 'New',
            'targetStatus'   => 'Assigned',
            'assignedUserId' => 'user-andres-01',
        ];

        // Act
        $result = $this->sut->transition($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame($caseId, $result->getCaseId());
        $this->assertSame('New', $result->getPreviousStatus());
        $this->assertSame('Assigned', $result->getNewStatus());
        $this->assertNull($result->getError());
    }

    /**
     * [Camino P10 variante]: Reapertura exitosa desde Closed hacia Assigned con justificacion valida (BVA >= 15 chars).
     */
    public function testReopenClosedCaseSucceedsWithValidJustification(): void
    {
        // Arrange
        $caseId = 'case-uuid-101';
        $justification = 'Reapertura requerida: el cliente reporta recurrencia del error.';
        $this->repositoryMock
            ->expects($this->once())
            ->method('updateStatus')
            ->with(
                $this->identicalTo($caseId),
                $this->identicalTo('Assigned'),
                $this->identicalTo('user-andres-01'),
                $this->identicalTo($justification)
            )
            ->willReturn(true);

        $input = [
            'caseId'             => $caseId,
            'currentStatus'      => 'Closed',
            'targetStatus'       => 'Assigned',
            'assignedUserId'     => 'user-andres-01',
            'resolutionComment'  => $justification,
        ];

        // Act
        $result = $this->sut->transition($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame('Closed', $result->getPreviousStatus());
        $this->assertSame('Assigned', $result->getNewStatus());
    }

    /**
     * Transicion exitosa a Rejected desde New (sin requerir asignacion obligatoria).
     */
    public function testTransitionFromNewToRejectedSucceedsWithoutAssignedUser(): void
    {
        // Arrange
        $caseId = 'case-uuid-102';
        $this->repositoryMock
            ->expects($this->once())
            ->method('updateStatus')
            ->with(
                $this->identicalTo($caseId),
                $this->identicalTo('Rejected'),
                $this->isNull(),
                $this->identicalTo('Ticket duplicado')
            )
            ->willReturn(true);

        $input = [
            'caseId'            => $caseId,
            'currentStatus'     => 'New',
            'targetStatus'      => 'Rejected',
            'resolutionComment' => 'Ticket duplicado',
        ];

        // Act
        $result = $this->sut->transition($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame('Rejected', $result->getNewStatus());
    }
}
