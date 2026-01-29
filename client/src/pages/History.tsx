import { useGames } from "@/hooks/use-games";
import { CyberButton } from "@/components/CyberButton";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Trophy, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function History() {
  const { data: games } = useGames();

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <Link href="/" className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono uppercase tracking-widest">Back to Hub</span>
        </Link>
        <h1 className="text-3xl font-bold neon-text">MISSION LOGS</h1>
      </header>

      {games?.length === 0 ? (
        <div className="text-center text-muted-foreground p-12 glass-panel">
          <p>NO MISSIONS ON RECORD.</p>
          <Link href="/game" className="mt-4 inline-block text-primary hover:underline">
            INITIATE FIRST MISSION
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {games?.map((game: any, i: number) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-primary/60 transition-colors"
            >
              <div className="flex items-center gap-6 mb-4 md:mb-0">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-[0_0_15px_inset]
                  ${game.winner === 'player' 
                    ? 'border-primary text-primary bg-primary/10 shadow-primary/20' 
                    : 'border-destructive text-destructive bg-destructive/10 shadow-destructive/20'}
                `}>
                  {game.winner === 'player' ? <Trophy className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-white tracking-wide">{game.playerName}</span>
                    <span className="text-xs px-2 py-0.5 rounded border border-muted-foreground/30 text-muted-foreground uppercase">
                      VS {game.difficulty} AI
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground font-mono mt-1">
                    {format(new Date(game.createdAt || new Date()), "yyyy-MM-dd HH:mm")} :: {game.moves} MOVES
                  </div>
                </div>
              </div>

              <div className={`
                text-2xl font-black uppercase tracking-widest
                ${game.winner === 'player' ? 'neon-text' : 'text-muted-foreground opacity-50'}
              `}>
                {game.winner === 'player' ? 'VICTORY' : 'DEFEAT'}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
