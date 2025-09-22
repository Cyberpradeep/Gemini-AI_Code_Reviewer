import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import { Prism as SyntaxHighlighter } from 'https://esm.sh/react-syntax-highlighter@15.5.0';
import { vscDarkPlus, vs } from 'https://esm.sh/react-syntax-highlighter@15.5.0/dist/esm/styles/prism';

import type { Theme, ChatMessage } from '../App';
import { stripMarkdown } from '../utils/markdownStripper';
import { XIcon } from './icons/XIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CheckIcon } from './icons/CheckIcon';
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
  code: string;
  language: string;
  theme: Theme;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  conversation,
  code,
  language,
  theme,
}) => {
  const [format, setFormat] = useState<ExportFormat>('md');
  const [includeCode, setIncludeCode] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const generateFileContent = (targetFormat: ExportFormat): string => {
    let header = `Code Review\nLanguage: ${language}\nExported on: ${new Date().toLocaleString()}\n\n`;
    let fileContent = '';
    const separator = targetFormat === 'md' ? '\n\n---\n\n' : '\n\n================================\n\n';

    if (includeCode) {
      const codeBlockFence = '```';
      fileContent += `## Original Code Snippet\n\n${codeBlockFence}${language}\n${code}\n${codeBlockFence}\n`;
    }

    const chatContent = conversation.map(msg => {
      const author = msg.role === 'user' ? 'You' : 'AI Reviewer';
      const content = (targetFormat === 'txt') ? stripMarkdown(msg.content) : msg.content;
      
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
            code: includeCode ? code : undefined,
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
              ${includeCode ? `<h2>Original Code Snippet</h2><pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre><hr>` : ''}
              <h2>Conversation</h2>
              ${conversation.map(msg => `
                <div class="message ${msg.role}">
                  <strong>${msg.role === 'user' ? 'You' : 'AI Reviewer'}:</strong>
                  <div>${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
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
        className={`flex-1 p-3 rounded-lg text-sm font-semibold transition-colors flex flex-col items-center justify-center gap-2 border-2 ${format === value ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-ios-light-header dark:bg-ios-dark-header hover:bg-ios-light-tertiary dark:hover:bg-ios-dark-tertiary border-transparent'}`}
    >
        <Icon className="h-6 w-6" />
        {label}
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4" style={{ animationDuration: '0.2s' }}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative z-10 w-full max-w-lg bg-ios-light-panel dark:bg-ios-dark-panel rounded-2xl shadow-2xl flex flex-col border border-ios-light-tertiary dark:border-ios-dark-tertiary/50 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-ios-light-header dark:border-ios-dark-header flex-shrink-0">
            <h2 className="text-lg font-semibold text-ios-light-text-primary dark:text-white">Export Conversation</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-ios-light-header dark:hover:bg-ios-dark-header text-ios-light-text-secondary dark:text-ios-dark-secondary" aria-label="Close export options">
              <XIcon className="h-5 w-5" />
            </button>
          </header>

          <main className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-ios-light-text-secondary dark:text-ios-dark-secondary mb-2">Format</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    <FormatButton value="md" label="Markdown" icon={MarkdownIcon} />
                    <FormatButton value="txt" label="Text" icon={FileTextIcon} />
                    <FormatButton value="pdf" label="PDF" icon={PdfIcon} />
                    <FormatButton value="json" label="JSON" icon={JsonIcon} />
                    <FormatButton value="html" label="HTML" icon={HtmlIcon} />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-ios-light-text-secondary dark:text-ios-dark-secondary mb-2">Options</label>
                <div className="bg-ios-light-header dark:bg-ios-dark-header rounded-lg p-2">
                    <label htmlFor="include-code" className="flex items-center justify-between p-2 cursor-pointer">
                        <span className="font-medium text-sm text-ios-light-text-primary dark:text-white">Include original code snippet</span>
                        <div className={`w-10 h-6 rounded-full flex items-center transition-colors duration-200 ${includeCode ? 'bg-cyan-600' : 'bg-ios-light-tertiary dark:bg-ios-dark-tertiary'}`}>
                            <span className={`inline-block w-4 h-4 bg-white rounded-full transform transition-transform duration-200 mx-1 ${includeCode ? 'translate-x-4' : ''}`}></span>
                        </div>
                        <input id="include-code" type="checkbox" checked={includeCode} onChange={() => setIncludeCode(!includeCode)} className="sr-only"/>
                    </label>
                </div>
            </div>
          </main>

          <footer className="flex items-center justify-end flex-wrap gap-4 p-4 border-t border-ios-light-header dark:border-ios-dark-header flex-shrink-0">
            <button onClick={onClose} className="bg-ios-light-header dark:bg-ios-dark-header hover:bg-ios-light-tertiary dark:hover:bg-ios-dark-tertiary text-ios-light-text-primary dark:text-white font-bold py-2 px-4 rounded-full transition-colors">
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-wait text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center gap-2 min-w-[120px] justify-center"
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
            <div className={`${theme === 'dark' ? 'dark bg-ios-dark-panel text-white' : 'bg-white text-black'}`}>
                <h1 className="text-3xl font-bold mb-2">Code Review</h1>
                <p className="text-sm text-gray-500 mb-6">Exported on: {new Date().toLocaleString()}</p>
                 {includeCode && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-2 pb-2 border-b">Original Code Snippet ({language})</h2>
                        <SyntaxHighlighter language={language} style={theme === 'dark' ? vscDarkPlus : vs} customStyle={{ margin: 0, padding: '1rem', borderRadius: '0.5rem' }} codeTagProps={{ style: { fontFamily: 'Fira Code, monospace' } }}>
                          {code}
                        </SyntaxHighlighter>
                    </div>
                )}
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Conversation</h2>
                <div className="space-y-6">
                    {conversation.map((msg, index) => (
                      <div key={index}>
                        <h3 className="font-bold text-lg mb-2">{msg.role === 'user' ? 'You' : 'AI Reviewer'}</h3>
                        <div className={`p-4 rounded-lg ${msg.role === 'user' ? (theme === 'dark' ? 'bg-cyan-800' : 'bg-cyan-50') : (theme === 'dark' ? 'bg-ios-dark-header' : 'bg-ios-light-header')}`}>
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
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default ExportModal;