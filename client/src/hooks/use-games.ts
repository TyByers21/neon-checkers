import { api, type InsertGame } from "@shared/routes";

const STORAGE_KEY = "cyber_checkers_history";

export function useGames() {
  const gamesJson = localStorage.getItem(STORAGE_KEY);
  const games = gamesJson ? JSON.parse(gamesJson) : [];
  
  return {
    data: games,
    isLoading: false,
    isError: false,
    refetch: () => {}
  };
}

export function useCreateGame() {
  return {
    mutate: (gameData: InsertGame) => {
      const validated = api.games.create.input.parse(gameData);
      const gamesJson = localStorage.getItem(STORAGE_KEY);
      const games = gamesJson ? JSON.parse(gamesJson) : [];
      
      const newGame = {
        ...validated,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newGame, ...games]));
    },
    isPending: false
  };
}
