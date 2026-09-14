const ATLAS = 'assets/images/atlas/';

export const shapes = {
  '1001r': {
    tex: ATLAS + 'UI_Mask_CrystalPiece_1001.png',
    channel: 'r',
    points: [[0.1914, 0.3242], [0.2412, 0.1807], [0.6016, 0.3057], [0.8809, 0.5859], [0.585, 0.7129], [0.1895, 0.7979]],
    bbox: [0.1895, 0.1807, 0.6914, 0.6172]
  },
  '1001g': {
    tex: ATLAS + 'UI_Mask_CrystalPiece_1001.png',
    channel: 'g',
    points: [[0.5029, 0.2764], [0.8105, 0.6211], [0.8818, 0.7627], [0.2588, 0.5254], [0.2285, 0.5], [0.1875, 0.2988]],
    bbox: [0.1875, 0.2764, 0.6943, 0.4863]
  },
  '1001b': {
    tex: ATLAS + 'UI_Mask_CrystalPiece_1001.png',
    channel: 'b',
    points: [[0.2139, 0.3643], [0.793, 0.3486], [0.7559, 0.5537], [0.5371, 0.7295], [0.4492, 0.7236], [0.2373, 0.5537]],
    bbox: [0.2139, 0.3486, 0.5791, 0.3809]
  },
  '1002r': {
    tex: ATLAS + 'UI_Mask_CrystalPiece_1002.png',
    channel: 'r',
    points: [[0.1807, 0.5938], [0.5576, 0.2344], [0.8311, 0.293], [0.8408, 0.5537], [0.3105, 0.7236], [0.1543, 0.7461]],
    bbox: [0.1543, 0.2344, 0.6865, 0.5117]
  },
  '1002g': {
    tex: ATLAS + 'UI_Mask_CrystalPiece_1002.png',
    channel: 'g',
    points: [[0.3574, 0.6514], [0.5146, 0.4395], [0.6387, 0.3232], [0.6426, 0.3262], [0.5996, 0.5244], [0.543, 0.6523]],
    bbox: [0.3574, 0.3232, 0.2852, 0.3291]
  },
  '1002b': {
    tex: ATLAS + 'UI_Mask_CrystalPiece_1002.png',
    channel: 'b',
    points: [[0.1309, 0.3164], [0.457, 0.2051], [0.8027, 0.1416], [0.625, 0.8057], [0.4688, 0.7656], [0.1611, 0.4404]],
    bbox: [0.1309, 0.1416, 0.6719, 0.6641]
  },
  '1003r': {
    tex: ATLAS + 'UI_Mask_CrystalPiece_1003.png',
    channel: 'r',
    points: [[0.2256, 0.4531], [0.5059, 0.3691], [0.8018, 0.3203], [0.6709, 0.5479], [0.5879, 0.624], [0.5254, 0.6113]],
    bbox: [0.2256, 0.3203, 0.5762, 0.3037]
  },
  '1003g': {
    tex: ATLAS + 'UI_Mask_CrystalPiece_1003.png',
    channel: 'g',
    points: [[0.2246, 0.335], [0.835, 0.1924], [0.9004, 0.2324], [0.7441, 0.6924], [0.3115, 0.7549], [0.1758, 0.7393]],
    bbox: [0.1758, 0.1924, 0.7246, 0.5625]
  },
  '1003b': {
    tex: ATLAS + 'UI_Mask_CrystalPiece_1003.png',
    channel: 'b',
    points: [[0.2881, 0.2168], [0.374, 0.2148], [0.6582, 0.4297], [0.9014, 0.6826], [0.8633, 0.7207], [0.1318, 0.6514]],
    bbox: [0.1318, 0.2148, 0.7695, 0.5059]
  },
  '1004g': {
    tex: ATLAS + 'UI_Mask_CrystalPiece_1004.png',
    channel: 'g',
    points: [[0.3203, 0.2803], [0.5615, 0.335], [0.7236, 0.665], [0.7012, 0.7217], [0.4297, 0.46], [0.3135, 0.2852]],
    bbox: [0.3135, 0.2803, 0.4102, 0.4414]
  }
};

export function placeBox(shape, grid, cx, cy, width, rot = 0) {
  const [bx, by, bw, bh] = shape.bbox;
  const scale = width / bw;
  const height = bh * scale;
  const originX = cx - width / 2 - bx * scale;
  const originY = cy - height / 2 - by * scale;

  const rad = (rot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const spin = ([px, py]) => {
    const x = originX + px * scale - cx;
    const y = originY + py * scale - cy;
    return [cx + x * cos - y * sin, cy + x * sin + y * cos];
  };

  const pts = shape.points.map(spin);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const boxW = Math.max(...xs) - minX;
  const boxH = Math.max(...ys) - minY;

  const pc = (v, total) => `${((v / total) * 100).toFixed(2)}%`;

  return {
    box: {
      left: pc(minX, grid.w),
      top: pc(minY, grid.h),
      width: pc(boxW, grid.w),
      height: pc(boxH, grid.h)
    },
    clip: 'polygon(' + pts.map(([x, y]) => `${pc(x - minX, boxW)} ${pc(y - minY, boxH)}`).join(', ') + ')',
    label: {
      left: pc(cx - minX, boxW),
      top: pc(cy - minY, boxH)
    },
    local: pts.map(([x, y]) => [+(x - minX).toFixed(2), +(y - minY).toFixed(2)]),
    abs: pts.map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]),
    boxW,
    boxH
  };
}
