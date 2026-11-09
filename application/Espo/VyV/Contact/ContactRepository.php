<?php
/**
 * ContactRepository.php
 *
 * Interfaz de repositorio para la consulta y recuperacion de contactos.
 * Desacopla la logica de negocio de las consultas SQL reales a la base de datos.
 *
 * Funcionalidad 3 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\Contact;

interface ContactRepository
{
    /**
     * Ejecuta la consulta de contactos con las clausulas y filtros especificados.
     *
     * @param array<string,mixed>      $whereClause     Clausula de coincidencia (exacta, parcial o ninguna).
     * @param array<string,mixed>|null $filterCondition Condicion de filtro adicional (estado, etc.), o null.
     * @param int                      $limit           Limite maximo de registros a retornar.
     *
     * @return array<int,array<string,mixed>>|null Arreglo de registros encontrados, o null en caso de fallo.
     */
    public function search(array $whereClause, ?array $filterCondition, int $limit): ?array;
}

