from fastapi import FastAPI, HTTPException, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime

import utils
import statistical_tests
import pdf_generator 

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="StatEase API", version="0.1.0")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],  # Add both origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PDFRequest(BaseModel):
    results: Dict[str, Any]
    filename: str
    variables: List[str]
    group_variable: Optional[str] = None

class AnalysisRequest(BaseModel):
    test_id: str
    variables: List[str]
    group_variable: Optional[str] = None
    filename: str

class AnalysisResponse(BaseModel):
    success: bool
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ContactResponse(BaseModel):
    message: str
    redirect_url: Optional[str] = None

class UploadResponse(BaseModel):
    success: bool
    message: str
    filename: Optional[str] = None
    preview_data: Optional[List[Dict]] = None
    column_types: Optional[Dict[str, str]] = None
    stats: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ColumnInfo(BaseModel):
    name: str
    type: str
    stats: Optional[Dict[str, Any]] = None


@app.get("/test-pdf")
async def test_pdf():
    """Test endpoint to verify PDF generation works"""
    try:
        # Create test data
        test_results = {
            'test': 'independent_t_test',
            't_statistic': 2.345,
            'p_value': 0.023,
            'df': 28,
            'group1': {
                'name': 'Team A',
                'mean': 8.33,
                'std': 2.94,
                'n': 15
            },
            'group2': {
                'name': 'Team B',
                'mean': 10.67,
                'std': 3.21,
                'n': 15
            },
            'effect_size': {
                'cohens_d': 0.78,
                'interpretation': 'medium'
            },
            'interpretation': 'Independent t-test showed a significant difference between groups.'
        }
        
        pdf_bytes = pdf_generator.generate_pdf_report(
            test_results,
            "test_data.csv",
            ["goals"],
            "team"
        )
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=test_report.pdf"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test PDF generation failed: {str(e)}")


@app.post("/generate-pdf")
async def generate_pdf(request: PDFRequest):
    try:
        pdf_bytes = pdf_generator.generate_pdf_report(
            request.results,
            request.filename,
            request.variables,
            request.group_variable
        )
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=statease_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_data(request: AnalysisRequest):
    try:
        # TEMP: Using sample data (replace with actual storage later)
        file_path = os.path.join('sample_data', 'sample.csv')
        
        # Read the data
        file_extension = os.path.splitext(request.filename)[1].lower()
        df = utils.read_dataframe(file_path, file_extension)
        
        # Get the test function
        test_function = statistical_tests.TEST_FUNCTIONS.get(request.test_id)
        if not test_function:
            raise HTTPException(status_code=400, detail="Invalid test ID")
        
        # Perform the test
        if request.test_id in ['independent_t', 'anova', 'levene']:
            if len(request.variables) != 1 or not request.group_variable:
                raise HTTPException(status_code=400, detail="This test requires one numeric variable and one group variable")
            results = test_function(df, request.variables[0], request.group_variable)
        elif request.test_id in ['paired_t', 'pearson', 'spearman', 'chi_square']:
            if len(request.variables) != 2:
                raise HTTPException(status_code=400, detail="This test requires exactly two variables")
            results = test_function(df, request.variables[0], request.variables[1])
        elif request.test_id in ['shapiro_wilk']:
            if len(request.variables) != 1:
                raise HTTPException(status_code=400, detail="This test requires exactly one variable")
            results = test_function(df, request.variables[0])
        else:
            raise HTTPException(status_code=400, detail="Unsupported test type")
        
        return AnalysisResponse(success=True, results=results)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing analysis: {str(e)}")


@app.get("/")
async def root():
    return {"message": "StatEase API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "StatEase API"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "StatEase API",
        "version": "1.0.0"
    }
@app.get("/contact")
async def contact_developer():
    whatsapp_number = os.environ.get("WHATSAPP_NUMBER")
    
    if not whatsapp_number:
        raise HTTPException(
            status_code=500, 
            detail="Contact service not configured"
        )
    
    # Clean the number (remove any non-digit characters)
    cleaned_number = ''.join(filter(str.isdigit, whatsapp_number))
    
    # Create the WhatsApp API URL
    redirect_url = f"https://wa.me/{cleaned_number}?text=Hi%20TRUMPERBEE"
    
    return ContactResponse(
        message="Redirecting to WhatsApp",
        redirect_url=redirect_url
    )


@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    try:
        if not utils.validate_filename(file.filename):
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ['.csv', '.xlsx']:
            raise HTTPException(status_code=400, detail="Only CSV and XLSX files are supported")
        
        max_size = 10 * 1024 * 1024  # 10MB
        content = await file.read()
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            df = utils.read_dataframe(temp_file_path, file_extension)
            
            if df.empty:
                raise HTTPException(status_code=400, detail="File is empty")
            
            if len(df) > 100000:
                raise HTTPException(status_code=400, detail="File exceeds maximum row limit of 100,000")
            
            preview_data = utils.get_preview_data(df, 100)
            column_types = utils.infer_column_types(df)
            stats = utils.get_descriptive_stats(df)
            
            return UploadResponse(
                success=True,
                message="File uploaded successfully",
                filename=file.filename,
                preview_data=preview_data,
                column_types=column_types,
                stats=stats
            )
            
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
