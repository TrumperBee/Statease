import { useState } from 'react';
import AnalysisSelection from './AnalysisSelection';

interface DataPreviewProps {
  data: any;
  onAnalyze: (selection: any) => void;
}

const DataPreview = ({ data, onAnalyze }: DataPreviewProps) => {
  const [activeTab, setActiveTab] = useState<
    'preview' | 'stats' | 'columns' | 'analysis'
  >('preview');

  if (!data) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Dataset: {data.filename}</h3>
        <button
          onClick={() => setActiveTab('analysis')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Analyze Data
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {['preview', 'columns', 'stats', 'analysis'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="overflow-auto">
        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div>
            <h4 className="font-medium mb-4">First 100 rows</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {data.preview_data[0] &&
                      Object.keys(data.preview_data[0]).map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.preview_data.map((row: any, index: number) => (
                    <tr key={index}>
                      {Object.values(row).map(
                        (value: any, cellIndex: number) => (
                          <td
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                          >
                            {value === null ? 'NULL' : value.toString()}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Columns Tab */}
        {activeTab === 'columns' && (
          <div>
            <h4 className="font-medium mb-4">Column Information</h4>
            <div className="grid gap-4">
              {data.column_types &&
                Object.entries(data.column_types).map(([name, type]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        ({type})
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      {type}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div>
            <h4 className="font-medium mb-4">Descriptive Statistics</h4>
            <div className="space-y-4">
              {data.stats &&
                Object.entries(data.stats).map(
                  ([column, stats]: [string, any]) => (
                    <div
                      key={column}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <h5 className="font-medium mb-2">{column}</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Count:
                          </span>{' '}
                          {stats.count}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Mean:
                          </span>{' '}
                          {stats.mean?.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Std:
                          </span>{' '}
                          {stats.std?.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Missing:
                          </span>{' '}
                          {stats.missing}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Min:
                          </span>{' '}
                          {stats.min?.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Max:
                          </span>{' '}
                          {stats.max?.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Skewness:
                          </span>{' '}
                          {stats.skewness?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <AnalysisSelection
            columnTypes={data.column_types}
            onTestSelect={onAnalyze}
          />
        )}
      </div>
    </div>
  );
};

export default DataPreview;
