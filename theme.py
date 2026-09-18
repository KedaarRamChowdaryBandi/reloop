import streamlit as st
import streamlit.components.v1 as components

def load_css():
    with open("style.css", encoding="utf-8") as f:
        st.markdown(
            f"<style>{f.read()}</style>",
            unsafe_allow_html=True
        )
    
    # Inject WebGL 3D Dither Shader Canvas silently via components.html
    shader_html = """
    <script>
    (function() {
      const doc = (window.parent && window.parent.document) ? window.parent.document : document;
      let canvas = doc.getElementById('reloop-dither-bg');
      
      if (!canvas) {
        canvas = doc.createElement('canvas');
        canvas.id = 'reloop-dither-bg';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '-100';
        canvas.style.pointerEvents = 'none';
        canvas.style.display = 'block';
        doc.body.prepend(canvas);
      }

      const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false });
      if (!gl) return;

      const vsSource = `#version 300 es
      precision mediump float;
      layout(location = 0) in vec4 a_position;
      void main() {
        gl_Position = a_position;
      }`;

      const fsSource = `#version 300 es
      precision mediump float;

      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_pixelRatio;
      uniform float u_originX;
      uniform float u_originY;
      uniform float u_worldWidth;
      uniform float u_worldHeight;
      uniform float u_fit;
      uniform float u_scale;
      uniform float u_rotation;
      uniform float u_offsetX;
      uniform float u_offsetY;

      uniform float u_pxSize;
      uniform vec4 u_colorBack;
      uniform vec4 u_colorFront;
      uniform float u_shape;
      uniform float u_type;

      out vec4 fragColor;

      #define TWO_PI 6.28318530718
      #define PI 3.14159265358979323846

      vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
          -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
          + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
            dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float hash11(float p) {
        p = fract(p * 0.3183099) + 0.1;
        p *= p + 19.19;
        return fract(p * p);
      }

      float hash21(vec2 p) {
        p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
        p += dot(p, p + 19.19);
        return fract(p.x * p.y);
      }

      float getSimplexNoise(vec2 uv, float t) {
        float noise = .5 * snoise(uv - vec2(0., .3 * t));
        noise += .5 * snoise(2. * uv + vec2(0., .32 * t));
        return noise;
      }

      const int bayer2x2[4] = int[4](0, 2, 3, 1);
      const int bayer4x4[16] = int[16](
        0, 8, 2, 10,
        12, 4, 14, 6,
        3, 11, 1, 9,
        15, 7, 13, 5
      );

      const int bayer8x8[64] = int[64](
        0, 32, 8, 40, 2, 34, 10, 42,
        48, 16, 56, 24, 50, 18, 58, 26,
        12, 44, 4, 36, 14, 46, 6, 38,
        60, 28, 52, 20, 62, 30, 54, 22,
        3, 35, 11, 43, 1, 33, 9, 41,
        51, 19, 59, 27, 49, 17, 57, 25,
        15, 47, 7, 39, 13, 45, 5, 37,
        63, 31, 55, 23, 61, 29, 53, 21
      );

      float getBayerValue(vec2 uv, int size) {
        ivec2 pos = ivec2(fract(uv / float(size)) * float(size));
        int index = pos.y * size + pos.x;

        if (size == 2) {
          return float(bayer2x2[index]) / 4.0;
        } else if (size == 4) {
          return float(bayer4x4[index]) / 16.0;
        } else if (size == 8) {
          return float(bayer8x8[index]) / 64.0;
        }
        return 0.0;
      }

      void main() {
        float t = .5 * u_time;

        float pxSize = u_pxSize * u_pixelRatio;
        vec2 pxSizeUV = gl_FragCoord.xy - .5 * u_resolution;
        pxSizeUV /= pxSize;
        vec2 canvasPixelizedUV = (floor(pxSizeUV) + .5) * pxSize;
        vec2 normalizedUV = canvasPixelizedUV / u_resolution;

        vec2 ditheringNoiseUV = canvasPixelizedUV;
        vec2 shapeUV = normalizedUV;

        vec2 boxOrigin = vec2(.5 - u_originX, u_originY - .5);
        vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
        givenBoxSize = max(givenBoxSize, vec2(1.)) * u_pixelRatio;
        float r = u_rotation * PI / 180.;
        mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));

        float patternBoxRatio = givenBoxSize.x / givenBoxSize.y;
        vec2 boxSize = vec2(
          (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
          (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
        );
        
        if (u_shape > 3.5) {
          vec2 objectBoxSize = vec2(0.);
          objectBoxSize.x = min(boxSize.x, boxSize.y);
          if (u_fit == 1.) {
            objectBoxSize.x = min(u_resolution.x, u_resolution.y);
          } else if (u_fit == 2.) {
            objectBoxSize.x = max(u_resolution.x, u_resolution.y);
          }
          objectBoxSize.y = objectBoxSize.x;
          vec2 objectWorldScale = u_resolution.xy / objectBoxSize;

          shapeUV *= objectWorldScale;
          shapeUV += boxOrigin * (objectWorldScale - 1.);
          shapeUV += vec2(-u_offsetX, u_offsetY);
          shapeUV /= u_scale;
          shapeUV = graphicRotation * shapeUV;
        } else {
          vec2 patternBoxSize = vec2(0.);
          patternBoxSize.x = patternBoxRatio * min(boxSize.x / patternBoxRatio, boxSize.y);
          float patternWorldNoFitBoxWidth = patternBoxSize.x;
          if (u_fit == 1.) {
            patternBoxSize.x = patternBoxRatio * min(u_resolution.x / patternBoxRatio, u_resolution.y);
          } else if (u_fit == 2.) {
            patternBoxSize.x = patternBoxRatio * max(u_resolution.x / patternBoxRatio, u_resolution.y);
          }
          patternBoxSize.y = patternBoxSize.x / patternBoxRatio;
          vec2 patternWorldScale = u_resolution.xy / patternBoxSize;

          shapeUV += vec2(-u_offsetX, u_offsetY) / patternWorldScale;
          shapeUV += boxOrigin;
          shapeUV -= boxOrigin / patternWorldScale;
          shapeUV *= u_resolution.xy;
          shapeUV /= u_pixelRatio;
          if (u_fit > 0.) {
            shapeUV *= (patternWorldNoFitBoxWidth / patternBoxSize.x);
          }
          shapeUV /= u_scale;
          shapeUV = graphicRotation * shapeUV;
          shapeUV += boxOrigin / patternWorldScale;
          shapeUV -= boxOrigin;
          shapeUV += .5;
        }

        float shape = 0.;
        if (u_shape < 1.5) {
          shapeUV *= .001;
          shape = 0.5 + 0.5 * getSimplexNoise(shapeUV, t);
          shape = smoothstep(0.3, 0.9, shape);
        } else if (u_shape < 2.5) {
          shapeUV *= .003;
          for (float i = 1.0; i < 6.0; i++) {
            shapeUV.x += 0.6 / i * cos(i * 2.5 * shapeUV.y + t);
            shapeUV.y += 0.6 / i * cos(i * 1.5 * shapeUV.x + t);
          }
          shape = .15 / max(0.001, abs(sin(t - shapeUV.y - shapeUV.x)));
          shape = smoothstep(0.02, 1., shape);
        } else if (u_shape < 3.5) {
          shapeUV *= .05;
          float stripeIdx = floor(2. * shapeUV.x / TWO_PI);
          float rand = hash11(stripeIdx * 10.);
          rand = sign(rand - .5) * pow(.1 + abs(rand), .4);
          shape = sin(shapeUV.x) * cos(shapeUV.y - 5. * rand * t);
          shape = pow(abs(shape), 6.);
        } else if (u_shape < 4.5) {
          shapeUV *= 4.;
          float wave = cos(.5 * shapeUV.x - 2. * t) * sin(1.5 * shapeUV.x + t) * (.75 + .25 * cos(3. * t));
          shape = 1. - smoothstep(-1., 1., shapeUV.y + wave);
        } else if (u_shape < 5.5) {
          float dist = length(shapeUV);
          float waves = sin(pow(dist, 1.7) * 7. - 3. * t) * .5 + .5;
          shape = waves;
        } else if (u_shape < 6.5) {
          float l = length(shapeUV);
          float angle = 6. * atan(shapeUV.y, shapeUV.x) + 4. * t;
          float twist = 1.2;
          float offset = 1. / pow(max(l, 1e-6), twist) + angle / TWO_PI;
          float mid = smoothstep(0., 1., pow(l, twist));
          shape = mix(0., fract(offset), mid);
        } else {
          shapeUV *= 2.;
          float d = 1. - pow(length(shapeUV), 2.);
          vec3 pos = vec3(shapeUV, sqrt(max(0., d)));
          vec3 lightPos = normalize(vec3(cos(1.5 * t), .8, sin(1.25 * t)));
          shape = .5 + .5 * dot(lightPos, pos);
          shape *= step(0., d);
        }

        int type = int(floor(u_type));
        float dithering = 0.0;

        switch (type) {
          case 1: {
            dithering = step(hash21(ditheringNoiseUV), shape);
          } break;
          case 2:
          dithering = getBayerValue(pxSizeUV, 2);
          break;
          case 3:
          dithering = getBayerValue(pxSizeUV, 4);
          break;
          default :
          dithering = getBayerValue(pxSizeUV, 8);
          break;
        }

        dithering -= .5;
        float res = step(.5, shape + dithering);

        vec3 fgColor = u_colorFront.rgb * u_colorFront.a;
        float fgOpacity = u_colorFront.a;
        vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
        float bgOpacity = u_colorBack.a;

        vec3 color = fgColor * res;
        float opacity = fgOpacity * res;

        color += bgColor * (1. - opacity);
        opacity += bgOpacity * (1. - opacity);

        fragColor = vec4(color, opacity);
      }`;

      function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      }

      const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return;

      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return;
      }

      const posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const posLoc = gl.getAttribLocation(program, 'a_position');

      const locs = {
        u_time: gl.getUniformLocation(program, 'u_time'),
        u_resolution: gl.getUniformLocation(program, 'u_resolution'),
        u_pixelRatio: gl.getUniformLocation(program, 'u_pixelRatio'),
        u_originX: gl.getUniformLocation(program, 'u_originX'),
        u_originY: gl.getUniformLocation(program, 'u_originY'),
        u_worldWidth: gl.getUniformLocation(program, 'u_worldWidth'),
        u_worldHeight: gl.getUniformLocation(program, 'u_worldHeight'),
        u_fit: gl.getUniformLocation(program, 'u_fit'),
        u_scale: gl.getUniformLocation(program, 'u_scale'),
        u_rotation: gl.getUniformLocation(program, 'u_rotation'),
        u_offsetX: gl.getUniformLocation(program, 'u_offsetX'),
        u_offsetY: gl.getUniformLocation(program, 'u_offsetY'),
        u_pxSize: gl.getUniformLocation(program, 'u_pxSize'),
        u_colorBack: gl.getUniformLocation(program, 'u_colorBack'),
        u_colorFront: gl.getUniformLocation(program, 'u_colorFront'),
        u_shape: gl.getUniformLocation(program, 'u_shape'),
        u_type: gl.getUniformLocation(program, 'u_type')
      };

      let startTime = performance.now();

      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = doc.documentElement.clientWidth || window.innerWidth;
        const h = doc.documentElement.clientHeight || window.innerHeight;
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          gl.viewport(0, 0, canvas.width, canvas.height);
        }
      }

      window.addEventListener('resize', resize);
      resize();

      if (window.parent.__reloopShaderAnimationId) {
        cancelAnimationFrame(window.parent.__reloopShaderAnimationId);
      }

      function render(now) {
        resize();
        const elapsed = (now - startTime) * 0.001 * 2.8;
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1f(locs.u_time, elapsed);
        gl.uniform2f(locs.u_resolution, canvas.width, canvas.height);
        gl.uniform1f(locs.u_pixelRatio, Math.min(window.devicePixelRatio || 1, 2));
        gl.uniform1f(locs.u_originX, 0.5);
        gl.uniform1f(locs.u_originY, 0.5);
        gl.uniform1f(locs.u_worldWidth, 0);
        gl.uniform1f(locs.u_worldHeight, 0);
        gl.uniform1f(locs.u_fit, 2);
        gl.uniform1f(locs.u_scale, 0.32);
        gl.uniform1f(locs.u_rotation, 0);
        gl.uniform1f(locs.u_offsetX, 0);
        gl.uniform1f(locs.u_offsetY, 0);

        gl.uniform1f(locs.u_pxSize, 3.4);
        gl.uniform4f(locs.u_colorBack, 0.035, 0.059, 0.114, 1.0); // #090F1D deep obsidian background
        gl.uniform4f(locs.u_colorFront, 0.0, 1.0, 0.75, 0.85); // #00FFC0 / #10B981 vibrant mint dither
        gl.uniform1f(locs.u_shape, 6.0); // 3D Swirl shape
        gl.uniform1f(locs.u_type, 3.0); // 4x4 matrix

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        window.parent.__reloopShaderAnimationId = requestAnimationFrame(render);
      }

      window.parent.__reloopShaderAnimationId = requestAnimationFrame(render);
    })();
    </script>
    """
    components.html(shader_html, height=0, width=0)