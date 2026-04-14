'use client'

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep dark navy base */}
      <div className="absolute inset-0" style={{ background: '#020b1a' }} />

      {/* Blue aurora blobs */}
      <div
        className="absolute -top-48 -left-48 w-[800px] h-[800px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, #003580 0%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'blob1 26s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute top-1/2 -right-40 w-[560px] h-[560px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, #0047a8 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'blob2 32s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute -bottom-32 left-1/4 w-[460px] h-[460px] rounded-full opacity-12"
        style={{
          background: 'radial-gradient(circle, #0055cc 0%, transparent 70%)',
          filter: 'blur(75px)',
          animation: 'blob3 22s ease-in-out infinite alternate',
        }}
      />

      {/* Grid mesh */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,71,168,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,71,168,0.055) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 25%, transparent 80%)',
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px',
        }}
      />

      <style>{`
        @keyframes blob1 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(80px, 70px) scale(1.1); }
          100% { transform: translate(20px, 130px) scale(0.95); }
        }
        @keyframes blob2 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-60px, -90px) scale(1.08); }
          100% { transform: translate(-20px, 50px) scale(0.93); }
        }
        @keyframes blob3 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(55px, -55px) scale(1.12); }
          100% { transform: translate(-25px, 25px) scale(0.97); }
        }
      `}</style>
    </div>
  )
}