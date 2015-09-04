define(['index'], function(Focss) {
  var fox;

  function css(el, prop) {
    return window.getComputedStyle(el[0] || el)[prop];
  }

  describe('dynamic rules', function() {
    beforeEach(function() {
      fox = new Focss();
    });

    afterEach(function() {
      fox.destroy();
      fox = null;
    });

    describe('computed selector', function() {
      it('has no effect before process call', function() {
        var el = affix('div.bar');

        fox.insert('.${foo}', {
          'max-width': 'width'
        });

        expect(css(el, 'max-width')).toBe('none');
      });

      it('evaluates the selector', function() {
        var el = affix('div.bar');

        fox.process({ foo: 'bar', width: 100 });
        fox.insert('.${foo}', {
          'max-width': 'width'
        });

        expect(css(el, 'max-width')).toBe('100px');
      });

      it('removes styles when selector no longer matches', function() {
        var el = affix('div.bar');
        fox.insert('.${foo}', {
          'max-width': 'width'
        });

        fox.process({ foo: 'bar', width: 100 });
        expect(css(el, 'max-width')).toBe('100px');

        fox.process({ foo: 'baz', width: 40 });
        expect(css(el, 'max-width')).toBe('none');
      });
    });

    describe('DOM mutation', function() {
      beforeEach(function() {
        fox.insert('.bar', {
          'max-width': 'width'
        });
        fox.process({ width: 100 });
      });

      // Stuff that depends on MutationObserver are very tricky to time
      it('applies styles to new elements', function() {
        var el = affix('.bar');
        expect(css(el, 'max-width')).toBe('100px');
      });

      it('adds element styles when their attributes change', function() {
        var el = affix('.baz');
        expect(css(el, 'max-width')).toBe('none');
        el.addClass('bar');
        expect(css(el, 'max-width')).toBe('100px');
      });

      it('removes element styles when their attributes change', function() {
        var el = affix('.bar');
        expect(css(el, 'max-width')).toBe('100px');
        el.removeClass('bar');
        expect(css(el, 'max-width')).toBe('none');
      });

      it('affects descendants when ancestors\' attributes change', function() {
        fox.insert('.bar .stool', { 'max-height': 'width' });

        var el = affix('.baz .stool');
        var stool = el.find('.stool');

        expect(css(stool, 'max-height')).toBe('none');
        el.addClass('bar');
        expect(css(stool, 'max-height')).toBe('100px');
      });
    });
  });
});
