<?php
/**
 * LeadConverter.php
 *
 * Servicio de aplicacion encargado de orquestar la conversion transaccional
 * de un Lead calificado en Contacto y Cuenta con integridad referencial.
 *
 * Corresponde a los Nodos 1 al 17 definidos en:
 *   caja_blanca/F5/F5_lead_conversion.md
 *
 * Complejidad Ciclomatica V(G) = 6 (5 predicados de decision + 1).
 *
 * Funcionalidad 5 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\LeadConversion;

final class LeadConverter
{
    public function __construct(
        private readonly LeadConversionRepository $repository
    ) {}

    /**
     * Convierte un Lead en Contacto y Cuenta de forma atomica.
     *
     * @param string $rawLeadId Identificador del Lead a convertir.
     *
     * @return LeadConversionResult Value Object con el resultado de la conversion.
     */
    public function convert(string $rawLeadId): LeadConversionResult
    {
        // Nodo 1: Inicio del metodo y captura del identificador del Lead
        $leadId = trim($rawLeadId);

        // Nodo 2: Decision 1 - Validacion de campo obligatorio (¿ID de Lead provisto?)
        if ($leadId === '') {
            // Nodo 3: Retorno de error por identificador ausente
            return LeadConversionResult::failure(400, 'El identificador del Lead es obligatorio');
        }

        // Nodo 4: Decision 2 - Busqueda y verificacion de existencia del Lead en BD
        $lead = $this->repository->findLeadById($leadId);
        if ($lead === null) {
            // Nodo 5: Retorno de error por Lead no encontrado
            return LeadConversionResult::failure(404, 'Lead no encontrado en la base de datos');
        }

        // Nodo 6: Decision 3 - Verificacion de estado del Lead (¿no esta ya convertido?)
        if (($lead['status'] ?? '') === 'Converted') {
            // Nodo 7: Retorno de error por conflicto de estado (Lead ya convertido)
            return LeadConversionResult::failure(409, 'El Lead ya fue convertido anteriormente');
        }

        // Nodo 8: Inicio de la transaccion de base de datos
        $this->repository->beginTransaction();

        // Nodo 9: Decision 4 - Verificacion de nombre de empresa para creacion condicional de Cuenta
        $accountId = null;
        if (!empty($lead['accountName'])) {
            // Nodo 10: Creacion de la Cuenta en la tabla accounts con los datos del Lead
            $accountId = $this->repository->createAccount([
                'name'  => (string) $lead['accountName'],
                'phone' => isset($lead['phone']) ? (string) $lead['phone'] : null,
            ]);
        } else {
            // Nodo 11: Omision de la creacion de Cuenta; accountId permanece null
            $accountId = null;
        }

        // Nodo 12: Creacion del Contacto con propagacion exacta de datos y vinculacion referencial
        $contactId = $this->repository->createContact([
            'firstName' => isset($lead['firstName']) ? (string) $lead['firstName'] : '',
            'lastName'  => isset($lead['lastName']) ? (string) $lead['lastName'] : '',
            'email'     => isset($lead['email']) ? (string) $lead['email'] : null,
            'phone'     => isset($lead['phone']) ? (string) $lead['phone'] : null,
            'accountId' => $accountId,
        ]);

        // Nodo 13: Actualizacion del Lead original: marcar como convertido y registrar referencias
        $updateOk = false;
        if ($contactId !== null) {
            $updateOk = $this->repository->updateLead($leadId, [
                'status'    => 'Converted',
                'contactId' => $contactId,
                'accountId' => $accountId,
            ]);
        }

        // Nodo 14: Decision 5 - Verificacion de atomicidad e integridad de la transaccion completa
        if ($contactId === null || !$updateOk) {
            // Nodo 15: Reversion total y retorno de error por fallo en la transaccion
            $this->repository->rollback();
            return LeadConversionResult::failure(500, 'Fallo en la transaccion de conversion del Lead');
        }

        // Nodo 16: Confirmacion de transaccion y retorno exitoso de la conversion
        $this->repository->commit();
        return LeadConversionResult::success(201, $contactId, $accountId);

        // Nodo 17: Fin del metodo
    }
}

