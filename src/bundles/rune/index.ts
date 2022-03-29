import { ModuleState } from 'js-slang';
import {
  square,
  blank,
  rcross,
  sail,
  triangle,
  corner,
  nova,
  circle,
  heart,
  pentagram,
  ribbon,
  from_url,
  scale_independent,
  scale,
  translate,
  rotate,
  stack_frac,
  stack,
  stackn,
  quarter_turn_left,
  quarter_turn_right,
  turn_upside_down,
  beside_frac,
  beside,
  flip_vert,
  flip_horiz,
  make_cross,
  repeat_pattern,
  overlay_frac,
  overlay,
  color,
  random_color,
  red,
  pink,
  purple,
  indigo,
  blue,
  green,
  yellow,
  orange,
  brown,
  black,
  white,
  show,
  anaglyph,
  hollusion_magnitude,
  hollusion,
  drawnRunes,
  animate_rune,
  animate_anaglyph,
} from './functions';
import { RunesModuleState } from './rune';

/**
 * Bundle for Source Academy Runes module
 * @author Hou Ruomu
 */

export default function runes(
  params: Map<string, any>,
  contexts: Map<string, ModuleState>
) {
  let moduleState: RunesModuleState;
  if (contexts.has('rune')) {
    moduleState = contexts.get('rune') as RunesModuleState;
  } else {
    moduleState = new RunesModuleState(drawnRunes);
    contexts.set('rune', moduleState);
  }

  return {
    square,
    blank,
    rcross,
    sail,
    triangle,
    corner,
    nova,
    circle,
    heart,
    pentagram,
    ribbon,

    from_url,

    scale_independent,
    scale,
    translate,
    rotate,
    stack_frac,
    stack,
    stackn,
    quarter_turn_left,
    quarter_turn_right,
    turn_upside_down,
    beside_frac,
    beside,
    flip_vert,
    flip_horiz,
    make_cross,
    repeat_pattern,

    overlay_frac,
    overlay,

    color,
    random_color,
    red,
    pink,
    purple,
    indigo,
    blue,
    green,
    yellow,
    orange,
    brown,
    black,
    white,

    show,
    anaglyph,
    hollusion_magnitude,
    hollusion,
    animate_rune,
    animate_anaglyph,
  };
}
