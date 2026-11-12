/**
 * CallAnApi.js
 * 
 * Habilidad (Ability) que permite al Actor realizar consultas HTTP y operaciones REST directas a EspoCRM.
 */
export class CallAnApi {
  static at(apiUrl) {
    return new CallAnApi(apiUrl);
  }

  constructor(apiUrl) {
    this.apiUrl = apiUrl || 'http://localhost:8080/api/v1';
  }
}

