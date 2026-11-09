<?php
/**
 * ContactSearchResult.php
 *
 * Value Object inmutable que encapsula la respuesta estructurada de una
 * busqueda o filtrado de contactos en el sistema.
 *
 * Funcionalidad 3 - VyV EspoCRM
 */

declare(strict_types=1);

namespace Espo\VyV\Contact;

final class ContactSearchResult
{
    /**
     * @param array<int,array<string,mixed>> $data
     */
    private function __construct(
        private readonly bool    $success,
        private readonly int     $code,
        private readonly int     $total,
        private readonly array   $data,
        private readonly ?string $message,
        private readonly ?string $error
    ) {}

    public static function failure(int $code, string $error): self
    {
        return new self(false, $code, 0, [], null, $error);
    }

    /**
     * @param array<int,array<string,mixed>> $data
     */
    public static function successWithData(int $code, array $data): self
    {
        return new self(true, $code, count($data), $data, null, null);
    }

    public static function successEmpty(int $code, string $message = 'No Data'): self
    {
        return new self(true, $code, 0, [], $message, null);
    }

    public function isSuccess(): bool    { return $this->success; }
    public function getCode(): int       { return $this->code; }
    public function getTotal(): int      { return $this->total; }
    /**
     * @return array<int,array<string,mixed>>
     */
    public function getData(): array     { return $this->data; }
    public function getMessage(): ?string { return $this->message; }
    public function getError(): ?string   { return $this->error; }
}

