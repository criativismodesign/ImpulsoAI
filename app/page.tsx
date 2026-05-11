import Link from 'next/link'

export default function Home() {
  return (
    <main style={{minHeight: '100vh', background: 'linear-gradient(to bottom right, #080C1A, #000000)'}}>
      <div style={{maxWidth: '1200px', margin: '0 auto', padding: '64px 16px'}}>
        <div style={{textAlign: 'center', gap: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{gap: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <h1 style={{fontSize: '60px', fontWeight: 'bold', background: 'linear-gradient(to right, #00B4D8, #33C3E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
              ImpulsoAI
            </h1>
            <p style={{fontSize: '20px', color: '#D1D5DB', maxWidth: '600px', margin: '0 auto'}}>
              Potencialize sua criatividade com inteligência artificial de ponta
            </p>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap'}}>
            <Link 
              href="/dashboard" 
              style={{backgroundColor: '#00B4D8', color: 'white', fontWeight: '500', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.2s'}}
            >
              Começar Agora
            </Link>
            <Link 
              href="/about" 
              style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: '500', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.2s'}}
            >
              Saiba Mais
            </Link>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '64px', width: '100%'}}>
            <div style={{backgroundColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '24px', textAlign: 'center', gap: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{width: '64px', height: '64px', backgroundColor: 'rgba(0, 180, 216, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'}}>
                <svg style={{width: '32px', height: '32px', fill: 'none', stroke: '#00B4D8', strokeWidth: '2'}} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 style={{fontSize: '20px', fontWeight: '600', color: 'white'}}>Rápido</h3>
              <p style={{color: '#9CA3AF', margin: 0}}>
                Processamento em tempo real com resultados instantâneos
              </p>
            </div>

            <div style={{backgroundColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '24px', textAlign: 'center', gap: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{width: '64px', height: '64px', backgroundColor: 'rgba(0, 180, 216, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'}}>
                <svg style={{width: '32px', height: '32px', fill: 'none', stroke: '#00B4D8', strokeWidth: '2'}} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 style={{fontSize: '20px', fontWeight: '600', color: 'white'}}>Inteligente</h3>
              <p style={{color: '#9CA3AF', margin: 0}}>
                Algoritmos avançados de IA para resultados precisos
              </p>
            </div>

            <div style={{backgroundColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '24px', textAlign: 'center', gap: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{width: '64px', height: '64px', backgroundColor: 'rgba(0, 180, 216, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'}}>
                <svg style={{width: '32px', height: '32px', fill: 'none', stroke: '#00B4D8', strokeWidth: '2'}} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 style={{fontSize: '20px', fontWeight: '600', color: 'white'}}>Flexível</h3>
              <p style={{color: '#9CA3AF', margin: 0}}>
                Adapta-se às suas necessidades específicas de projeto
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
