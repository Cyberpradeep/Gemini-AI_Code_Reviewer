import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import { Prism as SyntaxHighlighter } from 'https://esm.sh/react-syntax-highlighter@15.5.0';
import { vscDarkPlus, vs } from 'https://esm.sh/react-syntax-highlighter@15.5.0/dist/esm/styles/prism';

import type { Theme, ChatMessage, ReviewFinding, ProjectFile } from '../App';
import { stripMarkdown } from '../utils/markdownStripper';
import { XIcon } from './icons/XIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { MarkdownIcon } from './icons/MarkdownIcon';
import { PdfIcon } from './icons/PdfIcon';
import { JsonIcon } from './icons/JsonIcon';
import { HtmlIcon } from './icons/HtmlIcon';
import Spinner from './Spinner';

type ExportFormat = 'md' | 'txt' | 'pdf' | 'json' | 'html';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ChatMessage[];
  projectFiles: ProjectFile[];
  language: string;
  theme: Theme;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  conversation,
  projectFiles,
  language,
  theme,
}) => {
  const [format, setFormat] = useState<ExportFormat>('md');
  const [includeCode, setIncludeCode] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const generateMarkdownForFinding = (finding: ReviewFinding): string => {
    let md = `### ${finding.title}\n\n`;
    md += `**Severity:** ${finding.severity}  \n`;
    md += `**Category:** ${finding.category}\n`;
    if (finding.filePath) {
      md += `**File:** \`${finding.filePath}\`\n`;
    }
    md += `\n${finding.summary}\n\n`;
    if (finding.suggestion) {
        md += `**Suggestion:**\n`;
        md += `*Before:*\n\`\`\`${language}\n${finding.suggestion.before}\n\`\`\`\n`;
        md += `*After:*\n\`\`\`${language}\n${finding.suggestion.after}\n\`\`\`\n`;
    }
    if (finding.learnMoreUrl) {
        md += `[Learn More](${finding.learnMoreUrl})\n`;
    }
    return md;
  }

  const generateFileContent = (targetFormat: ExportFormat): string => {
    let header = `# Code Review\n\n**Primary Language:** ${language}\n\n**Exported on:** ${new Date().toLocaleString()}\n\n`;
    let fileContent = '';
    const separator = '\n\n---\n\n';

    if (includeCode) {
      fileContent += `## Original Project Files\n\n`;
      projectFiles.forEach(file => {
        const lang = file.path.split('.').pop() || 'plaintext';
        fileContent += `### \`${file.path}\`\n\n`;
        fileContent += `\`\`\`${lang}\n${file.content}\n\`\`\`\n\n`;
      });
    }

    const chatContent = conversation.map(msg => {
      const author = msg.role === 'user' ? 'You' : 'AI Assistant';
      
      if (Array.isArray(msg.content)) { // Structured review
          const findingsMd = msg.content.map(generateMarkdownForFinding).join('\n\n');
          return `## ${author}:\n\n${findingsMd}`;
      }
      
      // Plain text chat message
      const content = msg.content as string;
      if (targetFormat === 'md' && msg.role === 'user') {
        const quotedContent = content.split('\n').map(line => `> ${line}`).join('\n');
        return `**${author}:**\n\n${quotedContent}`;
      }
      return `**${author}:**\n\n${content}`;
    }).join(separator);

    if (targetFormat === 'txt') {
        return stripMarkdown(header + fileContent + separator + chatContent);
    }
    return header + fileContent + separator + chatContent;
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const generatePdf = async () => {
    if (!pdfContentRef.current) return;
    setIsExporting(true);
    try {
        const canvas = await html2canvas(pdfContentRef.current, {
            scale: 2,
            backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF',
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / pdfWidth;
        const newCanvasHeight = canvasHeight / ratio;

        let heightLeft = newCanvasHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, newCanvasHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - newCanvasHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, newCanvasHeight);
            heightLeft -= pdfHeight;
        }
        
        const fileName = `code-review-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Sorry, there was an error generating the PDF.");
    } finally {
        setIsExporting(false);
        onClose();
    }
  };


  const handleExport = async () => {
    const fileBaseName = `code-review-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'pdf') {
        await generatePdf();
        return;
    }

    setIsExporting(true);

    switch(format) {
      case 'md':
        downloadFile(generateFileContent('md'), `${fileBaseName}.md`, 'text/markdown');
        break;
      case 'txt':
        downloadFile(generateFileContent('txt'), `${fileBaseName}.txt`, 'text/plain');
        break;
      case 'json':
        const jsonContent = {
            title: "Code Review",
            language,
            exportedAt: new Date().toISOString(),
            projectFiles: includeCode ? projectFiles : undefined,
            conversation,
        };
        downloadFile(JSON.stringify(jsonContent, null, 2), `${fileBaseName}.json`, 'application/json');
        break;
      case 'html':
         const htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Code Review</title>
              <style>
                body { font-family: sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
                pre { background: #f4f4f4; padding: 15px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
                code { font-family: monospace; }
                .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
                .user { background: #e0f7fa; border-left: 3px solid #00acc1; }
                .model { background: #f1f1f1; border-left: 3px solid #757575; }
                h1, h2 { border-bottom: 1px solid #ddd; padding-bottom: 5px; }
              </style>
            </head>
            <body>
              <h1>Code Review</h1>
              <p><strong>Language:</strong> ${language}</p>
              <p><strong>Exported on:</strong> ${new Date().toLocaleString()}</p>
              <hr>
              ${includeCode ? `<h2>Original Project Files</h2>${projectFiles.map(f => `<h3>${f.path}</h3><pre><code>${f.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`).join('')}<hr>` : ''}
              <h2>Conversation</h2>
              ${conversation.map(msg => `
                <div class="message ${msg.role}">
                  <strong>${msg.role === 'user' ? 'You' : 'AI Assistant'}:</strong>
                  <div>${(Array.isArray(msg.content) ? 'Structured review content...' : msg.content).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
                </div>
              `).join('')}
            </body>
          </html>`;
        downloadFile(htmlContent, `${fileBaseName}.html`, 'text/html');
        break;
    }

    setIsExporting(false);
    onClose();
  };
  
  const FormatButton = ({ value, label, icon: Icon }) => (
    <button
        onClick={() => setFormat(value)}
        className={`flex-1 p-3 rounded-lg text-sm font-semibold transition-colors flex flex-col items-center justify-center gap-2 border-2 ${format === value ? 'bg-light-accent dark:bg-dark-accent text-white border-light-accent dark:border-dark-accent' : 'bg-light-fill-primary dark:bg-dark-fill-primary hover:bg-light-fill-secondary dark:hover:bg-dark-fill-secondary border-transparent'}`}
    >
        <Icon className="h-6 w-6" />
        {label}
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4">
        <div className="absolute inset-0 bg-black/30" onClick={onClose}></div>
        <div className="relative z-10 w-full max-w-lg bg-light-bg-elevated/80 dark:bg-dark-bg-elevated/80 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col border border-light-separator dark:border-dark-separator overflow-hidden animate-slide-up-fade">
          <header className="flex items-center justify-between p-4 border-b border-light-separator dark:border-dark-separator flex-shrink-0">
            <h2 className="text-lg font-semibold text-light-label-primary dark:text-dark-label-primary">Export Conversation</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-light-fill-primary dark:hover:bg-dark-fill-primary text-light-label-secondary dark:text-dark-label-secondary" aria-label="Close export options">
              <XIcon className="h-5 w-5" />
            </button>
          </header>

          <main className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-light-label-secondary dark:text-dark-label-secondary mb-2">Format</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    <FormatButton value="md" label="Markdown" icon={MarkdownIcon} />
                    <FormatButton value="txt" label="Text" icon={FileTextIcon} />
                    <FormatButton value="pdf" label="PDF" icon={PdfIcon} />
                    <FormatButton value="json" label="JSON" icon={JsonIcon} />
                    <FormatButton value="html" label="HTML" icon={HtmlIcon} />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-light-label-secondary dark:text-dark-label-secondary mb-2">Options</label>
                <div className="bg-light-fill-primary dark:bg-dark-fill-primary rounded-lg p-1">
                    <label htmlFor="include-code" className="flex items-center justify-between p-2 cursor-pointer">
                        <span className="font-medium text-sm text-light-label-primary dark:text-dark-label-primary">Include project files</span>
                        <div className={`relative w-10 h-6 rounded-full flex items-center transition-colors duration-200 ${includeCode ? 'bg-light-accent dark:bg-dark-accent' : 'bg-light-fill-secondary dark:bg-dark-fill-secondary'}`}>
                            <span className={`inline-block w-4 h-4 bg-white rounded-full transform transition-transform duration-200 mx-1 ${includeCode ? 'translate-x-4' : ''}`}></span>
                        </div>
                        <input id="include-code" type="checkbox" checked={includeCode} onChange={() => setIncludeCode(!includeCode)} className="sr-only"/>
                    </label>
                </div>
            </div>
          </main>

          <footer className="flex items-center justify-end flex-wrap gap-4 p-4 border-t border-light-separator dark:border-dark-separator flex-shrink-0">
            <button onClick={onClose} className="bg-light-fill-primary dark:bg-dark-fill-primary hover:bg-light-fill-secondary dark:hover:bg-dark-fill-secondary text-light-label-primary dark:text-dark-label-primary font-bold py-2 px-4 rounded-full transition-colors">
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-light-accent dark:bg-dark-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-wait text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center gap-2 min-w-[120px] justify-center"
            >
              {isExporting ? (
                <>
                  <Spinner className="h-5 w-5" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <DownloadIcon className="h-5 w-5" />
                  <span>Export</span>
                </>
              )}
            </button>
          </footer>
        </div>
      </div>
      
      {/* Hidden div for PDF generation */}
      <div className="absolute -z-10 -left-[9999px] -top-[9999px]">
        <div ref={pdfContentRef} className={`p-10 ${theme}`} style={{ width: '800px', fontFamily: 'Inter, sans-serif' }}>
            <div className={`${theme === 'dark' ? 'dark bg-dark-bg-elevated text-dark-label-primary' : 'bg-white text-light-label-primary'}`}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code: ({node, inline, className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                            <SyntaxHighlighter style={theme === 'dark' ? vscDarkPlus : vs} language={match[1]} PreTag="div" {...props}>
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                            ) : (
                            <code className="px-1 bg-black/10 dark:bg-white/10 rounded" {...props}>{children}</code>
                            );
                        },
                    }}
                >
                    {generateFileContent('md')}
                </ReactMarkdown>
            </div>
        </div>
      </div>
    </>
  );
};

export default ExportModal;