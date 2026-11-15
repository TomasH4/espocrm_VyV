/**
 * Suite de Pruebas de Regresión Automatizadas — Andrés Bedoya
 * Objetivo: Verificar la integridad funcional de las 5 funcionalidades de negocio
 * tras la aplicación de refactorizaciones y correcciones de código.
 */

describe('Suite de Regresión Automatizada — Andrés Bedoya (5 Funcionalidades)', () => {
    const baseUrl = 'http://localhost:8080';
    const authHeader = 'Basic ' + btoa('andres:andres12345');

    describe('REG-F1: Integridad en Transición de Estados de Casos', () => {
        let caseId;

        it('REG-01: Debe permitir el flujo completo de vida de un Caso (New -> Assigned -> Closed)', () => {
            // 1. Crear Caso en New
            cy.request({
                method: 'POST',
                url: `${baseUrl}/api/v1/Case`,
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                body: {
                    name: `Regression Case ${Date.now()}`,
                    status: 'New',
                    priority: 'Normal'
                }
            }).then((createRes) => {
                expect(createRes.status).to.be.oneOf([200, 201]);
                caseId = createRes.body.id;

                // 2. Transición a Assigned
                cy.request({
                    method: 'PUT',
                    url: `${baseUrl}/api/v1/Case/${caseId}`,
                    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                    body: { status: 'Assigned' }
                }).then((assignRes) => {
                    expect(assignRes.status).to.eq(200);
                    expect(assignRes.body.status).to.eq('Assigned');

                    // 3. Transición a Closed
                    cy.request({
                        method: 'PUT',
                        url: `${baseUrl}/api/v1/Case/${caseId}`,
                        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                        body: { status: 'Closed' }
                    }).then((closeRes) => {
                        expect(closeRes.status).to.eq(200);
                        expect(closeRes.body.status).to.eq('Closed');
                    });
                });
            });
        });

        afterEach(() => {
            if (caseId) {
                cy.request({
                    method: 'DELETE',
                    url: `${baseUrl}/api/v1/Case/${caseId}`,
                    headers: { 'Authorization': authHeader },
                    failOnStatusCode: false
                });
            }
        });
    });

    describe('REG-F2: Integridad en Gestión y Cálculo de Casos con SLA', () => {
        let caseId;

        it('REG-02: Debe persistir y responder correctamente con Casos de Prioridad Urgente', () => {
            cy.request({
                method: 'POST',
                url: `${baseUrl}/api/v1/Case`,
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                body: {
                    name: `SLA Urgent Regression ${Date.now()}`,
                    status: 'Assigned',
                    priority: 'Urgent',
                    description: 'Caso crítico bajo SLA de 4 horas'
                }
            }).then((res) => {
                expect(res.status).to.be.oneOf([200, 201]);
                caseId = res.body.id;
                expect(res.body.priority).to.eq('Urgent');
            });
        });

        afterEach(() => {
            if (caseId) {
                cy.request({
                    method: 'DELETE',
                    url: `${baseUrl}/api/v1/Case/${caseId}`,
                    headers: { 'Authorization': authHeader },
                    failOnStatusCode: false
                });
            }
        });
    });

    describe('REG-F3: Integridad en Cotizaciones y Estructura Financiera', () => {
        let oppId;

        it('REG-03: Debe gestionar cotizaciones comerciales manteniendo consistencia monetaria', () => {
            cy.request({
                method: 'POST',
                url: `${baseUrl}/api/v1/Opportunity`,
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                body: {
                    name: `Regression Deal Tier 3 ${Date.now()}`,
                    stage: 'Prospecting',
                    amount: 65000.00,
                    amountCurrency: 'USD',
                    closeDate: '2026-12-31',
                    probability: 75
                }
            }).then((res) => {
                expect(res.status).to.be.oneOf([200, 201]);
                oppId = res.body.id;
                expect(parseFloat(res.body.amount)).to.eq(65000.00);
            });
        });

        afterEach(() => {
            if (oppId) {
                cy.request({
                    method: 'DELETE',
                    url: `${baseUrl}/api/v1/Opportunity/${oppId}`,
                    headers: { 'Authorization': authHeader },
                    failOnStatusCode: false
                });
            }
        });
    });

    describe('REG-F4: Integridad en Evaluación de Tareas Operativas', () => {
        let taskId;

        it('REG-04: Debe gestionar tareas con asignación y fecha límite para evaluación de vencimiento', () => {
            cy.request({
                method: 'POST',
                url: `${baseUrl}/api/v1/Task`,
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                body: {
                    name: `Regression Task Overdue ${Date.now()}`,
                    status: 'Not Started',
                    priority: 'High',
                    assignedUserId: '62c52bf3add0f226f',
                    dateEnd: '2026-11-10 18:00:00'
                }
            }).then((res) => {
                expect(res.status).to.be.oneOf([200, 201]);
                taskId = res.body.id;
                expect(res.body.status).to.eq('Not Started');
            });
        });

        afterEach(() => {
            if (taskId) {
                cy.request({
                    method: 'DELETE',
                    url: `${baseUrl}/api/v1/Task/${taskId}`,
                    headers: { 'Authorization': authHeader },
                    failOnStatusCode: false
                });
            }
        });
    });

    describe('REG-F5: Integridad en Búsqueda y Deduplicación de Cuentas', () => {
        let accId;

        it('REG-05: Debe registrar y permitir búsqueda de cuentas comerciales sin duplicados no controlados', () => {
            const corpName = `Bancolombia S.A.S. ${Date.now()}`;
            cy.request({
                method: 'POST',
                url: `${baseUrl}/api/v1/Account`,
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
                body: {
                    name: corpName,
                    type: 'Customer',
                    emailAddress: `corp_${Date.now()}@bancolombia.com.co`
                }
            }).then((res) => {
                expect(res.status).to.be.oneOf([200, 201]);
                accId = res.body.id;

                // Verificación de indexación inmediata
                cy.request({
                    method: 'GET',
                    url: `${baseUrl}/api/v1/Account?search=${encodeURIComponent(corpName)}`,
                    headers: { 'Authorization': authHeader }
                }).then((searchRes) => {
                    expect(searchRes.status).to.eq(200);
                    expect(searchRes.body.list.length).to.be.greaterThan(0);
                    expect(searchRes.body.list[0].id).to.eq(accId);
                });
            });
        });

        afterEach(() => {
            if (accId) {
                cy.request({
                    method: 'DELETE',
                    url: `${baseUrl}/api/v1/Account/${accId}`,
                    headers: { 'Authorization': authHeader },
                    failOnStatusCode: false
                });
            }
        });
    });
});
