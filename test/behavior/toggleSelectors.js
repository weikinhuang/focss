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
              width: true
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
              width: true
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
              width: true
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

    describe('for arrayLike selectors', function() {
      beforeEach(function() {
        this._el = affix('div.bar[data-id="3"]');
        this._el2 = affix('div.bar[data-id="4"]');
        this._el3 = affix('div.bar[data-id="5"]');
        this._fox.process({
          foo: [
            { id: 3, width: 100 },
            { id: 4, width: 200 },
            { id: 5, width: 300 }
          ]
        });
      });

      describe('with a forEach selector', function() {
        beforeEach(function() {
          this._fox.insert('%forEach(foo, .bar[data-id="%id%"]:hover)', {
            'max-width': 'width'
          });
        });

        it('creates a trace linking the selector to the specs modifying it', function() {
          expect(this._fox.traces).toEqual({
            hover1_id_3: {
              'foo.0.width': true
            },
            hover1_id_4: {
              'foo.1.width': true
            },
            hover1_id_5: {
              'foo.2.width': true
            }
          });
        });

        it('modifies traces when array order changes', function() {
          this._fox.process({
            foo: [
              { id: 4, width: 200 },
              { id: 3, width: 100 },
              { id: 5, width: 300 }
            ]
          });

          expect(this._fox.traces).toEqual({
            hover1_id_4: {
              'foo.0.width': true
            },
            hover1_id_3: {
              'foo.1.width': true
            },
            hover1_id_5: {
              'foo.2.width': true
            }
          });
        });

        it('can be toggled to simulate a forced psuedo state', function() {
          expect(css(this._el, 'max-width')).toBe('none');
          expect(css(this._el2, 'max-width')).toBe('none');
          expect(css(this._el3, 'max-width')).toBe('none');

          this._fox.toggleSelector('hover1_id_3', true);
          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('none');
          expect(css(this._el3, 'max-width')).toBe('none');

          this._fox.toggleSelector('hover1_id_4', true);
          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('200px');
          expect(css(this._el3, 'max-width')).toBe('none');

          this._fox.toggleSelector('hover1_id_5', true);
          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('200px');
          expect(css(this._el3, 'max-width')).toBe('300px');

          this._fox.toggleSelector('hover1_id_3', false);
          this._fox.toggleSelector('hover1_id_4', false);
          this._fox.toggleSelector('hover1_id_5', false);
          expect(css(this._el, 'max-width')).toBe('none');
          expect(css(this._el2, 'max-width')).toBe('none');
          expect(css(this._el3, 'max-width')).toBe('none');
        });

        it('preserves state even when array order changes', function() {
          this._fox.toggleSelector('hover1_id_3', true);
          this._fox.toggleSelector('hover1_id_4', true);
          this._fox.toggleSelector('hover1_id_5', true);
          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('200px');
          expect(css(this._el3, 'max-width')).toBe('300px');

          this._fox.process({
            foo: [
              { id: 4, width: 200 },
              { id: 3, width: 100 },
              { id: 5, width: 300 }
            ]
          });
          expect(css(this._el, 'max-width')).toBe('100px');
          expect(css(this._el2, 'max-width')).toBe('200px');
          expect(css(this._el3, 'max-width')).toBe('300px');
        });
      });
    });
  });
});
