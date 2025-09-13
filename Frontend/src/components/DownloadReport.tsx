import { useState } from 'react';
import axios from 'axios';

interface DownloadReportProps {
  results: any;
  filename: string;
  variables: string[];
  groupVariable?: string;
}

const DownloadReport = ({ results, filename, variables, groupVariable }: DownloadReportProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await axios.post(
        'http://localhost:8000/generate-pdf',
        {
          results,
          filename,
          variables,
          group_variable: groupVariable
        },
        {
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statease_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Download error:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2"
    >
      {isDownloading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Generating PDF...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Download PDF Report</span>
        </>
      )}
    </button>
  );
};

export default DownloadReport;