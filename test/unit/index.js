define(['index'], function(Focss) {
  describe('Focss', function() {
    var fox, payload = { foo: 'bar' };

    fox = new Focss();

    it('is instanciable', function() {
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

    describe('#destroy()', function() {
      it('exists', function() {
        expect(fox.destroy).toEqual(jasmine.any(Function));
      });
    });
  });
});
