/**
 * CSS properties which accept numbers but are not in units of "px".
 */
var isUnitlessNumber = {
  'column-count': true,
  flex: true,
  'flex-grow': true,
  'flex-shrink': true,
  'font-weight': true,
  'line-clamp': true,
  'line-height': true,
  opacity: true,
  order: true,
  orphans: true,
  widows: true,
  'z-index': true,
  zoom: true,
  // SVG-related properties
  'fill-opacity': true,
  'stroke-opacity': true
};

export default {
  find: function(selector, base) {
    return (base || document).querySelectorAll(selector);
  },

  apply: function(element, incoming) {
    var key;
    var value;
    for (key in incoming) {
      value = incoming[key];

      // Array value (CSS space separated)
      if (Array.isArray(value)) {
        value = value.join(' ').trim();
      }

      // Undefined/null value
      if (value == null || value === '') {
        element.style.setProperty(key, '');
        continue;
      }

      // Literal value
      if (isNaN(value) || isUnitlessNumber[key] || value === 0) {
        element.style.setProperty(key, value);
        continue;
      }

      // Numbers without units
      element.style.setProperty(key, value + 'px');
    }
  },

  toString: function(selector, incoming) {
    var key;
    var value;
    var result = selector + '{';
    for (key in incoming) {
      value = incoming[key];

      // Array value (CSS space separated)
      if (Array.isArray(value)) {
        value = value.join(' ').trim();
      }

      // Undefined/null value
      if (value == null || value === '') {
        continue;
      }

      // Literal value
      if (isNaN(value) || isUnitlessNumber[key] || value === 0) {
        result += key + ':' + value + ';';
        continue;
      }

      // Numbers without units
      result += key + ':' + value + 'px;';
    }
    result += '}';
    return result.trim();
  }
};
