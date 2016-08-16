import Engine from '../../../src/Engine';
import Rule from '../../../src/Rule';

describe('Engine', function() {
  beforeEach(function() {
    this._engine = new Engine();
  });

  afterEach(function() {
    if (this._engine) {
      this._engine.destroy();
    }
  });

  it('is a constructor', function() {
    let engine;

    expect(function() {
      engine = new Engine();
    }).not.toThrow();
    expect(engine).toBeDefined();

    engine.destroy();
  });

  describe('#process()', function() {
    it('runs individual rule.process()', function() {
      spyOn(Rule.prototype, 'process');
      const payload = {
        foo: 'bar'
      };
      const rule = this._engine.insert('selector', {});
      this._engine.process(payload);
      expect(rule.process).toHaveBeenCalledWith(jasmine.objectContaining(payload), jasmine.anything());
    });

    it('merges variable data with user data', function() {
      spyOn(Rule.prototype, 'process');
      const payload = {
        foo: 'bar'
      };
      const variables = {
        someVar: 'someValue'
      };
      const expected = Object.assign({}, payload, { __var: variables });

      this._engine.insertVars(variables);
      const rule = this._engine.insert('selector', {});
      this._engine.process(payload);

      expect(rule.process).toHaveBeenCalledWith(jasmine.objectContaining(expected), jasmine.anything());
    });

    it('processes rules with variable data', function() {
      this._engine.insertVars({
        foo: '.container',
        bar: 'red'
      });
      this._engine.insert('${__var.foo}', {
        width: 'dynamic',
        color: '__var.bar'
      });
      this._engine.process({ dynamic: 'foobar' });
      expect(this._engine.rules[0].computedSelector).toBe('.container');
      expect(this._engine.rules[0].artifacts).toEqual({
        dynamic: true,
        '__var.foo': true,
        '__var.bar': true
      });
    });
  });

  describe('#insertVars', function() {
    beforeEach(function() {
      this._variables = {
        maxHeight: 40,
        defaultColor: 'red'
      };
      this._variables2 = {
        maxHeight: 1000,
        anotherDefault: '300px'
      };
    });

    afterEach(function() {
      delete this._variables;
      delete this._variables2;
    });

    it('inserts variables', function() {
      this._engine.insertVars(this._variables);
      expect(this._engine.variables).toEqual(this._variables);
    });

    it('inserts new and overwrites pre-existing variables', function() {
      this._engine.insertVars(this._variables);
      expect(this._engine.variables).toEqual(this._variables);

      this._engine.insertVars(this._variables2);
      expect(this._engine.variables).toEqual({
        maxHeight: 1000,
        defaultColor: 'red',
        anotherDefault: '300px'
      });
    });
  });

  describe('#toString()', function() {
    beforeEach(function() {
      this.payload = {
        a: 100,
        b: 200,
        c: 300
      };
    });

    it('returns an empty string if no rules are inserted', function() {
      expect(this._engine.toString(this.payload)).toEqual('');
    });

    it('returns processed styles in the order in which they are inserted', function() {
      this._engine.insert('.foo', {
        'max-width': 'a + b'
      });
      this._engine.insert('.bar', {
        width: 'c'
      });
      this._engine.insert('.baz', {
        height: 'a + c'
      });
      expect(this._engine.toString(this.payload)).toEqual('.foo{max-width:300px;}.bar{width:300px;}.baz{height:400px;}');
    });

    it('returns processed styles when the inserted rules contain multiple properties', function() {
      this._engine.insert('.foo', {
        'max-width': 'a + b',
        width: 'b - a',
        height: 'a + c'
      });
      expect(this._engine.toString(this.payload)).toEqual('.foo{max-width:300px;width:100px;height:400px;}');
    });

    it('does not delete previously inserted rules when called', function() {
      this._engine.insert('.foo', {
        'max-width': 'a + b'
      });
      expect(this._engine.toString(this.payload)).toEqual('.foo{max-width:300px;}');
      this._engine.insert('.bar', {
        width: 'c'
      });
      expect(this._engine.toString(this.payload)).toEqual('.foo{max-width:300px;}.bar{width:300px;}');
    });
  });

  describe('#toggleSelector()', function() {
    beforeEach(function() {
      this._engine.insert('selector', {});
      this._engine.process({});
      this._engine.toggleSelector('key1', true);
      spyOn(this._engine, 'process');
    });

    it('it does not run rule.process() if the keys value has not changed', function() {
      this._engine.toggleSelector('key1', true);
      expect(this._engine.process).not.toHaveBeenCalled();
    });

    it('it runs rule.process() if the keys value has changed', function() {
      this._engine.toggleSelector('key1', false);
      expect(this._engine.process).toHaveBeenCalled();
    });

    it('it does not run rule.process() if the keys value is falsey and has not been set before', function() {
      this._engine.toggleSelector('newkey2', false);
      expect(this._engine.process).not.toHaveBeenCalled();
    });
  });

  describe('#insert()', function() {
    it('inserts a new Rule', function() {
      const rule = this._engine.insert('.selector', {});
      expect(rule).toBeDefined();
      expect(rule).toEqual(jasmine.any(Rule));
    });

    describe('media queries', function() {
      beforeEach(function() {
        this._engine.insert('@media screen and (max-width: 300px)', {
          '.class1': {
            width: 'foo',
            color: 'bar'
          },
          '%forEach(baz, .class2[data-id="%id%"])': {
            'max-width': 'qux'
          }
        });
      });

      it('inserts a media query rule', function() {
        expect(this._engine.mediaQueries[0]).toBeDefined();
        expect(this._engine.mediaQueries.length).toEqual(1);
      });

      it('contains the correct artifacts', function() {
        expect(this._engine.mediaQueries[0].artifacts).toEqual({
          foo: true,
          bar: true,
          baz: true
        });
      });
    });
  });
});
