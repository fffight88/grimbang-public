'use client';

import React, { useEffect, useRef } from 'react';

export type AetherHeroProps = {
  /* ---------- Hero content ---------- */
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  children?: React.ReactNode;

  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
  overlayGradient?: string;
  textColor?: string;

  /* ---------- Canvas/shader ---------- */
  fragmentSource?: string;
  dprMax?: number;
  clearColor?: [number, number, number, number];

  /* ---------- Misc ---------- */
  height?: string | number;
  className?: string;
  ariaLabel?: string;
};

/* Default fragment shader */
const DEFAULT_FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define S smoothstep
#define MN min(R.x,R.y)
float pattern(vec2 uv) {
  float d=.0;
  for (float i=.0; i<3.; i++) {
    uv.x+=sin(T*(1.+i)+uv.y*1.5)*.2;
    d+=.005/abs(uv.x);
  }
  return d;
}
vec3 scene(vec2 uv) {
  vec3 col=vec3(0);
  uv=vec2(atan(uv.x,uv.y)*2./6.28318,-log(length(uv))+T);
  for (float i=.0; i<3.; i++) {
    int k=int(mod(i,3.));
    col[k]+=pattern(uv+i*6./MN);
  }
  return col;
}
void main() {
  vec2 uv=(FC-.5*R)/MN;
  vec3 col=vec3(0);
  float s=12., e=9e-4;
  col+=e/(sin(uv.x*s)*cos(uv.y*s));
  uv.y+=R.x>R.y?.5:.5*(R.y/R.x);
  col+=scene(uv);
  O=vec4(col,1.);
}`;

/* Minimal passthrough vertex shader */
const VERT_SRC = `#version 300 es
precision highp float;
in vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`;

const JUSTIFY_MAP = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
} as const;

const TEXT_ALIGN_MAP = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

export default function AetherHero({
  /* Content */
  title = 'Make the impossible feel inevitable.',
  subtitle = 'A minimal hero with a living shader background. Built for product landings, announcements, and portfolio intros.',
  ctaLabel = 'Get Started',
  ctaHref = '#',
  secondaryCtaLabel,
  secondaryCtaHref,
  children,

  align = 'center',
  maxWidth = 960,
  overlayGradient = 'linear-gradient(180deg, #00000099, #00000040 40%, transparent)',
  textColor = '#ffffff',

  /* Shader */
  fragmentSource = DEFAULT_FRAG,
  dprMax = 2,
  clearColor = [0, 0, 0, 1],

  /* Misc */
  height = '100vh',
  className = '',
  ariaLabel = 'Aurora hero background',
}: AetherHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const bufRef = useRef<WebGLBuffer | null>(null);
  const uniTimeRef = useRef<WebGLUniformLocation | null>(null);
  const uniResRef = useRef<WebGLUniformLocation | null>(null);
  const rafRef = useRef<number | null>(null);

  const compileShader = (gl: WebGL2RenderingContext, src: string, type: number) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(sh) || 'Unknown shader error';
      gl.deleteShader(sh);
      throw new Error(info);
    }
    return sh;
  };
  const createProgram = (gl: WebGL2RenderingContext, vs: string, fs: string) => {
    const v = compileShader(gl, vs, gl.VERTEX_SHADER);
    const f = compileShader(gl, fs, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(prog) || 'Program link error';
      gl.deleteProgram(prog);
      throw new Error(info);
    }
    return prog;
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) return;
    glRef.current = gl;

    let prog: WebGLProgram;
    try {
      prog = createProgram(gl, VERT_SRC, fragmentSource);
    } catch (e) {
      console.error(e);
      return;
    }
    programRef.current = prog;

    const verts = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
    const buf = gl.createBuffer()!;
    bufRef.current = buf;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    gl.useProgram(prog);
    const posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    uniTimeRef.current = gl.getUniformLocation(prog, 'time');
    uniResRef.current = gl.getUniformLocation(prog, 'resolution');

    gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);

    const fit = () => {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, dprMax));
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);
      const W = Math.floor(cssW * dpr);
      const H = Math.floor(cssH * dpr);
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W; canvas.height = H;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    fit();
    const onResize = () => fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    window.addEventListener('resize', onResize);

    const loop = (now: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      if (uniResRef.current) gl.uniform2f(uniResRef.current, canvas.width, canvas.height);
      if (uniTimeRef.current) gl.uniform1f(uniTimeRef.current, now * 1e-3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (bufRef.current) gl.deleteBuffer(bufRef.current);
      if (programRef.current) gl.deleteProgram(programRef.current);
    };
  }, [fragmentSource, dprMax, clearColor]);

  const centerMargin = align === 'center' ? 'mx-auto' : '';

  return (
    <section
      className={`relative overflow-hidden ${className}`}
      style={{ height }}
      aria-label="Hero"
    >
      {/* Shader canvas (background) */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        className="absolute inset-0 w-full h-full block select-none touch-none"
      />

      {/* Content layer */}
      <div
        className={`relative z-[2] h-full flex items-center ${JUSTIFY_MAP[align]} p-[min(6vw,64px)] font-sans`}
        style={{ color: textColor }}
      >
        {children ? (
          <div className="w-full mx-auto" style={{ maxWidth }}>
            {children}
          </div>
        ) : (
          <div
            className={`w-full ${centerMargin} ${TEXT_ALIGN_MAP[align]}`}
            style={{ maxWidth }}
          >
            <h1 className="m-0 text-[clamp(2.2rem,6vw,4.5rem)] leading-[1.04] tracking-tight font-bold font-handwriting [text-shadow:0_6px_36px_rgba(0,0,0,0.45)]">
              {title}
            </h1>

            {subtitle && (
              <p className={`mt-4 text-[clamp(1rem,2vw,1.25rem)] leading-relaxed opacity-90 [text-shadow:0_4px_24px_rgba(0,0,0,0.35)] max-w-[900px] ${centerMargin}`}>
                {subtitle}
              </p>
            )}

            {(ctaLabel || secondaryCtaLabel) && (
              <div className="inline-flex gap-3 mt-8 flex-wrap">
                {ctaLabel && (
                  <a
                    href={ctaHref}
                    className="py-3 px-[18px] rounded-xl bg-gradient-to-b from-white/18 to-white/6 no-underline font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28),0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-[6px] backdrop-saturate-[120%]"
                    style={{ color: textColor }}
                  >
                    {ctaLabel}
                  </a>
                )}

                {secondaryCtaLabel && (
                  <a
                    href={secondaryCtaHref}
                    className="py-3 px-[18px] rounded-xl bg-transparent opacity-85 no-underline font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)] backdrop-blur-[2px]"
                    style={{ color: textColor }}
                  >
                    {secondaryCtaLabel}
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export { AetherHero };
