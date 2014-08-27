define([
	'mori',
	'specificity'
], function(mori, specificity) {
	'use strict';

	var commas = /,/g;
	var selectors = mori.set(),
		map = {},
		keys;

	// Find the prefixed version of Element.prototype.matches()
	var matches = (function(prot) {
		var name, names = ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'];

		while (name = names.shift()) {
			if (name in prot) {
				return name;
			}
		}
	})(Element.prototype);

	/**
	 * Find selector sepcificity
	 * @memoizes
	 */
	function selspec(selector) {
		selspec.memo = selspec.memo || {};

		if (selspec.memo[selector]) {
			return selspec.memo[selector];
		}

		// Calculate specificity of the selector
		var result = specificity.calculate(selector),
		// Convert result to a natural number
		value = +result.specificity.replace(commas, '');

		// memoize result
		return selspec.memo[selector] = value;
	}

	function _matches(element) {
		keys = keys || mori.sort_by(selspec, selectors);
		return mori.filter(function(selector) {
			return element[matches] && element[matches](selector);
		}, keys);
	}

	function _find(selector) {
		var nodeList = document.querySelectorAll(selector);

		// Converts NodeList to Array
		return nodeList ? Array.prototype.map.call(nodeList, function(el) {
			return el;
		}) : [];
	}

	var Selectors = {
		get: function(selector) {
			if (map[selector]) {
				return map[selector];
			}

			selectors = mori.conj(selectors, selector);
			keys = null;
			return map[selector] = _find(selector);
		},

		delete: function(selector) {
			selectors = mori.disj(selectors, selector);
			delete map[selector];
			keys = null;
		},

		added: function(element) {
			var affected = _matches(element);

			// Add element to affected selectors
			mori.each(affected, function(selector) {
				map[selector].push(element);
			});

			return affected;
		},

		removed: function(element) {
			mori.each(_matches(element), function(selector) {
				var i, arr = map[selector];

				if (~(i = arr.indexOf(element))) {
					arr.splice(i, 1);
				}
			});
		}
	};

	return Selectors;
});
