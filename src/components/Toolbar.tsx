import { 
  Grid, 
  Box, 
  Eye, 
  Ruler, 
  Camera, 
  CameraOff,
  Activity,
  Thermometer,
  Move
} from 'lucide-react';

type ToolbarProps = {
  showGrid: boolean;
  showWireframe: boolean;
  showMeasurements: boolean;
  viewMode: 'orthographic' | 'perspective';
  selectedUnit: 'mm' | 'cm' | 'in';
  showAnalysis: boolean;
  analysisType: 'stress' | 'thermal' | 'motion' | null;
  onToggleGrid: () => void;
  onToggleWireframe: () => void;
  onToggleMeasurements: () => void;
  onViewModeChange: (mode: 'orthographic' | 'perspective') => void;
  onUnitChange: (unit: 'mm' | 'cm' | 'in') => void;
  onToggleAnalysis: () => void;
  onAnalysisTypeChange: (type: 'stress' | 'thermal' | 'motion' | null) => void;
};

export default function Toolbar({
  showGrid,
  showWireframe,
  showMeasurements,
  viewMode,
  selectedUnit,
  showAnalysis,
  analysisType,
  onToggleGrid,
  onToggleWireframe,
  onToggleMeasurements,
  onViewModeChange,
  onUnitChange,
  onToggleAnalysis,
  onAnalysisTypeChange
}: ToolbarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleGrid}
          className={`p-2 rounded-lg hover:bg-gray-100 ${
            showGrid ? 'text-blue-600' : 'text-gray-600'
          }`}
          title="Toggle Grid"
        >
          <Grid className="w-5 h-5" />
        </button>
        
        <button
          onClick={onToggleWireframe}
          className={`p-2 rounded-lg hover:bg-gray-100 ${
            showWireframe ? 'text-blue-600' : 'text-gray-600'
          }`}
          title="Toggle Wireframe"
        >
          <Box className="w-5 h-5" />
        </button>
        
        <button
          onClick={onToggleMeasurements}
          className={`p-2 rounded-lg hover:bg-gray-100 ${
            showMeasurements ? 'text-blue-600' : 'text-gray-600'
          }`}
          title="Toggle Measurements"
        >
          <Ruler className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => onViewModeChange(
            viewMode === 'perspective' ? 'orthographic' : 'perspective'
          )}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          title="Toggle Camera Mode"
        >
          {viewMode === 'perspective' ? (
            <Camera className="w-5 h-5" />
          ) : (
            <CameraOff className="w-5 h-5" />
          )}
        </button>

        <div className="h-6 w-px bg-gray-300 mx-2" />

        {/*<div className="flex items-center space-x-1">*/}
        {/*  <button*/}
        {/*    onClick={() => {*/}
        {/*      if (!showAnalysis || analysisType !== 'stress') {*/}
        {/*        onAnalysisTypeChange('stress');*/}
        {/*        if (!showAnalysis) onToggleAnalysis();*/}
        {/*      } else {*/}
        {/*        onAnalysisTypeChange(null);*/}
        {/*        onToggleAnalysis();*/}
        {/*      }*/}
        {/*    }}*/}
        {/*    className={`p-2 rounded-lg hover:bg-gray-100 ${*/}
        {/*      showAnalysis && analysisType === 'stress' ? 'text-red-600' : 'text-gray-600'*/}
        {/*    }`}*/}
        {/*    title="Stress Analysis"*/}
        {/*  >*/}
        {/*    <Activity className="w-5 h-5" />*/}
        {/*  </button>*/}

        {/*  <button*/}
        {/*    onClick={() => {*/}
        {/*      if (!showAnalysis || analysisType !== 'thermal') {*/}
        {/*        onAnalysisTypeChange('thermal');*/}
        {/*        if (!showAnalysis) onToggleAnalysis();*/}
        {/*      } else {*/}
        {/*        onAnalysisTypeChange(null);*/}
        {/*        onToggleAnalysis();*/}
        {/*      }*/}
        {/*    }}*/}
        {/*    className={`p-2 rounded-lg hover:bg-gray-100 ${*/}
        {/*      showAnalysis && analysisType === 'thermal' ? 'text-orange-600' : 'text-gray-600'*/}
        {/*    }`}*/}
        {/*    title="Thermal Analysis"*/}
        {/*  >*/}
        {/*    <Thermometer className="w-5 h-5" />*/}
        {/*  </button>*/}

        {/*  <button*/}
        {/*    onClick={() => {*/}
        {/*      if (!showAnalysis || analysisType !== 'motion') {*/}
        {/*        onAnalysisTypeChange('motion');*/}
        {/*        if (!showAnalysis) onToggleAnalysis();*/}
        {/*      } else {*/}
        {/*        onAnalysisTypeChange(null);*/}
        {/*        onToggleAnalysis();*/}
        {/*      }*/}
        {/*    }}*/}
        {/*    className={`p-2 rounded-lg hover:bg-gray-100 ${*/}
        {/*      showAnalysis && analysisType === 'motion' ? 'text-blue-600' : 'text-gray-600'*/}
        {/*    }`}*/}
        {/*    title="Motion Analysis"*/}
        {/*  >*/}
        {/*    <Move className="w-5 h-5" />*/}
        {/*  </button>*/}
        {/*</div>*/}
      </div>

      <div className="flex items-center space-x-4">
        <select
          value={selectedUnit}
          onChange={(e) => onUnitChange(e.target.value as 'mm' | 'cm' | 'in')}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="mm">Millimeters (mm)</option>
          <option value="cm">Centimeters (cm)</option>
          <option value="in">Inches (in)</option>
        </select>
      </div>
    </div>
  );
}