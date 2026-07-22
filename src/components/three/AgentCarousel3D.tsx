"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { CanvasTexture, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, SRGBColorSpace } from "three";

export interface CarouselAgent {
  title: string;
  description: string;
}

const RING_RADIUS = 3.4;
const CAMERA_RADIUS = 6.4;
const CAMERA_HEIGHT = 0.35;
const ICON_KINDS = ["compass", "spark", "paper-plane", "chat", "bars"] as const;
type IconKind = (typeof ICON_KINDS)[number];

/** Paints number + title + description onto an offscreen 2D canvas and
 * uses it as a texture — real 3D text (troika/drei's <Text>) needs a font
 * file fetched from a CDN by default, which this sandboxed environment's
 * network policy blocks. A canvas texture needs nothing but the browser's
 * own system font, and the result is still a genuine textured mesh, not an
 * HTML overlay. 960x600 (not the original 640x400) so it stays crisp on
 * high-density screens. */
function useCardTexture(agent: CarouselAgent, index: number) {
  return useMemo(() => {
    const width = 960;
    const height = 600;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new CanvasTexture(canvas);

    ctx.clearRect(0, 0, width, height);

    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.font = "600 33px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#a3a3a3";
    ctx.fillText(String(index + 1).padStart(2, "0"), width - 60, 48);

    ctx.textAlign = "left";
    ctx.font = "700 63px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#0a0a0a";
    ctx.fillText(agent.title, 60, 225);

    ctx.font = "400 36px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#52525b";
    const words = agent.description.split(" ");
    const maxWidth = width - 120;
    const lineHeight = 48;
    let line = "";
    let y = 323;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, 60, y);
        line = word;
        y += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, 60, y);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [agent, index]);
}

/** A small pictogram per agent, drawn as vector shapes on a canvas — same
 * technique as the card text, so it stays a real textured mesh instead of
 * an HTML icon overlay, but actually means something (a compass for
 * strategy, a chat bubble for replies) instead of an arbitrary platonic
 * solid. */
function useIconTexture(kind: IconKind) {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new CanvasTexture(canvas);

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#1e6b4c";
    ctx.strokeStyle = "#1e6b4c";
    const c = size / 2;

    switch (kind) {
      case "compass": {
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.arc(c, c, size * 0.34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(c, c - size * 0.22);
        ctx.lineTo(c + size * 0.09, c);
        ctx.lineTo(c, c + size * 0.06);
        ctx.lineTo(c - size * 0.09, c);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(c, c, size * 0.045, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "spark": {
        const spikes = 4;
        const outer = size * 0.36;
        const inner = size * 0.13;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outer : inner;
          const a = (Math.PI / spikes) * i - Math.PI / 2;
          const x = c + Math.cos(a) * r;
          const y = c + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "paper-plane": {
        ctx.beginPath();
        ctx.moveTo(c - size * 0.3, c - size * 0.22);
        ctx.lineTo(c + size * 0.32, c);
        ctx.lineTo(c - size * 0.3, c + size * 0.22);
        ctx.lineTo(c - size * 0.12, c);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "chat": {
        const w = size * 0.56;
        const h = size * 0.4;
        const r = size * 0.1;
        const x = c - w / 2;
        const y = c - h / 2 - size * 0.03;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w * 0.28, y + h);
        ctx.lineTo(x + w * 0.18, y + h + size * 0.12);
        ctx.lineTo(x + w * 0.44, y + h);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "bars": {
        const barW = size * 0.13;
        const gap = size * 0.06;
        const baseY = c + size * 0.22;
        const heights = [0.18, 0.3, 0.42];
        heights.forEach((hFrac, i) => {
          const h = size * hFrac;
          const x = c - size * 0.25 + i * (barW + gap);
          ctx.fillRect(x, baseY - h, barW, h);
        });
        break;
      }
    }

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [kind]);
}

/** One card: a solid plaque with the text texture mapped onto its front
 * face, arranged on a ring around the central cube and facing outward. A
 * continuous per-card float bob, phase-offset by index, keeps the ring
 * from feeling static. Fades toward the camera's current angle: cards
 * facing the camera are fully opaque, cards edge-on soften into a low but
 * non-zero opacity instead of collapsing into a bare sliver. */
function AgentCardMesh({
  agent,
  index,
  angle,
  total,
  currentAngleRef,
}: {
  agent: CarouselAgent;
  index: number;
  angle: number;
  total: number;
  currentAngleRef: { current: number };
}) {
  const group = useRef<Group>(null);
  const boxMatRef = useRef<MeshPhysicalMaterial>(null);
  const textMatRef = useRef<MeshStandardMaterial>(null);
  const badgeMatRef = useRef<MeshStandardMaterial>(null);
  const iconMatRef = useRef<MeshStandardMaterial>(null);
  const texture = useCardTexture(agent, index);
  const iconTexture = useIconTexture(ICON_KINDS[index % ICON_KINDS.length]);
  const phase = (index / total) * Math.PI * 2;

  useFrame((state) => {
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.6 + phase) * 0.09;
    }

    // 1 when facing the camera dead-on, -1 when facing directly away.
    const facing = Math.cos(angle - currentAngleRef.current);
    const t = Math.min(Math.max((facing + 0.2) / 0.9, 0), 1);
    const eased = t * t * (3 - 2 * t); // smoothstep
    const opacity = 0.12 + 0.88 * eased;
    if (boxMatRef.current) boxMatRef.current.opacity = opacity;
    if (textMatRef.current) textMatRef.current.opacity = opacity;
    if (badgeMatRef.current) badgeMatRef.current.opacity = opacity;
    if (iconMatRef.current) iconMatRef.current.opacity = opacity;
  });

  const x = Math.sin(angle) * RING_RADIUS;
  const z = Math.cos(angle) * RING_RADIUS;

  return (
    <group position={[x, 0, z]} rotation={[0, angle, 0]}>
      <group ref={group}>
        <RoundedBox args={[1.9, 1.2, 0.08]} radius={0.05} smoothness={4} castShadow receiveShadow>
          {/* meshPhysicalMaterial with a real clearcoat, not high-roughness
              meshStandardMaterial — high roughness with zero specular is
              literally the "clay render" recipe (flat diffuse, no
              highlight), which is what made this read as plasticine
              instead of a printed/laminated card. Lower roughness + a thin
              glossy coat gives it a crisp highlight instead. */}
          <meshPhysicalMaterial
            ref={boxMatRef}
            color="#f7f3ec"
            roughness={0.4}
            metalness={0}
            clearcoat={0.6}
            clearcoatRoughness={0.15}
            transparent
          />
        </RoundedBox>
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[1.78, 1.08]} />
          <meshStandardMaterial ref={textMatRef} map={texture} transparent roughness={0.5} metalness={0} />
        </mesh>
        {/* z=0.05, ahead of the text plane at 0.045 — the box itself is
            only 0.08 deep (faces at ±0.04), so anything at z <= 0.04 sits
            inside/behind the box's own front face and gets occluded. */}
        <group position={[-0.72, 0.32, 0.05]}>
          <mesh castShadow>
            <circleGeometry args={[0.19, 32]} />
            <meshStandardMaterial ref={badgeMatRef} color="#e2ede6" roughness={0.45} metalness={0} transparent />
          </mesh>
          <mesh position={[0, 0, 0.008]}>
            <planeGeometry args={[0.24, 0.24]} />
            <meshStandardMaterial ref={iconMatRef} map={iconTexture} transparent roughness={0.35} metalness={0} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** The shared hero object, sized up ("que se vea más") and no longer
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
          <AgentCardMesh
            key={agent.title}
            agent={agent}
            index={i}
            angle={(i * Math.PI * 2) / agents.length}
            total={agents.length}
            currentAngleRef={currentAngleRef}
          />
        ))}
        {/* Invisible except where shadows land — real depth cues without a
            visible floor disc breaking the "floating" read of the scene. */}
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
        {/* Mild on purpose — this should read as "polished render," not as
            a glowing halo. High threshold so only the cube's brightest
            glass highlights bloom, not the matte white cards. */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.25} intensity={0.5} mipmapBlur />
          <Vignette eskil={false} offset={0.15} darkness={0.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
