define([
  'nbd/Class',
  'nbd/util/extend',
  '../util/css',
  '../util/expression',
  '../util/specificity'
], function(Class, extend, css, expression, specificity) {
  'use strict';
  var isComputed = /\$\{([^\}]*?)\}/ig;

  var Rule = Class.extend({
    init: function(selector, spec) {
      if (typeof selector !== 'string') {
        throw new TypeError('selector must be a string.');
      }
      this.selector = selector;
      this.isComputed = isComputed.test(this.selector);

      if (!this.isComputed) {
        this.specificity = specificity.calculate(this.selector);
      }

      this.body = expression.compileSpec(spec);
    },

    process: function(data, eltable) {
      var selector = this.selector,
          specific = this.specificity;

      if (this.isComputed) {
        // Compile the selector
        selector = this.selector.replace(isComputed, function(match, expr, pos) {
          return expression.compile(expr)(data/*, extensions*/);
        });
        specific = specificity.calculate(selector);
      }

      this.computedSelector = selector;

      this._lastResult = this.result;
      this.result = css.normalize(this.body(data/*, extensions*/));

      if (!eltable) { return; }

      // Map the operation to each selector
      selector.split(',').forEach(function(single, i) {
        // ES6: for (el of this.find(single))
        Array.prototype.forEach.call(this.find(single.trim()), function(el) {
          // Add self to set of affecting rules
          var affecting = eltable.get(el);
          affecting.add(this);
        }, this);
      }, this);
    },

    find: function(selector) {
      return document.querySelectorAll(selector);
    }
  }, {
    displayName: 'FocssRule'
  });

  Object.defineProperty(Rule, 'isComputed', { value: isComputed });

  return Rule;
});
