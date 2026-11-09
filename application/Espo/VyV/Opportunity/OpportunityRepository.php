<?php
/**
 * OpportunityRepository.php
 *
 * Interfaz de repositorio para la persistencia de probabilidades
 * en Oportunidades. Define el contrato para desacoplar la logica de
 * negocio de la base de datos real.
 *
 * Funcionalidad 2 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\Opportunity;

interface OpportunityRepository
{
    /**
     * Persiste la probabilidad calculada para una oportunidad en BD.
     *
     * @param string|null $id          Identificador de la oportunidad.
     * @param int         $probability Porcentaje de probabilidad (0 a 100).
     *
     * @return bool True si la persistencia fue exitosa, False en caso contrario.
     */
    public function saveProbability(?string $id, int $probability): bool;
}

