import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment, Stats } from '@react-three/drei';
import Model from './Model';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';

export default function ModelViewer() {
  const [modelUrl, setModelUrl] = useState<string>('');
  const [measurements, setMeasurements] = useState<Record<string, number> | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [viewMode, setViewMode] = useState<'orthographic' | 'perspective'>('perspective');
  const [selectedUnit, setSelectedUnit] = useState<'mm' | 'cm' | 'in'>('mm');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
    }
  };

  const convertMeasurement = (value: number): number => {
    switch (selectedUnit) {
      case 'cm': return value / 10;
      case 'in': return value / 25.4;
      default: return value;
    }
  };

  const handleMeasurements = (data: Record<string, number>) => {
    const convertedData = Object.entries(data).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: convertMeasurement(value)
    }), {});
    setMeasurements(convertedData);
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <Toolbar
        showGrid={showGrid}
        showWireframe={showWireframe}
        showMeasurements={showMeasurements}
        viewMode={viewMode}
        selectedUnit={selectedUnit}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onToggleWireframe={() => setShowWireframe(!showWireframe)}
        onToggleMeasurements={() => setShowMeasurements(!showMeasurements)}
        onViewModeChange={setViewMode}
        onUnitChange={setSelectedUnit}
      />
      
      <div className="flex-1 flex">
        <Sidebar 
          onFileUpload={handleFileUpload} 
          measurements={measurements}
          selectedUnit={selectedUnit}
        />
        
        <div className="flex-1 relative">
          <Canvas>
            <Stats />
            {viewMode === 'perspective' ? (
              <PerspectiveCamera makeDefault position={[100, 100, 100]} />
            ) : (
              <orthographicCamera
                makeDefault
                position={[100, 100, 100]}
                zoom={50}
              />
            )}
            
            <Environment preset="studio" />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <directionalLight position={[-10, -10, -10]} intensity={0.5} />
            
            <Suspense fallback={null}>
              {showGrid && (
                <Grid
                  args={[200, 200]}
                  cellSize={10}
                  cellThickness={1}
                  cellColor="#6e6e6e"
                  sectionSize={40}
                  sectionThickness={1.5}
                  sectionColor="#9d4b4b"
                  fadeDistance={400}
                  fadeStrength={1}
                  followCamera={false}
                  infiniteGrid={true}
                />
              )}
              {modelUrl && (
                <Model 
                  url={modelUrl} 
                  onMeasure={handleMeasurements}
                  showWireframe={showWireframe}
                  showMeasurements={showMeasurements}
                  selectedUnit={selectedUnit}
                />
              )}
            </Suspense>
            
            <OrbitControls 
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.5}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
}