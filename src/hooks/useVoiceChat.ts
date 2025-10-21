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

  // WORKING SOLUTION: Use Web Speech API with proper Windows handling
  const speak = useCallback((text: string) => {
    console.log('🎯 Speaking:', text.substring(0, 50) + '...')
    
    if (!text.trim()) {
      console.log('❌ No text')
      return
    }

    const cleanText = text.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ')
    
    // Try native speechSynthesis first
    if (isSupported && speechSynthesisRef.current) {
      const synth = speechSynthesisRef.current
      
      try {
        synth.cancel()
        
        const utterance = new SpeechSynthesisUtterance(cleanText)
        utterance.volume = 1.0
        utterance.rate = 1.0  
        utterance.pitch = 1.0
        utterance.lang = 'en-US'
        
        const voices = synth.getVoices()
        if (voices.length > 0) {
          // Prioritize good English female voices
          let voice = voices.find(v => v.name.includes('Zira') && v.lang === 'en-US') || // Microsoft Zira (female)
                     voices.find(v => v.name.includes('Heera') && v.lang.includes('en')) || // Microsoft Heera (female, Indian English)
                     voices.find(v => v.name.includes('female') && v.lang === 'en-US') ||
                     voices.find(v => v.lang === 'en-US' && v.localService) || 
                     voices.find(v => v.lang === 'en-US') ||
                     voices[0]
          
          utterance.voice = voice
          console.log('✅ Using voice:', voice.name)
        }
        
        let started = false
        
        utterance.onstart = () => {
          started = true
          console.log('✅ Speaking!')
          setIsSpeaking(true)
        }
        
        utterance.onend = () => {
          console.log('✅ Done')
          setIsSpeaking(false)
        }
        
        utterance.onerror = (e) => {
          console.log('Speech error:', e.error)
          if (e.error === 'interrupted') {
            console.log('🔄 Retrying interrupted speech...')
            // Retry once for interrupted error (Windows bug fix)
            setTimeout(() => {
              if (speechSynthesisRef.current && !started) {
                console.log('🔁 Retry attempt')
                speechSynthesisRef.current.speak(utterance)
              }
            }, 100)
          } else {
            setIsSpeaking(false)
          }
        }
        
        // WINDOWS FIX: Ensure synthesis is ready and resumed
        if (synth.paused) {
          console.log('🔄 Resuming paused synthesis')
          synth.resume()
        }
        
        synth.speak(utterance)
        setIsSpeaking(true)
        
        // WINDOWS FIX: Force resume after speak (common Windows bug)
        setTimeout(() => {
          if (synth.paused && started) {
            console.log('🔄 Force resuming after speak')
            synth.resume()
          }
        }, 50)
        
        // Check if it actually starts
        setTimeout(() => {
          if (!started) {
            console.log('⚠️ Speech failed to start - retrying...')
            // Try one more time with a clean utterance
            const retryUtterance = new SpeechSynthesisUtterance(cleanText)
            retryUtterance.voice = utterance.voice
            retryUtterance.volume = 1.0
            retryUtterance.rate = 1.0
            retryUtterance.pitch = 1.0
            
            retryUtterance.onstart = () => {
              console.log('✅ Retry successful!')
              setIsSpeaking(true)
            }
            retryUtterance.onend = () => {
              console.log('✅ Retry completed')
              setIsSpeaking(false)
            }
            retryUtterance.onerror = () => {
              console.log('❌ Retry also failed')
              setIsSpeaking(false)
            }
            
            synth.speak(retryUtterance)
          }
        }, 800)
        
      } catch (e) {
        console.log('Native TTS error:', e)
        setIsSpeaking(false)
      }
    } else {
      console.log('Speech synthesis not supported')
      setIsSpeaking(false)
    }
    
  }, [isSupported])

  const stopSpeaking = useCallback(() => {
    if (!speechSynthesisRef.current) return
    speechSynthesisRef.current.cancel()
    setIsSpeaking(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
  }
}
