<?php
/**
 * LeadCreatorTest.php
 *
 * Suite de pruebas unitarias automatizadas para LeadCreator
 * aplicando la metodologia TDD (Red -> Green -> Refactor).
 *
 * Principios FIRST:
 *   Fast        - Sin dependencias de red ni BD real (mocks).
 *   Independent - Cada test crea su propio doble de prueba.
 *   Repeatable  - Mismo resultado en cualquier entorno.
 *   Self-Validating - Solo assertiones, sin inspeccion manual.
 *   Timely      - Tests escritos antes que la implementacion.
 *
 * Patron AAA (Arrange / Act / Assert) en cada test.
 * Aserciones fluidas mediante PHPUnit encadenado.
 * Test Doubles: Mocks del repositorio (LeadRepository).
 *
 * Funcionalidad 1 - VyV EspoCRM
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Lead;

use Espo\VyV\Lead\LeadCreationResult;
use Espo\VyV\Lead\LeadCreator;
use Espo\VyV\Lead\LeadRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class LeadCreatorTest extends TestCase
{
    // =========================================================================
    // INFRAESTRUCTURA DEL SUITE
    // =========================================================================

    /**
     * @var LeadRepository&MockObject
     * Test Double - Mock del repositorio de persistencia.
     * Permite aislar la logica de negocio sin tocar la BD real.
     */
    private LeadRepository&MockObject $repositoryMock;

    private LeadCreator $sut; // System Under Test

    protected function setUp(): void
    {
        // El mock sustituye la dependencia de infraestructura.
        $this->repositoryMock = $this->createMock(LeadRepository::class);
        $this->sut = new LeadCreator($this->repositoryMock);
    }

    // =========================================================================
    // CICLO TDD: RED -> GREEN -> REFACTOR
    //
    // La siguiente secuencia documenta el orden de escritura de las pruebas
    // tal como se desarrollaron con la metodologia TDD:
    //
    //   FASE RED   (prueba escrita ANTES de la implementacion, falla):
    //     - testCreateLeadFailsWhenLastNameIsEmpty                 [CP-CB-01]
    //
    //   FASE GREEN (implementacion minima para pasar el test):
    //     Implementacion inicial: solo la validacion de lastName.
    //
    //   FASE REFACTOR (mejora sin romper tests existentes):
    //     Extraccion de LeadCreationResult como Value Object y
    //     separacion de la interfaz LeadRepository.
    //     Se agregan los restantes caminos de prueba:
    //     - testCreateLeadFailsWhenEmailFormatIsInvalid           [CP-CB-02]
    //     - testCreateLeadSucceedsWithAllValidFields              [CP-CB-03]
    //     - testCreateLeadSucceedsWithoutEmail                    [CP-CB-04]
    //     - testCreateLeadFailsWhenRepositoryReturnsFalse         [CP-CB-05]
    // =========================================================================

    // =========================================================================
    // CAMINO C1 - CP-CB-01
    // Nodo 2 -> No -> Nodo 3
    // Rechazo inmediato por apellido vacio.
    // =========================================================================

    /**
     * [TDD RED] Primer test escrito: verifica que sin apellido se retorne
     * un error 400 con el mensaje correcto.
     * El repositorio NO debe invocarse en este camino.
     */
    public function testCreateLeadFailsWhenLastNameIsEmpty(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->never()) // Test Double: se verifica que nunca se llama al repo
            ->method('save');

        $input = [
            'firstName'    => 'Carlos',
            'lastName'     => '',            // campo obligatorio vacio
            'emailAddress' => 'carlos@empresa.com',
            'phoneNumber'  => '3001234567',
        ];

        // Act
        $result = $this->sut->create($input);

        // Assert (aserciones fluidas encadenadas)
        $this->assertInstanceOf(LeadCreationResult::class, $result);
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('El campo lastName es obligatorio', $result->getError());
        $this->assertNull($result->getId());
    }

    /**
     * Variante: lastName nulo (clave ausente en el array).
     * Verifica que la ausencia del campo se trate igual que cadena vacia.
     */
    public function testCreateLeadFailsWhenLastNameKeyIsMissing(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('save');
        $input = ['firstName' => 'Maria'];

        // Act
        $result = $this->sut->create($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('lastName', $result->getError());
    }

    /**
     * Variante: lastName compuesto exclusivamente por espacios en blanco.
     * [REC-01]: Verifica que los espacios puros se consideren vacios tras trim()
     * y retornen error 400 sin invocar persistencia en BD.
     */
    public function testCreateLeadFailsWhenLastNameContainsOnlyWhitespace(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('save');
        $input = [
            'firstName'    => 'Carlos',
            'lastName'     => '     ', // solo espacios en blanco
            'emailAddress' => 'carlos@empresa.com',
            'phoneNumber'  => '3001234567',
        ];

        // Act
        $result = $this->sut->create($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('El campo lastName es obligatorio', $result->getError());
        $this->assertNull($result->getId());
    }

    // =========================================================================
    // CAMINO C2 - CP-CB-02
    // Nodo 2 -> Si -> Nodo 4 -> Si -> Nodo 6 -> No -> Nodo 7
    // Apellido presente, correo con formato invalido.
    // =========================================================================

    public function testCreateLeadFailsWhenEmailFormatIsInvalid(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('save');

        $input = [
            'firstName'    => 'Carlos',
            'lastName'     => 'Gomez',
            'emailAddress' => 'correo_sin_arroba.com', // formato invalido
            'phoneNumber'  => '3001234567',
        ];

        // Act
        $result = $this->sut->create($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('Formato de email invalido', $result->getError());
        $this->assertNull($result->getId());
    }

    /**
     * Variante valor limite: correo con arroba pero sin dominio.
     */
    public function testCreateLeadFailsWhenEmailHasAtSymbolButNoDomain(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('save');
        $input = [
            'firstName'    => 'Carlos',
            'lastName'     => 'Gomez',
            'emailAddress' => 'carlos@',
        ];

        // Act
        $result = $this->sut->create($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
    }

    // =========================================================================
    // CAMINO C3 - CP-CB-03
    // Nodo 2->Si -> Nodo 4->Si -> Nodo 6->Si -> Nodo 9 -> Nodo 10->Si -> Nodo 12
    // Camino principal exitoso: todos los campos validos.
    // =========================================================================

    public function testCreateLeadSucceedsWithAllValidFields(): void
    {
        // Arrange
        $generatedId = 'lead-uuid-abc-123';

        // Mock configurado para devolver un ID valido al llamar a save()
        $this->repositoryMock
            ->expects($this->once()) // se llama exactamente una vez
            ->method('save')
            ->with(
                $this->identicalTo('Carlos'),
                $this->identicalTo('Gomez'),
                $this->identicalTo('carlos.gomez@empresa.com'),
                $this->identicalTo('3001234567')
            )
            ->willReturn($generatedId);

        $input = [
            'firstName'    => 'Carlos',
            'lastName'     => 'Gomez',
            'emailAddress' => 'carlos.gomez@empresa.com',
            'phoneNumber'  => '3001234567',
        ];

        // Act
        $result = $this->sut->create($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(201, $result->getCode());
        $this->assertSame($generatedId, $result->getId());
        $this->assertSame('Carlos Gomez', $result->getFullName());
        $this->assertNull($result->getError());
    }

    // =========================================================================
    // CAMINO C4 - CP-CB-04
    // Nodo 2->Si -> Nodo 4->No -> Nodo 5 -> Nodo 9 -> Nodo 10->Si -> Nodo 12
    // Camino exitoso sin correo (email es opcional).
    // =========================================================================

    public function testCreateLeadSucceedsWithoutEmail(): void
    {
        // Arrange
        $generatedId = 'lead-uuid-def-456';

        // El repositorio debe recibir null en el argumento email
        $this->repositoryMock
            ->expects($this->once())
            ->method('save')
            ->with(
                $this->identicalTo('Carlos'),
                $this->identicalTo('Gomez'),
                $this->isNull(),            // email debe llegar como null
                $this->identicalTo('3001234567')
            )
            ->willReturn($generatedId);

        $input = [
            'firstName'    => 'Carlos',
            'lastName'     => 'Gomez',
            'emailAddress' => '',           // campo vacio = omitido
            'phoneNumber'  => '3001234567',
        ];

        // Act
        $result = $this->sut->create($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(201, $result->getCode());
        $this->assertSame($generatedId, $result->getId());
    }

    /**
     * Variante: clave emailAddress completamente ausente del array.
     */
    public function testCreateLeadSucceedsWhenEmailKeyIsAbsent(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('save')
            ->with(
                $this->anything(),
                $this->identicalTo('Ramirez'),
                $this->isNull(),
                $this->isNull()
            )
            ->willReturn('lead-uuid-ghi-789');

        $input = ['firstName' => 'Ana', 'lastName' => 'Ramirez'];

        // Act
        $result = $this->sut->create($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame('Ana Ramirez', $result->getFullName());
    }

    // =========================================================================
    // CAMINO C5 - CP-CB-05
    // Nodo 2->Si -> Nodo 4->Si -> Nodo 6->Si -> Nodo 9 -> Nodo 10->No -> Nodo 11
    // Datos validos pero fallo de persistencia en BD.
    // =========================================================================

    public function testCreateLeadFailsWhenRepositoryReturnsFalse(): void
    {
        // Arrange
        // Mock simula fallo de BD retornando null
        $this->repositoryMock
            ->expects($this->once())
            ->method('save')
            ->willReturn(null); // null = fallo de persistencia

        $input = [
            'firstName'    => 'Carlos',
            'lastName'     => 'Gomez',
            'emailAddress' => 'carlos.gomez@empresa.com',
            'phoneNumber'  => '3001234567',
        ];

        // Act
        $result = $this->sut->create($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
        $this->assertSame('Fallo en la persistencia de base de datos', $result->getError());
        $this->assertNull($result->getId());
    }

    // =========================================================================
    // PRUEBAS ADICIONALES - Casos de borde y limites
    // =========================================================================

    /**
     * Verifica que el nombre completo se construye correctamente
     * sin espacios dobles cuando firstName esta vacio.
     */
    public function testFullNameIsBuiltCorrectlyWhenFirstNameIsEmpty(): void
    {
        // Arrange
        $this->repositoryMock
            ->method('save')
            ->willReturn('lead-solo-apellido');

        $input = ['firstName' => '', 'lastName' => 'Torres'];

        // Act
        $result = $this->sut->create($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame('Torres', $result->getFullName()); // sin espacio inicial
    }

    /**
     * Verifica que los espacios extremos en los campos se eliminan
     * antes de procesarlos (trim).
     */
    public function testLeadInputIsStrippedOfWhitespace(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('save')
            ->with(
                $this->identicalTo('Carlos'),     // sin espacios
                $this->identicalTo('Gomez'),
                $this->identicalTo('carlos@empresa.com'),
                $this->isNull()
            )
            ->willReturn('lead-trim-test');

        $input = [
            'firstName'    => '  Carlos  ',
            'lastName'     => '  Gomez  ',
            'emailAddress' => '  carlos@empresa.com  ',
        ];

        // Act
        $result = $this->sut->create($input);

        // Assert
        $this->assertTrue($result->isSuccess());
    }

    /**
     * Verifica que un email valido con subdominio sea aceptado.
     */
    public function testCreateLeadAcceptsEmailWithSubdomain(): void
    {
        // Arrange
        $this->repositoryMock->method('save')->willReturn('lead-subdom');

        $input = [
            'firstName'    => 'Luis',
            'lastName'     => 'Perez',
            'emailAddress' => 'luis.perez@correo.empresa.co',
        ];

        // Act
        $result = $this->sut->create($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(201, $result->getCode());
    }
}

