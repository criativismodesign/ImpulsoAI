import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-black">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold gradient-text">
              ImpulsoAI
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Potencialize sua criatividade com inteligência artificial de ponta
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/dashboard" 
              className="button-primary"
            >
              Começar Agora
            </Link>
            <Link 
              href="/about" 
              className="glass-effect text-white font-medium py-3 px-6 rounded-lg hover:bg-white/20 transition-all duration-200"
            >
              Saiba Mais
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="card-dark text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Rápido</h3>
              <p className="text-gray-400">
                Processamento em tempo real com resultados instantâneos
              </p>
            </div>

            <div className="card-dark text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Inteligente</h3>
              <p className="text-gray-400">
                Algoritmos avançados de IA para resultados precisos
              </p>
            </div>

            <div className="card-dark text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Flexível</h3>
              <p className="text-gray-400">
                Adapta-se às suas necessidades específicas de projeto
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
