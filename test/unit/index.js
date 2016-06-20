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

    describe('#process()', function() {
      it('calls its engine', function() {
        spyOn(fox.engine, 'process');

        fox.process(payload);
        expect(fox.engine.process).toHaveBeenCalledWith(payload);
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
