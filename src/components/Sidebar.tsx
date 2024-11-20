import { Cuboid, Save, Share2, History, Activity, Thermometer, Move } from 'lucide-react';
import type { MeasurementData } from './Model';

type SidebarProps = {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  measurements: MeasurementData | null;
  selectedUnit: 'mm' | 'cm' | 'in';
  showAnalysis: boolean;
  analysisType: 'stress' | 'thermal' | 'motion' | null;
};

const unitSymbols = {
  mm: 'mm',
  cm: 'cm',
  in: 'in'
};

const formatMeasurement = (value: number, unit: 'mm' | 'cm' | 'in'): number => {
  switch (unit) {
    case 'cm': return value / 10;
    case 'in': return value / 25.4;
    default: return value;
  }
};

const getAnalysisIcon = (type: 'stress' | 'thermal' | 'motion') => {
  switch (type) {
    case 'stress':
      return <Activity className="w-5 h-5 text-red-600" />;
    case 'thermal':
      return <Thermometer className="w-5 h-5 text-orange-600" />;
    case 'motion':
      return <Move className="w-5 h-5 text-blue-600" />;
  }
};

const getAnalysisTitle = (type: 'stress' | 'thermal' | 'motion') => {
  switch (type) {
    case 'stress':
      return 'Stress Analysis';
    case 'thermal':
      return 'Thermal Analysis';
    case 'motion':
      return 'Motion Analysis';
  }
};

export default function Sidebar({ 
  onFileUpload, 
  measurements, 
  selectedUnit,
  showAnalysis,
  analysisType 
}: SidebarProps) {
  const handleExport = () => {
    if (!measurements) return;
    
    const data = {
      timestamp: new Date().toISOString(),
      unit: selectedUnit,
      measurements,
      analysis: showAnalysis ? {
        type: analysisType,
        // Add analysis-specific data here
      } : null
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `measurements_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-80 p-6 bg-white border-r border-gray-200 shadow-lg flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-6 mt-8 flex items-center gap-2 text-gray-800">
        <Cuboid className="w-7 h-7 text-blue-600" />
        3D Model Viewer
      </h2>
      
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload STL File
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".stl"
            onChange={onFileUpload}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Supported format: .stl
        </p>
      </div>

      {measurements && (
        <div className="flex-1 flex flex-col overflow-y-auto space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">
                {measurements.type.charAt(0).toUpperCase() + measurements.type.slice(1)} Face
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600"
                  title="Export Measurements"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600"
                  title="Share Measurements"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Area:</span>
                  <span className="font-medium text-gray-800">
                    {formatMeasurement(measurements.area, selectedUnit).toFixed(2)}
                    {unitSymbols[selectedUnit]}²
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Perimeter:</span>
                  <span className="font-medium text-gray-800">
                    {formatMeasurement(measurements.perimeter, selectedUnit).toFixed(2)}
                    {unitSymbols[selectedUnit]}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Max Length:</span>
                  <span className="font-medium text-gray-800">
                    {formatMeasurement(measurements.maxLength, selectedUnit).toFixed(2)}
                    {unitSymbols[selectedUnit]}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Min Length:</span>
                  <span className="font-medium text-gray-800">
                    {formatMeasurement(measurements.minLength, selectedUnit).toFixed(2)}
                    {unitSymbols[selectedUnit]}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Edge Measurements:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {measurements.edgeLengths.map(({ id, length, color }) => (
                    <div 
                      key={id} 
                      className="flex justify-between items-center text-sm p-2 rounded"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-gray-600">Edge {id + 1}</span>
                      </div>
                      <span className="font-medium text-gray-800">
                        {formatMeasurement(length, selectedUnit).toFixed(2)}
                        {unitSymbols[selectedUnit]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {showAnalysis && analysisType && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                {getAnalysisIcon(analysisType)}
                <h3 className="font-semibold text-gray-700">
                  {getAnalysisTitle(analysisType)}
                </h3>
              </div>

              {analysisType === 'stress' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Max Stress:</span>
                    <span className="font-medium text-gray-800">
                      {formatMeasurement(measurements.maxLength * 0.7, selectedUnit).toFixed(2)} MPa
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Yield Strength:</span>
                    <span className="font-medium text-gray-800">
                      {formatMeasurement(measurements.maxLength * 1.2, selectedUnit).toFixed(2)} MPa
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 w-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Safe</span>
                      <span>Warning</span>
                      <span>Critical</span>
                    </div>
                  </div>
                </div>
              )}

              {analysisType === 'thermal' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Max Temperature:</span>
                    <span className="font-medium text-gray-800">85°C</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Min Temperature:</span>
                    <span className="font-medium text-gray-800">25°C</span>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 rounded-full" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Cold</span>
                      <span>Nominal</span>
                      <span>Hot</span>
                    </div>
                  </div>
                </div>
              )}

              {analysisType === 'motion' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Max Velocity:</span>
                    <span className="font-medium text-gray-800">
                      {(measurements.maxLength * 0.5).toFixed(2)} m/s
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Acceleration:</span>
                    <span className="font-medium text-gray-800">
                      {(measurements.maxLength * 0.2).toFixed(2)} m/s²
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 w-full bg-gradient-to-r from-white via-cyan-500 to-blue-500 rounded-full" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Static</span>
                      <span>Moving</span>
                      <span>Fast</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-auto">
            <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-1">
              <History className="w-4 h-4" />
              Recent Measurements
            </h4>
            <div className="text-xs text-gray-500">
              Measurement history will appear here
            </div>
          </div>
        </div>
      )}
    </div>
  );
}