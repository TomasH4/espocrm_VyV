<?php
/**
 * OpportunityProbabilityCalculator.php
 *
 * Servicio de aplicacion encargado de calcular y persistir la probabilidad
 * comercial de una oportunidad segun su etapa (Stage).
 *
 * Corresponde a los Nodos 1 al 17 definidos en:
 *   caja_blanca/F2/F2_opportunity_probability.md
 *
 * Complejidad Ciclomatica V(G) = 7 (6 predicados de decision + 1).
 *
 * Funcionalidad 2 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\Opportunity;

final class OpportunityProbabilityCalculator
{
    public function __construct(
        private readonly OpportunityRepository $repository
    ) {}

    /**
     * Calcula y persiste la probabilidad comercial de una oportunidad segun su etapa.
     *
     * @param array<string,mixed> $data Parametros de entrada ($stage, $id).
     *
     * @return OpportunityProbabilityResult Value Object con el resultado de la operacion.
     */
    public function calculate(array $data): OpportunityProbabilityResult
    {
        // Nodo 1: Inicio y captura de la etapa e identificador de la oportunidad
        $rawStage = $data['stage'] ?? null;
        $id       = isset($data['id']) && $data['id'] !== '' ? (string) $data['id'] : null;

        $stage = $rawStage !== null ? trim((string) $rawStage) : null;

        // Nodo 2: Decision 1 - Validacion de campo obligatorio (etapa obligatoria)
        if (empty($stage)) {
            // Nodo 3: Retorno de error por etapa vacia o no provista
            return OpportunityProbabilityResult::failure(400, 'El campo stage es obligatorio');
        }

        // Nodo 4: Decision 2 - Evaluacion si la etapa es 'Prospecting'
        if ($stage === 'Prospecting') {
            // Nodo 5: Asignacion de probabilidad del 10% para Prospecting
            $probability = 10;
        } else {
            // Nodo 6: Decision 3 - Evaluacion si la etapa es 'Proposal'
            if ($stage === 'Proposal') {
                // Nodo 7: Asignacion de probabilidad del 50% para Proposal
                $probability = 50;
            } else {
                // Nodo 8: Decision 4 - Evaluacion si la etapa es 'Closed Won'
                if ($stage === 'Closed Won') {
                    // Nodo 9: Asignacion de probabilidad del 100% para Closed Won
                    $probability = 100;
                } else {
                    // Nodo 10: Decision 5 - Evaluacion si la etapa es 'Closed Lost'
                    if ($stage === 'Closed Lost') {
                        // Nodo 11: Asignacion de probabilidad del 0% para Closed Lost
                        $probability = 0;
                    } else {
                        // Nodo 12: Retorno de error por etapa no valida o desconocida
                        return OpportunityProbabilityResult::failure(422, 'Etapa de oportunidad no valida');
                    }
                }
            }
        }

        // Nodo 13: Preparacion de la entidad y persistencia en base de datos
        $isSaved = $this->repository->saveProbability($id, $probability);

        // Nodo 14: Decision 6 - Verificacion de persistencia exitosa
        if (!$isSaved) {
            // Nodo 15: Retorno de error por fallo de persistencia
            return OpportunityProbabilityResult::failure(500, 'Fallo en la persistencia de base de datos');
        }

        // Nodo 16: Retorno exitoso con etapa y probabilidad calculada y persistida
        return OpportunityProbabilityResult::success(200, $stage, $probability);

        // Nodo 17: Fin del metodo
    }
}

