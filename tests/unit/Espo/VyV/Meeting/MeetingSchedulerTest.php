<?php
/**
 * MeetingSchedulerTest.php
 *
 * Suite de pruebas unitarias automatizadas para MeetingScheduler
 * aplicando la metodologia TDD (Red -> Green -> Refactor).
 *
 * Funcionalidad 4: Validacion temporal y calculo de duracion al Agendar Reuniones
 *
 * Principios FIRST:
 *   Fast        - Ejecucion en milisegundos sin acceso a red ni BD real.
 *   Independent - Pruebas desacopladas con inicializacion en setUp().
 *   Repeatable  - Determinismo estricto con fechas fijas de prueba.
 *   Self-Validating - Resultado binario PASS/FAIL automatico sin intervencion manual.
 *   Timely      - Pruebas escritas con anterioridad al codigo de produccion (Fase RED).
 *
 * Patron AAA (Arrange / Act / Assert).
 * Aserciones fluidas encadenadas.
 * Test Doubles: Mock de MeetingRepository.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Meeting;

use Espo\VyV\Meeting\MeetingRepository;
use Espo\VyV\Meeting\MeetingScheduleResult;
use Espo\VyV\Meeting\MeetingScheduler;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class MeetingSchedulerTest extends TestCase
{
    /**
     * @var MeetingRepository&MockObject
     * Test Double - Mock del repositorio para aislar la persistencia en base de datos.
     */
    private MeetingRepository&MockObject $repositoryMock;

    private MeetingScheduler $sut; // System Under Test

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(MeetingRepository::class);
        $this->sut = new MeetingScheduler($this->repositoryMock);
    }

    // =========================================================================
    // CAMINO C1: CP-CB-01
    // Nodo 2 -> No -> Nodo 3
    // Rechazo inmediato por fecha/hora de inicio obligatoria ausente o vacia.
    // =========================================================================

    /**
     * [TDD RED] Verifica que si dateStart esta vacio se retorne un error 400
     * y nunca se invoque al repositorio.
     */
    public function testScheduleMeetingFailsWhenDateStartIsEmpty(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->never()) // El repositorio nunca debe llamarse
            ->method('saveMeeting');

        $input = [
            'name'      => 'Comite Tecnico',
            'dateStart' => '',
            'dateEnd'   => '2026-11-10 11:00:00',
            'duration'  => null,
        ];

        // Act
        $result = $this->sut->schedule($input);

        // Assert (Aserciones fluidas)
        $this->assertInstanceOf(MeetingScheduleResult::class, $result);
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('El campo dateStart es obligatorio', $result->getError());
        $this->assertNull($result->getDuration());
    }

    /**
     * Variante: clave dateStart ausente en el array de entrada.
     */
    public function testScheduleMeetingFailsWhenDateStartKeyIsMissing(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveMeeting');
        $input = ['name' => 'Reunion sin inicio'];

        // Act
        $result = $this->sut->schedule($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertSame('El campo dateStart es obligatorio', $result->getError());
    }

    // =========================================================================
    // CAMINO C2: CP-CB-02 & CP-CB-03
    // Nodo 2->Si -> Nodo 4->Si -> Nodo 5 -> No -> Nodo 6
    // Inconsistencia temporal: dateEnd menor o igual a dateStart -> Error 422.
    // =========================================================================

    /**
     * CP-CB-02: Regla de negocio negativa (fecha fin anterior a fecha inicio).
     */
    public function testScheduleMeetingFailsWhenDateEndIsBeforeDateStart(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveMeeting');

        $input = [
            'name'      => 'Revision Sprint',
            'dateStart' => '2026-11-10 10:00:00',
            'dateEnd'   => '2026-11-10 09:50:00', // 10 minutos antes
            'duration'  => null,
        ];

        // Act
        $result = $this->sut->schedule($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
        $this->assertSame('La fecha de fin debe ser posterior a la fecha de inicio', $result->getError());
    }

    /**
     * CP-CB-03: Valor limite (fecha fin exactamente igual a fecha inicio, duracion 0).
     */
    public function testScheduleMeetingFailsWhenDateEndIsEqualToDateStart(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('saveMeeting');

        $input = [
            'name'      => 'Standup Diario',
            'dateStart' => '2026-11-10 10:00:00',
            'dateEnd'   => '2026-11-10 10:00:00', // Mismo instante (duracion 0)
            'duration'  => null,
        ];

        // Act
        $result = $this->sut->schedule($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
        $this->assertSame('La fecha de fin debe ser posterior a la fecha de inicio', $result->getError());
    }

    // =========================================================================
    // CAMINO C3: CP-CB-04
    // Nodo 2->Si -> Nodo 4->Si -> Nodo 5->Si -> Nodo 7 -> Nodo 12 -> Nodo 13->Si -> Nodo 15
    // Calculo automatico de duracion a partir de dateStart y dateEnd.
    // =========================================================================

    public function testScheduleMeetingCalculatesDurationAutomaticallyWhenBothDatesProvided(): void
    {
        // Arrange
        // 10:00:00 a 11:30:00 = 90 minutos de duracion calculada
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveMeeting')
            ->with(
                $this->identicalTo('Demostracion Cliente'),
                $this->identicalTo('2026-11-10 10:00:00'),
                $this->identicalTo('2026-11-10 11:30:00'),
                $this->identicalTo(90)
            )
            ->willReturn(true);

        $input = [
            'name'      => 'Demostracion Cliente',
            'dateStart' => '2026-11-10 10:00:00',
            'dateEnd'   => '2026-11-10 11:30:00',
            'duration'  => null,
        ];

        // Act
        $result = $this->sut->schedule($input);

        // Assert (Aserciones fluidas encadenadas)
        $this->assertTrue($result->isSuccess());
        $this->assertSame(201, $result->getCode());
        $this->assertSame('Demostracion Cliente', $result->getName());
        $this->assertSame('2026-11-10 10:00:00', $result->getDateStart());
        $this->assertSame('2026-11-10 11:30:00', $result->getDateEnd());
        $this->assertSame(90, $result->getDuration());
        $this->assertNull($result->getError());
    }

    // =========================================================================
    // CAMINO C4: CP-CB-05
    // Nodo 2->Si -> Nodo 4->No -> Nodo 8->Si -> Nodo 10 -> Nodo 11 -> Nodo 12 -> Nodo 13->Si -> Nodo 15
    // Recalculo de dateEnd manteniendo la duracion provista por el usuario.
    // =========================================================================

    public function testScheduleMeetingCalculatesDateEndPreservingSpecifiedDuration(): void
    {
        // Arrange
        // Inicio: 11:00:00, duracion especificada: 60 min -> fin calculado: 12:00:00
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveMeeting')
            ->with(
                $this->identicalTo('Capacitacion QA'),
                $this->identicalTo('2026-11-10 11:00:00'),
                $this->identicalTo('2026-11-10 12:00:00'),
                $this->identicalTo(60)
            )
            ->willReturn(true);

        $input = [
            'name'      => 'Capacitacion QA',
            'dateStart' => '2026-11-10 11:00:00',
            'dateEnd'   => '',
            'duration'  => 60,
        ];

        // Act
        $result = $this->sut->schedule($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(201, $result->getCode());
        $this->assertSame('2026-11-10 12:00:00', $result->getDateEnd());
        $this->assertSame(60, $result->getDuration());
    }

    // =========================================================================
    // CAMINO C5: CP-CB-06
    // Nodo 2->Si -> Nodo 4->No -> Nodo 8->No -> Nodo 9 -> Nodo 11 -> Nodo 12 -> Nodo 13->Si -> Nodo 15
    // Duracion y dateEnd omitidos -> Asignacion por defecto de 60 min y calculo de dateEnd.
    // =========================================================================

    public function testScheduleMeetingAssignsDefaultDurationOf60MinutesWhenBothOmitted(): void
    {
        // Arrange
        // Inicio: 14:00:00, sin duracion ni dateEnd -> duracion 60 min, fin 15:00:00
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveMeeting')
            ->with(
                $this->identicalTo('Reunion General'),
                $this->identicalTo('2026-11-10 14:00:00'),
                $this->identicalTo('2026-11-10 15:00:00'),
                $this->identicalTo(60)
            )
            ->willReturn(true);

        $input = [
            'name'      => 'Reunion General',
            'dateStart' => '2026-11-10 14:00:00',
            'dateEnd'   => null,
            'duration'  => null,
        ];

        // Act
        $result = $this->sut->schedule($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(201, $result->getCode());
        $this->assertSame('2026-11-10 15:00:00', $result->getDateEnd());
        $this->assertSame(60, $result->getDuration());
    }

    // =========================================================================
    // CAMINO C6: CP-CB-07
    // Nodo 2->Si -> Nodo 4->Si -> Nodo 5->Si -> Nodo 7 -> Nodo 12 -> Nodo 13->No -> Nodo 14
    // Datos validos pero fallo en la persistencia de base de datos -> Error 500.
    // =========================================================================

    public function testScheduleMeetingFailsWhenDatabasePersistenceFails(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveMeeting')
            ->willReturn(false); // Simulacion de fallo en base de datos

        $input = [
            'name'      => 'Comite Directivo',
            'dateStart' => '2026-11-10 16:00:00',
            'dateEnd'   => '2026-11-10 17:00:00',
            'duration'  => null,
        ];

        // Act
        $result = $this->sut->schedule($input);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
        $this->assertSame('Fallo en la persistencia de base de datos', $result->getError());
    }

    // =========================================================================
    // PRUEBAS ADICIONALES: Sanitizacion y Valores Limite de Duracion
    // =========================================================================

    /**
     * Verifica que si se ingresa una duracion menor o igual a cero (ej. -15),
     * el sistema la descarte y aplique la duracion estandar por defecto (60 min).
     */
    public function testScheduleMeetingTreatsNegativeDurationAsDefault(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveMeeting')
            ->with(
                $this->anything(),
                $this->identicalTo('2026-11-10 08:00:00'),
                $this->identicalTo('2026-11-10 09:00:00'),
                $this->identicalTo(60)
            )
            ->willReturn(true);

        $input = [
            'dateStart' => '2026-11-10 08:00:00',
            'duration'  => -15, // duracion negativa invalida
        ];

        // Act
        $result = $this->sut->schedule($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(60, $result->getDuration());
    }

    /**
     * Verifica que los espacios en blanco alrededor de las fechas
     * sean removidos mediante trim antes de procesar el timestamp.
     */
    public function testScheduleMeetingTrimsWhitespaceFromDates(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveMeeting')
            ->with(
                $this->anything(),
                $this->identicalTo('2026-11-10 10:00:00'),
                $this->identicalTo('2026-11-10 10:45:00'),
                $this->identicalTo(45)
            )
            ->willReturn(true);

        $input = [
            'name'      => '  Sincronizacion  ',
            'dateStart' => '  2026-11-10 10:00:00  ',
            'dateEnd'   => '  2026-11-10 10:45:00  ',
        ];

        // Act
        $result = $this->sut->schedule($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame('Sincronizacion', $result->getName());
        $this->assertSame(45, $result->getDuration());
    }
}

