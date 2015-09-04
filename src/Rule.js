define([
  'nbd/Class',
  'nbd/util/extend',
  'nbd/util/diff',
  '../util/css',
  '../util/expression',
  '../util/specificity'
], function(Class, extend, diff, css, expression, specificity) {
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

    getSelector: function(prefix) {
      if (!prefix) { return this.computedSelector || this.selector; }

      return this.specificity.map(function(part) {
        return prefix + part.selector;
      }, this).join(',');
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
    }
  }, {
    displayName: 'FocssRule'
  });

  Object.defineProperty(Rule, 'computed', { value: computed });

  return Rule;
});
