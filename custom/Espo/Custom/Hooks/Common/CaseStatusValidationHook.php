<?php
declare(strict_types=1);

namespace Espo\Custom\Hooks\Common;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Hook\Hook\BeforeSave;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;

class CaseStatusValidationHook implements BeforeSave
{
    private const ALLOWED_STATUSES = ['New', 'Assigned', 'Pending', 'Closed', 'Rejected'];

    private const VALID_TRANSITIONS = [
        'New'      => ['Assigned', 'Rejected'],
        'Assigned' => ['Pending', 'Closed', 'Rejected'],
        'Pending'  => ['Assigned', 'Closed'],
        'Closed'   => ['Assigned'],
        'Rejected' => [],
    ];

    private function fail(string $message): never
    {
        throw BadRequest::createWithBody($message, json_encode(['message' => $message], JSON_UNESCAPED_UNICODE));
    }

    public function beforeSave(Entity $entity, SaveOptions $options): void
    {
        if ($entity->getEntityType() !== 'Case') {
            return;
        }

        // Solo validar si cambió el atributo status
        if (!$entity->isAttributeChanged('status')) {
            return;
        }

        $currentStatus = $entity->getFetched('status');
        $targetStatus = (string) $entity->get('status');

        // Si es un caso nuevo que se está creando
        if ($entity->isNew()) {
            if (!in_array($targetStatus, ['New', 'Assigned'], true)) {
                $this->fail("Un caso nuevo no puede crearse directamente en estado '{$targetStatus}'. Debe iniciar en 'New' o 'Assigned'.");
            }
            return;
        }

        if (!$currentStatus) {
            $currentStatus = 'New';
        }

        if ($currentStatus === $targetStatus) {
            return;
        }

        if (!in_array($targetStatus, self::ALLOWED_STATUSES, true)) {
            $this->fail("Estado destino '{$targetStatus}' no es válido en el catálogo permitido.");
        }

        if ($currentStatus === 'Rejected') {
            $this->fail("Un caso en estado 'Rejected' es terminal y no permite transiciones.");
        }

        if ($currentStatus === 'Closed') {
            $resolution = (string) ($entity->get('resolution') ?? '');
            if ($targetStatus !== 'Assigned' || mb_strlen(trim($resolution)) < 15) {
                $this->fail("La reapertura de un caso Closed solo permite estado Assigned y requiere justificación técnica de al menos 15 caracteres en el campo Resolución.");
            }
        } else {
            $allowedNext = self::VALID_TRANSITIONS[$currentStatus] ?? [];
            if (!in_array($targetStatus, $allowedNext, true)) {
                $allowedStr = !empty($allowedNext) ? implode(', ', $allowedNext) : 'ninguno';
                $this->fail("Transición ilegal de estado: no se permite cambiar de '{$currentStatus}' a '{$targetStatus}'. Estados permitidos desde '{$currentStatus}': [{$allowedStr}].");
            }
        }

        if (in_array($targetStatus, ['Assigned', 'Pending'], true)) {
            $assignedUserId = $entity->get('assignedUserId');
            if (empty($assignedUserId)) {
                $this->fail("La transición al estado '{$targetStatus}' requiere asignar un usuario responsable (Assigned User).");
            }
        }
    }
}
