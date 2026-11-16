<?php
/**
 * CaseSlaResult.php
 *
 * Value Object inmutable que encapsula el resultado del calculo de SLA
 * y plazos de atencion de soporte.
 *
 * Funcionalidad 2 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\CaseSla;

final class CaseSlaResult
{
    private bool    $success;
    private int     $code;
    private ?string $error;
    private ?string $caseId;
    private ?string $slaTier;
    private ?float  $targetResponseHours;
    private ?float  $targetResolutionHours;
    private ?string $firstResponseDue;
    private ?string $resolutionDue;
    private ?string $slaStatus;

    private function __construct(
        bool    $success,
        int     $code,
        ?string $error,
        ?string $caseId,
        ?string $slaTier,
        ?float  $targetResponseHours,
        ?float  $targetResolutionHours,
        ?string $firstResponseDue,
        ?string $resolutionDue,
        ?string $slaStatus
    ) {
        $this->success               = $success;
        $this->code                  = $code;
        $this->error                 = $error;
        $this->caseId                = $caseId;
        $this->slaTier               = $slaTier;
        $this->targetResponseHours   = $targetResponseHours;
        $this->targetResolutionHours = $targetResolutionHours;
        $this->firstResponseDue      = $firstResponseDue;
        $this->resolutionDue         = $resolutionDue;
        $this->slaStatus             = $slaStatus;
    }

    public static function failure(int $code, string $error): self
    {
        return new self(false, $code, $error, null, null, null, null, null, null, null);
    }

    public static function success(
        string $caseId,
        string $slaTier,
        float  $targetResponseHours,
        float  $targetResolutionHours,
        string $firstResponseDue,
        string $resolutionDue,
        string $slaStatus
    ): self {
        return new self(
            true,
            200,
            null,
            $caseId,
            $slaTier,
            $targetResponseHours,
            $targetResolutionHours,
            $firstResponseDue,
            $resolutionDue,
            $slaStatus
        );
    }

    public function isSuccess(): bool               { return $this->success; }
    public function getCode(): int                  { return $this->code; }
    public function getError(): ?string             { return $this->error; }
    public function getCaseId(): ?string            { return $this->caseId; }
    public function getSlaTier(): ?string           { return $this->slaTier; }
    public function getTargetResponseHours(): ?float { return $this->targetResponseHours; }
    public function getTargetResolutionHours(): ?float { return $this->targetResolutionHours; }
    public function getFirstResponseDue(): ?string  { return $this->firstResponseDue; }
    public function getResolutionDue(): ?string     { return $this->resolutionDue; }
    public function getSlaStatus(): ?string         { return $this->slaStatus; }
}
