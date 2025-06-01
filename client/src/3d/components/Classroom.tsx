import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { ReactNode } from 'react'

export function Classroom(): ReactNode {
  const classroomRef = useRef<THREE.Group>(null)

  // Create noise texture for floor
  const noiseTexture = new THREE.DataTexture(
    new Uint8Array(256 * 256).map(() => Math.random() * 255),
    256,
    256,
    THREE.RedFormat,
    THREE.UnsignedByteType
  )
  noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping
  noiseTexture.needsUpdate = true

  // Materials
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: '#2F8F8F', // Teal color
    roughness: 0.8,
    metalness: 0.1,
  })

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: '#D4C08F', // More muted yellowish color
    roughness: 1.0, // Increased roughness to diffuse light more evenly
    metalness: 0.0, // Removed metalness completely
    flatShading: false, // Ensure smooth shading
    bumpMap: noiseTexture,
    bumpScale: 0.1,
    displacementMap: noiseTexture,
    displacementScale: 0.05,
  })

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: '#7FCFCF', // Light teal color
    roughness: 0.9,
    metalness: 0.1,
  })

  const deskMaterial = new THREE.MeshStandardMaterial({
    color: '#4a4a4a', // Dark wood
    roughness: 0.8,
    metalness: 0.2,
  })

  const chairMaterial = new THREE.MeshStandardMaterial({
    color: '#2c2c2c', // Dark metal
    roughness: 0.7,
    metalness: 0.8,
  })

  return (
    <group ref={classroomRef}>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 12, 1, 1]} /> {/* Using single segment to avoid tiling artifacts */}
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 12]} />
        <primitive object={ceilingMaterial} attach="material" />
      </mesh>

      {/* Walls */}
      {/* Back wall */}
      <mesh position={[0, 2, -6]}>
        <boxGeometry args={[20, 4, 0.2]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Front wall */}
      <mesh position={[0, 2, 6]}>
        <boxGeometry args={[20, 4, 0.2]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-10, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[12, 4, 0.2]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Right wall */}
      <mesh position={[10, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[12, 4, 0.2]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Classroom Desks */}
      {Array.from({ length: 4 }).map((_, row) => (
        Array.from({ length: 3 }).map((_, col) => (
          <group key={`${row}-${col}`} position={[
            -4 + (col * 4),
            0,
            -2 + (row * 2)
          ]}>
            {/* Desk */}
            <mesh position={[0, 0.75, 0]}>
              <boxGeometry args={[1.2, 0.05, 0.8]} />
              <primitive object={deskMaterial} attach="material" />
            </mesh>
            {/* Desk legs */}
            {[[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]].map(([x, z], i) => (
              <mesh key={i} position={[x, 0.375, z]}>
                <boxGeometry args={[0.05, 0.75, 0.05]} />
                <primitive object={deskMaterial} attach="material" />
              </mesh>
            ))}
            {/* Chair - rotated to face the teacher */}
            <group position={[0, 0, 0.6]} rotation={[0, Math.PI, 0]}>
              {/* Chair seat */}
              <mesh position={[0, 0.45, 0]}>
                <boxGeometry args={[0.5, 0.05, 0.5]} />
                <primitive object={chairMaterial} attach="material" />
              </mesh>
              {/* Chair back */}
              <mesh position={[0, 0.7, -0.2]}>
                <boxGeometry args={[0.5, 0.5, 0.05]} />
                <primitive object={chairMaterial} attach="material" />
              </mesh>
              {/* Chair legs */}
              {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.225, z]}>
                  <boxGeometry args={[0.03, 0.45, 0.03]} />
                  <primitive object={chairMaterial} attach="material" />
                </mesh>
              ))}
            </group>
          </group>
        ))
      ))}

      {/* Classroom Door */}
      <group position={[-8, 0, 10.1]}>
        {/* Door frame */}
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[1.2, 4, 0.1]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Door */}
        <mesh position={[0, 1.5, 0.05]}>
          <boxGeometry args={[1, 3, 0.05]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.4, 1.5, 0.1]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Classroom Clock */}
      <group position={[8, 3.5, 10.1]}>
        {/* Clock frame */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>
        {/* Clock face */}
        <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.02, 32]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Clock hands */}
        <mesh position={[0, 0, 0.07]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.4, 0.02, 0.01]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0, 0, 0.07]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.3, 0.02, 0.01]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>

      {/* Classroom Lights */}
      {Array.from({ length: 3 }).map((_, row) => (
        Array.from({ length: 3 }).map((_, col) => (
          <group key={`light-${row}-${col}`} position={[
            -4 + (col * 4),
            3.9,
            -4 + (row * 4)
          ]}>
            {/* Light fixture */}
            <mesh>
              <boxGeometry args={[1, 0.1, 1]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
            {/* Light bulb */}
            <mesh position={[0, -0.1, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial 
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={1}
                transparent
                opacity={0.8}
              />
            </mesh>
            {/* Point light */}
            <pointLight
              position={[0, -0.5, 0]}
              intensity={0.5}
              distance={5}
              decay={2}
            />
          </group>
        ))
      ))}
    </group>
  )
} 