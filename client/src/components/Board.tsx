import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BoardState, Move, Position, GameState } from "@/hooks/use-game-engine";

interface BoardProps {
  gameState: GameState;
  onSelect: (r: number, c: number) => void;
  onMove: (move: Move) => void;
}

export function Board({ gameState, onSelect, onMove }: BoardProps) {
  const { board, selectedPos, turn } = gameState;

  // Derive valid moves for the currently selected piece
  const movesForSelected = selectedPos 
    ? getValidMovesForPiece(board, selectedPos, turn === "player" ? "cyan" : "magenta")
    : [];

  function getValidMovesForPiece(board: BoardState, pos: Position, color: string) {
    // This duplicates logic slightly but is needed for highlighting. 
    // In a refactor, this would come from the hook directly.
    // For now, assume global valid moves check was done in hook, we just need targets here.
    // We'll re-implement basic check for visual feedback speed:
    const directions = [];
    const piece = board[pos.r][pos.c];
    if (!piece) return [];
    
    if (piece.color === "cyan" || piece.isKing) directions.push(-1);
    if (piece.color === "magenta" || piece.isKing) directions.push(1);

    const moves: Move[] = [];
    const jumps: Move[] = [];

    for (const dr of directions) {
      for (const dc of [-1, 1]) {
        const nr = pos.r + dr;
        const nc = pos.c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          if (!board[nr][nc]) {
            moves.push({ from: pos, to: { r: nr, c: nc } });
          } else if (board[nr][nc]?.color !== piece.color) {
            const jr = nr + dr;
            const jc = nc + dc;
            if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !board[jr][jc]) {
              jumps.push({ from: pos, to: { r: jr, c: jc }, jump: { r: nr, c: nc } });
            }
          }
        }
      }
    }
    return jumps.length > 0 ? jumps : moves;
  }

  const handleTileClick = (r: number, c: number) => {
    // If clicking a valid move target, execute move
    const move = movesForSelected.find(m => m.to.r === r && m.to.c === c);
    if (move) {
      onMove(move);
    } else {
      // Otherwise select the piece
      onSelect(r, c);
    }
  };

  return (
    <div className="relative p-2 rounded-xl bg-black/40 border-2 border-primary/20 shadow-[0_0_50px_rgba(0,243,255,0.15)] backdrop-blur-sm">
      <div 
        className="grid grid-cols-8 gap-0.5 md:gap-1 bg-primary/10 border border-primary/30"
        style={{ width: 'min(90vw, 600px)', height: 'min(90vw, 600px)' }}
      >
        {board.map((row, r) => (
          row.map((piece, c) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected = selectedPos?.r === r && selectedPos?.c === c;
            const isValidTarget = movesForSelected.some(m => m.to.r === r && m.to.c === c);
            
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleTileClick(r, c)}
                className={cn(
                  "relative w-full h-full flex items-center justify-center transition-colors duration-200",
                  isDark ? "bg-black/80" : "bg-primary/5",
                  isSelected && "bg-primary/20 shadow-[inset_0_0_20px_rgba(0,243,255,0.3)]",
                  isValidTarget && "cursor-pointer bg-green-500/20 hover:bg-green-500/30"
                )}
              >
                {/* Grid Lines Overlay */}
                <div className="absolute inset-0 border border-primary/5 pointer-events-none" />

                {/* Move Indicator */}
                {isValidTarget && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]" 
                  />
                )}

                {/* Piece */}
                <AnimatePresence mode="popLayout">
                  {piece && (
                    <motion.div
                      layoutId={`piece-${r}-${c}`} // Ideally needs stable ID, but coords work for simple moves
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={cn(
                        "w-[70%] h-[70%] rounded-full shadow-lg relative",
                        "border-2",
                        piece.color === "cyan" 
                          ? "bg-cyan-900/50 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]" 
                          : "bg-fuchsia-900/50 border-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.5)]",
                        piece.isKing && "ring-2 ring-offset-2 ring-offset-black ring-yellow-400"
                      )}
                    >
                      {/* Inner Ring Glow */}
                      <div className={cn(
                        "absolute inset-2 rounded-full border opacity-50",
                        piece.color === "cyan" ? "border-cyan-200" : "border-fuchsia-200"
                      )} />
                      
                      {/* King Crown */}
                      {piece.isKing && (
                        <div className="absolute inset-0 flex items-center justify-center text-yellow-400">
                          <CrownIcon className="w-1/2 h-1/2 drop-shadow-md" />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}
