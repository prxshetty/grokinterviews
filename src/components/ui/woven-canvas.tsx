"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface WovenCanvasProps {
  className?: string;
  particleCount?: number;
  mouseInteractionRadius?: number;
  rotationSpeed?: number;
  opacity?: number;
}

export function WovenCanvas({
  className = "absolute inset-0 z-0",
  particleCount = 50000,
  mouseInteractionRadius = 1.5,
  rotationSpeed = 0.05,
  opacity = 0.8
}: WovenCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();

    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // --- Woven Silk Particle System ---
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    const geometry = new THREE.BufferGeometry();
    const torusKnot = new THREE.TorusKnotGeometry(1.5, 0.5, 200, 32);

    for (let i = 0; i < particleCount; i++) {
        const positionAttribute = torusKnot.attributes.position;
        if (!positionAttribute) continue;
        
        const vertexIndex = i % positionAttribute.count;
        const x = positionAttribute.getX(vertexIndex) + 2; // Shift particles to the right
        const y = positionAttribute.getY(vertexIndex);
        const z = positionAttribute.getZ(vertexIndex);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;

        const color = new THREE.Color();
        color.setHSL(Math.random(), 0.8, isDarkMode ? 0.5 : 0.7);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        velocities[i * 3] = 0;
        velocities[i * 3 + 1] = 0;
        velocities[i * 3 + 2] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.02,
        vertexColors: true,
        blending: isDarkMode ? THREE.NormalBlending : THREE.AdditiveBlending,
        transparent: true,
        opacity: isDarkMode ? 1.0 : opacity,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const handleMouseMove = (event: MouseEvent) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        
        const mouseWorld = new THREE.Vector3(mouse.x * 3, mouse.y * 3, 0);

        if (positions && originalPositions && velocities) {
            for (let i = 0; i < particleCount; i++) {
                const ix = i * 3;
                const iy = i * 3 + 1;
                const iz = i * 3 + 2;
                
                const currentPos = new THREE.Vector3(positions[ix]!, positions[iy]!, positions[iz]!);
                const originalPos = new THREE.Vector3(originalPositions[ix]!, originalPositions[iy]!, originalPositions[iz]!);
                const velocity = new THREE.Vector3(velocities[ix]!, velocities[iy]!, velocities[iz]!);

                const dist = currentPos.distanceTo(mouseWorld);
                if (dist < mouseInteractionRadius) {
                    const force = (mouseInteractionRadius - dist) * 0.01;
                    const direction = new THREE.Vector3().subVectors(currentPos, mouseWorld).normalize();
                    velocity.add(direction.multiplyScalar(force));
                }

                // Return to original position
                const returnForce = new THREE.Vector3().subVectors(originalPos, currentPos).multiplyScalar(0.001);
                velocity.add(returnForce);
                
                // Damping
                velocity.multiplyScalar(0.95);

                // Update positions with velocity
                positions[ix] = positions[ix]! + velocity.x;
                positions[iy] = positions[iy]! + velocity.y;
                positions[iz] = positions[iz]! + velocity.z;
                
                // Store velocity for next frame
                velocities[ix] = velocity.x;
                velocities[iy] = velocity.y;
                velocities[iz] = velocity.z;
            }
        }
        const positionAttribute = geometry.attributes.position;
        if (positionAttribute) {
            positionAttribute.needsUpdate = true;
        }

        points.rotation.y = elapsedTime * rotationSpeed;
        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
            mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
        geometry.dispose();
        material.dispose();
    };
  }, [particleCount, mouseInteractionRadius, rotationSpeed, opacity]);

  return <div ref={mountRef} className={className} />;
}