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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* HUD Header */}
      <header className="fixed top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 border-2 border-primary bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
              P1
            </div>
            <div>
              <h2 className="text-primary text-lg leading-none">{playerName}</h2>
              <span className="text-xs text-muted-foreground tracking-widest">OPERATIVE</span>
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: gameState.cyanCaptures }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_5px_#ff00ff]" />
            ))}
          </div>
        </div>

        <div className="text-center hidden md:block">
          <div className="text-4xl font-black neon-text tracking-widest font-display">
            {gameState.movesCount.toString().padStart(3, '0')}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-[0.5em]">Moves</div>
        </div>

        <div className="text-right pointer-events-auto">
          <div className="flex flex-col items-end gap-2 mb-2">
            <CyberButton 
              onClick={handleExit} 
              variant="secondary" 
              size="sm"
              className="mb-2 opacity-50 hover:opacity-100 transition-opacity"
            >
              <LogOut className="w-3 h-3 mr-2" /> QUIT MISSION
            </CyberButton>
            <div className="flex items-center justify-end gap-4">
              <div>
                <h2 className="text-secondary text-lg leading-none">CORTEX</h2>
                <span className="text-xs text-muted-foreground tracking-widest uppercase">{difficulty} AI</span>
              </div>
              <div className="h-10 w-10 border-2 border-secondary bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-bold">
                AI
              </div>
            </div>
          </div>
          <div className="flex gap-1 justify-end">
            {Array.from({ length: gameState.magentaCaptures }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_#00f3ff]" />
            ))}
          </div>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="relative z-10 w-full max-w-6xl px-4 mt-8 md:mt-0 flex-1 flex flex-col justify-center">
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
            Your Turn
          </div>
          <div className={`px-6 py-2 rounded-full border transition-all duration-300 font-mono text-sm uppercase tracking-widest ${
            gameState.turn === "ai" 
              ? "bg-secondary/20 border-secondary text-secondary shadow-[0_0_20px_rgba(255,0,255,0.4)]" 
              : "border-transparent text-muted-foreground opacity-50"
          }`}>
            AI Thinking...
          </div>
        </div>
      </main>

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
