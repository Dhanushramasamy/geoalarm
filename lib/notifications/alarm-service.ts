import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export class AlarmService {
  private static audioContext: AudioContext | null = null;
  private static isAlarmRinging: boolean = false;
  private static audioTimer: any = null;
  private static vibrationTimer: any = null;

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
    // Web Notification API
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
    return true;
  }

  /**
   * Triggers the full wake-up alarm sequence: sound, vibration, and local notification
   */
  public static async triggerWakeUp(targetName: string): Promise<void> {
    if (this.isAlarmRinging) return;
    this.isAlarmRinging = true;

    // 1. Play offline audio synthesizer chime loop
    this.startAudioSynthesizerAlarm();

    // 2. Start repeating haptic vibration
    this.startVibrationPattern();

    // 3. Trigger native local notification
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
   * Stops active ringing audio and haptic feedback
   */
  public static async stopWakeUp(): Promise<void> {
    this.isAlarmRinging = false;

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
   * Triggers a 3-second test alarm for user verification
   */
  public static async testWakeUp(): Promise<void> {
    await this.triggerWakeUp('Test Destination (Bengaluru)');
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

        // High alarm pitch alternate: 880Hz / 1200Hz
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
