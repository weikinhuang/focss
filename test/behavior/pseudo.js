define(['index', 'src/eltable'], function(Focss, eltable) {
  // IMPORTANT: We can't do pseudo-elements!
  // e.g. ::first-letter, ::before, ::after
  var fox, timeout = 100;

  describe('positional pseudo class selectors', function() {
    beforeEach(function() {
      fox = new Focss();
    });

    afterEach(function() {
      fox.destroy();
      fox = null;
    });

    describe(':first-child', function() {
      it('affects only the first child', function(done) {
        var ul = affix('ul li+li+li');
        var first = ul.find('li:first-child'), second = first.next(), last = second.next();
        fox.insert('li:first-child', { 'max-width': 'foo' });
        fox.process({ foo: 100 });

        requestAnimationFrame(function() {
          expect(first.css('max-width')).toBe('100px');
          expect(second.css('max-width')).toBe('none');
          expect(last.css('max-width')).toBe('none');
          done();
        });
      });

      it('tracks positions', function(done) {
        var ul = affix('ul li+li+li');
        var first = ul.find('li:first-child'), second = first.next(), last = second.next();
        fox.insert('li:first-child', { 'max-width': 'foo' });
        fox.process({ foo: 100 });

        ul[0].insertBefore(second[0], first[0]);

        requestAnimationFrame(function() {
          expect(first.css('max-width')).toBe('none');
          expect(second.css('max-width')).toBe('100px');
          expect(last.css('max-width')).toBe('none');
          done();
        });
      });
    });

    describe(':last-child', function() {
      it('affects only the last child', function(done) {
        var ul = affix('ul li+li+li');
        var last = ul.find('li:last-child'), second = last.prev(), first = second.prev();
        fox.insert('li:last-child', { 'max-width': 'foo' });
        fox.process({ foo: 100 });

        requestAnimationFrame(function() {
          expect(last.css('max-width')).toBe('100px');
          expect(second.css('max-width')).toBe('none');
          expect(first.css('max-width')).toBe('none');
          done();
        });
      });

      it('tracks positions', function(done) {
        var ul = affix('ul li+li+li');
        var last = ul.find('li:last-child'), second = last.prev(), first = second.prev();
        fox.insert('li:last-child', { 'max-width': 'foo' });
        fox.process({ foo: 100 });

        ul[0].appendChild(second[0]);

        requestAnimationFrame(function() {
          expect(last.css('max-width')).toBe('none');
          expect(second.css('max-width')).toBe('100px');
          expect(first.css('max-width')).toBe('none');
          done();
        });
      });
    });

    describe(':first-of-type', function() {
      it('affects only the first of tag type', function(done) {
        var ul = affix('section div+span+span+h1');
        var target = $(ul[0].querySelector('span:first-of-type'));

        fox.insert('span:first-of-type', { 'max-width': 'foo' });
        fox.process({ foo: 100 });

        requestAnimationFrame(function() {
          expect(target.css('max-width')).toBe('100px');
          expect(target.siblings().css('max-width')).toBe('none');
          done();
        });
      });

      it('tracks positions', function(done) {
        var ul = affix('section div+span+span+h1');
        var target = $(ul[0].querySelector('span:first-of-type'));

        fox.insert('span:first-of-type', { 'max-width': 'foo' });
        fox.process({ foo: 100 });

        var span = document.createElement('span');
        ul[0].insertBefore(span, ul[0].childNodes[0]);

        requestAnimationFrame(function() {
          expect(target.css('max-width')).toBe('none');
          expect($(span).css('max-width')).toBe('100px');
          done();
        });
      });
    });

    describe(':last-of-type', function() {
      it('affects only the last of tag type', function(done) {
        var ul = affix('section div+span+span+h1');
        var target = $(ul[0].querySelector('span:last-of-type'));

        fox.insert('span:last-of-type', { 'max-width': 'foo' });
        fox.process({ foo: 100 });

        requestAnimationFrame(function() {
          expect(target.css('max-width')).toBe('100px');
          expect(target.siblings().css('max-width')).toBe('none');
          done();
        });
      });

      it('tracks positions', function(done) {
        var ul = affix('section div+span+span+h1');
        var target = $(ul[0].querySelector('span:last-of-type'));

        fox.insert('span:last-of-type', { 'max-width': 'foo' });
        fox.process({ foo: 100 });

        var span = document.createElement('span');
        ul[0].appendChild(span);

        requestAnimationFrame(function() {
          expect(target.css('max-width')).toBe('none');
          expect($(span).css('max-width')).toBe('100px');
          done();
        });
      });
    });

    describe(':only-of-type', function() {
      it('affects only the last of tag type', function(done) {
        var ul = affix('section div+span+span+h1');
        var target = $(ul[0].querySelector('div:only-of-type'));

        fox.insert('div:only-of-type', { 'max-width': 'foo' });
        fox.process({ foo: 100 });

        requestAnimationFrame(function() {
          expect(target.css('max-width')).toBe('100px');
          expect(target.siblings().css('max-width')).toBe('none');
          done();
        });
      });

      it('tracks positions', function(done) {
        var ul = affix('section div+span+span+h1');
        var target = $(ul[0].querySelector('div:only-of-type'));

        fox.insert('div:only-of-type', { 'max-width': 'foo' });
        fox.process({ foo: 100 });

        requestAnimationFrame(function() {
          expect(target.css('max-width')).toBe('100px');
          var div = document.createElement('div');
          ul[0].appendChild(div);

          setTimeout(function() {
            expect(target.css('max-width')).toBe('none');
            expect($(div).css('max-width')).toBe('none');
            done();
          }, timeout);
        });
      });
    });
    describe(':nth-child()', function() {});
    describe(':nth-of-type()', function() {});
    describe(':nth-last-of-type()', function() {});
    describe(':nth-last-child()', function() {});
  });

  describe('relational pseudo class selectors', function() {
    describe(':not()', function() {});
    describe(':empty', function() {});
  });

  /*
  describe('input pseudo class selectors', function() {
    // IMPORTANT: :visited is impossible due to security restrictions
    describe(':link', function() {});
    describe(':active', function() {});
    describe(':hover', function() {});
    describe(':focus', function() {});
    describe(':enabled', function() {});
    describe(':disabled', function() {});
    describe(':checked', function() {});
    describe(':indeterminate', function() {});
  });
 */
});
