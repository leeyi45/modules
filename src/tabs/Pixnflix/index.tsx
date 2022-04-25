import React, { DragEvent, ChangeEvent } from 'react';
import { Button, ButtonGroup, Divider, NumericInput } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { ErrorLogger, TabsPackage } from '../../bundles/pix_n_flix/types';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  DEFAULT_FPS,
  MAX_HEIGHT,
  MIN_HEIGHT,
  MAX_WIDTH,
  MIN_WIDTH,
  MAX_FPS,
  MIN_FPS,
} from '../../bundles/pix_n_flix/constants';

type Props = {
  children?: never;
  className?: string;
  debuggerContext: any;
};

type SideContentVideoDisplayMode = 'video' | 'still';

type State = {
  width: number;
  height: number;
  FPS: number;
  mode: SideContentVideoDisplayMode;
  useLocalVideo: boolean;
};

type Video = {
  toReplString: () => string;
  init: (
    video: HTMLVideoElement | null,
    canvas: HTMLCanvasElement | null,
    errorLogger: ErrorLogger,
    tabsPackage: TabsPackage
  ) => number[];
  deinit: () => void;
  startVideo: () => void;
  snapPicture: () => void;
  updateFPS: (fps: number) => void;
  updateDimensions: (width: number, height: number) => void;
};

class PixNFlix extends React.Component<Props, State> {
  private $video: HTMLVideoElement | null = null;

  private $canvas: HTMLCanvasElement | null = null;

  private tabsPackage: TabsPackage;

  private pixNFlix: Video;

  constructor(props: Props) {
    super(props);
    this.state = {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      FPS: DEFAULT_FPS,
      useLocalVideo: false,
      mode: 'video' as SideContentVideoDisplayMode,
    };
    const { debuggerContext } = this.props;
    this.pixNFlix = debuggerContext.result.value;
    this.tabsPackage = {
      handleSwapModes: this.handleSwapModes,
    };
  }

  public componentDidMount() {
    if (this.isPixNFlix()) {
      this.setupVideoService();
      window.addEventListener('beforeunload', this.pixNFlix.deinit);
    }
  }

  public componentWillUnmount() {
    if (this.isPixNFlix()) {
      this.closeVideo();
      window.removeEventListener('beforeunload', this.pixNFlix.deinit);
    }
  }

  private onClickStill = () => {
    const { mode } = this.state;
    if (mode === ('still' as SideContentVideoDisplayMode)) {
      this.handleSnapPicture();
    } else {
      this.swapModes(mode)();
    }
  };

  public setupVideoService = () => {
    if (this.$video && this.$canvas && this.isPixNFlix()) {
      const { debuggerContext } = this.props;
      this.pixNFlix = debuggerContext.result.value;
      // get the properties of the video in an array
      // [height, width, FPS]
      const videoProperties: number[] = this.pixNFlix.init(
        this.$video,
        this.$canvas,
        this.printError,
        {
          onClickStill: this.onClickStill,
        }
      );
      this.setState({
        height: videoProperties[0],
        width: videoProperties[1],
        FPS: videoProperties[2],
        useLocalVideo: videoProperties[3] === 1,
      });
    }
  };

  public closeVideo = () => {
    if (this.isPixNFlix()) {
      this.pixNFlix.deinit();
    }
  };

  public handleStartVideo = () => {
    if (this.isPixNFlix()) {
      this.pixNFlix.startVideo();
    }
  };

  public handleSnapPicture = () => {
    if (this.isPixNFlix()) {
      this.pixNFlix.snapPicture();
    }
  };

  public handleWidthChange = (width: number) => {
    const { height } = this.state;
    this.handleUpdateDimensions(width, height);
  };

  public handleHeightChange = (height: number) => {
    const { width } = this.state;
    this.handleUpdateDimensions(width, height);
  };

  public handleFPSChange = (fps: number) => {
    if (fps >= MIN_FPS && fps <= MAX_FPS) {
      this.setState({
        FPS: fps,
      });
      if (this.isPixNFlix()) {
        this.pixNFlix.updateFPS(fps);
      }
    }
  };

  public handleUpdateDimensions = (w: number, h: number) => {
    if (
      w >= MIN_WIDTH &&
      w <= MAX_WIDTH &&
      h >= MIN_HEIGHT &&
      h <= MAX_HEIGHT
    ) {
      this.setState({
        width: w,
        height: h,
      });
      if (this.isPixNFlix()) {
        this.pixNFlix.updateDimensions(w, h);
      }
    }
  };

  public loadFileToVideo = (file: File) => {
    const { useLocalVideo } = this.state;
    if (this.$video && useLocalVideo) {
      this.$video.src = URL.createObjectURL(file);
    }
  };

  public handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    this.loadFileToVideo(e.dataTransfer.files[0]);
  };

  public handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  public handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target && e.target.files) {
      this.loadFileToVideo(e.target.files[0]);
    }
  };

  public printError: ErrorLogger = () => {};

  private swapModes = (mode: SideContentVideoDisplayMode) => () => {
    switch (mode) {
      case 'video':
        this.setState(
          (state: State) => ({
            ...state,
            mode: 'still' as SideContentVideoDisplayMode,
          }),
          this.handleSnapPicture
        );
        break;
      // case 'still':
      default:
        this.setState(
          (state: State) => ({
            ...state,
            mode: 'video' as SideContentVideoDisplayMode,
          }),
          this.handleStartVideo
        );
        break;
    }
  };

  private handleSwapModes: () => void = () => {
    const { mode } = this.state;
    this.swapModes(mode)();
  };

  /**
   * Checks if pixNFlix is initialised as the last line (ie. REPL output is '[Pix N Flix]')
   * @returns Boolean if pixNFlix is intialised
   */
  private isPixNFlix() {
    return (
      this.pixNFlix &&
      this.pixNFlix.toReplString &&
      this.pixNFlix.toReplString() === '[Pix N Flix]'
    );
  }

  public render() {
    const { mode, width, height, FPS, useLocalVideo } = this.state;
    const videoIsActive = mode === ('video' as SideContentVideoDisplayMode);
    const stillIsActive = mode === ('still' as SideContentVideoDisplayMode);
    return (
      <div
        className='sa-video'
        onDragOver={this.handleDragOver}
        onDrop={this.handleDrop}
      >
        <div className='sa-video-header'>
          <div className='sa-video-header-element'>
            <ButtonGroup>
              <Button
                className='sa-live-video-button'
                icon={IconNames.VIDEO}
                active={videoIsActive}
                onClick={this.swapModes(mode)}
                text='Live Video'
              />
              <Button
                className='sa-still-image-button'
                icon={IconNames.CAMERA}
                active={stillIsActive}
                onClick={
                  stillIsActive ? this.handleSnapPicture : this.swapModes(mode)
                }
                text='Still Image'
              />
            </ButtonGroup>
          </div>
          <Divider />
          <div className='sa-video-header-element'>
            <div className='sa-video-header-numeric-input'>
              {/* <Tooltip2 content='Change width'> */}
              <NumericInput
                disabled
                leftIcon={IconNames.HORIZONTAL_DISTRIBUTION}
                style={{ width: 70 }}
                value={width}
                onValueChange={this.handleWidthChange}
                minorStepSize={1}
                stepSize={10}
                majorStepSize={100}
                max={MAX_WIDTH}
                min={MIN_WIDTH}
              />
              {/* </Tooltip2> */}
            </div>
            <div className='sa-video-header-numeric-input'>
              {/* <Tooltip2 content='Change height'> */}
              <NumericInput
                disabled
                leftIcon={IconNames.VERTICAL_DISTRIBUTION}
                style={{ width: 70 }}
                value={height}
                onValueChange={this.handleHeightChange}
                minorStepSize={1}
                stepSize={10}
                majorStepSize={100}
                max={MAX_HEIGHT}
                min={MIN_HEIGHT}
              />
              {/* </Tooltip2> */}
            </div>
            <div className='sa-video-header-numeric-input'>
              {/* <Tooltip2 content='Change FPS'> */}
              <NumericInput
                leftIcon={IconNames.STOPWATCH}
                style={{ width: 60 }}
                value={FPS}
                onValueChange={this.handleFPSChange}
                minorStepSize={null}
                stepSize={1}
                majorStepSize={null}
                max={MAX_FPS}
                min={MIN_FPS}
              />
              {/* </Tooltip2> */}
            </div>
          </div>
        </div>
        <div className='sa-video-element'>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={(r) => {
              this.$video = r;
            }}
            autoPlay
            id='livefeed'
            width={DEFAULT_WIDTH}
            height={DEFAULT_HEIGHT}
            style={{ display: 'none' }}
          />
          <canvas
            ref={(r) => {
              this.$canvas = r;
            }}
            width={DEFAULT_WIDTH}
            height={DEFAULT_HEIGHT}
          />
          <br />
          <input
            type='file'
            onChange={this.handleFileUpload}
            style={{ display: useLocalVideo ? 'initial' : 'none' }}
          />
          <p style={{ fontFamily: 'courier' }}>
            Note: Is video lagging? Switch to &apos;still image&apos; or adjust
            FPS rate!
          </p>
        </div>
      </div>
    );
  }
}

export default {
  toSpawn: () => true,
  body: (debuggerContext: any) => (
    <PixNFlix debuggerContext={debuggerContext} />
  ),
  label: 'PixNFlix Live Feed',
  iconName: 'mobile-video',
};
