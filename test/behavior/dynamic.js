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

    describe('computed array selector', function() {
      beforeEach(function() {
        this._el = affix('div.bar[data-id="3"]');
        this._el2 = affix('div.bar[data-id="4"]');
        this._artifacts = {};
      });

      describe('insert/process call ordering', function() {
        it('has no effect when insert is called before process', function() {
          var artifacts;

          artifacts = fox.insert('%forEach(foo, .bar[data-id="${id}"])', {
            'max-width': 'width'
          });

          expect(css(this._el, 'max-width')).toBe('none');
          expect(artifacts).toEqual({ foo: true });
        });

        it('evaluates the selector when process is called before insert', function() {
          var artifacts;

          fox.process({
            foo: [
              { id: 3, width: 100 },
              { id: 4, width: 200 }
            ]
          });
          artifacts = fox.insert('%forEach(foo, .bar[data-id="${id}"])', {
            'max-width': 'width'
          });

          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('200px');
          expect(artifacts).toEqual({ foo: true });
        });

        it('evaluates the selector multiple times when process is called multiple times', function() {
          var artifacts;

          fox.process({
            foo: [
              { id: 3, width: 100 }
            ]
          });
          artifacts = fox.insert('%forEach(foo, .bar[data-id="${id}"])', {
            'max-width': 'width'
          });

          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('none');
          expect(artifacts).toEqual({ foo: true });

          fox.process({
            foo: [
              { id: 3, width: 100 },
              { id: 4, width: 300 }
            ]
          });

          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('300px');

          fox.process({
            foo: [
              { id: 3, width: 100 },
              { id: 4, width: 350 }
            ]
          });

          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('350px');
        });
      });

      describe('when process is called', function() {
        it('can evaluate selector with nested property lookup from spec', function() {
          var artifacts;

          artifacts = fox.insert('%forEach(foo, .bar[data-id="${id}"])', {
            'max-width': 'data.width'
          });
          fox.process({
            foo: [
              { id: 3, data: { width: 100 } },
              { id: 4, data: { width: 200 } },
            ]
          });

          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('200px');
          expect(artifacts).toEqual({ foo: true });
        });

        it('can evaluate selector with missing property lookup from spec', function() {
          var artifacts;

          artifacts = fox.insert('%forEach(foo, .bar[data-id="${id}"])', {
            'max-width': 'width'
          });
          fox.process({
            foo: [
              { id: 3, width: 100 },
              { id: 4 }
            ]
          });

          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('none');
          expect(artifacts).toEqual({ foo: true });
        });

        it('can evaluate selector with expressions from spec', function() {
          var artifacts;

          artifacts = fox.insert('%forEach(foo, .bar[data-id="${id}"])', {
            'max-width': 'width + padding'
          });
          fox.process({
            foo: [
              { id: 3, width: 100, padding: 100 },
              { id: 4 }
            ]
          });

          expect(css(this._el, 'max-width')).toBe('200px');
          expect(css(this._el2, 'max-width')).toBe('none');
          expect(artifacts).toEqual({ foo: true });
        });

        // TODO: when the use case is required, allow for nested missing property lookup
        xit('can evaluate selector with nested missing property lookup from spec', function() {
          var artifacts;

          artifacts = fox.insert('%forEach(foo.baz, .bar[data-id="${id}"])', {
            'max-width': 'data.width'
          });
          fox.process({
            foo: {
              baz: [
                { id: 3 },
                { id: 4 }
              ]
            }
          });

          expect(css(this._el, 'max-width')).toBe('none');
          expect(css(this._el2, 'max-width')).toBe('none');
          expect(artifacts).toEqual({ 'foo.baz': true });
        });

        it('can evaluate selector with nested array lookup', function() {
          var artifacts;

          artifacts = fox.insert('%forEach(foo.baz, .bar[data-id="${id}"])', {
            'max-width': 'width'
          });
          fox.process({
            foo: {
              baz: [
                { id: 3, width: 100 },
                { id: 4, width: 200 }
              ]
            }
          });

          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('200px');
          expect(artifacts).toEqual({ 'foo.baz': true });
        });

        // TODO: when the use case is required, allow for nested property lookup
        xit('can evaluate selector with nested array lookup and nested property lookup', function() {
          var artifacts;

          artifacts = fox.insert('%forEach(foo.baz, .bar[data-id="${data.id}"])', {
            'max-width': 'width'
          });
          fox.process({
            foo: {
              baz: [
                { data: { id: 3, width: 100 } },
                { data: { id: 4, width: 200 } }
              ]
            }
          });

          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('200px');
          expect(artifacts).toEqual({ 'foo.baz': true });
        });
      });
    });

    describe('computed selector', function() {
      it('has no effect before process call', function() {
        var el = affix('div.bar'),
            artifacts = fox.insert('.${foo}', {
              'max-width': 'width'
            });

        expect(css(el, 'max-width')).toBe('none');
      });

      it('evaluates the selector', function() {
        var el = affix('div.bar'), artifacts;

        fox.process({ foo: 'bar', width: 100 });
        artifacts = fox.insert('.${foo}', {
          'max-width': 'width'
        });

        expect(css(el, 'max-width')).toBe('100px');
        expect(artifacts).toEqual({ foo: true, width: true });
      });

      it('evaluates the selector with nested replacements', function() {
        var el = affix('div.bar'), artifacts;

        fox.process({ foo: { baz: 'bar' }, width: 100 });
        artifacts = fox.insert('.${foo.baz}', {
          'max-width': 'width'
        });

        expect(css(el, 'max-width')).toBe('100px');
        expect(artifacts).toEqual({ width: true, 'foo.baz': true });
      });

      it('evaluates the selector with multiple replacements', function() {
        var el = affix('div.bar'), artifacts;

        fox.process({ foo: 'ba', baz: 'r', width: 100 });
        artifacts = fox.insert('.${foo}${baz}', {
          'max-width': 'width'
        });

        expect(css(el, 'max-width')).toBe('100px');
        expect(artifacts).toEqual({ foo: true, baz: true, width: true });
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

      it('maintains styles when selector changes', function() {
        var el = affix('div.bar.baz');
        fox.insert('.${foo}', {
          'max-width': 'width'
        });

        fox.process({ foo: 'bar', width: 100 });
        expect(css(el, 'max-width')).toBe('100px');

        fox.process({ foo: 'baz', width: 100 });
        expect(css(el, 'max-width')).toBe('100px');
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
