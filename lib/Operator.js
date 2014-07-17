define(['mori', 'nbd/Class', 'nbd/util/extend', 'nbd/util/pipe'], function(mori, Class, extend, pipe) {
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

	function mutableMapMerge() {
		/* jshint validthis:true */
		var map = mori.mutable.thaw(this),
		obj, k, i;
		for (i = 0; i < arguments.length; ++i) {
			obj = arguments[i];
			for (k in obj) {
				if (obj.hasOwnProperty(k)) {
					map = mori.mutable.assoc(map, k, obj[k]);
				}
			}
		}
		return mori.mutable.freeze(map);
	}

	return Class.extend({
		init: function(incoming) {
			this.delta = {};
			this.initialize = pipe(this.extract, this.transform, this.load);
			if (incoming) {
				this.initialize(incoming);
			}
		},

		extract: function(input) {
			return input;
		},

		transform: function(input) {
			return objMap(input);
		},

		load: function(input) {
			this.states = mori.is_vector(this.states) ?
				mori.conj(this.states, input) :
				this.states = mori.vector(input);
		},

		map: function(change) {
			extend(this.delta, change);
			return this;
		},

		reduce: function() {
			var incoming;
			this.state = this.state || mori.peek(this.states);
			if (Object.keys(this.delta).length) {
				incoming = mutableMapMerge.call(this.state, this.delta);
				this.delta = {};
			}
			this.apply(incoming);
			this.state = incoming;
			return this;
		},

		apply: function() {},

		commit: function() {
			if (!mori.is_collection(this.state)) {
				throw new TypeError('this.state is not a collection');
			}
			this.load(this.state);
			return this;
		},

		revert: function(n) {
			var len = mori.count(this.states), incoming;
			if (n = n|0) {
				this.states = mori.subvec(this.states, 0, Math.max(1, len - n));
			}
			incoming = mori.peek(this.states);
			this.apply(incoming);
			this.state = incoming;
			return this;
		}
	}, {
		displayName: 'Operator',
		objMap: objMap
	});
});
