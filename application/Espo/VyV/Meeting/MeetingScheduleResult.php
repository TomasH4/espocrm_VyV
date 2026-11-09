<?php
/**
 * MeetingScheduleResult.php
 *
 * Value Object inmutable que encapsula el resultado del agendamiento,
 * validacion temporal y calculo de duracion de una reunion.
 *
 * Funcionalidad 4 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\Meeting;

final class MeetingScheduleResult
{
    private function __construct(
        private readonly bool    $success,
        private readonly int     $code,
        private readonly ?string $name,
        private readonly ?string $dateStart,
        private readonly ?string $dateEnd,
        private readonly ?int    $duration,
        private readonly ?string $error
    ) {}

    public static function failure(int $code, string $error): self
    {
        return new self(false, $code, null, null, null, null, $error);
    }

    public static function success(
        int $code,
        ?string $name,
        string $dateStart,
        string $dateEnd,
        int $duration
    ): self {
        return new self(true, $code, $name, $dateStart, $dateEnd, $duration, null);
    }

    public function isSuccess(): bool     { return $this->success; }
    public function getCode(): int        { return $this->code; }
    public function getName(): ?string    { return $this->name; }
    public function getDateStart(): ?string { return $this->dateStart; }
    public function getDateEnd(): ?string   { return $this->dateEnd; }
    public function getDuration(): ?int   { return $this->duration; }
    public function getError(): ?string   { return $this->error; }
}

