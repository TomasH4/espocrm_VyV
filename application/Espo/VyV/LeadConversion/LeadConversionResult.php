<?php
/**
 * LeadConversionResult.php
 *
 * Value Object inmutable que encapsula el resultado de la conversion
 * de un Lead en Contacto y Cuenta con integridad referencial.
 *
 * Funcionalidad 5 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\LeadConversion;

final class LeadConversionResult
{
    private function __construct(
        private readonly bool    $success,
        private readonly int     $code,
        private readonly ?string $contactId,
        private readonly ?string $accountId,
        private readonly ?string $error
    ) {}

    public static function failure(int $code, string $error): self
    {
        return new self(false, $code, null, null, $error);
    }

    public static function success(int $code, string $contactId, ?string $accountId): self
    {
        return new self(true, $code, $contactId, $accountId, null);
    }

    public function isSuccess(): bool       { return $this->success; }
    public function getCode(): int          { return $this->code; }
    public function getContactId(): ?string { return $this->contactId; }
    public function getAccountId(): ?string { return $this->accountId; }
    public function getError(): ?string     { return $this->error; }
}

