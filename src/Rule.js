define([
  'nbd/Class',
  'nbd/util/extend',
  'nbd/util/diff',
  './eltable',
  '../util/css',
  '../util/expression',
  '../util/specificity'
], function(Class, extend, diff, eltable, css, expression, specificity) {
  'use strict';
  var computed = /\$\{([^\}]*?)\}/ig;

  function lookup(obj, prop) {
    return obj && obj[prop];
  }

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

    process: function(data, extensions) {
      var artifacts = Object.keys(this.artifacts)
      .reduce(function archaeology(artifacts, path) {
        artifacts[path] = path.split('.').reduce(lookup, data);
        return artifacts;
      }, {});

      var different = !this._lastArtifacts ||
        Object.keys(diff(artifacts, this._lastArtifacts)).length;

      if (different) {
        this._process(data, extensions);
      }
      this._lastArtifacts = artifacts;
    },

    _process: function(data, extensions) {
      var selector = this.selector;

      if (this.isComputed) {
        // Compile the selector
        selector = this.selector.replace(computed, function(match, expr, pos) {
          return expression.compile(expr)(data, extensions);
        });
        this.specificity = specificity.calculate(selector);
      }

      this.computedSelector = selector;
      this.result = css.normalize(this.body(data, extensions));

      this.mark(true);
    },

    mark: function(fresh) {
      var affected = css.find(this.computedSelector),
          elements = Array.prototype.slice.call(affected);

      var element, i, index;
      // Undo previous matching if no longer matching
      if (this._lastAffected) {
        for (i = 0; i < this._lastAffected.length; ++i) {
          element = this._lastAffected[i];
          index = elements.indexOf(element);

          if (index === -1) {
            eltable.get(element).delete(this);
          }
          else if (!fresh) {
            elements.splice(index, 1);
          }
        }
      }

      // Map the operation to each selector
      for (i = 0; i < elements.length; ++i) {
        eltable.get(elements[i]).add(this);
      }

      this._lastAffected = affected;
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
    displayName: 'FocssRule'
  });

  Object.defineProperty(Rule, 'computed', { value: computed });

  return Rule;
});
