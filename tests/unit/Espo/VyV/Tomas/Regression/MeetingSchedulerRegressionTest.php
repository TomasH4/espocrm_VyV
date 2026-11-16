<?php
/**
 * MeetingSchedulerRegressionTest.php
 *
 * Suite de pruebas unitarias de REGRESION para MeetingScheduler.
 * Protege el calculo de duraciones temporales entre fechas, consistencia cronologica,
 * proyeccion de fechas de fin y manejo de zonas horarias/formatos corruptos.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Regression;

use Espo\VyV\Meeting\MeetingRepository;
use Espo\VyV\Meeting\MeetingScheduleResult;
use Espo\VyV\Meeting\MeetingScheduler;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class MeetingSchedulerRegressionTest extends TestCase
{
    private MeetingRepository&MockObject $repositoryMock;
    private MeetingScheduler $sut;

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(MeetingRepository::class);
        $this->sut = new MeetingScheduler($this->repositoryMock);
    }

    /**
     * REG-M1: Calculo exacto de duracion a traves de medianoche y cambios de fecha.
     */
    #[DataProvider('intervalDurationProvider')]
    public function testDurationCalculationAcrossDaysAndHours(
        string $start,
        string $end,
        int $expectedMinutes
    ): void {
        $this->repositoryMock
            ->expects($this->once())
            ->method('saveMeeting')
            ->with(
                $this->anything(),
                $this->identicalTo($start),
                $this->identicalTo($end),
                $this->identicalTo($expectedMinutes)
            )
            ->willReturn(true);

        $result = $this->sut->schedule([
            'name'      => 'Reunion Intervalo',
            'dateStart' => $start,
            'dateEnd'   => $end,
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(201, $result->getCode());
        $this->assertSame($expectedMinutes, $result->getDuration());
    }

    public static function intervalDurationProvider(): array
    {
        return [
            'Cruzando medianoche (23:30 a 01:00)' => ['2026-11-10 23:30:00', '2026-11-11 01:00:00', 90],
            'Intervalo de 45 minutos mismo dia'   => ['2026-11-10 14:00:00', '2026-11-10 14:45:00', 45],
            'Intervalo de 24 horas continuas'     => ['2026-11-10 09:00:00', '2026-11-11 09:00:00', 1440],
            'Intervalo de 48 horas (2 dias)'      => ['2026-11-10 09:00:00', '2026-11-12 09:00:00', 2880],
        ];
    }

    /**
     * REG-M2: Rechazo con error 422 ante inconsistencias temporales (fin <= inicio).
     */
    #[DataProvider('temporalInconsistencyProvider')]
    public function testSchedulerRejectsInconsistentDatesWith422(string $start, string $end): void
    {
        $this->repositoryMock->expects($this->never())->method('saveMeeting');

        $result = $this->sut->schedule([
            'name'      => 'Invalida',
            'dateStart' => $start,
            'dateEnd'   => $end,
        ]);

        $this->assertFalse($result->isSuccess());
        $this->assertSame(422, $result->getCode());
        $this->assertSame('La fecha de fin debe ser posterior a la fecha de inicio', $result->getError());
        $this->assertNull($result->getDuration());
    }

    public static function temporalInconsistencyProvider(): array
    {
        return [
            'Misma fecha y hora exacta (duracion 0)' => ['2026-11-10 10:00:00', '2026-11-10 10:00:00'],
            'Fin un minuto antes de inicio'          => ['2026-11-10 10:00:00', '2026-11-10 09:59:00'],
            'Fin un dia antes'                       => ['2026-11-10 10:00:00', '2026-11-09 10:00:00'],
        ];
    }

    /**
     * REG-M3: Proyeccion de fecha de fin a partir de dateStart y duracion especifica.
     */
    public function testProjectedDateEndMatchesDuration(): void
    {
        $start = '2026-11-10 15:00:00';
        $duration = 45; // 45 minutos
        $expectedEnd = '2026-11-10 15:45:00';

        $this->repositoryMock
            ->expects($this->once())
            ->method('saveMeeting')
            ->with(
                $this->anything(),
                $this->identicalTo($start),
                $this->identicalTo($expectedEnd),
                $this->identicalTo(45)
            )
            ->willReturn(true);

        $result = $this->sut->schedule([
            'name'      => 'Duracion Manual',
            'dateStart' => $start,
            'duration'  => $duration,
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame($expectedEnd, $result->getDateEnd());
        $this->assertSame(45, $result->getDuration());
    }

    /**
     * REG-M4: Asignacion de duracion por defecto de 60 minutos cuando se omiten dateEnd y duration.
     */
    public function testDefaultDurationOf60MinutesWhenBothOmitted(): void
    {
        $start = '2026-11-10 09:00:00';
        $expectedEnd = '2026-11-10 10:00:00';

        $this->repositoryMock
            ->expects($this->once())
            ->method('saveMeeting')
            ->with(
                $this->anything(),
                $this->identicalTo($start),
                $this->identicalTo($expectedEnd),
                $this->identicalTo(60)
            )
            ->willReturn(true);

        $result = $this->sut->schedule([
            'name'      => 'Reunion 1h Default',
            'dateStart' => $start,
        ]);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(60, $result->getDuration());
        $this->assertSame($expectedEnd, $result->getDateEnd());
    }

    /**
     * REG-M5: Rechazo seguro con error 400 ante formatos corruptos de fecha.
     */
    public function testSchedulerCatchesCorruptDateFormatsWith400(): void
    {
        $this->repositoryMock->expects($this->never())->method('saveMeeting');

        // Formato invalido en dateStart
        $badStart = $this->sut->schedule([
            'dateStart' => 'no-es-una-fecha',
        ]);
        $this->assertFalse($badStart->isSuccess());
        $this->assertSame(400, $badStart->getCode());
        $this->assertSame('Formato de fecha de inicio invalido', $badStart->getError());

        // Formato invalido en dateEnd
        $badEnd = $this->sut->schedule([
            'dateStart' => '2026-11-10 10:00:00',
            'dateEnd'   => 'cadena-corrupta',
        ]);
        $this->assertFalse($badEnd->isSuccess());
        $this->assertSame(400, $badEnd->getCode());
        $this->assertSame('Formato de fecha de fin invalido', $badEnd->getError());
    }
}

