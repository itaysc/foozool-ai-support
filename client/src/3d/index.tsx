import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useTexture, PerspectiveCamera, Environment, Grid } from '@react-three/drei'
import { Suspense, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { addAudioGeneratorButton } from '../utils/generateAudio'
import { TeacherModel } from './components/TeacherModel'
import { Blackboard } from './components/Blackboard'
import { Classroom } from './components/Classroom'
import { StudentModel } from './components/StudentModel'
import { AvatarDisplay } from './components/AvatarDisplay'

interface HandProps {
  isLeft?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

function Hand({ isLeft = false, position = [0, 0, 0], rotation = [0, 0, 0] }: HandProps) {
  const handRef = useRef<THREE.Group>(null);
  const [isWaving, setIsWaving] = useState(false);

  useFrame((state) => {
    if (handRef.current) {
      const time = state.clock.getElapsedTime();
      if (isWaving) {
        // Waving animation
        handRef.current.rotation.z = Math.sin(time * 5) * 0.5;
        handRef.current.rotation.x = Math.sin(time * 2.5) * 0.2;
      } else {
        // Subtle idle movement
        handRef.current.rotation.z = Math.sin(time * 0.5) * 0.05;
      }
    }
  });

  return (
    <group 
      ref={handRef} 
      position={position} 
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        setIsWaving(!isWaving);
      }}
    >
      {/* Palm */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.08, 0.04]} />
        <meshStandardMaterial color="#f5d0c5" />
      </mesh>

      {/* Thumb */}
      <group position={[isLeft ? 0.06 : -0.06, 0.02, 0]} rotation={[0, 0, isLeft ? -0.3 : 0.3]}>
        <mesh position={[0, -0.04, 0]}>
          <boxGeometry args={[0.04, 0.08, 0.04]} />
          <meshStandardMaterial color="#f5d0c5" />
        </mesh>
        <mesh position={[0, -0.12, 0]} rotation={[0, 0, isLeft ? 0.2 : -0.2]}>
          <boxGeometry args={[0.04, 0.06, 0.04]} />
          <meshStandardMaterial color="#f5d0c5" />
        </mesh>
      </group>

      {/* Fingers */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[isLeft ? 0.04 : -0.04, -0.04, 0]}>
          {/* First joint */}
          <mesh position={[0, -0.06 - (i * 0.02), 0]}>
            <boxGeometry args={[0.03, 0.06, 0.04]} />
            <meshStandardMaterial color="#f5d0c5" />
          </mesh>
          {/* Second joint */}
          <mesh position={[0, -0.12 - (i * 0.02), 0]}>
            <boxGeometry args={[0.03, 0.06, 0.04]} />
            <meshStandardMaterial color="#f5d0c5" />
          </mesh>
          {/* Fingertip */}
          <mesh position={[0, -0.18 - (i * 0.02), 0]}>
            <boxGeometry args={[0.03, 0.04, 0.04]} />
            <meshStandardMaterial color="#f5d0c5" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SceneSetup() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.5, 3]} fov={60} />
      <OrbitControls
        target={[0, 1.2, -3]}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        minDistance={1}
        maxDistance={6}
        enableDamping
        dampingFactor={0.05}
      />
      <directionalLight
        position={[5, 5, 5]}
        intensity={2.5}
        castShadow
      />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={1.5}
        castShadow
      />
      <ambientLight intensity={2} />
      <Grid args={[10, 10]} />
    </>
  )
}

export function AvatarWithTalking() {
  const [textToSpeak, setTextToSpeak] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isCameraEnabled, setIsCameraEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsRecording(true)
        setRecognizedText('')
      }

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
        setRecognizedText(transcript)
      }

      recognition.onend = () => {
        setIsRecording(false)
        if (recognizedText.trim()) {
          setTextToSpeak("I will see what I can do")
          setIsSpeaking(true)
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Initialize camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initializeCamera = async () => {
      if (!isCameraEnabled || !videoRef.current) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 160,
            height: 120
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setIsCameraEnabled(false);
      }
    };

    initializeCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isCameraEnabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isSpeaking) return

    console.log('Setting text to speak:', inputText)
    setTextToSpeak(inputText)
    setIsSpeaking(true)
  }

  const handleSpeakingComplete = () => {
    console.log('Speaking completed')
    setIsSpeaking(false)
    setTextToSpeak('')
  }

  const toggleCamera = () => {
    setIsCameraEnabled(!isCameraEnabled)
  }

  const toggleRecording = () => {
    if (!recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#f0f0f0' }}>
      <Canvas shadows camera={{ position: [0, 1.5, 3], fov: 60 }}>
        <color attach="background" args={['#f0f0f0']} />
        <Suspense fallback={null}>
          <SceneSetup />
          <Classroom />
          <TeacherModel
            textToSpeak={textToSpeak}
            onSpeakingComplete={handleSpeakingComplete}
          />
          <Blackboard />
          {isCameraEnabled && <StudentModel videoRef={videoRef} />}
          <AvatarDisplay 
            position={[0, 0, -5.8]}
            rotation={[0, 0, 0]}
            scale={1}
          />
        </Suspense>
      </Canvas>

      {/* Camera view */}
      {isCameraEnabled && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 160,
          height: 120,
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid #4CAF50',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          zIndex: 1000,
        }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)'
            }}
            playsInline
            autoPlay
          />
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: 600,
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
      }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={toggleCamera}
            style={{
              padding: '12px 24px',
              background: isCameraEnabled ? '#f44336' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {isCameraEnabled ? 'Disable Camera' : 'Enable Camera'}
          </button>
          {isCameraEnabled && (
            <button
              onClick={toggleRecording}
              style={{
                padding: '12px 24px',
                background: isRecording ? '#f44336' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isRecording ? (
                <>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    animation: 'pulse 1s infinite'
                  }} />
                  Stop Recording
                </>
              ) : (
                'Start Speaking'
              )}
            </button>
          )}
        </div>

        {/* Speech recognition status and text */}
        {isRecording && (
          <div style={{
            marginBottom: '10px',
            padding: '10px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#1565C0'
          }}>
            {recognizedText || 'Listening...'}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isSpeaking ? "Speaking..." : "Type something for the teacher to say..."}
            disabled={isSpeaking || isRecording}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              opacity: (isSpeaking || isRecording) ? 0.7 : 1,
              transition: 'opacity 0.3s ease',
            }}
          />
          <button
            type="submit"
            disabled={isSpeaking || !inputText.trim() || isRecording}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: isSpeaking || isRecording ? '#ccc' : '#1a237e',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (isSpeaking || isRecording) ? 'not-allowed' : 'pointer',
              opacity: (isSpeaking || isRecording) ? 0.7 : 1,
              transition: 'all 0.3s ease',
            }}
          >
            {isSpeaking ? 'Speaking...' : 'Speak'}
          </button>
        </form>
      </div>

      {/* Add pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  )
}

// Add TypeScript declarations for speech recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionError) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default AvatarWithTalking;
