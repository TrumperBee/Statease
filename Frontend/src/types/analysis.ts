export interface StatisticalTest {
  id: string;
  name: string;
  description: string;
  category: 'comparison' | 'correlation' | 'regression' | 'nonparametric' | 'normality';
  requirements: {
    variables: number;
    variableTypes: string[];
    dataRequirements: string[];
  };
}

export interface VariableSelection {
  testId: string;
  variables: string[];
  groupVariable?: string;
}