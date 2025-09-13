import { useState, useRef } from 'react';
import axios from 'axios';

interface FileUploadProps {
  onFileUpload: (data: any) => void;
}

interface UploadResponse {
  success: boolean;
  message: string;
  filename?: string;
  preview_data?: any[];
  column_types?: { [key: string]: string };
  stats?: { [key: string]: any };
  error?: string;
}

const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    '.csv',
    '.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setUploadError(null);

    // validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (
      !acceptedTypes.includes(`.${fileExtension}`) &&
      !acceptedTypes.includes(file.type)
    ) {
      setUploadError('Please upload a CSV or XLSX file only.');
      return;
    }

    // validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(
        'File size must be less than 10MB. For larger files, please use sample mode.'
      );
      return;
    }

    setSelectedFile(file);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post<UploadResponse>(
        `${import.meta.env.VITE_API_URL}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.success) {
        onFileUpload(response.data);
      } else {
        setUploadError(response.data.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      if (error.code === 'ECONNABORTED') {
        setUploadError('Upload timeout. Please try a smaller file.');
      } else if (error.response?.status === 413) {
        setUploadError('File too large. Maximum size is 10MB.');
      } else if (error.response?.status === 400) {
        setUploadError(error.response.data.detail || 'Invalid file format.');
      } else {
        setUploadError(
          error.response?.data?.detail ||
            error.message ||
            'Failed to upload file. Please check your connection and try again.'
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isUploading ? undefined : handleBrowseClick}
      >
        <div className="space-y-4">
          {isUploading ? (
            <div className="w-12 h-12 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          ) : (
            <div className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
          )}

          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {isUploading
                ? 'Uploading...'
                : 'Drop your file here or click to browse'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Supports CSV and XLSX files up to 10MB
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv,.xlsx"
          onChange={handleFileInput}
          disabled={isUploading}
        />
      </div>

      {uploadError && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-red-700 dark:text-red-300">{uploadError}</p>
          </div>
        </div>
      )}

      {selectedFile && !isUploading && !uploadError && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setUploadError(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
