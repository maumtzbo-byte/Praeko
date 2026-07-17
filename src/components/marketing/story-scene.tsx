"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Suspense, type ReactNode } from "react";
import type { PerspectiveCamera } from "three";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { BrandMockup, CalendarMockup, VideoMockup, ReviewMockup, ChatMockup, AnalyticsMockup } from "./story-mockups";

interface ShotPoint {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Piecewise-linear interpolation across arbitrary (possibly repeated,
 * for hold plateaus) breakpoints — see `buildShotSchedule` below. */
function lerpShot(points: ShotPoint[], breakpoints: number[], t: number): ShotPoint {
  const clamped = Math.min(Math.max(t, breakpoints[0]), breakpoints[breakpoints.length - 1]);
  let idx = 0;
  while (idx < breakpoints.length - 2 && clamped > breakpoints[idx + 1]) idx++;
  const segStart = breakpoints[idx];
  const segEnd = breakpoints[idx + 1];
  const localT = (clamped - segStart) / (segEnd - segStart);
  const a = points[idx];
  const b = points[idx + 1];
  return {
    position: [
      lerp(a.position[0], b.position[0], localT),
      lerp(a.position[1], b.position[1], localT),
      lerp(a.position[2], b.position[2], localT),
    ],
    lookAt: [
      lerp(a.lookAt[0], b.lookAt[0], localT),
      lerp(a.lookAt[1], b.lookAt[1], localT),
      lerp(a.lookAt[2], b.lookAt[2], localT),
    ],
    fov: lerp(a.fov, b.fov, localT),
  };
}

// A small "gallery" of real product screens laid out in 3D space — the
// camera flies between them instead of one abstract shape sitting still.
const PANEL_POSITIONS: [number, number, number][] = [
  [0, 0, 0],
  [3.6, 0.1, -0.6],
  [7.2, -0.05, 0.4],
  [10.8, 0.15, -0.5],
  [14.4, -0.1, 0.3],
  [18, 0, 0],
];

// Camera shots, one per beat. Beat 0 is deliberately neutral/flat — a plain
// intro, not a swoop. From beat 1 on, distance/height/fov vary more so each
// stop reads as its own shot (the video panel gets the tightest fov, a real
// close-up; the finale pulls back for a calm, centered reveal).
const CAMERA_SHOTS: ShotPoint[] = [
  { position: [0, 0, 4.2], lookAt: [0, 0, 0], fov: 32 },
  { position: [3.6, 0.6, 3.4], lookAt: [3.6, 0.1, -0.6], fov: 30 },
  { position: [7.2, 0.15, 4.6], lookAt: [7.2, 0.4, 0.4], fov: 27 },
  { position: [10.8, 0.8, 3.6], lookAt: [10.8, 0.15, -0.5], fov: 29 },
  { position: [14.4, -0.4, 3.0], lookAt: [14.4, -0.1, 0.3], fov: 34 },
  { position: [18, 0.2, 4.8], lookAt: [18, 0, 0], fov: 27 },
];

// A single midpoint-to-midpoint lerp drifts the camera away from shot i
// while beat i's text/panel is still supposed to be fully held. Instead,
// build a hold-then-transition schedule matching beatInputRange's own fade
// windows exactly: the camera sits still at shot i for the whole beat, and
// only moves during the narrow crossfade zone shared with the text.
const CAMERA_FADE_FRACTION = 0.32;
function buildShotSchedule(shots: ShotPoint[], fadeFraction: number) {
  const total = shots.length;
  const segment = 1 / total;
  const fade = segment * fadeFraction;
  const breakpoints: number[] = [0];
  const values: ShotPoint[] = [shots[0]];
  for (let i = 0; i < total - 1; i++) {
    const boundary = (i + 1) * segment;
    breakpoints.push(boundary - fade, boundary + fade);
    values.push(shots[i], shots[i + 1]);
  }
  breakpoints.push(1);
  values.push(shots[total - 1]);
  return { breakpoints, values };
}
const SHOT_SCHEDULE = buildShotSchedule(CAMERA_SHOTS, CAMERA_FADE_FRACTION);

function CameraRig({ progress }: { progress: MotionValue<number> }) {
  useFrame((state) => {
    const shot = lerpShot(SHOT_SCHEDULE.values, SHOT_SCHEDULE.breakpoints, progress.get());
    state.camera.position.set(...shot.position);
    state.camera.lookAt(...shot.lookAt);
    if ("fov" in state.camera) {
      const camera = state.camera as PerspectiveCamera;
      camera.fov = shot.fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

/** 0..1 progress scoped to a single beat's own scroll window. */
function useBeatProgress(progress: MotionValue<number>, index: number, total: number) {
  const segment = 1 / total;
  return useTransform(progress, [index * segment, (index + 1) * segment], [0, 1], { clamp: true });
}

function PanelFrame({
  index,
  total,
  progress,
  position,
  scale = 0.12,
  children,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  position: [number, number, number];
  scale?: number;
  children: ReactNode;
}) {
  const segment = 1 / total;
  const start = index * segment;
  const end = start + segment;
  const fade = segment * 0.3;
  const input =
    index === 0
      ? [start, start, end - fade, end]
      : index === total - 1
        ? [start, start + fade, end, end]
        : [start, start + fade, end - fade, end];
  const output = index === 0 ? [1, 1, 1, 0] : index === total - 1 ? [0, 1, 1, 1] : [0, 1, 1, 0];
  const opacity = useTransform(progress, input, output);

  return (
    <Html transform center position={position} scale={scale} pointerEvents="none">
      <motion.div style={{ opacity }}>{children}</motion.div>
    </Html>
  );
}

function BrandPanel({ progress }: { progress: MotionValue<number> }) {
  return (
    <PanelFrame index={0} total={6} progress={progress} position={PANEL_POSITIONS[0]}>
      <BrandMockup />
    </PanelFrame>
  );
}

function CalendarPanel({ progress }: { progress: MotionValue<number> }) {
  return (
    <PanelFrame index={1} total={6} progress={progress} position={PANEL_POSITIONS[1]}>
      <CalendarMockup />
    </PanelFrame>
  );
}

function VideoPanel({ progress }: { progress: MotionValue<number> }) {
  const local = useBeatProgress(progress, 2, 6);
  return (
    <PanelFrame index={2} total={6} progress={progress} position={PANEL_POSITIONS[2]} scale={0.062}>
      <VideoMockup progress={local} />
    </PanelFrame>
  );
}

function ReviewPanel({ progress }: { progress: MotionValue<number> }) {
  const local = useBeatProgress(progress, 3, 6);
  return (
    <PanelFrame index={3} total={6} progress={progress} position={PANEL_POSITIONS[3]}>
      <ReviewMockup progress={local} />
    </PanelFrame>
  );
}

function ChatPanel({ progress }: { progress: MotionValue<number> }) {
  const local = useBeatProgress(progress, 4, 6);
  return (
    <PanelFrame index={4} total={6} progress={progress} position={PANEL_POSITIONS[4]}>
      <ChatMockup progress={local} />
    </PanelFrame>
  );
}

function AnalyticsPanel({ progress }: { progress: MotionValue<number> }) {
  const local = useBeatProgress(progress, 5, 6);
  return (
    <PanelFrame index={5} total={6} progress={progress} position={PANEL_POSITIONS[5]}>
      <AnalyticsMockup progress={local} />
    </PanelFrame>
  );
}

export default function StoryScene({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: CAMERA_SHOTS[0].position, fov: CAMERA_SHOTS[0].fov }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.1} />
          <directionalLight position={[2, 4, 3]} intensity={0.5} />
          <CameraRig progress={progress} />
          <BrandPanel progress={progress} />
          <CalendarPanel progress={progress} />
          <VideoPanel progress={progress} />
          <ReviewPanel progress={progress} />
          <ChatPanel progress={progress} />
          <AnalyticsPanel progress={progress} />
        </Suspense>
      </Canvas>
    </div>
  );
}
