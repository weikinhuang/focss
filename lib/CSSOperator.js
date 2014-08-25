define(['nbd/util/extend', './Operator'], function(extend, Operator) {
	'use strict';

	function dash2camel(property) {
		dash2camel.memo = dash2camel.memo || {};
		if (dash2camel.memo[property]) {
			return dash2camel.memo[property];
		}
		return (dash2camel.memo[property] = property.replace(dash2camel.pattern, dash2camel.replacement));
	}
	dash2camel.pattern = /-([a-z])/g;
	dash2camel.replacement = function(match, p1) {
		return p1.toLocaleUpperCase();
	};

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
				prop = dash2camel(style[i]);
				if (style[prop] != null) {
					arr[prop] = style[prop];
				}
			}
			return arr;
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
