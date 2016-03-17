/* global Symbol */
define([
  'nbd/Class',
  './Rule',
  '../util/css',
  '../util/detectScoped',
  '../util/expression'
], function(Class, Rule, css, compat, expression) {
  'use strict';

  function genId() {
    return '__focss__' + genId.i++;
  }
  genId.i = 1;

  var arraySelectorRegex = /%forEach\(([^,]+),(.+)\)$/i;

  var Engine = Class.extend({
    init: function(root, scoped) {
      var target = root || document.body;
      this.rules = [];
      this.arrayRuleDescriptors = [];

      this.extensions = Object.create(this.extensions);
      this.style = document.createElement('style');

      if (scoped) {
        this.style.setAttribute('scoped', 'scoped');
      }

      target.insertBefore(this.style, target.firstChild);

      if (!scoped || compat.scopeSupported || target === document.body) {
        this._prefix = '';
      }
      else {
        this._prefix = '#' + (root.id || (root.id = genId())) + ' ';
      }
    },

    destroy: function() {
      this.rules.length = 0;
      this.style.parentNode.removeChild(this.style);
    },

    process: function(payload) {
      this._state = payload;
      this._regenerateArrayRules();
      this.rules.forEach(this._process, this);

      //remove leftover rules
      for (var i = this.cssRules.length; i > this.rules.length; i--) {
        this.sheet.deleteRule(i - 1);
      }
    },

    _process: function(rule, i) {
      var result = rule.process(this._state, this.extensions),
          selector = rule.getSelector(this._prefix);

      // Selector has changed
      if (selector !== this.cssRules[i].selectorText) {
        if (compat.changeSelectorTextAllowed) {
          this.cssRules[i].selectorText = selector;
        }
        else {
          this.sheet.deleteRule(i);
          this.sheet.insertRule(rule.getSelector(this._prefix) + '{}', i);
          // If the rule has been replaced, we must re-apply the rule body
          result = true;
        }
      }

      // Results have changed
      if (result) {
        css.apply(this.cssRules[i], rule.result);
      }
    },

    insert: function(selector, spec) {
      var expr = arraySelectorRegex.exec(selector);

      if (expr !== null) {
        return this._insertArrayDescriptor(expr[2], expr[1], spec);
      }

      return this._insert(selector, spec);
    },

    _insertArrayDescriptor: function(selector, expr, spec) {
      var descriptor = {
            selector: selector,
            expr: expr,
            spec: spec,
          },
          artifacts = {};

      artifacts[expr] = true;

      this.arrayRuleDescriptors.push(descriptor);
      this._generateRulesFromArrayRuleDescriptor(descriptor);

      return {
        artifacts: artifacts
      };
    },

    _regenerateArrayRules: function() {
      this.rules = this.rules.filter(function(rule) {
        return !rule.isArrayRule;
      }, this);

      this.arrayRuleDescriptors.forEach(function(descriptor) {
        this._generateRulesFromArrayRuleDescriptor(descriptor);
      }, this);
    },

    _generateRulesFromArrayRuleDescriptor: function(descriptor) {
      // occurs when .insert is called before .process
      if (!this._state) {
        return;
      }

      var arrayDataFromState = expression.compile(descriptor.expr)(this._state, this._extensions);

      arrayDataFromState.forEach(function(item, index) {
        var selectorForItem = descriptor.selector.replace(this.constructor.Rule.computed, function(match, column) {
          return item[column];
        });

        this._insert(selectorForItem, descriptor.spec, descriptor.expr + '[' + index + ']');
      }, this);
    },

    _insert: function(selector, spec, arrayMemberExpr) {
      var rule = new this.constructor.Rule(selector, spec, arrayMemberExpr),
          i = this.rules.length;

      if (rule.isComputed) {
        // Placeholder rule
        this.sheet.insertRule(':root {}', i);
      }
      else {
        this.sheet.insertRule(rule.getSelector(this._prefix) + '{}', i);
      }
      this.rules.push(rule);

      if (this._state) {
        this._process(rule, i);
      }
      return rule;
    },

    extensions: {
      Math: Math
    }
  }, {
    Rule: Rule,
    displayName: 'FocssEngine'
  })
  .mixin({
    get sheet() {
      return this.style[compat.sheet];
    },
    get cssRules() {
      return this.sheet[compat.rules];
    }
  });

  // ES6 future-proofing
  if (typeof Symbol !== 'undefined' && Symbol.iterator) {
    Engine.prototype[Symbol.iterator] = function() {
      return {
        _keys: this.rules.slice(),
        next: function() {
          var rule;
          if (rule = this._keys.shift()) {
            return {
              value: rule,
              done: false
            };
          }
          return { done: true };
        }
      };
    };
  }

  return Engine;
});
