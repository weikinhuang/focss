define(['index'], function(Focss) {
  var fox, timeout = 100;

  function insertSpecs(selector) {
    it(selector + ' affects existing elements', function(done) {
      affix(selector);

      fox.insert(selector, {
        'max-width': 'width'
      });

      fox.process({ width: 100 });

      setTimeout(function() {
        expect($(selector).css('max-width')).toBe('100px');
        done();
      }, timeout);
    });

    it(selector + ' affects new elements', function(done) {
      fox.insert(selector, {
        'max-width': 'width'
      });

      fox.process({ width: 100 });

      affix(selector);

      setTimeout(function() {
        expect($(selector).css('max-width')).toBe('100px');
        done();
      }, timeout);
    });

    it(selector + ' affects existing elements with newly inserted rule', function(done) {
      fox.process({ width: 100 });

      affix(selector);

      fox.insert(selector, {
        'max-width': 'width'
      });

      setTimeout(function() {
        expect($(selector).css('max-width')).toBe('100px');
        done();
      }, timeout);
    });

    it(selector + ' affects new elements with newly inserted rule', function(done) {
      fox.process({ width: 100 });

      fox.insert(selector, {
        'max-width': 'width'
      });

      affix(selector);

      setTimeout(function() {
        expect($(selector).css('max-width')).toBe('100px');
        done();
      }, timeout);
    });
  }

  describe('static rules', function() {
    beforeEach(function() {
      fox = new Focss();
    });

    afterEach(function() {
      fox.destroy();
      fox = null;
    });

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
