<?php
/**
 * LeadConversionRepository.php
 *
 * Interfaz de repositorio para la persistencia transaccional multidominio
 * de la conversion de Leads en Cuentas y Contactos.
 *
 * Desacopla la logica de negocio de las operaciones SQL reales sobre
 * las tablas leads, accounts y contacts.
 *
 * Funcionalidad 5 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\LeadConversion;

interface LeadConversionRepository
{
    /**
     * Busca un Lead por su identificador en BD.
     *
     * @param string $id Identificador del Lead.
     *
     * @return array<string,mixed>|null Datos del Lead, o null si no existe.
     */
    public function findLeadById(string $id): ?array;

    /**
     * Inicia una transaccion de base de datos atomica.
     */
    public function beginTransaction(): void;

    /**
     * Confirma la transaccion persistiendo todos los cambios.
     */
    public function commit(): void;

    /**
     * Revierte todas las operaciones de la transaccion activa.
     */
    public function rollback(): void;

    /**
     * Crea un nuevo registro de Cuenta en la tabla accounts.
     *
     * @param array<string,mixed> $accountData Datos de la empresa.
     *
     * @return string|null Identificador de la nueva Cuenta, o null en caso de fallo.
     */
    public function createAccount(array $accountData): ?string;

    /**
     * Crea un nuevo registro de Contacto en la tabla contacts con vinculacion a Cuenta.
     *
     * @param array<string,mixed> $contactData Datos del contacto (nombre, email, phone, accountId).
     *
     * @return string|null Identificador del nuevo Contacto, o null en caso de fallo.
     */
    public function createContact(array $contactData): ?string;

    /**
     * Actualiza el estado y los enlaces del Lead original en la tabla leads.
     *
     * @param string              $leadId     Identificador del Lead.
     * @param array<string,mixed> $updateData Datos a actualizar (status, contactId, accountId).
     *
     * @return bool True si la actualizacion fue exitosa, False en caso de fallo.
     */
    public function updateLead(string $leadId, array $updateData): bool;
}

