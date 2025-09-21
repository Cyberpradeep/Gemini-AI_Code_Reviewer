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
- **Deployment:** Vercel (for hosting and serverless functions)
- **Icons:** A custom set of SVG icons for a clean look.

---

## Getting Started

To run this project locally, you'll need to have Node.js and the [Vercel CLI](https://vercel.com/docs/cli) installed. This project uses a serverless function to securely handle the API key, and the Vercel CLI makes it easy to replicate that environment locally.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-code-reviewer.git
cd ai-code-reviewer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

You'll need a Google Gemini API key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

Create a new file named `.env` in the root of your project and add your API key:

```
API_KEY= add you key from google AI Studio
```

### 4. Run the Development Server

Use the Vercel CLI to run the project. This will start a local server and handle the serverless function in the `api/` directory correctly.

```bash
vercel dev
```

The application should now be running at `http://localhost:3000`.

---

## Deployment to Vercel

Deploying this application to Vercel is straightforward.

1.  **Push to Git:** Make sure your project is on a Git provider like GitHub, GitLab, or Bitbucket.
2.  **Import Project:** In your Vercel dashboard, click "Add New..." -> "Project" and import your Git repository.
3.  **Configure Environment Variable:**
    -   Navigate to the project's **Settings** tab.
    -   Go to the **Environment Variables** section.
    -   Add a new variable with the name `API_KEY` and paste your Google Gemini API key as the value.
4.  **Deploy:** Click the "Deploy" button. Vercel will automatically build and deploy your application.
