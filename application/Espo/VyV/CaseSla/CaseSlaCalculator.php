<?php
/**
 * CaseSlaCalculator.php
 *
 * Servicio de aplicacion para calcular los tiempos limites de atencion (SLA),
 * primera respuesta y resolucion en horas habiles o calendario segun el
 * acuerdo de nivel de servicio del cliente y la prioridad del ticket.
 *
 * Mapeo de Nodos para Analisis Estructural de Caja Blanca (Nodos 1 al 22).
 * Complejidad Ciclomatica de McCabe V(G) = 10 (9 predicados + 1).
 *
 * Funcionalidad 2 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\CaseSla;

use DateTimeImmutable;
use DateTimeZone;
use Exception;

final class CaseSlaCalculator
{
    private const ALLOWED_PRIORITIES = ['Urgent', 'High', 'Normal', 'Low'];

    private const TIER_BASE_HOURS = [
        'Platinum' => ['response' => 1.0, 'resolution' => 4.0],
        'Gold'     => ['response' => 2.0, 'resolution' => 8.0],
        'Silver'   => ['response' => 4.0, 'resolution' => 24.0],
        'Standard' => ['response' => 8.0, 'resolution' => 48.0],
    ];

    private const PRIORITY_MULTIPLIERS = [
        'Urgent' => 0.50,
        'High'   => 0.75,
        'Normal' => 1.00,
        'Low'    => 1.50,
    ];

    public function __construct(
        private readonly AccountSlaRepository $repository
    ) {}

    /**
     * Calcula los plazos de cumplimiento del SLA para un caso.
     *
     * @param array<string,mixed> $data Parametros de calculo.
     *
     * @return CaseSlaResult Value Object con los resultados.
     */
    public function calculate(array $data): CaseSlaResult
    {
        // Nodo 1: Captura y normalizacion de parametros de entrada
        $caseId              = isset($data['caseId']) ? trim((string) $data['caseId']) : '';
        $accountId           = isset($data['accountId']) ? trim((string) $data['accountId']) : '';
        $priority            = isset($data['priority']) ? trim((string) $data['priority']) : 'Normal';
        $createdAtRaw        = isset($data['createdAt']) ? trim((string) $data['createdAt']) : '';
        $businessHoursOnly   = !isset($data['businessHoursOnly']) || (bool) $data['businessHoursOnly'];
        $nowRaw              = isset($data['currentTime']) ? trim((string) $data['currentTime']) : null;

        // Nodo 2: Decision 1 - Verificacion de identificador de caso obligatorio
        if ($caseId === '') {
            // Nodo 3: Retorno error 400 por caseId vacio
            return CaseSlaResult::failure(400, 'El campo caseId es obligatorio para calcular SLA');
        }

        // Nodo 4: Decision 2 - Verificacion de prioridad en catalogo permitido
        if (!in_array($priority, self::ALLOWED_PRIORITIES, true)) {
            // Nodo 5: Retorno error 400 por prioridad no valida
            return CaseSlaResult::failure(400, 'Prioridad de caso no valida. Debe ser Urgent, High, Normal o Low');
        }

        // Nodo 6: Decision 3 - Parsing y validacion de fecha de creacion
        try {
            $createdAt = $createdAtRaw !== ''
                ? new DateTimeImmutable($createdAtRaw, new DateTimeZone('UTC'))
                : new DateTimeImmutable('now', new DateTimeZone('UTC'));
        } catch (Exception) {
            // Nodo 7: Retorno error 400 por fecha invalida
            return CaseSlaResult::failure(400, 'El formato de fecha createdAt no es valido');
        }

        // Nodo 8: Resolucion del SLA Tier a traves del repositorio
        $slaTier = 'Standard';
        if ($accountId !== '') {
            $foundTier = $this->repository->findSlaTierByAccountId($accountId);
            // Nodo 9: Decision 4 - Verificacion de tier obtenido en catalogo
            if ($foundTier !== null && isset(self::TIER_BASE_HOURS[$foundTier])) {
                $slaTier = $foundTier;
            }
        }

        // Nodo 10: Calculo de horas efectivas multiplicadas por severidad
        $baseConfig    = self::TIER_BASE_HOURS[$slaTier];
        $multiplier    = self::PRIORITY_MULTIPLIERS[$priority];
        $respHours     = (float) round($baseConfig['response'] * $multiplier, 2);
        $resolHours    = (float) round($baseConfig['resolution'] * $multiplier, 2);

        // Nodo 11: Decision 5 - Modalidad de calculo: Horas habiles vs Calendario
        if ($businessHoursOnly) {
            // Nodo 12: Calculo sumando horas habiles (Lunes a Viernes 8:00 - 17:00 UTC)
            $firstResponseDue = $this->addBusinessHours($createdAt, $respHours);
            $resolutionDue    = $this->addBusinessHours($createdAt, $resolHours);
        } else {
            // Nodo 13: Calculo calendario directo
            $firstResponseDue = $createdAt->modify('+' . (int) round($respHours * 3600) . ' seconds');
            $resolutionDue    = $createdAt->modify('+' . (int) round($resolHours * 3600) . ' seconds');
        }

        // Nodo 14: Evaluacion del estado de riesgo del SLA
        $now = $nowRaw !== null ? new DateTimeImmutable($nowRaw, new DateTimeZone('UTC')) : $createdAt;
        $totalSeconds = $resolutionDue->getTimestamp() - $createdAt->getTimestamp();
        $remainingSec = $resolutionDue->getTimestamp() - $now->getTimestamp();

        // Nodo 15: Decision 6 - Verificacion de breach (vencido)
        if ($remainingSec <= 0) {
            // Nodo 16: Estado Breached
            $slaStatus = 'Breached';
        } elseif ($totalSeconds > 0 && ($remainingSec / $totalSeconds) <= 0.20) {
            // Nodo 17: Decision 7 - Margen critico menor al 20% -> Estado AtRisk
            $slaStatus = 'AtRisk';
        } else {
            // Nodo 18: Margen seguro -> Estado OnTrack
            $slaStatus = 'OnTrack';
        }

        // Nodo 19: Persistencia de limites calculados en base de datos
        $persisted = $this->repository->saveSlaLimits(
            $caseId,
            $respHours,
            $resolHours,
            $firstResponseDue->format('Y-m-d H:i:s'),
            $resolutionDue->format('Y-m-d H:i:s'),
            $slaStatus
        );

        // Nodo 20: Decision 8 - Verificacion de exito en persistencia
        if (!$persisted) {
            // Nodo 21: Retorno error 500 por fallo de persistencia
            return CaseSlaResult::failure(500, 'Fallo en la persistencia de los limites calculados de SLA');
        }

        // Nodo 22: Retorno exitoso 200 con Value Object
        return CaseSlaResult::success(
            $caseId,
            $slaTier,
            $respHours,
            $resolHours,
            $firstResponseDue->format('Y-m-d H:i:s'),
            $resolutionDue->format('Y-m-d H:i:s'),
            $slaStatus
        );
    }

    /**
     * Agrega horas habiles respetando jornada de 8:00 a 17:00 UTC, Lunes a Viernes.
     */
    private function addBusinessHours(DateTimeImmutable $start, float $hours): DateTimeImmutable
    {
        $current = $start;
        $secondsToAdd = (int) round($hours * 3600);

        while ($secondsToAdd > 0) {
            // Si es fin de semana (6 = Sabado, 7 = Domingo), saltar al siguiente lunes 08:00
            $dow = (int) $current->format('N');
            if ($dow >= 6) {
                $daysToMonday = (8 - $dow);
                $current = $current->modify("+{$daysToMonday} days")->setTime(8, 0, 0);
                continue;
            }

            $hour = (int) $current->format('G');
            if ($hour < 8) {
                $current = $current->setTime(8, 0, 0);
            } elseif ($hour >= 17) {
                // Despues de horario laboral, avanzar al siguiente dia 08:00
                $current = $current->modify('+1 day')->setTime(8, 0, 0);
                continue;
            }

            // Segundos disponibles hoy hasta las 17:00
            $endOfDay = $current->setTime(17, 0, 0);
            $availableSecToday = $endOfDay->getTimestamp() - $current->getTimestamp();

            if ($secondsToAdd <= $availableSecToday) {
                $current = $current->modify("+{$secondsToAdd} seconds");
                $secondsToAdd = 0;
            } else {
                $secondsToAdd -= $availableSecToday;
                $current = $current->modify('+1 day')->setTime(8, 0, 0);
            }
        }

        return $current;
    }
}
