import { useRef, useState, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';

type ModelProps = {
  url: string;
  onMeasure: (data: MeasurementData | null) => void;
  showWireframe: boolean;
};

export interface MeasurementData {
  type: 'circle' | 'rectangle' | 'complex';
  area: number;
  perimeter: number;
  maxLength: number;
  minLength: number;
  edgeLengths: Array<{
    id: number;
    length: number;
    vertices: [THREE.Vector3, THREE.Vector3];
    color: string;
  }>;
  faceIndex?: number;
}

const EDGE_COLORS = [
  '#FF3B30', // Red
  '#34C759', // Green
  '#007AFF', // Blue
  '#FF9500', // Orange
  '#5856D6', // Purple
  '#FF2D55', // Pink
  '#5AC8FA', // Light Blue
  '#FFCC00', // Yellow
];

const HIGHLIGHT_COLOR = new THREE.Color('#2196F3');
const DEFAULT_COLOR = new THREE.Color('#6e6e6e');
const NORMAL_THRESHOLD = 0.95; // Cosine of maximum angle between face normals to be considered coplanar

export default function Model({ url, onMeasure, showWireframe }: ModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useLoader(STLLoader, url);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number | null>(null);
  const edgeLinesRef = useRef<THREE.Group>(new THREE.Group());
  
  useEffect(() => {
    if (meshRef.current && geometry) {
      const positions = geometry.attributes.position;
      const colors = new Float32Array(positions.count * 3);
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = DEFAULT_COLOR.r;
        colors[i + 1] = DEFAULT_COLOR.g;
        colors[i + 2] = DEFAULT_COLOR.b;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      meshRef.current.add(edgeLinesRef.current);
    }

    return () => {
      edgeLinesRef.current.children.forEach(child => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      edgeLinesRef.current.clear();
    };
  }, [geometry]);

  const findConnectedFaces = (startFaceIndex: number): number[] => {
    const connectedFaces = new Set<number>([startFaceIndex]);
    const position = geometry.attributes.position;
    const startNormal = new THREE.Vector3();
    const tempNormal = new THREE.Vector3();
    const startFaceVertices = [
      new THREE.Vector3().fromBufferAttribute(position, startFaceIndex * 3),
      new THREE.Vector3().fromBufferAttribute(position, startFaceIndex * 3 + 1),
      new THREE.Vector3().fromBufferAttribute(position, startFaceIndex * 3 + 2)
    ];
    
    // Calculate start face normal
    const v1 = new THREE.Vector3().subVectors(startFaceVertices[1], startFaceVertices[0]);
    const v2 = new THREE.Vector3().subVectors(startFaceVertices[2], startFaceVertices[0]);
    startNormal.crossVectors(v1, v2).normalize();

    // Create a map of vertex positions to face indices
    const vertexToFaces = new Map<string, number[]>();
    const numFaces = position.count / 3;
    
    for (let i = 0; i < numFaces; i++) {
      const vertices = [
        new THREE.Vector3().fromBufferAttribute(position, i * 3),
        new THREE.Vector3().fromBufferAttribute(position, i * 3 + 1),
        new THREE.Vector3().fromBufferAttribute(position, i * 3 + 2)
      ];
      
      vertices.forEach(vertex => {
        const key = `${vertex.x},${vertex.y},${vertex.z}`;
        const faces = vertexToFaces.get(key) || [];
        faces.push(i);
        vertexToFaces.set(key, faces);
      });
    }

    // Find connected faces with similar normals
    const processedFaces = new Set<number>();
    const facesToProcess = [startFaceIndex];

    while (facesToProcess.length > 0) {
      const currentFace = facesToProcess.pop()!;
      if (processedFaces.has(currentFace)) continue;
      processedFaces.add(currentFace);

      const currentVertices = [
        new THREE.Vector3().fromBufferAttribute(position, currentFace * 3),
        new THREE.Vector3().fromBufferAttribute(position, currentFace * 3 + 1),
        new THREE.Vector3().fromBufferAttribute(position, currentFace * 3 + 2)
      ];

      // Find adjacent faces through shared vertices
      currentVertices.forEach(vertex => {
        const key = `${vertex.x},${vertex.y},${vertex.z}`;
        const adjacentFaces = vertexToFaces.get(key) || [];
        
        adjacentFaces.forEach(adjacentFace => {
          if (processedFaces.has(adjacentFace)) return;

          // Check if normals are similar (coplanar)
          const adjVertices = [
            new THREE.Vector3().fromBufferAttribute(position, adjacentFace * 3),
            new THREE.Vector3().fromBufferAttribute(position, adjacentFace * 3 + 1),
            new THREE.Vector3().fromBufferAttribute(position, adjacentFace * 3 + 2)
          ];
          
          const v1 = new THREE.Vector3().subVectors(adjVertices[1], adjVertices[0]);
          const v2 = new THREE.Vector3().subVectors(adjVertices[2], adjVertices[0]);
          tempNormal.crossVectors(v1, v2).normalize();

          if (tempNormal.dot(startNormal) > NORMAL_THRESHOLD) {
            connectedFaces.add(adjacentFace);
            facesToProcess.push(adjacentFace);
          }
        });
      });
    }

    return Array.from(connectedFaces);
  };

  const getUniqueVertices = (faceIndices: number[]): THREE.Vector3[] => {
    const uniqueVertices = new Map<string, THREE.Vector3>();
    const position = geometry.attributes.position;

    faceIndices.forEach(faceIndex => {
      for (let i = 0; i < 3; i++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(
          position,
          faceIndex * 3 + i
        );
        const key = `${vertex.x},${vertex.y},${vertex.z}`;
        uniqueVertices.set(key, vertex);
      }
    });

    return Array.from(uniqueVertices.values());
  };

  const findEdges = (vertices: THREE.Vector3[]): [THREE.Vector3, THREE.Vector3][] => {
    const edges = new Set<string>();
    const edgesList: [THREE.Vector3, THREE.Vector3][] = [];

    // Helper function to create a unique key for an edge
    const getEdgeKey = (v1: THREE.Vector3, v2: THREE.Vector3) => {
      const [a, b] = [v1, v2].sort((a, b) => 
        a.x !== b.x ? a.x - b.x : a.y !== b.y ? a.y - b.y : a.z - b.z
      );
      return `${a.x},${a.y},${a.z}-${b.x},${b.y},${b.z}`;
    };

    // Find edges by checking all vertex pairs
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const v1 = vertices[i];
        const v2 = vertices[j];
        const edgeKey = getEdgeKey(v1, v2);

        if (!edges.has(edgeKey)) {
          edges.add(edgeKey);
          edgesList.push([v1, v2]);
        }
      }
    }

    return edgesList;
  };

  const highlightEdges = (edges: [THREE.Vector3, THREE.Vector3][]) => {
    edgeLinesRef.current.children.forEach(child => {
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
    edgeLinesRef.current.clear();

    edges.forEach((edge, index) => {
      const [start, end] = edge;
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const material = new THREE.LineBasicMaterial({ 
        color: new THREE.Color(EDGE_COLORS[index % EDGE_COLORS.length]),
        linewidth: 3,
        transparent: true,
        opacity: 0.8
      });
      const line = new THREE.Line(geometry, material);
      edgeLinesRef.current.add(line);
    });
  };

  const handleClick = (event: THREE.Intersection<THREE.Mesh>) => {
    event.stopPropagation();
    if (!meshRef.current || !geometry.attributes.color) return;

    const face = event.face;
    if (!face) return;

    // Reset previous face colors
    if (selectedFaceIndex !== null) {
      const colors = geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = DEFAULT_COLOR.r;
        colors[i + 1] = DEFAULT_COLOR.g;
        colors[i + 2] = DEFAULT_COLOR.b;
      }
    }

    // Find all connected faces that form the complete geometric face
    const faceIndex = Math.floor(face.a / 3);
    const connectedFaces = findConnectedFaces(faceIndex);
    
    // Highlight all connected faces
    const colors = geometry.attributes.color.array as Float32Array;
    connectedFaces.forEach(faceIdx => {
      for (let i = faceIdx * 9; i < faceIdx * 9 + 9; i += 3) {
        colors[i] = HIGHLIGHT_COLOR.r;
        colors[i + 1] = HIGHLIGHT_COLOR.g;
        colors[i + 2] = HIGHLIGHT_COLOR.b;
      }
    });
    
    geometry.attributes.color.needsUpdate = true;

    // Get unique vertices and find edges
    const vertices = getUniqueVertices(connectedFaces);
    const edges = findEdges(vertices);
    
    // Calculate measurements
    const measurements = calculateMeasurements(vertices, edges);
    setSelectedFaceIndex(faceIndex);
    onMeasure(measurements);

    // Highlight edges
    highlightEdges(edges);
  };

  const calculateMeasurements = (
    vertices: THREE.Vector3[],
    edges: [THREE.Vector3, THREE.Vector3][]
  ): MeasurementData => {
    const edgeLengths = edges.map((edge, index) => ({
      id: index,
      length: edge[0].distanceTo(edge[1]),
      vertices: edge,
      color: EDGE_COLORS[index % EDGE_COLORS.length]
    }));

    const lengths = edgeLengths.map(e => e.length);
    const maxLength = Math.max(...lengths);
    const minLength = Math.min(...lengths);
    const perimeter = lengths.reduce((sum, length) => sum + length, 0);
    
    // Calculate area using triangulation
    const area = calculateArea(vertices);
    const type = determineShapeType(vertices, edges);

    return {
      type,
      area,
      perimeter,
      maxLength,
      minLength,
      edgeLengths
    };
  };

  const calculateArea = (vertices: THREE.Vector3[]): number => {
    if (vertices.length < 3) return 0;

    // Use ear clipping algorithm for triangulation
    const normal = new THREE.Vector3();
    const v1 = new THREE.Vector3().subVectors(vertices[1], vertices[0]);
    const v2 = new THREE.Vector3().subVectors(vertices[2], vertices[0]);
    normal.crossVectors(v1, v2).normalize();

    let totalArea = 0;
    for (let i = 2; i < vertices.length; i++) {
      const triangle = new THREE.Triangle(vertices[0], vertices[i - 1], vertices[i]);
      totalArea += triangle.getArea();
    }

    return totalArea;
  };

  const determineShapeType = (
    vertices: THREE.Vector3[],
    edges: [THREE.Vector3, THREE.Vector3][]
  ): 'circle' | 'rectangle' | 'complex' => {
    if (isRectangular(vertices, edges)) return 'rectangle';
    if (isCircular(vertices)) return 'circle';
    return 'complex';
  };

  const isRectangular = (
    vertices: THREE.Vector3[],
    edges: [THREE.Vector3, THREE.Vector3][]
  ): boolean => {
    if (vertices.length !== 4 || edges.length !== 4) return false;

    // Check if all angles are approximately 90 degrees
    const angles = edges.map((edge, i) => {
      const nextEdge = edges[(i + 1) % edges.length];
      const v1 = new THREE.Vector3().subVectors(edge[1], edge[0]);
      const v2 = new THREE.Vector3().subVectors(nextEdge[1], nextEdge[0]);
      return Math.abs(v1.angleTo(v2) - Math.PI / 2);
    });

    return angles.every(angle => angle < 0.1);
  };

  const isCircular = (vertices: THREE.Vector3[]): boolean => {
    if (vertices.length < 8) return false;

    const center = new THREE.Vector3();
    vertices.forEach(v => center.add(v));
    center.divideScalar(vertices.length);

    const distances = vertices.map(v => v.distanceTo(center));
    const avgRadius = distances.reduce((a, b) => a + b, 0) / distances.length;
    
    const variance = distances.reduce((acc, d) => 
      acc + Math.pow(d - avgRadius, 2), 0) / distances.length;
    
    return variance < 0.01 * avgRadius;
  };

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onClick={handleClick}
    >
      <meshPhysicalMaterial
        vertexColors={true}
        transparent={true}
        opacity={0.9}
        roughness={0.5}
        metalness={0.1}
        wireframe={showWireframe}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}