'use client'

const LETTERS = ['금', '방', ' ', '됩', '니', '다', ' ', ':', ')']

export const Component = () => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gll-anim {
          0% {
            opacity: 0;
            transform: translateY(30px) rotateX(-90deg);
            text-shadow: 0 0 0px rgba(150, 150, 150, 0);
          }
          10% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg);
            text-shadow: 0 0 15px rgba(150, 150, 150, 0.6);
          }
          30% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg);
            text-shadow: 0 0 15px rgba(150, 150, 150, 0.6);
          }
          50% {
            opacity: 0;
            transform: translateY(-30px) rotateX(90deg);
            text-shadow: 0 0 0px rgba(150, 150, 150, 0);
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes glb-anim {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: -100%; }
        }
      `}} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36, perspective: 900 }}>
        <div style={{ display: 'flex', gap: 3, fontSize: 48, fontWeight: 700, letterSpacing: '0.04em', color: '#999999' }}>
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: 0,
                animation: `gll-anim 2.8s ease-in-out ${i * 0.1}s infinite`,
                fontFamily: 'var(--font-gaegu)',
              }}
            >
              {letter}
            </span>
          ))}
        </div>
        <div style={{
          position: 'relative',
          width: 300,
          height: 4,
          borderRadius: 9999,
          background: 'rgba(150, 150, 150, 0.15)',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '60%',
            height: '100%',
            borderRadius: 9999,
            background: 'linear-gradient(90deg, transparent, rgba(150, 150, 150, 0.5), transparent)',
            animation: 'glb-anim 2s ease-in-out infinite',
          }} />
        </div>
      </div>
    </>
  )
}
