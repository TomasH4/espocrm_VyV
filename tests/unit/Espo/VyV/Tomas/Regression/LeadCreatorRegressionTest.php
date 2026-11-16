<?php
/**
 * LeadCreatorRegressionTest.php
 *
 * Suite de pruebas unitarias de REGRESION para LeadCreator.
 * Protege contratos de objetos de resultado, validaciones RFC,
 * integridad Unicode y robustez ante tipos y casos borde.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Regression;

use Espo\VyV\Lead\LeadCreationResult;
use Espo\VyV\Lead\LeadCreator;
use Espo\VyV\Lead\LeadRepository;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class LeadCreatorRegressionTest extends TestCase
{
    private LeadRepository&MockObject $repositoryMock;
    private LeadCreator $sut;

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(LeadRepository::class);
        $this->sut = new LeadCreator($this->repositoryMock);
    }

    /**
     * REG-L1: Invariante de contrato del Value Object LeadCreationResult en exito y fallo.
     */
    public function testResultObjectContractInvariants(): void
    {
        // En exito
        $success = LeadCreationResult::success('lead-123', 'Juan Perez');
        $this->assertTrue($success->isSuccess());
        $this->assertSame(201, $success->getCode());
        $this->assertSame('lead-123', $success->getId());
        $this->assertSame('Juan Perez', $success->getFullName());
        $this->assertNull($success->getError());

        // En fallo 400
        $failure400 = LeadCreationResult::failure(400, 'Error de validacion');
        $this->assertFalse($failure400->isSuccess());
        $this->assertSame(400, $failure400->getCode());
        $this->assertSame('Error de validacion', $failure400->getError());
        $this->assertNull($failure400->getId());
        $this->assertNull($failure400->getFullName());

        // En fallo 500
        $failure500 = LeadCreationResult::failure(500, 'Error de servidor');
        $this->assertFalse($failure500->isSuccess());
        $this->assertSame(500, $failure500->getCode());
        $this->assertSame('Error de servidor', $failure500->getError());
    }

    /**
     * REG-L2: Preservacion exacta de caracteres especiales y acentos Unicode (UTF-8).
     */
    public function testLeadCreationPreservesUnicodeCharacters(): void
    {
        $expectedFirst = 'María José';
        $expectedLast  = 'Nuñez-Gómez';

        $this->repositoryMock
            ->expects($this->once())
            ->method('save')
            ->with(
                $this->identicalTo($expectedFirst),
                $this->identicalTo($expectedLast),
                $this->identicalTo('maria.gomez@dominio.com'),
                $this->isNull()
            )
            ->willReturn('lead-unicode-id');

        $result = $this->sut->create([
            'firstName'    => $expectedFirst,
            'lastName'     => $expectedLast,
            'emailAddress' => 'maria.gomez@dominio.com',
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame('María José Nuñez-Gómez', $result->getFullName());
    }

    /**
     * REG-L3: Aceptacion de correos validos con formatos complejos / RFC.
     */
    #[DataProvider('validEmailProvider')]
    public function testLeadCreationAcceptsValidComplexEmails(string $validEmail): void
    {
        $this->repositoryMock
            ->expects($this->once())
            ->method('save')
            ->willReturn('lead-email-ok');

        $result = $this->sut->create([
            'firstName'    => 'Test',
            'lastName'     => 'RFC',
            'emailAddress' => $validEmail,
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(201, $result->getCode());
    }

    public static function validEmailProvider(): array
    {
        return [
            ['usuario+tag@empresa.com'],
            ['nombre.apellido.123@sub.dominio.org'],
            ['cliente_vip@empresa-holding.com.co'],
        ];
    }

    /**
     * REG-L4: Rechazo con error 400 ante emails invalidos no permitidos.
     */
    #[DataProvider('invalidEmailProvider')]
    public function testLeadCreationRejectsInvalidEmailFormats(string $invalidEmail): void
    {
        $this->repositoryMock->expects($this->never())->method('save');

        $result = $this->sut->create([
            'lastName'     => 'Perez',
            'emailAddress' => $invalidEmail,
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('Formato de email invalido', $result->getError());
    }

    public static function invalidEmailProvider(): array
    {
        return [
            ['usuario@@dominio.com'],
            ['usuario@dominio sin punto'],
            ['usuario @dominio.com'],
            ['sin_arroba.com'],
            ['@dominio.com'],
        ];
    }

    /**
     * REG-L5: Robustez defensiva ante inputs numericos y array vacio.
     */
    public function testLeadCreationHandlesEmptyInputDefensively(): void
    {
        $this->repositoryMock->expects($this->never())->method('save');

        // Array completamente vacio
        $result = $this->sut->create([]);
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('El campo lastName es obligatorio', $result->getError());
    }

    /**
     * REG-L6: Conversion segura de tipos cuando se envian valores numericos en campos de texto.
     */
    public function testLeadCreationCastsNumericInputToStringWithoutException(): void
    {
        $this->repositoryMock
            ->expects($this->once())
            ->method('save')
            ->with(
                $this->identicalTo('123'),
                $this->identicalTo('456'),
                $this->isNull(),
                $this->identicalTo('3001234567')
            )
            ->willReturn('lead-numeric-id');

        $result = $this->sut->create([
            'firstName'   => 123,
            'lastName'    => 456,
            'phoneNumber' => 3001234567,
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame('123 456', $result->getFullName());
    }
}

