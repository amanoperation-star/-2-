import React, { useEffect, useState } from 'react';
import { AdhanMosqueScene, AdhanMotionStyle } from '../utils/adhanScenesData';

interface AnimatedAdhanBackdropProps {
  scenes: AdhanMosqueScene[];
  activeIndex: number;
  motionStyle: AdhanMotionStyle;
  variant?: 'hero' | 'arch' | 'ambient-blur';
}

const NOORANI_MOTES = [
  { left: '14%', bottom: '18%', size: 4, delay: '0s', duration: '8.5s', color: '#F3D078' },
  { left: '26%', bottom: '28%', size: 3, delay: '1.6s', duration: '9.5s', color: '#34D399' },
  { left: '38%', bottom: '14%', size: 5, delay: '3.1s', duration: '10.2s', color: '#F3D078' },
  { left: '52%', bottom: '22%', size: 3, delay: '0.8s', duration: '8.8s', color: '#FDE68A' },
  { left: '64%', bottom: '16%', size: 4, delay: '2.4s', duration: '9.8s', color: '#34D399' },
  { left: '76%', bottom: '26%', size: 3, delay: '4.0s', duration: '9.0s', color: '#F3D078' },
  { left: '86%', bottom: '20%', size: 4, delay: '1.2s', duration: '10.5s', color: '#FDE68A' },
];

export const AnimatedAdhanBackdrop: React.FC<AnimatedAdhanBackdropProps> = ({
  scenes,
  activeIndex,
  motionStyle,
  variant = 'hero',
}) => {
  const safeScenes = scenes.length > 0 ? scenes : [];
  const activeScene = safeScenes[activeIndex % Math.max(1, safeScenes.length)];
  const [videoReady, setVideoReady] = useState(false);
  const [videoErrored, setVideoErrored] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setVideoReady(false);
    setVideoErrored(false);
  }, [activeScene?.videoUrl, motionStyle]);

  if (!activeScene) return null;

  const showVideoLayer =
    variant !== 'ambient-blur' &&
    (motionStyle === 'hybrid' || motionStyle === 'video') &&
    Boolean(activeScene.videoUrl) &&
    !videoErrored;

  const showNooraniLayer =
    variant !== 'ambient-blur' && (motionStyle === 'hybrid' || motionStyle === 'cinematic');

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* 1. Instant CSS Atmospheric Fallback */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{ background: activeScene.cssFallback }}
      />

      {/* 2. Cross-Fading Animated Mosque Photography Layers */}
      {safeScenes.map((scene, idx) => {
        const isActive = idx === activeIndex;
        const hasImgFailed = Boolean(failedImages[scene.id]);
        return (
          <div
            key={scene.id}
            aria-hidden="true"
            className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${
              isActive ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
            }`}
          >
            {!hasImgFailed ? (
              <img
                src={scene.imageUrl}
                alt={scene.nameAr}
                referrerPolicy="no-referrer"
                onError={() => setFailedImages((prev) => ({ ...prev, [scene.id]: true }))}
                className={`w-full h-full object-cover object-center ${
                  variant === 'ambient-blur'
                    ? 'blur-xl opacity-35 scale-110'
                    : variant === 'arch'
                      ? `${scene.cameraClass}`
                      : `${scene.cameraClass} ${motionStyle === 'video' ? 'brightness-90' : ''}`
                }`}
              />
            ) : (
              <div className="w-full h-full" style={{ background: scene.cssFallback }} />
            )}
          </div>
        );
      })}

      {/* 3. Live Atmospheric Sky & Cloud Video Overlay */}
      {showVideoLayer && (
        <video
          key={activeScene.videoUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoErrored(true)}
          className={`absolute inset-0 z-[2] w-full h-full object-cover mix-blend-screen transition-opacity duration-1000 ${
            videoReady ? (motionStyle === 'video' ? 'opacity-50' : 'opacity-30') : 'opacity-0'
          }`}
        >
          <source src={activeScene.videoUrl} type="video/mp4" />
        </video>
      )}

      {/* 4. Noorani Atmospheric Glow & Rising Light Motes */}
      {showNooraniLayer && (
        <div className="absolute inset-0 z-[3] overflow-hidden">
          <div
            className="absolute inset-0 adhan-aurora-breathe transition-all duration-1000"
            style={{ background: activeScene.auraGradient }}
          />
          {NOORANI_MOTES.map((mote, i) => (
            <span
              key={i}
              className="absolute rounded-full adhan-mote-rise"
              style={{
                left: mote.left,
                bottom: mote.bottom,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                backgroundColor: mote.color,
                boxShadow: `0 0 ${mote.size * 3}px ${mote.color}`,
                animationDelay: mote.delay,
                animationDuration: mote.duration,
              }}
            />
          ))}
        </div>
      )}

      {/* 5. Measured Readability Scrims */}
      {variant === 'hero' && (
        <>
          <div className="absolute inset-0 z-[4] bg-gradient-to-t from-[#020814] via-black/25 to-black/60" />
          <div className="absolute inset-0 z-[4] bg-gradient-to-r from-black/35 via-transparent to-black/35" />
        </>
      )}
      {variant === 'arch' && (
        <div className="absolute inset-0 z-[4] bg-gradient-to-t from-slate-950 via-transparent to-black/35" />
      )}
      {variant === 'ambient-blur' && (
        <div className="absolute inset-0 z-[4] bg-gradient-to-br from-slate-950 via-slate-950/90 to-slate-900/95" />
      )}
    </div>
  );
};
