import os
import frontmatter
import glob
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID, uuid3, NAMESPACE_DNS

from app.utils.parse_problem import parse_problem_content, PROBLEMS_DIR

from google.cloud import storage
from google.api_core import exceptions

# Import project-specific dependencies
from ..database import get_db
from .. import models, schemas
from ..auth import validate_token

# ==============================================================================
# Router Configuration & GCS Setup
# ==============================================================================

router = APIRouter(
    prefix="/api/problems",  # All routes in this file will start with /api/problems
    tags=["Problems"]        # Tag for the auto-generated API docs
)

# Load configuration from environment variables
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")
ADMIN_USER_ID = os.getenv("ADMIN_USER_ID")

# Initialize Google Cloud Storage client
try:
    if not GCS_BUCKET_NAME:
        raise ValueError("GCS_BUCKET_NAME environment variable is not set.")
    if not ADMIN_USER_ID:
        raise ValueError("ADMIN_USER_ID environment variable is not set.")
        
    storage_client = storage.Client()
    bucket = storage_client.bucket(GCS_BUCKET_NAME)
except Exception as e:
    # If GCS fails, log the error but allow the app to start.
    # Endpoints that need GCS will fail gracefully.
    print(f"Warning: Could not initialize GCS client. {e}")
    storage_client = None
    bucket = None

# ==============================================================================
# Authentication Dependencies
# ==============================================================================

async def require_admin(token: dict = Depends(validate_token)):
    """
    A FastAPI dependency that validates a user's token and checks
    if their user_id matches the one specified in the ADMIN_USER_ID
    environment variable.
    In development mode, always allows access.
    """
    # In development mode, skip admin check
    if not GCS_BUCKET_NAME:  # Dev mode indicator
        return token
    
    user_id = token.get("sub") # "sub" is the standard Auth0 claim for user ID
    
    if user_id != ADMIN_USER_ID:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )
    return token

# ==============================================================================
# Problem API Endpoints
# ==============================================================================

@router.post(
    "/upload", 
    response_model=schemas.Problem, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)] # Secures this endpoint
)
async def upload_problem(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Admin-only endpoint to upload a new problem.
    1. Parses the .md file's frontmatter.
    2. Uploads the full file to Google Cloud Storage.
    3. Creates a new Problem record in the Postgres database.
    """
    if not bucket:
        raise HTTPException(status_code=500, detail="GCS not initialized")

    try:
        content_bytes = await file.read()
        content_str = content_bytes.decode('utf-8')
        
        post = frontmatter.loads(content_str)
        metadata = post.metadata
        file_path = f"problems/{file.filename}"

        # Upload the full file to GCS
        blob = bucket.blob(file_path)
        blob.upload_from_string(
            content_bytes,
            content_type='text/markdown'
        )

        # Create the new Problem record in Postgres
        new_problem = models.Problem(
            title=metadata.get('title'),
            description=metadata.get('description'),
            difficulty=metadata.get('difficulty'),
            author=metadata.get('author'),
            tags=metadata.get('tags'),
            update_log=metadata.get('update_log'),
            file_path=file_path
        )
        
        db.add(new_problem)
        db.commit()
        db.refresh(new_problem)
        
        return new_problem

    except Exception as e:
        # If any part fails, roll back the database transaction
        db.rollback()
        # TODO: Add logic here to delete the file from GCS if the DB write fails
        raise HTTPException(status_code=500, detail=f"Failed to upload: {str(e)}")


@router.get("/dev", response_model=List[schemas.Problem])
async def list_problems_dev():
    """
    Development-only endpoint that loads problems directly from the problems/ directory.
    Returns problems in the same format as the database endpoint.
    Uses filename (without .md) as a stable problem_id for development.
    """
    try:
        files = glob.glob(os.path.join(PROBLEMS_DIR, "*.md"))
        problems = []
        
        for file_path in files:
            filename = os.path.basename(file_path)
            problem_id_str = os.path.splitext(filename)[0]
            
            try:
                post = frontmatter.load(file_path)
                metadata = post.metadata
                
                # Create a stable UUID from the filename for consistency
                # This ensures the same filename always generates the same UUID
                problem_uuid = uuid3(NAMESPACE_DNS, f"dev-problem-{problem_id_str}")
                
                # Create a Problem-like object matching the schema
                problem_data = {
                    "problem_id": problem_uuid,
                    "title": metadata.get("title", ""),
                    "description": metadata.get("description", ""),
                    "difficulty": metadata.get("difficulty", ""),
                    "author": metadata.get("author", ""),
                    "tags": metadata.get("tags", []),
                    "update_log": metadata.get("update_log", []),
                    "file_path": f"problems/{filename}",
                    "created_at": datetime.now(),
                }
                
                # Validate against schema
                problem = schemas.Problem(**problem_data)
                problems.append(problem)
            except Exception as e:
                print(f"Error parsing {filename}: {e}")
                continue
        
        print(f"Found {len(problems)} problems in directory")  # Debug logging
        return problems
    except Exception as e:
        print(f"Error loading problems from directory: {e}")  # Debug logging
        raise HTTPException(status_code=500, detail=f"Directory error: {str(e)}")


@router.get("/", response_model=List[schemas.Problem])
async def list_problems(db: Session = Depends(get_db)):
    """
    Fetches the list of all problem metadata from Postgres.
    This is a fast, public endpoint that does NOT hit GCS.
    Used to populate the main problem selection page.
    """
    try:
        problems = db.query(models.Problem).all()
        print(f"Found {len(problems)} problems in database")  # Debug logging
        return problems
    except Exception as e:
        print(f"Error querying problems from database: {e}")  # Debug logging
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/dev/{problem_id}", response_model=schemas.ProblemDetail)
async def get_single_problem_details_dev(problem_id: str):
    """
    Development-only endpoint that loads a problem directly from the problems/ directory.
    problem_id should be the filename without .md extension (e.g., "BMI" for "BMI.md").
    """
    file_path = os.path.join(PROBLEMS_DIR, f"{problem_id}.md")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Problem not found: {problem_id}")
    
    try:
        # Load and parse the markdown file
        post = frontmatter.load(file_path)
        metadata = post.metadata
        
        # Parse the problem content
        parsed_data = parse_problem_content(post.content, post.metadata)
        
        # Create a stable UUID from the filename (same as in list_problems_dev)
        problem_uuid = uuid3(NAMESPACE_DNS, f"dev-problem-{problem_id}")
        
        # Create base problem data matching the Problem schema
        base_data = {
            "problem_id": problem_uuid,
            "title": metadata.get("title", ""),
            "description": metadata.get("description", ""),
            "difficulty": metadata.get("difficulty", ""),
            "author": metadata.get("author", ""),
            "tags": metadata.get("tags", []),
            "update_log": metadata.get("update_log", []),
            "file_path": f"problems/{problem_id}.md",
            "created_at": datetime.now(),
        }
        
        # Combine base data with parsed data
        final_data_dict = {**base_data, **parsed_data}
        
        # Validate against ProblemDetail schema
        try:
            final_response = schemas.ProblemDetail.model_validate(final_data_dict)
            return final_response
        except Exception as validation_error:
            print(f"FINAL RESPONSE VALIDATION FAILED: {validation_error}")
            raise HTTPException(500, detail=f"Response validation error: {validation_error}")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading problem: {str(e)}")


@router.get("/{problem_id}", response_model=schemas.ProblemDetail)
async def get_single_problem_details(
    problem_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Fetches a single problem's complete details.
    1. Gets all metadata from Postgres.
    2. Gets the full markdown file content from GCS.
    3. Combines them into a single ProblemDetail response.
    """
    if not bucket:
        raise HTTPException(status_code=500, detail="GCS not initialized")

    # 1. Get metadata from Postgres
    problem_db = db.query(models.Problem).filter(models.Problem.problem_id == problem_id).first()
        
    if not problem_db:
        raise HTTPException(status_code=404, detail="Problem not found")

    try:
        # 2. Get the full file content from GCS
        blob = bucket.blob(problem_db.file_path)
        markdown_content = blob.download_as_text()
        
        # 3. Separate frontmatter from the main content
        post = frontmatter.loads(markdown_content)

        # 4. Call your parser with the content and metadata
        #    This returns a dict with all your parsed fields
        parsed_data = parse_problem_content(post.content, post.metadata)

        # 5. Get the base data from the DB model
        #    (Using the 'Problem' schema we assumed you have)
        db_data = schemas.Problem.model_validate(problem_db).model_dump()

        # 6. Combine the two dictionaries
        #    Start with DB data, then add/overwrite with parsed data
        final_data_dict = {**db_data, **parsed_data}

        # 7. Validate the final flat object against the response schema
        #    This ensures the data is correct before sending
        try:
            final_response = schemas.ProblemDetail.model_validate(final_data_dict)
            return final_response
        except Exception as validation_error:
            # This is for debugging schema mismatches
            print(f"FINAL RESPONSE VALIDATION FAILED: {validation_error}")
            raise HTTPException(500, detail=f"Response validation error: {validation_error}")
        
    except exceptions.NotFound:
        raise HTTPException(status_code=404, detail=f"File not found in GCS for problem {problem_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching file: {str(e)}")

