<?php
/**
 * LeadCreator.php
 *
 * Servicio de aplicacion responsable de orquestar la creacion de un Lead:
 *   1. Validar campos obligatorios.
 *   2. Validar formato de correo electronico (cuando se proporcione).
 *   3. Delegar la persistencia al repositorio inyectado.
 *   4. Retornar un Value Object con el resultado.
 *
 * Corresponde a los Nodos 1-13 definidos en:
 *   caja_blanca/F1/F1_lead_creation.md
 *
 * Complejidad Ciclomatica V(G) = 5 (4 predicados + 1)
 *
 * Funcionalidad 1 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\Lead;

final class LeadCreator
{
    public function __construct(
        private readonly LeadRepository $repository
    ) {}

    /**
     * Crea un nuevo Lead aplicando las reglas de validacion de negocio.
     *
     * @param array<string,mixed> $data Parametros de entrada del formulario.
     *
     * @return LeadCreationResult Value Object con el resultado de la operacion.
     */
    public function create(array $data): LeadCreationResult
    {
        // Nodo 1: Captura de parametros de entrada
        $firstName = isset($data['firstName']) ? trim((string) $data['firstName']) : '';
        $lastName  = isset($data['lastName'])  ? trim((string) $data['lastName'])  : '';
        $email     = isset($data['emailAddress']) && $data['emailAddress'] !== ''
            ? trim((string) $data['emailAddress'])
            : null;
        $phone     = isset($data['phoneNumber']) ? trim((string) $data['phoneNumber']) : null;

        // Nodo 2: Decision 1 - Validacion de campo obligatorio (apellido)
        if ($lastName === '') {
            // Nodo 3: Retorno de error por apellido vacio
            return LeadCreationResult::failure(400, 'El campo lastName es obligatorio');
        }

        // Nodo 4: Decision 2 - Verificacion de existencia de email
        $validEmail = null;
        if ($email !== null) {
            // Nodo 6: Decision 3 - Validacion de formato de email
            if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                // Nodo 7: Retorno de error por formato de email invalido
                return LeadCreationResult::failure(400, 'Formato de email invalido');
            }
            // Nodo 8: Email con formato valido confirmado
            $validEmail = $email;
        }
        // Nodo 5: Email nulo -> $validEmail permanece null (rama implicita)

        // Nodo 9: Preparacion e invocacion de la persistencia
        $newId = $this->repository->save($firstName, $lastName, $validEmail, $phone);

        // Nodo 10: Decision 4 - Verificacion de persistencia exitosa
        if ($newId === null) {
            // Nodo 11: Retorno de error por fallo de persistencia
            return LeadCreationResult::failure(500, 'Fallo en la persistencia de base de datos');
        }

        // Nodo 12: Retorno exitoso
        $fullName = trim("$firstName $lastName");
        return LeadCreationResult::success($newId, $fullName);

        // Nodo 13: Fin del metodo
    }
}

