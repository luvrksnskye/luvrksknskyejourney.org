import * as THREE from 'https://esm.sh/three@0.177.0';

const MAX_EDGES = 8;
const GLOW_SCALE = 1.3;

const VERT = `
varying vec2 vLocal;
void main() {
  vLocal = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const PRESETS = {
  Minimal: {
    strength: 0.05, radius: 0.12, size: 0.8, edgeWidth: 0.02, edgeOpacity: 0.1,
    rimLightIntensity: 0.1, rimLightWidth: 0.04, chromaticAberration: 0.01,
    reflectionIntensity: 0.15, waveDistortion: 0.02, waveSpeed: 0.8,
    lensBlur: 0.05, clearCenterSize: 0.5
  },
  Subtle: {
    strength: 0.08, radius: 0.16, size: 0.9, edgeWidth: 0.03, edgeOpacity: 0.15,
    rimLightIntensity: 0.2, rimLightWidth: 0.06, chromaticAberration: 0.02,
    reflectionIntensity: 0.2, waveDistortion: 0.04, waveSpeed: 1,
    lensBlur: 0.08, clearCenterSize: 0.4
  },
  'Classic Glass': {
    strength: 0.12, radius: 0.18, size: 1, edgeWidth: 0.04, edgeOpacity: 0.25,
    rimLightIntensity: 0.3, rimLightWidth: 0.08, chromaticAberration: 0.025,
    reflectionIntensity: 0.35, waveDistortion: 0.03, waveSpeed: 0.5,
    lensBlur: 0.12, clearCenterSize: 0.2
  },
  Dramatic: {
    strength: 0.25, radius: 0.35, size: 1.2, edgeWidth: 0.08, edgeOpacity: 0.4,
    rimLightIntensity: 0.5, rimLightWidth: 0.1, chromaticAberration: 0.06,
    reflectionIntensity: 0.5, waveDistortion: 0.15, waveSpeed: 1.8,
    lensBlur: 0.25, clearCenterSize: 0.15
  },
  'Chromatic Focus': {
    strength: 0.1, radius: 0.22, size: 1, edgeWidth: 0.06, edgeOpacity: 0.3,
    rimLightIntensity: 0.25, rimLightWidth: 0.07, chromaticAberration: 0.08,
    reflectionIntensity: 0.2, waveDistortion: 0.05, waveSpeed: 0.8,
    lensBlur: 0.1, clearCenterSize: 0.25
  },
  'Liquid Wave': {
    strength: 0.18, radius: 0.28, size: 1.1, edgeWidth: 0.05, edgeOpacity: 0.2,
    rimLightIntensity: 0.4, rimLightWidth: 0.09, chromaticAberration: 0.04,
    reflectionIntensity: 0.4, waveDistortion: 0.2, waveSpeed: 2.5,
    lensBlur: 0.15, clearCenterSize: 0.1
  },
  Gigantic: {
    strength: 0.4, radius: 0.65, size: 1.8, edgeWidth: 0.12, edgeOpacity: 0.6,
    rimLightIntensity: 0.8, rimLightWidth: 0.15, chromaticAberration: 0.1,
    reflectionIntensity: 0.7, waveDistortion: 0.25, waveSpeed: 1.5,
    lensBlur: 0.35, clearCenterSize: 0.05
  }
};

const PRESET = 'Classic Glass';
const OVERALL_INTENSITY = 1;

const FRAG = `
precision highp float;

uniform sampler2D tDiffuse;
uniform float uHasTex;
uniform vec2 uRes;
uniform vec2 uTexRes;
uniform vec2 uBox;
uniform vec2 uPoly[${MAX_EDGES + 1}];
uniform int uCount;
uniform float uTime;
uniform float uForm;
uniform float uSeed;
uniform float uLit;
uniform float uFocus;
uniform float uBurst;
uniform float uGlow;
uniform float uInset;

uniform float uStrength;
uniform float uRadius;
uniform float uSize;
uniform float uEdgeWidth;
uniform float uEdgeOpacity;
uniform float uRimLightIntensity;
uniform float uRimLightWidth;
uniform float uChromaticAberration;
uniform float uReflectionIntensity;
uniform float uWaveDistortion;
uniform float uWaveSpeed;
uniform float uLensBlur;
uniform float uClearCenterSize;
uniform float uOverallIntensity;

varying vec2 vLocal;

const float SCALE = 0.22;

vec3 edgeField(vec2 p) {
  float best = 1e9;
  vec2 grad = vec2(0.0, 1.0);
  for (int i = 0; i < ${MAX_EDGES}; i++) {
    if (i >= uCount) break;
    vec2 a = uPoly[i];
    vec2 b = uPoly[i + 1];
    vec2 ab = b - a;
    float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    vec2 delta = p - a - ab * t;
    float d = length(delta);
    if (d < best) {
      best = d;
      grad = delta / max(d, 1e-5);
    }
  }
  return vec3(best, grad);
}

vec2 coverUv(vec2 uv) {
  float screenAspect = uRes.x / uRes.y;
  float texAspect = uTexRes.x / uTexRes.y;
  vec2 scale = vec2(1.0);
  if (screenAspect > texAspect) scale.y = texAspect / screenAspect;
  else scale.x = screenAspect / texAspect;
  return (uv - 0.5) * scale + 0.5;
}

vec4 scene(vec2 uv) {
  if (uHasTex < 0.5) return vec4(0.10, 0.16, 0.27, 1.0);
  return texture2D(tDiffuse, coverUv(uv));
}

vec4 blur(vec2 uv, float amount) {
  vec4 c = vec4(0.0);
  vec2 o = vec2(1.3333333 * amount);
  c += scene(uv) * 0.2941176;
  c += scene(uv + o) * 0.3529412;
  c += scene(uv - o) * 0.3529412;
  return c;
}

void main() {
  if (uForm <= 0.001) discard;

  vec3 edge = edgeField(vLocal);
  float edgePx = edge.x * min(uBox.x, uBox.y);

  if (uGlow > 0.5) {
    float reach = smoothstep(0.0, uInset, edgePx);
    float fade = exp(-max(edgePx - uInset, 0.0) / 56.0);
    float halo = reach * fade * (0.54 + uLit * 0.6 + uFocus * 0.75 + uBurst * 0.9);
    gl_FragColor = vec4(vec3(0.6, 0.78, 1.0), halo * uForm);
    return;
  }

  vec2 uv = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);
  float rad = uRadius * uSize;
  float nd = clamp(1.0 - edge.x / max(rad, 1e-4), 0.0, 1.0);
  vec2 dir = -edge.yz;

  float df = smoothstep(uClearCenterSize, 1.0, nd);
  float powd = 1.0 + nd * 2.0;
  float focusDamp = mix(1.0, 0.5, uFocus);

  vec2 dUv = uv - dir * uStrength * pow(df, powd) * SCALE * focusDamp;
  float w1 = sin(nd * 8.0 - uTime * uWaveSpeed) * uWaveDistortion;
  float w2 = cos(nd * 12.0 - uTime * uWaveSpeed * 0.7) * uWaveDistortion * 0.5;
  dUv += dir * (w1 + w2) * df * SCALE;

  float ab = uChromaticAberration * df * (1.0 + nd) * SCALE * focusDamp;
  vec4 colR = scene(dUv + dir * ab * 1.2);
  vec4 colG = scene(dUv);
  vec4 colB = scene(dUv - dir * ab * 0.8);

  vec4 ref1 = scene(uv + dir * 0.08 * df * SCALE);
  vec4 ref2 = scene(uv + dir * 0.15 * df * SCALE);
  vec4 ref = mix(ref1, ref2, 0.6);

  vec4 col = vec4(colR.r, colG.g, colB.b, 1.0);
  col = mix(col, ref, uReflectionIntensity * df);

  float bl = uLensBlur * df * (1.0 + nd * 0.5) * 0.02;
  col = mix(col, blur(dUv, bl), df * 0.7);

  float edgeBand = smoothstep(1.0 - uEdgeWidth * 4.0, 1.0, nd);
  vec3 eCol = mix(vec3(1.0), vec3(0.8, 0.9, 1.0), nd);
  col = mix(col, vec4(eCol, 1.0), edgeBand * uEdgeOpacity);

  float rimD = 1.0 - uRimLightWidth * 2.0;
  float rim = smoothstep(rimD - 0.06, rimD + 0.06, nd) * (1.0 - smoothstep(0.96, 1.0, nd));
  col = mix(col, vec4(1.0), rim * uRimLightIntensity);

  col.rgb *= 1.0 + sin(nd * 6.0 - uTime * 2.0) * 0.1 * df;
  col.rgb = col.rgb / (1.0 + col.rgb * 0.6) * 1.45;

  float lift = uLit + uFocus * 1.3;
  col.rgb *= 1.0 + lift * 0.4;

  float flare = uBurst * uBurst;
  col.rgb += (rim + edgeBand) * flare * 1.3;

  float feather = pow(smoothstep(0.0, 7.0, edgePx), 0.55);
  float alpha = 0.34 + edgeBand * 0.16 + rim * 0.16 + df * 0.14
              + lift * 0.16 + flare * 0.3;
  gl_FragColor = vec4(col.rgb, uForm * feather * clamp(alpha * uOverallIntensity, 0.0, 1.0));
}`;

const DUST = 34;

const DUST_VERT = `
attribute float aSeed;
uniform highp float uTime;
uniform highp float uAlive;
uniform highp float uLit;
varying highp float vFade;

void main() {
  float life = fract(aSeed * 3.71 + uTime * 0.085);
  float angle = aSeed * 43.98;
  vec2 dir = vec2(cos(angle), sin(angle));
  float reach = 0.1 + 0.34 * fract(aSeed * 17.31);
  vec2 p = vec2(0.5) + dir * reach * life;
  p.y -= life * 0.1;
  p.x += sin(uTime * 0.3 + aSeed * 21.0) * 0.012;

  vFade = sin(life * 3.14159) * (0.32 + 0.68 * fract(aSeed * 53.7)) * (1.0 + uLit * 1.5);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
  gl_PointSize = (1.0 + fract(aSeed * 91.3) * 2.2) * uAlive;
}`;

const DUST_FRAG = `
precision highp float;
uniform highp float uAlive;
varying highp float vFade;

void main() {
  float r = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.5, 0.0, r);
  gl_FragColor = vec4(vec3(0.74, 0.87, 1.0), core * core * vFade * 0.34 * uAlive);
}`;

export class Glass {
  constructor({ canvas, videos }) {
    this.canvas = canvas;
    this.videos = videos;
    this.meshes = [];
    this.running = false;
    this.active = true;
    this.frame = 0;
    this.formedAt = 0;
  }

  start(entries) {
    if (this.renderer) {
      this.rebuild(entries);
      return true;
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1);

    this.textures = new Map();
    this.resize();
    addEventListener('resize', () => this.resize(), { passive: true });

    this.rebuild(entries);
    this.running = true;
    this.loop();
    return true;
  }

  makeDust(seedOffset) {
    const positions = new Float32Array(DUST * 3);
    const seeds = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) seeds[i] = (i / DUST + seedOffset) % 1;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const points = new THREE.Points(geometry, new THREE.ShaderMaterial({
      vertexShader: DUST_VERT,
      fragmentShader: DUST_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uAlive: { value: 0 },
        uLit: { value: 0 }
      }
    }));
    points.frustumCulled = false;
    points.renderOrder = 2;
    this.scene.add(points);
    return points;
  }

  texture(video) {
    let tex = this.textures.get(video);
    if (!tex) {
      tex = new THREE.VideoTexture(video);
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      this.textures.set(video, tex);
    }
    return tex;
  }

  activeVideo() {
    const mid = innerHeight / 2;
    let best = null;
    let bestDist = Infinity;
    for (const video of this.videos) {
      if (!video.videoWidth) continue;
      const r = video.getBoundingClientRect();
      const dist = Math.abs((r.top + r.bottom) / 2 - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = video;
      }
    }
    return best;
  }

  rebuild(entries) {
    for (const mesh of this.meshes) {
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh.userData.halo.material.dispose();
      mesh.userData.dust.geometry.dispose();
      mesh.userData.dust.material.dispose();
      this.scene.remove(mesh.userData.halo);
      this.scene.remove(mesh.userData.dust);
      this.scene.remove(mesh);
    }
    this.meshes = [];

    entries.forEach(({ shard, laid }, i) => {
      const pts = laid.local.map(([x, y]) => new THREE.Vector2(x / laid.boxW, y / laid.boxH));
      const shape = new THREE.Shape(pts);
      const geometry = new THREE.ShapeGeometry(shape);

      const poly = pts.slice(0, MAX_EDGES);
      const ring = poly.concat([poly[0]]);
      while (ring.length < MAX_EDGES + 1) ring.push(poly[0]);

      const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          tDiffuse: { value: null },
          uHasTex: { value: 0 },
          uRes: { value: new THREE.Vector2(1, 1) },
          uTexRes: { value: new THREE.Vector2(16, 9) },
          uBox: { value: new THREE.Vector2(1, 1) },
          uPoly: { value: ring },
          uCount: { value: poly.length },
          uTime: { value: 0 },
          uForm: { value: 0 },
          uSeed: { value: (i * 2.39996) % 6.2832 },
          uFocus: { value: 0 },
          uBurst: { value: 0 },
          uGlow: { value: 0 },
          uInset: { value: 1 },
          uLit: { value: 0 },
          uOverallIntensity: { value: OVERALL_INTENSITY },
          ...Object.fromEntries(
            Object.entries(PRESETS[PRESET]).map(([key, value]) => [
              'u' + key[0].toUpperCase() + key.slice(1),
              { value }
            ])
          )
        }
      });

      const aura = material.clone();
      aura.uniforms.uGlow.value = 1;
      aura.blending = THREE.AdditiveBlending;
      aura.depthWrite = false;

      const halo = new THREE.Mesh(geometry, aura);
      halo.frustumCulled = false;
      halo.renderOrder = 0;
      this.scene.add(halo);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      mesh.renderOrder = 1;
      this.scene.add(mesh);
      this.meshes.push(mesh);
      mesh.userData.shard = shard;
      mesh.userData.delay = 260 + i * 95;
      mesh.userData.halo = halo;
      mesh.userData.dust = this.makeDust(i / 8);
    });
  }

  setActive(on) {
    this.active = on;
    if (on && this.running && !this.frame) this.loop();
  }

  reveal() {
    this.formedAt = performance.now();
  }

  resize() {
    if (!this.renderer) return;
    const w = innerWidth;
    const h = innerHeight;
    this.renderer.setSize(w, h);
    this.camera.right = w;
    this.camera.bottom = h;
    this.camera.updateProjectionMatrix();
  }

  loop = () => {
    if (!this.running || !this.active) {
      this.frame = 0;
      return;
    }
    this.frame = requestAnimationFrame(this.loop);
    if (document.hidden) return;

    const video = this.activeVideo();
    const tex = video ? this.texture(video) : null;
    const now = performance.now();
    const focused = document.body.dataset.fragment || '';

    for (const mesh of this.meshes) {
      const { shard, delay } = mesh.userData;
      const rect = shard.getBoundingClientRect();
      if (rect.width < 1) {
        mesh.material.uniforms.uForm.value = 0;
        continue;
      }

      mesh.position.set(rect.left, rect.top, 0);
      mesh.scale.set(rect.width, rect.height, 1);

      const halo = mesh.userData.halo;
      const grow = GLOW_SCALE;
      halo.scale.set(rect.width * grow, rect.height * grow, 1);
      halo.position.set(
        rect.left - rect.width * (grow - 1) * 0.5,
        rect.top - rect.height * (grow - 1) * 0.5,
        0
      );

      const u = mesh.material.uniforms;
      u.tDiffuse.value = tex;
      u.uRes.value.set(this.canvas.width, this.canvas.height);
      if (video) u.uTexRes.value.set(video.videoWidth, video.videoHeight);
      u.uHasTex.value = tex ? 1 : 0;
      u.uBox.value.set(rect.width, rect.height);
      u.uTime.value = now * 0.001;
      u.uFocus.value = shard.classList.contains('is-selected') ? 1 : 0;
      const lit = shard.classList.contains('is-lit') ? 1 : 0;
      u.uLit.value += (lit - u.uLit.value) * 0.16;

      const since = this.formedAt ? now - this.formedAt - delay : -1;
      const dim = focused && !shard.classList.contains('is-selected') ? 0.16 : 1;
      u.uForm.value = Math.max(0, Math.min(1, since / 620)) * dim;
      u.uBurst.value = since < 0 ? 0 : Math.max(0, 1 - since / 1100);

      const aura = halo.material.uniforms;
      aura.uForm.value = u.uForm.value;
      aura.uBurst.value = u.uBurst.value;
      aura.uLit.value = u.uLit.value;
      aura.uFocus.value = u.uFocus.value;
      aura.uBox.value.set(halo.scale.x, halo.scale.y);
      aura.uInset.value = Math.min(halo.scale.x, halo.scale.y) * (GLOW_SCALE - 1) * 0.5;

      const dust = mesh.userData.dust;
      const spread = 2.1;
      dust.scale.set(rect.width * spread, rect.height * spread, 1);
      dust.position.set(
        rect.left - rect.width * (spread - 1) * 0.5,
        rect.top - rect.height * (spread - 1) * 0.5,
        0
      );
      const motes = dust.material.uniforms;
      motes.uTime.value = now * 0.001;
      motes.uLit.value = u.uLit.value + u.uFocus.value;
      motes.uAlive.value = this.formedAt
        ? Math.min(1, Math.max(0, (since - 700) / 1400))
        : 0;
    }

    this.renderer.render(this.scene, this.camera);
  };
}
