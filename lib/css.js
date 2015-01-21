define(['nbd/util/extend', './Operator'], function(extend, Operator) {
  'use strict';

  // From facebook/react
  /**
   * CSS properties which accept numbers but are not in units of "px".
   */
  var isUnitlessNumber = {
    columnCount: true,
    flex: true,
    flexGrow: true,
    flexShrink: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    widows: true,
    zIndex: true,
    zoom: true,
    // SVG-related properties
    fillOpacity: true,
    strokeOpacity: true
  };

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
    var key, nStyle = {};
    for (key in styleObj) {
      nStyle[styleProperty(key)] = styleObj[key];
    }
    return nStyle;
  }

  return {
    extract: function(element) {
      var style = element.style;

      var arr = {}, prop;
      for (var i = 0; i < style.length; ++i) {
        prop = styleProperty(style[i]);
        if (style[prop] != null) {
          arr[prop] = style[prop];
        }
      }
      return arr;
    },

    apply: function(element, incoming) {
      var key, value;
      for (key in incoming) {
        value = incoming[key];

        // Array value (CSS space separated)
        if (Array.isArray(value)) {
          value = value.join(' ').trim();
        }

        // Undefined/null value
        if (value == null || value === '') {
          element.style[key] = '';
          continue;
        }

        // Literal value
        if (isNaN(value) || isUnitlessNumber[key] || value === 0) {
          element.style[key] = value;
          continue;
        }

        // Numbers without units
        element.style[key] = value + 'px';
      }
    }
  };
});
