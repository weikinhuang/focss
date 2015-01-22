define(['nbd/Class', 'nbd/util/extend', './lib/Rules'], function(Class, extend, Rules) {
  'use strict';

  var Focss = Class.extend({
    init: function() {
      this.rules = new Rules();
      this.rules.bind();
    },

    /**
     * Insert a focss rule
     * @param selector {String} CSS selector/dynamic selector
     * @param spec {Object} key/value map of CSS property to expression
     */
    insert: function(selector, spec) {
      if (typeof selector === "object") {
        var artifacts = {};
        for (var s in selector) {
          if (selector.hasOwnProperty(s)) {
            extend(artifacts, this.insert(s, selector[s]));
          }
        }
        return artifacts;
      }

      var rule = this.rules.insert(selector, spec);
      return rule.artifacts;
    },

    /**
     * Run the current set of rules against state data
     * Previous state data is overridden.
     * @param data {Object} state data
     */
    process: function(data) {
      this.rules.process(data);
    },

    destroy: function() {
      this.rules.destroy();
      this.rules = null;
    }
  }, {
    displayName: 'Focss'
  });

  return Focss;
});
