import type { ProjectFile } from '../App';

export const config = {
  runtime: 'edge',
};

const IGNORED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico',
  'mp4', 'webm', 'ogg', 'mp3', 'wav',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'rar', 'gz', '7z',
  'lock', 'sum',
  'eot', 'ttf', 'woff', 'woff2'
]);

// Helper to parse GitHub URLs
const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'github.com') {
      return null;
    }
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return null;
    }
    const [owner, repo] = pathParts;
    return { owner, repo: repo.replace('.git', '') };
  } catch (error) {
    return null;
  }
};

const createErrorResponse = (message: string, status: number) => {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const { url } = await request.json();
    if (!url) {
      return createErrorResponse('URL is required', 400);
    }

    const repoInfo = parseGitHubUrl(url);
    if (!repoInfo) {
      return createErrorResponse('Invalid GitHub repository URL', 400);
    }

    const { owner, repo } = repoInfo;
    const headers = { 'User-Agent': 'ai-code-reviewer-app' };
    
    // Try 'main' branch first, then fall back to 'master'
    const mainUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
    let treeResponse = await fetch(mainUrl, { headers });

    if (treeResponse.status === 404) {
      const masterUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
      treeResponse = await fetch(masterUrl, { headers });
    }

    if (!treeResponse.ok) {
        const errorData = await treeResponse.json().catch(() => ({}));
        const githubMessage = errorData.message || 'Could not retrieve repository data.';

        if (treeResponse.status === 404) {
            return createErrorResponse("Repository not found. Please check the URL and ensure it's a public repository with a 'main' or 'master' branch.", 404);
        }
        if (treeResponse.status === 403) {
            return createErrorResponse(`GitHub API rate limit exceeded. Please wait and try again. (${githubMessage})`, 403);
        }
        return createErrorResponse(`Failed to fetch repository from GitHub: ${githubMessage}`, treeResponse.status);
    }
    
    const { tree, truncated } = await treeResponse.json();

    if (truncated) {
        return createErrorResponse('Repository is too large to process. Please try a smaller repository.', 413);
    }

    const textFiles = tree.filter((file: any) => 
        file.type === 'blob' && 
        !IGNORED_EXTENSIONS.has(file.path.split('.').pop()?.toLowerCase() || '')
    );
    
    if (textFiles.length > 50) {
        return createErrorResponse('Project contains too many text files (limit is 50). Please try a smaller repository.', 413);
    }

    const filePromises = textFiles.map(async (file: any) => {
      try {
        const contentResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${file.sha}`, { headers });
        if (!contentResponse.ok) return null;
        
        const blob = await contentResponse.json();
        if (blob.encoding !== 'base64') return null;
        
        const content = atob(blob.content);
        return { path: file.path, content };
      } catch {
        return null;
      }
    });

    const resolvedFiles = (await Promise.all(filePromises)).filter(Boolean) as ProjectFile[];
    
    return new Response(JSON.stringify(resolvedFiles), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-git handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return createErrorResponse(`An internal server error occurred: ${errorMessage}`, 500);
  }
}