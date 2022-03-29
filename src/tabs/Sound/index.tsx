/* eslint-disable react/destructuring-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars, jsx-a11y/media-has-caption */
import React from 'react';
import { SoundsModuleState } from '../../bundles/sound/types';
import { DebuggerContext } from '../../typings/type_helpers';
import MultiItemDisplay from '../common/multi_item_display';

/**
 * Tab for Source Academy Sounds Module
 * @author Koh Shang Hui
 * @author Samyukta Sounderraman
 */

export default {
  /**
   * This function will be called to render the module tab in the side contents
   * on Source Academy frontend.
   * @param {DebuggerContext} context
   */
  body: (context: DebuggerContext) => {
    const moduleState = (context.context?.moduleContexts.get(
      'sound'
    ) as SoundsModuleState).audioPlayed;
    const elements = moduleState.map((audio) => (
      <audio
        src={audio.dataUri}
        controls
        id='sound-tab-player'
        style={{ width: '100%' }}
      />
    ));

    return (
      <div>
        <p id='sound-default-text'>
          The sound tab gives you control over your custom sounds. You can play,
          pause, adjust the volume and download your sounds.
          <br />
          <br />
          <MultiItemDisplay elements={elements} />
          <br />
        </p>
      </div>
    );
  },

  /**
   * The Tab's icon tooltip in the side contents on Source Academy frontend.
   */
  label: 'Sounds',

  /**
   * BlueprintJS IconName element's name, used to render the icon which will be
   * displayed in the side contents panel.
   * @see https://blueprintjs.com/docs/#icons
   */
  iconName: 'music',
};
