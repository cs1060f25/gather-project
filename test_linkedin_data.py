import pytest
import pandas as pd
import os
import sys
import pathlib

# Add the project root to the Python path
sys.path.append(str(pathlib.Path(__file__).parent))
from generate_data import generate_linkedin_data

def test_generate_linkedin_data():
    """Test that the data generation function creates profiles with all required fields."""
    # Generate test data
    num_profiles = 5
    profiles = generate_linkedin_data(num_profiles=num_profiles)
    
    # Convert to DataFrame for easier testing
    df = pd.DataFrame(profiles)
    
    # Test 1: Check the correct number of profiles were generated
    assert len(df) == num_profiles, f"Expected {num_profiles} profiles, got {len(df)}"
    
    # Test 2: Check all required fields exist
    required_fields = [
        'id', 'first_name', 'last_name', 'email', 'headline', 'location',
        'summary', 'experience', 'education', 'skills', 'linkedin_url',
        'prep_notes', 'interests', 'last_active', 'is_online',
        'mutual_connections', 'chat_available'
    ]
    
    for field in required_fields:
        assert field in df.columns, f"Missing required field: {field}"
    
    # Test 3: Check data types
    assert pd.api.types.is_bool_dtype(df['is_online']), "is_online should be boolean"
    assert pd.api.types.is_bool_dtype(df['chat_available']), "chat_available should be boolean"
    assert pd.api.types.is_numeric_dtype(df['mutual_connections']), "mutual_connections should be numeric"
    
    # Test 4: Check for empty values in required fields
    for field in ['id', 'first_name', 'last_name', 'email']:
        assert not df[field].isnull().any(), f"Field {field} contains null values"
    
    print("All tests passed!")

if __name__ == "__main__":
    test_generate_linkedin_data()
    print("✅ All tests passed!")
