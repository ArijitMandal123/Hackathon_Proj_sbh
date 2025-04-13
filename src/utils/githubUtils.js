// Function to extract GitHub username from GitHub URL
export function extractGithubUsername(githubUrl) {
    if (!githubUrl) return null;
    
    try {
        const url = new URL(githubUrl);
        // Handle both github.com/username and github.com/username/
        const pathParts = url.pathname.split('/').filter(Boolean);
        return pathParts[0];
    } catch (error) {
        console.error('Invalid GitHub URL:', error);
        return null;
    }
}

// Function to extract LinkedIn username from LinkedIn URL
export function extractLinkedInUsername(linkedinUrl) {
    if (!linkedinUrl) return null;
    
    try {
        const url = new URL(linkedinUrl);
        // Handle both linkedin.com/in/username and linkedin.com/in/username/
        const pathParts = url.pathname.split('/').filter(Boolean);
        return pathParts[pathParts.length - 1];
    } catch (error) {
        console.error('Invalid LinkedIn URL:', error);
        return null;
    }
}

// Function to get GitHub profile picture
export async function getGithubProfilePicture(githubUrl) {
    const username = extractGithubUsername(githubUrl);
    if (!username) return null;
    
    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.avatar_url;
    } catch (error) {
        console.error('Error fetching GitHub profile picture:', error);
        return null;
    }
}

// Function to get LinkedIn profile picture (requires LinkedIn API access)
// Note: LinkedIn API requires authentication and has strict usage policies
// This is a placeholder that would need to be implemented with proper LinkedIn API credentials
export async function getLinkedInProfilePicture(linkedinUrl) {
    // This would require LinkedIn API integration
    // For now, we'll return null as LinkedIn profile pictures require API access
    return null;
}

// Function to get profile picture from either GitHub or LinkedIn
export async function getProfilePicture(githubUrl, linkedinUrl) {
    // Try GitHub first
    if (githubUrl) {
        const githubPicture = await getGithubProfilePicture(githubUrl);
        if (githubPicture) return githubPicture;
    }
    
    // Try LinkedIn if GitHub fails
    if (linkedinUrl) {
        const linkedinPicture = await getLinkedInProfilePicture(linkedinUrl);
        if (linkedinPicture) return linkedinPicture;
    }
    
    // Return default avatar if no picture is found
    return 'https://ui-avatars.com/api/?name=User&background=random';
}

// Function to calculate experience level based on GitHub activity
export async function calculateGithubExperienceLevel(githubUrl) {
    const username = extractGithubUsername(githubUrl);
    if (!username) return 'Amateur';
    
    try {
        // Fetch user's repositories
        const reposResponse = await fetch(`https://api.github.com/users/${username}/repos`);
        if (!reposResponse.ok) return 'Amateur';
        
        const repos = await reposResponse.json();
        
        // Count repositories
        const repoCount = repos.length;
        
        // Count stars received
        const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        
        // Count contributions (requires additional API call)
        const contributionsResponse = await fetch(`https://api.github.com/users/${username}/events`);
        if (!contributionsResponse.ok) return 'Amateur';
        
        const events = await contributionsResponse.json();
        const contributionCount = events.length;
        
        // Determine experience level based on metrics
        if (repoCount > 20 || totalStars > 100 || contributionCount > 500) {
            return 'Pro';
        } else if (repoCount > 5 || totalStars > 20 || contributionCount > 100) {
            return 'Intermediate';
        } else {
            return 'Amateur';
        }
    } catch (error) {
        console.error('Error calculating GitHub experience level:', error);
        return 'Amateur';
    }
} 