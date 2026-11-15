<?php
/**
 * BlackBoxAndresTest.php
 *
 * Suite formal de pruebas automatizadas de CAJA NEGRA (Black Box Testing).
 * Mapea 1-a-1 los 32 casos de prueba formales diseñados en docs/andres/caja_negra_andres.md:
 *   - Particiones de Equivalencia: Clases Válidas (CE_V) e Inválidas (CE_I)
 *   - Análisis de Valores Límite (BVA): Fronteras min-1, min, min+1, max-1, max, max+1
 *   - Escenarios Exitosos, Alternativos y de Error (Códigos 200, 400, 422)
 *
 * Ejecutable mediante PHPUnit directamente en consola.
 *
 * Integrante Responsable: Andrés Bedoya Cano (VyV 2026-2)
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Andres\BlackBox;

use Espo\VyV\AccountDeduplication\AccountDuplicateDetector;
use Espo\VyV\AccountDeduplication\AccountSearchRepository;
use Espo\VyV\CaseSla\AccountSlaRepository;
use Espo\VyV\CaseSla\CaseSlaCalculator;
use Espo\VyV\CaseStatus\CaseRepository;
use Espo\VyV\CaseStatus\CaseStatusTransitionValidator;
use Espo\VyV\QuoteDiscount\CouponRepository;
use Espo\VyV\QuoteDiscount\QuoteDiscountCalculator;
use Espo\VyV\TaskOverdue\TaskOverdueEvaluator;
use Espo\VyV\TaskOverdue\TaskRepository;
use PHPUnit\Framework\TestCase;

class BlackBoxAndresTest extends TestCase
{
    // =========================================================================
    // FUNCIONALIDAD 1: TRANSICION DE ESTADOS DE CASOS (CP-CN-01 a CP-CN-07)
    // =========================================================================

    /**
     * [CP-CN-01] EP (CE_I1): Rechazo cuando caseId es vacio.
     */
    public function test_CP_CN_01_CaseIdObligatorio_EP_CE_I1(): void
    {
        $repo = $this->createMock(CaseRepository::class);
        $validator = new CaseStatusTransitionValidator($repo);

        $result = $validator->transition([
            'caseId' => '',
            'currentStatus' => 'New',
            'targetStatus' => 'Assigned',
            'assignedUserId' => 'user-001',
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('caseId es obligatorio', (string) $result->getError());
    }

    /**
     * [CP-CN-02] EP (CE_I2): Rechazo por estado destino no existente en catalogo.
     */
    public function test_CP_CN_02_TargetStatusInvalido_EP_CE_I2(): void
    {
        $repo = $this->createMock(CaseRepository::class);
        $validator = new CaseStatusTransitionValidator($repo);

        $result = $validator->transition([
            'caseId' => 'case-100',
            'currentStatus' => 'New',
            'targetStatus' => 'InReview',
            'assignedUserId' => 'user-001',
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('invalido', (string) $result->getError());
    }

    /**
     * [CP-CN-03] EP (CE_I3): Rechazo de transicion redundante (current == target).
     */
    public function test_CP_CN_03_CurrentAndTargetIdentical_EP_CE_I3(): void
    {
        $repo = $this->createMock(CaseRepository::class);
        $validator = new CaseStatusTransitionValidator($repo);

        $result = $validator->transition([
            'caseId' => 'case-100',
            'currentStatus' => 'New',
            'targetStatus' => 'New',
            'assignedUserId' => 'user-001',
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('diferente', (string) $result->getError());
    }

    /**
     * [CP-CN-04] EP (CE_I4): Transicion ilegal prohibida New -> Closed directo.
     */
    public function test_CP_CN_04_IllegalTransitionNewToClosed_EP_CE_I4(): void
    {
        $repo = $this->createMock(CaseRepository::class);
        $validator = new CaseStatusTransitionValidator($repo);

        $result = $validator->transition([
            'caseId' => 'case-100',
            'currentStatus' => 'New',
            'targetStatus' => 'Closed',
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
        $this->assertStringContainsString('no se permite', (string) $result->getError());
    }

    /**
     * [CP-CN-05] BVA (Frontera min - 1): Justificacion de reapertura de 14 caracteres (Rechazo).
     */
    public function test_CP_CN_05_ReopeningJustificationUnder15Chars_BVA(): void
    {
        $repo = $this->createMock(CaseRepository::class);
        $validator = new CaseStatusTransitionValidator($repo);

        $result = $validator->transition([
            'caseId' => 'case-100',
            'currentStatus' => 'Closed',
            'targetStatus' => 'Assigned',
            'assignedUserId' => 'user-001',
            'resolutionComment' => '12345678901234', // 14 caracteres exactos
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
        $this->assertStringContainsString('15 caracteres', (string) $result->getError());
    }

    /**
     * [CP-CN-06] BVA (Frontera min): Justificacion de reapertura de 15 caracteres (Aceptado).
     */
    public function test_CP_CN_06_ReopeningJustificationExact15Chars_BVA(): void
    {
        $repo = $this->createMock(CaseRepository::class);
        $repo->method('updateStatus')->willReturn(true);
        $validator = new CaseStatusTransitionValidator($repo);

        $result = $validator->transition([
            'caseId' => 'case-100',
            'currentStatus' => 'Closed',
            'targetStatus' => 'Assigned',
            'assignedUserId' => 'user-001',
            'resolutionComment' => '123456789012345', // 15 caracteres exactos
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
    }

    /**
     * [CP-CN-07] EP (CE_I7): Transicion a Assigned sin usuario responsable.
     */
    public function test_CP_CN_07_MissingAssignedUserOnAssignedStatus_EP_CE_I7(): void
    {
        $repo = $this->createMock(CaseRepository::class);
        $validator = new CaseStatusTransitionValidator($repo);

        $result = $validator->transition([
            'caseId' => 'case-100',
            'currentStatus' => 'New',
            'targetStatus' => 'Assigned',
            'assignedUserId' => null,
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
        $this->assertStringContainsString('usuario responsable', (string) $result->getError());
    }

    // =========================================================================
    // FUNCIONALIDAD 2: CALCULO DE SLA Y TIEMPO LIMITE (CP-CN-08 a CP-CN-11)
    // =========================================================================

    /**
     * [CP-CN-08] EP (CE_I2): Prioridad fuera de dominio ('MegaUrgent').
     */
    public function test_CP_CN_08_InvalidPriority_EP_CE_I2(): void
    {
        $repo = $this->createMock(AccountSlaRepository::class);
        $calc = new CaseSlaCalculator($repo);

        $result = $calc->calculate([
            'caseId' => 'case-200',
            'priority' => 'MegaUrgent',
            'createdAt' => '2026-11-16 09:00:00',
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('no valida', (string) $result->getError());
    }

    /**
     * [CP-CN-09] EP (CE_V5): Tier Platinum con Prioridad Urgent -> Response 0.5h, Resol 2.0h.
     */
    public function test_CP_CN_09_PlatinumTierUrgentPriority_EP_CE_V5(): void
    {
        $repo = $this->createMock(AccountSlaRepository::class);
        $repo->method('findSlaTierByAccountId')->willReturn('Platinum');
        $repo->method('saveSlaLimits')->willReturn(true);
        $calc = new CaseSlaCalculator($repo);

        $result = $calc->calculate([
            'caseId' => 'case-200',
            'accountId' => 'acc-plat',
            'priority' => 'Urgent',
            'createdAt' => '2026-11-16 09:00:00',
            'currentTime' => '2026-11-16 09:10:00',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame(0.5, $result->getTargetResponseHours());
        $this->assertSame(2.0, $result->getTargetResolutionHours());
    }

    /**
     * [CP-CN-10] BVA (Frontera de Breach): Tiempo actual superior al limite de resolucion.
     */
    public function test_CP_CN_10_SlaBreachedCondition_BVA(): void
    {
        $repo = $this->createMock(AccountSlaRepository::class);
        $repo->method('findSlaTierByAccountId')->willReturn('Standard');
        $repo->method('saveSlaLimits')->willReturn(true);
        $calc = new CaseSlaCalculator($repo);

        $result = $calc->calculate([
            'caseId' => 'case-200',
            'accountId' => 'acc-std',
            'priority' => 'Normal',
            'createdAt' => '2026-11-02 08:00:00',
            'currentTime' => '2026-11-09 18:00:00',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame('Breached', $result->getSlaStatus());
    }

    /**
     * [CP-CN-11] BVA (Frontera AtRisk): Tiempo restante menor o igual al 20% del SLA total.
     */
    public function test_CP_CN_11_SlaAtRiskCondition_BVA(): void
    {
        $repo = $this->createMock(AccountSlaRepository::class);
        $repo->method('findSlaTierByAccountId')->willReturn('Gold');
        $repo->method('saveSlaLimits')->willReturn(true);
        $calc = new CaseSlaCalculator($repo);

        $result = $calc->calculate([
            'caseId' => 'case-200',
            'accountId' => 'acc-gold',
            'priority' => 'Urgent',
            'createdAt' => '2026-11-16 09:00:00',
            'currentTime' => '2026-11-16 12:30:00',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame('AtRisk', $result->getSlaStatus());
    }

    // =========================================================================
    // FUNCIONALIDAD 3: DESCUENTO ESCALONADO EN COTIZACIONES (CP-CN-12 a CP-CN-20)
    // =========================================================================

    /**
     * [CP-CN-12] EP (CE_I2): Subtotal cero o negativo (Rechazo 400).
     */
    public function test_CP_CN_12_ZeroSubtotalRejection_EP_CE_I2(): void
    {
        $repo = $this->createMock(CouponRepository::class);
        $calc = new QuoteDiscountCalculator($repo);

        $result = $calc->calculate([
            'quoteId' => 'quote-300',
            'subtotal' => 0.0,
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('mayor a 0', (string) $result->getError());
    }

    /**
     * [CP-CN-13] BVA (Frontera 1 min - 1): Subtotal $999.99 -> Tramo 1 (0% volumen).
     */
    public function test_CP_CN_13_SubtotalBoundary999_99_Tier1_BVA(): void
    {
        $repo = $this->createMock(CouponRepository::class);
        $repo->method('applyQuoteDiscount')->willReturn(true);
        $calc = new QuoteDiscountCalculator($repo);

        $result = $calc->calculate([
            'quoteId' => 'quote-300',
            'subtotal' => 999.99,
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(0.0, $result->getVolumeDiscountPercent());
    }

    /**
     * [CP-CN-14] BVA (Frontera 1 min): Subtotal $1,000.00 -> Tramo 2 (5% volumen).
     */
    public function test_CP_CN_14_SubtotalBoundary1000_00_Tier2_BVA(): void
    {
        $repo = $this->createMock(CouponRepository::class);
        $repo->method('applyQuoteDiscount')->willReturn(true);
        $calc = new QuoteDiscountCalculator($repo);

        $result = $calc->calculate([
            'quoteId' => 'quote-300',
            'subtotal' => 1000.00,
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(5.0, $result->getVolumeDiscountPercent());
    }

    /**
     * [CP-CN-15] BVA (Frontera 2 min - 1): Subtotal $4,999.99 -> Tramo 2 (5% volumen).
     */
    public function test_CP_CN_15_SubtotalBoundary4999_99_Tier2_BVA(): void
    {
        $repo = $this->createMock(CouponRepository::class);
        $repo->method('applyQuoteDiscount')->willReturn(true);
        $calc = new QuoteDiscountCalculator($repo);

        $result = $calc->calculate([
            'quoteId' => 'quote-300',
            'subtotal' => 4999.99,
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(5.0, $result->getVolumeDiscountPercent());
    }

    /**
     * [CP-CN-16] BVA (Frontera 2 min): Subtotal $5,000.00 -> Tramo 3 (10% volumen).
     */
    public function test_CP_CN_16_SubtotalBoundary5000_00_Tier3_BVA(): void
    {
        $repo = $this->createMock(CouponRepository::class);
        $repo->method('applyQuoteDiscount')->willReturn(true);
        $calc = new QuoteDiscountCalculator($repo);

        $result = $calc->calculate([
            'quoteId' => 'quote-300',
            'subtotal' => 5000.00,
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(10.0, $result->getVolumeDiscountPercent());
    }

    /**
     * [CP-CN-17] BVA (Frontera 3 min): Subtotal $15,000.00 -> Tramo 4 (15% volumen).
     */
    public function test_CP_CN_17_SubtotalBoundary15000_00_Tier4_BVA(): void
    {
        $repo = $this->createMock(CouponRepository::class);
        $repo->method('applyQuoteDiscount')->willReturn(true);
        $calc = new QuoteDiscountCalculator($repo);

        $result = $calc->calculate([
            'quoteId' => 'quote-300',
            'subtotal' => 15000.00,
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(15.0, $result->getVolumeDiscountPercent());
    }

    /**
     * [CP-CN-18] EP (CE_V6): Cliente VIP agrega +5% lealtad.
     */
    public function test_CP_CN_18_VipCustomerExtra5Percent_EP_CE_V6(): void
    {
        $repo = $this->createMock(CouponRepository::class);
        $repo->method('applyQuoteDiscount')->willReturn(true);
        $calc = new QuoteDiscountCalculator($repo);

        $result = $calc->calculate([
            'quoteId' => 'quote-300',
            'subtotal' => 5000.00,
            'isVipCustomer' => true,
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(5.0, $result->getVipDiscountPercent());
        $this->assertSame(15.0, $result->getTotalDiscountPercent());
    }

    /**
     * [CP-CN-19] EP (CE_I6): Cupon inexistente o expirado (Rechazo 400).
     */
    public function test_CP_CN_19_ExpiredOrInvalidCoupon_EP_CE_I6(): void
    {
        $repo = $this->createMock(CouponRepository::class);
        $repo->method('findDiscountByCode')->willReturn(null);
        $calc = new QuoteDiscountCalculator($repo);

        $result = $calc->calculate([
            'quoteId' => 'quote-300',
            'subtotal' => 2000.00,
            'couponCode' => 'EXPIRED_99',
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('invalido o ha expirado', (string) $result->getError());
    }

    /**
     * [CP-CN-20] BVA (Frontera de Cap): Descuento acumulado > 35.0% se limita a 35.0% (isCapped = true).
     */
    public function test_CP_CN_20_TotalDiscountCapAt35Percent_BVA(): void
    {
        $repo = $this->createMock(CouponRepository::class);
        $repo->method('findDiscountByCode')->willReturn(20.0);
        $repo->method('applyQuoteDiscount')->willReturn(true);
        $calc = new QuoteDiscountCalculator($repo);

        $result = $calc->calculate([
            'quoteId' => 'quote-300',
            'subtotal' => 20000.00,
            'isVipCustomer' => true,
            'couponCode' => 'SUPER20',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(35.0, $result->getTotalDiscountPercent());
        $this->assertTrue($result->isCapped());
    }

    // =========================================================================
    // FUNCIONALIDAD 4: EVALUACION DE TAREAS VENCIDAS (CP-CN-21 a CP-CN-26)
    // =========================================================================

    /**
     * [CP-CN-21] EP (CE_V2): Tarea con estado 'Completed' nunca esta en mora (Severidad None).
     */
    public function test_CP_CN_21_CompletedTaskNeverOverdue_EP_CE_V2(): void
    {
        $repo = $this->createMock(TaskRepository::class);
        $eval = new TaskOverdueEvaluator($repo);

        $result = $eval->evaluate([
            'taskId' => 'task-400',
            'dueDate' => '2026-11-01 10:00:00',
            'status' => 'Completed',
            'currentEvaluationDate' => '2026-11-15 10:00:00',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(0, $result->getOverdueDays());
        $this->assertSame('None', $result->getSeverity());
        $this->assertFalse($result->isEscalated());
    }

    /**
     * [CP-CN-22] BVA (Frontera 2 dias): Mora de 2 dias y prioridad Normal -> Severidad Minor, sin escalado.
     */
    public function test_CP_CN_22_Overdue2DaysMinorSeverityNoEscalation_BVA(): void
    {
        $repo = $this->createMock(TaskRepository::class);
        $repo->method('saveEvaluation')->willReturn(true);
        $eval = new TaskOverdueEvaluator($repo);

        $result = $eval->evaluate([
            'taskId' => 'task-400',
            'dueDate' => '2026-11-13 10:00:00',
            'status' => 'Started',
            'priority' => 'Normal',
            'currentEvaluationDate' => '2026-11-15 10:00:00',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame('Minor', $result->getSeverity());
        $this->assertFalse($result->isEscalated());
    }

    /**
     * [CP-CN-23] BVA (Frontera 3 dias): Mora de 3 dias -> Severidad Moderate y escalado a Supervisor.
     */
    public function test_CP_CN_23_Overdue3DaysModerateSeveritySupervisorEscalation_BVA(): void
    {
        $repo = $this->createMock(TaskRepository::class);
        $repo->method('findSupervisorId')->willReturn('sup-007');
        $repo->method('saveEvaluation')->willReturn(true);
        $eval = new TaskOverdueEvaluator($repo);

        $result = $eval->evaluate([
            'taskId' => 'task-400',
            'assignedUserId' => 'user-100',
            'dueDate' => '2026-11-12 10:00:00',
            'status' => 'Started',
            'priority' => 'Normal',
            'currentEvaluationDate' => '2026-11-15 10:00:00',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame('Moderate', $result->getSeverity());
        $this->assertTrue($result->isEscalated());
        $this->assertSame('sup-007', $result->getEscalatedToUserId());
    }

    /**
     * [CP-CN-24] BVA (Frontera 7 dias): Mora de 7 dias -> Severidad Moderate (Supervisor).
     */
    public function test_CP_CN_24_Overdue7DaysModerateSeveritySupervisorEscalation_BVA(): void
    {
        $repo = $this->createMock(TaskRepository::class);
        $repo->method('findSupervisorId')->willReturn('sup-007');
        $repo->method('saveEvaluation')->willReturn(true);
        $eval = new TaskOverdueEvaluator($repo);

        $result = $eval->evaluate([
            'taskId' => 'task-400',
            'assignedUserId' => 'user-100',
            'dueDate' => '2026-11-08 10:00:00',
            'status' => 'Started',
            'priority' => 'Normal',
            'currentEvaluationDate' => '2026-11-15 10:00:00',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame('Moderate', $result->getSeverity());
        $this->assertTrue($result->isEscalated());
    }

    /**
     * [CP-CN-25] BVA (Frontera 8 dias): Mora de 8 dias -> Severidad Critical (Escalado a Gerente).
     */
    public function test_CP_CN_25_Overdue8DaysCriticalSeverityManagerEscalation_BVA(): void
    {
        $repo = $this->createMock(TaskRepository::class);
        $repo->method('findManagerId')->willReturn('mgr-999');
        $repo->method('saveEvaluation')->willReturn(true);
        $eval = new TaskOverdueEvaluator($repo);

        $result = $eval->evaluate([
            'taskId' => 'task-400',
            'assignedUserId' => 'user-100',
            'dueDate' => '2026-11-07 10:00:00',
            'status' => 'Started',
            'priority' => 'Normal',
            'currentEvaluationDate' => '2026-11-15 10:00:00',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame('Critical', $result->getSeverity());
        $this->assertTrue($result->isEscalated());
        $this->assertSame('mgr-999', $result->getEscalatedToUserId());
    }

    /**
     * [CP-CN-26] EP (Prioridad Urgent): Tarea urgente en mora escala de inmediato a Critical.
     */
    public function test_CP_CN_26_Overdue1DayUrgentTaskCriticalEscalation_EP(): void
    {
        $repo = $this->createMock(TaskRepository::class);
        $repo->method('findManagerId')->willReturn('mgr-999');
        $repo->method('saveEvaluation')->willReturn(true);
        $eval = new TaskOverdueEvaluator($repo);

        $result = $eval->evaluate([
            'taskId' => 'task-400',
            'assignedUserId' => 'user-100',
            'dueDate' => '2026-11-14 10:00:00',
            'status' => 'Started',
            'priority' => 'Urgent',
            'currentEvaluationDate' => '2026-11-15 10:00:00',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame('Critical', $result->getSeverity());
        $this->assertTrue($result->isEscalated());
    }

    // =========================================================================
    // FUNCIONALIDAD 5: DETECCION DE CUENTAS DUPLICADAS (CP-CN-27 a CP-CN-32)
    // =========================================================================

    /**
     * [CP-CN-27] EP (CE_I1): Nombre de cuenta corporativa vacio (Rechazo 400).
     */
    public function test_CP_CN_27_EmptyAccountNameRejection_EP_CE_I1(): void
    {
        $repo = $this->createMock(AccountSearchRepository::class);
        $detector = new AccountDuplicateDetector($repo);

        $result = $detector->detect([
            'name' => '   ',
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('name de la cuenta es obligatorio', (string) $result->getError());
    }

    /**
     * [CP-CN-28] EP (CE_V2): Coincidencia exacta de NIT -> Score 90, MatchLevel High.
     */
    public function test_CP_CN_28_ExactTaxIdDuplicateMatch_EP_CE_V2(): void
    {
        $repo = $this->createMock(AccountSearchRepository::class);
        $repo->method('findBySicCode')->willReturn([
            'id' => 'acc-existente-01',
            'name' => 'Empresa Matriz S.A.',
        ]);
        $repo->method('findCandidatesByName')->willReturn([]);
        $detector = new AccountDuplicateDetector($repo);

        $result = $detector->detect([
            'name' => 'Nueva Razon Social',
            'sicCode' => '900.123.456-1',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertTrue($result->isDuplicate());
        $this->assertSame(90, $result->getMatchScore());
        $this->assertSame('High', $result->getMatchLevel());
    }

    /**
     * [CP-CN-29] EP (Sufijos Juridicos): 'Acme Corp S.A.S.' vs 'Acme Corp' -> Score 70, High.
     */
    public function test_CP_CN_29_LegalSuffixNormalization_EP(): void
    {
        $repo = $this->createMock(AccountSearchRepository::class);
        $repo->method('findCandidatesByName')->willReturn([
            ['id' => 'acc-002', 'name' => 'Acme Corp'],
        ]);
        $detector = new AccountDuplicateDetector($repo);

        $result = $detector->detect([
            'name' => 'Acme Corp S.A.S.',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertTrue($result->isDuplicate());
        $this->assertSame(70, $result->getMatchScore());
        $this->assertSame('High', $result->getMatchLevel());
    }

    /**
     * [CP-CN-30] EP (Levenshtein): 'Soluciones Globale' vs 'Soluciones Globales' (>=80% -> Score 40 Moderate).
     */
    public function test_CP_CN_30_LevenshteinFuzzyMatchModerate_EP(): void
    {
        $repo = $this->createMock(AccountSearchRepository::class);
        $repo->method('findCandidatesByName')->willReturn([
            ['id' => 'acc-003', 'name' => 'Soluciones Globales'],
        ]);
        $detector = new AccountDuplicateDetector($repo);

        $result = $detector->detect([
            'name' => 'Soluciones Globale',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertTrue($result->isDuplicate());
        $this->assertSame(40, $result->getMatchScore());
        $this->assertSame('Moderate', $result->getMatchLevel());
    }

    /**
     * [CP-CN-31] EP (Dominio Web): Coincidencia por dominio web corporativo (+30 pts).
     */
    public function test_CP_CN_31_CorporateDomainMatch_EP(): void
    {
        $repo = $this->createMock(AccountSearchRepository::class);
        $repo->method('findCandidatesByName')->willReturn([]);
        $repo->method('findByDomain')->willReturn([
            'id' => 'acc-004',
            'name' => 'Acme Holding',
        ]);
        $detector = new AccountDuplicateDetector($repo);

        $result = $detector->detect([
            'name' => 'Compania Diferente',
            'website' => 'https://www.acme.co/nosotros',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertFalse($result->isDuplicate());
        $this->assertSame(30, $result->getMatchScore());
        $this->assertSame('Low', $result->getMatchLevel());
    }

    /**
     * [CP-CN-32] EP (Sin Coincidencia): Razon social unica, sin NIT ni dominio coincidente.
     */
    public function test_CP_CN_32_UniqueAccountNoDuplicate_EP(): void
    {
        $repo = $this->createMock(AccountSearchRepository::class);
        $repo->method('findCandidatesByName')->willReturn([]);
        $detector = new AccountDuplicateDetector($repo);

        $result = $detector->detect([
            'name' => 'Empresa Completamente Nueva 2026',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertFalse($result->isDuplicate());
        $this->assertSame(0, $result->getMatchScore());
        $this->assertSame('Low', $result->getMatchLevel());
    }
}
