/*
  Particle simulation adapted from The Spirit by Edan Kwan.
  https://github.com/edankwan/The-Spirit  ·  https://edankwan.com
  MIT License, Copyright (c) 2015 Edan Kwan.
*/

const CURL = `
uniform highp sampler3D tCurl;
uniform float uCurlGain;

vec3 curl(vec3 p, float t) {
  vec3 a = texture(tCurl, p * 0.55 + vec3(t * 0.021, t * 0.013, -t * 0.017)).xyz * 2.0 - 1.0;
  vec3 b = texture(tCurl, p * 1.35 + vec3(-t * 0.031, t * 0.027, t * 0.011) + 0.37).xyz * 2.0 - 1.0;
  vec3 c = texture(tCurl, p * 2.9 + vec3(t * 0.043, -t * 0.036, t * 0.024) + 0.71).xyz * 2.0 - 1.0;
  return (a + b * 0.45 + c * 0.2) * uCurlGain;
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


const FIELD = `
vec3 field(vec3 p, vec4 f) {
  float k = f.x;
  if (k < 0.5) return vec3(0.0);

  if (k < 1.5) {
    float r = length(p);
    return (p / max(r, 0.001)) * f.y * (1.0 + 180.0 / (r + 20.0));
  }

  if (k < 2.5) {
    float r = length(p.xz) + 10.0;
    vec3 around = vec3(-p.z, 0.0, p.x) * (f.y * 70.0 / r);
    return around - vec3(p.x, p.y * 0.8, p.z) * f.w;
  }

  float s = f.z;

  if (k < 3.5) {
    vec3 q = vec3(p.x, p.z, p.y) / s + vec3(0.0, 0.0, 25.0);
    vec3 d = vec3(10.0 * (q.y - q.x), q.x * (28.0 - q.z) - q.y, q.x * q.y - 2.6666667 * q.z);
    return vec3(d.x, d.z, d.y) * s * f.y;
  }

  if (k < 4.5) {
    vec3 q = vec3(p.x, p.z, p.y) / s + vec3(0.0, 0.0, 0.6);
    vec3 d = vec3(
      (q.z - 0.7) * q.x - 3.5 * q.y,
      3.5 * q.x + (q.z - 0.7) * q.y,
      0.6 + 0.95 * q.z - q.z * q.z * q.z / 3.0 - (q.x * q.x + q.y * q.y) * (1.0 + 0.25 * q.z) + 0.1 * q.z * q.x * q.x * q.x
    );
    return vec3(d.x, d.z, d.y) * s * f.y;
  }

  if (k < 5.5) {
    vec3 q = p / s;
    vec3 d = vec3(sin(q.y) - 0.208186 * q.x, sin(q.z) - 0.208186 * q.y, sin(q.x) - 0.208186 * q.z);
    return d * s * f.y;
  }

  return -p * f.y;
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
uniform float uBurst;
uniform float uPull;
uniform float uFree;
uniform float uStir;
uniform float uLife;
uniform float uEmit;
uniform vec4 uField;
uniform vec4 uSigA;
uniform vec4 uSigB;

${CURL}
${SIGNATURE}
${FIELD}

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

  float life = info.w - uDt * uLife * (0.55 + seed * 0.9);
  if (life < 0.0) {
    life += 1.0;
    if (hash11(seed * 91.7 + floor(uTime * 7.0)) < uEmit) {
      vec3 j = vec3(hash11(seed * 13.1 + uTime), hash11(seed * 7.7 + uTime * 1.3), hash11(seed * 3.3 + uTime * 0.7)) - 0.5;
      position = target + j * 3.0;
    }
  }

  float bind = 1.0 - uFree;
  vec3 delta = target - position;
  float far = smoothstep(2.0, 190.0, length(delta));
  position += delta * clamp(uPull * (0.6 + far * 0.7) * uDt * 60.0, 0.0, 0.94) * bind;

  vec3 v = field(position, uField) * uDt * uFree;
  float mag = length(v);
  if (mag > 7.0) v *= 7.0 / mag;
  position += v;

  float stir = uFlow * mix(far, 1.0, uFree) * (1.0 + uBurst * 2.2) + 0.07 + uBurst * 0.12 + uStir * uFree;
  position += curl(position * uCurl, uTime) * stir;

  gl_FragColor = vec4(position, life);
}
`;

const QUAD_VS = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const ARRIVAL = `
float hash11(float n) { return fract(sin(n * 78.233) * 43758.5453); }

float arrival(float seed, float grow) {
  float m = clamp((uMorph - seed * 0.34) / 0.66, 0.0, 1.0);
  float b = clamp((uGrow - grow) / 0.24, 0.0, 1.0);
  float t = min(m, b);
  return t * t * (3.0 - 2.0 * t);
}

float breath(float life) {
  return mix(1.0, smoothstep(0.0, 0.12, life) * smoothstep(1.0, 0.82, life), uEmit * uFree);
}
`;

const DRAW_VS = `
#include <packing>

uniform sampler2D tPosition;
uniform sampler2D tTargetB;
uniform sampler2D tShadow;
uniform mat4 uLight;
uniform float uShadowTexel;
uniform float uPR;
uniform float uTime;
uniform float uMorph;
uniform float uGrow;
uniform float uFree;
uniform float uEmit;
uniform vec2 uFire;
varying float vFog;
varying float vSeed;
varying float vLum;
varying float vLit;

${ARRIVAL}

float firing(vec3 p, float on, float time) {
  if (on < 0.5) return 0.0;
  float d = length(p) / 190.0;
  float w = fract(time * 0.42);
  float pulse = exp(-pow((d - w) * 5.5, 2.0)) * 1.9;
  float w2 = fract(time * 0.42 + 0.5);
  pulse += exp(-pow((d - w2) * 5.5, 2.0)) * 1.1;
  return pulse;
}

float occluded(vec2 uv, float z) {
  return step(unpackRGBAToDepth(texture2D(tShadow, uv)) + 0.0022, z);
}

void main() {
  vec4 info = texture2D(tPosition, position.xy);
  vec4 tb = texture2D(tTargetB, position.xy);
  vec3 p = info.xyz;

  vec4 world = modelMatrix * vec4(p, 1.0);
  vec4 mv = viewMatrix * world;
  float d = -mv.z;

  vSeed = hash11(position.x * 317.7 + position.y * 911.3);
  vFog = pow(clamp(1.0 - (d - 130.0) / 620.0, 0.0, 1.0), 1.05);
  float lum = 0.35 + arrival(vSeed, tb.w) * 0.65;
  vLum = lum * breath(info.w) * (1.0 + firing(tb.xyz, max(uFire.x, uFire.y), uTime) * 0.9);

  vec4 ls = uLight * world;
  vec3 sc = ls.xyz / ls.w * 0.5 + 0.5;
  float shade = 0.0;
  if (sc.x > 0.0 && sc.x < 1.0 && sc.y > 0.0 && sc.y < 1.0 && sc.z < 1.0) {
    float e = uShadowTexel;
    shade = (occluded(sc.xy, sc.z) + occluded(sc.xy + vec2(e, 0.0), sc.z) + occluded(sc.xy - vec2(e, 0.0), sc.z)
          + occluded(sc.xy + vec2(0.0, e), sc.z) + occluded(sc.xy - vec2(0.0, e), sc.z)) * 0.2;
  }
  vLit = 1.0 - shade;

  float size = 0.9 + hash11(vSeed * 71.3) * 1.5;
  gl_PointSize = clamp(size * uPR * (320.0 / max(1.0, d)) * (0.85 + vLum * 0.25), 1.0, 10.0 * uPR);
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
varying float vLit;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r = dot(p, p);
  if (r > 1.0 || vLum * vFog * uFade < 0.004) discard;
  float tw = 0.84 + 0.16 * sin(uTime * 1.1 + vSeed * 44.0);
  float light = 0.3 + 0.7 * vLit;
  float shade = vLum * vFog * tw * light * (1.0 - r * 0.3) * 1.75;
  gl_FragColor = vec4(vec3(min(shade, 1.0) * uFade), 1.0);
}
`;

const DEPTH_VS = `
uniform sampler2D tPosition;
uniform float uSize;
void main() {
  vec3 p = texture2D(tPosition, position.xy).xyz;
  gl_PointSize = uSize;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const DEPTH_FS = `
#include <packing>
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  if (dot(c, c) > 1.0) discard;
  gl_FragColor = packDepthToRGBA(gl_FragCoord.z);
}
`;

const TRAIL_VS = `
uniform sampler2D tPosition;
uniform sampler2D tPrevious;
uniform sampler2D tTargetB;
uniform float uMorph;
uniform float uGrow;
uniform float uFree;
uniform float uEmit;
attribute float aEnd;
varying float vFog;
varying float vLum;

${ARRIVAL}

void main() {
  vec4 now = texture2D(tPosition, position.xy);
  vec4 was = texture2D(tPrevious, position.xy);
  vec4 tb = texture2D(tTargetB, position.xy);
  float jump = step(24.0, length(now.xyz - was.xyz));
  vec3 p = mix(mix(now.xyz, was.xyz, aEnd), now.xyz, jump);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = -mv.z;
  float seed = hash11(position.x * 317.7 + position.y * 911.3);
  vFog = pow(clamp(1.0 - (d - 130.0) / 620.0, 0.0, 1.0), 1.05);
  vLum = (0.35 + arrival(seed, tb.w) * 0.65) * breath(now.w) * (1.0 - aEnd * 0.85);
  gl_Position = projectionMatrix * mv;
}
`;

const TRAIL_FS = `
precision highp float;
uniform float uFade;
varying float vFog;
varying float vLum;
void main() {
  float a = vFog * vLum * uFade * 0.14;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vec3(1.0), a);
}
`;

export function simTarget(THREE, renderer) {
  const ext = renderer.extensions;
  const has = name => { try { return !!ext.has(name); } catch (_) { return false; } };
  if (renderer.capabilities.isWebGL2) {
    if (has('EXT_color_buffer_float')) return THREE.FloatType;
    if (has('EXT_color_buffer_half_float')) return THREE.HalfFloatType;
    return null;
  }
  if (!has('OES_texture_float')) return null;
  if (has('WEBGL_color_buffer_float')) return THREE.FloatType;
  if (has('OES_texture_half_float') && has('EXT_color_buffer_half_float')) return THREE.HalfFloatType;
  return null;
}

function curlVolume(THREE, size) {
  let a = 0xC0FFEE;
  const rnd = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const modes = [];
  while (modes.length < 44) {
    const k = [Math.round(rnd() * 8 - 4), Math.round(rnd() * 8 - 4), Math.round(rnd() * 8 - 4)];
    const m = Math.hypot(k[0], k[1], k[2]);
    if (m < 1 || m > 4.6) continue;
    const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), amp = 1 / Math.pow(m, 1.35);
    const v = [Math.sin(ph) * Math.cos(th) * amp, Math.cos(ph) * amp, Math.sin(ph) * Math.sin(th) * amp];
    modes.push({
      k: k,
      phase: rnd() * Math.PI * 2,
      c: [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]]
    });
  }
  const n = size * size * size;
  const field = new Float32Array(n * 3);
  let peak = 1e-6;
  for (let z = 0, i = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++, i++) {
        let fx = 0, fy = 0, fz = 0;
        for (const mode of modes) {
          const w = Math.cos(Math.PI * 2 * (mode.k[0] * x + mode.k[1] * y + mode.k[2] * z) / size + mode.phase);
          fx += mode.c[0] * w; fy += mode.c[1] * w; fz += mode.c[2] * w;
        }
        field[i * 3] = fx; field[i * 3 + 1] = fy; field[i * 3 + 2] = fz;
        peak = Math.max(peak, Math.abs(fx), Math.abs(fy), Math.abs(fz));
      }
    }
  }
  const bytes = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    bytes[i * 4] = Math.round((field[i * 3] / peak * 0.5 + 0.5) * 255);
    bytes[i * 4 + 1] = Math.round((field[i * 3 + 1] / peak * 0.5 + 0.5) * 255);
    bytes[i * 4 + 2] = Math.round((field[i * 3 + 2] / peak * 0.5 + 0.5) * 255);
    bytes[i * 4 + 3] = 255;
  }
  const tex = new THREE.Data3DTexture(bytes, size, size, size);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

export function createSpirit(THREE, renderer, side) {
  const count = side * side;
  const type = simTarget(THREE, renderer);
  if (!type || !renderer.capabilities.isWebGL2 || !THREE.Data3DTexture) throw new Error('no float render targets');
  const curlTex = curlVolume(THREE, 32);

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

  const flow = {
    uFree: { value: 0 },
    uEmit: { value: 0 },
    uMorph: { value: 1 },
    uGrow: { value: 1 }
  };

  const simUniforms = {
    uSize: { value: new THREE.Vector2(side, side) },
    tPosition: { value: null },
    tTargetA: { value: targetA },
    tTargetB: { value: targetB },
    uTime: { value: 0 },
    uDt: { value: 0.016 },
    uMorph: flow.uMorph,
    uGrow: flow.uGrow,
    uCurl: { value: 0.0042 },
    tCurl: { value: curlTex },
    uCurlGain: { value: 1.6 },
    uFlow: { value: 1.6 },
    uBurst: { value: 0 },
    uPull: { value: 0.09 },
    uFree: flow.uFree,
    uStir: { value: 0 },
    uLife: { value: 0.4 },
    uEmit: flow.uEmit,
    uField: { value: new THREE.Vector4(0, 0, 1, 0) },
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

  const SHADOW = side > 128 ? 1024 : 512;
  const shadowTarget = new THREE.WebGLRenderTarget(SHADOW, SHADOW, {
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
    depthBuffer: true, stencilBuffer: false, generateMipmaps: false
  });
  const light = new THREE.OrthographicCamera(-290, 290, 290, -290, 1, 1500);
  light.position.set(260, 620, 330);
  light.lookAt(0, 0, 0);
  light.updateMatrixWorld(true);
  light.updateProjectionMatrix();
  const lightMatrix = new THREE.Matrix4().multiplyMatrices(light.projectionMatrix, light.matrixWorldInverse);

  const drawUniforms = {
    tPosition: { value: null },
    tTargetB: { value: targetB },
    tShadow: { value: shadowTarget.texture },
    uLight: { value: lightMatrix },
    uShadowTexel: { value: 1.2 / SHADOW },
    uPR: { value: 1 },
    uTime: { value: 0 },
    uFade: { value: 0 },
    uMorph: flow.uMorph,
    uGrow: flow.uGrow,
    uFree: flow.uFree,
    uEmit: flow.uEmit,
    uFire: { value: new THREE.Vector2(0, 0) }
  };

  const points = new THREE.Points(pointGeo, new THREE.ShaderMaterial({
    uniforms: drawUniforms, vertexShader: DRAW_VS, fragmentShader: DRAW_FS,
    transparent: false, depthTest: true, depthWrite: true, blending: THREE.NoBlending
  }));
  points.frustumCulled = false;

  const depthUniforms = {
    tPosition: { value: null },
    uSize: { value: side > 128 ? 2.2 : 3.2 }
  };
  const depthScene = new THREE.Scene();
  const depthPoints = new THREE.Points(pointGeo, new THREE.ShaderMaterial({
    uniforms: depthUniforms, vertexShader: DEPTH_VS, fragmentShader: DEPTH_FS,
    depthTest: true, depthWrite: true, blending: THREE.NoBlending
  }));
  depthPoints.frustumCulled = false;
  depthScene.add(depthPoints);

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
    tTargetB: { value: targetB },
    uMorph: flow.uMorph,
    uGrow: flow.uGrow,
    uFree: flow.uFree,
    uEmit: flow.uEmit,
    uFade: { value: 0 }
  };

  const trails = new THREE.LineSegments(trailGeo, new THREE.ShaderMaterial({
    uniforms: trailUniforms, vertexShader: TRAIL_VS, fragmentShader: TRAIL_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  trails.frustumCulled = false;
  trails.renderOrder = 2;

  function writeTarget(tex, packed) {
    tex.image.data.set(packed);
    tex.needsUpdate = true;
  }

  function seed(packed) {
    writeTarget(targetA, packed);
    writeTarget(targetB, packed);

    const start = new Float32Array(packed);
    for (let i = 0; i < count; i++) start[i * 4 + 3] = Math.random();
    const fill = new THREE.DataTexture(start, side, side, THREE.RGBAFormat, THREE.FloatType);
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

    const old = previous;
    previous = current;
    current = spare;
    spare = old;

    depthPoints.rotation.copy(points.rotation);
    depthPoints.updateMatrixWorld(true);
    depthUniforms.tPosition.value = current.texture;
    renderer.setRenderTarget(shadowTarget);
    renderer.setClearColor(0xffffff, 1);
    renderer.clear(true, true, false);
    renderer.render(depthScene, light);
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(null);

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
    flow: flow,
    seed: seed,
    step: step,
    warm() {
      if (typeof renderer.compileAsync !== 'function') return Promise.resolve();
      return Promise.all([
        renderer.compileAsync(simScene, simCamera),
        renderer.compileAsync(depthScene, light)
      ]);
    },
    setA(packed) { writeTarget(targetA, packed); },
    setB(packed) { writeTarget(targetB, packed); },
    carryOver() {
      const a = targetA.image.data, b = targetB.image.data;
      a.set(b);
      targetA.needsUpdate = true;
    },
    dispose() {
      [current, previous, spare, shadowTarget].forEach(t => t.dispose());
      curlTex.dispose();
      targetA.dispose();
      targetB.dispose();
      pointGeo.dispose();
      trailGeo.dispose();
      points.material.dispose();
      depthPoints.material.dispose();
      trails.material.dispose();
      simQuad.geometry.dispose();
      simQuad.material.dispose();
    }
  };
}
