import requests
import json
import os

BASE_URL = "http://localhost:8000"
TEST_USER = {
    "username": "testuser4",
    "email": "test4@example.com",
    "password": "testpassword123"
}

def test_register_user():
    """Test user registration"""
    response = requests.post(f"{BASE_URL}/users/", json=TEST_USER)
    print(f"\nRegister User Response (Status: {response.status_code}):")
    print(response.json())
    return response.json()

def test_login():
    """Test user login and get token"""
    data = {
        "username": TEST_USER["username"],
        "password": TEST_USER["password"]
    }
    response = requests.post(f"{BASE_URL}/auth/token", data=data)
    print(f"\nLogin Response (Status: {response.status_code}):")
    print(response.json())
    return response.json().get("access_token")

def test_get_current_user(token):
    """Test getting current user profile"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    print(f"\nGet Current User Response (Status: {response.status_code}):")
    print(response.json())

def create_test_file(content="Test mod content"):
    """Create a test file for upload"""
    filename = "test_mod.zip"
    with open(filename, "wb") as f:
        f.write(content.encode())
    return filename

def test_create_mod(token):
    """Test creating a new mod"""
    headers = {"Authorization": f"Bearer {token}"}
    
    filename = create_test_file()
    
    with open(filename, "rb") as f:
        files = {"file": (filename, f)}
        data = {
            "title": "Test Mod",
            "description": "A test mod description"
        }
        response = requests.post(
            f"{BASE_URL}/mods/",
            data=data,
            files=files,
            headers=headers
        )
    
    if os.path.exists(filename):
        os.remove(filename)
    
    print(f"\nCreate Mod Response (Status: {response.status_code}):")
    print(response.json())
    return response.json()

def test_list_mods():
    """Test listing all mods"""
    response = requests.get(f"{BASE_URL}/mods/")
    print(f"\nList Mods Response (Status: {response.status_code}):")
    print(response.json())
    return response.json()

def test_get_mod(mod_id):
    """Test getting a specific mod"""
    response = requests.get(f"{BASE_URL}/mods/{mod_id}")
    print(f"\nGet Mod Response (Status: {response.status_code}):")
    print(response.json())

def test_get_download_url(mod_id):
    """Test getting mod download URL and downloading the file"""
    response = requests.get(f"{BASE_URL}/mods/{mod_id}/download")
    print(f"\nGet Download URL Response (Status: {response.status_code}):")
    print(response.json())
    
    # Try downloading the file
    download_url = response.json()["download_url"]
    if download_url.startswith("/download/"):
        download_url = f"{BASE_URL}{download_url}"
    
    download_response = requests.get(download_url)
    print(f"Download File Response Status: {download_response.status_code}")
    return download_response.status_code == 200

def test_update_mod(token, mod_id):
    """Test updating a mod"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {
        "title": "Updated Test Mod",
        "description": "Updated test mod description"
    }
    response = requests.put(
        f"{BASE_URL}/mods/{mod_id}",
        headers=headers,
        json=data
    )
    print(f"\nUpdate Mod Response (Status: {response.status_code}):")
    print(response.json())

def test_delete_mod(token, mod_id):
    """Test deleting a mod"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.delete(
        f"{BASE_URL}/mods/{mod_id}",
        headers=headers
    )
    print(f"\nDelete Mod Response (Status: {response.status_code})")
    return response.status_code == 204

def run_all_tests():
    """Run all endpoint tests in sequence"""
    print("Starting endpoint tests...")
    
    # Register new user
    user = test_register_user()
    
    # Login and get token
    token = test_login()
    
    # Get user profile
    test_get_current_user(token)
    
    # Create a new mod
    mod = test_create_mod(token)
    mod_id = mod["id"]
    
    # List all mods
    mods = test_list_mods()
    
    # Get specific mod
    test_get_mod(mod_id)
    
    # Get download URL and try downloading
    download_success = test_get_download_url(mod_id)
    print(f"\nDownload test successful: {download_success}")
    
    # Update mod
    test_update_mod(token, mod_id)
    
    # Delete mod
    delete_success = test_delete_mod(token, mod_id)
    print(f"\nDelete test successful: {delete_success}")
    
    print("\nAll tests completed!")

if __name__ == "__main__":
    run_all_tests()