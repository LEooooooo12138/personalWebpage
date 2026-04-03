"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function AnimatedCharacter() {
  const root = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (root.current) {
      root.current.position.y = Math.sin(t * 1.1) * 0.06;
      root.current.rotation.y = Math.sin(t * 0.4) * 0.12;
    }
    if (rightArm.current) {
      rightArm.current.rotation.z = -0.9 + Math.sin(t * 2.2) * 0.32;
      rightArm.current.rotation.x = Math.cos(t * 1.6) * 0.08;
    }
  });

  return (
    <Float speed={1} floatIntensity={0.35} rotationIntensity={0.1}>
      <group ref={root} position={[0, -0.25, 0]}>
        <mesh position={[0, 1.45, 0]}>
          <sphereGeometry args={[0.36, 40, 40]} />
          <meshStandardMaterial color="#fde68a" roughness={0.65} />
        </mesh>

        <mesh position={[0, 0.72, 0]}>
          <capsuleGeometry args={[0.3, 0.65, 12, 18]} />
          <meshStandardMaterial color="#93c5fd" roughness={0.7} />
        </mesh>

        <mesh position={[-0.32, 0.78, 0]}>
          <capsuleGeometry args={[0.09, 0.45, 8, 12]} />
          <meshStandardMaterial color="#fde68a" roughness={0.7} />
        </mesh>

        <group ref={rightArm} position={[0.32, 1.02, 0]}>
          <mesh>
            <capsuleGeometry args={[0.09, 0.45, 8, 12]} />
            <meshStandardMaterial color="#fde68a" roughness={0.7} />
          </mesh>
        </group>

        <mesh position={[-0.14, -0.02, 0]}>
          <capsuleGeometry args={[0.11, 0.55, 8, 12]} />
          <meshStandardMaterial color="#64748b" roughness={0.55} />
        </mesh>
        <mesh position={[0.14, -0.02, 0]}>
          <capsuleGeometry args={[0.11, 0.55, 8, 12]} />
          <meshStandardMaterial color="#64748b" roughness={0.55} />
        </mesh>
      </group>
    </Float>
  );
}

export function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 1, 4], fov: 42 }}>
      <ambientLight intensity={0.95} />
      <directionalLight intensity={1} position={[2, 3, 2]} />
      <directionalLight intensity={0.5} position={[-2, 1, 1]} />
      <AnimatedCharacter />
      <ContactShadows position={[0, -0.55, 0]} opacity={0.25} blur={2.3} scale={4} />
      <Environment preset="apartment" />
    </Canvas>
  );
}
