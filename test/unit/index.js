define(['index'], function(Focss) {
  describe('Focss', function() {
    var fox;
    var payload = { foo: 'bar' };

    it('is instanciable', function() {
      expect(function() {
        fox = new Focss();
      }).not.toThrow();
      expect(fox).toBeDefined();
    });

    describe('#insert()', function() {
      it('inserts single rules', function() {
        spyOn(fox.engine, 'insert').and.returnValue({});

        fox.insert('.selector', {
          prop: ''
        });
        expect(fox.engine.insert)
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

        spyOn(fox.engine, 'insertVars');
        fox.insertVars(variables);
        expect(fox.engine.insertVars)
        .toHaveBeenCalledWith(jasmine.objectContaining(variables));
      });
    });

    describe('#process()', function() {
      it('calls its engine', function() {
        spyOn(fox.engine, 'process');

        fox.process(payload);
        expect(fox.engine.process).toHaveBeenCalledWith(payload);
      });
    });

    describe('#toString()', function() {
      it('returns a string of processed styles', function() {
        var payload = {
          a: 100,
          b: 200
        };

        fox.insert('.foo', {
          'max-width': 'a + b'
        });
        expect(fox.toString(payload)).toEqual('.foo{max-width:300px;}');
      });
    });

    describe('#toggleSelector()', function() {
      it('calls its engine', function() {
        spyOn(fox.engine, 'toggleSelector');

        fox.toggleSelector('hover1', true);
        expect(fox.engine.toggleSelector).toHaveBeenCalledWith('hover1', true);
      });
    });

    describe('#destroy()', function() {
      it('exists', function() {
        expect(fox.destroy).toEqual(jasmine.any(Function));
      });
    });
  });
});
