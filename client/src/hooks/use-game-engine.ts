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

function getValidMoves(board: BoardState, player: PieceColor, fromPos?: Position): Move[] {
  const moves: Move[] = [];
  const jumps: Move[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (fromPos && (fromPos.r !== r || fromPos.c !== c)) continue;
      
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
            // Simple Move - Only allowed if not currently in a multi-jump sequence
            if (!board[nr][nc] && !fromPos) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            } 
            // Jump
            else if (board[nr][nc] && board[nr][nc]?.color !== player) {
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
  return jumps.length > 0 ? jumps : moves;
}

function applyMove(board: BoardState, move: Move): { board: BoardState, promoted: boolean } {
  const newBoard = board.map(row => row.map(p => p ? { ...p } : null));
  const piece = newBoard[move.from.r][move.from.c]!;
  let promoted = false;
  
  newBoard[move.to.r][move.to.c] = piece;
  newBoard[move.from.r][move.from.c] = null;

  if (move.jump) {
    newBoard[move.jump.r][move.jump.c] = null;
  }

  // King Promotion
  if (!piece.isKing) {
    if (piece.color === "cyan" && move.to.r === 0) {
      piece.isKing = true;
      promoted = true;
    }
    if (piece.color === "magenta" && move.to.r === BOARD_SIZE - 1) {
      piece.isKing = true;
      promoted = true;
    }
  }

  return { board: newBoard, promoted };
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
      let { board: nextBoard, promoted } = applyMove(board, move);
      
      // Handle multi-jump AI logic
      if (move.jump && !promoted) {
        let currentBoard = nextBoard;
        let jumpPossible = true;
        while (jumpPossible) {
          const nextJumps = getValidMoves(currentBoard, playerColor, move.to);
          if (nextJumps.length > 0) {
            const res = applyMove(currentBoard, nextJumps[0]);
            currentBoard = res.board;
            if (res.promoted) jumpPossible = false;
          } else {
            jumpPossible = false;
          }
        }
        nextBoard = currentBoard;
      }

      const evalScore = minimax(nextBoard, depth - 1, false, alpha, beta).score;
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
      let { board: nextBoard, promoted } = applyMove(board, move);
      
      // Handle multi-jump AI logic
      if (move.jump && !promoted) {
        let currentBoard = nextBoard;
        let jumpPossible = true;
        while (jumpPossible) {
          const nextJumps = getValidMoves(currentBoard, playerColor, move.to);
          if (nextJumps.length > 0) {
            const res = applyMove(currentBoard, nextJumps[0]);
            currentBoard = res.board;
            if (res.promoted) jumpPossible = false;
          } else {
            jumpPossible = false;
          }
        }
        nextBoard = currentBoard;
      }

      const evalScore = minimax(nextBoard, depth - 1, true, alpha, beta).score;
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

  const [multiJumpPos, setMultiJumpPos] = useState<Position | null>(null);

  const selectPiece = (r: number, c: number) => {
    if (gameState.turn !== "player" || gameState.winner) return;

    // If in multi-jump, can only select the jump piece
    if (multiJumpPos && (multiJumpPos.r !== r || multiJumpPos.c !== c)) return;

    const piece = gameState.board[r][c];
    if (!piece || piece.color !== "cyan") {
      if (!multiJumpPos) setGameState(prev => ({ ...prev, selectedPos: null }));
      return;
    }

    const allMoves = getValidMoves(gameState.board, "cyan", multiJumpPos || undefined);
    const movesForPiece = allMoves.filter(m => m.from.r === r && m.from.c === c);

    if (movesForPiece.length > 0) {
      setGameState(prev => ({
        ...prev,
        selectedPos: { r, c },
      }));
    }
  };

  const makeMove = useCallback((move: Move) => {
    setGameState(prev => {
      const { board: newBoard, promoted } = applyMove(prev.board, move);
      const captured = !!move.jump;
      
      const newCyanCaptures = prev.cyanCaptures + (prev.turn === "player" && captured ? 1 : 0);
      const newMagentaCaptures = prev.magentaCaptures + (prev.turn === "ai" && captured ? 1 : 0);

      // Check for multi-jump
      if (captured && !promoted) {
        const nextJumps = getValidMoves(newBoard, prev.turn === "player" ? "cyan" : "magenta", move.to);
        if (nextJumps.length > 0) {
          setMultiJumpPos(move.to);
          return {
            ...prev,
            board: newBoard,
            cyanCaptures: newCyanCaptures,
            magentaCaptures: newMagentaCaptures,
            selectedPos: prev.turn === "player" ? move.to : null,
            movesCount: prev.movesCount + 1,
          };
        }
      }

      setMultiJumpPos(null);
      const nextTurn = prev.turn === "player" ? "ai" : "player";
      const nextMoves = getValidMoves(newBoard, nextTurn === "player" ? "cyan" : "magenta");
      let winner = prev.winner;
      
      if (nextMoves.length === 0) {
        winner = prev.turn;
      }

      return {
        board: newBoard,
        turn: nextTurn,
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
