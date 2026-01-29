import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CyberButton } from "@/components/CyberButton";
import { Gamepad2, Trophy, Cpu } from "lucide-react";

export default function Home() {
  const [_, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const handleStart = () => {
    if (!name.trim()) return;
    localStorage.setItem("playerName", name);
    localStorage.setItem("difficulty", difficulty);
    setLocation("/game");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="glass-panel max-w-lg w-full p-8 md:p-12 relative z-10 border-t border-primary/50"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
            className="inline-block mb-4 p-4 rounded-full bg-primary/10 border border-primary/50 shadow-[0_0_30px_rgba(0,243,255,0.3)]"
          >
            <Gamepad2 className="w-12 h-12 text-primary" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black neon-text mb-2 tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis px-2">
            NEO<span className="text-white">CHECKERS</span>
          </h1>
          <p className="text-muted-foreground font-mono uppercase tracking-widest text-sm">
            Tactical Grid Warfare System
          </p>
        </div>

        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary uppercase tracking-wider">Operative ID</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ENTER CODENAME"
              className="w-full bg-black/50 border border-border rounded-none px-4 py-4 text-lg font-mono text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-primary uppercase tracking-wider block">AI Core Level</label>
            <div className="grid grid-cols-3 gap-3">
              {(["easy", "medium", "hard"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`
                    py-3 px-2 border transition-all uppercase text-xs font-bold tracking-widest
                    ${difficulty === level 
                      ? "border-secondary bg-secondary/10 text-secondary shadow-[0_0_15px_rgba(255,0,255,0.3)]" 
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"}
                  `}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <CyberButton 
              onClick={handleStart} 
              disabled={!name}
              className="w-full h-14 text-lg"
            >
              INITIALIZE SYSTEM
            </CyberButton>
            
            <CyberButton 
              variant="secondary"
              onClick={() => setLocation("/history")} 
              className="w-full"
            >
              <span className="flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4" /> ACCESS ARCHIVES
              </span>
            </CyberButton>
          </div>
        </div>
      </motion.div>
      
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 border-l-2 border-t-2 border-primary/20 rounded-tl-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-32 h-32 border-r-2 border-b-2 border-secondary/20 rounded-br-3xl pointer-events-none" />
    </div>
  );
}
