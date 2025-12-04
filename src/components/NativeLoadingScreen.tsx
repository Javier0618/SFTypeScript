interface NativeLoadingScreenProps {
  progress: number
  currentTask: string
}

export const NativeLoadingScreen = ({ progress, currentTask }: NativeLoadingScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black md:hidden">
      <div className="flex flex-col items-center gap-8 px-8 w-full max-w-xs">
        <img 
          src="https://i.ibb.co/tMTTfz8g/SFusion-Logo.png" 
          alt="Fusion" 
          className="h-20 w-auto object-contain"
        />
        
        <div className="w-full flex flex-col items-center gap-3">
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${progress}%`,
                backgroundColor: '#f97316'
              }}
            />
          </div>
          
          <p className="text-sm text-zinc-400">
            Cargando... {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  )
}
