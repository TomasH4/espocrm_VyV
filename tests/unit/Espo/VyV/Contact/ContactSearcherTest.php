<?php
/**
 * ContactSearcherTest.php
 *
 * Suite de pruebas unitarias automatizadas para ContactSearcher
 * aplicando la metodologia TDD (Red -> Green -> Refactor).
 *
 * Funcionalidad 3: Busqueda y Filtrado de Contactos (Contact Search & Filtering)
 *
 * Principios FIRST:
 *   Fast        - Ejecucion en milisegundos mediante dobles de prueba (Mocks).
 *   Independent - Pruebas desacopladas sin dependencias cruzadas de estado.
 *   Repeatable  - Resultados identicos y deterministas en cualquier entorno.
 *   Self-Validating - Evaluacion binaria automatica PASS/FAIL por PHPUnit.
 *   Timely      - Pruebas escritas previo al codigo de produccion (Fase RED).
 *
 * Patron AAA (Arrange / Act / Assert).
 * Aserciones fluidas encadenadas.
 * Test Doubles: Mock de ContactRepository.
 */

declare(strict_types=1);

namespace tests\unit\Espo\VyV\Contact;

use Espo\VyV\Contact\ContactRepository;
use Espo\VyV\Contact\ContactSearchResult;
use Espo\VyV\Contact\ContactSearcher;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class ContactSearcherTest extends TestCase
{
    /**
     * @var ContactRepository&MockObject
     * Test Double - Mock del repositorio para aislar las consultas a base de datos.
     */
    private ContactRepository&MockObject $repositoryMock;

    private ContactSearcher $sut; // System Under Test

    protected function setUp(): void
    {
        $this->repositoryMock = $this->createMock(ContactRepository::class);
        $this->sut = new ContactSearcher($this->repositoryMock);
    }

    // =========================================================================
    // CAMINO C1: CP-CB-01
    // Nodo 2->Si -> Nodo 3->Si -> Nodo 4 -> Nodo 7->No -> Nodo 9 -> Nodo 10 -> Nodo 11->Si -> Nodo 13->Si -> Nodo 14
    // Busqueda exacta entre comillas dobles ("Carlos Gomez") -> clausula exact = 'Carlos Gomez'.
    // =========================================================================

    /**
     * [TDD RED] Verifica que un termino entre comillas dobles genere una
     * clausula de busqueda exacta y retorne los contactos coincidentes.
     */
    public function testSearchContactsWithExactMatchQuotes(): void
    {
        // Arrange
        $expectedClause = [
            'type'  => 'exact',
            'field' => 'name',
            'value' => 'Carlos Gomez',
        ];

        $fakeRecords = [
            ['id' => 'c-1', 'name' => 'Carlos Gomez', 'email' => 'cgomez@empresa.com'],
        ];

        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->identicalTo($expectedClause),
                $this->isNull(), // filter == 'all' -> null
                $this->identicalTo(20)
            )
            ->willReturn($fakeRecords);

        $params = [
            'query'  => '"Carlos Gomez"',
            'filter' => 'all',
            'limit'  => 20,
        ];

        // Act
        $result = $this->sut->search($params);

        // Assert (Aserciones fluidas)
        $this->assertInstanceOf(ContactSearchResult::class, $result);
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame(1, $result->getTotal());
        $this->assertSame($fakeRecords, $result->getData());
        $this->assertNull($result->getMessage());
    }

    // =========================================================================
    // CAMINO C2: CP-CB-02
    // Nodo 2->Si -> Nodo 3->No -> Nodo 5 -> Nodo 7->No -> Nodo 9 -> Nodo 10 -> Nodo 11->Si -> Nodo 13->Si -> Nodo 14
    // Busqueda parcial sin comillas ("Gom") -> clausula partial LIKE '%Gom%'.
    // =========================================================================

    public function testSearchContactsWithPartialMatchLike(): void
    {
        // Arrange
        $expectedClause = [
            'type'  => 'partial',
            'field' => 'name',
            'value' => '%Gom%',
        ];

        $fakeRecords = [
            ['id' => 'c-1', 'name' => 'Carlos Gomez'],
            ['id' => 'c-2', 'name' => 'Ana Gomis'],
        ];

        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->identicalTo($expectedClause),
                $this->isNull(),
                $this->identicalTo(20)
            )
            ->willReturn($fakeRecords);

        $params = [
            'query'  => 'Gom',
            'filter' => 'all',
            'limit'  => 20,
        ];

        // Act
        $result = $this->sut->search($params);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame(2, $result->getTotal());
        $this->assertCount(2, $result->getData());
    }

    // =========================================================================
    // CAMINO C3: CP-CB-03
    // Nodo 2->Si -> Nodo 3->No -> Nodo 5 -> Nodo 7->No -> Nodo 9 -> Nodo 10 -> Nodo 11->Si -> Nodo 13->No -> Nodo 15
    // Termino inexistente -> Consulta exitosa pero 0 registros -> Mensaje 'No Data'.
    // =========================================================================

    public function testSearchContactsReturnsNoDataWhenNoMatchesFound(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->willReturn([]); // Base de datos retorna arreglo vacio

        $params = [
            'query'  => 'TerminoInexistenteXYZ',
            'filter' => 'all',
            'limit'  => 20,
        ];

        // Act
        $result = $this->sut->search($params);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame(0, $result->getTotal());
        $this->assertSame([], $result->getData());
        $this->assertSame('No Data', $result->getMessage());
    }

    // =========================================================================
    // CAMINO C4: CP-CB-04
    // Nodo 2->No -> Nodo 6 -> Nodo 7->No -> Nodo 9 -> Nodo 10 -> Nodo 11->Si -> Nodo 13->Si -> Nodo 14
    // Consulta general sin termino de busqueda (query vacio o ausente).
    // =========================================================================

    public function testSearchContactsWithoutQueryExecutesGeneralListing(): void
    {
        // Arrange
        $expectedClause = ['type' => 'none'];

        $fakeRecords = [
            ['id' => 'c-1', 'name' => 'Contacto 1'],
            ['id' => 'c-2', 'name' => 'Contacto 2'],
        ];

        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->identicalTo($expectedClause),
                $this->isNull(),
                $this->identicalTo(10)
            )
            ->willReturn($fakeRecords);

        $params = [
            'query'  => '',
            'filter' => 'all',
            'limit'  => 10,
        ];

        // Act
        $result = $this->sut->search($params);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame(2, $result->getTotal());
    }

    /**
     * Variante: clave query completamente ausente del array de parametros.
     */
    public function testSearchContactsWhenQueryKeyIsMissing(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->identicalTo(['type' => 'none']),
                $this->isNull(),
                $this->identicalTo(20)
            )
            ->willReturn([['id' => 'c-99', 'name' => 'Test']]);

        // Act
        $result = $this->sut->search([]);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(1, $result->getTotal());
    }

    // =========================================================================
    // CAMINO C5: CP-CB-05
    // Nodo 2->Si -> Nodo 3->No -> Nodo 5 -> Nodo 7->Si -> Nodo 8 -> Nodo 10 -> Nodo 11->Si -> Nodo 13->Si -> Nodo 14
    // Busqueda combinada de texto parcial con filtro especifico de clasificacion/estado.
    // =========================================================================

    public function testSearchContactsWithCombinedTextAndStatusFilter(): void
    {
        // Arrange
        $expectedClause = [
            'type'  => 'partial',
            'field' => 'name',
            'value' => '%Carlos%',
        ];

        $expectedFilter = ['status' => 'Lead'];

        $fakeRecords = [
            ['id' => 'c-1', 'name' => 'Carlos Perez', 'status' => 'Lead'],
        ];

        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->identicalTo($expectedClause),
                $this->identicalTo($expectedFilter),
                $this->identicalTo(15)
            )
            ->willReturn($fakeRecords);

        $params = [
            'query'  => 'Carlos',
            'filter' => 'Lead',
            'limit'  => 15,
        ];

        // Act
        $result = $this->sut->search($params);

        // Assert
        $this->assertTrue($result->isSuccess());
        $this->assertSame(200, $result->getCode());
        $this->assertSame(1, $result->getTotal());
        $this->assertSame('Lead', $result->getData()[0]['status']);
    }

    // =========================================================================
    // CAMINO C6: CP-CB-06
    // Nodo 2->Si -> Nodo 3->No -> Nodo 5 -> Nodo 7->No -> Nodo 9 -> Nodo 10 -> Nodo 11->No -> Nodo 12
    // Fallo de persistencia o ejecucion en base de datos -> Retorno de error HTTP 500.
    // =========================================================================

    public function testSearchContactsFailsWhenDatabaseQueryFails(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->willReturn(null); // Simulacion de error de BD retornando null

        $params = [
            'query'  => 'Gomez',
            'filter' => 'all',
            'limit'  => 20,
        ];

        // Act
        $result = $this->sut->search($params);

        // Assert
        $this->assertFalse($result->isSuccess());
        $this->assertSame(500, $result->getCode());
        $this->assertSame('Fallo en la ejecucion de la consulta de base de datos', $result->getError());
        $this->assertEmpty($result->getData());
    }

    // =========================================================================
    // PRUEBAS ADICIONALES: Sanitizacion, Delimitadores y Paginacion
    // =========================================================================

    /**
     * Verifica que una comilla de apertura sin comilla de cierre
     * se interprete como busqueda parcial (LIKE), no como coincidencia exacta.
     */
    public function testSearchContactsTreatsUnclosedQuotesAsPartialSearch(): void
    {
        // Arrange
        $expectedClause = [
            'type'  => 'partial',
            'field' => 'name',
            'value' => '%"Carlos%',
        ];

        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->identicalTo($expectedClause),
                $this->isNull(),
                $this->identicalTo(20)
            )
            ->willReturn([]);

        $params = [
            'query' => '"Carlos', // Comilla sin cerrar
        ];

        // Act
        $result = $this->sut->search($params);

        // Assert
        $this->assertTrue($result->isSuccess());
    }

    /**
     * Verifica que los espacios en blanco antes y despues de la busqueda
     * sean removidos mediante trim.
     */
    public function testSearchContactsTrimsWhitespaceFromQuery(): void
    {
        // Arrange
        $expectedClause = [
            'type'  => 'partial',
            'field' => 'name',
            'value' => '%Gomez%',
        ];

        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->identicalTo($expectedClause),
                $this->isNull(),
                $this->anything()
            )
            ->willReturn([['id' => 'c-1', 'name' => 'Gomez']]);

        $params = ['query' => '  Gomez  '];

        // Act
        $result = $this->sut->search($params);

        // Assert
        $this->assertTrue($result->isSuccess());
    }

    /**
     * Verifica que el limite por defecto sea 20 cuando no se especifica.
     */
    public function testSearchContactsUsesDefaultLimitOf20(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->anything(),
                $this->anything(),
                $this->identicalTo(20) // limite por defecto
            )
            ->willReturn([]);

        // Act
        $result = $this->sut->search(['query' => 'Test']);

        // Assert
        $this->assertTrue($result->isSuccess());
    }

    /**
     * Verifica que un limite explicito personalizado sea respetado.
     */
    public function testSearchContactsRespectsCustomLimit(): void
    {
        // Arrange
        $this->repositoryMock
            ->expects($this->once())
            ->method('search')
            ->with(
                $this->anything(),
                $this->anything(),
                $this->identicalTo(5)
            )
            ->willReturn([]);

        // Act
        $result = $this->sut->search(['query' => 'Test', 'limit' => 5]);

        // Assert
        $this->assertTrue($result->isSuccess());
    }
}

