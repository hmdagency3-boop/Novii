import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

export function useBackgroundMusic() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let synth: Tone.PolySynth | null = null;
    let bass: Tone.Synth | null = null;
    let pad: Tone.PolySynth | null = null;
    let reverb: Tone.Reverb | null = null;
    let delay: Tone.FeedbackDelay | null = null;
    let filter: Tone.Filter | null = null;
    let melodySeq: Tone.Sequence | null = null;
    let bassSeq: Tone.Sequence | null = null;
    let padSeq: Tone.Sequence | null = null;

    const setup = async () => {
      await Tone.start();
      Tone.getTransport().bpm.value = 110;

      reverb = new Tone.Reverb({ decay: 4, wet: 0.45 }).toDestination();
      delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0.25 }).connect(reverb);
      filter = new Tone.Filter({ frequency: 4000, type: 'lowpass', rolloff: -24 }).connect(delay);

      const masterVol = new Tone.Volume(-6).toDestination();

      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1.2 },
      }).connect(filter);
      synth.connect(masterVol);
      synth.volume.value = -4;

      bass = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.5 },
      }).toDestination();
      bass.connect(masterVol);
      bass.volume.value = -8;

      pad = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.8, decay: 0.5, sustain: 0.7, release: 2 },
      });
      const padFilter = new Tone.Filter({ frequency: 800, type: 'lowpass' }).connect(reverb!);
      pad.connect(padFilter);
      pad.volume.value = -18;

      const melody = [
        'A4', null, 'C5', null, 'E5', null, 'D5', 'B4',
        'A4', null, 'G4', null, 'A4', 'C5', null, null,
      ];

      const bassNotes = [
        'A2', null, 'A2', null, 'F2', null, 'F2', null,
        'G2', null, 'G2', null, 'E2', null, 'E2', null,
      ];

      melodySeq = new Tone.Sequence(
        (time, note) => {
          if (note) synth!.triggerAttackRelease(note, '8n', time);
        },
        melody,
        '8n'
      );

      bassSeq = new Tone.Sequence(
        (time, note) => {
          if (note) bass!.triggerAttackRelease(note, '4n', time);
        },
        bassNotes,
        '8n'
      );

      padSeq = new Tone.Sequence(
        (time, note) => {
          if (note) pad!.triggerAttackRelease([note, 'C3', 'E3'], '2n', time);
        },
        ['A2', null, null, null, 'F2', null, null, null],
        '4n'
      );

      melodySeq.start(0);
      bassSeq.start(0);
      padSeq.start(0);

      Tone.getTransport().start();
    };

    const handleInteraction = () => {
      setup();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    setup();

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      Tone.getTransport().stop();
      melodySeq?.dispose();
      bassSeq?.dispose();
      padSeq?.dispose();
      synth?.dispose();
      bass?.dispose();
      pad?.dispose();
      reverb?.dispose();
      delay?.dispose();
      filter?.dispose();
    };
  }, []);
}
