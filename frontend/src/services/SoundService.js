let ringtoneInterval = null;
let ringtoneCtx = null;

class SoundService {
  static play(category) {
    const isMuted = localStorage.getItem('notif_mute') === 'true';
    if (isMuted) return;

    const volumePercent = parseInt(localStorage.getItem('notif_volume') || '80', 10);
    const volume = volumePercent / 100;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    try {
      const ctx = new AudioContext();
      
      const playTone = (freq, duration, type = 'sine', startTime = 0) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        
        gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime + startTime);
        // Exponential decay
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      switch (category.toUpperCase()) {
        case 'MESSAGE':
          // Warm double chime (C5 -> E5)
          playTone(523.25, 0.15, 'sine', 0);
          playTone(659.25, 0.25, 'sine', 0.12);
          break;
        case 'MENTION':
          // Crisp high chime (D5 -> A5)
          playTone(587.33, 0.12, 'sine', 0);
          playTone(880.00, 0.30, 'sine', 0.08);
          break;
        case 'TASK_ASSIGNED':
        case 'TASK_UPDATED':
          // Upward sweep
          playTone(440.00, 0.15, 'sine', 0);
          playTone(554.37, 0.15, 'sine', 0.08);
          playTone(659.25, 0.25, 'sine', 0.16);
          break;
        case 'APPROVAL':
          // Majestic double bell (F5 -> C6)
          playTone(698.46, 0.20, 'triangle', 0);
          playTone(1046.50, 0.35, 'triangle', 0.15);
          break;
        case 'REMINDER':
          // Playful alert (A4 -> C#5 -> E5)
          playTone(440.00, 0.10, 'sine', 0);
          playTone(554.37, 0.10, 'sine', 0.08);
          playTone(659.25, 0.20, 'sine', 0.16);
          break;
        case 'ANNOUNCEMENT':
          // Fanfare chime
          playTone(523.25, 0.10, 'triangle', 0);
          playTone(523.25, 0.10, 'triangle', 0.08);
          playTone(783.99, 0.30, 'triangle', 0.16);
          break;
        case 'CALL_RING':
          // Single ring burst (used by playRingtone loop)
          playTone(784.00, 0.15, 'sine', 0);
          playTone(659.25, 0.15, 'sine', 0.18);
          playTone(784.00, 0.15, 'sine', 0.36);
          playTone(659.25, 0.15, 'sine', 0.54);
          break;
        default: // SYSTEM / Default
          // Quick soft alert
          playTone(587.33, 0.15, 'sine', 0);
          break;
      }
    } catch (e) {
      console.warn('Sound playback blocked by browser/gesture', e);
    }
  }

  /**
   * Start a repeating ringtone for incoming calls.
   * Plays a ring burst every 2 seconds, up to 30 seconds max.
   */
  static playRingtone() {
    SoundService.stopRingtone(); // Clear any existing ringtone

    const isMuted = localStorage.getItem('notif_mute') === 'true';
    if (isMuted) return;

    // Play immediately
    SoundService.play('CALL_RING');

    let count = 0;
    const maxRings = 15; // 15 * 2s = 30s max

    ringtoneInterval = setInterval(() => {
      count++;
      if (count >= maxRings) {
        SoundService.stopRingtone();
        return;
      }
      SoundService.play('CALL_RING');
    }, 2000);
  }

  /**
   * Stop the repeating ringtone.
   */
  static stopRingtone() {
    if (ringtoneInterval) {
      clearInterval(ringtoneInterval);
      ringtoneInterval = null;
    }
  }
}

export default SoundService;
