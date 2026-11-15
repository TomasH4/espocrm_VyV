<?php
/**
 * AccountDuplicateDetector.php
 *
 * Servicio de aplicacion para la deteccion y prevencion de Cuentas (Accounts) duplicadas
 * mediante evaluacion combinada de identificador tributario (NIT/Tax ID), distancia de Levenshtein
 * en razon social normalizada, dominio web y correo corporativo.
 *
 * Niveles de Coincidencia:
 *   - Score >= 70: Nivel 'High' -> Duplicado critico confirmado.
 *   - 40 <= Score < 70: Nivel 'Moderate' -> Duplicado potencial (revision manual).
 *   - Score < 40: Nivel 'Low' -> Registro unico y seguro.
 *
 * Mapeo de Nodos para Analisis Estructural de Caja Blanca (Nodos 1 al 20).
 * Complejidad Ciclomatica de McCabe V(G) = 10 (9 predicados + 1).
 *
 * Funcionalidad 5 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\AccountDeduplication;

final class AccountDuplicateDetector
{
    private const GENERIC_EMAIL_DOMAINS = [
        'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com'
    ];

    private const LEGAL_SUFFIXES = [
        's.a.s.', 'sas', 's.a.', 'sa', 'ltd.', 'ltd', 'ltda.', 'ltda', 'llc', 'inc.', 'inc', 'corp.', 'corp'
    ];

    /** @var array<string, string> Cache de normalización para optimización de rendimiento (Refactor) */
    private array $normalizationCache = [];

    public function __construct(
        private readonly AccountSearchRepository $repository
    ) {}

    /**
     * Evalua si una cuenta corporativa ya existe en el sistema o tiene alta probabilidad de duplicado.
     *
     * @param array<string,mixed> $data Datos de la cuenta a evaluar.
     *
     * @return AccountDuplicateResult Diagnostico estructurado.
     */
    public function detect(array $data): AccountDuplicateResult
    {
        // Nodo 1: Captura y normalizacion de parametros de entrada
        $rawName = isset($data['name']) ? trim((string) $data['name']) : '';
        $sicCode = isset($data['sicCode']) && trim((string) $data['sicCode']) !== ''
            ? preg_replace('/[^a-zA-Z0-9]/', '', trim((string) $data['sicCode']))
            : null;
        $website = isset($data['website']) && trim((string) $data['website']) !== ''
            ? $this->extractDomain(trim((string) $data['website']))
            : null;
        $email   = isset($data['emailAddress']) && trim((string) $data['emailAddress']) !== ''
            ? trim((string) $data['emailAddress'])
            : null;

        // Nodo 2: Decision 1 - Verificacion de nombre de cuenta obligatorio
        if ($rawName === '') {
            // Nodo 3: Retorno error 400 por nombre vacio
            return AccountDuplicateResult::failure(400, 'El campo name de la cuenta es obligatorio');
        }

        // Nodo 4: Normalizacion de razon social (minisculas y remocion de sufijos juridicos)
        $cleanName = $this->normalizeCorporateName($rawName);

        $score = 0;
        $matchedId = null;
        $matchedName = null;
        $reasons = [];

        // Nodo 5: Decision 2 - Evaluacion por NIT / Identificador Tributario (sicCode)
        if ($sicCode !== null && $sicCode !== '') {
            $taxMatch = $this->repository->findBySicCode($sicCode);
            // Nodo 6: Decision 3 - Coincidencia exacta por documento tributario
            if ($taxMatch !== null) {
                $score += 90;
                $matchedId = $taxMatch['id'];
                $matchedName = $taxMatch['name'];
                $reasons[] = 'Coincidencia exacta de identificador tributario (NIT/Tax ID)';
            }
        }

        // Nodo 7: Busqueda de candidatos por razon social en el repositorio
        $candidates = $this->repository->findCandidatesByName($cleanName);

        // Nodo 8: Decision 4 - Evaluacion de similitud en candidatos
        foreach ($candidates as $candidate) {
            $candClean = $this->normalizeCorporateName($candidate['name']);

            // Coincidencia exacta tras limpieza
            if ($cleanName === $candClean) {
                $score = max($score, $score + 70);
                $matchedId = $matchedId ?? $candidate['id'];
                $matchedName = $matchedName ?? $candidate['name'];
                $reasons[] = 'Coincidencia exacta de razon social normalizada';
                break;
            }

            // Similitud de Levenshtein
            $similarity = $this->calculateSimilarity($cleanName, $candClean);
            // Nodo 9: Decision 5 - Similitud fonetica/ortografica >= 80%
            if ($similarity >= 0.80) {
                $score = max($score, $score + 40);
                $matchedId = $matchedId ?? $candidate['id'];
                $matchedName = $matchedName ?? $candidate['name'];
                $reasons[] = 'Alta similitud ortografica de razon social (' . round($similarity * 100) . '%)';
                break;
            }
        }

        // Nodo 10: Decision 6 - Evaluacion por dominio de sitio web
        if ($website !== null) {
            $domainMatch = $this->repository->findByDomain($website);
            // Nodo 11: Decision 7 - Coincidencia por dominio web corporativo
            if ($domainMatch !== null) {
                $score = max($score, $score + 30);
                $matchedId = $matchedId ?? $domainMatch['id'];
                $matchedName = $matchedName ?? $domainMatch['name'];
                $reasons[] = "Coincidencia por dominio web corporativo '$website'";
            }
        }

        // Nodo 12: Decision 8 - Evaluacion por dominio de correo corporativo no generico
        if ($email !== null && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $emailParts = explode('@', $email);
            $emailDomain = strtolower($emailParts[1] ?? '');
            if ($emailDomain !== '' && !in_array($emailDomain, self::GENERIC_EMAIL_DOMAINS, true)) {
                $mailMatch = $this->repository->findByDomain($emailDomain);
                if ($mailMatch !== null) {
                    $score = max($score, $score + 20);
                    $matchedId = $matchedId ?? $mailMatch['id'];
                    $matchedName = $matchedName ?? $mailMatch['name'];
                    $reasons[] = "Coincidencia de dominio corporativo de correo '$emailDomain'";
                }
            }
        }

        // Ponderacion final (Tope 100)
        $finalScore = min(100, $score);

        // Nodo 13: Decision 9 - Clasificacion por umbrales de riesgo
        if ($finalScore >= 70) {
            $matchLevel = 'High';
            $isDuplicate = true;
        } elseif ($finalScore >= 40) {
            $matchLevel = 'Moderate';
            $isDuplicate = true;
        } else {
            $matchLevel = 'Low';
            $isDuplicate = false;
        }

        $reasonText = !empty($reasons) ? implode('; ', $reasons) : 'No se detectaron duplicados';

        // Nodo 14: Retorno exitoso 200 con Value Object
        return AccountDuplicateResult::success(
            $isDuplicate,
            $finalScore,
            $matchLevel,
            $matchedId,
            $matchedName,
            $reasonText
        );

        // Nodo 15: Fin del metodo
    }

    private function normalizeCorporateName(string $name): string
    {
        if (isset($this->normalizationCache[$name])) {
            return $this->normalizationCache[$name];
        }

        $clean = mb_strtolower(trim($name), 'UTF-8');
        // Unificar acrónimos con puntos intermedios (ej. s.a.s. -> sas, s.a. -> sa)
        $clean = str_replace(['s.a.s.', 's.a.', 'ltd.', 'ltda.', 'inc.', 'corp.'], ['sas', 'sa', 'ltd', 'ltda', 'inc', 'corp'], $clean);
        $clean = preg_replace('/[.,\-_]/', ' ', $clean) ?? $clean;
        $words = preg_split('/\s+/', $clean) ?: [];

        $filtered = array_filter($words, static function (string $w): bool {
            return !in_array($w, self::LEGAL_SUFFIXES, true) && $w !== '';
        });

        return $this->normalizationCache[$name] = implode(' ', $filtered);
    }

    private function extractDomain(string $url): string
    {
        $domain = preg_replace('#^https?://#i', '', $url) ?? $url;
        $domain = preg_replace('#^www\.#i', '', $domain) ?? $domain;
        $parts  = explode('/', $domain);
        return strtolower(trim($parts[0]));
    }

    private function calculateSimilarity(string $str1, string $str2): float
    {
        $len1 = mb_strlen($str1);
        $len2 = mb_strlen($str2);
        $maxLen = max($len1, $len2);

        if ($maxLen === 0) {
            return 1.0;
        }

        $dist = levenshtein($str1, $str2);
        return 1.0 - ($dist / $maxLen);
    }
}
