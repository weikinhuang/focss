import Focss from '../..';

describe('Focss', function() {
  const payload = { foo: 'bar' };

  beforeEach(function() {
    this._fox = new Focss();
  });

  afterEach(function() {
    if (this._fox) {
      this._fox.destroy();
      this._fox = null;
    }
  });

  it('is instanciable', function() {
    let fox;

    expect(() => {
      fox = new Focss();
    }).not.toThrow();
    expect(fox).toBeDefined();

    fox.destroy();
    fox = null;
  });

  describe('#insert()', function() {
    it('inserts single rules', function() {
      spyOn(this._fox.engine, 'insert').and.returnValue({});

      this._fox.insert('.selector', {
        prop: ''
      });
      expect(this._fox.engine.insert)
      .toHaveBeenCalledWith('.selector', jasmine.objectContaining({
        prop: ''
      }));
    });
  });

  describe('#insertVars', function() {
    it('inserts variables', function() {
      var variables = {
        maxHeight: 40,
        defaultColor: 'red'
      };

      spyOn(this._fox.engine, 'insertVars');
      this._fox.insertVars(variables);
      expect(this._fox.engine.insertVars)
      .toHaveBeenCalledWith(jasmine.objectContaining(variables));
    });
  });

  describe('#process()', function() {
    it('calls its engine', function() {
      spyOn(this._fox.engine, 'process');

      this._fox.process(payload);
      expect(this._fox.engine.process).toHaveBeenCalledWith(payload);
    });
  });

  describe('#toString()', function() {
    it('returns a string of processed styles', function() {
      var payload = {
        a: 100,
        b: 200
      };

      this._fox.insert('.foo', {
        'max-width': 'a + b'
      });
      expect(this._fox.toString(payload)).toEqual('.foo{max-width:300px;}');
    });
  });

  describe('#toggleSelector()', function() {
    it('calls its engine', function() {
      spyOn(this._fox.engine, 'toggleSelector');

      this._fox.toggleSelector('hover1', true);
      expect(this._fox.engine.toggleSelector).toHaveBeenCalledWith('hover1', true);
    });
  });

  describe('#destroy()', function() {
    it('exists', function() {
      expect(this._fox.destroy).toEqual(jasmine.any(Function));
    });
  });
});
