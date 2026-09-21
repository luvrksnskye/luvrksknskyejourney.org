/*
  Particle simulation adapted from The Spirit by Edan Kwan.
  https://github.com/edankwan/The-Spirit  ·  https://edankwan.com
  MIT License, Copyright (c) 2015 Edan Kwan.
*/

const SIMPLEX = `
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
float permute(float x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float taylorInvSqrt(float r) { return 1.79284291400159 - 0.85373472095314 * r; }

vec4 grad4(float j, vec4 ip) {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p, s;
  p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;
  return p;
}

#define F4 0.309016994374947451

vec4 simplexNoiseDerivatives(vec4 v) {
  const vec4 C = vec4(0.138196601125011, 0.276393202250021, 0.414589803375032, -0.447213595499958);
  vec4 i = floor(v + dot(v, vec4(F4)));
  vec4 x0 = v - i + dot(i, C.xxxx);
  vec4 i0;
  vec3 isX = step(x0.yzw, x0.xxx);
  vec3 isYZ = step(x0.zww, x0.yyz);
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;
  vec4 i3 = clamp(i0, 0.0, 1.0);
  vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
  vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;
  i = mod289(i);
  float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute(permute(permute(permute(
      i.w + vec4(i1.w, i2.w, i3.w, 1.0))
    + i.z + vec4(i1.z, i2.z, i3.z, 1.0))
    + i.y + vec4(i1.y, i2.y, i3.y, 1.0))
    + i.x + vec4(i1.x, i2.x, i3.x, 1.0));
  vec4 ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);
  vec4 p0 = grad4(j0, ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4, p4));
  vec3 values0 = vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2));
  vec2 values1 = vec2(dot(p3, x3), dot(p4, x4));
  vec3 m0 = max(0.5 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
  vec2 m1 = max(0.5 - vec2(dot(x3, x3), dot(x4, x4)), 0.0);
  vec3 temp0 = -6.0 * m0 * m0 * values0;
  vec2 temp1 = -6.0 * m1 * m1 * values1;
  vec3 mmm0 = m0 * m0 * m0;
  vec2 mmm1 = m1 * m1 * m1;
  float dx = temp0[0] * x0.x + temp0[1] * x1.x + temp0[2] * x2.x + temp1[0] * x3.x + temp1[1] * x4.x + mmm0[0] * p0.x + mmm0[1] * p1.x + mmm0[2] * p2.x + mmm1[0] * p3.x + mmm1[1] * p4.x;
  float dy = temp0[0] * x0.y + temp0[1] * x1.y + temp0[2] * x2.y + temp1[0] * x3.y + temp1[1] * x4.y + mmm0[0] * p0.y + mmm0[1] * p1.y + mmm0[2] * p2.y + mmm1[0] * p3.y + mmm1[1] * p4.y;
  float dz = temp0[0] * x0.z + temp0[1] * x1.z + temp0[2] * x2.z + temp1[0] * x3.z + temp1[1] * x4.z + mmm0[0] * p0.z + mmm0[1] * p1.z + mmm0[2] * p2.z + mmm1[0] * p3.z + mmm1[1] * p4.z;
  float dw = temp0[0] * x0.w + temp0[1] * x1.w + temp0[2] * x2.w + temp1[0] * x3.w + temp1[1] * x4.w + mmm0[0] * p0.w + mmm0[1] * p1.w + mmm0[2] * p2.w + mmm1[0] * p3.w + mmm1[1] * p4.w;
  return vec4(dx, dy, dz, dw) * 49.0;
}

vec3 curl(in vec3 p, in float noiseTime, in float persistence) {
  vec4 xd = vec4(0.0);
  vec4 yd = vec4(0.0);
  vec4 zd = vec4(0.0);
  for (int i = 0; i < 3; ++i) {
    float twoPowI = pow(2.0, float(i));
    float scale = 0.5 * twoPowI * pow(persistence, float(i));
    xd += simplexNoiseDerivatives(vec4(p * twoPowI, noiseTime)) * scale;
    yd += simplexNoiseDerivatives(vec4((p + vec3(123.4, 129845.6, -1239.1)) * twoPowI, noiseTime)) * scale;
    zd += simplexNoiseDerivatives(vec4((p + vec3(-9519.0, 9051.0, -123.0)) * twoPowI, noiseTime)) * scale;
  }
  return vec3(zd[1] - yd[2], xd[2] - zd[0], yd[0] - xd[1]);
}
`;

const SIGNATURE = `
float hash11(float n) { return fract(sin(n * 78.233) * 43758.5453); }

vec3 signature(vec3 p, vec4 s, float seed, float time) {
  float k = s.x, amp = s.y, f = s.z, q = s.w;
  if (k < 0.5) return p;

  if (k < 1.5) {
    float r = max(10.0, length(p.xz));
    float a = time * f * (90.0 / r);
    float c = cos(a), n = sin(a);
    return vec3(p.x * c - p.z * n, p.y, p.x * n + p.z * c);
  }

  if (k < 2.5) {
    float h = max(0.0, p.y - q);
    vec3 o = p;
    o.x += sin(time * f + p.y * 0.013 + seed * 0.6) * h * 0.055 * amp;
    o.z += cos(time * f * 0.78 + p.x * 0.011) * h * 0.04 * amp;
    float ground = smoothstep(q + 18.0, q - 5.0, p.y);
    o.y += sin(p.x * 0.048 + time * 1.15) * cos(p.z * 0.041 - time * 0.85) * 3.6 * amp * ground;
    return o;
  }

  if (k < 3.5) {
    float st = floor(time * f);
    vec3 n = vec3(hash11(seed * 91.3 + st), hash11(seed * 57.7 + st * 1.7), hash11(seed * 31.1 + st * 2.3)) - 0.5;
    return p + n * amp;
  }

  if (k < 4.5) {
    float t0 = clamp(p.x / q, 0.0, 1.0);
    float t1 = fract(t0 + time * f);
    vec3 o = p;
    o.x = t1 * q;
    o.yz = p.yz * (t1 / max(0.04, t0));
    return o;
  }

  if (k < 5.5) {
    float band = floor(p.y / max(4.0, q));
    float st = floor(time * f);
    float n = hash11(band * 12.98 + st * 7.13);
    float on = step(0.78, n);
    return p + vec3((n - 0.5) * amp * on, 0.0, (hash11(n + st) - 0.5) * amp * 0.4 * on);
  }

  if (k < 6.5) {
    float b = 1.0 + sin(time * f) * amp * 0.012;
    float a = time * 0.07;
    float c = cos(a), n = sin(a);
    vec2 v = vec2(p.x * c - p.y * n, p.x * n + p.y * c) * b;
    return vec3(v, p.z + sin(time * f * 1.7 + length(p.xy) * 0.06) * amp * 0.5);
  }

  float a = time * f;
  float c = cos(a), n = sin(a);
  return vec3(p.x * c - p.z * n, p.y, p.x * n + p.z * c);
}
`;

const SIM_FS = `
precision highp float;

uniform vec2 uSize;
uniform sampler2D tPosition;
uniform sampler2D tTargetA;
uniform sampler2D tTargetB;
uniform float uTime;
uniform float uDt;
uniform float uMorph;
uniform float uGrow;
uniform float uCurl;
uniform float uFlow;
uniform float uPull;
uniform vec4 uSigA;
uniform vec4 uSigB;

${SIMPLEX}
${SIGNATURE}

void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  vec4 info = texture2D(tPosition, uv);
  vec3 position = info.xyz;

  vec4 ta = texture2D(tTargetA, uv);
  vec4 tb = texture2D(tTargetB, uv);

  float seed = hash11(uv.x * 317.7 + uv.y * 911.3);

  float m = clamp((uMorph - seed * 0.34) / 0.66, 0.0, 1.0);
  float b = clamp((uGrow - tb.w) / 0.24, 0.0, 1.0);
  float t = min(m, b);
  t = t * t * (3.0 - 2.0 * t);

  vec3 pa = signature(ta.xyz, uSigA, seed, uTime);
  vec3 pb = signature(tb.xyz, uSigB, seed, uTime);
  vec3 target = mix(pa, pb, t);

  vec3 delta = target - position;
  float far = smoothstep(2.0, 190.0, length(delta));
  position += delta * clamp(uPull * (0.6 + far * 0.7) * uDt * 60.0, 0.0, 0.94);
  vec3 flow = curl(position * uCurl, uTime * 0.35, 0.22);
  position += flow * (uFlow * far + 0.07);

  gl_FragColor = vec4(position, 0.35 + t * 0.65);
}
`;

const QUAD_VS = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const DRAW_VS = `
uniform sampler2D tPosition;
uniform sampler2D tTargetB;
uniform float uPR;
uniform float uTime;
uniform vec2 uFire;
varying float vFog;
varying float vSeed;
varying float vLum;

float hash11(float n) { return fract(sin(n * 78.233) * 43758.5453); }

float firing(vec3 p, float on, float time) {
  if (on < 0.5) return 0.0;
  float d = length(p) / 190.0;
  float w = fract(time * 0.42);
  float pulse = exp(-pow((d - w) * 5.5, 2.0)) * 1.9;
  float w2 = fract(time * 0.42 + 0.5);
  pulse += exp(-pow((d - w2) * 5.5, 2.0)) * 1.1;
  return pulse;
}

void main() {
  vec4 info = texture2D(tPosition, position.xy);
  vec4 tb = texture2D(tTargetB, position.xy);
  vec3 p = info.xyz;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = -mv.z;

  vSeed = hash11(position.x * 317.7 + position.y * 911.3);
  vFog = pow(clamp(1.0 - (d - 130.0) / 620.0, 0.0, 1.0), 1.05);
  vLum = info.w * (1.0 + firing(tb.xyz, max(uFire.x, uFire.y), uTime) * 0.9);

  float size = 1.0 + hash11(vSeed * 71.3) * 2.2;
  gl_PointSize = clamp(size * uPR * (300.0 / max(1.0, d)) * (0.8 + vLum * 0.3), 0.8, 26.0 * uPR);
  gl_Position = projectionMatrix * mv;
}
`;

const DRAW_FS = `
precision highp float;
uniform float uTime;
uniform float uFade;
varying float vFog;
varying float vSeed;
varying float vLum;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r = dot(p, p);
  if (r > 1.0) discard;
  float core = exp(-r * 7.0);
  float halo = exp(-r * 1.8) * 0.16;
  float tw = 0.74 + 0.26 * sin(uTime * 1.1 + vSeed * 44.0);
  float a = (core + halo) * vFog * tw * uFade * vLum;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vec3(1.0), a);
}
`;

const TRAIL_VS = `
uniform sampler2D tPosition;
uniform sampler2D tPrevious;
attribute float aEnd;
varying float vFog;
varying float vLum;

void main() {
  vec4 now = texture2D(tPosition, position.xy);
  vec4 was = texture2D(tPrevious, position.xy);
  vec3 p = mix(now.xyz, was.xyz, aEnd);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = -mv.z;
  vFog = pow(clamp(1.0 - (d - 130.0) / 620.0, 0.0, 1.0), 1.05);
  vLum = now.w * (1.0 - aEnd * 0.85);
  gl_Position = projectionMatrix * mv;
}
`;

const TRAIL_FS = `
precision highp float;
uniform float uFade;
varying float vFog;
varying float vLum;
void main() {
  float a = vFog * vLum * uFade * 0.16;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vec3(1.0), a);
}
`;

export function createSpirit(THREE, renderer, side) {
  const count = side * side;
  const type = renderer.capabilities.isWebGL2 ? THREE.FloatType : THREE.HalfFloatType;

  function rt() {
    return new THREE.WebGLRenderTarget(side, side, {
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat, type: type,
      depthBuffer: false, stencilBuffer: false, generateMipmaps: false
    });
  }

  let current = rt(), previous = rt(), spare = rt();

  function dataTexture() {
    const tex = new THREE.DataTexture(new Float32Array(count * 4), side, side, THREE.RGBAFormat, THREE.FloatType);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
  }

  const targetA = dataTexture();
  const targetB = dataTexture();

  const simUniforms = {
    uSize: { value: new THREE.Vector2(side, side) },
    tPosition: { value: null },
    tTargetA: { value: targetA },
    tTargetB: { value: targetB },
    uTime: { value: 0 },
    uDt: { value: 0.016 },
    uMorph: { value: 1 },
    uGrow: { value: 1 },
    uCurl: { value: 0.0042 },
    uFlow: { value: 1.6 },
    uPull: { value: 0.09 },
    uSigA: { value: new THREE.Vector4(0, 0, 0, 0) },
    uSigB: { value: new THREE.Vector4(0, 0, 0, 0) }
  };

  const simScene = new THREE.Scene();
  const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const simQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: simUniforms, vertexShader: QUAD_VS, fragmentShader: SIM_FS,
      depthTest: false, depthWrite: false
    })
  );
  simQuad.frustumCulled = false;
  simScene.add(simQuad);

  const lookup = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    lookup[i * 3] = ((i % side) + 0.5) / side;
    lookup[i * 3 + 1] = (Math.floor(i / side) + 0.5) / side;
  }

  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute('position', new THREE.BufferAttribute(lookup, 3));

  const drawUniforms = {
    tPosition: { value: null },
    tTargetB: { value: targetB },
    uPR: { value: 1 },
    uTime: { value: 0 },
    uFade: { value: 0 },
    uFire: { value: new THREE.Vector2(0, 0) }
  };

  const points = new THREE.Points(pointGeo, new THREE.ShaderMaterial({
    uniforms: drawUniforms, vertexShader: DRAW_VS, fragmentShader: DRAW_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  points.frustumCulled = false;

  const trailLookup = new Float32Array(count * 2 * 3);
  const trailEnd = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 2; k++) {
      trailLookup[(i * 2 + k) * 3] = lookup[i * 3];
      trailLookup[(i * 2 + k) * 3 + 1] = lookup[i * 3 + 1];
      trailEnd[i * 2 + k] = k;
    }
  }
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailLookup, 3));
  trailGeo.setAttribute('aEnd', new THREE.BufferAttribute(trailEnd, 1));

  const trailUniforms = {
    tPosition: { value: null },
    tPrevious: { value: null },
    uFade: { value: 0 }
  };

  const trails = new THREE.LineSegments(trailGeo, new THREE.ShaderMaterial({
    uniforms: trailUniforms, vertexShader: TRAIL_VS, fragmentShader: TRAIL_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  trails.frustumCulled = false;

  function writeTarget(tex, positions, grow) {
    const d = tex.image.data;
    for (let i = 0; i < count; i++) {
      d[i * 4] = positions[i * 3];
      d[i * 4 + 1] = positions[i * 3 + 1];
      d[i * 4 + 2] = positions[i * 3 + 2];
      d[i * 4 + 3] = grow ? grow[i] : 0;
    }
    tex.needsUpdate = true;
  }

  function seed(positions) {
    const d = targetA.image.data;
    const e = targetB.image.data;
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < 3; k++) {
        d[i * 4 + k] = positions[i * 3 + k];
        e[i * 4 + k] = positions[i * 3 + k];
      }
      d[i * 4 + 3] = 0;
      e[i * 4 + 3] = 0;
    }
    targetA.needsUpdate = true;
    targetB.needsUpdate = true;

    const fill = new THREE.DataTexture(
      (function () {
        const a = new Float32Array(count * 4);
        for (let i = 0; i < count; i++) {
          a[i * 4] = positions[i * 3];
          a[i * 4 + 1] = positions[i * 3 + 1];
          a[i * 4 + 2] = positions[i * 3 + 2];
          a[i * 4 + 3] = 1;
        }
        return a;
      })(), side, side, THREE.RGBAFormat, THREE.FloatType);
    fill.minFilter = THREE.NearestFilter;
    fill.magFilter = THREE.NearestFilter;
    fill.needsUpdate = true;

    const copyScene = new THREE.Scene();
    const copyQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: { tSrc: { value: fill } },
        vertexShader: QUAD_VS,
        fragmentShader: 'precision highp float; uniform sampler2D tSrc; varying vec2 vUv; void main() { gl_FragColor = texture2D(tSrc, vUv); }',
        depthTest: false, depthWrite: false
      })
    );
    copyQuad.frustumCulled = false;
    copyScene.add(copyQuad);
    [current, previous, spare].forEach(t => {
      renderer.setRenderTarget(t);
      renderer.render(copyScene, simCamera);
    });
    renderer.setRenderTarget(null);
    copyQuad.geometry.dispose();
    copyQuad.material.dispose();
    fill.dispose();
  }

  function step(dt, time) {
    simUniforms.tPosition.value = current.texture;
    simUniforms.uTime.value = time;
    simUniforms.uDt.value = Math.min(0.033, dt);

    renderer.setRenderTarget(spare);
    renderer.render(simScene, simCamera);
    renderer.setRenderTarget(null);

    const old = previous;
    previous = current;
    current = spare;
    spare = old;

    drawUniforms.tPosition.value = current.texture;
    drawUniforms.uTime.value = time;
    trailUniforms.tPosition.value = current.texture;
    trailUniforms.tPrevious.value = previous.texture;
  }

  return {
    points: points,
    trails: trails,
    count: count,
    sim: simUniforms,
    draw: drawUniforms,
    trail: trailUniforms,
    seed: seed,
    step: step,
    setA(positions, grow) { writeTarget(targetA, positions, grow); },
    setB(positions, grow) { writeTarget(targetB, positions, grow); },
    carryOver() {
      const a = targetA.image.data, b = targetB.image.data;
      a.set(b);
      targetA.needsUpdate = true;
    },
    dispose() {
      [current, previous, spare].forEach(t => t.dispose());
      targetA.dispose();
      targetB.dispose();
      pointGeo.dispose();
      trailGeo.dispose();
      points.material.dispose();
      trails.material.dispose();
      simQuad.geometry.dispose();
      simQuad.material.dispose();
    }
  };
}
