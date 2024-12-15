import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment, Stats } from '@react-three/drei';
import Model, { MeasurementData } from './Model';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import EngineeringAnalysis from './EngineeringAnalysis';

const DOCS_CONTENT = `# Engineering Analysis Documentation...`; // Content remains the same

export default function ModelViewer() {
  const [modelUrl, setModelUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementData | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [viewMode, setViewMode] = useState<'orthographic' | 'perspective'>('perspective');
  const [selectedUnit, setSelectedUnit] = useState<'mm' | 'cm' | 'in'>('mm');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisType, setAnalysisType] = useState<'stress' | 'thermal' | 'motion' | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (file) {
      // Validate file type
      const extension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['stl', 'obj', 'gltf', 'glb'];

      if (!extension || !validExtensions.includes(extension)) {
        setError(`Unsupported file format: ${extension}. Please use STL, OBJ, GLTF, or GLB files.`);
        return;
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        setError('File size too large. Maximum size is 50MB.');
        return;
      }

      const url = URL.createObjectURL(file);
      setModelUrl(url);
    }
  };

  return (
      <div className="w-full h-screen flex flex-col">
        <Toolbar
            showGrid={showGrid}
            showWireframe={showWireframe}
            showMeasurements={showMeasurements}
            viewMode={viewMode}
            selectedUnit={selectedUnit}
            showAnalysis={showAnalysis}
            analysisType={analysisType}
            onToggleGrid={() => setShowGrid(!showGrid)}
            onToggleWireframe={() => setShowWireframe(!showWireframe)}
            onToggleMeasurements={() => setShowMeasurements(!showMeasurements)}
            onViewModeChange={setViewMode}
            onUnitChange={setSelectedUnit}
            onToggleAnalysis={() => setShowAnalysis(!showAnalysis)}
            onAnalysisTypeChange={setAnalysisType}
            onOpenDocs={() => setShowDocs(true)}
        />

        <div className="flex-1 flex">
          <Sidebar
              onFileUpload={handleFileUpload}
              measurements={measurements}
              selectedUnit={selectedUnit}
              showAnalysis={showAnalysis}
              analysisType={analysisType}
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
                {modelUrl && !error && (
                    <>
                      <Model
                          url={modelUrl}
                          onMeasure={setMeasurements}
                          showWireframe={showWireframe}
                      />
                      {showAnalysis && analysisType && (
                          <EngineeringAnalysis
                              type={analysisType}
                              measurements={measurements}
                          />
                      )}
                    </>
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