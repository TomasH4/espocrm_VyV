<?php
/**
 * CaseStatusTransitionResult.php
 *
 * Value Object inmutable que encapsula el resultado de validar y aplicar una
 * transicion de estado en un Caso de soporte.
 *
 * Funcionalidad 1 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\CaseStatus;

final class CaseStatusTransitionResult
{
    private bool    $success;
    private int     $code;
    private ?string $error;
    private ?string $caseId;
    private ?string $previousStatus;
    private ?string $newStatus;

    private function __construct(
        bool    $success,
        int     $code,
        ?string $error,
        ?string $caseId,
        ?string $previousStatus,
        ?string $newStatus
    ) {
        $this->success        = $success;
        $this->code           = $code;
        $this->error          = $error;
        $this->caseId         = $caseId;
        $this->previousStatus = $previousStatus;
        $this->newStatus      = $newStatus;
    }

    // ------------------------------------------------------------------ //
    // Named Constructors                                                 //
    // ------------------------------------------------------------------ //

    public static function failure(int $code, string $error): self
    {
        return new self(false, $code, $error, null, null, null);
    }

    public static function success(string $caseId, string $previousStatus, string $newStatus): self
    {
        return new self(true, 200, null, $caseId, $previousStatus, $newStatus);
    }

    // ------------------------------------------------------------------ //
    // Accessors                                                          //
    // ------------------------------------------------------------------ //

    public function isSuccess(): bool           { return $this->success; }
    public function getCode(): int              { return $this->code; }
    public function getError(): ?string         { return $this->error; }
    public function getCaseId(): ?string        { return $this->caseId; }
    public function getPreviousStatus(): ?string { return $this->previousStatus; }
    public function getNewStatus(): ?string      { return $this->newStatus; }
}
