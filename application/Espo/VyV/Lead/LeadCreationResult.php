<?php
/**
 * LeadCreationResult.php
 *
 * Value Object que encapsula el resultado de intentar crear un Lead.
 * Inmutable: una vez construido no puede modificarse.
 *
 * Funcionalidad 1 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\Lead;

final class LeadCreationResult
{
    private bool   $success;
    private int    $code;
    private ?string $error;
    private ?string $id;
    private ?string $fullName;

    private function __construct(
        bool    $success,
        int     $code,
        ?string $error,
        ?string $id,
        ?string $fullName
    ) {
        $this->success  = $success;
        $this->code     = $code;
        $this->error    = $error;
        $this->id       = $id;
        $this->fullName = $fullName;
    }

    // ------------------------------------------------------------------ //
    // Named constructors                                                   //
    // ------------------------------------------------------------------ //

    public static function failure(int $code, string $error): self
    {
        return new self(false, $code, $error, null, null);
    }

    public static function success(string $id, string $fullName): self
    {
        return new self(true, 201, null, $id, $fullName);
    }

    // ------------------------------------------------------------------ //
    // Accessors                                                             //
    // ------------------------------------------------------------------ //

    public function isSuccess(): bool    { return $this->success; }
    public function getCode(): int       { return $this->code; }
    public function getError(): ?string  { return $this->error; }
    public function getId(): ?string     { return $this->id; }
    public function getFullName(): ?string { return $this->fullName; }
}

