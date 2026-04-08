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
            /* Reset e base */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #fff5eb 0%, #ffe4e4 100%);
              min-height: 100vh;
            }

            /* Scrollbar personalizada */
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: #f59e0b;
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #d97706;
            }

            /* Container */
            .container {
              max-width: 1280px;
              margin: 0 auto;
              padding: 0 1.5rem;
            }

            /* Cards com efeito glassmorphism */
            .card {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border-radius: 1.5rem;
              box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .card:hover {
              transform: translateY(-5px);
              box-shadow: 0 25px 40px -12px rgba(0, 0, 0, 0.2);
            }

            /* Botões com efeito */
            .btn-primary {
              background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
            }
            .btn-primary:hover {
              transform: scale(1.02);
              box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
            }
            .btn-primary:active {
              transform: scale(0.98);
            }

            .btn-secondary {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            }
            .btn-secondary:hover {
              transform: scale(1.02);
              box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
            }

            /* Badges */
            .badge-online {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 0.25rem 0.75rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 600;
              display: inline-flex;
              align-items: center;
              gap: 0.25rem;
            }
            .badge-offline {
              background: #e5e7eb;
              color: #6b7280;
              padding: 0.25rem 0.75rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 600;
            }

            /* Cores de fundo */
            .bg-white { background-color: #ffffff; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-amber-50 { background-color: #fffbeb; }
            .bg-amber-100 { background-color: #fef3c7; }
            .bg-amber-500 { background-color: #f59e0b; }
            .bg-amber-600 { background-color: #d97706; }
            .bg-red-500 { background-color: #ef4444; }
            .bg-red-600 { background-color: #dc2626; }
            .bg-green-500 { background-color: #10b981; }
            .bg-green-600 { background-color: #059669; }
            .bg-blue-500 { background-color: #3b82f6; }
            .bg-blue-600 { background-color: #2563eb; }
            .bg-purple-500 { background-color: #8b5cf6; }
            .bg-pink-500 { background-color: #ec4899; }
            .bg-indigo-600 { background-color: #4f46e5; }
            .bg-gray-900 { background-color: #111827; }
            .bg-gray-800 { background-color: #1f2937; }

            /* Gradientes */
            .bg-gradient-primary {
              background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
            }
            .bg-gradient-secondary {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }
            .bg-gradient-purple {
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            }
            .bg-gradient-pink {
              background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
            }
            .bg-gradient-dark {
              background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
            }

            /* Cores de texto */
            .text-white { color: #ffffff; }
            .text-gray-900 { color: #111827; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-400 { color: #9ca3af; }
            .text-amber-500 { color: #f59e0b; }
            .text-amber-600 { color: #d97706; }
            .text-green-600 { color: #059669; }
            .text-red-600 { color: #dc2626; }
            .text-blue-600 { color: #2563eb; }

            /* Bordas */
            .rounded-lg { border-radius: 0.5rem; }
            .rounded-xl { border-radius: 0.75rem; }
            .rounded-2xl { border-radius: 1rem; }
            .rounded-3xl { border-radius: 1.5rem; }
            .rounded-full { border-radius: 9999px; }

            /* Sombras */
            .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
            .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
            .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
            .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }

            /* Espaçamento */
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

            /* Flex */
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

            /* Grid */
            .grid { display: grid; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }

            /* Largura */
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

            /* Altura */
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

            /* Botões */
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

            /* Inputs */
            input, select, textarea {
              outline: none;
              transition: all 0.2s ease;
            }
            input:focus, select:focus, textarea:focus {
              border-color: #f59e0b;
              box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
            }

            /* Links */
            a {
              text-decoration: none;
              color: inherit;
            }

            /* Posicionamento */
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

            /* Transform */
            .transform { transform: translateX(0); }
            .-translate-y-1\/2 { transform: translateY(-50%); }

            /* Overflow */
            .overflow-hidden { overflow: hidden; }
            .overflow-x-auto { overflow-x: auto; }
            .overflow-y-auto { overflow-y: auto; }

            /* Dividers */
            .border { border: 1px solid #e5e7eb; }
            .border-2 { border-width: 2px; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .border-l { border-left: 1px solid #e5e7eb; }
            .border-r { border-right: 1px solid #e5e7eb; }
            .border-dashed { border-style: dashed; }
            .border-gray-100 { border-color: #f3f4f6; }
            .border-gray-200 { border-color: #e5e7eb; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-amber-300 { border-color: #fcd34d; }
            .border-amber-500 { border-color: #f59e0b; }
            .border-green-500 { border-color: #10b981; }
            .border-blue-500 { border-color: #3b82f6; }

            /* Dividers personalizados */
            .divide-y > * + * {
              border-top: 1px solid #e5e7eb;
            }

            /* Animações */
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

            /* Hover */
            .hover\\:bg-amber-600:hover { background-color: #d97706; }
            .hover\\:bg-gray-50:hover { background-color: #f9fafb; }
            .hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
            .hover\\:shadow-lg:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
            .hover\\:shadow-xl:hover { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
            .hover\\:-translate-y-1:hover { transform: translateY(-0.25rem); }
            .hover\\:scale-105:hover { transform: scale(1.05); }

            /* Transition */
            .transition { transition: all 0.3s ease; }
            .transition-all { transition: all 0.3s ease; }
            .transition-transform { transition: transform 0.3s ease; }

            /* Opacity */
            .opacity-0 { opacity: 0; }
            .opacity-50 { opacity: 0.5; }
            .opacity-75 { opacity: 0.75; }
            .opacity-80 { opacity: 0.8; }
            .opacity-100 { opacity: 1; }

            /* Text sizes */
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-base { font-size: 1rem; line-height: 1.5rem; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
            .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }

            /* Font weights */
            .font-normal { font-weight: 400; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .font-extrabold { font-weight: 800; }

            /* Text align */
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }

            /* Responsivo */
            @media (min-width: 640px) {
              .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }

            @media (min-width: 768px) {
              .md\\:flex { display: flex; }
              .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
              .md\\:w-auto { width: auto; }
            }

            @media (min-width: 1024px) {
              .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
              .lg\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
              .lg\\:grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}