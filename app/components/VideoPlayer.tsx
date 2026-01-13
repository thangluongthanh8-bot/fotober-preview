/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

const VideoPlayerss = ({ src }: { src: string }) => {
  return (
    <div
      className="player-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        src={src}
        controlsList="nodownload noplaybackrate nofullscreen"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        controls
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
};

export default VideoPlayerss;
