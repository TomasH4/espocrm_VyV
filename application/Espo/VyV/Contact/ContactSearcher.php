<?php
/**
 * ContactSearcher.php
 *
 * Servicio de aplicacion encargado de orquestar la busqueda y filtrado
 * de contactos en el CRM.
 *
 * Corresponde a los Nodos 1 al 16 definidos en:
 *   caja_blanca/F3/F3_contact_search.md
 *
 * Complejidad Ciclomatica V(G) = 6 (5 predicados de decision + 1).
 *
 * Funcionalidad 3 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\Contact;

final class ContactSearcher
{
    public function __construct(
        private readonly ContactRepository $repository
    ) {}

    /**
     * Busca y filtra contactos segun los criterios de texto y estado.
     *
     * @param array<string,mixed> $params Parametros ($query, $filter, $limit).
     *
     * @return ContactSearchResult Value Object con el resultado de la busqueda.
     */
    public function search(array $params): ContactSearchResult
    {
        // Nodo 1: Inicio y captura de parametros de entrada ($query, $filter, $limit)
        $query  = isset($params['query']) ? trim((string) $params['query']) : null;
        $filter = isset($params['filter']) && $params['filter'] !== '' ? (string) $params['filter'] : 'all';
        $limit  = isset($params['limit']) && (int) $params['limit'] > 0 ? (int) $params['limit'] : 20;

        // Nodo 2: Decision 1 - Verificacion de presencia de termino de busqueda
        if (!empty($query)) {
            // Nodo 3: Decision 2 - Evaluacion de modalidad de busqueda (¿exacta o parcial?)
            if (str_starts_with($query, '"') && str_ends_with($query, '"')) {
                // Nodo 4: Construccion de clausula de coincidencia exacta (= 'termino')
                $term = trim($query, '"');
                $whereClause = ['type' => 'exact', 'field' => 'name', 'value' => $term];
            } else {
                // Nodo 5: Construccion de clausula de coincidencia parcial (LIKE '%termino%')
                $whereClause = ['type' => 'partial', 'field' => 'name', 'value' => '%' . $query . '%'];
            }
        } else {
            // Nodo 6: Consulta general sin filtro de texto asignado
            $whereClause = ['type' => 'none'];
        }

        // Nodo 7: Decision 3 - Evaluacion de filtro de estado/clasificacion activo
        if ($filter !== 'all') {
            // Nodo 8: Incorporacion de condicion de filtro a la consulta
            $filterCondition = ['status' => $filter];
        } else {
            // Nodo 9: Omitir filtro de clasificacion (todos los registros)
            $filterCondition = null;
        }

        // Nodo 10: Invocacion del repositorio para ejecutar la consulta
        $records = $this->repository->search($whereClause, $filterCondition, $limit);

        // Nodo 11: Decision 4 - Verificacion de ejecucion exitosa de la consulta en BD
        if ($records === null) {
            // Nodo 12: Retorno de error interno por fallo en la consulta
            return ContactSearchResult::failure(500, 'Fallo en la ejecucion de la consulta de base de datos');
        }

        // Nodo 13: Decision 5 - Evaluacion de registros encontrados en el resultado
        if (count($records) > 0) {
            // Nodo 14: Retorno exitoso con la coleccion de contactos encontrados
            return ContactSearchResult::successWithData(200, $records);
        }

        // Nodo 15: Retorno exitoso con lista vacia y mensaje "No Data"
        return ContactSearchResult::successEmpty(200, 'No Data');

        // Nodo 16: Fin del metodo
    }
}

