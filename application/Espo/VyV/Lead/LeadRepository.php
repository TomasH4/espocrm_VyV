<?php
/**
 * LeadRepository.php
 *
 * Interfaz de repositorio para la persistencia de Leads.
 * Define el contrato que debe cumplir cualquier implementacion
 * concreta de almacenamiento (base de datos, en memoria, etc.).
 *
 * Funcionalidad 1 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\Lead;

interface LeadRepository
{
    /**
     * Persiste un Lead en el almacenamiento.
     *
     * @param string      $firstName Nombre del Lead.
     * @param string      $lastName  Apellido del Lead (obligatorio).
     * @param string|null $email     Correo electronico validado (opcional).
     * @param string|null $phone     Telefono (opcional).
     *
     * @return string|null ID generado del nuevo Lead, o null en caso de fallo.
     */
    public function save(
        string $firstName,
        string $lastName,
        ?string $email,
        ?string $phone
    ): ?string;
}

