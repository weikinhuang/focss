define(['src/eltable'], function(eltable) {
  var layer = {
    specificity: [{
      selector: '',
      specificity: 0
    }],
    result: {
    }
  };

  describe('eltable', function() {
    var div = affix('div');

    describe('.get()', function() {
      it('returns a set', function() {
        spyOn(eltable, 'mark');
        var res = eltable.get(div[0]);
        expect(res.add).toEqual(jasmine.any(Function));
        expect(res.has).toEqual(jasmine.any(Function));
        expect(res.delete).toEqual(jasmine.any(Function));
      });

      it('marks as dirty', function() {
        spyOn(eltable, 'mark');
        eltable.get(div[0]);
        expect(eltable.mark).toHaveBeenCalledWith(div[0]);
      });
    });

    describe('.mark()', function() {
      it('calls .sweep() asynchronously', function(done) {
        spyOn(eltable, 'sweep').and.callFake(done);
        eltable.mark(div[0]);
      });
    });

    describe('.sweep()', function() {
      it('clears marked items', function(done) {
        spyOn(eltable, 'sweep').and.callThrough();
        eltable.mark(div[0]);
        eltable.mark(div[0]);
        eltable.sweep();

        eltable.sweep.and.stub();
        eltable.mark(div[0]);
        expect(eltable.sweep.calls.count()).toBe(1);
        setTimeout(function() {
          expect(eltable.sweep.calls.count()).toBe(2);
          done();
        }, 100);
      });
    });

    describe('.remove()', function() {
      it('removes an element from tracking', function() {
        var first = eltable.get(div[0]);
        eltable.remove(div[0]);
        var second = eltable.get(div[0]);

        expect(first).not.toBe(second);
      });
    });
  });
});
