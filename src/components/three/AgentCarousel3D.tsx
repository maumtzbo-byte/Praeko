"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import { CanvasTexture, Group, Mesh, SRGBColorSpace } from "three";

export interface CarouselAgent {
  title: string;
  description: string;
}

const RING_RADIUS = 3.4;
const CAMERA_RADIUS = 6.4;
const CAMERA_HEIGHT = 0.35;
const ICON_SHAPES = ["icosahedron", "octahedron", "torus", "sphere", "cone"] as const;

/** Paints number + title + description onto an offscreen 2D canvas and
 * uses it as a texture — real 3D text (troika/drei's <Text>) needs a font
 * file fetched from a CDN by default, which this sandboxed environment's
 * network policy blocks. A canvas texture needs nothing but the browser's
 * own system font, and the result is still a genuine textured mesh, not an
 * HTML overlay. */
function useCardTexture(agent: CarouselAgent, index: number) {
  return useMemo(() => {
    const width = 640;
    const height = 400;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new CanvasTexture(canvas);

    ctx.clearRect(0, 0, width, height);

    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.font = "600 22px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#a3a3a3";
    ctx.fillText(String(index + 1).padStart(2, "0"), width - 40, 32);

    ctx.textAlign = "left";
    ctx.font = "700 42px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#0a0a0a";
    ctx.fillText(agent.title, 40, 150);

    ctx.font = "400 24px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#52525b";
    const words = agent.description.split(" ");
    const maxWidth = width - 80;
    const lineHeight = 32;
    let line = "";
    let y = 215;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, 40, y);
        line = word;
        y += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, 40, y);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [agent, index]);
}

function AgentIcon({ shape }: { shape: (typeof ICON_SHAPES)[number] }) {
  return (
    <mesh castShadow position={[-0.72, 0.32, 0.08]}>
      {shape === "icosahedron" && <icosahedronGeometry args={[0.15, 0]} />}
      {shape === "octahedron" && <octahedronGeometry args={[0.17, 0]} />}
      {shape === "torus" && <torusGeometry args={[0.13, 0.05, 16, 32]} />}
      {shape === "sphere" && <sphereGeometry args={[0.15, 24, 24]} />}
      {shape === "cone" && <coneGeometry args={[0.15, 0.28, 5]} />}
      <meshStandardMaterial color="#1e6b4c" roughness={0.35} metalness={0.1} />
    </mesh>
  );
}

/** One card: a solid, opaque plaque (so it reads as a real object, not a
 * cutout) with the text texture maped onto its front face, arranged on a
 * ring around the central cube and facing outward. A continuous per-card
 * float bob, phase-offset by index, keeps the ring from feeling static. */
function AgentCardMesh({ agent, index, angle, total }: { agent: CarouselAgent; index: number; angle: number; total: number }) {
  const group = useRef<Group>(null);
  const texture = useCardTexture(agent, index);
  const phase = (index / total) * Math.PI * 2;

  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.6 + phase) * 0.09;
  });

  const x = Math.sin(angle) * RING_RADIUS;
  const z = Math.cos(angle) * RING_RADIUS;

  return (
    <group position={[x, 0, z]} rotation={[0, angle, 0]}>
      <group ref={group}>
        <RoundedBox args={[1.9, 1.2, 0.08]} radius={0.07} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0} />
        </RoundedBox>
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[1.78, 1.08]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
        <AgentIcon shape={ICON_SHAPES[index % ICON_SHAPES.length]} />
      </group>
    </group>
  );
}

/** The shared hero object, now sized up ("que se vea más") and no longer
 * self-spinning to signal "rotation" — that job belongs to the camera now
 * (see CameraRig). It keeps only a small idle wobble/bob for life. */
function CentralCube({ spin }: { spin: boolean }) {
  const mesh = useRef<Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.y = 0.4 + (spin ? Math.sin(t * 0.15) * 0.12 : 0);
    mesh.current.rotation.x = 0.5 + (spin ? Math.sin(t * 0.2) * 0.06 : 0);
    mesh.current.position.y = spin ? Math.sin(t * 0.4) * 0.05 : 0;
  });

  return (
    <RoundedBox ref={mesh} args={[2.15, 2.15, 2.15]} radius={0.16} smoothness={6} castShadow receiveShadow>
      <MeshTransmissionMaterial
        color="#1e6b4c"
        thickness={1.3}
        roughness={0.1}
        transmission={0.5}
        ior={1.45}
        attenuationColor="#0a2e23"
        attenuationDistance={0.7}
        chromaticAberration={0.02}
        anisotropy={0.1}
        distortion={0}
        temporalDistortion={0}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={1.7}
        resolution={512}
      />
    </RoundedBox>
  );
}

/** Orbits the camera around the ring instead of spinning the objects in
 * place — the actual ask ("que se sienta que la cámara rota"). Reads
 * `currentAngleRef`/`targetAngleRef` from plain refs (not React state) so a
 * drag can update them every pointer-move without triggering a re-render;
 * eases toward the target itself once the drag lets go. */
function CameraRig({
  currentAngleRef,
  targetAngleRef,
  draggingRef,
}: {
  currentAngleRef: { current: number };
  targetAngleRef: { current: number };
  draggingRef: { current: boolean };
}) {
  useFrame(({ camera }, delta) => {
    if (!draggingRef.current) {
      const ease = 1 - Math.pow(0.001, delta);
      currentAngleRef.current += (targetAngleRef.current - currentAngleRef.current) * ease;
    }
    const a = currentAngleRef.current;
    camera.position.x = Math.sin(a) * CAMERA_RADIUS;
    camera.position.z = Math.cos(a) * CAMERA_RADIUS;
    camera.position.y = CAMERA_HEIGHT;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

const SAFE_MATCH_MEDIA = "(prefers-reduced-motion: reduce)";
const DRAG_SENSITIVITY = 0.008;

export default function AgentCarousel3D({
  agents,
  activeIndex,
  onActiveIndexChange,
  active = true,
  className,
}: {
  agents: CarouselAgent[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  active?: boolean;
  className?: string;
}) {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(SAFE_MATCH_MEDIA).matches);
  const anglePerCard = (Math.PI * 2) / agents.length;

  const currentAngleRef = useRef(activeIndex * anglePerCard);
  const targetAngleRef = useRef(activeIndex * anglePerCard);
  const draggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartAngle = useRef(0);
  const draggedRef = useRef(false);

  useEffect(() => {
    const mql = window.matchMedia(SAFE_MATCH_MEDIA);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // External navigation (buttons/dots) moves the target; the camera eases
  // there on its own via CameraRig, same easing a drag-release uses.
  // Matches each card's own placement angle (i * anglePerCard) exactly —
  // that's what "facing card i" means geometrically (see AgentCardMesh).
  useEffect(() => {
    targetAngleRef.current = activeIndex * anglePerCard;
  }, [activeIndex, anglePerCard]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    draggedRef.current = false;
    dragStartX.current = e.clientX;
    dragStartAngle.current = currentAngleRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const deltaX = e.clientX - dragStartX.current;
    if (Math.abs(deltaX) > 3) draggedRef.current = true;
    // Negative coefficient on purpose: dragging left (negative deltaX)
    // advances to the next card, the standard swipe-left-for-next
    // convention — and the visible ring/camera sweep direction that goes
    // with it is what was asked for ("scrollear a la izquierda gira a la
    // derecha").
    currentAngleRef.current = dragStartAngle.current - deltaX * DRAG_SENSITIVITY;
  }

  function handlePointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (!draggedRef.current) return;
    // Snap to whichever card angle the drag ended up closest to. Matches
    // the positive i * anglePerCard convention targetAngleRef uses.
    const raw = currentAngleRef.current / anglePerCard;
    const nearest = Math.max(0, Math.min(agents.length - 1, Math.round(raw)));
    onActiveIndexChange(nearest);
  }

  return (
    <div
      className={className}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: "pan-y", cursor: "grab" }}
      aria-hidden="true"
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, CAMERA_HEIGHT, CAMERA_RADIUS], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        frameloop={reducedMotion || !active ? "demand" : "always"}
      >
        <CameraRig currentAngleRef={currentAngleRef} targetAngleRef={targetAngleRef} draggingRef={draggingRef} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 6, 4]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        <CentralCube spin={!reducedMotion} />
        {agents.map((agent, i) => (
          <AgentCardMesh key={agent.title} agent={agent} index={i} angle={(i * Math.PI * 2) / agents.length} total={agents.length} />
        ))}
        {/* Invisible except where shadows land — real depth cues (per the
            brief) without a visible floor disc breaking the "floating"
            read of the whole scene. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.16} />
        </mesh>
        <Environment resolution={256}>
          <Lightformer intensity={2.2} color="#f4eee5" position={[0, 4, -6]} scale={[10, 6, 1]} />
          <Lightformer intensity={1.6} color="white" position={[0, 0, 6]} scale={[8, 8, 1]} />
          <Lightformer intensity={1.5} color="#c9b896" position={[-6, 1, 3]} scale={[6, 10, 1]} rotation={[0, Math.PI / 3, 0]} />
          <Lightformer intensity={1.3} color="#ece3d8" position={[6, -1, 3]} scale={[6, 10, 1]} rotation={[0, -Math.PI / 3, 0]} />
        </Environment>
      </Canvas>
    </div>
  );
}
