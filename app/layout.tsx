// app/layout.tsx
export const metadata = {
  title: 'MeuPiloto!',
  description: 'Sua corrida com segurança - Plataforma de transporte por moto',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* ============================================
               MEUPILOTO! - DESIGN ELEVADO & MODERNO
               Suavidade, fluidez e atenção aos detalhes
            ============================================ */

            /* Reset e base */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: radial-gradient(ellipse at 20% 30%, #fffaf5 0%, #fff3e8 50%, #ffede3 100%);
              min-height: 100vh;
              position: relative;
            }

            /* Brilho ambiente suave */
            body::before {
              content: '';
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(circle at 70% 40%, rgba(245, 158, 11, 0.06) 0%, rgba(245, 158, 11, 0.02) 60%, transparent 90%);
              pointer-events: none;
              z-index: 0;
            }

            /* Scrollbar refinada */
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #faf3eb;
              border-radius: 20px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(145deg, #f5a623, #e8931a);
              border-radius: 20px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(145deg, #e8931a, #d47d10);
            }

            /* Container principal */
            .container {
              max-width: 1280px;
              margin: 0 auto;
              padding: 0 1.5rem;
            }

            /* ============================================
               CARDS COM ELEGÂNCIA MODERNA
            ============================================ */
            .card {
              background: rgba(255, 253, 250, 0.88);
              backdrop-filter: blur(16px);
              border-radius: 1.75rem;
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(255, 255, 245, 0.8) inset;
              transition: all 0.45s cubic-bezier(0.23, 1, 0.32, 1);
              border: 1px solid rgba(255, 245, 235, 0.5);
            }
            .card:hover {
              transform: translateY(-3px);
              box-shadow: 0 20px 32px -12px rgba(0, 0, 0, 0.12);
              background: rgba(255, 254, 252, 0.96);
              border-color: rgba(245, 158, 11, 0.2);
            }

            /* ============================================
               BOTÕES COM FLUIDEZ
            ============================================ */
            .btn-primary {
              background: linear-gradient(145deg, #f5a623 0%, #e8931a 100%);
              color: white;
              padding: 0.75rem 1.75rem;
              border: none;
              border-radius: 1.25rem;
              font-weight: 600;
              font-size: 0.875rem;
              letter-spacing: -0.01em;
              cursor: pointer;
              transition: all 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1);
              box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
              position: relative;
              overflow: hidden;
            }
            .btn-primary::before {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              width: 0;
              height: 0;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.3);
              transform: translate(-50%, -50%);
              transition: width 0.5s, height 0.5s;
            }
            .btn-primary:hover::before {
              width: 280px;
              height: 280px;
            }
            .btn-primary:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35);
            }
            .btn-primary:active {
              transform: translateY(1px);
            }

            .btn-secondary {
              background: linear-gradient(145deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 0.75rem 1.75rem;
              border: none;
              border-radius: 1.25rem;
              font-weight: 600;
              font-size: 0.875rem;
              cursor: pointer;
              transition: all 0.35s ease;
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
            }
            .btn-secondary:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
            }
            .btn-secondary:active {
              transform: translateY(1px);
            }

            .btn-outline {
              background: transparent;
              border: 1.5px solid #f5a623;
              color: #e8931a;
              padding: 0.7rem 1.75rem;
              border-radius: 1.25rem;
              font-weight: 600;
              font-size: 0.875rem;
              cursor: pointer;
              transition: all 0.35s ease;
            }
            .btn-outline:hover {
              background: linear-gradient(145deg, #f5a623, #e8931a);
              color: white;
              border-color: transparent;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
            }

            /* ============================================
               BADGES SUAVES
            ============================================ */
            .badge-online {
              background: linear-gradient(145deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 0.3rem 0.9rem;
              border-radius: 40px;
              font-size: 0.7rem;
              font-weight: 600;
              display: inline-flex;
              align-items: center;
              gap: 0.3rem;
              box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
            }
            .badge-online::before {
              content: '';
              width: 6px;
              height: 6px;
              background: white;
              border-radius: 50%;
              animation: pulse 2s infinite;
            }
            .badge-offline {
              background: #e5e7eb;
              color: #6b7280;
              padding: 0.3rem 0.9rem;
              border-radius: 40px;
              font-size: 0.7rem;
              font-weight: 600;
            }
            .badge-pending {
              background: linear-gradient(145deg, #fbbf24, #f59e0b);
              color: #78350f;
              padding: 0.3rem 0.9rem;
              border-radius: 40px;
              font-size: 0.7rem;
              font-weight: 600;
            }

            /* ============================================
               CORES DE FUNDO - TONS SUAVES
            ============================================ */
            .bg-white { background-color: #ffffff; }
            .bg-gray-50 { background-color: #fefdfa; }
            .bg-gray-100 { background-color: #f8f6f3; }
            .bg-gray-800 { background-color: #2d2a24; }
            .bg-gray-900 { background-color: #1e1b17; }
            .bg-amber-50 { background-color: #fffaf0; }
            .bg-amber-100 { background-color: #fff5e6; }
            .bg-amber-500 { background-color: #f5a623; }
            .bg-amber-600 { background-color: #e8931a; }
            .bg-red-500 { background-color: #f87171; }
            .bg-red-600 { background-color: #ef4444; }
            .bg-green-500 { background-color: #34d399; }
            .bg-green-600 { background-color: #10b981; }
            .bg-blue-500 { background-color: #60a5fa; }
            .bg-blue-600 { background-color: #3b82f6; }
            .bg-purple-500 { background-color: #a78bfa; }
            .bg-pink-500 { background-color: #f472b6; }
            .bg-indigo-600 { background-color: #6366f1; }

            /* Gradientes refinados */
            .bg-gradient-primary { background: linear-gradient(145deg, #f5a623 0%, #e8931a 100%); }
            .bg-gradient-secondary { background: linear-gradient(145deg, #10b981 0%, #059669 100%); }
            .bg-gradient-purple { background: linear-gradient(145deg, #a78bfa 0%, #8b5cf6 100%); }
            .bg-gradient-pink { background: linear-gradient(145deg, #f472b6 0%, #ec4899 100%); }
            .bg-gradient-dark { background: linear-gradient(145deg, #2d2a24 0%, #1e1b17 100%); }

            /* ============================================
               CORES DE TEXTO - LEGÍVEIS
            ============================================ */
            .text-white { color: #ffffff; }
            .text-gray-900 { color: #2d2a24; }
            .text-gray-800 { color: #3d3a34; }
            .text-gray-700 { color: #5b574f; }
            .text-gray-600 { color: #76726a; }
            .text-gray-500 { color: #a8a29e; }
            .text-gray-400 { color: #d6d3d1; }
            .text-amber-500 { color: #f5a623; }
            .text-amber-600 { color: #e8931a; }
            .text-green-600 { color: #059669; }
            .text-red-600 { color: #dc2626; }
            .text-blue-600 { color: #2563eb; }

            /* ============================================
               BORDAS ARREDONDADAS
            ============================================ */
            .rounded-lg { border-radius: 0.75rem; }
            .rounded-xl { border-radius: 1rem; }
            .rounded-2xl { border-radius: 1.25rem; }
            .rounded-3xl { border-radius: 1.75rem; }
            .rounded-full { border-radius: 9999px; }

            /* Sombras elegantes */
            .shadow-sm { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02); }
            .shadow-md { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04); }
            .shadow-lg { box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06); }
            .shadow-xl { box-shadow: 0 20px 32px rgba(0, 0, 0, 0.08); }
            .shadow-2xl { box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.15); }

            /* ============================================
               ESPAÇAMENTO (mantido para compatibilidade)
            ============================================ */
            .p-1 { padding: 0.25rem; }
            .p-2 { padding: 0.5rem; }
            .p-3 { padding: 0.75rem; }
            .p-4 { padding: 1rem; }
            .p-5 { padding: 1.25rem; }
            .p-6 { padding: 1.5rem; }
            .p-8 { padding: 2rem; }

            .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
            .px-8 { padding-left: 2rem; padding-right: 2rem; }

            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
            .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }

            .mt-1 { margin-top: 0.25rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-3 { margin-top: 0.75rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-6 { margin-top: 1.5rem; }
            .mt-8 { margin-top: 2rem; }

            .mb-1 { margin-bottom: 0.25rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-8 { margin-bottom: 2rem; }

            .ml-1 { margin-left: 0.25rem; }
            .ml-2 { margin-left: 0.5rem; }
            .ml-3 { margin-left: 0.75rem; }
            .ml-4 { margin-left: 1rem; }

            .mr-1 { margin-right: 0.25rem; }
            .mr-2 { margin-right: 0.5rem; }
            .mr-3 { margin-right: 0.75rem; }
            .mr-4 { margin-right: 1rem; }

            /* ============================================
               FLEX E GRID
            ============================================ */
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .flex-row { flex-direction: row; }
            .flex-wrap { flex-wrap: wrap; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .items-end { align-items: flex-end; }
            .justify-center { justify-content: center; }
            .justify-between { justify-content: space-between; }
            .justify-around { justify-content: space-around; }
            .flex-1 { flex: 1; }
            .gap-1 { gap: 0.25rem; }
            .gap-2 { gap: 0.5rem; }
            .gap-3 { gap: 0.75rem; }
            .gap-4 { gap: 1rem; }
            .gap-6 { gap: 1.5rem; }

            .grid { display: grid; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }

            /* ============================================
               LARGURA E ALTURA
            ============================================ */
            .w-full { width: 100%; }
            .w-auto { width: auto; }
            .w-5 { width: 1.25rem; }
            .w-6 { width: 1.5rem; }
            .w-8 { width: 2rem; }
            .w-10 { width: 2.5rem; }
            .w-12 { width: 3rem; }
            .w-16 { width: 4rem; }
            .w-20 { width: 5rem; }
            .w-24 { width: 6rem; }
            .w-32 { width: 8rem; }
            .w-48 { width: 12rem; }
            .w-64 { width: 16rem; }
            .w-80 { width: 20rem; }
            .w-96 { width: 24rem; }

            .h-5 { height: 1.25rem; }
            .h-6 { height: 1.5rem; }
            .h-8 { height: 2rem; }
            .h-10 { height: 2.5rem; }
            .h-12 { height: 3rem; }
            .h-16 { height: 4rem; }
            .h-20 { height: 5rem; }
            .h-24 { height: 6rem; }
            .h-32 { height: 8rem; }
            .h-screen { height: 100vh; }
            .min-h-screen { min-height: 100vh; }

            /* ============================================
               BOTÕES, INPUTS E LINKS
            ============================================ */
            button {
              cursor: pointer;
              transition: all 0.2s ease;
              border: none;
              background: none;
            }
            button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            input, select, textarea {
              outline: none;
              transition: all 0.25s ease;
              border-radius: 0.75rem;
            }
            input:focus, select:focus, textarea:focus {
              border-color: #f5a623;
              box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
            }

            a {
              text-decoration: none;
              color: inherit;
              transition: color 0.2s ease;
            }

            /* ============================================
               POSICIONAMENTO
            ============================================ */
            .relative { position: relative; }
            .absolute { position: absolute; }
            .fixed { position: fixed; }
            .sticky { position: sticky; }
            .top-0 { top: 0; }
            .top-1\/2 { top: 50%; }
            .right-0 { right: 0; }
            .left-0 { left: 0; }
            .left-3 { left: 0.75rem; }
            .bottom-0 { bottom: 0; }
            .z-10 { z-index: 10; }
            .z-20 { z-index: 20; }
            .z-50 { z-index: 50; }

            /* ============================================
               TRANSFORM
            ============================================ */
            .transform { transform: translateX(0); }
            .-translate-y-1\/2 { transform: translateY(-50%); }

            /* ============================================
               OVERFLOW E DIVIDERS
            ============================================ */
            .overflow-hidden { overflow: hidden; }
            .overflow-x-auto { overflow-x: auto; }
            .overflow-y-auto { overflow-y: auto; }

            .border { border: 1px solid #f0ede8; }
            .border-2 { border-width: 2px; }
            .border-b { border-bottom: 1px solid #f0ede8; }
            .border-t { border-top: 1px solid #f0ede8; }
            .border-l { border-left: 1px solid #f0ede8; }
            .border-r { border-right: 1px solid #f0ede8; }
            .border-dashed { border-style: dashed; }
            .border-gray-100 { border-color: #faf7f2; }
            .border-gray-200 { border-color: #f0ede8; }
            .border-gray-300 { border-color: #e5e0d8; }
            .border-amber-300 { border-color: #fcd34d; }
            .border-amber-500 { border-color: #f5a623; }
            .border-green-500 { border-color: #10b981; }
            .border-blue-500 { border-color: #3b82f6; }

            .divide-y > * + * {
              border-top: 1px solid #f0ede8;
            }

            /* ============================================
               ANIMAÇÕES FLUIDAS
            ============================================ */
            .animate-spin {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            .animate-bounce {
              animation: bounce 1s infinite;
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
              50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
            }

            .animate-pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }

            .animate-float {
              animation: float 4s ease-in-out infinite;
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-6px); }
            }

            /* ============================================
               HOVER E TRANSIÇÕES
            ============================================ */
            .hover\:bg-amber-600:hover { background-color: #e8931a; }
            .hover\:bg-gray-50:hover { background-color: #fefdfa; }
            .hover\:bg-gray-100:hover { background-color: #faf8f5; }
            .hover\:shadow-lg:hover { box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08); }
            .hover\:shadow-xl:hover { box-shadow: 0 20px 32px rgba(0, 0, 0, 0.1); }
            .hover\:-translate-y-1:hover { transform: translateY(-0.125rem); }
            .hover\:scale-105:hover { transform: scale(1.02); }

            .transition { transition: all 0.25s cubic-bezier(0.23, 1, 0.32, 1); }
            .transition-all { transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1); }
            .transition-transform { transition: transform 0.25s ease; }

            /* ============================================
               OPACIDADE
            ============================================ */
            .opacity-0 { opacity: 0; }
            .opacity-50 { opacity: 0.5; }
            .opacity-75 { opacity: 0.75; }
            .opacity-80 { opacity: 0.8; }
            .opacity-100 { opacity: 1; }

            /* ============================================
               TIPOGRAFIA
            ============================================ */
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-base { font-size: 1rem; line-height: 1.5rem; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
            .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }

            .font-normal { font-weight: 400; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .font-extrabold { font-weight: 800; }

            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }

            /* ============================================
               RESPONSIVIDADE
            ============================================ */
            @media (min-width: 640px) {
              .sm\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }

            @media (min-width: 768px) {
              .md\:flex { display: flex; }
              .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .md\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
              .md\:w-auto { width: auto; }
            }

            @media (min-width: 1024px) {
              .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .lg\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
              .lg\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
              .lg\:grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
            }
          `
        }} />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}