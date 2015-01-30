define(['index'], function(Focss) {
  var fox;

  beforeEach(function() {
    fox = new Focss();
  });
  afterEach(function() {
    fox.destroy();
    fox = null;
  });

  function insertSpecs(selector) {
    it('affects existing elements', function(done) {
      affix(selector);

      fox.insert(selector, {
        'max-width': 'width'
      });

      fox.process({ width: 100 });

      requestAnimationFrame(function() {
        expect($(selector).css('max-width')).toBe('100px');
        done();
      });
    });

    it('affects new elements', function(done) {
      fox.insert(selector, {
        'max-width': 'width'
      });

      fox.process({ width: 100 });

      affix(selector);

      requestAnimationFrame(function() {
        expect($(selector).css('max-width')).toBe('100px');
        done();
      });
    });

    it('affects existing elements with newly inserted rule', function(done) {
      fox.process({ width: 100 });

      affix(selector);

      fox.insert(selector, {
        'max-width': 'width'
      });

      requestAnimationFrame(function() {
        expect($(selector).css('max-width')).toBe('100px');
        done();
      });
    });

    it('affects new elements with newly inserted rule', function(done) {
      fox.process({ width: 100 });

      fox.insert(selector, {
        'max-width': 'width'
      });

      affix(selector);

      requestAnimationFrame(function() {
        expect($(selector).css('max-width')).toBe('100px');
        done();
      });
    });
  }

  describe('static rules', function() {
    describe('id selectors', function() {
      insertSpecs('#foo');
    });

    describe('class selectors', function() {
      insertSpecs('.bar');
      insertSpecs('.foo.bar.baz');
    });

    describe('descendant selectors', function() {
      insertSpecs('div span ul li');
    });

    describe('direct descendant selectors', function() {
      insertSpecs('foo > bar > baz');
    });

    describe('attribute selectors', function() {
      insertSpecs('div[data-bind="my_item"]');
    });

    describe('sibling positional selectors', function() {
      insertSpecs('div h1+h2');
    });

    describe('tag selectors', function() {
      insertSpecs('article#foo');
      insertSpecs('section.bar');
    });
  });
});
