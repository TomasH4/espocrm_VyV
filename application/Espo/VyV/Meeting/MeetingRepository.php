<?php
/**
 * MeetingRepository.php
 *
 * Interfaz de repositorio para la persistencia de reuniones.
 * Desacopla la logica de validacion y calculo temporal de la base de datos real.
 *
 * Funcionalidad 4 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\Meeting;

interface MeetingRepository
{
    /**
     * Persiste la entidad reunion con fechas y duracion validadas en BD.
     *
     * @param string|null $name      Asunto o nombre de la reunion.
     * @param string      $dateStart Fecha/hora de inicio.
     * @param string      $dateEnd   Fecha/hora de fin (calculada o provista).
     * @param int         $duration  Duracion en minutos.
     *
     * @return bool True si la persistencia fue exitosa, False en caso de fallo.
     */
    public function saveMeeting(?string $name, string $dateStart, string $dateEnd, int $duration): bool;
}

