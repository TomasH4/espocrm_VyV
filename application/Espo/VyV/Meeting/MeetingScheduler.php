<?php
/**
 * MeetingScheduler.php
 *
 * Servicio de aplicacion encargado de validar la consistencia temporal,
 * calcular duraciones y agendar reuniones en el CRM.
 *
 * Corresponde a los Nodos 1 al 16 definidos en:
 *   caja_blanca/F4/F4_meeting_scheduling.md
 *
 * Complejidad Ciclomatica V(G) = 6 (5 predicados de decision + 1).
 *
 * Funcionalidad 4 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\Meeting;

final class MeetingScheduler
{
    public function __construct(
        private readonly MeetingRepository $repository
    ) {}

    /**
     * Agenda una reunion aplicando validaciones de consistencia temporal y calculos automaticos.
     *
     * @param array<string,mixed> $data Parametros de entrada ($name, $dateStart, $dateEnd, $duration).
     *
     * @return MeetingScheduleResult Value Object con el resultado de la operacion.
     */
    public function schedule(array $data): MeetingScheduleResult
    {
        // Nodo 1: Inicio y captura de parametros de entrada ($name, $dateStart, $dateEnd, $duration)
        $rawName      = $data['name'] ?? null;
        $rawDateStart = $data['dateStart'] ?? null;
        $rawDateEnd   = $data['dateEnd'] ?? null;
        $duration     = isset($data['duration']) ? (int) $data['duration'] : null;

        $name      = $rawName !== null ? trim((string) $rawName) : null;
        $dateStart = $rawDateStart !== null ? trim((string) $rawDateStart) : null;
        $dateEnd   = $rawDateEnd !== null && trim((string) $rawDateEnd) !== '' ? trim((string) $rawDateEnd) : null;

        // Nodo 2: Decision 1 - Validacion de campo obligatorio (fecha de inicio requerida)
        if (empty($dateStart)) {
            // Nodo 3: Retorno de error por fecha de inicio ausente
            return MeetingScheduleResult::failure(400, 'El campo dateStart es obligatorio');
        }

        $tsStart = strtotime($dateStart);

        // Nodo 4: Decision 2 - Verificacion de presencia de fecha de fin
        if (!empty($dateEnd)) {
            $tsEnd = strtotime($dateEnd);

            // Nodo 5: Decision 3 - Validacion de consistencia temporal (¿dateEnd estrictamente mayor a dateStart?)
            if ($tsEnd <= $tsStart) {
                // Nodo 6: Retorno de error por inconsistencia temporal (fecha fin menor o igual a inicio)
                return MeetingScheduleResult::failure(422, 'La fecha de fin debe ser posterior a la fecha de inicio');
            }

            // Nodo 7: Calculo automatico de duracion en minutos a partir de las fechas
            $duration = (int) (($tsEnd - $tsStart) / 60);
            $finalEnd = $dateEnd;
        } else {
            // Nodo 8: Decision 4 - Verificacion de duracion especificada por el usuario
            if (empty($duration) || $duration <= 0) {
                // Nodo 9: Asignacion de duracion estandar por defecto (60 minutos)
                $duration = 60;
            } else {
                // Nodo 10: Conservacion de la duracion especificada por el usuario
                $duration = (int) $duration;
            }

            // Nodo 11: Calculo automatico de la fecha de fin a partir de dateStart y duration
            $finalEnd = date('Y-m-d H:i:s', $tsStart + ($duration * 60));
        }

        // Nodo 12: Invocacion del servicio de persistencia en base de datos
        $isSaved = $this->repository->saveMeeting($name, $dateStart, $finalEnd, $duration);

        // Nodo 13: Decision 5 - Verificacion de persistencia exitosa en base de datos
        if (!$isSaved) {
            // Nodo 14: Retorno de error por fallo de persistencia en base de datos
            return MeetingScheduleResult::failure(500, 'Fallo en la persistencia de base de datos');
        }

        // Nodo 15: Retorno exitoso de la reunion agendada con consistencia validada y calculada
        return MeetingScheduleResult::success(201, $name, $dateStart, $finalEnd, $duration);

        // Nodo 16: Fin del metodo
    }
}

