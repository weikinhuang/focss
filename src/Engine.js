/* global Symbol */
define([
  'nbd/Class',
  'nbd/util/async',
  './Rule',
  '../util/css'
], function(Class, async, Rule, css) {
  'use strict';

  var Engine = Class.extend({
    init: function() {
      this.rules = [];
      this.style = document.createElement('style');
      this.style.setAttribute('scoped', 'scoped');
    },

    bind: function(root) {
      var target = root || document.body;
      target.insertBefore(this.style, target.firstChild);
    },

    destroy: function() {
      this.rules.forEach(function(rule) {
        rule.destroy();
      });
      this.rules.length = 0;
    },

    process: function(payload) {
      this._state = payload;
      this.rules.forEach(this._process, this);
    },

    _process: function(rule, i) {
      var sheet = this.style.sheet;
      rule.process(this._state);
      // Selector has changed
      if (rule.computedSelector !== sheet.cssRules[i].selectorText) {
        sheet.deleteRule(i);
        sheet.insertRule(rule.computedSelector + '{}', i);
      }
      css.apply(sheet.cssRules[i], rule.result);
    },

    insert: function(selector, spec) {
      var rule = new this.constructor.Rule(selector, spec),
          i = this.rules.length;

      if (rule.isComputed) {
        this.style.sheet.insertRule(':scope {}', i);
      }
      else {
        this.style.sheet.insertRule(rule.selector + '{}', i);
      }
      this.rules.push(rule);

      if (this._state) {
        this._process(rule, i);
      }
      return rule;
    }
  }, {
    Rule: Rule,
    displayName: 'FocssEngine'
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
