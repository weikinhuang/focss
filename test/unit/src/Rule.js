define(['src/Rule'], function(Rule) {
  describe('Rule', function() {
    var rule;
    it('is a constructor', function() {
      rule = new Rule('section', {});

      expect(rule).toBeDefined();
    });

    it('needs a selector and body', function() {
      expect(function() {
        rule = new Rule();
      }).toThrow();

      expect(function() {
        rule = new Rule([], {});
      }).toThrow();

      expect(function() {
        rule = new Rule('', {});
      }).not.toThrow();
    });

    it('accepts expressions in selectors', function() {
      expect(function() {
        rule = new Rule('#${foo}', {});
      }).not.toThrow();

      expect(rule.artifacts.foo).toBeDefined();
      expect(rule.isComputed).toBeTruthy();
    });

    it('compiles body into a function', function() {
      rule = new Rule('', {
        marco: 'polo'
      });

      expect(rule.body).toEqual(jasmine.any(Function));
      expect(rule.body({
        polo: 3
      })).toEqual(jasmine.objectContaining({
        marco: 3
      }));
    });

    describe('#process()', function() {
      it('calculates static selectors', function() {
        rule = new Rule('.static', {});
        rule.process();
        expect(rule.computedSelector).toBe('.static');
        expect(rule.specificity).toBeDefined();
      });

      it('calculates computed selectors', function() {
        rule = new Rule('.${dynamic}', {});
        rule.process({ dynamic: 'foobar' });
        expect(rule.computedSelector).toBe('.foobar');
        expect(rule.specificity).toBeDefined();
      });

      it('calculates result', function() {
        rule = new Rule('.static', {
          foo: 'bar'
        });
        rule.process({ bar: 'baz' });
        expect(rule.result).toEqual(jasmine.objectContaining({
          foo: 'baz'
        }));
      });
    });
  });
});
