import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ReactNode } from 'react'

interface StudentModelProps {
  videoRef: React.RefObject<HTMLVideoElement>
}

export function StudentModel({ videoRef }: StudentModelProps): ReactNode {
  const studentRef = useRef<THREE.Group>(null)
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null)
  const maskTextureRef = useRef<THREE.Texture | null>(null)

  // Create video texture and mask texture when video element is available
  useEffect(() => {
    if (videoRef.current) {
      // Create video texture
      const videoTexture = new THREE.VideoTexture(videoRef.current)
      videoTexture.minFilter = THREE.LinearFilter
      videoTexture.magFilter = THREE.LinearFilter
      videoTextureRef.current = videoTexture

      // Create mask texture (circular gradient)
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
        gradient.addColorStop(0.8, 'rgba(255, 255, 255, 1)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 256, 256)
        
        const maskTexture = new THREE.CanvasTexture(canvas)
        maskTextureRef.current = maskTexture
      }
    }
  }, [videoRef])

  // Update video texture on each frame
  useFrame(() => {
    if (videoTextureRef.current) {
      videoTextureRef.current.needsUpdate = true
    }
  })

  return (
    <group ref={studentRef} position={[-4, 0, -2]}>
      {/* Student's body */}
      <group position={[0, 0.5, 0]}>
        {/* Torso */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.4, 0.6, 0.2]} />
          <meshStandardMaterial color="#2196F3" /> {/* Blue shirt */}
        </mesh>

        {/* Arms */}
        <mesh position={[0.3, 0.5, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color="#2196F3" />
        </mesh>
        <mesh position={[-0.3, 0.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color="#2196F3" />
        </mesh>

        {/* Legs */}
        <mesh position={[0.1, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color="#424242" /> {/* Dark pants */}
        </mesh>
        <mesh position={[-0.1, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color="#424242" />
        </mesh>
      </group>

      {/* Head with video texture */}
      <group position={[0, 1.2, 0]}>
        {/* Head base */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial color="#f5d0c5" /> {/* Skin tone */}
        </mesh>

        {/* Face with video texture - using curved surface */}
        <mesh position={[0, 0, 0.15]} rotation={[0, 0, 0]}>
          <sphereGeometry args={[0.2, 32, 32, 0, Math.PI, 0, Math.PI / 2]} />
          <meshBasicMaterial
            map={videoTextureRef.current}
            alphaMap={maskTextureRef.current}
            transparent
            opacity={0.95}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* Hair - adjusted to frame the face */}
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.21, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2c2c2c" /> {/* Dark hair */}
        </mesh>

        {/* Additional hair pieces for better framing */}
        <mesh position={[0.15, 0.05, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.1, 0.2, 0.05]} />
          <meshStandardMaterial color="#2c2c2c" />
        </mesh>
        <mesh position={[-0.15, 0.05, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.1, 0.2, 0.05]} />
          <meshStandardMaterial color="#2c2c2c" />
        </mesh>
      </group>
    </group>
  )
} 