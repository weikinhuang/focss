define([
	'mori',
	'specificity',
	'nbd/util/async'
], function(mori, specificity, async) {
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

	/**
	 * Debounced keys update
	 */
	function updateKeys() {
		if (updateKeys._block) { return; }

		updateKeys._block = true;
		async(function() {
			updateKeys._block = false;
			keys = mori.sort_by(selspec, selectors);
		});
	}

	var Selectors = {
		get: function(selector) {
			if (map[selector]) {
				return map[selector];
			}

			selectors = mori.conj(selectors, selector);
			this.updateKeys();
			return map[selector] = this._find(selector);
		},

		delete: function(selector) {
			selectors = mori.disj(selectors, selector);
			delete map[selector];
			this.updateKeys();
		},

		added: function(element) {
			var affected = this._matches(element);

			// Add element to affected selectors
			mori.each(affected, function(selector) {
				map[selector].push(element);
			});

			return affected;
		},

		removed: function(element) {
			mori.each(this._matches(element), function(selector) {
				var i, arr = map[selector];

				if (~(i = arr.indexOf(element))) {
					arr.splice(i, 1);
				}
			});
		},

		updateKeys: updateKeys,

		_matches: function(element) {
			return mori.filter(function(selector) {
				return element[matches] && element[matches](selector);
			}, keys);
		},

		_find: function(selector) {
			var nodeList = document.querySelectorAll(selector);

			// Converts NodeList to Array
			return nodeList ?
				Array.prototype.map.call(nodeList, function(el) {
					return el;
				}) :
			   	[];
		}
	};

	return Selectors;
});
