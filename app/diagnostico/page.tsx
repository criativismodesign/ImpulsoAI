import dynamic from 'next/dynamic'

const DiagnosticoClient = dynamic(() => import('./DiagnosticoClient'), { ssr: false })

export default function DiagnosticoPage() {
  return <DiagnosticoClient />
}
