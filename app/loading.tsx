export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Ícone */}
        <div className="relative">
          <img 
            src="/icons/icon-192x192.png" 
            alt="SEMTRANSP" 
            className="w-24 h-24 animate-pulse"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        </div>
        
        {/* Texto */}
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-gray-700">Prefeitura Municipal de Italva</p>
          <p className="text-xs text-gray-600">Secretaria Municipal de Transportes</p>
        </div>
      </div>
    </div>
  )
}

