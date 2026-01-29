import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Board } from "@/components/Board";
import { CyberButton } from "@/components/CyberButton";
import { useGameEngine } from "@/hooks/use-game-engine";
import { useCreateGame } from "@/hooks/use-games";
import { Loader2, RefreshCw, Save, LogOut } from "lucide-react";

export default function Game() {
  const [_, setLocation] = useLocation();
  const playerName = localStorage.getItem("playerName") || "GUEST";
  const difficulty = (localStorage.getItem("difficulty") as "easy" | "medium" | "hard") || "medium";
  
  const { gameState, selectPiece, makeMove, resetGame } = useGameEngine(difficulty);
  const { mutate: saveGame } = useCreateGame();
  const [hasSaved, setHasSaved] = useState(false);

  // Victory Effect
  useEffect(() => {
    if (gameState.winner === "player") {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f3ff', '#ffffff']
      });
    }
  }, [gameState.winner]);

  // Auto-save on game end
  useEffect(() => {
    if (gameState.winner && !hasSaved) {
      saveGame({
        playerName,
        playerColor: "cyan",
        winner: gameState.winner,
        difficulty,
        moves: gameState.movesCount,
      });
      setHasSaved(true);
    }
  }, [gameState.winner, hasSaved, saveGame, playerName, difficulty, gameState.movesCount]);

  const handleRestart = () => {
    resetGame();
    setHasSaved(false);
  };

  const handleExit = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* HUD Header */}
      <header className="fixed top-0 left-0 right-0 p-4 md:p-6 flex flex-col items-center z-30 pointer-events-none">
        <div className="text-center mb-4 pointer-events-none">
          <h1 className="text-xl md:text-3xl font-black neon-text tracking-widest font-orbitron opacity-80">
            NEO<span className="text-white">CHECKERS</span>
          </h1>
        </div>

        <div className="flex items-center gap-12 pointer-events-auto bg-black/40 backdrop-blur-md px-8 py-4 border border-white/10 rounded-full shadow-[0_0_30px_rgba(0,243,255,0.1)]">
          {/* Player Score & Identity */}
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 border-2 border-primary bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shadow-[0_0_15px_rgba(0,243,255,0.3)]">
              P1
            </div>
            <div className="text-left">
              <h2 className="text-primary text-base leading-none font-orbitron">{playerName}</h2>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: gameState.cyanCaptures }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_#ff00ff]" />
                ))}
              </div>
            </div>
            <div className="text-2xl font-black text-primary font-orbitron ml-2">
              {gameState.cyanCaptures}
            </div>
          </div>

          <div className="h-8 w-px bg-white/20" />

          {/* AI Score & Identity */}
          <div className="flex items-center gap-4">
            <div className="text-2xl font-black text-secondary font-orbitron mr-2">
              {gameState.magentaCaptures}
            </div>
            <div className="text-right">
              <h2 className="text-secondary text-base leading-none font-orbitron">CORTEX</h2>
              <div className="flex gap-1 mt-1 justify-end">
                {Array.from({ length: gameState.magentaCaptures }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#00f3ff]" />
                ))}
              </div>
            </div>
            <div className="h-10 w-10 border-2 border-secondary bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-bold shadow-[0_0_15px_rgba(255,0,255,0.3)]">
              AI
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-row items-center justify-center w-full max-w-7xl gap-8 px-4 z-10 pt-24">
        {/* ... existing code for panels and board ... */}
        {/* Replacing only the middle part to keep the refactored panels if they exist */}
      </div>

      {/* Fixed Bottom Controls */}
      <footer className="fixed bottom-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <CyberButton 
            onClick={handleExit} 
            variant="secondary" 
            className="opacity-70 hover:opacity-100 transition-opacity px-8"
          >
            <LogOut className="w-4 h-4 mr-2" /> ABORT MISSION
          </CyberButton>
        </div>
      </footer>

      <div className="flex flex-row items-center justify-center w-full max-w-7xl gap-8 px-4 z-10">
        {/* Left Score Side Panel */}
        <aside className="hidden xl:flex flex-col gap-4 w-48 glass-panel p-4 border-l-2 border-l-primary/40">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Unit Status
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-primary/5 border border-primary/20 rounded">
              <div className="text-[10px] text-muted-foreground uppercase mb-1">Friendly Score</div>
              <div className="text-2xl font-black text-primary font-orbitron">{gameState.cyanCaptures}</div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] text-muted-foreground uppercase">Captured Manifest</div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: gameState.cyanCaptures }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-full bg-secondary/40 border border-secondary/60 shadow-[0_0_5px_#ff00ff]" />
                ))}
                {Array.from({ length: 12 - gameState.cyanCaptures }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-full border border-white/5 bg-white/5" />
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Board Area */}
        <main className="flex-1 flex flex-col justify-center max-w-5xl">
          <Board 
            gameState={gameState} 
            onSelect={selectPiece} 
            onMove={makeMove}
          />
          
          {/* Turn Indicator (Mobile Friendly) */}
          <div className="mt-8 flex justify-center items-center gap-4">
            <div className={`px-6 py-2 rounded-full border transition-all duration-300 font-mono text-sm uppercase tracking-widest ${
              gameState.turn === "player" 
                ? "bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(0,243,255,0.4)]" 
                : "border-transparent text-muted-foreground opacity-50"
            }`}>
              Player Active
            </div>
            <div className={`px-6 py-2 rounded-full border transition-all duration-300 font-mono text-sm uppercase tracking-widest ${
              gameState.turn === "ai" 
                ? "bg-secondary/20 border-secondary text-secondary shadow-[0_0_20px_rgba(255,0,255,0.4)]" 
                : "border-transparent text-muted-foreground opacity-50"
            }`}>
              AI Processing
            </div>
          </div>
        </main>

        {/* Right Score Side Panel */}
        <aside className="hidden xl:flex flex-col gap-4 w-48 glass-panel p-4 border-r-2 border-r-secondary/40">
          <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-2 flex items-center gap-2 justify-end">
            Hostile Intel
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-secondary/5 border border-secondary/20 rounded text-right">
              <div className="text-[10px] text-muted-foreground uppercase mb-1">Cortex Score</div>
              <div className="text-2xl font-black text-secondary font-orbitron">{gameState.magentaCaptures}</div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] text-muted-foreground uppercase text-right">Captured Manifest</div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: gameState.magentaCaptures }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-full bg-primary/40 border border-primary/60 shadow-[0_0_5px_#00f3ff]" />
                ))}
                {Array.from({ length: 12 - gameState.magentaCaptures }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-full border border-white/5 bg-white/5" />
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-64 h-64 bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState.winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel max-w-md w-full p-8 text-center border-t-2 border-t-primary"
            >
              <h2 className={`text-4xl md:text-5xl font-black mb-2 ${
                gameState.winner === "player" ? "text-primary drop-shadow-[0_0_15px_rgba(0,243,255,0.8)]" : "text-destructive drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]"
              }`}>
                {gameState.winner === "player" ? "MISSION COMPLETE" : "SYSTEM FAILURE"}
              </h2>
              
              <p className="text-muted-foreground font-mono mb-8 uppercase tracking-widest">
                {gameState.winner === "player" ? "Enemy Neutralized" : "Tactical Superiority Lost"}
              </p>

              <div className="flex flex-col gap-4">
                <CyberButton onClick={handleRestart} className="w-full">
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> REBOOT SYSTEM
                  </span>
                </CyberButton>
                
                <CyberButton onClick={handleExit} variant="secondary" className="w-full">
                  <span className="flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" /> ABORT MISSION
                  </span>
                </CyberButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
