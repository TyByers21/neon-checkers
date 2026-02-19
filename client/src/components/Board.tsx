import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Text, Float, Trail } from "@react-three/drei";
import * as THREE from "three";
import { BoardState, Move, Position, GameState } from "@/hooks/use-game-engine";

interface BoardProps {
  gameState: GameState;
  onSelect: (r: number, c: number) => void;
  onMove: (move: Move) => void;
}

const TILE_SIZE = 1;
const BOARD_SIZE = 8;
const PIECE_RADIUS = 0.35;
const PIECE_HEIGHT = 0.15;

function Piece({ 
  r, 
  c, 
  color, 
  isKing, 
  isSelected,
  onClick 
}: { 
  r: number; 
  c: number; 
  color: "cyan" | "magenta"; 
  isKing: boolean; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Initialize currentPos to the actual starting coordinate to prevent teleportation
  const initialPos = useMemo(() => new THREE.Vector3(
    (c - (BOARD_SIZE - 1) / 2) * TILE_SIZE,
    PIECE_HEIGHT / 2,
    (r - (BOARD_SIZE - 1) / 2) * TILE_SIZE
  ), []); // Only initialize once on mount
  
  const currentPos = useRef(initialPos.clone());
  const velocity = useRef(new THREE.Vector3());
  const [isJumpAnimating, setIsJumpAnimating] = useState(false);
  const lastRC = useRef({ r, c });
  
  const targetPos = useMemo(() => [
    (c - (BOARD_SIZE - 1) / 2) * TILE_SIZE,
    PIECE_HEIGHT / 2,
    (r - (BOARD_SIZE - 1) / 2) * TILE_SIZE
  ], [r, c]);

  // Detect move to trigger jump animation
  useEffect(() => {
    if (lastRC.current.r !== r || lastRC.current.c !== c) {
      setIsJumpAnimating(true);
      setTimeout(() => setIsJumpAnimating(false), 500); // 500ms jump duration
      lastRC.current = { r, c };
    }
  }, [r, c]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smooth movement using spring-like physics
      const targetVec = new THREE.Vector3(...targetPos);
      const force = new THREE.Vector3().subVectors(targetVec, currentPos.current).multiplyScalar(15);
      velocity.current.add(force.multiplyScalar(delta)).multiplyScalar(0.85);
      currentPos.current.add(velocity.current.clone().multiplyScalar(delta));
      
      meshRef.current.position.copy(currentPos.current);
      
      // Vertical Jump Arc Animation
      if (isJumpAnimating) {
        // Parabolic arc for jump: y = height * (1 - (2t-1)^2)
        // We use state.clock to calculate a progress 't' for the 500ms jump
        const t = (state.clock.elapsedTime % 0.5) / 0.5;
        const jumpHeight = 0.8;
        const jumpY = jumpHeight * (1 - Math.pow(2 * t - 1, 2));
        meshRef.current.position.y += jumpY;
      } else {
        // Idle animation: Subtle hovering/floating
        const hover = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        meshRef.current.position.y += hover + (isSelected ? 0.3 : 0);
      }

      // Electrical current idle animation
      if (glowRef.current) {
        const pulse = (Math.sin(state.clock.elapsedTime * 15) + 1) / 2;
        const arc = (Math.sin(state.clock.elapsedTime * 40) + 1) / 2 * 0.3;
        (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + pulse * 0.5 + arc;
        glowRef.current.scale.setScalar(1 + arc * 0.2);
      }
      
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const glowColor = color === "cyan" ? "#00f3ff" : "#ff00ff";

  return (
    <group ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Piece Body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[PIECE_RADIUS, PIECE_RADIUS, PIECE_HEIGHT, 32]} />
        <meshStandardMaterial 
          color={color === "cyan" ? "#0066cc" : "#660066"} 
          emissive={glowColor}
          emissiveIntensity={isSelected ? 1.5 : 0.3}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Movement Trail */}
      <Trail
        width={1.5}
        length={4}
        color={glowColor}
        attenuation={(t) => t * t}
      >
        <mesh visible={false}>
          <sphereGeometry args={[0.1]} />
        </mesh>
      </Trail>

      {/* Electrical Current Arcs (Outer Ring) */}
      <mesh ref={glowRef} position={[0, PIECE_HEIGHT / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PIECE_RADIUS * 0.7, PIECE_RADIUS * 0.9, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Internal Electrical Core */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[PIECE_RADIUS * 0.5, PIECE_RADIUS * 0.5, PIECE_HEIGHT * 1.1, 16]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.1} />
      </mesh>

      {/* King Symbol */}
      {isKing && (
        <group position={[0, PIECE_HEIGHT / 2 + 0.05, 0]}>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[PIECE_RADIUS * 0.45, 0.03, 16, 32]} />
              <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={2} />
            </mesh>
          </Float>
        </group>
      )}
    </group>
  );
}

function Tile({ 
  r, 
  c, 
  isDark, 
  isValidTarget, 
  onClick 
}: { 
  r: number; 
  c: number; 
  isDark: boolean; 
  isValidTarget: boolean; 
  onClick: () => void;
}) {
  const x = (c - (BOARD_SIZE - 1) / 2) * TILE_SIZE;
  const z = (r - (BOARD_SIZE - 1) / 2) * TILE_SIZE;

  return (
    <group position={[x, 0, z]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh receiveShadow>
        <boxGeometry args={[TILE_SIZE, 0.1, TILE_SIZE]} />
        <meshStandardMaterial 
          color={isDark ? "#050505" : "#111111"} 
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Grid Border */}
      <mesh position={[0, 0.051, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_SIZE * 0.95, TILE_SIZE * 0.95]} />
        <meshBasicMaterial color="#00f3ff" wireframe transparent opacity={0.1} />
      </mesh>

      {/* Valid Move Indicator */}
      {isValidTarget && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.1, 32]} />
          <meshBasicMaterial color="#4ade80" />
        </mesh>
      )}
      
      {/* Highlight Target Tile */}
      {isValidTarget && (
        <mesh position={[0, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[TILE_SIZE * 0.9, TILE_SIZE * 0.9]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}

function EnvironmentExposure({ exposure }: { exposure: number }) {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [exposure, gl]);

  return null;
}


export function Board({ gameState, onSelect, onMove }: BoardProps) {
  const { board, selectedPos, turn } = gameState;

  const [environment, setEnvironment] = useState("neon");

  const environmentMap: Record<
    string,
    { type: "preset" | "file"; value: string; exposure: number }
  > = {
    neon: { type: "file", value: "/hdr/neon_studio.hdr", exposure: 1.4 },
    blue: { type: "file", value: "/hdr/blue_studio.hdr", exposure: 1.2 },
    brown: { type: "file", value: "/hdr/brown_studio.hdr", exposure: 1.1 },
    victorian: {
      type: "file",
      value: "/hdr/victorian_library.hdr",
      exposure: 1.0,
    },
    sunset: { type: "preset", value: "sunset", exposure: 1.3 },
  };

  function getValidMovesForPiece(board: BoardState, pos: Position) {
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
            if (
              jr >= 0 &&
              jr < 8 &&
              jc >= 0 &&
              jc < 8 &&
              !board[jr][jc]
            ) {
              jumps.push({
                from: pos,
                to: { r: jr, c: jc },
                jump: { r: nr, c: nc },
              });
            }
          }
        }
      }
    }
    return jumps.length > 0 ? jumps : moves;
  }

  const movesForSelected = useMemo(
    () =>
      selectedPos
        ? getValidMovesForPiece(board, selectedPos)
        : [],
    [board, selectedPos]
  );

  const handleAction = (r: number, c: number) => {
    const move = movesForSelected.find(
      (m) => m.to.r === r && m.to.c === c
    );
    if (move) {
      onMove(move);
    } else {
      onSelect(r, c);
    }
  };

  return (
    <div className="w-full aspect-[16/9] md:aspect-[21/9] min-h-[500px] rounded-xl overflow-hidden border-2 border-primary/20 bg-black/40 backdrop-blur-sm relative shadow-[0_0_50px_rgba(0,243,255,0.1)]">

      {/* ENVIRONMENT SELECTOR */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {Object.keys(environmentMap).map((env) => (
          <button
            key={env}
            onClick={() => setEnvironment(env)}
            className={`px-3 py-1 text-xs font-mono rounded-md border transition-all
              ${
                environment === env
                  ? "bg-primary text-black border-primary"
                  : "bg-black/50 text-white border-white/20 hover:border-primary"
              }`}
          >
            {env.toUpperCase()}
          </button>
        ))}
      </div>

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 5, 8], fov: 45 }}
      >
        <PerspectiveCamera makeDefault position={[0, 5, 8]} fov={45} />
        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={4}
          maxDistance={12}
        />

        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} castShadow />
        <spotLight
          position={[-10, 10, -10]}
          angle={0.2}
          penumbra={1}
          intensity={1}
          castShadow
        />

        {/* HDR ENVIRONMENT */}
        <Environment
          key={environment}
          {...(environmentMap[environment].type === "preset"
            ? { preset: environmentMap[environment].value }
            : { files: environmentMap[environment].value })}
          background
        />

        {/* Tone Exposure Control */}
        <EnvironmentExposure exposure={environmentMap[environment].exposure} />

        <group>
          <mesh receiveShadow position={[0, -0.1, 0]}>
            <boxGeometry args={[BOARD_SIZE + 0.5, 0.1, BOARD_SIZE + 0.5]} />
            <meshStandardMaterial color="#000000" metalness={1} roughness={0} />
          </mesh>

          {Array.from({ length: BOARD_SIZE }).map((_, r) =>
            Array.from({ length: BOARD_SIZE }).map((_, c) => (
              <Tile
                key={`tile-${r}-${c}`}
                r={r}
                c={c}
                isDark={(r + c) % 2 === 1}
                isValidTarget={movesForSelected.some(
                  (m) => m.to.r === r && m.to.c === c
                )}
                onClick={() => handleAction(r, c)}
              />
            ))
          )}

          {board.map((row, r) =>
            row.map(
              (piece, c) =>
                piece && (
                  <Piece
                    key={`piece-${r}-${c}-${piece.color}`}
                    r={r}
                    c={c}
                    color={piece.color as "cyan" | "magenta"}
                    isKing={piece.isKing}
                    isSelected={
                      selectedPos?.r === r && selectedPos?.c === c
                    }
                    onClick={() => handleAction(r, c)}
                  />
                )
            )
          )}
        </group>

        <ContactShadows
          position={[0, -0.05, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={1}
        />
      </Canvas>

      <div className="absolute bottom-4 left-4 text-[10px] font-mono text-primary uppercase opacity-40">
        Drag to rotate :: Scroll to zoom
      </div>
    </div>
  );
}
