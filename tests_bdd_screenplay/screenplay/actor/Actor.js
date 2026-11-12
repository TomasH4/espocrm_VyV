/**
 * Actor.js
 * 
 * Representa al usuario que ejecuta las acciones dentro del sistema bajo el patrón Screenplay.
 * Administra las habilidades (Abilities) y la memoria/contexto del actor.
 */
export class Actor {
  constructor(name) {
    this.name = name;
    this.abilities = {};
    this.memory = {};
  }

  static named(name) {
    return new Actor(name);
  }

  whoCan(abilityKey, ability) {
    this.abilities[abilityKey] = ability;
    return this;
  }

  abilityTo(abilityKey) {
    return this.abilities[abilityKey];
  }

  remember(key, value) {
    this.memory[key] = value;
    return this;
  }

  recall(key) {
    return this.memory[key];
  }

  attemptsTo(...tasks) {
    tasks.forEach(task => {
      task.performAs(this);
    });
  }

  asks(question) {
    return question.answeredBy(this);
  }
}

