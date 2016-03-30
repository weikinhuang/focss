define(['src/Engine'], function(Engine) {
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
      expect(function() {
        new Engine();
      }).not.toThrow();
    });

    describe('#process()', function() {
      it('runs individual rule.process()', function() {
        spyOn(Engine, 'Rule')
        .and.returnValue(jasmine.createSpyObj('rule', ['process', 'getSelector']));

        var payload = {
          foo: 'bar'
        },
        rule = this._engine.insert('selector', {});
        this._engine.process(payload);
        expect(rule.process).toHaveBeenCalledWith(jasmine.objectContaining(payload), jasmine.anything());
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
        var rule = this._engine.insert('.selector', {});
        expect(rule).toBeDefined();
        expect(rule).toEqual(jasmine.any(Engine.Rule));
      });

      it('processes last process state', function() {
        var payload = {
          foo: 'bar'
        };
        this._engine.process(payload);

        spyOn(Engine, 'Rule')
        .and.returnValue(jasmine.createSpyObj('rule', ['process', 'getSelector']));
        var rule = this._engine.insert('.selector', {});
        expect(rule.process).toHaveBeenCalledWith(jasmine.objectContaining(payload), jasmine.anything());
      });
    });
  });
});
