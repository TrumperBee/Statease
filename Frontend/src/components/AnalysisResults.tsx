import { useState } from 'react';
import DownloadReport from './DownloadReport';

interface AnalysisResultsProps {
  results: any;
  onBack: () => void;
  filename: string;
  variables: string[];
  groupVariable?: string;
}

const AnalysisResults = ({ results, onBack, filename, variables, groupVariable }: AnalysisResultsProps) => {
  const [activeTab, setActiveTab] = useState<'results' | 'interpretation'>('results');

  if (!results) return null;

  const renderResults = () => {
    switch (results.test) {
      case 'independent_t_test':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{results.group1.name}</h4>
                <p>Mean: {results.group1.mean.toFixed(2)}</p>
                <p>SD: {results.group1.std.toFixed(2)}</p>
                <p>N: {results.group1.n}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{results.group2.name}</h4>
                <p>Mean: {results.group2.mean.toFixed(2)}</p>
                <p>SD: {results.group2.std.toFixed(2)}</p>
                <p>N: {results.group2.n}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <p><strong>t({results.df})</strong> = {results.t_statistic.toFixed(2)}</p>
              <p><strong>p-value</strong> = {results.p_value.toFixed(3)}</p>
              <p><strong>Cohen&apos;s d</strong> = {results.effect_size.cohens_d.toFixed(2)} ({results.effect_size.interpretation} effect)</p>
            </div>
          </div>
        );

      case 'paired_t_test':
        return (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <p><strong>Mean difference</strong> = {results.mean_difference.toFixed(2)}</p>
              <p><strong>SD difference</strong> = {results.std_difference.toFixed(2)}</p>
              <p><strong>t({results.df})</strong> = {results.t_statistic.toFixed(2)}</p>
              <p><strong>p-value</strong> = {results.p_value.toFixed(3)}</p>
              <p><strong>Cohen&apos;s d</strong> = {results.effect_size.cohens_d.toFixed(2)} ({results.effect_size.interpretation} effect)</p>
            </div>
          </div>
        );

      case 'one_way_anova':
        return (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <p><strong>F({results.df_between}, {results.df_within})</strong> = {results.f_statistic.toFixed(2)}</p>
              <p><strong>p-value</strong> = {results.p_value.toFixed(3)}</p>
            </div>
            {results.post_hoc && results.post_hoc.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tukey HSD Post-hoc Tests</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th>Group 1</th>
                        <th>Group 2</th>
                        <th>Mean Difference</th>
                        <th>p-value</th>
                        <th>Significant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.post_hoc.map((test: any, index: number) => (
                        <tr key={index}>
                          <td>{test.group1}</td>
                          <td>{test.group2}</td>
                          <td>{test.mean_diff.toFixed(2)}</td>
                          <td>{test.p_value.toFixed(3)}</td>
                          <td>{test.reject ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 'pearson_correlation':
      case 'spearman_correlation':
        return (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <p><strong>Correlation coefficient</strong> = {results.correlation.toFixed(2)}</p>
            <p><strong>p-value</strong> = {results.p_value.toFixed(3)}</p>
            <p><strong>Sample size</strong> = {results.n}</p>
          </div>
        );

      case 'chi_square_test':
        return (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <p><strong>χ²({results.df})</strong> = {results.chi2.toFixed(2)}</p>
            <p><strong>p-value</strong> = {results.p_value.toFixed(3)}</p>
            <p><strong>Cramer&apos;s V</strong> = {results.cramers_v.toFixed(2)}</p>
          </div>
        );

      case 'shapiro_wilk_test':
        return (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <p><strong>W statistic</strong> = {results.statistic.toFixed(2)}</p>
            <p><strong>p-value</strong> = {results.p_value.toFixed(3)}</p>
            <p><strong>Sample size</strong> = {results.n}</p>
          </div>
        );

      case 'levene_test':
        return (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <p><strong>W statistic</strong> = {results.statistic.toFixed(2)}</p>
            <p><strong>p-value</strong> = {results.p_value.toFixed(3)}</p>
          </div>
        );

      default:
        return <div>Unknown test type</div>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      {/* Header with DownloadReport + Back */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Analysis Results</h3>
        <div className="flex items-center space-x-4">
          <DownloadReport 
            results={results} 
            filename={filename}
            variables={variables}
            groupVariable={groupVariable}
          />
          <button
            onClick={onBack}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg"
          >
            Back to Analysis
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {['results', 'interpretation'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'results' | 'interpretation')}
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
      <div>
        {activeTab === 'results' && renderResults()}
        
        {activeTab === 'interpretation' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Interpretation</h4>
            <p className="text-blue-700 dark:text-blue-300">{results.interpretation}</p>
            
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border">
              <h5 className="font-medium mb-2">Academic Citation Format:</h5>
              <code className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded block">
                {results.interpretation}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;
