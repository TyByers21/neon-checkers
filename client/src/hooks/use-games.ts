import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertGame } from "@shared/routes";

export function useGames() {
  return useQuery({
    queryKey: [api.games.list.path],
    queryFn: async () => {
      const res = await fetch(api.games.list.path);
      if (!res.ok) throw new Error("Failed to fetch games history");
      return api.games.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gameData: InsertGame) => {
      const validated = api.games.create.input.parse(gameData);
      const res = await fetch(api.games.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.games.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to save game record");
      }
      
      return api.games.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.games.list.path] });
    },
  });
}
