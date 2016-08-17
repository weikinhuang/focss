import Engine from './src/Engine';

export default class {
  constructor(root, extensions) {
    this.engine = new Engine(root, extensions);
  }

  /**
   * Insert a focss rule
   * @param selector {String} CSS selector/dynamic selector
   * @param spec {Object} key/value map of CSS property to expression
   * @returns Object Artifacts found while compiling the rule
   */
  insert(selector, spec) {
    if (typeof selector === 'object') {
      var artifacts = {};
      for (var s in selector) {
        if (selector.hasOwnProperty(s)) {
          Object.assign(artifacts, this.insert(s, selector[s]));
        }
      }
      return artifacts;
    }

    var rule = this.engine.insert(selector, spec);
    return rule.artifacts;
  }

  /**
  * Insert a map of variables and their values
  * @param variables {Object} map of variables and their values
  * @returns {void}
  */
  insertVars(variables) {
    this.engine.insertVars(variables);
  }

  toggleSelector(key, isToggled) {
    this.engine.toggleSelector(key, isToggled);
  }

  /**
   * Run the current set of rules against state data
   * Previous state data is overridden.
   * @param data {Object} state data
   */
  process(data) {
    this.engine.process(data);
  }

  /**
   * Generate a string of styles as the result of running
   * the current set of rules against state data.
   * @param data {Object} state data
   * @returns String string containing generated styles
   */
  toString(data) {
    return this.engine.toString(data);
  }

  destroy() {
    this.engine.destroy();
    this.engine = null;
  }

  get rules() {
    return this.engine.getRules();
  }

  get arrayRuleDescriptors() {
    return this.engine.getArrayRuleDescriptors();
  }

  get traces() {
    return this.engine.getTraces();
  }
}
