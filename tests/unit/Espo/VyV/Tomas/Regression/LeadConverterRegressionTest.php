<?php
/**
 * LeadConverterRegressionTest.php
 *
 * Suite de pruebas unitarias de REGRESION para LeadConverter.
 * Protege la atomicidad transaccional (commit/rollback), flujos B2B vs B2C,
 * idempotencia de estado y prevencion de doble conversion.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Regression;

use Espo\VyV\LeadConversion\LeadConversionRepository;
use Espo\VyV\LeadConversion\LeadConversionResult;
use Espo\VyV\LeadConversion\LeadConverter;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class LeadConverterRegressionTest extends TestCase
{
    private LeadConversionRepository&MockObject $repositoryMock;
    private LeadConverter $sut;

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(LeadConversionRepository::class);
        $this->sut = new LeadConverter($this->repositoryMock);
    }

    /**
     * REG-LC1: Flujo B2B completo: Lead con empresa crea Account + Contact y confirma transaccion (commit).
     */
    public function testB2BConversionCreatesBothAccountAndContactAndCommits(): void
    {
        $leadId = 'lead-b2b-100';

        // 1. Encontrar lead con empresa
        $this->repositoryMock
            ->expects($this->once())
            ->method('findLeadById')
            ->with($this->identicalTo($leadId))
            ->willReturn([
                'id'          => $leadId,
                'status'      => 'Assigned',
                'accountName' => 'Empresa B2B S.A.S.',
                'firstName'   => 'Carlos',
                'lastName'    => 'Gomez',
                'email'       => 'cgomez@b2b.com',
                'phone'       => '3001234567',
            ]);

        // 2. Iniciar transaccion
        $this->repositoryMock->expects($this->once())->method('beginTransaction');

        // 3. Crear Cuenta
        $this->repositoryMock
            ->expects($this->once())
            ->method('createAccount')
            ->with([
                'name'  => 'Empresa B2B S.A.S.',
                'phone' => '3001234567',
            ])
            ->willReturn('acc-b2b-555');

        // 4. Crear Contacto vinculado a la Cuenta
        $this->repositoryMock
            ->expects($this->once())
            ->method('createContact')
            ->with([
                'firstName' => 'Carlos',
                'lastName'  => 'Gomez',
                'email'     => 'cgomez@b2b.com',
                'phone'     => '3001234567',
                'accountId' => 'acc-b2b-555',
            ])
            ->willReturn('cnt-b2b-777');

        // 5. Actualizar Lead
        $this->repositoryMock
            ->expects($this->once())
            ->method('updateLead')
            ->with(
                $this->identicalTo($leadId),
                $this->identicalTo([
                    'status'    => 'Converted',
                    'contactId' => 'cnt-b2b-777',
                    'accountId' => 'acc-b2b-555',
                ])
            )
            ->willReturn(true);

        // 6. Confirmar transaccion (commit)
        $this->repositoryMock->expects($this->once())->method('commit');
        $this->repositoryMock->expects($this->never())->method('rollback');

        $result = $this->sut->convert($leadId);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(201, $result->getCode());
        $this->assertSame('cnt-b2b-777', $result->getContactId());
        $this->assertSame('acc-b2b-555', $result->getAccountId());
    }

    /**
     * REG-LC2: Flujo B2C: Lead sin empresa omite estrictamente la creacion de Account.
     */
    public function testB2CConversionOmitsAccountCreationStrictly(): void
    {
        $leadId = 'lead-b2c-200';

        $this->repositoryMock
            ->method('findLeadById')
            ->willReturn([
                'id'          => $leadId,
                'status'      => 'New',
                'accountName' => null, // Persona natural, sin empresa
                'firstName'   => 'Laura',
                'lastName'    => 'Mora',
                'email'       => 'lmora@personal.com',
            ]);

        // createAccount nunca debe ser invocado
        $this->repositoryMock->expects($this->never())->method('createAccount');

        // createContact debe recibir accountId = null
        $this->repositoryMock
            ->expects($this->once())
            ->method('createContact')
            ->with([
                'firstName' => 'Laura',
                'lastName'  => 'Mora',
                'email'     => 'lmora@personal.com',
                'phone'     => null,
                'accountId' => null,
            ])
            ->willReturn('cnt-b2c-888');

        $this->repositoryMock->method('updateLead')->willReturn(true);
        $this->repositoryMock->expects($this->once())->method('commit');

        $result = $this->sut->convert($leadId);

        $this->assertTrue($result->isSuccess());
        $this->assertSame('cnt-b2c-888', $result->getContactId());
        $this->assertNull($result->getAccountId());
    }

    /**
     * REG-LC3: Rollback total cuando falla la creacion de Contacto (atomicidad).
     */
    public function testRollbackTriggeredWhenContactCreationFails(): void
    {
        $leadId = 'lead-fail-contact';

        $this->repositoryMock
            ->method('findLeadById')
            ->willReturn([
                'id'          => $leadId,
                'status'      => 'New',
                'accountName' => 'Empresa X',
                'firstName'   => 'Pedro',
                'lastName'    => 'Sanchez',
            ]);

        $this->repositoryMock->method('createAccount')->willReturn('acc-tmp');

        // Fallo en creacion de contacto
        $this->repositoryMock
            ->expects($this->once())
            ->method('createContact')
            ->willReturn(null);

        // Rollback garantizado
        $this->repositoryMock->expects($this->once())->method('rollback');
        $this->repositoryMock->expects($this->never())->method('commit');

        $result = $this->sut->convert($leadId);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
        $this->assertSame('Fallo en la transaccion de conversion del Lead', $result->getError());
    }

    /**
     * REG-LC4: Rollback total cuando falla la actualizacion final del Lead.
     */
    public function testRollbackTriggeredWhenLeadUpdateFails(): void
    {
        $leadId = 'lead-fail-update';

        $this->repositoryMock
            ->method('findLeadById')
            ->willReturn([
                'id'          => $leadId,
                'status'      => 'New',
                'accountName' => null,
                'lastName'    => 'Lopez',
            ]);

        $this->repositoryMock->method('createContact')->willReturn('cnt-ok');

        // Fallo en actualizacion
        $this->repositoryMock
            ->expects($this->once())
            ->method('updateLead')
            ->willReturn(false);

        $this->repositoryMock->expects($this->once())->method('rollback');
        $this->repositoryMock->expects($this->never())->method('commit');

        $result = $this->sut->convert($leadId);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
    }

    /**
     * REG-LC5: Idempotencia: intento de conversion sobre Lead ya 'Converted' retorna 409 sin iniciar transaccion.
     */
    public function testRejectsAlreadyConvertedLeadWith409Conflict(): void
    {
        $this->repositoryMock
            ->method('findLeadById')
            ->willReturn([
                'id'     => 'lead-already-conv',
                'status' => 'Converted',
            ]);

        // La transaccion nunca debe iniciar
        $this->repositoryMock->expects($this->never())->method('beginTransaction');

        $result = $this->sut->convert('lead-already-conv');

        $this->assertFalse($result->isSuccess());
        $this->assertSame(409, $result->getCode());
        $this->assertSame('El Lead ya fue convertido anteriormente', $result->getError());
    }
}

