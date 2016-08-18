import Engine from './src/Engine';

export default class {
  constructor(root, extensions) {
    this.engine = new Engine(root, extensions);
  }

  /**
   * Insert a focss rule
   * @param selector {String|Object|Array} CSS selector/dynamic selector|object of descriptors|array of descriptors
   * @param spec {Object|null} key/value map of CSS property to expression or null if selector is object or array
   * @returns Object Artifacts found while compiling the rule
   */
  insert(selector, spec) {
    if (typeof selector === 'object') {
      const artifacts = {};

      if (Array.isArray(selector)) {
        for (let s of selector) {
          Object.assign(artifacts, this.insert(s.selector, s.rules));
        }
      }
      else {
        for (let s in selector) {
          if (selector.hasOwnProperty(s)) {
            Object.assign(artifacts, this.insert(s, selector[s]));
          }
        }
      }

      return artifacts;
    }

    const { artifacts } = this.engine.insert(selector, spec);
    return artifacts;
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
