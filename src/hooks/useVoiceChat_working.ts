import { useState, useRef, useCallback, useEffect } from 'react'

interface UseVoiceChatProps {
  onTranscript?: (text: string) => void
  onError?: (error: string) => void
}

export const useVoiceChat = ({ onTranscript, onError }: UseVoiceChatProps = {}) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)

  // Initialize
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const speechSynthesis = window.speechSynthesis

    if (SpeechRecognition && speechSynthesis) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      speechSynthesisRef.current = speechSynthesis

      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      console.log('✅ Speech synthesis initialized')
      console.log('Voices:', speechSynthesis.getVoices().length)

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')

        if (event.results[0].isFinal) {
          console.log('Final transcript:', transcript)
          onTranscript?.(transcript)
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error !== 'no-speech') {
          onError?.(`Speech recognition error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      recognitionRef.current?.stop()
      speechSynthesisRef.current?.cancel()
    }
  }, [onTranscript, onError])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (error) {
      console.error('Error starting speech recognition:', error)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
      setIsListening(false)
    } catch (error) {
      console.error('Error stopping speech recognition:', error)
    }
  }, [])

  // THE CRITICAL FIX: NO setTimeout, NO async, direct synchronous call from user gesture
  const speak = useCallback((text: string) => {
    console.log('🎯 SPEAK CALLED - DIRECT MODE')
    
    if (!isSupported || !speechSynthesisRef.current || !text.trim()) {
      console.log('❌ Not supported or no text')
      return
    }

    const cleanText = text.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ')
    const synth = speechSynthesisRef.current
    
    // Cancel existing - SYNCHRONOUSLY
    synth.cancel()
    
    // Create utterance - SYNCHRONOUSLY  
    const utterance = new SpeechSynthesisUtterance(cleanText)
    
    // Configure - SYNCHRONOUSLY
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    utterance.lang = 'en-US'
    
    // Get and set voice - SYNCHRONOUSLY
    const voices = synth.getVoices()
    if (voices.length > 0) {
      const voice = voices.find(v => v.lang === 'en-US') || voices[0]
      utterance.voice = voice
      console.log('Voice:', voice.name)
    }
    
    // Set handlers
    utterance.onstart = () => {
      console.log('✅ STARTED SPEAKING!')
      setIsSpeaking(true)
    }
    
    utterance.onend = () => {
      console.log('✅ ENDED SPEAKING')
      setIsSpeaking(false)
    }
    
    utterance.onerror = (e) => {
      console.error('❌ SPEECH ERROR:', e.error)
      if (e.error === 'interrupted') {
        console.log('Retrying...')
        synth.speak(utterance)
      } else {
        setIsSpeaking(false)
      }
    }
    
    // SPEAK - SYNCHRONOUSLY, NO setTimeout!
    console.log('🚀 SPEAKING NOW')
    synth.speak(utterance)
    
    // UI feedback
    setIsSpeaking(true)
    
  }, [isSupported])

  const stopSpeaking = useCallback(() => {
    if (!speechSynthesisRef.current) return
    speechSynthesisRef.current.cancel()
    setIsSpeaking(false)
  }, [])

  return {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}
