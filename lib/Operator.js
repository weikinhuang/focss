define(['nbd/Class', 'nbd/util/extend'], function(Class, extend) {
  'use strict';

  return Class.extend({
    init: function() {
      this.delta = {};
      this.states = [];
    },

    destroy: function() {
      this.delta = this.states = this.state = null;
    },

    extract: function(input) {
      return input;
    },

    transform: function(input) {
      return input;
    },

    load: function(input) {
      Object.freeze(input);
      this.states.push(input);
      this.state = extend({}, this.states[this.states.length - 1]);
    },

    map: function(change) {
      extend(this.delta, change);
      return this;
    },

    reduce: function() {
      var res = this.prepare(this.delta);
      extend(this.state, this.delta);
      this.delta = {};
      return res;
    },

    prepare: function(incoming) {},

    apply: function() {},

    commit: function() {
      var latest = this.states[this.states.length - 1];
      this.load(extend({}, latest, this.state));
      return this.state;
    },

    revert: function(n) {
      var len = this.states.length, incoming, res;
      if (n = n|0) {
        this.states = this.states.slice(0, Math.max(1, len - n));
      }
      incoming = extend({}, this.states[this.states.length - 1]);
      res = this.prepare(incoming);
      this.state = incoming;
      return res;
    }
  }, {
    displayName: 'Operator'
  });
});
