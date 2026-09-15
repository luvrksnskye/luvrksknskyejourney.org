(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
  const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

  function canvasTexture(THREE, size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  async function loadThree() {
    try { return await import('three'); }
    catch (e) { return await import('https://unpkg.com/three@0.184.0/build/three.module.js'); }
  }

  async function init(canvas, opts) {
    const THREE = await loadThree();
    const o = Object.assign({ memories: [], onHover: () => {}, onSelect: () => {}, onReady: () => {}, basePath: 'assets/' }, opts);
    const host = canvas.parentElement;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 1, 6000);
    const world = new THREE.Group();
    scene.add(world);

    const loader = new THREE.TextureLoader();
    const aniso = renderer.capabilities.getMaxAnisotropy();
    const tex = (p) => { const t = loader.load(p); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };

    const rings = [];
    function disc(map, r, opacity, speed, tint) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(r * 2, r * 2),
        new THREE.MeshBasicMaterial({ map, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, color: tint === undefined ? 0xffffff : tint })
      );
      m.rotation.x = -Math.PI / 2;
      m.userData = { speed, base: opacity };
      m.renderOrder = 2;
      world.add(m);
      rings.push(m);
      return m;
    }

    const wash = new THREE.Mesh(
      new THREE.PlaneGeometry(560, 560),
      new THREE.MeshBasicMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6,
        map: canvasTexture(THREE, 512, (x, s) => {
          const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
          g.addColorStop(0, 'rgba(96,132,236,0.30)');
          g.addColorStop(0.24, 'rgba(72,104,208,0.22)');
          g.addColorStop(0.52, 'rgba(44,64,150,0.12)');
          g.addColorStop(1, 'rgba(10,16,48,0)');
          x.fillStyle = g; x.fillRect(0, 0, s, s);
        })
      })
    );
    wash.rotation.x = -Math.PI / 2;
    wash.position.y = -1.2;
    wash.renderOrder = 0;
    wash.userData = { speed: 0, base: 0.6 };
    world.add(wash);
    rings.push(wash);

    const A = (n) => o.basePath + n;
    disc(tex(A('middle.png')),       11,  1.00,  0.085);
    disc(tex(A('center.png')),       25,  0.92, -0.062);
    disc(tex(A('circle-lol.png')),   40,  1.00,  0.048);
    disc(tex(A('other-circle.png')), 58,  0.95, -0.037);
    disc(tex(A('circle.png')),       80,  0.90,  0.029);
    disc(tex(A('plane.png')),        126, 0.88, -0.022);
    disc(tex(A('other-circle.png')), 182, 0.80,  0.017);
    disc(tex(A('plane.png')),        214, 0.72, -0.013);

    const AXIS_LEN = 460;
    const axisDirs = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1),
    ];

    function makeAxisLine(dir, len, opts) {
      const p0 = dir.clone().multiplyScalar(-len);
      const p1 = dir.clone().multiplyScalar( len);
      const geo = new THREE.BufferGeometry().setFromPoints([p0, p1]);
      const mat = new THREE.LineDashedMaterial({
        color: opts.color, dashSize: opts.dashSize, gapSize: opts.gapSize,
        transparent: true, opacity: opts.opacity,
        depthWrite: false, depthTest: false,
        blending: THREE.NormalBlending,
        linewidth: opts.linewidth || 1,
      });
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      line.renderOrder = 4;
      return line;
    }

    function makeAxisLabel(letter) {
      const tex = canvasTexture(THREE, 128, (x, s) => {
        x.clearRect(0, 0, s, s);
        x.fillStyle = 'rgba(246,232,196,0.95)';
        x.font = '700 66px "Cinzel", serif';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.shadowColor = 'rgba(180,210,255,0.9)';
        x.shadowBlur = 14;
        x.fillText(letter, s / 2, s / 2);
      });
      const mat = new THREE.SpriteMaterial({
        map: tex, transparent: true, depthTest: false, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 1,
      });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(32, 32, 1);
      sp.renderOrder = 8;
      return sp;
    }

    function makeAxisTicks(dir, len, count, opts) {
      const positions = new Float32Array(count * 3);
      const half = count / 2;
      for (let i = 0; i < count; i++) {
        const t = (i - half) / half;
        const d = t * len;
        positions[i * 3]     = dir.x * d;
        positions[i * 3 + 1] = dir.y * d;
        positions[i * 3 + 2] = dir.z * d;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        map: dustTexPlaceholder(), size: opts.size, sizeAttenuation: true,
        color: opts.color, transparent: true, opacity: opts.opacity,
        depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const pts = new THREE.Points(g, mat);
      pts.renderOrder = 5;
      return pts;
    }
    function dustTexPlaceholder() {
      return canvasTexture(THREE, 256, (x, s) => {
        const c = s / 2;
        const g = x.createRadialGradient(c, c, 0, c, c, c);
        g.addColorStop(0.00, 'rgba(255,255,255,0.42)');
        g.addColorStop(0.08, 'rgba(245,250,255,0.28)');
        g.addColorStop(0.22, 'rgba(220,235,255,0.15)');
        g.addColorStop(0.42, 'rgba(190,215,255,0.06)');
        g.addColorStop(0.65, 'rgba(160,195,255,0.02)');
        g.addColorStop(0.85, 'rgba(140,185,255,0.005)');
        g.addColorStop(1.00, 'rgba(120,170,255,0)');
        x.fillStyle = g; x.fillRect(0, 0, s, s);
      });
    }

    function makeAxisDotLine(dir, len, opts) {
      const n = opts.count;
      const positions = new Float32Array(n * 3);
      const colors    = new Float32Array(n * 3);
      const r = ((opts.color >> 16) & 0xff) / 255;
      const g = ((opts.color >>  8) & 0xff) / 255;
      const b = ( opts.color        & 0xff) / 255;
      const tmp = Math.abs(dir.y) > 0.9
        ? new THREE.Vector3(1, 0, 0)
        : new THREE.Vector3(0, 1, 0);
      const perpA = new THREE.Vector3().crossVectors(dir, tmp).normalize();
      const perpB = new THREE.Vector3().crossVectors(dir, perpA).normalize();
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * 2 - 1;
        const d = t * len;
        const jA = (Math.random() - 0.5) * 0.7;
        const jB = (Math.random() - 0.5) * 0.7;
        positions[i * 3]     = dir.x * d + perpA.x * jA + perpB.x * jB;
        positions[i * 3 + 1] = dir.y * d + perpA.y * jA + perpB.y * jB;
        positions[i * 3 + 2] = dir.z * d + perpA.z * jA + perpB.z * jB;
        const fade = Math.max(0, 1 - Math.pow(Math.abs(t), 2.2));
        colors[i * 3]     = r * fade;
        colors[i * 3 + 1] = g * fade;
        colors[i * 3 + 2] = b * fade;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        map: dustTexPlaceholder(), size: opts.size, sizeAttenuation: true,
        vertexColors: true, transparent: true, depthWrite: false, depthTest: false,
        blending: THREE.AdditiveBlending, opacity: opts.opacity,
      });
      const pts = new THREE.Points(geo, mat);
      pts.renderOrder = 4;
      return pts;
    }

    const axisGroup = new THREE.Group();
    axisGroup.renderOrder = 4;
    const AXIS_LABELS = ['X', 'Y', 'Z'];
    axisDirs.forEach((dir, k) => {
      axisGroup.add(makeAxisDotLine(dir, AXIS_LEN, {
        count: 340, color: 0xffffff, size: 4.5, opacity: 1.0,
      }));
      axisGroup.add(makeAxisDotLine(dir, AXIS_LEN * 0.94, {
        count: 180, color: 0xc9deff, size: 10.0, opacity: 0.5,
      }));
      const labelPos = dir.clone().multiplyScalar(240);
      const label = makeAxisLabel(AXIS_LABELS[k]);
      label.position.copy(labelPos);
      axisGroup.add(label);
    });
    world.add(axisGroup);
    const emblemTex = canvasTexture(THREE, 128, (x, s) => {
      const c = s / 2;
      const g = x.createRadialGradient(c, c, 0, c, c, c * 0.8);
      g.addColorStop(0,    'rgba(255,255,255,0.95)');
      g.addColorStop(0.35, 'rgba(226,238,255,0.5)');
      g.addColorStop(0.7,  'rgba(160,200,255,0.15)');
      g.addColorStop(1,    'rgba(120,170,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    });
    const emblem = new THREE.Sprite(new THREE.SpriteMaterial({
      map: emblemTex, transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.9,
    }));
    emblem.scale.set(22, 22, 1);
    emblem.renderOrder = 6;
    axisGroup.add(emblem);

    axisGroup.traverse((n) => {
      if (n.material) {
        n.userData = { speed: 0, base: n.material.opacity };
        rings.push(n);
      }
    });

    const spokeTex = canvasTexture(THREE, 1024, (x, s) => {
      const c = s / 2;
      x.clearRect(0, 0, s, s);
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2 + Math.PI / 96;
        const inner = c * 0.32, outer = c * 0.98;
        const x1 = c + Math.cos(a) * inner, y1 = c + Math.sin(a) * inner;
        const x2 = c + Math.cos(a) * outer, y2 = c + Math.sin(a) * outer;
        const grd = x.createLinearGradient(x1, y1, x2, y2);
        grd.addColorStop(0, 'rgba(190,220,255,0)');
        grd.addColorStop(0.2, 'rgba(190,220,255,0.05)');
        grd.addColorStop(0.75, 'rgba(210,230,255,0.14)');
        grd.addColorStop(1, 'rgba(210,230,255,0)');
        x.strokeStyle = grd;
        x.lineWidth = i % 6 === 0 ? 1.4 : 0.7;
        x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
      }
      for (let i = 0; i < 360; i++) {
        const a = (i / 360) * Math.PI * 2;
        const inner = c * (i % 5 === 0 ? 0.94 : 0.965);
        const outer = c * 0.985;
        x.strokeStyle = 'rgba(226,238,255,' + (i % 5 === 0 ? 0.42 : 0.18) + ')';
        x.lineWidth = i % 5 === 0 ? 1.2 : 0.6;
        x.beginPath();
        x.moveTo(c + Math.cos(a) * inner, c + Math.sin(a) * inner);
        x.lineTo(c + Math.cos(a) * outer, c + Math.sin(a) * outer);
        x.stroke();
      }
    });
    const spokes = new THREE.Mesh(
      new THREE.PlaneGeometry(540, 540),
      new THREE.MeshBasicMaterial({ map: spokeTex, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    spokes.rotation.x = -Math.PI / 2;
    spokes.position.y = 0.1;
    spokes.renderOrder = 1;
    spokes.userData = { speed: 0.003, base: 0.42 };
    world.add(spokes);
    rings.push(spokes);

    disc(canvasTexture(THREE, 1024, (x, s) => {
      const c = s / 2;
      const arc = (r, w, a) => { x.beginPath(); x.arc(c, c, r, 0, Math.PI * 2); x.strokeStyle = 'rgba(226,238,255,' + a + ')'; x.lineWidth = w; x.stroke(); };
      const band = x.createRadialGradient(c, c, c * 0.79, c, c, c * 0.96);
      band.addColorStop(0, 'rgba(180,205,255,0)');
      band.addColorStop(0.4, 'rgba(196,216,255,0.18)');
      band.addColorStop(1, 'rgba(150,180,240,0)');
      x.fillStyle = band; x.beginPath(); x.arc(c, c, c, 0, Math.PI * 2); x.fill();
      arc(c * 0.8, 2.5, 0.85); arc(c * 0.835, 1.2, 0.45); arc(c * 0.945, 3, 0.8); arc(c * 0.9, 1, 0.3);
      for (let i = 0; i < 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        x.save(); x.translate(c, c); x.rotate(a);
        x.fillStyle = 'rgba(226,238,255,' + (i % 8 === 0 ? 0.8 : 0.3) + ')';
        x.fillRect(c * 0.85, -1, c * (i % 8 === 0 ? 0.07 : 0.035), 2);
        x.restore();
      }
    }), 252, 0.42, 0.004);

    const dustTex = canvasTexture(THREE, 64, (x, s) => {
      const c = s / 2;
      const g = x.createRadialGradient(c, c, 0, c, c, c);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.22, 'rgba(226,238,255,0.85)');
      g.addColorStop(0.55, 'rgba(160,200,255,0.22)');
      g.addColorStop(1, 'rgba(120,170,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    });
    function dust(count, rMin, rMax, thick, size, color, opacity) {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const t = Math.random();
        const r = rMin + (rMax - rMin) * Math.sqrt(t);
        const a = Math.random() * Math.PI * 2;
        const y = (Math.random() + Math.random() + Math.random() - 1.5) * thick;
        pos[i * 3] = Math.cos(a) * r;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = Math.sin(a) * r;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const p = new THREE.Points(g, new THREE.PointsMaterial({
        map: dustTex, size, sizeAttenuation: true, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, color, opacity
      }));
      p.userData = { speed: 0.006, base: opacity };
      p.renderOrder = 1;
      world.add(p);
      rings.push(p);
      return p;
    }
    dust(4600, 24, 170, 2.0, 1.05, 0xa8c6ff, 0.9);
    dust(1800, 40, 240, 6.0, 2.1, 0xffffff, 0.55);
    dust(500,  18, 110, 1.4, 4.4, 0xdfeaff, 0.6);
    dust(700,  60, 260, 3.2, 1.7, 0xc9deff, 0.75);
    dust(340,  8,  48,  0.9, 3.0, 0xffffff, 0.9);

    const bloomTex = canvasTexture(THREE, 256, (x, s) => {
      const c = s / 2;
      const g = x.createRadialGradient(c, c, 0, c, c, c);
      g.addColorStop(0.00, 'rgba(255,255,255,0.28)');
      g.addColorStop(0.06, 'rgba(240,247,255,0.20)');
      g.addColorStop(0.18, 'rgba(210,228,255,0.12)');
      g.addColorStop(0.35, 'rgba(180,215,255,0.06)');
      g.addColorStop(0.55, 'rgba(155,195,255,0.025)');
      g.addColorStop(0.75, 'rgba(140,185,255,0.008)');
      g.addColorStop(0.90, 'rgba(130,175,255,0.002)');
      g.addColorStop(1.00, 'rgba(120,170,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    });

    const vfxImg = await loadImg(A('vfx.png'));
    const vfxTex = canvasTexture(THREE, 128, (ctx, s) => {
      ctx.clearRect(0, 0, s, s);
      if (vfxImg) ctx.drawImage(vfxImg, 0, 0, s, s);
      const img = ctx.getImageData(0, 0, s, s);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i + 3] = Math.min(255, Math.round(lum));
      }
      ctx.putImageData(img, 0, 0);
    });
    function starCluster(map, count, rMin, rMax, thick, size, color, opacity, speed) {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const t = Math.pow(Math.random(), 1.4);
        const r = rMin + (rMax - rMin) * t;
        const a = Math.random() * Math.PI * 2;
        const y = (Math.random() + Math.random() - 1) * thick;
        pos[i * 3]     = Math.cos(a) * r;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = Math.sin(a) * r;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const p = new THREE.Points(g, new THREE.PointsMaterial({
        map, size, sizeAttenuation: true, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, color, opacity,
      }));
      p.userData = { speed, base: opacity };
      p.renderOrder = 3;
      world.add(p);
      rings.push(p);
      return p;
    }
    starCluster(bloomTex, 2200, 10, 60, 2.0, 5.2, 0xb8d4ff, 0.55,  0.009);
    starCluster(vfxTex,   2200, 10, 60, 2.0, 2.4, 0xffffff, 0.95,  0.009);

    starCluster(bloomTex, 900, 12, 52, 1.6, 8.5, 0xdfeaff, 0.45, -0.006);
    starCluster(vfxTex,   900, 12, 52, 1.6, 4.2, 0xffffff, 1.0,  -0.006);

    starCluster(bloomTex, 3200, 14, 44, 1.2, 3.4, 0xc9deff, 0.55,  0.004);

    starCluster(bloomTex,  80, 14, 46, 1.0, 14.0, 0xffffff, 0.7,   0.003);
    starCluster(vfxTex,    80, 14, 46, 1.0, 7.0,  0xffffff, 1.0,   0.003);

    starCluster(bloomTex, 900, 46, 95, 3.0, 6.2, 0xa8c6ff, 0.4,  -0.004);
    starCluster(vfxTex,   900, 46, 95, 3.0, 2.6, 0xffffff, 0.85, -0.004);

    const ICON_BG = await loadImg(A('circle2.png'));
    const markerGroup = new THREE.Group();
    markerGroup.renderOrder = 6;
    world.add(markerGroup);

    function markerTexture(icon, active) {
      return canvasTexture(THREE, 256, (x, s) => {
        const c = s / 2;
        x.save();
        const g = x.createRadialGradient(c, c, 0, c, c, c * 0.82);
        g.addColorStop(0, active ? 'rgba(20,34,74,0.97)' : 'rgba(7,12,28,0.94)');
        g.addColorStop(1, active ? 'rgba(10,18,44,0.9)' : 'rgba(4,7,20,0.88)');
        x.beginPath(); x.arc(c, c, c * 0.8, 0, Math.PI * 2); x.fillStyle = g; x.fill();
        if (ICON_BG) {
          x.globalAlpha = active ? 1 : 0.78;
          x.drawImage(ICON_BG, 0, 0, s, s);
          x.globalAlpha = 1;
        }
        if (active) {
          x.beginPath(); x.arc(c, c, c * 0.78, 0, Math.PI * 2);
          x.strokeStyle = 'rgba(246,232,190,0.95)'; x.lineWidth = 4; x.stroke();
          x.shadowColor = 'rgba(240,222,175,0.9)'; x.shadowBlur = 26; x.stroke();
          x.shadowBlur = 0;
        }
        if (icon) {
          const d = s * (active ? 0.46 : 0.42);
          x.globalAlpha = active ? 1 : 0.9;
          x.drawImage(icon, c - d / 2, c - d / 2, d, d);
        }
        x.restore();
      });
    }

    const markers = [];
    for (let i = 0; i < o.memories.length; i++) {
      const m = o.memories[i];
      const icon = await loadImg(m.icon);
      const mat = new THREE.SpriteMaterial({ map: markerTexture(icon, false), transparent: true, depthWrite: false, depthTest: false });
      const sp = new THREE.Sprite(mat);
      const r = m.r, a = m.a;
      sp.position.set(Math.cos(a) * r, 1.6, Math.sin(a) * r);
      sp.scale.setScalar(15);
      sp.renderOrder = 10;
      sp.userData = { i, base: 15, angle: a, radius: r, hot: markerTexture(icon, true), cold: mat.map };
      markerGroup.add(sp);
      markers.push(sp);
    }

    const haloTex = canvasTexture(THREE, 512, (x, s) => {
      const c = s / 2;
      const g = x.createRadialGradient(c, c, c * 0.42, c, c, c * 0.5);
      g.addColorStop(0, 'rgba(240,226,186,0)');
      g.addColorStop(0.82, 'rgba(244,230,190,0.4)');
      g.addColorStop(0.94, 'rgba(255,246,220,0.9)');
      g.addColorStop(1, 'rgba(240,226,186,0)');
      x.fillStyle = g; x.beginPath(); x.arc(c, c, c, 0, Math.PI * 2); x.fill();
    });
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.4;
    halo.renderOrder = 5;
    world.add(halo);

    const beamGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const beam = new THREE.Line(beamGeo, new THREE.LineBasicMaterial({ color: 0xf3e4bc, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    beam.renderOrder = 7;
    world.add(beam);

    const VIEWS = {
      overview: { px: -34, py: 140, pz: 244, tx: 18, ty: 0, tz: -22, fov: 44, roll: 0.14, upy: 1, upz: 0, dim: 0, spread: 1 },
      focus:    { px: 0, py: 430, pz: 70, tx: 0, ty: 0, tz: -8, fov: 38, roll: 0, upy: 0.22, upz: -0.975, dim: 1, spread: 1 }
    };
    const cam = Object.assign({}, VIEWS.overview);
    let tween = null;
    function tweenTo(to, dur, done) {
      const from = {};
      Object.keys(to).forEach((k) => (from[k] = cam[k]));
      tween = { from, to, dur, t: 0, done };
    }

    let worldYaw = 0, worldYawTarget = 0, dragging = false, moved = 0, lastX = 0;
    let pointerX = 0, pointerY = 0, ndc = new THREE.Vector2(-2, -2), hover = -1, selected = -1, paused = false, alive = true;
    let parX = 0, parY = 0;

    let revealT = 0, revealActive = false, bobTime = 0;
    rings.forEach((m, i) => {
      m.userData.revealDelay = (i / Math.max(1, rings.length - 1)) * 0.45;
      if (!m.isPoints && !m.isLine) m.scale.setScalar(0.001);
      m.material.opacity = 0;
    });
    markers.forEach((sp, i) => {
      sp.userData.revealDelay = 0.55 + (i / Math.max(1, markers.length - 1)) * 0.35;
      sp.userData.bobPhase = i * 0.62;
      sp.userData.bobAmp = 0.9 + (i % 3) * 0.35;
      sp.scale.setScalar(0.001);
      sp.material.opacity = 0;
    });
    axisGroup.traverse((n) => {
      if (n.material) {
        n.userData.revealDelay = 0.15;
        n.material.opacity = 0;
      }
    });
    const ray = new THREE.Raycaster();
    ray.params.Sprite = { threshold: 0 };

    function resize() {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      const scale = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75) * scale);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    function setNdc(e) {
      const r = canvas.getBoundingClientRect();
      pointerX = e.clientX - r.left;
      pointerY = e.clientY - r.top;
      ndc.set((pointerX / r.width) * 2 - 1, -(pointerY / r.height) * 2 + 1);
    }
    function onMove(e) {
      setNdc(e);
      if (dragging) {
        moved += Math.abs(e.clientX - lastX);
        worldYawTarget += (e.clientX - lastX) * 0.0038;
        lastX = e.clientX;
      }
    }
    function onDown(e) {
      dragging = true; moved = 0; lastX = e.clientX; setNdc(e);
      try { canvas.setPointerCapture?.(e.pointerId); } catch {}
    }
    function onUp(e) {
      dragging = false;
      if (moved <= 6 && hover >= 0) o.onSelect(hover);
      else if (moved <= 6 && hover < 0 && selected >= 0) o.onSelect(-1);
      try { canvas.releasePointerCapture?.(e.pointerId); } catch {}
    }
    function onLeave() { dragging = false; ndc.set(-2, -2); }
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onLeave);

    const clock = new THREE.Clock();
    let hoverReported = -2;
    function frame() {
      if (!alive) return;
      requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (paused || document.hidden) return;

      if (tween) {
        tween.t = Math.min(1, tween.t + (dt * 1000) / tween.dur);
        const eOut = easeOutQuint(tween.t);
        const eSym = easeInOut(tween.t);
        const POS = new Set(['px','py','pz','tx','ty','tz','fov','dim','spread']);
        Object.keys(tween.to).forEach((k) => {
          const e = POS.has(k) ? eOut : eSym;
          cam[k] = tween.from[k] + (tween.to[k] - tween.from[k]) * e;
        });
        if (tween.t >= 1) { const d = tween.done; tween = null; if (d) d(); }
      }

      if (revealActive) revealT = Math.min(1, revealT + dt / 1.7);
      bobTime += dt;

      const revealFor = (delay, span) => {
        const t = Math.max(0, Math.min(1, (revealT - delay) / (span || 0.55)));
        return 1 - Math.pow(1 - t, 4);
      };

      rings.forEach((m) => {
        if (m.userData.speed) {
          if (m.isPoints) m.rotation.y += m.userData.speed * dt;
          else m.rotation.z += m.userData.speed * dt;
        }
        const rev = revealFor(m.userData.revealDelay || 0, 0.6);
        const focusBoost = 1 + cam.dim * 0.22;
        m.material.opacity = Math.min(1, m.userData.base * focusBoost) * rev;
        if (!m.isPoints && !m.isLine) m.scale.setScalar(0.001 + rev * 0.999);
      });

      worldYaw += (worldYawTarget - worldYaw) * Math.min(1, dt * 3.6);
      world.rotation.y = worldYaw;

      if (!paused) {
        ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObjects(markers, false)[0];
        hover = hit ? hit.object.userData.i : -1;
      }
      canvas.style.cursor = hover >= 0 ? 'pointer' : (selected >= 0 ? 'default' : 'grab');
      if (hover !== hoverReported) {
        hoverReported = hover;
        o.onHover(hover, pointerX, pointerY);
      } else if (hover >= 0) {
        o.onHover(hover, pointerX, pointerY);
      }

      markers.forEach((sp, i) => {
        const isSel = i === selected;
        const rev = revealFor(sp.userData.revealDelay || 0, 0.4);

        const want = (isSel ? 19 : hover === i ? 17.5 : 15) * rev;
        sp.scale.setScalar(sp.scale.x + (want - sp.scale.x) * Math.min(1, dt * 10));

        const targetOp = (selected >= 0 && !isSel ? 0.3 : 1) * rev;
        sp.material.opacity += (targetOp - sp.material.opacity) * Math.min(1, dt * 6);

        const baseY = 1.6;
        const bob = Math.sin(bobTime * 1.15 + sp.userData.bobPhase) * sp.userData.bobAmp;
        const dropIn = (1 - rev) * -6;
        sp.position.y = baseY + bob * rev + dropIn;

        const wantHot = isSel || hover === i;
        const map = wantHot ? sp.userData.hot : sp.userData.cold;
        if (sp.material.map !== map) { sp.material.map = map; sp.material.needsUpdate = true; }
      });

      if (selected >= 0) {
        const sp = markers[selected];
        const r = sp.userData.radius;
        halo.scale.set(r * 2.32, r * 2.32, 1);
        halo.material.opacity += (0.34 - halo.material.opacity) * Math.min(1, dt * 3);
        const p = beamGeo.attributes.position;
        p.setXYZ(0, 0, 1, 0);
        p.setXYZ(1, sp.position.x, 1, sp.position.z);
        p.needsUpdate = true;
        beam.material.opacity += (0.42 - beam.material.opacity) * Math.min(1, dt * 3);
      } else {
        halo.material.opacity += (0 - halo.material.opacity) * Math.min(1, dt * 4);
        beam.material.opacity += (0 - beam.material.opacity) * Math.min(1, dt * 4);
      }

      const par = selected >= 0 ? 0 : 1;
      const parTargetX = (ndc.x || 0) * 9 * par;
      const parTargetY = (ndc.y || 0) * 5 * par;
      const parK = Math.min(1, dt * 4.5);
      parX += (parTargetX - parX) * parK;
      parY += (parTargetY - parY) * parK;
      camera.position.set(cam.px + parX, cam.py + parY, cam.pz);
      camera.up.set(Math.sin(cam.roll), cam.upy, cam.upz);
      camera.lookAt(cam.tx, cam.ty, cam.tz);
      if (Math.abs(camera.fov - cam.fov) > 0.01) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
    o.onReady();

    const controller = {
      focus(i) {
        selected = i;
        const sp = markers[i];
        if (!sp) return;
        let want = sp.userData.angle + Math.PI / 2;
        while (want - worldYawTarget > Math.PI) want -= Math.PI * 2;
        while (want - worldYawTarget < -Math.PI) want += Math.PI * 2;
        worldYawTarget = want;
        const r = sp.userData.radius;
        tweenTo(Object.assign({}, VIEWS.focus, { py: 340 + r * 0.5, tz: -r * 0.5 }), 1650);
      },
      unfocus() {
        selected = -1;
        tweenTo(VIEWS.overview, 1350);
      },
      spin(d) { worldYawTarget += d; },
      setPaused(v) {
        paused = !!v;
        if (!v) {
          clock.getDelta();
          if (revealT < 0.001) revealActive = true;
        }
      },
      resize,
      dispose() {
        alive = false;
        ro.disconnect();
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointerleave', onLeave);
        scene.traverse((n) => {
          if (n.geometry) n.geometry.dispose();
          if (n.material) { if (n.material.map && n.material.map.dispose) n.material.map.dispose(); n.material.dispose(); }
        });
        renderer.dispose();
      }
    };
    return controller;
  }

  window.MemoryClock = { init };
})();
