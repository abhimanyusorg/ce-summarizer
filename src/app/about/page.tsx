import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import Link from 'next/link';

export default async function AboutPage() {
  // Read the README file
  const readmePath = path.join(process.cwd(), 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf-8');

  // Convert markdown to HTML
  const htmlContent = await marked(readmeContent);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header - Full Width */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">About Project</h1>
              <p className="text-sm text-gray-500">CE Email Thread Summarization System</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-8 lg:p-12">
            <div
              className="markdown-content text-slate-800 leading-relaxed"
              style={{
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                padding: '2rem 5rem 0 5rem',
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
          .markdown-content {
            max-width: none;
          }

          .markdown-content h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #0f172a;
            margin-top: 3rem;
            margin-bottom: 1.5rem;
            border-bottom: 3px solid #e2e8f0;
            padding-bottom: 1rem;
            letter-spacing: -0.025em;
          }

          .markdown-content h1:first-child {
            margin-top: 0;
            border-bottom: none;
            padding-bottom: 0.5rem;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .markdown-content h2 {
            font-size: 1.875rem;
            font-weight: 700;
            color: #1e293b;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .markdown-content h2:before {
            content: '';
            width: 4px;
            height: 1.875rem;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 2px;
          }

          .markdown-content h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #334155;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .markdown-content h3:before {
            content: '▸';
            color: #6366f1;
            font-weight: bold;
          }

          .markdown-content h4 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #475569;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
          }

          .markdown-content p {
            margin-bottom: 1.25rem;
            line-height: 1.7;
            color: #475569;
          }

          .markdown-content p img {
            display: inline-block;
            margin: 0.25rem 0.25rem;
            vertical-align: middle;
          }

          .markdown-content ul, .markdown-content ol {
            margin-left: 1.5rem;
            margin-bottom: 1.5rem;
            padding-left: 0.5rem;
          }

          .markdown-content li {
            margin-bottom: 0.5rem;
            line-height: 1.6;
            color: #475569;
          }

          .markdown-content code {
            background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
            color: #334155;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Cascadia Code', monospace;
            font-size: 0.875rem;
            font-weight: 500;
            border: 1px solid #e2e8f0;
          }

          .markdown-content pre {
            background: linear-gradient(135deg, #0f172a, #1e293b);
            color: #e2e8f0;
            padding: 1.5rem;
            border-radius: 0.75rem;
            overflow-x: auto;
            margin: 1.5rem 0;
            border: 1px solid #334155;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          .markdown-content pre code {
            background: transparent;
            color: inherit;
            padding: 0;
            border: none;
            font-size: 0.875rem;
            line-height: 1.5;
          }

          .markdown-content blockquote {
            border-left: 4px solid #3b82f6;
            background: linear-gradient(135deg, #eff6ff, #f0f9ff);
            padding: 1.5rem 2rem;
            margin: 1.5rem 0;
            border-radius: 0 0.5rem 0.5rem 0;
            font-style: italic;
            color: #1e40af;
            position: relative;
          }

          .markdown-content blockquote:before {
            content: '"';
            font-size: 4rem;
            color: #dbeafe;
            position: absolute;
            top: -0.5rem;
            left: 0.5rem;
            font-family: serif;
          }

          .markdown-content a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s ease;
            position: relative;
          }

          .markdown-content a:hover {
            color: #1d4ed8;
            text-decoration: underline;
          }

          .markdown-content a:after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 0;
            height: 2px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            transition: width 0.3s ease;
          }

          .markdown-content a:hover:after {
            width: 100%;
          }

          .markdown-content strong {
            font-weight: 700;
            color: #0f172a;
          }

          .markdown-content em {
            font-style: italic;
            color: #475569;
          }

          .markdown-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            background: white;
            border-radius: 0.5rem;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .markdown-content th,
          .markdown-content td {
            padding: 0.75rem 1rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }

          .markdown-content th {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            font-weight: 600;
            color: #334155;
          }

          .markdown-content tr:last-child td {
            border-bottom: none;
          }

          .markdown-content img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          .markdown-content hr {
            border: none;
            height: 2px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
            margin: 2rem 0;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .markdown-content h1 {
              font-size: 2rem;
            }
            .markdown-content h2 {
              font-size: 1.5rem;
            }
            .markdown-content h3 {
              font-size: 1.25rem;
            }
            .markdown-content pre {
              padding: 1rem;
              font-size: 0.8rem;
            }
            .markdown-content blockquote {
              padding: 1rem 1.5rem;
            }
          }
        `
      }} />
    </div>
  );
}