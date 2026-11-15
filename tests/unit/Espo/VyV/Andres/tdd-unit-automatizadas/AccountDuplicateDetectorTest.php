<?php
/**
 * AccountDuplicateDetectorTest.php
 *
 * Suite de pruebas unitarias automatizadas para AccountDuplicateDetector
 * aplicando TDD (Red -> Green -> Refactor), FIRST, AAA y Test Doubles.
 *
 * Funcionalidad 5 (Andres Bedoya) - VyV EspoCRM
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Andres;

use Espo\VyV\AccountDeduplication\AccountDuplicateDetector;
use Espo\VyV\AccountDeduplication\AccountDuplicateResult;
use Espo\VyV\AccountDeduplication\AccountSearchRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class AccountDuplicateDetectorTest extends TestCase
{
    /**
     * @var AccountSearchRepository&MockObject
     */
    private AccountSearchRepository&MockObject $repositoryMock;

    private AccountDuplicateDetector $sut;

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(AccountSearchRepository::class);
        $this->sut = new AccountDuplicateDetector($this->repositoryMock);
    }

    /**
     * [Camino P1]: Rechazo cuando name de la cuenta es vacio.
     */
    public function testDetectFailsWhenAccountNameIsEmpty(): void
    {
        // Arrange
        $this->repositoryMock->expects($this->never())->method('findBySicCode');

        $input = [
            'name'    => '',
            'sicCode' => '900123456',
        ];

        // Act
        $result = $this->sut->detect($input);

        // Assert
        $this->assertInstanceOf(AccountDuplicateResult::class, $result);
        $this->assertFalse($result->isSuccess());
        $this->assertSame(400, $result->getCode());
        $this->assertStringContainsString('name de la cuenta es obligatorio', $result->getError());
    }

    /**
     * [Camino P2]: Coincidencia exacta por identificador tributario (NIT/Tax ID) otorga +90 score (High).
     */
    public function testDetectIdentifiesHighDuplicateByTaxIdMatch(): void
    {
        // Arrange
        $sicCode = '9001234567';
        $existingAccount = [
            'id'   => 'acc-existing-01',
            'name' => 'Compania Global de Software S.A.S.',
        ];

        $this->repositoryMock
            ->expects($this->once())
            ->method('findBySicCode')
            ->with($this->identicalTo($sicCode))
            ->willReturn($existingAccount);

        $this->repositoryMock
            ->method('findCandidatesByName')
            ->willReturn([]);

        $input = [
            'name'    => 'Compania Global de Software',
            'sicCode' => '900.123.456-7', // Con caracteres especiales que deben normalizarse
        ];

        // Act
        $result = $this->sut->detect($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertTrue($result->isDuplicate());
        $this->assertSame(90, $result->getMatchScore());
        $this->assertSame('High', $result->getMatchLevel());
        $this->assertSame('acc-existing-01', $result->getMatchedAccountId());
        $this->assertStringContainsString('tributario', $result->getDetectionReason());
    }

    /**
     * [Camino P3]: Coincidencia exacta de razon social tras remover sufijos legales (S.A.S, S.A., LLC).
     */
    public function testDetectIdentifiesDuplicateByNormalizedCorporateName(): void
    {
        // Arrange: "Acme Industrial S.A.S." vs "Acme Industrial Ltda." -> limpios son "acme industrial"
        $this->repositoryMock->method('findBySicCode')->willReturn(null);

        $candidates = [
            [
                'id'           => 'acc-acme-10',
                'name'         => 'Acme Industrial Ltda.',
                'website'      => null,
                'emailAddress' => null,
            ],
        ];

        $this->repositoryMock
            ->expects($this->once())
            ->method('findCandidatesByName')
            ->willReturn($candidates);

        $input = [
            'name' => 'Acme Industrial S.A.S.',
        ];

        // Act
        $result = $this->sut->detect($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertTrue($result->isDuplicate());
        $this->assertSame(70, $result->getMatchScore());
        $this->assertSame('High', $result->getMatchLevel());
        $this->assertSame('acc-acme-10', $result->getMatchedAccountId());
    }

    /**
     * [Camino P4 / Levenshtein]: Similitud >= 80% en candidatos otorga +40 puntos (Moderate).
     */
    public function testDetectIdentifiesModerateDuplicateByLevenshteinSimilarity(): void
    {
        // Arrange: "Soluciones Globale" vs "Soluciones Globales" (distancia 1 sobre 19 = 94.7% similitud)
        $this->repositoryMock->method('findBySicCode')->willReturn(null);

        $candidates = [
            [
                'id'           => 'acc-sol-01',
                'name'         => 'Soluciones Globales',
                'website'      => null,
                'emailAddress' => null,
            ],
        ];

        $this->repositoryMock->method('findCandidatesByName')->willReturn($candidates);

        $input = [
            'name' => 'Soluciones Globale',
        ];

        // Act
        $result = $this->sut->detect($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertTrue($result->isDuplicate());
        $this->assertSame(40, $result->getMatchScore());
        $this->assertSame('Moderate', $result->getMatchLevel());
        $this->assertSame('acc-sol-01', $result->getMatchedAccountId());
    }

    /**
     * [Camino P5]: Coincidencia por dominio web corporativo otorga +30 puntos.
     */
    public function testDetectConsidersCorporateWebsiteDomainMatch(): void
    {
        // Arrange
        $this->repositoryMock->method('findBySicCode')->willReturn(null);
        $this->repositoryMock->method('findCandidatesByName')->willReturn([]);

        $this->repositoryMock
            ->expects($this->once())
            ->method('findByDomain')
            ->with('acme.com')
            ->willReturn(['id' => 'acc-web-match', 'name' => 'Acme Holding']);

        $input = [
            'name'    => 'Nueva Empresa Desconocida',
            'website' => 'https://www.acme.com/nosotros', // URL sucia
        ];

        // Act
        $result = $this->sut->detect($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(30, $result->getMatchScore());
        $this->assertSame('Low', $result->getMatchLevel()); // 30 < 40 -> Low
        $this->assertFalse($result->isDuplicate());
    }

    /**
     * [Camino P7]: Combinacion de similitud de nombre (40) + dominio web (30) suma 70 puntos -> High.
     */
    public function testDetectCombinesNameSimilarityAndWebsiteToReachHighRisk(): void
    {
        // Arrange
        $this->repositoryMock->method('findBySicCode')->willReturn(null);

        $candidates = [
            ['id' => 'acc-combo', 'name' => 'Tecnologia Innovadora', 'website' => null, 'emailAddress' => null]
        ];
        $this->repositoryMock->method('findCandidatesByName')->willReturn($candidates);

        $this->repositoryMock
            ->method('findByDomain')
            ->willReturn(['id' => 'acc-combo', 'name' => 'Tecnologia Innovadora']);

        $input = [
            'name'    => 'Tecnologias Innovadoras', // Levenshtein ~90% -> +40 pts
            'website' => 'http://innovadora.tech',   // Dominio web -> +30 pts
        ];

        // Act
        $result = $this->sut->detect($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(70, $result->getMatchScore()); // 40 + 30 = 70
        $this->assertSame('High', $result->getMatchLevel());
        $this->assertTrue($result->isDuplicate());
    }

    /**
     * [Camino P8]: Ignora dominios de correo electronico genericos (gmail, hotmail, yahoo).
     */
    public function testDetectIgnoresGenericEmailDomains(): void
    {
        // Arrange
        $this->repositoryMock->method('findBySicCode')->willReturn(null);
        $this->repositoryMock->method('findCandidatesByName')->willReturn([]);

        // findByDomain NO debe ser invocado con 'gmail.com'
        $this->repositoryMock->expects($this->never())->method('findByDomain');

        $input = [
            'name'         => 'Empresa de Juan Perez',
            'emailAddress' => 'contacto.juanperez@gmail.com', // Correo genérico
        ];

        // Act
        $result = $this->sut->detect($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(0, $result->getMatchScore());
        $this->assertSame('Low', $result->getMatchLevel());
        $this->assertFalse($result->isDuplicate());
    }

    /**
     * [Camino P9]: Cuenta completamente unica sin coincidencias retorna Score 0 y Low.
     */
    public function testDetectReturnsLowRiskWhenAccountIsUnique(): void
    {
        // Arrange
        $this->repositoryMock->method('findBySicCode')->willReturn(null);
        $this->repositoryMock->method('findCandidatesByName')->willReturn([]);
        $this->repositoryMock->method('findByDomain')->willReturn(null);

        $input = [
            'name'         => 'StartUp Totalmente Nueva 2026',
            'sicCode'      => '999888777',
            'website'      => 'https://nueva2026.io',
            'emailAddress' => 'info@nueva2026.io',
        ];

        // Act
        $result = $this->sut->detect($input);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(0, $result->getMatchScore());
        $this->assertSame('Low', $result->getMatchLevel());
        $this->assertFalse($result->isDuplicate());
        $this->assertNull($result->getMatchedAccountId());
    }
}
