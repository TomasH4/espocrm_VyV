<?php
/**
 * AccountSearchRepository.php
 *
 * Interfaz de repositorio para busqueda y comparacion de cuentas existentes
 * para el algoritmo de deduplicacion empresarial.
 *
 * Funcionalidad 5 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\AccountDeduplication;

interface AccountSearchRepository
{
    /**
     * Busca una cuenta por identificador tributario exacto (NIT / Tax ID / sicCode).
     *
     * @param string $sicCode Identificador tributario normalizado.
     *
     * @return array{id: string, name: string}|null Cuenta encontrada o null.
     */
    public function findBySicCode(string $sicCode): ?array;

    /**
     * Busca cuentas que compartan el mismo dominio web o similar razon social.
     *
     * @param string $cleanName Razon social normalizada.
     *
     * @return array<int, array{id: string, name: string, website: ?string, emailAddress: ?string}>
     */
    public function findCandidatesByName(string $cleanName): array;

    /**
     * Busca cuentas por coincidencia exacta de dominio web corporativo.
     *
     * @param string $domain Dominio web limpio (ej. 'empresa.com').
     *
     * @return array{id: string, name: string}|null Cuenta encontrada o null.
     */
    public function findByDomain(string $domain): ?array;
}
