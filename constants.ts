import { OS, Tutorial } from './types';

export const SYSTEM_PROMPT_CHAT = `You are DevMentor AI, an expert senior software engineer and patient teacher. 
Your goal is to assist users with coding, environment setup, and debugging.
- Be concise but thorough.
- Always explain commands before asking the user to run them.
- If a command is dangerous (e.g., rm -rf, system resets), warn the user explicitly.
- Use Markdown for code blocks.
- If the user is a beginner, provide step-by-step breakdowns.
- Support all major languages (Python, JS, Java, C++, Rust, Go, etc.).`;

export const SYSTEM_PROMPT_DIAGNOSTICS = `You are an automated Error Diagnostic Engine.
The user will provide an error log or stack trace.
1. Analyze the error.
2. Explain *why* it happened in simple terms.
3. Provide a specific fix (code or command).
4. Provide a rollback strategy if the fix fails.
Format your response clearly with headings using Markdown.`;

export const SYSTEM_PROMPT_TEACHER = `You are a curriculum developer for a coding bootcamp.
Generate a structured programming tutorial based on the user's topic request.
The output should be valid Markdown with sections: Introduction, Prerequisites, Step-by-Step Guide, Code Examples, and Conclusion.
Include a difficulty level recommendation at the top.`;

export const MOCK_TUTORIALS: Tutorial[] = [
  {
    id: '1',
    title: 'Python Environment Setup',
    description: 'Learn how to set up Python, pip, and virtual environments correctly on any OS.',
    difficulty: 'Beginner',
    tags: ['Python', 'Setup', 'Terminal'],
    author: 'DevMentor Team',
    content: `# Python Setup Guide\n\n## 1. Installation\nDownload Python from python.org...\n\n## 2. Virtual Environments\nRunning \`python -m venv venv\` creates an isolated environment...`
  },
  {
    id: '2',
    title: 'React + TypeScript Basics',
    description: 'A crash course in modern React development with strong typing.',
    difficulty: 'Intermediate',
    tags: ['React', 'TypeScript', 'Frontend'],
    author: 'DevMentor Team',
    content: `# React with TypeScript\n\nStart by creating a project:\n\`\`\`bash\nnpm create vite@latest my-app -- --template react-ts\n\`\`\`\n`
  },
  {
    id: '3',
    title: 'Docker for Beginners',
    description: 'Containerize your first application.',
    difficulty: 'Advanced',
    tags: ['DevOps', 'Docker'],
    author: 'Community',
    content: `# Docker 101\n\nCreate a \`Dockerfile\`:\n\`\`\`dockerfile\nFROM node:18\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["npm", "start"]\n\`\`\``
  }
];

export const TERMINAL_CHEATSHEET = [
  { cmd: 'ls', desc: 'List files (Unix)', os: [OS.MacOS, OS.Linux] },
  { cmd: 'dir', desc: 'List files (Windows)', os: [OS.Windows] },
  { cmd: 'cd <path>', desc: 'Change directory', os: [OS.Windows, OS.MacOS, OS.Linux] },
  { cmd: 'mkdir <name>', desc: 'Create directory', os: [OS.Windows, OS.MacOS, OS.Linux] },
  { cmd: 'grep <text> <file>', desc: 'Search text in file', os: [OS.MacOS, OS.Linux] },
  { cmd: 'findstr <text> <file>', desc: 'Search text in file', os: [OS.Windows] },
];