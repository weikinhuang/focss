define(['src/Engine'], function(Engine) {
  describe('Engine', function() {
    var engine;
    afterEach(function() {
      if (engine) {
        engine.destroy();
      }
      engine = null;
    });

    it('is a constructor', function() {
      expect(function() {
        engine = new Engine();
      }).not.toThrow();
    });

    describe('#process()', function() {
      beforeEach(function() {
        engine = new Engine();
      });

      it('runs individual rule.process()', function() {
        spyOn(Engine, 'Rule')
        .and.returnValue(jasmine.createSpyObj('rule', ['process', 'getSelector']));

        var payload = {
          foo: 'bar'
        },
        rule = engine.insert('selector', {});
        engine.process(payload);
        expect(rule.process).toHaveBeenCalledWith(payload, jasmine.anything());
      });
    });

    describe('#insert()', function() {
      beforeEach(function() {
        engine = new Engine();
      });

      it('inserts a new Rule', function() {
        var rule = engine.insert('.selector', {});
        expect(rule).toBeDefined();
        expect(rule).toEqual(jasmine.any(Engine.Rule));
      });

      it('processes last process state', function() {
        var payload = {
          foo: 'bar'
        };
        engine.process(payload);

        spyOn(Engine, 'Rule')
        .and.returnValue(jasmine.createSpyObj('rule', ['process', 'getSelector']));
        var rule = engine.insert('.selector', {});
        expect(rule.process).toHaveBeenCalledWith(payload, jasmine.anything());
      });
    });
  });
});
