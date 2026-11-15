<?php
/**
 * CaseStatusTransitionValidator.php
 *
 * Servicio de aplicacion responsable de validar y gobernar las transiciones
 * de la maquina de estados de los Casos de soporte tecnico en EspoCRM.
 *
 * Estados permitidos:
 *   - New: Caso recien creado, sin asignacion formal.
 *   - Assigned: Asignado a un especialista de soporte.
 *   - Pending: En espera de informacion del cliente o proveedor.
 *   - Closed: Resuelto exitosamente.
 *   - Rejected: Descartado / Duplicado / Fuera de alcance (estado terminal inmutable).
 *
 * Mapeo de Nodos para Analisis Estructural de Caja Blanca (Nodos 1 al 21).
 * Complejidad Ciclomatica de McCabe V(G) = 10 (9 predicados + 1).
 *
 * Funcionalidad 1 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\CaseStatus;

final class CaseStatusTransitionValidator
{
    private const ALLOWED_STATUSES = ['New', 'Assigned', 'Pending', 'Closed', 'Rejected'];

    private const VALID_TRANSITIONS = [
        'New'      => ['Assigned', 'Rejected'],
        'Assigned' => ['Pending', 'Closed', 'Rejected'],
        'Pending'  => ['Assigned', 'Closed'],
        'Closed'   => ['Assigned'], // Reapertura excepcional con justificacion
        'Rejected' => [],           // Estado terminal: 0 transiciones salientes permitidas
    ];

    public function __construct(
        private readonly CaseRepository $repository
    ) {}

    /**
     * Valida y procesa la transicion de estado de un caso aplicando reglas de negocio.
     *
     * @param array<string,mixed> $data Parametros de la solicitud.
     *
     * @return CaseStatusTransitionResult Resultado encapsulado en Value Object.
     */
    public function transition(array $data): CaseStatusTransitionResult
    {
        // Nodo 1: Captura y normalizacion de parametros de entrada
        $caseId            = isset($data['caseId']) ? trim((string) $data['caseId']) : '';
        $currentStatus     = isset($data['currentStatus']) ? trim((string) $data['currentStatus']) : '';
        $targetStatus      = isset($data['targetStatus']) ? trim((string) $data['targetStatus']) : '';
        $assignedUserId    = isset($data['assignedUserId']) && trim((string) $data['assignedUserId']) !== ''
            ? trim((string) $data['assignedUserId'])
            : null;
        $resolutionComment = isset($data['resolutionComment']) && trim((string) $data['resolutionComment']) !== ''
            ? trim((string) $data['resolutionComment'])
            : null;

        // Nodo 2: Decision 1 - Verificacion de identificador de caso obligatorio
        if ($caseId === '') {
            // Nodo 3: Retorno error 400 por caseId vacio
            return CaseStatusTransitionResult::failure(400, 'El identificador caseId es obligatorio');
        }

        // Nodo 4: Decision 2 - Verificacion de estado destino en catalogo permitido
        if (!in_array($targetStatus, self::ALLOWED_STATUSES, true)) {
            // Nodo 5: Retorno error 400 por estado destino desconocido
            return CaseStatusTransitionResult::failure(400, 'Estado destino invalido o no reconocido');
        }

        // Nodo 6: Decision 3 - Verificacion de transicion a estado identico (no-op)
        if ($currentStatus === $targetStatus) {
            // Nodo 7: Retorno error 400 por transicion redundante
            return CaseStatusTransitionResult::failure(400, 'El estado destino debe ser diferente al actual');
        }

        // Nodo 8: Decision 4 - Inmutabilidad de caso rechazado (estado terminal)
        if ($currentStatus === 'Rejected') {
            // Nodo 9: Retorno error 422 por intento de transicionar caso rechazado
            return CaseStatusTransitionResult::failure(422, 'Un caso en estado Rejected es terminal y no permite transiciones');
        }

        // Nodo 10: Decision 5 - Regla especial para casos en estado Closed (Reapertura)
        if ($currentStatus === 'Closed') {
            // Nodo 11: Decision 6 - Validacion estricta de reapertura: solo a Assigned y con justificacion >= 15 caracteres
            $commentLen = $resolutionComment !== null ? mb_strlen($resolutionComment) : 0;
            if ($targetStatus !== 'Assigned' || $commentLen < 15) {
                // Nodo 12: Retorno error 422 por violacion de protocolo de reapertura
                return CaseStatusTransitionResult::failure(
                    422,
                    'La reapertura de un caso Closed solo permite estado Assigned y requiere justificacion tecnica de al menos 15 caracteres'
                );
            }
        } else {
            // Nodo 13: Decision 7 - Validacion contra la matriz general de transiciones permitidas
            $allowedNext = self::VALID_TRANSITIONS[$currentStatus] ?? [];
            if (!in_array($targetStatus, $allowedNext, true)) {
                // Nodo 14: Retorno error 422 por transicion no permitida por el flujo
                return CaseStatusTransitionResult::failure(
                    422,
                    "Transicion ilegal de estado: no se permite cambiar de '$currentStatus' a '$targetStatus'"
                );
            }
        }

        // Nodo 15: Decision 8 - Verificacion de asignacion obligatoria al pasar a Assigned o Pending
        if (in_array($targetStatus, ['Assigned', 'Pending'], true) && $assignedUserId === null) {
            // Nodo 16: Retorno error 422 por ausencia de usuario responsable asignado
            return CaseStatusTransitionResult::failure(
                422,
                "La transicion al estado '$targetStatus' requiere un usuario responsable asignado (assignedUserId)"
            );
        }

        // Nodo 17: Delegacion de la persistencia al repositorio
        $persisted = $this->repository->updateStatus($caseId, $targetStatus, $assignedUserId, $resolutionComment);

        // Nodo 18: Decision 9 - Verificacion de persistencia exitosa en almacenamiento
        if (!$persisted) {
            // Nodo 19: Retorno error 500 por fallo de persistencia
            return CaseStatusTransitionResult::failure(500, 'Fallo en la persistencia de base de datos al actualizar el estado del caso');
        }

        // Nodo 20: Retorno exitoso 200 con Value Object
        return CaseStatusTransitionResult::success($caseId, $currentStatus, $targetStatus);

        // Nodo 21: Fin del metodo
    }
}
