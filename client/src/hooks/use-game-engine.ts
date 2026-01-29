import { useState, useEffect, useCallback } from "react";

// --- Types ---
export type PieceColor = "cyan" | "magenta";
export type PlayerType = "player" | "ai";

export interface Piece {
  color: PieceColor;
  isKing: boolean;
}

export interface Position {
  r: number;
  c: number;
}

// 8x8 Board. null = empty
export type BoardState = (Piece | null)[][];

export interface GameState {
  board: BoardState;
  turn: PlayerType;
  winner: PlayerType | "draw" | null;
  selectedPos: Position | null;
  validMoves: Move[];
  cyanCaptures: number;
  magentaCaptures: number;
  movesCount: number;
}

export interface Move {
  from: Position;
  to: Position;
  jump?: Position; // Position of captured piece
}

// --- Utils ---
const BOARD_SIZE = 8;

const initialBoard = (): BoardState => {
  const board: BoardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) board[r][c] = { color: "magenta", isKing: false }; // AI
        if (r > 4) board[r][c] = { color: "cyan", isKing: false };    // Player
      }
    }
  }
  return board;
};

// Check bounds
const isValidPos = (r: number, c: number) => r >= 0 && c >= 0 && r < BOARD_SIZE && c < BOARD_SIZE;

// --- AI Logic (MiniMax) ---
function evaluateBoard(board: BoardState): number {
  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = p.isKing ? 5 : 1;
      // AI wants to maximize Magenta score
      score += p.color === "magenta" ? val : -val;
    }
  }
  return score;
}

function getValidMoves(board: BoardState, player: PieceColor): Move[] {
  const moves: Move[] = [];
  const jumps: Move[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p || p.color !== player) continue;

      const directions = [];
      if (p.color === "cyan" || p.isKing) directions.push(-1); // Up
      if (p.color === "magenta" || p.isKing) directions.push(1); // Down

      for (const dr of directions) {
        for (const dc of [-1, 1]) {
          const nr = r + dr;
          const nc = c + dc;

          if (isValidPos(nr, nc)) {
            // Simple Move
            if (!board[nr][nc]) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            } 
            // Jump
            else if (board[nr][nc]?.color !== player) {
              const jr = nr + dr;
              const jc = nc + dc;
              if (isValidPos(jr, jc) && !board[jr][jc]) {
                jumps.push({ from: { r, c }, to: { r: jr, c: jc }, jump: { r: nr, c: nc } });
              }
            }
          }
        }
      }
    }
  }
  return jumps.length > 0 ? jumps : moves; // Forced capture rule
}

function applyMove(board: BoardState, move: Move): BoardState {
  const newBoard = board.map(row => row.map(p => p ? { ...p } : null));
  const piece = newBoard[move.from.r][move.from.c]!;
  
  newBoard[move.to.r][move.to.c] = piece;
  newBoard[move.from.r][move.from.c] = null;

  if (move.jump) {
    newBoard[move.jump.r][move.jump.c] = null;
  }

  // King Promotion
  if (piece.color === "cyan" && move.to.r === 0) piece.isKing = true;
  if (piece.color === "magenta" && move.to.r === BOARD_SIZE - 1) piece.isKing = true;

  return newBoard;
}

function minimax(board: BoardState, depth: number, maximizing: boolean, alpha: number, beta: number): { score: number, move?: Move } {
  if (depth === 0) return { score: evaluateBoard(board) };

  const playerColor = maximizing ? "magenta" : "cyan";
  const moves = getValidMoves(board, playerColor);

  if (moves.length === 0) {
    // No moves = loss for current player
    return { score: maximizing ? -1000 : 1000 };
  }

  let bestMove: Move | undefined = moves[0];

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move);
      const evalScore = minimax(newBoard, depth - 1, false, alpha, beta).score;
      if (evalScore > maxEval) {
        maxEval = evalScore;
        bestMove = move;
      }
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move);
      const evalScore = minimax(newBoard, depth - 1, true, alpha, beta).score;
      if (evalScore < minEval) {
        minEval = evalScore;
        bestMove = move;
      }
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

// --- Hook ---
export function useGameEngine(difficulty: "easy" | "medium" | "hard") {
  const [gameState, setGameState] = useState<GameState>({
    board: initialBoard(),
    turn: "player",
    winner: null,
    selectedPos: null,
    validMoves: [],
    cyanCaptures: 0,
    magentaCaptures: 0,
    movesCount: 0,
  });

  // Calculate valid moves for current turn immediately
  useEffect(() => {
    if (gameState.winner) return;
    
    const currentColor = gameState.turn === "player" ? "cyan" : "magenta";
    // Only calculate if we haven't already selected something (unless it's start of turn)
    // Actually, simple approach: always know all valid moves for the board
  }, [gameState.turn, gameState.board]);


  const selectPiece = (r: number, c: number) => {
    if (gameState.turn !== "player" || gameState.winner) return;

    const piece = gameState.board[r][c];
    if (!piece || piece.color !== "cyan") {
      setGameState(prev => ({ ...prev, selectedPos: null }));
      return;
    }

    // Get ALL valid moves for player to check forced captures
    const allMoves = getValidMoves(gameState.board, "cyan");
    // Filter for just this piece
    const movesForPiece = allMoves.filter(m => m.from.r === r && m.from.c === c);

    // If forced captures exist globally, and this piece isn't one of them, disallow selection if rule implies strictness
    // For simplicity here: only show moves if this piece CAN move legally
    if (movesForPiece.length > 0) {
      setGameState(prev => ({
        ...prev,
        selectedPos: { r, c },
      }));
    }
  };

  const makeMove = useCallback((move: Move) => {
    setGameState(prev => {
      const newBoard = applyMove(prev.board, move);
      const captured = !!move.jump;
      
      // Update scores
      const newCyanCaptures = prev.cyanCaptures + (prev.turn === "player" && captured ? 1 : 0);
      const newMagentaCaptures = prev.magentaCaptures + (prev.turn === "ai" && captured ? 1 : 0);

      // Check win condition
      const nextPlayer = prev.turn === "player" ? "magenta" : "cyan";
      const nextMoves = getValidMoves(newBoard, nextPlayer);
      let winner = prev.winner;
      
      if (nextMoves.length === 0) {
        winner = prev.turn; // Current player wins if opponent has no moves
      }

      return {
        board: newBoard,
        turn: prev.turn === "player" ? "ai" : "player",
        winner,
        selectedPos: null,
        validMoves: [],
        cyanCaptures: newCyanCaptures,
        magentaCaptures: newMagentaCaptures,
        movesCount: prev.movesCount + 1,
      };
    });
  }, []);

  // AI Turn
  useEffect(() => {
    if (gameState.turn === "ai" && !gameState.winner) {
      const depth = difficulty === "easy" ? 1 : difficulty === "medium" ? 3 : 5;
      
      // Small delay for realism
      const timer = setTimeout(() => {
        const { move } = minimax(gameState.board, depth, true, -Infinity, Infinity);
        if (move) {
          makeMove(move);
        } else {
          // AI has no moves, player wins
          setGameState(prev => ({ ...prev, winner: "player" }));
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.winner, gameState.board, difficulty, makeMove]);

  return {
    gameState,
    selectPiece,
    makeMove,
    resetGame: () => setGameState({
      board: initialBoard(),
      turn: "player",
      winner: null,
      selectedPos: null,
      validMoves: [],
      cyanCaptures: 0,
      magentaCaptures: 0,
      movesCount: 0,
    })
  };
}
