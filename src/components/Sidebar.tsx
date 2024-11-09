import { Cuboid, Save, Share2, History } from 'lucide-react';

type SidebarProps = {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  measurements: Record<string, number> | null;
  selectedUnit: 'mm' | 'cm' | 'in';
};

const unitSymbols = {
  mm: 'mm',
  cm: 'cm',
  in: 'in'
};

export default function Sidebar({ onFileUpload, measurements, selectedUnit }: SidebarProps) {
  const handleExport = () => {
    if (!measurements) return;
    
    const data = {
      timestamp: new Date().toISOString(),
      unit: selectedUnit,
      measurements
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
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
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
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Face Measurements</h3>
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
            <div className="space-y-2">
              {Object.entries(measurements).map(([key, value]) => (
                value !== undefined && (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 capitalize">{key}:</span>
                    <span className="font-medium text-gray-800">
                      {value.toFixed(2)}{unitSymbols[selectedUnit]}
                      {key === 'area' ? '²' : ''}
                    </span>
                  </div>
                )
              ))}
            </div>
          </div>

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