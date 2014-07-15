define(['mori', './Operator'], function(mori, Operator) {
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
			var style = this.style = element.style;

			// Sad function for copying styles
			/** es6
			 * var arr = [];
			 * for (let prop of style) {
			 *   arr.push(prop, style[prop]);
			 * }
			 * return arr;
			 */
			var arr = [], prop;
			for (var i = 0; i < this.style.length; ++i) {
				prop = dash2camel(this.style[i]);
				if (style[prop] != null) {
					arr.push(prop, style[prop]);
				}
			}
		},

		transform: function(input) {
			return mori.hash_map.apply(null, input);
		},

		apply: function() {
			var prop;
			for (var i = 0; i < this.style.length; ++i) {
				prop = dash2camel(this.style[i]);
				if (!mori.has_key(this.state, prop)) {
					this.style[prop] = '';
				}
			}

			mori.reduce_kv(this._setStyle, this.style, this.state);
		},

		_setStyle: function(style, key, val) {
			style[key] = val;
			return style;
		}
	});
});
