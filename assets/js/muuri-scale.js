(() => {
  const Muuri = window.Muuri;
  if (!Muuri || !Muuri.Item || !Muuri.ItemDrag) return;

  const pageScale = () => parseFloat(getComputedStyle(document.documentElement).zoom) || 1;

  const wrap = (proto, name, { before, after }) => {
    const original = proto[name];
    proto[name] = function (...args) {
      const snapshot = before ? before.call(this) : null;
      const result = original.apply(this, args);
      const scale = pageScale();
      if (scale !== 1) after.call(this, scale, snapshot);
      return result;
    };
  };

  const unscaleSize = function (scale) {
    this._width /= scale;
    this._height /= scale;
  };

  const isDragging = function () {
    return this._isActive && this._item && this._item._isActive;
  };

  const unscaleContainerDiff = function (scale) {
    if (this._container && this._container !== this._getGrid()._element) {
      this._containerDiffX /= scale;
      this._containerDiffY /= scale;
    }
  };

  wrap(Muuri.Item.prototype, '_refreshDimensions', { after: unscaleSize });
  wrap(Muuri.prototype, '_updateBoundingRect', { after: unscaleSize });

  wrap(Muuri.ItemDrag.prototype, '_prepareStart', {
    after(scale) {
      if (isDragging.call(this)) unscaleContainerDiff.call(this, scale);
    },
  });

  wrap(Muuri.ItemDrag.prototype, '_prepareMove', {
    before() {
      return { x: this._moveDiffX, y: this._moveDiffY };
    },
    after(scale, prev) {
      const k = 1 / scale - 1;
      const dx = (this._moveDiffX - prev.x) * k;
      const dy = (this._moveDiffY - prev.y) * k;
      this._left += dx;
      this._gridX += dx;
      this._top += dy;
      this._gridY += dy;
    },
  });

  wrap(Muuri.ItemDrag.prototype, '_prepareScroll', {
    before() {
      return { x: this._scrollDiffX, y: this._scrollDiffY };
    },
    after(scale, prev) {
      if (!isDragging.call(this)) return;
      const k = 1 / scale - 1;
      this._left += (this._scrollDiffX - prev.x) * k;
      this._top += (this._scrollDiffY - prev.y) * k;
      unscaleContainerDiff.call(this, scale);
      this._gridX = this._left - this._containerDiffX;
      this._gridY = this._top - this._containerDiffY;
    },
  });
})();
