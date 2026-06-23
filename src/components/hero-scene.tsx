"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/* ── 粒子纹理：柔和径向渐变光点 ── */
function createGlowTexture() {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.12, "rgba(255,255,255,0.85)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.3)");
  gradient.addColorStop(0.65, "rgba(255,255,255,0.04)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/* ── 中心光核 ── */
function Core() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.004;
      ringRef.current.rotation.x += 0.002;
    }
  });

  return (
    <group>
      {/* 内核 */}
      <mesh>
        <sphereGeometry args={[0.07, 20, 20]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      {/* 光晕环 */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.13, 0.012, 20, 56]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

/* ── 单个粒子环 ── */
interface RingConfig {
  radius: number;
  count: number;
  color: string;
  tilt: [number, number, number];
  speed: number;
  size: number;
}

const ringConfigs: RingConfig[] = [
  { radius: 1.35, count: 130, color: "#3b82f6", tilt: [0, 0, 0], speed: 0.7, size: 0.09 },
  { radius: 1.05, count: 110, color: "#60a5fa", tilt: [1.15, 0, 0], speed: 1.1, size: 0.08 },
  { radius: 0.72, count: 90, color: "#818cf8", tilt: [0, 0.95, 0], speed: 1.5, size: 0.07 },
  { radius: 0.88, count: 80, color: "#a5b4fc", tilt: [0.75, 0.55, 0.35], speed: 0.9, size: 0.07 },
  { radius: 1.55, count: 100, color: "#93c5fd", tilt: [0.55, 0.7, 0.2], speed: 0.5, size: 0.08 },
];

function ParticleRing({ radius, count, color, tilt, speed, size }: RingConfig) {
  const ref = useRef<THREE.Points>(null);
  const texture = useMemo(() => createGlowTexture(), []);

  const positions = useMemo(() => {
    const pts = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 0.12;
      pts[i * 3] = Math.cos(angle) * r;
      pts[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      pts[i * 3 + 2] = Math.sin(angle) * r;
    }
    return pts;
  }, [radius, count]);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += speed * 0.004;
      ref.current.rotation.y += speed * 0.006;
      ref.current.rotation.z += speed * 0.002;
    }
  });

  return (
    <points ref={ref} rotation={tilt}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} 
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
}

/* ── 主场景 ── */
export function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0.2, 4], fov: 42 }}>
      <ambientLight intensity={1} />

      <Float speed={0.4} floatIntensity={0.25} rotationIntensity={0.06}>
        <group position={[0, 0.35, 0]}>
          <Core />

          {ringConfigs.map((cfg, i) => (
            <ParticleRing key={i} {...cfg} />
          ))}

          <Sparkles
            count={50}
            scale={3.6}
            size={1.2}
            speed={0.15}
            color="#93c5fd"
            opacity={0.3}
            noise={0.6}
          />
        </group>
      </Float>
    </Canvas>
  );
}
