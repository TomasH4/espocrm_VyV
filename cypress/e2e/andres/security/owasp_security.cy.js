/**
 * Suite de Pruebas de Seguridad Automatizadas — OWASP Top 10 (2021)
 * Autor: Andrés Bedoya Cano (VyV 2026-2)
 *
 * Mapeo de Vulnerabilidades Evaluadas:
 * - A01:2021: Broken Access Control (BOLA / IDOR / Acceso no autorizado)
 * - A03:2021: Injection (SQL Injection & Cross-Site Scripting XSS)
 * - A05:2021: Security Misconfiguration (Exposición de archivos sensibles y cabeceras)
 * - A07:2021: Identification and Authentication Failures (Gestión de credenciales y tokens)
 */

describe('Pruebas de Seguridad OWASP Top 10 — Andrés Bedoya', () => {
    const baseUrl = 'http://localhost:8080';
    const authHeader = 'Basic ' + btoa('andres:andres12345');

    describe('A01:2021 — Broken Access Control & IDOR', () => {
        it('SEC-01: Debe denegar acceso (401 Unauthorized) a endpoints protegidos sin credenciales', () => {
            cy.request({
                method: 'GET',
                url: `${baseUrl}/api/v1/Case`,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401);
            });
        });

        it('SEC-02: Debe denegar acceso (400 o 401) con token o credencial inválida', () => {
            cy.request({
                method: 'GET',
                url: `${baseUrl}/api/v1/Account`,
                headers: {
                    'Authorization': 'Basic ' + btoa('attacker:invalidpassword')
                },
                failOnStatusCode: false
            }).then((response) => {
                expect([400, 401]).to.include(response.status);
            });
        });

        it('SEC-03: Debe proteger archivos de configuración críticos del servidor contra descarga directa', () => {
            // Intento de acceso directo a data/config.php que almacena hashes de passwords y secretos
            cy.request({
                method: 'GET',
                url: `${baseUrl}/data/config.php`,
                failOnStatusCode: false
            }).then((response) => {
                // Apache/.htaccess debe responder 403 Forbidden o 404 Not Found, jamás 200 OK
                expect([403, 404]).to.include(response.status);
                if (typeof response.body === 'string') {
                    expect(response.body).to.not.include('passwordSalt');
                    expect(response.body).to.not.include('database');
                }
            });
        });
    });

    describe('A03:2021 — Injection (SQL Injection & XSS)', () => {
        it('SEC-04: SQLi en parámetros de consulta de Casos no debe provocar fugas ni errores de sintaxis SQL', () => {
            const sqliPayload = "' OR '1'='1' -- ";
            cy.request({
                method: 'GET',
                url: `${baseUrl}/api/v1/Case?where[0][type]=equals&where[0][attribute]=name&where[0][value]=${encodeURIComponent(sqliPayload)}`,
                headers: {
                    'Authorization': authHeader
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('list');
                const rawString = JSON.stringify(response.body);
                expect(rawString).to.not.include('SQLSTATE');
                expect(rawString).to.not.include('syntax error');
                expect(rawString).to.not.include('MariaDB');
                expect(rawString).to.not.include('PDOException');
            });
        });

        it('SEC-05: SQLi con UNION SELECT en búsqueda global de Cuentas debe sanitizarse', () => {
            const unionPayload = "' UNION SELECT 1, 'admin', 'hash', 4, 5, 6-- ";
            cy.request({
                method: 'GET',
                url: `${baseUrl}/api/v1/Account?search=${encodeURIComponent(unionPayload)}`,
                headers: {
                    'Authorization': authHeader
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(200);
                const rawString = JSON.stringify(response.body);
                expect(rawString).to.not.include('The used SELECT statements have a different number of columns');
                expect(rawString).to.not.include('SQLSTATE');
            });
        });

        it('SEC-06: XSS inyectado en campos de texto debe ser bloqueado con 400 Bad Request por validación de patrones', () => {
            const xssPayload = '<script>window.xssExploit=true;</script>';
            const testName = `XSS-Test-${Date.now()} ${xssPayload}`;

            // EspoCRM cuenta con validación estricta de patrones en nombres que bloquea scripts maliciosos con 400
            cy.request({
                method: 'POST',
                url: `${baseUrl}/api/v1/Task`,
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                },
                body: {
                    name: testName,
                    status: 'Not Started',
                    priority: 'Normal',
                    assignedUserId: '62c52bf3add0f226f'
                },
                failOnStatusCode: false
            }).then((postRes) => {
                // Debe rechazar la carga maliciosa con 400 Bad Request
                expect(postRes.status).to.eq(400);
            });
        });
    });

    describe('A07:2021 — Identification and Authentication Failures', () => {
        it('SEC-07: Intento de autenticación con credenciales erróneas debe retornar 401 limpio sin revelar hashes ni rutas', () => {
            cy.request({
                method: 'GET',
                url: `${baseUrl}/api/v1/App/user`,
                headers: {
                    'Authorization': 'Basic ' + btoa('andres:PasswordTotalmenteErronea999!')
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(401);
                const rawString = JSON.stringify(response.body);
                expect(rawString).to.not.include('/var/www/html');
                expect(rawString).to.not.include('password_verify');
            });
        });

        it('SEC-08: Peticiones repetidas con payload grande no deben causar caída del servicio (Resistencia a DoS básico)', () => {
            const largeData = 'A'.repeat(5000);
            cy.request({
                method: 'GET',
                url: `${baseUrl}/api/v1/Case?search=${largeData}`,
                headers: {
                    'Authorization': authHeader
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.be.oneOf([200, 400]);
            });
        });
    });

    describe('A05:2021 — Security Misconfiguration & Response Hardening', () => {
        it('SEC-09: Las respuestas de la API deben retornar Content-Type estricto para evitar MIME sniffing', () => {
            cy.request({
                method: 'GET',
                url: `${baseUrl}/api/v1/Case`,
                headers: {
                    'Authorization': authHeader
                }
            }).then((response) => {
                expect(response.headers['content-type']).to.include('application/json');
            });
        });
    });
});
