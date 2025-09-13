import { useState } from 'react';
import { StatisticalTest, VariableSelection } from '../types/analysis';

interface AnalysisSelectionProps {
  columnTypes: { [key: string]: string };
  onTestSelect: (selection: VariableSelection) => void;
}

const statisticalTests: StatisticalTest[] = [
  {
    id: 'independent_t',
    name: 'Independent t-test',
    description: 'Compare means between two independent groups',
    category: 'comparison',
    requirements: {
      variables: 2,
      variableTypes: ['numeric', 'categorical'],
      dataRequirements: ['Normality', 'Equal variances']
    }
  },
  {
    id: 'paired_t',
    name: 'Paired t-test',
    description: 'Compare means from the same group at different times',
    category: 'comparison',
    requirements: {
      variables: 2,
      variableTypes: ['numeric', 'numeric'],
      dataRequirements: ['Normality', 'Paired measurements']
    }
  },
  {
    id: 'anova',
    name: 'One-way ANOVA',
    description: 'Compare means between three or more groups',
    category: 'comparison',
    requirements: {
      variables: 2,
      variableTypes: ['numeric', 'categorical'],
      dataRequirements: ['Normality', 'Equal variances', 'Independence']
    }
  },
  {
    id: 'pearson',
    name: 'Pearson Correlation',
    description: 'Measure linear relationship between two continuous variables',
    category: 'correlation',
    requirements: {
      variables: 2,
      variableTypes: ['numeric', 'numeric'],
      dataRequirements: ['Linear relationship', 'Normality']
    }
  },
  {
    id: 'spearman',
    name: 'Spearman Correlation',
    description: 'Measure monotonic relationship between two variables',
    category: 'correlation',
    requirements: {
      variables: 2,
      variableTypes: ['numeric', 'numeric'],
      dataRequirements: ['Monotonic relationship']
    }
  },
  {
    id: 'chi_square',
    name: 'Chi-square Test',
    description: 'Test association between categorical variables',
    category: 'nonparametric',
    requirements: {
      variables: 2,
      variableTypes: ['categorical', 'categorical'],
      dataRequirements: ['Expected frequencies >5']
    }
  },
  {
    id: 'linear_regression',
    name: 'Linear Regression',
    description: 'Predict continuous outcome based on predictor variables',
    category: 'regression',
    requirements: {
      variables: -1, // Multiple variables
      variableTypes: ['numeric', 'numeric'],
      dataRequirements: ['Linearity', 'Independence', 'Homoscedasticity', 'Normality']
    }
  },
  {
    id: 'mann_whitney',
    name: 'Mann-Whitney U Test',
    description: 'Non-parametric alternative to independent t-test',
    category: 'nonparametric',
    requirements: {
      variables: 2,
      variableTypes: ['numeric', 'categorical'],
      dataRequirements: ['Ordinal data or non-normal distributions']
    }
  },
  {
    id: 'shapiro_wilk',
    name: 'Shapiro-Wilk Test',
    description: 'Test for normality of data distribution',
    category: 'normality',
    requirements: {
      variables: 1,
      variableTypes: ['numeric'],
      dataRequirements: ['Continuous data']
    }
  },
  {
    id: 'levene',
    name: 'Levene\'s Test',
    description: 'Test for equality of variances between groups',
    category: 'normality',
    requirements: {
      variables: 2,
      variableTypes: ['numeric', 'categorical'],
      dataRequirements: ['Continuous dependent variable']
    }
  }
];

const AnalysisSelection = ({ columnTypes, onTestSelect }: AnalysisSelectionProps) => {
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [groupVariable, setGroupVariable] = useState<string>('');

  const numericColumns = Object.entries(columnTypes)
    .filter(([_, type]) => type === 'numeric')
    .map(([name]) => name);

  const categoricalColumns = Object.entries(columnTypes)
    .filter(([_, type]) => type === 'categorical')
    .map(([name]) => name);

  const allColumns = Object.keys(columnTypes);

  const handleTestSelect = (testId: string) => {
    setSelectedTest(testId);
    setSelectedVariables([]);
    setGroupVariable('');
  };

  const handleVariableSelect = (variable: string) => {
    const test = statisticalTests.find(t => t.id === selectedTest);
    if (!test) return;

    if (test.requirements.variables === 1) {
      setSelectedVariables([variable]);
    } else if (selectedVariables.includes(variable)) {
      setSelectedVariables(selectedVariables.filter(v => v !== variable));
    } else if (selectedVariables.length < (test.requirements.variables === -1 ? Infinity : test.requirements.variables)) {
      setSelectedVariables([...selectedVariables, variable]);
    }
  };

  const handleRunTest = () => {
    if (!selectedTest || selectedVariables.length === 0) return;

    const selection: VariableSelection = {
      testId: selectedTest,
      variables: selectedVariables,
      groupVariable: groupVariable || undefined
    };

    onTestSelect(selection);
  };

  const getAvailableTests = () => {
    return statisticalTests.filter(test => {
      const hasNumeric = numericColumns.length > 0;
      const hasCategorical = categoricalColumns.length > 0;
      
      if (test.requirements.variableTypes.includes('numeric') && !hasNumeric) return false;
      if (test.requirements.variableTypes.includes('categorical') && !hasCategorical) return false;
      
      return true;
    });
  };

  const availableTests = getAvailableTests();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-semibold mb-6">Select Analysis</h3>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Test Selection */}
        <div>
          <h4 className="font-medium mb-4">Choose Statistical Test</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableTests.map((test) => (
              <div
                key={test.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTest === test.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleTestSelect(test.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium">{test.name}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {test.description}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full capitalize">
                    {test.category}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Requires: {test.requirements.variableTypes.join(' + ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Variable Selection */}
        <div>
          <h4 className="font-medium mb-4">Select Variables</h4>
          
          {selectedTest && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Variables for analysis:
                </label>
                <div className="space-y-2">
                  {allColumns.map((column) => (
                    <label key={column} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedVariables.includes(column)}
                        onChange={() => handleVariableSelect(column)}
                        disabled={
                          !selectedVariables.includes(column) &&
                          selectedVariables.length >= 
                          (statisticalTests.find(t => t.id === selectedTest)?.requirements.variables === -1 
                            ? Infinity 
                            : statisticalTests.find(t => t.id === selectedTest)?.requirements.variables || 0)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm">
                        {column} 
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          ({columnTypes[column]})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedVariables.length > 0 && (
                <button
                  onClick={handleRunTest}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Run Analysis
                </button>
              )}
            </div>
          )}

          {!selectedTest && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Select a statistical test first to choose variables
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisSelection;