define(['util/css'], function(css) {
  describe('css helper', function() {
    describe('.extract()', function() {
      it('pulls existing styles into an object', function() {
        var div = affix('div');
        div.css({
          display: 'none',
          float: 'left'
        });

        expect(css.extract(div[0])).toEqual(jasmine.objectContaining({
          display: 'none',
          cssFloat: 'left'
        }));
      });
    });

    describe('.find()', function() {
      it('searches the DOM tree for a selector', function() {
        var div = affix('div.foo');

        expect(css.find('.foo')).toContain(div[0]);
      });

      it('searches the subtree for a selector', function() {
        var section = affix('section .foo');
        var foo = section.find('.foo')[0];

        expect(css.find('.foo', section[0])).toContain(foo);
      });
    });

    describe('.matches()', function() {
      it('returns whether an element matches a selector', function() {
        var el = affix('.foo.bar')[0];
        expect(css.matches(el, '.foo')).toBeTruthy();
        expect(css.matches(el, '.bar')).toBeTruthy();
        expect(css.matches(el, '.baz')).toBeFalsy();
      });
    });

    describe('.normalize()', function() {
      it('normalizes object keys from CSS property names to DOM property names', function() {
        var res = css.normalize({
          'float': 'left',
          'max-width': '100%'
        });

        expect(res).toEqual(jasmine.objectContaining({
          cssFloat: 'left',
          maxWidth: '100%'
        }));
      });
    });

    describe('.apply()', function() {
      it('applies CSS style directly to element', function() {
        var div = affix('div');

        css.apply(div[0], {
          width: '10px',
          height: '20px'
        });

        expect(div.width()).toEqual(10);
        expect(div.height()).toEqual(20);
      });

      it('uses px as default numeric value', function() {
        var div = affix('div');

        css.apply(div[0], {
          width: 4,
          height: 5,
          zIndex: 1,
          // required for zIndex to come back as 1 in Chrome
          position: 'absolute'
        });

        expect(div.css('width')).toEqual('4px');
        expect(div.css('height')).toEqual('5px');
        expect(div.css('z-index')).toEqual('1');
      });
    });
  });
});
