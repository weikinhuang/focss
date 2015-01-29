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

    it('observes DOM mutations', function() {
      spyOn(window, 'MutationObserver')
      .and.returnValue(jasmine.createSpyObj('mutation', ['disconnect']));

      engine = new Engine();
      expect(window.MutationObserver).toHaveBeenCalledWith(jasmine.any(Function));
    });

    describe('#process()', function() {
      beforeEach(function() {
        engine = new Engine();
      });

      it('runs individual rule.process()', function() {
        spyOn(Engine, 'Rule')
        .and.returnValue(jasmine.createSpyObj('rule', ['process', 'destroy']));

        var payload = {
          foo: 'bar'
        },
        rule = engine.insert('selector', {});
        engine.process(payload);
        expect(rule.process).toHaveBeenCalledWith(payload);
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
        .and.returnValue(jasmine.createSpyObj('rule', ['process', 'destroy']));
        var rule = engine.insert('.selector', {});
        expect(rule.process).toHaveBeenCalledWith(payload);
      });
    });
  });
});
