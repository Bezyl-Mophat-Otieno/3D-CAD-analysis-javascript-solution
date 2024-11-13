import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import type { MeasurementData } from './Model';

interface EngineeringAnalysisProps {
  type: 'stress' | 'thermal' | 'motion';
  measurements: MeasurementData | null;
}

// Color scales for different analysis types
const STRESS_COLORS = [
  new THREE.Color('#00ff00'), // Low stress
  new THREE.Color('#ffff00'), // Medium stress
  new THREE.Color('#ff0000')  // High stress
];

const THERMAL_COLORS = [
  new THREE.Color('#0000ff'), // Cold
  new THREE.Color('#ff00ff'), // Medium
  new THREE.Color('#ff0000')  // Hot
];

const MOTION_COLORS = [
  new THREE.Color('#ffffff'), // Static
  new THREE.Color('#00ffff'), // Low velocity
  new THREE.Color('#0000ff')  // High velocity
];

export default function EngineeringAnalysis({ type, measurements }: EngineeringAnalysisProps) {
  const { scene } = useThree();

  const analysisData = useMemo(() => {
    if (!measurements) return null;

    switch (type) {
      case 'stress':
        return calculateStressAnalysis(measurements);
      case 'thermal':
        return calculateThermalAnalysis(measurements);
      case 'motion':
        return calculateMotionAnalysis(measurements);
      default:
        return null;
    }
  }, [type, measurements]);

  useEffect(() => {
    if (!analysisData) return;

    // Create visualization mesh
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vColor;
        attribute vec3 color;
        
        void main() {
          vColor = color;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor, 0.7);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    };
  }, [analysisData, scene]);

  return null;
}

// Analysis calculation functions
function calculateStressAnalysis(measurements: MeasurementData) {
  // Simplified von Mises stress calculation
  const stressPoints = [];
  const colors = [];

  if (measurements.edgeLengths.length > 0) {
    const maxStress = Math.max(...measurements.edgeLengths.map(edge => edge.length));
    
    measurements.edgeLengths.forEach(edge => {
      const stress = edge.length / maxStress;
      const color = interpolateColors(STRESS_COLORS, stress);
      
      // Add stress visualization points
      const [start, end] = edge.vertices;
      const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      
      stressPoints.push(midPoint);
      colors.push(color);
    });
  }

  return { points: stressPoints, colors };
}

function calculateThermalAnalysis(measurements: MeasurementData) {
  // Simplified thermal analysis based on surface area
  const thermalPoints = [];
  const colors = [];

  if (measurements.area > 0) {
    const numPoints = Math.ceil(measurements.area / 100); // One point per 100 square units
    
    for (let i = 0; i < numPoints; i++) {
      const temperature = Math.random(); // Simulate temperature distribution
      const color = interpolateColors(THERMAL_COLORS, temperature);
      
      // Generate points distributed across the surface
      const point = generateRandomSurfacePoint(measurements);
      thermalPoints.push(point);
      colors.push(color);
    }
  }

  return { points: thermalPoints, colors };
}

function calculateMotionAnalysis(measurements: MeasurementData) {
  // Simplified motion analysis based on edge lengths
  const motionPoints = [];
  const colors = [];

  measurements.edgeLengths.forEach(edge => {
    const [start, end] = edge.vertices;
    const velocity = edge.length / measurements.maxLength;
    const color = interpolateColors(MOTION_COLORS, velocity);
    
    // Add motion vectors
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const motionVector = direction.multiplyScalar(velocity * 10);
    
    motionPoints.push(start, end);
    colors.push(color, color);
  });

  return { points: motionPoints, colors };
}

// Helper functions
function interpolateColors(colors: THREE.Color[], t: number): THREE.Color {
  if (colors.length === 1) return colors[0];
  
  const segment = (colors.length - 1) * t;
  const index = Math.floor(segment);
  const fraction = segment - index;
  
  if (index >= colors.length - 1) return colors[colors.length - 1];
  
  const color1 = colors[index];
  const color2 = colors[index + 1];
  
  return new THREE.Color().lerpColors(color1, color2, fraction);
}

function generateRandomSurfacePoint(measurements: MeasurementData): THREE.Vector3 {
  // Simple random point generation within the measured area
  const randomEdge = measurements.edgeLengths[
    Math.floor(Math.random() * measurements.edgeLengths.length)
  ];
  
  const [start, end] = randomEdge.vertices;
  const t = Math.random();
  
  return new THREE.Vector3().lerpVectors(start, end, t);
}