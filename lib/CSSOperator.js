define(['nbd/util/extend', './Operator'], function(extend, Operator) {
  'use strict';

  function styleProperty(property) {
    if (styleProperty.memo[property]) {
      return styleProperty.memo[property];
    }
    return (styleProperty.memo[property] = property.replace(styleProperty.pattern, styleProperty.replacement));
  }
  styleProperty.memo = { float: 'cssFloat' };
  styleProperty.pattern = /-([a-z])/g;
  styleProperty.replacement = function(match, p1) {
    return p1.toLocaleUpperCase();
  };

  function cssNormalize(styleObj) {
    var nStyle = {};
    for (var key in styleObj) {
      nStyle[styleProperty(key)] = styleObj[key];
    }
    return nStyle;
  }

  return Operator.extend({
    extract: function(element) {
      this.style = element.style;
      var style = this.style;

      // Sad function for copying styles
      /** es6
       * var arr = {};
       * for (let prop of style) {
       *   arr[prop] = style[prop];
       * }
       * return arr;
       */
      var arr = {}, prop;
      for (var i = 0; i < style.length; ++i) {
        prop = styleProperty(style[i]);
        if (style[prop] != null) {
          arr[prop] = style[prop];
        }
      }
      return arr;
    },

    map: function(change) {
      return this._super(cssNormalize(change));
    },

    prepare: function(incoming) {
      var key, mutable = extend({}, incoming);
      for (key in this.state) {
        if (incoming.hasOwnProperty(key)) { continue; }
        mutable[key] = '';
      }

      return mutable;
    },

    apply: function(incoming) {
      extend(this.style, incoming);
    }
  }, {
    displayName: 'CSSOperator'
  });
});
