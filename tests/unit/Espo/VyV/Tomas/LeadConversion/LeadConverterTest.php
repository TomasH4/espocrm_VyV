<?php
/**
 * LeadConverterTest.php
 *
 * Suite de pruebas unitarias automatizadas para LeadConverter
 * aplicando la metodologia TDD (Red -> Green -> Refactor).
 *
 * Funcionalidad 5: Conversion Transaccional de Lead en Contacto y Cuenta
 *
 * Principios FIRST:
 *   Fast        - Ejecucion en milisegundos mediante dobles de prueba (Mocks).
 *   Independent - Pruebas desacopladas sin estado compartido entre tests.
 *   Repeatable  - Determinismo estricto sin acceso a base de datos real.
 *   Self-Validating - Evaluacion binaria automatica PASS/FAIL por PHPUnit.
 *   Timely      - Pruebas disenadas e implementadas antes que el codigo productivo.
 *
 * Patron AAA (Arrange / Act / Assert).
 * Aserciones fluidas encadenadas.
 * Test Doubles: Mock de LeadConversionRepository.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\LeadConversion;

use Espo\VyV\LeadConversion\LeadConversionRepository;
use Espo\VyV\LeadConversion\LeadConversionResult;
use Espo\VyV\LeadConversion\LeadConverter;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class LeadConverterTest extends TestCase
{
    /**
     * @var LeadConversionRepository&MockObject
     * Test Double - Mock del repositorio para aislar las transacciones en BD.
     */
    private LeadConversionRepository&MockObject $repositoryMock;

    private LeadConverter $sut; // System Under Test

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(LeadConversionRepository::class);
        $this->sut = new LeadConverter($this->repositoryMock);
    }

    // =========================================================================
    // CAMINO C1: CP-CB-01
    // Nodo 2 -> No -> Nodo 3
    // Rechazo inmediato por identificador de Lead ausente o vacio.
    // =========================================================================

    /**
     * [TDD RED] Verifica que un leadId vacio retorne error 400
     * y nunca inicie transacciones ni consulte la base de datos.
     */
    public function testConvertLeadFailsWhenLeadIdIsEmpty(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('findLeadById');
        $this->repositoryMock->expects($this->never())->method('beginTransaction');

        // Act
        $result = $this->sut->convert('');

        // Assert (Aserciones fluidas)
        $this->assertInstanceOf(LeadConversionResult::class, $result);
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('El identificador del Lead es obligatorio', $result->getError());
        $this->assertNull($result->getContactId());
        $this->assertNull($result->getAccountId());
    }

    // =========================================================================
    // CAMINO C2: CP-CB-02
    // Nodo 2->Si -> Nodo 4 -> No -> Nodo 5
    // Lead no encontrado en la base de datos -> Error 404.
    // =========================================================================

    public function testConvertLeadFailsWhenLeadNotFoundInDatabase(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('findLeadById')
            ->with($this->identicalTo('lead-999-inexistente'))
            ->willReturn(null); // No existe en BD

        $this->repositoryMock->expects($this->never())->method('beginTransaction');

        // Act
        $result = $this->sut->convert('lead-999-inexistente');

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(404, $result->getCode());
        $this->assertSame('Lead no encontrado en la base de datos', $result->getError());
    }

    // =========================================================================
    // CAMINO C3: CP-CB-03
    // Nodo 2->Si -> Nodo 4->Si -> Nodo 6 -> No -> Nodo 7
    // Restriccion de estado: Lead ya convertido (status = 'Converted') -> Error 409.
    // =========================================================================

    public function testConvertLeadFailsWhenLeadIsAlreadyConverted(): void
    {
        // Arrange
        $convertedLead = [
            'id'     => 'lead-123',
            'status' => 'Converted', // Ya fue convertido
            'name'   => 'Lead Ya Procesado',
        ];

        $this->repositoryMock
            ->expects($this->once())
            ->method('findLeadById')
            ->with($this->identicalTo('lead-123'))
            ->willReturn($convertedLead);

        $this->repositoryMock->expects($this->never())->method('beginTransaction');

        // Act
        $result = $this->sut->convert('lead-123');

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(409, $result->getCode());
        $this->assertSame('El Lead ya fue convertido anteriormente', $result->getError());
    }

    // =========================================================================
    // CAMINO C4: CP-CB-04
    // Nodo 2->Si -> Nodo 4->Si -> Nodo 6->Si -> Nodo 8 -> Nodo 9->Si -> Nodo 10 -> Nodo 12 -> Nodo 13 -> Nodo 14->Si -> Nodo 16
    // Conversion completa con empresa: Crea Cuenta, crea Contacto vinculado, actualiza Lead y confirma.
    // =========================================================================

    public function testConvertLeadSucceedsWithAccountAndContactLinkage(): void
    {
        // Arrange
        $leadData = [
            'id'          => 'lead-456',
            'status'      => 'Assigned',
            'firstName'   => 'Carlos',
            'lastName'    => 'Gomez',
            'email'       => 'cgomez@empresa.com',
            'phone'       => '+573001234567',
            'accountName' => 'Empresa Gomez S.A.',
        ];

        $this->repositoryMock
            ->expects($this->once())
            ->method('findLeadById')
            ->with($this->identicalTo('lead-456'))
            ->willReturn($leadData);

        // Transaccionalidad
        $this->repositoryMock->expects($this->once())->method('beginTransaction');
        $this->repositoryMock->expects($this->once())->method('commit');
        $this->repositoryMock->expects($this->never())->method('rollback');

        // Creacion de Cuenta
        $this->repositoryMock
            ->expects($this->once())
            ->method('createAccount')
            ->with($this->identicalTo([
                'name'  => 'Empresa Gomez S.A.',
                'phone' => '+573001234567',
            ]))
            ->willReturn('acc-new-777');

        // Creacion de Contacto vinculado a la nueva Cuenta
        $this->repositoryMock
            ->expects($this->once())
            ->method('createContact')
            ->with($this->identicalTo([
                'firstName' => 'Carlos',
                'lastName'  => 'Gomez',
                'email'     => 'cgomez@empresa.com',
                'phone'     => '+573001234567',
                'accountId' => 'acc-new-777', // Integridad referencial
            ]))
            ->willReturn('con-new-888');

        // Actualizacion del Lead original
        $this->repositoryMock
            ->expects($this->once())
            ->method('updateLead')
            ->with(
                $this->identicalTo('lead-456'),
                $this->identicalTo([
                    'status'    => 'Converted',
                    'contactId' => 'con-new-888',
                    'accountId' => 'acc-new-777',
                ])
            )
            ->willReturn(true);

        // Act
        $result = $this->sut->convert('lead-456');

        // Assert (Aserciones fluidas encadenadas)
        $this->assertTrue($result->isSuccess());
        $this->assertSame(201, $result->getCode());
        $this->assertSame('con-new-888', $result->getContactId());
        $this->assertSame('acc-new-777', $result->getAccountId());
        $this->assertNull($result->getError());
    }

    // =========================================================================
    // CAMINO C5: CP-CB-05
    // Nodo 2->Si -> Nodo 4->Si -> Nodo 6->Si -> Nodo 8 -> Nodo 9->No -> Nodo 11 -> Nodo 12 -> Nodo 13 -> Nodo 14->Si -> Nodo 16
    // Conversion sin empresa: accountName vacio -> Omite creacion de Cuenta (accountId = null).
    // =========================================================================

    public function testConvertLeadSucceedsWithoutAccountWhenAccountNameIsEmpty(): void
    {
        // Arrange
        $leadData = [
            'id'          => 'lead-789',
            'status'      => 'In Process',
            'firstName'   => 'Maria',
            'lastName'    => 'Torres',
            'email'       => 'mtorres@correo.com',
            'phone'       => '+573109876543',
            'accountName' => '', // Sin empresa
        ];

        $this->repositoryMock
            ->expects($this->once())
            ->method('findLeadById')
            ->willReturn($leadData);

        $this->repositoryMock->expects($this->once())->method('beginTransaction');
        $this->repositoryMock->expects($this->once())->method('commit');

        // No debe crear cuenta
        $this->repositoryMock->expects($this->never())->method('createAccount');

        // Crea Contacto con accountId = null
        $this->repositoryMock
            ->expects($this->once())
            ->method('createContact')
            ->with($this->callback(function (array $contact) {
                return $contact['accountId'] === null
                    && $contact['firstName'] === 'Maria'
                    && $contact['lastName'] === 'Torres';
            }))
            ->willReturn('con-single-999');

        // Actualiza Lead con accountId = null
        $this->repositoryMock
            ->expects($this->once())
            ->method('updateLead')
            ->with(
                $this->identicalTo('lead-789'),
                $this->identicalTo([
                    'status'    => 'Converted',
                    'contactId' => 'con-single-999',
                    'accountId' => null,
                ])
            )
            ->willReturn(true);

        // Act
        $result = $this->sut->convert('lead-789');

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(201, $result->getCode());
        $this->assertSame('con-single-999', $result->getContactId());
        $this->assertNull($result->getAccountId());
    }

    // =========================================================================
    // CAMINO C6: CP-CB-06
    // Nodo 2->Si -> Nodo 4->Si -> Nodo 6->Si -> Nodo 8 -> Nodo 9 -> Nodo 10 -> Nodo 12 -> Nodo 14->No -> Nodo 15
    // Fallo transaccional: fallo al crear contacto -> Reversion total (Rollback) y Error 500.
    // =========================================================================

    public function testConvertLeadExecutesRollbackWhenContactCreationFails(): void
    {
        // Arrange
        $leadData = [
            'id'          => 'lead-456',
            'status'      => 'Assigned',
            'firstName'   => 'Carlos',
            'lastName'    => 'Gomez',
            'email'       => 'cgomez@empresa.com',
            'phone'       => '+573001234567',
            'accountName' => 'Empresa XYZ',
        ];

        $this->repositoryMock->expects($this->once())->method('findLeadById')->willReturn($leadData);
        $this->repositoryMock->expects($this->once())->method('beginTransaction');
        $this->repositoryMock->expects($this->once())->method('createAccount')->willReturn('acc-temp-1');

        // Fallo en la creacion del Contacto (retorna null)
        $this->repositoryMock->expects($this->once())->method('createContact')->willReturn(null);

        // Atomicidad: debe ejecutar rollback y NO commit
        $this->repositoryMock->expects($this->once())->method('rollback');
        $this->repositoryMock->expects($this->never())->method('commit');
        $this->repositoryMock->expects($this->never())->method('updateLead');

        // Act
        $result = $this->sut->convert('lead-456');

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
        $this->assertSame('Fallo en la transaccion de conversion del Lead', $result->getError());
    }

    /**
     * Variante C6: La creacion del Contacto es exitosa pero falla el updateLead.
     * Verifica que la atomicidad cubra la actualizacion del Lead original.
     */
    public function testConvertLeadExecutesRollbackWhenLeadUpdateFails(): void
    {
        // Arrange
        $leadData = [
            'id'          => 'lead-456',
            'status'      => 'Assigned',
            'firstName'   => 'Carlos',
            'lastName'    => 'Gomez',
            'accountName' => null,
        ];

        $this->repositoryMock->expects($this->once())->method('findLeadById')->willReturn($leadData);
        $this->repositoryMock->expects($this->once())->method('beginTransaction');
        $this->repositoryMock->expects($this->once())->method('createContact')->willReturn('con-ok');

        // Falla la actualizacion del Lead en BD
        $this->repositoryMock->expects($this->once())->method('updateLead')->willReturn(false);

        // Atomicidad: ejecucion de rollback
        $this->repositoryMock->expects($this->once())->method('rollback');
        $this->repositoryMock->expects($this->never())->method('commit');

        // Act
        $result = $this->sut->convert('lead-456');

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
    }

    // =========================================================================
    // PRUEBAS ADICIONALES: Sanitizacion y Propagacion de Datos Especiales
    // =========================================================================

    /**
     * Verifica que el leadId con espacios en blanco sea sanitizado con trim.
     */
    public function testConvertLeadTrimsWhitespaceFromLeadId(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('findLeadById')
            ->with($this->identicalTo('lead-clean-id'))
            ->willReturn(null);

        // Act
        $result = $this->sut->convert('  lead-clean-id  ');

        // Assert
        $this->assertSame(404, $result->getCode());
    }

    /**
     * Verifica que los campos especiales (email complejo y telefono con prefijo internacional)
     * se propaguen sin truncamiento ni corrupcion.
     */
    public function testConvertLeadPropagatesSpecialCharactersAccurately(): void
    {
        // Arrange
        $complexLead = [
            'id'          => 'lead-complex',
            'status'      => 'New',
            'firstName'   => 'Juan-José',
            'lastName'    => "O'Connor",
            'email'       => 'juan.jose+test@sub.empresa-global.org',
            'phone'       => '+57 (300) 123-4567 ext 102',
            'accountName' => null,
        ];

        $this->repositoryMock->method('findLeadById')->willReturn($complexLead);
        $this->repositoryMock->method('updateLead')->willReturn(true);

        $this->repositoryMock
            ->expects($this->once())
            ->method('createContact')
            ->with($this->identicalTo([
                'firstName' => 'Juan-José',
                'lastName'  => "O'Connor",
                'email'     => 'juan.jose+test@sub.empresa-global.org',
                'phone'     => '+57 (300) 123-4567 ext 102',
                'accountId' => null,
            ]))
            ->willReturn('con-complex-id');

        // Act
        $result = $this->sut->convert('lead-complex');

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame('con-complex-id', $result->getContactId());
    }
}

