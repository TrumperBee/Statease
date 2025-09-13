import { useState } from 'react';
import axios from 'axios';
import ContactDeveloper from './components/ContactDeveloper';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import AnalysisResults from './components/AnalysisResults';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [uploadData, setUploadData] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'upload' | 'analysis' | 'results'>('upload');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSelection, setAnalysisSelection] = useState<any>(null);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleFileUpload = (data: any) => {
    setUploadData(data);
    setCurrentView('analysis');
  };

  const handleUseSample = async () => {
    setIsAnalyzing(true);
    try {
      // Load sample data
      const response = await fetch('/sample.csv');
      const sampleData = await response.text();

      // Create a File object from the sample data
      const file = new File([sampleData], 'sample_football_data.csv', { type: 'text/csv' });

      // Create form data and upload
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await axios.post(`${import.meta.env.VITE_API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadResponse.data.success) {
        setUploadData(uploadResponse.data);
        setCurrentView('analysis');
      }
    } catch (error: any) {
      console.error('Sample data error:', error);
      alert('Failed to load sample data. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async (selection: any) => {
    setIsAnalyzing(true);
    setAnalysisSelection(selection);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/analyze`, {
        test_id: selection.testId,
        variables: selection.variables,
        group_variable: selection.groupVariable,
        filename: uploadData.filename,
      });

      if (response.data.success) {
        setAnalysisResults(response.data.results);
        setCurrentView('results');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      alert(error.response?.data?.detail || 'Failed to run analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBackToAnalysis = () => {
    setCurrentView('analysis');
    setAnalysisResults(null);
  };

  const handleBackToUpload = () => {
    setUploadData(null);
    setCurrentView('upload');
    setAnalysisResults(null);
    setAnalysisSelection(null);
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
            <h1 className="text-xl font-bold">StatEase</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Upload View */}
        {currentView === 'upload' && (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Statistical Analysis Made Simple</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Upload your data, choose your analysis, and get plain-English results with beautiful
                visualizations.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-xl font-semibold mb-4 text-center">Upload Your Dataset</h3>
                <FileUpload onFileUpload={handleFileUpload} />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Sample Data */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold mb-4">Try Sample Data</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Explore features with our sample football dataset.
                  </p>
                  <button
                    onClick={handleUseSample}
                    disabled={isAnalyzing}
                    className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-lg"
                  >
                    {isAnalyzing ? 'Loading...' : 'Use Sample'}
                  </button>
                </div>

                {/* History */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold mb-4">Recent Analyses</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Access your saved analyses and reports (login required).
                  </p>
                  <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg">
                    View History
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Analysis View */}
        {currentView === 'analysis' && (
          <div className="max-w-6xl mx-auto">
            <button
              onClick={handleBackToUpload}
              className="mb-6 flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Upload
            </button>

            <DataPreview data={uploadData} onAnalyze={handleAnalyze} />
          </div>
        )}

        {/* Results View */}
        {currentView === 'results' && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleBackToAnalysis}
              className="mb-6 flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Analysis
            </button>

            <AnalysisResults
              results={analysisResults}
              onBack={handleBackToAnalysis}
              filename={uploadData.filename}
              variables={analysisSelection?.variables || []}
              groupVariable={analysisSelection?.groupVariable}
            />
          </div>
        )}

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-gray-700 dark:text-gray-300">Running analysis...</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? <ContactDeveloper />
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
