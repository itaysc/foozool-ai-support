import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { ReactNode } from 'react'

interface AvatarDisplayProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

export function AvatarDisplay({ 
  position = [2, 0, 0], // Position to the right of the teacher
  rotation = [0, -Math.PI / 2, 0], // Face towards the teacher
  scale = 1
}: AvatarDisplayProps): ReactNode {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('/avatar.glb')
  const { actions, mixer } = useAnimations(animations, group)

  // Log available animations for debugging
  useEffect(() => {
    console.log('Available avatar animations:', Object.keys(actions))
  }, [actions])

  // Update animation mixer
  useFrame((_, delta) => {
    mixer.update(delta)
  })

  // Set up initial animations
  useEffect(() => {
    if (group.current) {
      // Try to find and play an idle animation
      const idleAnim = Object.keys(actions).find(name => 
        name.toLowerCase().includes('idle')
      )
      if (idleAnim && actions[idleAnim]) {
        actions[idleAnim].reset().fadeIn(0.5).play()
      }
    }
  }, [actions])

  return (
    <group 
      ref={group} 
      position={position} 
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      <primitive object={scene} />
    </group>
  )
}

// Preload the model
useGLTF.preload('/avatar.glb') 