import expression from '../../../src/util/expression';

describe('expression parser', function() {
  describe('.parse()', function() {
    it('is callable', function() {
      expect(expression.parse).toEqual(jasmine.any(Function));
    });

    it('returns parse results', function() {
      var res = expression.parse('foo');
      expect(res).toEqual(jasmine.objectContaining({
        body: jasmine.any(String),
        artifacts: jasmine.any(Object),
      }));
    });

    it('returns the same parse results for the same input', function() {
      var res1 = expression.parse('foo');
      var res2 = expression.parse('foo');

      expect(res1.body).toEqual(res2.body);
      expect(res1.artifacts).toEqual(jasmine.objectContaining(res2.artifacts));
    });
  });

  describe('.compile()', function() {
    it('is callable', function() {
      expect(expression.compile).toEqual(jasmine.any(Function));
    });

    it('returns a compiled function with artifacts', function() {
      var res = expression.compile('foo');
      expect(res).toEqual(jasmine.any(Function));
      expect(res.artifacts).toEqual(jasmine.any(Object));
    });

    it('compiles a function that evaluates the expression', function() {
      var res = expression.compile('foo + 3');

      expect(res({ foo: 'bar' })).toBe('bar3');
      expect(res({ foo: 3 })).toBe(6);
    });

    it('compiles a function that evaluates call expressions', function() {
      var fn = expression.compile('exterminate(foo)');
      var calls = jasmine.createSpyObj('callables', ['exterminate']);
      calls.exterminate.and.returnValue('bar');
      var res = fn({ foo: 3 }, calls);
      expect(calls.exterminate).toHaveBeenCalledWith(3);
      expect(res).toBe('bar');
    });

    it('retains call expressions when unavailable', function() {
      var fn = expression.compile('exterminate(foo)');
      var res = fn({ foo: 3 });
      expect(res).toBe('exterminate(3)');
    });
  });

  describe('.compileSpec()', function() {
    it('is callable', function() {
      expect(expression.compileSpec).toEqual(jasmine.any(Function));
    });

    it('compiles an object of key/expression pairs', function() {
      var res = expression.compileSpec({
        alpha: 'o + 1',
        beta: 'o + 2',
        gamma: 'o + 3',
      });
      expect(res).toEqual(jasmine.any(Function));
    });

    it('evaluates an object of key/expression pairs', function() {
      var res = expression.compileSpec({
        alpha: 'o + 1',
        beta: 'o + 2',
        gamma: 'o + 3',
      });
      expect(res({ o: 0 })).toEqual(jasmine.objectContaining({
        alpha: 1,
        beta: 2,
        gamma: 3,
      }));
    });

    describe('array member expressions', function() {
      it('should evaluate in the context of the array member expression', function() {
        const res = expression.compileSpec({
          width: 'bar',
        }, 'foo[1]');

        const data = {
          foo: [
            { bar: 1 },
            { bar: 2 },
          ],
        };

        expect(res(data)).toEqual(jasmine.objectContaining({
          width: 2,
        }));
      });

      it('should evaluate using root level data', function() {
        const res = expression.compileSpec({
          width: 'bar',
          'max-width': '__root.baz.qux',
          height: '__root.baz.qux + __root.baz.quux',
        }, 'foo[1]');

        const data = {
          foo: [
            { bar: 1 },
            { bar: 2 },
          ],
          baz: {
            qux: 3,
            quux: 4,
          },
        };

        expect(res(data)).toEqual(jasmine.objectContaining({
          width: 2,
          'max-width': 3,
          height: 7,
        }));
      });
    });
  });
});
