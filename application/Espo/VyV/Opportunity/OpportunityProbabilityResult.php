<?php
/**
 * OpportunityProbabilityResult.php
 *
 * Value Object inmutable que encapsula el resultado del calculo
 * y persistencia de la probabilidad de una oportunidad.
 *
 * Funcionalidad 2 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\Opportunity;

final class OpportunityProbabilityResult
{
    private function __construct(
        private readonly bool    $success,
        private readonly int     $code,
        private readonly ?string $error,
        private readonly ?string $stage,
        private readonly ?int    $probability
    ) {}

    public static function failure(int $code, string $error): self
    {
        return new self(false, $code, $error, null, null);
    }

    public static function success(int $code, string $stage, int $probability): self
    {
        return new self(true, $code, null, $stage, $probability);
    }

    public function isSuccess(): bool       { return $this->success; }
    public function getCode(): int          { return $this->code; }
    public function getError(): ?string     { return $this->error; }
    public function getStage(): ?string     { return $this->stage; }
    public function getProbability(): ?int  { return $this->probability; }
}

