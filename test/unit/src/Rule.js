import Rule from '../../../src/Rule';

describe('Rule', function() {
  var rule;
  it('is a constructor', function() {
    rule = new Rule('section', {});

    expect(rule).toBeDefined();
  });

  it('normalizes CSS2 pseudo-element selectors', function() {
    rule = new Rule('section:after, section:before, section:first-line, section:first-letter', {});

    expect(rule.selector).toBe('section::after, section::before, section::first-line, section::first-letter');
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
    });

    it('calculates computed selectors', function() {
      rule = new Rule('.${dynamic}', {});
      rule.process({ dynamic: 'foobar' });
      expect(rule.computedSelector).toBe('.foobar');
    });

    it('calculates result', function() {
      rule = new Rule('.static', {
        foo: 'bar'
      });
      rule.process({ bar: 'baz' });
      expect(rule.result).toEqual({ foo: 'baz' });
    });

    it('calculates result with extensions', function() {
      rule = new Rule('.extended', {
        foo: 'bar()'
      });

      var bar = jasmine.createSpy('extension').and.returnValue('baz');
      rule.process({}, { bar });

      expect(bar).toHaveBeenCalled();
      expect(rule.result).toEqual({ foo: 'baz' });
    });

    it('calculates non-idempotent extensions', function() {
      rule = new Rule('.extended', {
        foo: 'bar()'
      });

      var bar = jasmine.createSpy('extension').and.returnValues('bar', 'baz');

      rule.process({}, { bar });
      expect(rule.result).toEqual({ foo: 'bar' });

      rule.process({}, { bar });
      expect(rule.result).toEqual({ foo: 'baz' });
    });

    it('ignores missing extensions', function() {
      rule = new Rule('.extended', {
        foo: 'bar()'
      });
      rule.process({});

      expect(rule.result).toEqual({ foo: 'bar()' });
    });
  });

  describe('#getSelector()', function() {
    it('returns all selector parts', function() {
      rule = new Rule('.foo1,.foo2,.foo3', {});
      rule.process();

      var res = rule.getSelector();
      expect(res.split(',').length).toBe(3);
      expect(res).toEqual(rule.selector);
    });
  });
});
