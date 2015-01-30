define(['index'], function(Focss) {
  var fox;

  beforeEach(function() {
    fox = new Focss();
  });
  afterEach(function() {
    fox.destroy();
    fox = null;
  });

  describe('dynamic rules', function() {
    describe('computed selector', function() {
      it('has no effect before process call', function(done) {
        var el = affix('div.bar');

        fox.insert('.${foo}', {
          'max-width': 'width'
        });

        requestAnimationFrame(function() {
          expect(el.css('max-width')).toBe('none');
          done();
        });
      });

      it('evaluates the selector', function(done) {
        var el = affix('div.bar');

        fox.process({ foo: 'bar', width: 100 });
        fox.insert('.${foo}', {
          'max-width': 'width'
        });

        requestAnimationFrame(function() {
          expect(el.css('max-width')).toBe('100px');
          done();
        });
      });

      it('removes styles when selector no longer matches', function(done) {
        var el = affix('div.bar');
        fox.insert('.${foo}', {
          'max-width': 'width'
        });

        fox.process({ foo: 'bar', width: 100 });
        requestAnimationFrame(function() {
          expect(el.css('max-width')).toBe('100px');
          fox.process({ foo: 'baz', width: 40 });

          requestAnimationFrame(function() {
            expect(el.css('max-width')).toBe('none');
            done();
          });
        });
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
      it('applies styles to new elements', function(done) {
        var el = affix('.bar');

        setTimeout(function() {
          expect(el.css('max-width')).toBe('100px');
          done();
        }, 50);
      });

      it('adds element styles when their attributes change', function(done) {
        var el = affix('.baz');
        requestAnimationFrame(function() {
          expect(el.css('max-width')).toBe('none');
          el.addClass('bar');

          setTimeout(function() {
            expect(el.css('max-width')).toBe('100px');
            done();
          }, 50);
        });
      });

      it('removes element styles when their attributes change', function(done) {
        var el = affix('.bar');
        setTimeout(function() {
          expect(el.css('max-width')).toBe('100px');
          el.removeClass('bar');

          setTimeout(function() {
            expect(el.css('max-width')).toBe('none');
            done();
          }, 50);
        }, 50);
      });

      it('affects descendants when ancestors\' attributes change', function(done) {
        fox.insert('.bar .stool', { 'max-height': 'width' });

        var el = affix('.baz .stool');
        var stool = el.find('.stool');

        requestAnimationFrame(function() {
          expect(stool.css('max-height')).toBe('none');
          el.addClass('bar');

          setTimeout(function() {
            expect(stool.css('max-height')).toBe('100px');
            done();
          }, 50);
        });
      });
    });
  });
});
