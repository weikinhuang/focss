define(['mori', 'nbd/Class', 'nbd/util/extend'], function(mori, Class, extend) {
	'use strict';

	function objMap(obj) {
		var map = mori.mutable.thaw(mori.hash_map()), k;

		for (k in obj) {
			if (obj.hasOwnProperty(k)) {
				map = mori.mutable.assoc(map, k, obj[k]);
			}
		}

		return mori.mutable.freeze(map);
	}

	function mutableMapMerge(immutable, mutable) {
		var map = mori.mutable.thaw(immutable), k;
		for (k in mutable) {
			if (mutable.hasOwnProperty(k)) {
				map = mori.mutable.assoc(map, k, mutable[k]);
			}
		}
		return mori.mutable.freeze(map);
	}

	return Class.extend({
		init: function() {
			this.delta = {};
		},

		extract: function(input) {
			return input;
		},

		transform: function(input) {
			return Array.isArray(input) ?
				mori.hash_map.apply(null, input) :
				objMap(input);
		},

		load: function(input) {
			this.states = mori.is_vector(this.states) ?
				mori.conj(this.states, input) :
				mori.vector(input);
		},

		map: function(change) {
			extend(this.delta, change);
			return this;
		},

		reduce: function() {
			var incoming, res;
			this.state = this.state || mori.peek(this.states);
			if (Object.keys(this.delta).length) {
				incoming = mutableMapMerge(this.state, this.delta);
				this.delta = {};
			}
			res = this.prepare(incoming);
			this.state = incoming;
			return res;
		},

		prepare: function(incoming) {},

		apply: function() {},

		commit: function() {
			if (!mori.is_collection(this.state)) {
				throw new TypeError('this.state is not a collection');
			}
			this.load(this.state);
			return this.state;
		},

		revert: function(n) {
			var len = mori.count(this.states), incoming, res;
			if (n = n|0) {
				this.states = mori.subvec(this.states, 0, Math.max(1, len - n));
			}
			incoming = mori.peek(this.states);
			res = this.prepare(incoming);
			this.state = incoming;
			return res;
		}
	}, {
		displayName: 'Operator',
		objMap: objMap
	});
});
