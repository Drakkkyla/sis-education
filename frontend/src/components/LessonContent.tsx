import { useEffect } from 'react';
import PhotoCarousel from './PhotoCarousel';

interface LessonContentProps {
  content: string;
  photos?: string[];
  photoDisplayType?: 'single' | 'carousel';
}

const LessonContent = ({ content, photos, photoDisplayType }: LessonContentProps) => {
  useEffect(() => {
    // Enhance content with better formatting
    const enhanceContent = () => {
      const container = document.getElementById('lesson-content');
      if (!container) return;

      // Enhance command blocks - detect configuration commands
      const preElements = container.querySelectorAll('pre');
      preElements.forEach((pre) => {
        if (!pre.classList.contains('enhanced')) {
          pre.classList.add('enhanced');
          const code = pre.querySelector('code');
          const text = (code?.textContent || pre.textContent || '').trim();
          
          // Check if it looks like configuration commands (Cisco, network config, etc.)
          const isConfigCommand = 
            text.includes('configure') || 
            text.includes('interface') || 
            text.includes('ip nat') ||
            text.includes('show ') ||
            text.includes('router') ||
            text.includes('access-list') ||
            text.match(/^\w+\s+\w+\/\d+/); // Pattern like "GigabitEthernet0/0"
          
          if (isConfigCommand && !pre.classList.contains('command-block')) {
            pre.classList.add('command-block');
            
            // Check if there's already a config section wrapper
            if (!pre.closest('.config-section')) {
              // Add a header for configuration blocks if not present
              const existingHeader = pre.previousElementSibling;
              if (!existingHeader || !existingHeader.classList.contains('config-title')) {
                const header = document.createElement('div');
                header.className = 'config-header mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2';
                header.innerHTML = '<span>⚙️</span> <span>Команды конфигурации</span>';
                pre.parentNode?.insertBefore(header, pre);
              }
            }
            
            // Enhance individual lines in the code block with inline styles
            // Using inline styles to avoid Tailwind class conflicts
            if (code) {
              const lines = code.innerHTML.split('\n');
              code.innerHTML = lines.map((line: string) => {
                const trimmed = line.trim();
                if (!trimmed) return line;
                
                // Highlight different types of commands with inline styles
                if (trimmed.startsWith('configure') || trimmed.startsWith('interface') || trimmed.startsWith('ip nat')) {
                  return `<span style="color: #4ade80; font-weight: 600;">${line}</span>`;
                } else if (trimmed.startsWith('show') || trimmed.startsWith('exit')) {
                  return `<span style="color: #60a5fa;">${line}</span>`;
                } else if (trimmed.startsWith('access-list')) {
                  return `<span style="color: #fbbf24;">${line}</span>`;
                }
                return line;
              }).join('\n');
            }
          }
        }
      });

      // Enhance code blocks without pre tags that are long
      const codeElements = container.querySelectorAll('code:not(pre code)');
      codeElements.forEach((code) => {
        const text = code.textContent || '';
        if (text.length > 30 && !code.closest('pre')) {
          // Wrap long inline code in a styled block
          const parent = code.parentElement;
          if (parent && parent.tagName !== 'PRE') {
            const wrapper = document.createElement('pre');
            wrapper.className = 'command-block my-3';
            const codeBlock = document.createElement('code');
            codeBlock.textContent = text;
            wrapper.appendChild(codeBlock);
            parent.replaceChild(wrapper, code);
          }
        }
      });

      // Lists are already styled with CSS ::before pseudo-elements
      // Just mark them as enhanced to avoid re-processing
      const ulElements = container.querySelectorAll('ul:not(.enhanced-list)');
      ulElements.forEach((ul) => {
        ul.classList.add('enhanced-list');
      });

      // Enhance paragraphs with important keywords
      const paragraphs = container.querySelectorAll('p:not(.important-paragraph)');
      paragraphs.forEach((p) => {
        const text = p.textContent || '';
        const importantKeywords = /важно|внимание|запомни|обрати внимание|ключевой момент/i;
        if (importantKeywords.test(text)) {
          p.className = 'important-paragraph bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg my-4 font-medium';
        }
      });

      // Enhance headings with icons based on content
      const headings = container.querySelectorAll('h2, h3');
      headings.forEach((heading) => {
        const text = heading.textContent?.toLowerCase() || '';
        if (!heading.querySelector('.heading-icon')) {
          const icon = document.createElement('span');
          icon.className = 'heading-icon mr-2';
          
          if (text.includes('настройка') || text.includes('конфигурация')) {
            icon.textContent = '⚙️';
          } else if (text.includes('проверка') || text.includes('тест')) {
            icon.textContent = '✅';
          } else if (text.includes('пример') || text.includes('примеры')) {
            icon.textContent = '💡';
          } else if (text.includes('описание') || text.includes('описание')) {
            icon.textContent = '📝';
          } else {
            icon.textContent = '📚';
          }
          
          heading.insertBefore(icon, heading.firstChild);
        }
      });
    };

    // Wait for content to be rendered, then enhance
    const timer = setTimeout(enhanceContent, 100);
    return () => clearTimeout(timer);
  }, [content]);

  // Process content to enhance plain text command blocks and replace photo tags
  const processContent = (html: string): string => {
    let processed = html;
    
    // Replace photo tags: <photo index="0" /> or [photo:0]
    if (photos && photos.length > 0) {
      // Replace HTML-style tags: <photo index="0" />
      processed = processed.replace(/<photo\s+index=["'](\d+)["']\s*\/?>/gi, (match, indexStr) => {
        const index = parseInt(indexStr);
        if (index >= 0 && index < photos.length) {
          return `<!-- PHOTO_PLACEHOLDER_${index} -->`;
        }
        return match;
      });
      
      // Replace markdown-style tags: [photo:0]
      processed = processed.replace(/\[photo:(\d+)\]/gi, (match, indexStr) => {
        const index = parseInt(indexStr);
        if (index >= 0 && index < photos.length) {
          return `<!-- PHOTO_PLACEHOLDER_${index} -->`;
        }
        return match;
      });
    }
    
    // Detect and wrap configuration blocks (like NAT config from the image)
    // Pattern: Lines that look like commands, especially when grouped
    const configPattern = /(Настройка NAT:|Проверка NAT:)\s*\n([\s\S]*?)(?=\n\n|\n[A-ZА-Я]|$)/gi;
    
    processed = processed.replace(configPattern, (match, title, commands) => {
      // Wrap commands in a styled block
      const commandLines = commands
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => {
          // Style individual command lines
          const trimmedLine = line.trim();
          if (trimmedLine.match(/^(configure|interface|ip nat|access-list|show|exit)/i)) {
            return `<div class="command-line text-green-400 font-mono text-sm py-1 px-2">${trimmedLine}</div>`;
          }
          return `<div class="command-line text-gray-300 font-mono text-sm py-1 px-2">${trimmedLine}</div>`;
        })
        .join('');
      
      return `
        <div class="config-section my-6">
          <div class="config-title text-xl font-bold mb-3 text-gray-900 dark:text-white">${title}</div>
          <pre class="command-block"><code>${commands.trim()}</code></pre>
        </div>
      `;
    });

    // Wrap plain text command sequences in pre blocks
    const plainCommandPattern = /((?:configure terminal|interface \w+|ip nat \w+|access-list \d+|show \w+)(?:\s+[\w\.\-\/]+)*)/gi;
    processed = processed.replace(plainCommandPattern, (match) => {
      // Only replace if not already in a code/pre tag
      if (!match.includes('<code>') && !match.includes('<pre>')) {
        return `<code class="command-highlight">${match}</code>`;
      }
      return match;
    });

    return processed;
  };

  const processedHtml = processContent(content);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Replace photo placeholders with actual photo components
  const renderContentWithPhotos = () => {
    if (!photos || photos.length === 0) {
      return <div dangerouslySetInnerHTML={{ __html: processedHtml }} />;
    }

    // Split content by photo placeholders
    const parts = processedHtml.split(/(<!-- PHOTO_PLACEHOLDER_(\d+) -->)/);
    const elements: React.ReactNode[] = [];

    parts.forEach((part, index) => {
      if (part.match(/<!-- PHOTO_PLACEHOLDER_(\d+) -->/)) {
        const match = part.match(/<!-- PHOTO_PLACEHOLDER_(\d+) -->/);
        if (match) {
          const photoIndex = parseInt(match[1]);
          if (photoIndex >= 0 && photoIndex < photos.length) {
            // Render photo
            if (photoDisplayType === 'carousel' && photos.length > 1) {
              // For carousel, show all photos starting from this index
              const remainingPhotos = photos.slice(photoIndex);
              elements.push(
                <div key={`photo-${photoIndex}`} className="my-6">
                  <PhotoCarousel photos={remainingPhotos} />
                </div>
              );
            } else {
              // Single photo
              elements.push(
                <div key={`photo-${photoIndex}`} className="my-6 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  <img
                    src={`${API_URL}${photos[photoIndex]}`}
                    alt={`Фото урока ${photoIndex + 1}`}
                    className="w-full h-auto object-contain bg-gray-100 dark:bg-gray-800"
                  />
                </div>
              );
            }
          }
        }
      } else if (part.trim()) {
        // Regular HTML content
        elements.push(
          <div
            key={`content-${index}`}
            dangerouslySetInnerHTML={{ __html: part }}
          />
        );
      }
    });

    return <>{elements}</>;
  };

  return (
    <div 
      id="lesson-content"
      className="lesson-content prose prose-lg dark:prose-invert max-w-none"
    >
      {renderContentWithPhotos()}
    </div>
  );
};

export default LessonContent;

