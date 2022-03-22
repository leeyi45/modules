/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { CurveDrawn } from '../../bundles/curve/curves_webgl';
import { CurveAnimation, CurveModuleState } from '../../bundles/curve/types';
import { glAnimation } from '../../typings/anim_types';
import MultiItemDisplay from '../../typings/multi_item';
import { DebuggerContext } from '../../typings/type_helpers';
import Curve3DAnimationCanvas from './3Dcurve_anim_canvas';
import CurveCanvas from './curve_canvas';
import CurveCanvas3D, { AnimationCanvas } from './curve_canvas3d';

export default {
  toSpawn: (context: DebuggerContext) => {
    const moduleContext = context.context?.moduleContexts.get('curve');
    if (moduleContext == null) {
      return false;
    }

    const moduleState = moduleContext.state as CurveModuleState;
    if (moduleState == null) {
      return false;
    }

    return moduleState.drawnCurves.length > 0;
  },
  body: (context: DebuggerContext) => {
    const moduleContext = context.context?.moduleContexts.get('curve');
    const moduleState = moduleContext!.state as CurveModuleState;

    const canvases = moduleState!.drawnCurves.map((curve) => {
      if (glAnimation.isAnimation(curve)) {
        const anim = curve as CurveAnimation;
        return anim.is3D ? (
          <Curve3DAnimationCanvas animation={anim} />
        ) : (
          <AnimationCanvas animation={anim} />
        );
      }
      return (curve as CurveDrawn).is3D() ? (
        <CurveCanvas3D curve={curve as CurveDrawn} />
      ) : (
        <CurveCanvas curve={curve as CurveDrawn} />
      );
    });

    return <MultiItemDisplay elements={canvases} />;
  },
  label: 'Curves Tab',
  iconName: 'media', // See https://blueprintjs.com/docs/#icons for more options
};
