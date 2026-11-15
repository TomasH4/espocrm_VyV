<?php
/**
 * TaskOverdueResult.php
 *
 * Value Object inmutable que almacena el diagnostico de vencimiento
 * y escalado de una Tarea de EspoCRM.
 *
 * Funcionalidad 4 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\TaskOverdue;

final class TaskOverdueResult
{
    private bool    $success;
    private int     $code;
    private ?string $error;
    private ?string $taskId;
    private ?int    $overdueDays;
    private ?string $severity;
    private ?bool   $isEscalated;
    private ?string $escalatedToUserId;

    private function __construct(
        bool    $success,
        int     $code,
        ?string $error,
        ?string $taskId,
        ?int    $overdueDays,
        ?string $severity,
        ?bool   $isEscalated,
        ?string $escalatedToUserId
    ) {
        $this->success           = $success;
        $this->code              = $code;
        $this->error             = $error;
        $this->taskId            = $taskId;
        $this->overdueDays       = $overdueDays;
        $this->severity          = $severity;
        $this->isEscalated       = $isEscalated;
        $this->escalatedToUserId = $escalatedToUserId;
    }

    public static function failure(int $code, string $error): self
    {
        return new self(false, $code, $error, null, null, null, null, null);
    }

    public static function success(
        string  $taskId,
        int     $overdueDays,
        string  $severity,
        bool    $isEscalated,
        ?string $escalatedToUserId
    ): self {
        return new self(true, 200, null, $taskId, $overdueDays, $severity, $isEscalated, $escalatedToUserId);
    }

    public function isSuccess(): bool           { return $this->success; }
    public function getCode(): int              { return $this->code; }
    public function getError(): ?string         { return $this->error; }
    public function getTaskId(): ?string        { return $this->taskId; }
    public function getOverdueDays(): ?int      { return $this->overdueDays; }
    public function getSeverity(): ?string      { return $this->severity; }
    public function isEscalated(): ?bool        { return $this->isEscalated; }
    public function getEscalatedToUserId(): ?string { return $this->escalatedToUserId; }
}
