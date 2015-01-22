/* global Symbol */
define([
  'nbd/Class',
  './Rule',
  './ResultTable',
  '../util/css',
  '../util/expression'
], function(Class, Rule, ResultTable, css, expression) {
  'use strict';

  /**
   * @requires MutationObserver
   */
  var Rules = Class.extend({
    init: function() {
      this.observer = new MutationObserver(this._update.bind(this));
      this.rules = [];
      this.eltable = new ResultTable();
    },

    bind: function(root) {
      var target = root || document.body;
      this.observer.observe(target, {
        childList: true,
        attributes: true,
        characterData: false,
        subtree: true
      });
    },

    destroy: function() {
      this.observer.disconnect();
      this.observer = null;
      this.clear();
      this.eltable = null;
    },

    /**
     * Context-bound mutation update callback
     */
    _update: function mutationUpdate(mutations, observer) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName !== "style") {
          var ruleList = this.eltable.get(mutation.target);
          this.rules.forEach(function(rule) {
            if (rule.computedSelector) {
              var method = css.matches(mutation.target, rule.computedSelector) ?
                'add' :
                'delete';
              ruleList[method](rule);
            }
          });
        }

        if (mutation.type === 'childList') {
          // TODO: tree mutations
        }
      }, this);
    },

    clear: function() {
      // Clear each rule
      this.rules.forEach(function(rule) {
        rule.destroy();
      });
      this.rules.length = 0;
    },

    process: function(payload) {
      this._state = payload;

      // for (let rule of this) rule.process(payload)
      this.rules.forEach(function(rule) {
        rule.process(this._state, this.eltable);
      }, this);
    },

    insert: function(selector, spec) {
      var rule = new Rule(selector, spec);
      this.rules.push(rule);

      if (this._state) {
        rule.process(this._state, this.eltable);
      }
      return rule;
    }
  }, {
    displayName: 'FocssRules'
  });

  // ES6 future-proofing
  if (typeof Symbol !== 'undefined' && Symbol.iterator) {
    Rules.prototype[Symbol.iterator] = function() {
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

  return Rules;
});
