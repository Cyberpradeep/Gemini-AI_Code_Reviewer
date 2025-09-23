# AI Code Reviewer powered by Gemini

An automated code review tool that uses the Google Gemini API to analyze your code and provide detailed feedback on correctness, performance, security, and best practices.

**[View the Live Demo](https://gemini-ai-code-reviewer.vercel.app/)**

![AI Code Reviewer Screenshot](https://storage.googleapis.com/aistudio-o-images/project_showcase/17e293a3-a800-4752-921c-43f140654c60.png)

## Key Features

- ** AI-Powered Feedback:** Get instant, detailed code reviews from the Gemini API.
- ** Multi-Language Support:** Works with JavaScript, Python, TypeScript, Java, C#, Go, and more.
- ** Focused Reviews:** Select specific areas like Performance, Security, or Best Practices to guide the AI's analysis.
- ** Interactive Chat:** Ask follow-up questions to clarify suggestions and dive deeper into the code.
- ** Code Diff Preview:** See a clear, color-coded before-and-after comparison of suggested changes.
- ** One-Click Apply:** Instantly apply code fixes directly to your input with a single click.
- ** Review History:** Your past reviews are saved in your browser's local storage for easy access.
- ** Export Conversation:** Download your full code review conversation as a Markdown or plain text file.
- ** Responsive Design:** A clean, modern UI that works beautifully on both desktop and mobile devices.

## Tech Stack

- **Framework:** React with TypeScript
- **Styling:** Tailwind CSS
- **AI Model:** Google Gemini API (`@google/genai`)
- **Deployment:** Vercel

---

## Getting Started

This project is a client-side web application that uses a serverless backend function (included in the `/api` directory) to securely handle the API key.

### 1. Get a Gemini API Key

You can get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 2. Configure Environment Variables

The application's backend function expects the API key to be available as an environment variable named `API_KEY` in the deployment environment. This is a security best practice to avoid exposing your key on the client-side.

---

## Deployment to Vercel

Deploying this application to Vercel is straightforward.

1.  **Push to Git:** Make sure your project is on a Git provider like GitHub, GitLab, or Bitbucket.
2.  **Import Project:** In your Vercel dashboard, click "Add New..." -> "Project" and import your Git repository. Vercel should automatically detect that it's a Vite project.
3.  **Configure Environment Variable:**
    -   Navigate to your project's **Settings** tab in Vercel.
    -   Go to the **Environment Variables** section.
    -   Add a new variable with the name `API_KEY` and paste your Google Gemini API key as the value.
    -   **Important:** Ensure the variable is **NOT** exposed to the browser. Vercel will automatically make it available to the backend API functions in the `/api` directory, which is the intended secure setup for this project.
4.  **Deploy:** Click the "Deploy" button. Vercel will automatically build your frontend and deploy the serverless functions.