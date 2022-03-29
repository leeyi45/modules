import { ModuleState } from 'js-slang';
import {
  // Constructor/Accessors/Typecheck
  make_sound,
  get_wave,
  get_duration,
  is_sound,
  // Play-related
  play,
  play_concurrently,
  stop,
  // Recording
  init_record,
  record,
  record_for,
  // Composition and Envelopes
  consecutively,
  simultaneously,
  phase_mod,
  adsr,
  stacking_adsr,
  // Basic waveforms
  noise_sound,
  silence_sound,
  sine_sound,
  sawtooth_sound,
  triangle_sound,
  square_sound,
  // MIDI
  letter_name_to_midi_note,
  midi_note_to_frequency,
  letter_name_to_frequency,
  // Instruments
  bell,
  cello,
  piano,
  trombone,
  violin,
  audioPlayed,
} from './functions';
import { SoundsModuleState } from './types';

export default function sounds(params, contexts: Map<string, ModuleState>) {
  // Update the module's global context
  let moduleState: SoundsModuleState;
  if (contexts.has('sound')) {
    moduleState = contexts.get('sound') as SoundsModuleState;
  } else {
    moduleState = new SoundsModuleState(audioPlayed);
    contexts.set('sound', moduleState);
  }

  return {
    // Constructor/Accessors/Typecheck
    make_sound,
    get_wave,
    get_duration,
    is_sound,
    // Play-related
    play,
    play_concurrently,
    stop,
    // Recording
    init_record,
    record,
    record_for,
    // Composition and Envelopes
    consecutively,
    simultaneously,
    phase_mod,
    adsr,
    stacking_adsr,
    // Basic waveforms
    noise_sound,
    silence_sound,
    sine_sound,
    sawtooth_sound,
    triangle_sound,
    square_sound,
    // MIDI
    letter_name_to_midi_note,
    midi_note_to_frequency,
    letter_name_to_frequency,
    // Instruments
    bell,
    cello,
    piano,
    trombone,
    violin,
  };
}
