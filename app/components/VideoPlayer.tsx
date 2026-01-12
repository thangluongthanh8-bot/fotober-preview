/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"; // Quan trọng vì ReactPlayer chạy ở client side

import React from "react";
import ReactPlayer from "react-player";




const VideoPlayerss = ({ src }:{ src:string }) => {
  



  return (
    <div className="player-wrapper">
      <ReactPlayer
        src={src}
        className="react-player"
        playing={false}
        controls={true}
        // light={`/logo.webp`}
        width="100%"
        height="100%"
        config={{
          file: {
            attributes: {
              controlsList: "nodownload",
              onContextMenu: (e:any) => e.preventDefault(),
            },
          },
        } as any}
      />
    </div>
  );
};

export default VideoPlayerss;
