define([
  'nbd/Class',
  'nbd/util/extend',
  './eltable',
  '../util/css',
  '../util/expression',
  '../util/specificity'
], function(Class, extend, eltable, css, expression, specificity) {
  'use strict';
  var computed = /\$\{([^\}]*?)\}/ig;

  var Rule = Class.extend({
    init: function(selector, spec) {
      if (typeof selector !== 'string') {
        throw new TypeError('selector must be a string.');
      }
      this.selector = selector;

      this.body = expression.compileSpec(spec);
      this.artifacts = extend({}, this.body.artifacts);

      var expr;
      while ((expr = computed.exec(this.selector)) !== null) {
        this.isComputed = true;
        extend(this.artifacts, expression.parse(expr[1]).artifacts);
      }

      if (!this.isComputed) {
        this.specificity = specificity.calculate(this.selector);
      }
    },

    process: function(data) {
      var selector = this.selector, extensions = this.constructor.extensions;

      if (this.isComputed) {
        // Compile the selector
        selector = this.selector.replace(computed, function(match, expr, pos) {
          return expression.compile(expr)(data, extensions);
        });
        this.specificity = specificity.calculate(selector);
      }

      this.computedSelector = selector;
      this.result = css.normalize(this.body(data, extensions));

      var elements, i;
      // For computed rules, undo previous matching
      if (this.isComputed && this._lastAffected) {
        elements = this._lastAffected;
        for (i = 0; i < elements.length; ++i) {
          eltable.get(elements[i]).delete(this);
        }
      }

      // Map the operation to each selector
      elements = css.find(selector);
      for (i = 0; i < elements.length; ++i) {
        eltable.get(elements[i]).add(this);
      }

      this._lastAffected = elements;
    },

    destroy: function() {
      var elements = this._lastAffected, i;
      if (elements) {
        for (i = 0; i < elements.length; ++i) {
          eltable.get(elements[i]).delete(this);
        }
      }
    }
  }, {
    displayName: 'FocssRule',
    extensions: {
      Math: Math
    }
  });

  Object.defineProperty(Rule, 'computed', { value: computed });

  return Rule;
});
