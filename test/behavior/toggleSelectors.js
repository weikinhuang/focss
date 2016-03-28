define(['index'], function(Focss) {
  function css(el, prop) {
    return window.getComputedStyle(el[0] || el)[prop];
  }

  describe('toggleSelectors rules', function() {
    beforeEach(function() {
      this._fox = new Focss();
    });

    afterEach(function() {
      this._fox.destroy();
      this._fox = null;
    });

    describe('for normal selectors', function() {
      beforeEach(function() {
        this._fox.process({
          width: 20
        });
      });

      describe('with a single psuedo selector', function() {
        beforeEach(function() {
          this._el = affix('div.bar');
          this._fox.insert('.bar:hover', {
            'max-width': 'width'
          });
        });

        it('creates a trace linking the selector to the specs modifying it', function() {
          expect(this._fox.traces).toEqual({
            hover1: {
              width: true,
              '__toggled__.hover1': true
            }
          });
        });

        it('can be toggled to simulate a forced psuedo state', function() {
          expect(css(this._el, 'max-width')).toBe('none');

          this._fox.toggleSelector('hover1', true);
          expect(css(this._el, 'max-width')).toBe('20px');

          this._fox.toggleSelector('hover1', false);
          expect(css(this._el, 'max-width')).toBe('none');
        });
      });

      describe('with multiple psuedo selector', function() {
        beforeEach(function() {
          this._el = affix('div.bar');
          this._fox.insert('.bar:hover, .bar:active', {
            'max-width': 'width'
          });
        });

        it('creates a trace linking the selector to the specs modifying it', function() {
          expect(this._fox.traces).toEqual({
            hover1: {
              width: true,
              '__toggled__.hover1': true
            }
          });
        });

        it('can be toggled to simulate a forced psuedo state', function() {
          expect(css(this._el, 'max-width')).toBe('none');

          this._fox.toggleSelector('hover1', true);
          expect(css(this._el, 'max-width')).toBe('20px');

          this._fox.toggleSelector('hover1', false);
          expect(css(this._el, 'max-width')).toBe('none');
        });
      });

      describe('with togglable class selector', function() {
        beforeEach(function() {
          this._el = affix('div.bar.__sent');
          this._fox.insert('.bar.__sent', {
            'max-width': 'width'
          });
        });

        it('creates a trace linking the selector to the specs modifying it', function() {
          expect(this._fox.traces).toEqual({
            __sent1: {
              width: true,
              '__toggled__.__sent1': true
            }
          });
        });

        it('can be toggled to simulate a forced psuedo state', function() {
          expect(css(this._el, 'max-width')).toBe('20px');

          this._fox.toggleSelector('__sent1', true);
          expect(css(this._el, 'max-width')).toBe('none');

          this._fox.toggleSelector('__sent1', false);
          expect(css(this._el, 'max-width')).toBe('20px');
        });
      });
    });
  });
});
