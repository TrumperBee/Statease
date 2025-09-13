import pandas as pd
import numpy as np
from typing import Dict, List, Any
import re

def validate_filename(filename: str) -> bool:
    """Validate filename to prevent path traversal and other attacks"""
    if not filename:
        return False
    
    # Check for path traversal attempts
    if '../' in filename or '..\\' in filename:
        return False
    
    # Check for dangerous characters
    if re.search(r'[<>:"|?*]', filename):
        return False
    
    # Check extension
    allowed_extensions = {'.csv', '.xlsx'}
    if not any(filename.lower().endswith(ext) for ext in allowed_extensions):
        return False
    
    return True

def read_dataframe(file_path: str, file_extension: str) -> pd.DataFrame:
    """Read dataframe from file with appropriate method"""
    try:
        if file_extension == '.csv':
            df = pd.read_csv(file_path)
        elif file_extension == '.xlsx':
            df = pd.read_excel(file_path, engine='openpyxl')
        else:
            raise ValueError(f"Unsupported file extension: {file_extension}")
        
        return df
    
    except Exception as e:
        raise ValueError(f"Error reading file: {str(e)}")

def infer_column_types(df: pd.DataFrame) -> Dict[str, str]:
    """Infer column types (numeric/categorical/date)"""
    column_types = {}
    
    for column in df.columns:
        # Check if column is numeric
        if pd.api.types.is_numeric_dtype(df[column]):
            column_types[column] = 'numeric'
        # Check if column is datetime
        elif pd.api.types.is_datetime64_any_dtype(df[column]):
            column_types[column] = 'date'
        else:
            # Treat everything else as categorical
            column_types[column] = 'categorical'
    
    return column_types

def get_descriptive_stats(df: pd.DataFrame) -> Dict[str, Any]:
    """Get basic descriptive statistics for numeric columns"""
    stats = {}
    
    for column in df.select_dtypes(include=[np.number]).columns:
        col_data = df[column].dropna()
        stats[column] = {
            'count': len(col_data),
            'mean': float(col_data.mean()) if len(col_data) > 0 else None,
            'median': float(col_data.median()) if len(col_data) > 0 else None,
            'std': float(col_data.std()) if len(col_data) > 0 and len(col_data) > 1 else None,
            'min': float(col_data.min()) if len(col_data) > 0 else None,
            'max': float(col_data.max()) if len(col_data) > 0 else None,
            'missing': int(df[column].isnull().sum()),
            'skewness': float(col_data.skew()) if len(col_data) > 0 else None
        }
    
    return stats

def get_preview_data(df: pd.DataFrame, rows: int = 100) -> List[Dict]:
    """Get preview data for frontend display"""
    preview_df = df.head(rows)
    # Convert NaN to None for JSON serialization
    preview_data = preview_df.replace({np.nan: None}).to_dict('records')
    return preview_data