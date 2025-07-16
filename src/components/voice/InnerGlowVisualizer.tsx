import React, { useRef, useEffect, useState } from 'react';

interface InnerGlowVisualizerProps {
  values: Float32Array;
  color?: string;
  startHue?: number;
  endHue?: number;
  colorTopLeft?: string;
  colorTopRight?: string;
  colorBottomLeft?: string;
  colorBottomRight?: string;
  sideVisible?: number;
  deformation?: number;
  blur?: number;
}

const InnerGlowVisualizer: React.FC<InnerGlowVisualizerProps> = ({
  values,
  color,
  startHue,
  endHue,
  colorTopLeft,
  colorTopRight,
  colorBottomLeft,
  colorBottomRight,
  sideVisible = 5,
  deformation = 10,
  blur = 12
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contentRect, setContentRect] = useState<DOMRectReadOnly | null>(null);

  // ResizeObserver to track canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentRect(entry.contentRect);
      }
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !contentRect) return;

    const ctx = canvas.getContext('2d')!;

    // Update canvas size
    canvas.width = Math.round(contentRect.width) * 2;
    canvas.height = Math.round(contentRect.height) * 2;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (color) ctx.fillStyle = color;

    ctx.beginPath();

    const outerSize = 20;

    if (color) ctx.fillStyle = color;
    else if (startHue !== undefined && endHue !== undefined) {
      // create linear gradient
      const gradient = ctx.createLinearGradient(
        0,
        canvas.height / 3,
        canvas.width,
        (canvas.height * 2) / 3
      );
      gradient.addColorStop(0, `hsl(${startHue % 360}, 100%, 30%)`);
      gradient.addColorStop(1, `hsl(${endHue % 360}, 100%, 50%)`);
      ctx.fillStyle = gradient;
    }

    // left side
    if (color) ctx.fillStyle = color;
    else if (colorTopLeft && colorBottomLeft) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, colorTopLeft);
      gradient.addColorStop(1, colorBottomLeft);
      ctx.fillStyle = gradient;
    }
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(-outerSize, canvas.height);
    ctx.lineTo(-outerSize, 0);
    ctx.lineTo(0, 0);
    for (let i = 0; i < values.length; i++) {
      const amplitude = values[i] || 0;
      ctx.lineTo(amplitude * deformation + sideVisible, (i / values.length) * canvas.height);
    }
    ctx.fill();

    // bottom side
    if (color) ctx.fillStyle = color;
    else if (colorBottomLeft && colorBottomRight) {
      const gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, canvas.height);
      gradient.addColorStop(0, colorBottomLeft);
      gradient.addColorStop(1, colorBottomRight);
      ctx.fillStyle = gradient;
    }
    ctx.beginPath();
    ctx.moveTo(canvas.width, canvas.height);
    ctx.lineTo(canvas.width, canvas.height + outerSize);
    ctx.lineTo(0, canvas.height + outerSize);
    ctx.lineTo(0, canvas.height);
    for (let i = 0; i < values.length; i++) {
      const amplitude = values[i] || 0;
      ctx.lineTo(
        canvas.width * (i / values.length),
        canvas.height - (amplitude * deformation + sideVisible)
      );
    }
    ctx.fill();

    // right side
    if (color) ctx.fillStyle = color;
    else if (colorTopRight && colorBottomRight) {
      const gradient = ctx.createLinearGradient(canvas.width, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, colorTopRight);
      gradient.addColorStop(1, colorBottomRight);
      ctx.fillStyle = gradient;
    }
    ctx.beginPath();
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(canvas.width + outerSize, 0);
    ctx.lineTo(canvas.width + outerSize, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    for (let i = 0; i < values.length; i++) {
      const amplitude = values[i] || 0;
      ctx.lineTo(
        canvas.width - (amplitude * deformation + sideVisible),
        (1 - i / values.length) * canvas.height
      );
    }
    ctx.fill();

    // top side
    if (color) ctx.fillStyle = color;
    else if (colorTopLeft && colorTopRight) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, colorTopLeft);
      gradient.addColorStop(1, colorTopRight);
      ctx.fillStyle = gradient;
    }
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -outerSize);
    ctx.lineTo(canvas.width, -outerSize);
    ctx.lineTo(canvas.width, 0);
    for (let i = 0; i < values.length; i++) {
      const amplitude = values[i] || 0;
      ctx.lineTo(canvas.width * (1 - i / values.length), amplitude * deformation + sideVisible);
    }
    ctx.fill();
  }, [contentRect, values, color, startHue, endHue, colorTopLeft, colorTopRight, colorBottomLeft, colorBottomRight, sideVisible, deformation]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        filter: `blur(${blur}px)`,
        width: '100%',
        height: '100%'
      }}
    />
  );
};

export default InnerGlowVisualizer;