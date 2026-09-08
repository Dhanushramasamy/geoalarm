import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const CUSTOM_AUDIO_KEY = 'geoalarm_custom_audio_url';
const CUSTOM_AUDIO_NAME_KEY = 'geoalarm_custom_audio_name';

export class AlarmService {
  private static audioContext: AudioContext | null = null;
  private static customAudioElement: HTMLAudioElement | null = null;
  private static isAlarmRinging: boolean = false;
  private static audioTimer: any = null;
  private static vibrationTimer: any = null;
  private static cachedCustomAudioUrl: string | null = null;
  private static cachedCustomAudioName: string | null = null;

  /**
   * Saves a custom audio Data URL uploaded from user device
   */
  public static async saveCustomAudio(dataUrl: string, fileName: string): Promise<void> {
    this.cachedCustomAudioUrl = dataUrl;
    this.cachedCustomAudioName = fileName;
    try {
      await Preferences.set({ key: CUSTOM_AUDIO_KEY, value: dataUrl });
      await Preferences.set({ key: CUSTOM_AUDIO_NAME_KEY, value: fileName });
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CUSTOM_AUDIO_KEY, dataUrl);
        window.localStorage.setItem(CUSTOM_AUDIO_NAME_KEY, fileName);
      }
    }
  }

  /**
   * Retrieves stored custom audio Data URL & name
   */
  public static async getCustomAudio(): Promise<{ url: string | null; name: string | null }> {
    if (this.cachedCustomAudioUrl && this.cachedCustomAudioName) {
      return { url: this.cachedCustomAudioUrl, name: this.cachedCustomAudioName };
    }

    try {
      const { value: url } = await Preferences.get({ key: CUSTOM_AUDIO_KEY });
      const { value: name } = await Preferences.get({ key: CUSTOM_AUDIO_NAME_KEY });
      if (url) {
        this.cachedCustomAudioUrl = url;
        this.cachedCustomAudioName = name || 'Custom Mobile Audio';
        return { url, name: this.cachedCustomAudioName };
      }
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        const url = window.localStorage.getItem(CUSTOM_AUDIO_KEY);
        const name = window.localStorage.getItem(CUSTOM_AUDIO_NAME_KEY);
        if (url) {
          this.cachedCustomAudioUrl = url;
          this.cachedCustomAudioName = name || 'Custom Mobile Audio';
          return { url, name: this.cachedCustomAudioName };
        }
      }
    }

    return { url: null, name: null };
  }

  /**
   * Clears custom audio and reverts to default siren
   */
  public static async clearCustomAudio(): Promise<void> {
    this.cachedCustomAudioUrl = null;
    this.cachedCustomAudioName = null;
    try {
      await Preferences.remove({ key: CUSTOM_AUDIO_KEY });
      await Preferences.remove({ key: CUSTOM_AUDIO_NAME_KEY });
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(CUSTOM_AUDIO_KEY);
        window.localStorage.removeItem(CUSTOM_AUDIO_NAME_KEY);
      }
    }
  }

  /**
   * Requests native local notification permissions
   */
  public static async requestPermissions(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
      } catch (err) {
        console.warn('Native notification permission error:', err);
        return false;
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
    return true;
  }

  /**
   * Triggers the full wake-up alarm sequence: custom audio or synthesizer sound, vibration, and local notification
   */
  public static async triggerWakeUp(targetName: string): Promise<void> {
    if (this.isAlarmRinging) return;
    this.isAlarmRinging = true;

    // Load custom audio if saved
    const custom = await this.getCustomAudio();

    if (custom.url) {
      this.playCustomAudioLoop(custom.url);
    } else {
      this.startAudioSynthesizerAlarm();
    }

    // Start repeating haptic vibration
    this.startVibrationPattern();

    // Trigger native local notification
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'WAKE UP! You are near your station',
              body: `Approaching target area: ${targetName}. Prepare to alight!`,
              id: 9991,
              schedule: { at: new Date(Date.now() + 100) },
              sound: 'alarm.wav',
              actionTypeId: 'DISMISS_ALARM',
              extra: { targetName },
              ongoing: true,
              autoCancel: false,
            },
          ],
        });
      } catch (err) {
        console.warn('Local notification schedule error:', err);
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('WAKE UP! You are near your station', {
          body: `Approaching target area: ${targetName}. Prepare to alight!`,
          icon: '/favicon.ico',
          requireInteraction: true,
        });
      } catch (err) {
        console.warn('Web notification error:', err);
      }
    }
  }

  /**
   * Plays user's custom uploaded mobile audio in a continuous loop
   */
  private static playCustomAudioLoop(dataUrl: string): void {
    try {
      this.customAudioElement = new Audio(dataUrl);
      this.customAudioElement.loop = true;
      this.customAudioElement.play().catch((err) => {
        console.warn('Custom audio playback failed, falling back to synthesizer:', err);
        this.startAudioSynthesizerAlarm();
      });
    } catch (err) {
      console.warn('Audio element error, falling back to synthesizer:', err);
      this.startAudioSynthesizerAlarm();
    }
  }

  /**
   * Stops active ringing audio and haptic feedback
   */
  public static async stopWakeUp(): Promise<void> {
    this.isAlarmRinging = false;

    if (this.customAudioElement) {
      try {
        this.customAudioElement.pause();
        this.customAudioElement.currentTime = 0;
      } catch (e) {
        // Ignore
      }
      this.customAudioElement = null;
    }

    if (this.audioTimer) {
      clearInterval(this.audioTimer);
      this.audioTimer = null;
    }

    if (this.vibrationTimer) {
      clearInterval(this.vibrationTimer);
      this.vibrationTimer = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (e) {
        // Ignore close error
      }
      this.audioContext = null;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 9991 }] });
      } catch (e) {
        // Ignore cancel error
      }
    }
  }

  /**
   * Triggers a test alarm for user verification
   */
  public static async testWakeUp(): Promise<void> {
    await this.triggerWakeUp('Test Destination');
    setTimeout(() => {
      this.stopWakeUp();
    }, 4000);
  }

  public static isRinging(): boolean {
    return this.isAlarmRinging;
  }

  /**
   * Creates a loud dual-frequency alert siren using Web Audio API
   */
  private static startAudioSynthesizerAlarm(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      let highFreq = true;

      const playTone = () => {
        if (!this.isAlarmRinging || !this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(
          highFreq ? 880 : 1200,
          this.audioContext.currentTime
        );

        gain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + 0.35
        );

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.35);

        highFreq = !highFreq;
      };

      playTone();
      this.audioTimer = setInterval(playTone, 400);
    } catch (err) {
      console.warn('Web Audio synthesis error:', err);
    }
  }

  /**
   * Starts repeating haptic pulses
   */
  private static startVibrationPattern(): void {
    const triggerHaptic = () => {
      if (!this.isAlarmRinging) return;
      if (Capacitor.isNativePlatform()) {
        Haptics.notification({ type: NotificationType.Error }).catch(() => {});
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([500, 250, 500, 250, 500]);
      }
    };

    triggerHaptic();
    this.vibrationTimer = setInterval(triggerHaptic, 1500);
  }
}
