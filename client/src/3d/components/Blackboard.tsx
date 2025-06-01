import { useRef } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { ReactNode } from 'react'

export function Blackboard(): ReactNode {
  const boardRef = useRef<THREE.Group>(null)

  return (
    <group 
      ref={boardRef} 
      position={[0, 1.5, -5.9]} // Move blackboard to match new back wall position
      rotation={[0, 0, 0]} // Face towards the class
    >
      {/* Main board */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[6, 2.5, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Frame */}
      <group position={[0, 0, -0.05]}>
        {/* Top frame */}
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[6.1, 0.1, 0.2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Bottom frame */}
        <mesh position={[0, -1.3, 0]}>
          <boxGeometry args={[6.1, 0.1, 0.2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Left frame */}
        <mesh position={[-3.05, 0, 0]}>
          <boxGeometry args={[0.1, 2.6, 0.2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Right frame */}
        <mesh position={[3.05, 0, 0]}>
          <boxGeometry args={[0.1, 2.6, 0.2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </group>

      {/* Tray */}
      <group position={[0, -1.6, 0.1]}>
        {/* Tray bottom */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[6.1, 0.1, 0.2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Tray front */}
        <mesh position={[0, 0, 0.15]}>
          <boxGeometry args={[6.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Chalk pieces */}
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position={[-2.5 + (i * 0.8), 0, 0.1]} rotation={[0, 0, Math.random() * 0.2 - 0.1]}>
            <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
            <meshStandardMaterial color={['#FFFFFF', '#F0F0F0', '#E0E0E0'][i % 3]} />
          </mesh>
        ))}
      </group>

      {/* Chalk Text */}
      <group position={[-2.8, 1, 0.01]}>
        <Text
          color="#FFFFFF"
          fontSize={0.2}
          anchorX="left"
          anchorY="middle"
        >
          Welcome to Class!
        </Text>
      </group>

      {/* Math Equation */}
      <group position={[-2.8, 0.5, 0.01]}>
        <Text
          color="#FFFFFF"
          fontSize={0.15}
          anchorX="left"
          anchorY="middle"
        >
          a² + b² = c²
        </Text>
      </group>

      {/* Decorative Chalk Dust */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 5.8,
          (Math.random() - 0.5) * 2.8,
          0.03
        ]}>
          <circleGeometry args={[0.02 + Math.random() * 0.03, 8]} />
          <meshStandardMaterial 
            color="#FFFFFF"
            transparent
            opacity={0.3 + Math.random() * 0.3}
          />
        </mesh>
      ))}

      {/* Additional Decorative Elements */}
      <group position={[2.8, 1, 0.01]}>
        <Text
          color="#FFFFFF"
          fontSize={0.15}
          anchorX="right"
          anchorY="middle"
        >
          Today's Topics:
        </Text>
      </group>

      <group position={[2.8, 0.6, 0.01]}>
        <Text
          color="#FFFFFF"
          fontSize={0.12}
          anchorX="right"
          anchorY="middle"
        >
          • Introduction
        </Text>
      </group>

      <group position={[2.8, 0.3, 0.01]}>
        <Text
          color="#FFFFFF"
          fontSize={0.12}
          anchorX="right"
          anchorY="middle"
        >
          • Basic Concepts
        </Text>
      </group>

      <group position={[2.8, 0, 0.01]}>
        <Text
          color="#FFFFFF"
          fontSize={0.12}
          anchorX="right"
          anchorY="middle"
        >
          • Practice
        </Text>
      </group>

      {/* Eraser */}
      <group position={[2.9, -1.6, 0.2]}>
        <mesh>
          <boxGeometry args={[0.2, 0.1, 0.15]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Eraser felt */}
        <mesh position={[0, 0.05, 0.08]}>
          <boxGeometry args={[0.18, 0.05, 0.02]} />
          <meshStandardMaterial color="#F5F5F5" />
        </mesh>
      </group>
    </group>
  )
} 