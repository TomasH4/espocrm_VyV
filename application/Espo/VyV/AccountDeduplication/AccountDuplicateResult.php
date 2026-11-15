<?php
/**
 * AccountDuplicateResult.php
 *
 * Value Object inmutable que encapsula el informe de deduplicacion
 * y evaluacion de similitud para cuentas corporativas.
 *
 * Funcionalidad 5 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\AccountDeduplication;

final class AccountDuplicateResult
{
    private bool    $success;
    private int     $code;
    private ?string $error;
    private ?bool   $isDuplicate;
    private ?int    $matchScore;
    private ?string $matchLevel;
    private ?string $matchedAccountId;
    private ?string $matchedAccountName;
    private ?string $detectionReason;

    private function __construct(
        bool    $success,
        int     $code,
        ?string $error,
        ?bool   $isDuplicate,
        ?int    $matchScore,
        ?string $matchLevel,
        ?string $matchedAccountId,
        ?string $matchedAccountName,
        ?string $detectionReason
    ) {
        $this->success            = $success;
        $this->code               = $code;
        $this->error              = $error;
        $this->isDuplicate        = $isDuplicate;
        $this->matchScore         = $matchScore;
        $this->matchLevel         = $matchLevel;
        $this->matchedAccountId   = $matchedAccountId;
        $this->matchedAccountName = $matchedAccountName;
        $this->detectionReason    = $detectionReason;
    }

    public static function failure(int $code, string $error): self
    {
        return new self(false, $code, $error, null, null, null, null, null, null);
    }

    public static function success(
        bool    $isDuplicate,
        int     $matchScore,
        string  $matchLevel,
        ?string $matchedAccountId,
        ?string $matchedAccountName,
        string  $detectionReason
    ): self {
        return new self(
            true,
            200,
            null,
            $isDuplicate,
            $matchScore,
            $matchLevel,
            $matchedAccountId,
            $matchedAccountName,
            $detectionReason
        );
    }

    public function isSuccess(): bool               { return $this->success; }
    public function getCode(): int                  { return $this->code; }
    public function getError(): ?string             { return $this->error; }
    public function isDuplicate(): ?bool            { return $this->isDuplicate; }
    public function getMatchScore(): ?int           { return $this->matchScore; }
    public function getMatchLevel(): ?string        { return $this->matchLevel; }
    public function getMatchedAccountId(): ?string   { return $this->matchedAccountId; }
    public function getMatchedAccountName(): ?string { return $this->matchedAccountName; }
    public function getDetectionReason(): ?string   { return $this->detectionReason; }
}
