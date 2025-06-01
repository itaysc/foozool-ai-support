export function generateHelloAudio() {
  // Create a new speech synthesis utterance
  const utterance = new SpeechSynthesisUtterance('Hello');
  
  // Configure the voice
  utterance.rate = 0.9; // Slightly slower for more natural sound
  utterance.pitch = 1.0; // Normal pitch
  utterance.volume = 1.0; // Full volume
  
  // Try to find a female voice for a more teacher-like sound
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(voice => 
    voice.name.includes('female') || 
    voice.name.includes('Samantha') || 
    voice.name.includes('Karen')
  );
  
  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }

  // Create an audio context to capture the speech
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const mediaStreamDestination = audioContext.createMediaStreamDestination();
  const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
  const audioChunks: Blob[] = [];

  // Set up the recorder
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    // Create the audio blob
    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
    
    // Create a download link
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hello.mp3';
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  // Start recording
  mediaRecorder.start();

  // Speak the text
  window.speechSynthesis.speak(utterance);

  // Stop recording after the speech is done
  utterance.onend = () => {
    setTimeout(() => {
      mediaRecorder.stop();
    }, 500); // Add a small delay to ensure we capture everything
  };
}

// Add a button to the page to trigger the audio generation
export function addAudioGeneratorButton() {
  const button = document.createElement('button');
  button.textContent = 'Generate Hello Audio';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '1000';
  button.style.padding = '10px 20px';
  button.style.background = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  
  button.onclick = () => {
    generateHelloAudio();
  };
  
  document.body.appendChild(button);
} 