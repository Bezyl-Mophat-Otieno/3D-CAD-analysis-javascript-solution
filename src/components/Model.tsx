import { useRef, useState, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { Html, Line, Points } from '@react-three/drei';
import * as THREE from 'three';

type ModelProps = {
  url: string;
  onMeasure: (data: any) => void;
};

type ShapeType = 'circle' | 'rectangle' | 'triangle' | 'complex';

interface Edge {
  start: THREE.Vector3;
  end: THREE.Vector3;
  length: number;
}

interface CircleData {
  center: THREE.Vector3;
  radius: number;
  diameter: number;
  circumference: number;
}

type FaceMeasurements = {
  type: ShapeType;
  edges: Edge[];
  vertices: THREE.Vector3[];
  dimensions: {
    diameter?: number;
    radius?: number;
    width?: number;
    height?: number;
    area?: number;
    perimeter?: number;
    maxLength?: number;
    minLength?: number;
  };
  circleData?: CircleData;
};

export default function Model({ url, onMeasure }: ModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useLoader(STLLoader, url);
  const [selected, setSelected] = useState<{
    position: THREE.Vector3;
    measurements: FaceMeasurements;
  } | null>(null);

  const vertexPoints = useMemo(() => {
    if (!selected) return [];
    return selected.measurements.vertices.map(vertex => [
      vertex.x, vertex.y, vertex.z
    ]);
  }, [selected]);

  const edgeLines = useMemo(() => {
    if (!selected) return [];
    if (selected.measurements.type === 'circle' && selected.measurements.circleData) {
      // For circles, create a more accurate circular outline
      const { center, radius } = selected.measurements.circleData;
      const segments = 32;
      const points: [number, number, number][] = [];
      
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = center.x + radius * Math.cos(theta);
        const y = center.y + radius * Math.sin(theta);
        points.push([x, y, center.z]);
      }
      
      return [points];
    }
    return selected.measurements.edges.map(edge => [
      [edge.start.x, edge.start.y, edge.start.z],
      [edge.end.x, edge.end.y, edge.end.z]
    ]);
  }, [selected]);

  const findCoplanarFaces = (
    geometry: THREE.BufferGeometry,
    clickedFace: THREE.Face,
    normal: THREE.Vector3,
    tolerance: number = 0.01
  ): THREE.Vector3[] => {
    const vertices = new Set<string>();
    const position = geometry.attributes.position;
    const vertexNormals = geometry.attributes.normal;
    
    const isSimilarNormal = (n1: THREE.Vector3, n2: THREE.Vector3) => 
      n1.dot(n2) > 0.99;
    
    const isCoplanar = (point: THREE.Vector3, planePoint: THREE.Vector3, planeNormal: THREE.Vector3) => {
      const v = new THREE.Vector3().subVectors(point, planePoint);
      return Math.abs(v.dot(planeNormal)) < tolerance;
    };

    const planePoint = new THREE.Vector3().fromBufferAttribute(position, clickedFace.a);

    for (let i = 0; i < position.count; i += 3) {
      const faceNormal = new THREE.Vector3(
        vertexNormals.getX(i),
        vertexNormals.getY(i),
        vertexNormals.getZ(i)
      );

      if (isSimilarNormal(normal, faceNormal)) {
        const v1 = new THREE.Vector3().fromBufferAttribute(position, i);
        const v2 = new THREE.Vector3().fromBufferAttribute(position, i + 1);
        const v3 = new THREE.Vector3().fromBufferAttribute(position, i + 2);

        if (
          isCoplanar(v1, planePoint, normal) &&
          isCoplanar(v2, planePoint, normal) &&
          isCoplanar(v3, planePoint, normal)
        ) {
          vertices.add(`${v1.x},${v1.y},${v1.z}`);
          vertices.add(`${v2.x},${v2.y},${v2.z}`);
          vertices.add(`${v3.x},${v3.y},${v3.z}`);
        }
      }
    }

    return Array.from(vertices).map(v => {
      const [x, y, z] = v.split(',').map(Number);
      return new THREE.Vector3(x, y, z);
    });
  };

  const calculateEdges = (vertices: THREE.Vector3[]): Edge[] => {
    const edges: Edge[] = [];
    const uniqueEdges = new Set<string>();
    
    const getEdgeKey = (v1: THREE.Vector3, v2: THREE.Vector3) => {
      const points = [
        [v1.x, v1.y, v1.z],
        [v2.x, v2.y, v2.z]
      ].sort((a, b) => {
        if (a[0] !== b[0]) return a[0] - b[0];
        if (a[1] !== b[1]) return a[1] - b[1];
        return a[2] - b[2];
      });
      return points.flat().join(',');
    };

    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const v1 = vertices[i];
        const v2 = vertices[j];
        const edgeKey = getEdgeKey(v1, v2);
        
        if (!uniqueEdges.has(edgeKey)) {
          const length = v1.distanceTo(v2);
          edges.push({ start: v1, end: v2, length });
          uniqueEdges.add(edgeKey);
        }
      }
    }

    return edges;
  };

  const analyzeCircularity = (vertices: THREE.Vector3[]): { isCircle: boolean; circleData?: CircleData } => {
    if (vertices.length < 8) return { isCircle: false };

    // Find the center by averaging all points
    const center = new THREE.Vector3();
    vertices.forEach(v => center.add(v));
    center.divideScalar(vertices.length);

    // Calculate distances from center to each vertex
    const distances = vertices.map(v => v.distanceTo(center));
    const avgRadius = distances.reduce((a, b) => a + b, 0) / distances.length;
    
    // Calculate variance in radius
    const variance = distances.reduce((acc, d) => 
      acc + Math.pow(d - avgRadius, 2), 0) / distances.length;
    
    // Check if variance is within tolerance (1% of radius)
    const isCircle = variance < 0.01 * avgRadius;

    if (!isCircle) return { isCircle: false };

    // Find the most distant points to get a more accurate diameter
    let maxDist = 0;
    let diameter = 0;
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const dist = vertices[i].distanceTo(vertices[j]);
        if (dist > maxDist) {
          maxDist = dist;
          diameter = dist;
        }
      }
    }

    const radius = diameter / 2;
    const circumference = 2 * Math.PI * radius;

    return {
      isCircle: true,
      circleData: {
        center,
        radius,
        diameter,
        circumference
      }
    };
  };

  const detectShape = (vertices: THREE.Vector3[], normal: THREE.Vector3): FaceMeasurements => {
    const edges = calculateEdges(vertices);
    const { isCircle, circleData } = analyzeCircularity(vertices);
    
    if (isCircle && circleData) {
      return {
        type: 'circle',
        edges,
        vertices,
        dimensions: {
          radius: circleData.radius,
          diameter: circleData.diameter,
          area: Math.PI * Math.pow(circleData.radius, 2),
          perimeter: circleData.circumference
        },
        circleData
      };
    }
    
    // Find maximum and minimum distances between any two vertices
    let maxLength = 0;
    let minLength = Infinity;
    
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const length = vertices[i].distanceTo(vertices[j]);
        maxLength = Math.max(maxLength, length);
        minLength = Math.min(minLength, length);
      }
    }

    const area = calculateArea(vertices, normal);
    const perimeter = edges.reduce((sum, edge) => sum + edge.length, 0);
    
    if (isRectangular(vertices)) {
      const boundingBox = new THREE.Box3().setFromPoints(vertices);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      
      return {
        type: 'rectangle',
        edges,
        vertices,
        dimensions: {
          width: size.x,
          height: size.y,
          area,
          perimeter,
          maxLength,
          minLength
        }
      };
    }
    
    return {
      type: 'complex',
      edges,
      vertices,
      dimensions: {
        area,
        perimeter,
        maxLength,
        minLength
      }
    };
  };

  const isRectangular = (vertices: THREE.Vector3[]): boolean => {
    if (vertices.length !== 4) return false;
    
    const angles: number[] = [];
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      const v3 = vertices[(i + 2) % vertices.length];
      
      const edge1 = new THREE.Vector3().subVectors(v2, v1);
      const edge2 = new THREE.Vector3().subVectors(v3, v2);
      
      const angle = edge1.angleTo(edge2);
      angles.push(angle);
    }
    
    return angles.every(angle => Math.abs(angle - Math.PI/2) < 0.1);
  };

  const calculateArea = (vertices: THREE.Vector3[], normal: THREE.Vector3): number => {
    let area = 0;
    
    const projectedVerts = vertices.map(v => {
      const projected = v.clone();
      const dot = projected.dot(normal);
      projected.sub(normal.multiplyScalar(dot));
      return projected;
    });
    
    const triangles = [];
    for (let i = 1; i < projectedVerts.length - 1; i++) {
      triangles.push([
        projectedVerts[0],
        projectedVerts[i],
        projectedVerts[i + 1]
      ]);
    }
    
    for (const [v1, v2, v3] of triangles) {
      const side1 = new THREE.Vector3().subVectors(v2, v1);
      const side2 = new THREE.Vector3().subVectors(v3, v1);
      const triangleArea = side1.cross(side2).length() / 2;
      area += triangleArea;
    }
    
    return area;
  };

  const handleClick = (e: THREE.Intersection) => {
    e.stopPropagation();
    if (!meshRef.current) return;

    const face = e.face;
    if (!face) return;

    const geometry = meshRef.current.geometry;
    const position = e.point;
    
    const normal = face.normal.clone();
    normal.transformDirection(meshRef.current.matrixWorld);

    const vertices = findCoplanarFaces(geometry, face, normal);
    vertices.forEach(vertex => vertex.applyMatrix4(meshRef.current!.matrixWorld));

    const measurements = detectShape(vertices, normal);
    setSelected({ position, measurements });
    onMeasure(measurements.dimensions);
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={handleClick}
      >
        <meshPhysicalMaterial 
          color="#4a90e2"
          transparent={true}
          opacity={0.6}
          roughness={0.3}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {edgeLines.map((points, index) => (
        <Line
          key={`edge-${index}`}
          points={points}
          color="#ff3366"
          lineWidth={3}
        />
      ))}

      {selected?.measurements.type === 'circle' && selected.measurements.circleData && (
        <Points positions={[[
          selected.measurements.circleData.center.x,
          selected.measurements.circleData.center.y,
          selected.measurements.circleData.center.z
        ]]}>
          <pointsMaterial
            size={8}
            color="#ff3366"
            sizeAttenuation={false}
          />
        </Points>
      )}

      <Points positions={vertexPoints.flat()}>
        <pointsMaterial
          size={5}
          color="#ffcc00"
          sizeAttenuation={false}
        />
      </Points>

      {selected && (
        <Html position={selected.position}>
          <div className="bg-white p-3 rounded-lg shadow-lg text-sm min-w-[200px]">
            <p className="font-semibold mb-2 text-blue-600 border-b pb-1">
              {selected.measurements.type.charAt(0).toUpperCase() + 
               selected.measurements.type.slice(1)} Face
            </p>
            
            {Object.entries(selected.measurements.dimensions)
              .filter(([, value]) => value !== undefined)
              .map(([key, value]) => (
                <p key={key} className="whitespace-nowrap flex justify-between items-center py-1">
                  <span className="text-gray-600">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                  <span className="font-medium text-gray-800">
                    {value.toFixed(2)}mm{key === 'area' ? '²' : ''}
                  </span>
                </p>
              ))}
            
            {selected.measurements.type === 'complex' && (
              <div className="mt-2 border-t border-gray-200 pt-2">
                <p className="font-medium mb-1 text-gray-700">Edge Lengths:</p>
                {selected.measurements.edges.map((edge, index) => (
                  <p key={index} className="text-xs flex justify-between items-center py-1">
                    <span className="text-gray-600">Edge {index + 1}:</span>
                    <span className="font-medium text-gray-800">
                      {edge.length.toFixed(2)}mm
                    </span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}