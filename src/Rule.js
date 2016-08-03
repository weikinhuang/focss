import Class from 'nbd/Class';
import diff from 'nbd/util/diff';
import expression from '../util/expression';

var computed = /\$\{([^\}]*?)\}/ig;

// CSS3 introduces the double colon syntax for pseudos
var css2PseudoEl = /:(after|before|first-letter|first-line)|::/g;
function prefixPseudo(a, b) { return b ? ':' + a : a; }
function normalizePseudoElement(selector) {
  return selector.replace(css2PseudoEl, prefixPseudo);
}

var Rule = Class.extend({
  init: function(selector, spec, arrayMemberExpr) {
    if (typeof selector !== 'string') {
      throw new TypeError('selector must be a string.');
    }
    this.selector = normalizePseudoElement(selector);
    this.body = expression.compileSpec(spec, arrayMemberExpr);
    this.artifacts = Object.assign({}, this.body.artifacts);
    this.isArrayRule = !!arrayMemberExpr;

    // Perform a while loop here because a computed selector can
    // contain *multiple* template strings in a row.
    var expr;
    while ((expr = computed.exec(this.selector)) !== null) {
      this.isComputed = true;
      Object.assign(this.artifacts, expression.parse(expr[1]).artifacts);
    }
  },

  getSelector: function() {
    return this.computedSelector || this.selector;
  },

  process: function(data, extensions) {
    // First find out the new results
    this._process(data, extensions);

    // Then diff the results with last results
    var different = !this._lastResult ||
      Object.keys(diff(this.result, this._lastResult)).length;

    this._lastResult = this.result;
    return different ? this.result : null;
  },

  _process: function(data, extensions) {
    var selector = this.selector;

    if (this.isComputed) {
      // Compile the selector
      selector = this.selector.replace(computed, function(match, expr) {
        return expression.compile(expr)(data, extensions);
      });
    }

    this.computedSelector = selector;
    this.result = this.body(data, extensions);
  }
}, {
  displayName: 'FocssRule'
});

Object.defineProperty(Rule, 'computed', { value: computed });

export default Rule;
