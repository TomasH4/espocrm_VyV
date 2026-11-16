<?php
/**
 * ContactSearcherRegressionTest.php
 *
 * Suite de pruebas unitarias de REGRESION para ContactSearcher.
 * Protege la logica de busqueda (exacta vs parcial), truncado defensivo,
 * limites de paginacion y comportamiento ante colecciones vacias.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Regression;

use Espo\VyV\Contact\ContactRepository;
use Espo\VyV\Contact\ContactSearchResult;
use Espo\VyV\Contact\ContactSearcher;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class ContactSearcherRegressionTest extends TestCase
{
    private ContactRepository&MockObject $repositoryMock;
    private ContactSearcher $sut;

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(ContactRepository::class);
        $this->sut = new ContactSearcher($this->repositoryMock);
    }

    /**
     * REG-C1: Limite defensivo: queries que exceden 100 caracteres se truncan estrictamente a 100.
     */
    public function testQueryBeyond100CharactersIsDefensivelyTruncated(): void
    {
        $oversizedQuery = str_repeat('a', 150);
        $expectedTruncated = str_repeat('a', 100);

        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->callback(function (array $where) use ($expectedTruncated): bool {
                    return $where['type'] === 'partial' &&
                           $where['value'] === '%' . $expectedTruncated . '%';
                }),
                $this->isNull(),
                $this->identicalTo(20)
            )
            ->willReturn([]);

        $this->sut->search(['query' => $oversizedQuery]);
    }

    /**
     * REG-C2: Búsqueda con comillas dobles completas genera tipo 'exact' sin las comillas envolventes.
     */
    public function testExactSearchWithCompleteQuotesStripsQuotesAndSetsExactType(): void
    {
        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->callback(function (array $where): bool {
                    return $where['type'] === 'exact' &&
                           $where['field'] === 'name' &&
                           $where['value'] === 'Carlos Gomez';
                }),
                $this->isNull(),
                $this->identicalTo(20)
            )
            ->willReturn([['id' => 'c-1', 'name' => 'Carlos Gomez']]);

        $result = $this->sut->search(['query' => '"Carlos Gomez"']);

        $this->assertTrue($result->isSuccess());
        $this->assertSame(1, $result->getTotal());
        $this->assertCount(1, $result->getData());
    }

    /**
     * REG-C3: Comillas impares o no cerradas se degradan defensivamente a busqueda parcial (LIKE).
     */
    public function testUnclosedQuotesFallBackToPartialSearchSafely(): void
    {
        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->callback(function (array $where): bool {
                    return $where['type'] === 'partial' &&
                           $where['value'] === '%"Carlos Gomez%';
                }),
                $this->isNull(),
                $this->identicalTo(20)
            )
            ->willReturn([]);

        $result = $this->sut->search(['query' => '"Carlos Gomez']);

        $this->assertTrue($result->isSuccess());
        $this->assertSame('No Data', $result->getMessage());
    }

    /**
     * REG-C4: Invariante de paginacion: limites negativos o no numericos aplican default de 20.
     */
    public function testInvalidOrZeroLimitFallsBackToDefault20(): void
    {
        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->anything(),
                $this->anything(),
                $this->identicalTo(20) // debe ser exactamente 20
            )
            ->willReturn([]);

        $this->sut->search(['limit' => -5]);
    }

    /**
     * REG-C5: Invariante de ContactSearchResult: diferencia claramente getTotal() > 0 vs getTotal() === 0 ("No Data").
     */
    public function testResultObjectContractDataVersusEmpty(): void
    {
        // Con datos
        $withData = ContactSearchResult::successWithData(200, [['id' => '1', 'name' => 'Ana']]);
        $this->assertTrue($withData->isSuccess());
        $this->assertSame(1, $withData->getTotal());
        $this->assertSame(200, $withData->getCode());
        $this->assertCount(1, $withData->getData());
        $this->assertNull($withData->getMessage());
        $this->assertNull($withData->getError());

        // Vacio
        $empty = ContactSearchResult::successEmpty(200, 'No Data');
        $this->assertTrue($empty->isSuccess());
        $this->assertSame(0, $empty->getTotal());
        $this->assertSame('No Data', $empty->getMessage());
        $this->assertEmpty($empty->getData());
    }
}
