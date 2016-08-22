import diff from 'nbd/util/diff';
import expression from '../util/expression';

const computed = /\$\{([^\}]*?)\}|<%\s*(.*?)\s*%>/ig;

// CSS3 introduces the double colon syntax for pseudos
const css2PseudoEl = /:(after|before|first-letter|first-line)|::/g;
function prefixPseudo(a, b) { return b ? ':' + a : a; }
function normalizePseudoElement(selector) {
  return selector.replace(css2PseudoEl, prefixPseudo);
}

export default class Rule {
  constructor({ selector, spec, arrayMemberExpr, toggleKeys, togglePrefix = '' }) {
    if (typeof selector !== 'string') {
      throw new TypeError('selector must be a string.');
    }
    this.selector = normalizePseudoElement(selector);
    this.body = expression.compileSpec(spec, arrayMemberExpr);
    this.artifacts = Object.assign({}, this.body.artifacts);
    this.isArrayRule = !!arrayMemberExpr;

    // Perform a while loop here because a computed selector can
    // contain *multiple* template strings in a row.
    let expr;
    while ((expr = computed.exec(this.selector)) !== null) {
      this.isComputed = true;
      Object.assign(this.artifacts, expression.parse(expr[1] || expr[2]).artifacts);
    }

    if (toggleKeys) {
      this.traces = {};
      const artifactsPrefixed = {};
      for (let key in this.artifacts) {
        if (key.indexOf('__toggled__') !== 0) {
          artifactsPrefixed[`${togglePrefix}${key}`] = this.artifacts[key];
        }
      }

      for (let key of toggleKeys) {
        this.traces[key] = artifactsPrefixed;
      }
    }
  }

  getSelector() {
    return this.computedSelector || this.selector;
  }

  process(data, extensions) {
    // First find out the new results
    this._process(data, extensions);

    // Then diff the results with last results
    const different = !this._lastResult ||
      Object.keys(diff(this.result, this._lastResult)).length;

    this._lastResult = this.result;
    return different ? this.result : null;
  }

  _process(data, extensions) {
    let selector = this.selector;

    if (this.isComputed) {
      // Compile the selector
      selector = this.selector.replace(computed, (match, oldExpr, newExpr) => {
        const expr = oldExpr || newExpr;
        return expression.compile(expr)(data, extensions);
      });
    }

    this.computedSelector = selector;
    this.result = this.body(data, extensions);
  }
}

Object.defineProperty(Rule, 'computed', { value: computed });

export default Rule;
