from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

load_dotenv()

# Initialize Firebase
cred = credentials.Certificate("service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # Allow both ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load BART model and tokenizer
tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-mnli")
model = AutoModelForSequenceClassification.from_pretrained("facebook/bart-large-mnli")

class GitHubProfile(BaseModel):
    username: str
    user_id: str

class UpdatePoints(BaseModel):
    user_id: str
    points: int

def classify_repository_difficulty(readme_content: str) -> str:
    try:
        # Define difficulty categories
        categories = ["easy", "medium", "hard"]
        
        # Prepare the input for classification
        inputs = tokenizer(readme_content, return_tensors="pt", truncation=True, max_length=512)
        
        # Get model predictions
        with torch.no_grad():
            outputs = model(**inputs)
            scores = torch.softmax(outputs.logits, dim=1)
            
        # Get the predicted category
        predicted_idx = torch.argmax(scores).item()
        return categories[predicted_idx]
    except Exception as e:
        print(f"Error in classify_repository_difficulty: {str(e)}")
        # Return a default value instead of raising an exception
        return "medium"

def calculate_points(repos_data: list, user_data: dict) -> dict:
    try:
        total_points = 0
        repo_details = []
        
        # Base points for account age (up to 100 points)
        try:
            account_age_days = (datetime.now() - datetime.fromisoformat(user_data['created_at'])).days
            account_age_points = min(account_age_days / 30, 100)  # 100 points max for account age
            total_points += account_age_points
        except Exception as e:
            print(f"Error calculating account age points: {str(e)}")
            account_age_points = 0
        
        # Points for followers (up to 50 points)
        try:
            follower_points = min(user_data['followers'] * 2, 50)
            total_points += follower_points
        except Exception as e:
            print(f"Error calculating follower points: {str(e)}")
            follower_points = 0
        
        # Points for public repos (up to 30 points)
        try:
            repo_count_points = min(len(repos_data) * 2, 30)
            total_points += repo_count_points
        except Exception as e:
            print(f"Error calculating repo count points: {str(e)}")
            repo_count_points = 0
        
        for repo in repos_data[:5]:  # Consider top 5 repos
            try:
                repo_points = 0
                repo_details.append({
                    "name": repo['name'],
                    "stars": repo['stargazers_count'],
                    "forks": repo['forks_count'],
                    "commits": 0  # Will be updated with actual commit count
                })
                
                # Base points for each repo (10 points)
                repo_points += 10
                
                # Points for stars (up to 50 points per repo)
                star_points = min(repo['stargazers_count'], 50)
                repo_points += star_points
                
                # Points for forks (up to 25 points per repo)
                fork_points = min(repo['forks_count'], 25)
                repo_points += fork_points
                
                # Get commit count
                try:
                    commits_url = f"https://api.github.com/repos/{repo['full_name']}/commits"
                    commits_response = requests.get(commits_url, headers={"Authorization": f"token {os.getenv('GITHUB_TOKEN')}"})
                    if commits_response.status_code == 200:
                        commit_count = len(commits_response.json())
                        repo_details[-1]["commits"] = commit_count
                        # Points for commits (up to 30 points per repo)
                        commit_points = min(commit_count, 30)
                        repo_points += commit_points
                except Exception as e:
                    print(f"Error fetching commits for {repo['full_name']}: {str(e)}")
                
                # Classify repository difficulty
                try:
                    readme_response = requests.get(f"https://raw.githubusercontent.com/{repo['full_name']}/master/README.md")
                    if readme_response.status_code == 200:
                        try:
                            difficulty = classify_repository_difficulty(readme_response.text)
                            repo_details[-1]["difficulty"] = difficulty
                            # Difficulty multiplier
                            if difficulty == "hard":
                                repo_points *= 2
                            elif difficulty == "medium":
                                repo_points *= 1.5
                        except Exception as e:
                            print(f"Error classifying repository difficulty for {repo['full_name']}: {str(e)}")
                            repo_details[-1]["difficulty"] = "unknown"
                    else:
                        repo_details[-1]["difficulty"] = "unknown"
                except Exception as e:
                    print(f"Error fetching README for {repo['full_name']}: {str(e)}")
                    repo_details[-1]["difficulty"] = "unknown"
                
                total_points += repo_points
            except Exception as e:
                print(f"Error processing repository: {str(e)}")
                # Continue with the next repository
        
        return {
            "total_points": total_points,
            "repo_details": repo_details,
            "account_age_points": account_age_points,
            "follower_points": follower_points,
            "repo_count_points": repo_count_points
        }
    except Exception as e:
        print(f"Unexpected error in calculate_points: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

@app.post("/")
async def root():
    return {"message": "Hello from home page"}

@app.get("/api/test")
async def test():
    return {"message": "Hello World"}

@app.post("/analyze-github-profile")
async def analyze_github_profile(profile: GitHubProfile):
    try:
        print(f"Received request to analyze GitHub profile for username: {profile.username}, user_id: {profile.user_id}")
        
        # Get GitHub API token from environment variable
        github_token = os.getenv("GITHUB_TOKEN")
        if not github_token:
            print("Warning: GITHUB_TOKEN not found in environment variables")
            headers = {}
        else:
            headers = {"Authorization": f"token {github_token}"}
        
        # Fetch user data
        user_url = f"https://api.github.com/users/{profile.username}"
        print(f"Fetching user data from: {user_url}")
        user_response = requests.get(user_url, headers=headers)
        
        if user_response.status_code != 200:
            error_msg = f"GitHub profile not found. Status code: {user_response.status_code}, Response: {user_response.text}"
            print(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
        
        user_data = user_response.json()
        print(f"Successfully fetched user data for {profile.username}")
        
        # Fetch user's public repositories
        repos_url = f"https://api.github.com/users/{profile.username}/repos"
        print(f"Fetching repositories from: {repos_url}")
        repos_response = requests.get(repos_url, headers=headers)
        
        if repos_response.status_code != 200:
            error_msg = f"Failed to fetch repositories. Status code: {repos_response.status_code}, Response: {repos_response.text}"
            print(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
        
        repos_data = repos_response.json()
        print(f"Successfully fetched {len(repos_data)} repositories")
        
        # Sort repositories by stars
        repos_data.sort(key=lambda x: x['stargazers_count'], reverse=True)
        
        try:
            # Calculate points and get details
            print("Calculating points...")
            analysis_data = calculate_points(repos_data, user_data)
            print(f"Points calculation complete. Total points: {analysis_data['total_points']}")
        except Exception as e:
            print(f"Error calculating points: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error calculating points: {str(e)}")
        
        try:
            # Update Firestore
            print(f"Updating Firestore for user_id: {profile.user_id}")
            user_ref = db.collection('users').document(profile.user_id)
            user_ref.set({
                'github_username': profile.username,
                'points': analysis_data['total_points'],
                'points_breakdown': {
                    'account_age': analysis_data['account_age_points'],
                    'followers': analysis_data['follower_points'],
                    'repo_count': analysis_data['repo_count_points']
                },
                'last_updated': datetime.now().isoformat()
            }, merge=True)
            print("Firestore update successful")
        except Exception as e:
            print(f"Error updating Firestore: {str(e)}")
            # Continue execution even if Firestore update fails
        
        return {
            "username": profile.username,
            "total_repos": len(repos_data),
            "total_stars": sum(repo['stargazers_count'] for repo in repos_data),
            "total_forks": sum(repo['forks_count'] for repo in repos_data),
            "total_commits": sum(repo['commits'] for repo in analysis_data['repo_details']),
            "repo_details": analysis_data['repo_details'],
            "total_points": analysis_data['total_points']
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Unexpected error in analyze_github_profile: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.post("/update-points")
async def update_user_points(update: UpdatePoints):
    try:
        # Here you would typically update the points in your database
        # For now, we'll just return a success message
        return {
            "message": "Points updated successfully",
            "user_id": update.user_id,
            "new_points": update.points
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 