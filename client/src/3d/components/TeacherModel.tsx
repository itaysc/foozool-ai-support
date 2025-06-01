import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { ReactNode } from 'react'

interface TeacherModelProps {
  textToSpeak?: string
  onSpeakingComplete?: () => void
}

// Global speech queue to prevent multiple instances
let isSpeaking = false
let currentUtterance: SpeechSynthesisUtterance | null = null

export function TeacherModel({ textToSpeak, onSpeakingComplete }: TeacherModelProps): ReactNode {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('/avatar.glb')
  const { actions, mixer } = useAnimations(animations, group)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentAnimation, setCurrentAnimation] = useState('Idle')
  const lastSpokenText = useRef('')
  const time = useRef(0)

  // Force stop all speech
  const forceStopSpeech = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      isSpeaking = false
      currentUtterance = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      forceStopSpeech()
    }
  }, [forceStopSpeech])

  // Debug log for available animations
  useEffect(() => {
    const animationNames = Object.keys(actions)
    console.log('=== Available Avatar Animations ===')
    console.log('Total animations:', animationNames.length)
    console.log('Animation names:', animationNames)
    console.log('Animation details:', animationNames.map(name => ({
      name,
      duration: actions[name]?.getClip().duration,
      tracks: actions[name]?.getClip().tracks.length
    })))
    console.log('===============================')
  }, [actions])

  // Handle speaking and animations
  useEffect(() => {
    // If no text or same text as last time, return
    if (!textToSpeak || textToSpeak === lastSpokenText.current) return

    // If already speaking, stop current speech
    if (isSpeaking) {
      forceStopSpeech()
    }

    // Update last spoken text
    lastSpokenText.current = textToSpeak
    isSpeaking = true
    setIsAnimating(true)
    
    // Play speaking animation
    const speakingAnim = Object.keys(actions).find(name => 
      name.toLowerCase().includes('speak') || 
      name.toLowerCase().includes('talk') ||
      name.toLowerCase().includes('idle')
    )
    
    if (speakingAnim && actions[speakingAnim]) {
      if (actions[currentAnimation]) {
        actions[currentAnimation].fadeOut(0.5)
      }
      actions[speakingAnim].reset().fadeIn(0.5).play()
      setCurrentAnimation(speakingAnim)
    }

    if (!window.speechSynthesis) {
      console.error('Speech synthesis not available')
      isSpeaking = false
      setIsAnimating(false)
      onSpeakingComplete?.()
      return
    }

    // Wait for voices to be loaded
    let voices: SpeechSynthesisVoice[] = []
    const loadVoices = () => {
      voices = window.speechSynthesis.getVoices()
      console.log('All available voices:', voices.map(v => 
        `${v.name} (${v.lang}) - ${v.name.toLowerCase().includes('male') ? 'MALE' : 'female'}`
      ))
    }

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
    loadVoices()

    // Format text with SSML for more natural speech
    const formatWithSSML = (text: string) => {
      return `<speak>
        ${text
          // Add pauses for punctuation
          .replace(/\./g, '.<break time="500ms"/>')
          .replace(/,/g, ',<break time="300ms"/>')
          .replace(/!/g, '!<break time="400ms"/>')
          .replace(/\?/g, '?<break time="400ms"/>')
          // Add emphasis for important words
          .replace(/\b([A-Z][a-z]+)\b/g, '<emphasis level="moderate">$1</emphasis>')
          // Add emphasis for numbers
          .replace(/\b(\d+)\b/g, '<emphasis level="moderate">$1</emphasis>')
          // Add prosody for questions
          .replace(/([^.!?]+\?)/g, '<prosody pitch="+10%" rate="90%">$1</prosody>')
          // Add prosody for exclamations
          .replace(/([^.!?]+!)/g, '<prosody pitch="+5%" rate="95%">$1</prosody>')
          // Add prosody for statements
          .replace(/([^.!?]+\.)/g, '<prosody pitch="0%" rate="100%">$1</prosody>')}
      </speak>`
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    currentUtterance = utterance
    
    // Strictly male voices only
    const maleVoices = voices.filter(voice => 
      voice.name.toLowerCase().includes('male') ||
      voice.name.toLowerCase().includes('david') ||
      voice.name.toLowerCase().includes('daniel') ||
      voice.name.toLowerCase().includes('alex') ||
      voice.name.toLowerCase().includes('thomas') ||
      voice.name.toLowerCase().includes('james') ||
      voice.name.toLowerCase().includes('mark') ||
      voice.name.toLowerCase().includes('michael')
    )

    console.log('Found male voices:', maleVoices.map(v => v.name))

    const selectedVoice = maleVoices.find(voice => 
      (voice.lang.startsWith('en-US') || voice.lang.startsWith('en-GB'))
    ) || maleVoices[0] || voices[0]

    if (selectedVoice) {
      console.log('Selected voice:', selectedVoice.name, selectedVoice.lang)
      utterance.voice = selectedVoice
      utterance.pitch = 0.8
      utterance.rate = 0.9
      utterance.volume = 1.0
    } else {
      console.warn('No male voice found, using default voice with adjusted pitch')
      utterance.pitch = 0.7
      utterance.rate = 0.9
      utterance.volume = 1.0
    }

    // Apply SSML formatting
    try {
      utterance.text = formatWithSSML(textToSpeak)
      console.log('Using SSML formatted text:', utterance.text)
    } catch (error) {
      console.warn('SSML formatting failed, falling back to basic text:', error)
      // Fallback to basic formatting
      utterance.text = textToSpeak
        .replace(/\./g, '. ')
        .replace(/,/g, ', ')
        .replace(/!/g, '! ')
        .replace(/\?/g, '? ')
        .split(' ')
        .map(word => word.trim())
        .join(' ')
    }

    utterance.onend = () => {
      console.log('Speech ended')
      isSpeaking = false
      currentUtterance = null
      setIsAnimating(false)
      
      if (actions[currentAnimation]) {
        actions[currentAnimation].fadeOut(0.5)
      }
      const idleAnim = Object.keys(actions).find(name => 
        name.toLowerCase().includes('idle')
      )
      if (idleAnim && actions[idleAnim]) {
        actions[idleAnim].reset().fadeIn(0.5).play()
        setCurrentAnimation(idleAnim)
      }
      onSpeakingComplete?.()
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      isSpeaking = false
      currentUtterance = null
      setIsAnimating(false)
      onSpeakingComplete?.()
    }

    // Start speaking
    window.speechSynthesis.speak(utterance)

  }, [textToSpeak, actions, currentAnimation, onSpeakingComplete, forceStopSpeech])

  // Update animation mixer and add natural movement
  useFrame((_, delta) => {
    time.current += delta

    if (group.current) {
      // Add subtle idle movement
      if (!isSpeaking) {
        // Gentle swaying motion
        group.current.position.y = Math.sin(time.current * 0.5) * 0.02
        group.current.rotation.y = Math.sin(time.current * 0.3) * 0.05
      }

      // Update animation mixer
      if (mixer) {
        mixer.update(delta)
      }
    }
  })

  // Set up initial animations and position
  useEffect(() => {
    if (group.current) {
      // Position the model
      group.current.position.set(0, 0, -3) // Moved teacher much further from blackboard (was -5.8)
      group.current.rotation.set(0, 0, 0) // Face the class (camera)
      group.current.scale.set(1, 1, 1)

      // Start with idle animation
      const idleAnim = Object.keys(actions).find(name => 
        name.toLowerCase().includes('idle')
      )
      if (idleAnim && actions[idleAnim]) {
        console.log('Starting idle animation:', idleAnim)
        actions[idleAnim].reset().fadeIn(0.5).play()
        setCurrentAnimation(idleAnim)
      } else {
        console.warn('No idle animation found')
      }
    }
  }, [actions])

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  )
}

// Preload the model
useGLTF.preload('/avatar.glb') 