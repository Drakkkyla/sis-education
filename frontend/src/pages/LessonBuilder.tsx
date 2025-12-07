import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { aiService } from '../services/ai';
import { coursesService, lessonsService } from '../services/courses';
import toast from 'react-hot-toast';
import {
  Save,
  Eye,
  ArrowLeft,
  Type,
  AlignLeft,
  List,
  Quote,
  Image as ImageIcon,
  Video,
  FileText,
  HelpCircle,
  MoreVertical,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';

// --- TYPES ---
type BlockType = 'heading' | 'text' | 'list' | 'quote' | 'gallery' | 'video' | 'file' | 'faq';

interface Block {
  id: string;
  type: BlockType;
  content: any;
  isEditing: boolean;
  isAiLoading?: boolean;
}

interface LessonBuilderProps {
  // Props if needed
}

const LessonBuilder = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  
  // State
  const [title, setTitle] = useState('Новый урок');
  const [currentTab, setCurrentTab] = useState<'theory' | 'practice'>('theory');
  const [sections, setSections] = useState<{ theory: Block[]; practice: Block[] }>({
    theory: [],
    practice: []
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Fetch course info
  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesService.getById(courseId!),
    enabled: !!courseId
  });

  // Fetch lesson if editing
  const { data: lessonData, isLoading: isLessonLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonsService.getById(lessonId!),
    enabled: !!lessonId
  });

  // Initialize data if editing
  useEffect(() => {
    if (lessonData) {
      setTitle(lessonData.title);
      // TODO: Parse content back to blocks if we store it as structured data
      // For now we might need to handle legacy content or assume new structure
      // This is a simplified assumption:
      if (lessonData.content) {
        // If content is HTML string, try to wrap it in a text block or parse it
        // For this implementation, let's start fresh or assume a specific format
        // Real implementation would need an HTML-to-Blocks parser
        setSections(prev => ({
            ...prev,
            theory: [{ id: '1', type: 'text', content: lessonData.content, isEditing: false }]
        }));
      }
      setIsPublished(lessonData.isPublished);
    }
  }, [lessonData]);

  // --- MUTATIONS ---
  const createLessonMutation = useMutation({
    mutationFn: (data: any) => lessonsService.create(data),
    onSuccess: () => {
      toast.success('Урок успешно создан');
      navigate(`/courses/${courseId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании урока');
    }
  });

  const updateLessonMutation = useMutation({
    mutationFn: (data: any) => lessonsService.update(lessonId!, data),
    onSuccess: () => {
      toast.success('Урок успешно обновлен');
      navigate(`/courses/${courseId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при обновлении урока');
    }
  });

  const aiImproveMutation = useMutation({
    mutationFn: (text: string) => aiService.improveText(text),
    // Success handled in component
  });

  // --- ACTIONS ---
  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      isEditing: true
    };
    
    setSections(prev => ({
      ...prev,
      [currentTab]: [...prev[currentTab], newBlock]
    }));
  };

  const getDefaultContent = (type: BlockType) => {
    if (type === 'list') return { type: 'bullet', items: [''] };
    if (type === 'gallery') return [];
    if (type === 'faq') return [{ question: '', answer: '' }];
    if (type === 'file') return { data: null, name: null };
    return '';
  };

  const updateBlockContent = (id: string, content: any) => {
    setSections(prev => ({
      ...prev,
      [currentTab]: prev[currentTab].map(b => b.id === id ? { ...b, content } : b)
    }));
  };

  const toggleEditBlock = (id: string, isEditing: boolean) => {
    setSections(prev => ({
      ...prev,
      [currentTab]: prev[currentTab].map(b => b.id === id ? { ...b, isEditing } : b)
    }));
  };

  const deleteBlock = (id: string) => {
    if (confirm('Удалить этот блок?')) {
      setSections(prev => ({
        ...prev,
        [currentTab]: prev[currentTab].filter(b => b.id !== id)
      }));
    }
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const blocks = [...sections[currentTab]];
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
    
    setSections(prev => ({
      ...prev,
      [currentTab]: blocks
    }));
  };

  const handleAiImprove = async (blockId: string) => {
    const block = sections[currentTab].find(b => b.id === blockId);
    if (!block || typeof block.content !== 'string' || !block.content) {
      toast.error('Напишите текст для улучшения');
      return;
    }

    // Set loading state
    setSections(prev => ({
      ...prev,
      [currentTab]: prev[currentTab].map(b => b.id === blockId ? { ...b, isAiLoading: true } : b)
    }));

    try {
      const result = await aiImproveMutation.mutateAsync(block.content);
      if (result.success && result.improvedText) {
        updateBlockContent(blockId, result.improvedText);
        toast.success('Текст улучшен!');
      }
    } catch (error) {
      // Error handled by mutation
    } finally {
      setSections(prev => ({
        ...prev,
        [currentTab]: prev[currentTab].map(b => b.id === blockId ? { ...b, isAiLoading: false } : b)
      }));
    }
  };

  const handleSave = () => {
    setShowPublishModal(true);
  };

  const confirmSave = (publish: boolean) => {
    // Convert blocks to HTML string for compatibility
    // In a real app, you might want to store the JSON structure instead
    const theoryHtml = sections.theory.map(renderBlockToHtml).join('\n');
    const practiceHtml = sections.practice.map(renderBlockToHtml).join('\n');
    
    const fullContent = `
      <div class="lesson-theory">${theoryHtml}</div>
      ${practiceHtml ? `<div class="lesson-practice"><h2>Практика</h2>${practiceHtml}</div>` : ''}
    `;

    const data = {
      title,
      content: fullContent,
      course: courseId,
      isPublished: publish,
      // Default values for other required fields
      description: 'Создано в конструкторе',
      order: lessonData?.order || 0, 
    };

    if (lessonId) {
      updateLessonMutation.mutate(data);
    } else {
      createLessonMutation.mutate(data);
    }
    setShowPublishModal(false);
  };

  const renderBlockToHtml = (block: Block): string => {
    switch (block.type) {
      case 'heading': return `<h2>${block.content}</h2>`;
      case 'text': return `<p>${block.content?.replace(/\n/g, '<br>')}</p>`;
      case 'quote': return `<blockquote>${block.content}</blockquote>`;
      case 'list': 
        return `<ul>${(block.content.items || []).map((i: string) => `<li>${i}</li>`).join('')}</ul>`;
      // Add other types
      default: return '';
    }
  };

  // --- RENDERERS ---
  const renderEditor = (block: Block) => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
          <span className="text-xs font-bold uppercase text-primary-600 dark:text-primary-400 tracking-wider">
            {block.type}
          </span>
          {(block.type === 'text' || block.type === 'quote' || block.type === 'heading') && (
            <button 
              onClick={() => handleAiImprove(block.id)}
              disabled={block.isAiLoading}
              className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md transition-colors"
            >
              {block.isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {block.isAiLoading ? 'Думаю...' : 'Улучшить AI'}
            </button>
          )}
        </div>

        {block.type === 'heading' && (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(block.id, e.target.value)}
            className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white placeholder-gray-300"
            placeholder="Заголовок..."
            autoFocus
          />
        )}

        {block.type === 'text' && (
          <textarea
            value={block.content}
            onChange={(e) => updateBlockContent(block.id, e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 p-0 text-base leading-relaxed text-gray-800 dark:text-gray-200 resize-y min-h-[100px] placeholder-gray-300"
            placeholder="Введите текст..."
            autoFocus
          />
        )}

        {block.type === 'quote' && (
          <div className="pl-4 border-l-4 border-primary-500">
            <textarea
              value={block.content}
              onChange={(e) => updateBlockContent(block.id, e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 p-0 text-lg italic text-gray-700 dark:text-gray-300 resize-y min-h-[80px] placeholder-gray-300"
              placeholder="Цитата..."
              autoFocus
            />
          </div>
        )}

        {block.type === 'list' && (
          <div className="space-y-2">
            {block.content.items.map((item: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...block.content.items];
                    newItems[idx] = e.target.value;
                    updateBlockContent(block.id, { ...block.content, items: newItems });
                  }}
                  className="flex-1 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-primary-500 px-0 py-1 text-sm"
                  placeholder="Пункт списка..."
                />
                <button 
                  onClick={() => {
                    const newItems = block.content.items.filter((_: any, i: number) => i !== idx);
                    updateBlockContent(block.id, { ...block.content, items: newItems });
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => updateBlockContent(block.id, { ...block.content, items: [...block.content.items, ''] })}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 mt-2"
            >
              <Plus className="w-4 h-4" /> Добавить пункт
            </button>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={(e) => { e.stopPropagation(); toggleEditBlock(block.id, false); }}
            className="btn btn-primary btn-sm"
          >
            Готово
          </button>
        </div>
      </div>
    );
  };

  const renderViewer = (block: Block) => {
    if (!block.content && block.type !== 'gallery') {
      return <div className="text-gray-300 italic">Пустой блок...</div>;
    }

    switch (block.type) {
      case 'heading':
        return <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{block.content}</h2>;
      case 'text':
        return <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{block.content}</p>;
      case 'quote':
        return (
          <blockquote className="pl-4 border-l-4 border-primary-500 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 py-2 pr-2 rounded-r">
            {block.content}
          </blockquote>
        );
      case 'list':
        return (
          <ul className="list-disc list-inside space-y-1 text-gray-800 dark:text-gray-200">
            {block.content.items.map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        );
      default:
        return <div className="text-gray-500">[{block.type}]</div>;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white w-[400px]"
            placeholder="Название урока"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setCurrentTab('theory')}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                currentTab === 'theory' 
                  ? "bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              Теория
            </button>
            <button
              onClick={() => setCurrentTab('practice')}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                currentTab === 'practice' 
                  ? "bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              Практика
            </button>
          </div>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="btn btn-secondary"
          >
            <Eye className="w-4 h-4 mr-2" />
            Предпросмотр
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            Сохранить
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col p-4 overflow-y-auto z-10">
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Контент</div>
            <div className="space-y-1">
              <ToolBtn icon={Type} label="Заголовок" onClick={() => addBlock('heading')} />
              <ToolBtn icon={AlignLeft} label="Текст" onClick={() => addBlock('text')} />
              <ToolBtn icon={List} label="Список" onClick={() => addBlock('list')} />
              <ToolBtn icon={Quote} label="Цитата" onClick={() => addBlock('quote')} />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Медиа</div>
            <div className="space-y-1">
              <ToolBtn icon={ImageIcon} label="Картинки" onClick={() => addBlock('gallery')} />
              <ToolBtn icon={Video} label="Видео" onClick={() => addBlock('video')} />
              <ToolBtn icon={FileText} label="Файл" onClick={() => addBlock('file')} />
              <ToolBtn icon={HelpCircle} label="FAQ" onClick={() => addBlock('faq')} />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-8 flex justify-center">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-sm min-h-[800px] p-12">
            {sections[currentTab].length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                <p>Пусто. Добавьте блоки из меню слева.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sections[currentTab].map((block) => (
                  <div 
                    key={block.id} 
                    className={cn(
                      "group relative rounded-lg border-2 transition-all",
                      block.isEditing 
                        ? "border-primary-500 bg-white dark:bg-gray-800 shadow-lg ring-4 ring-primary-500/10 z-10 p-4" 
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2"
                    )}
                    onClick={() => !block.isEditing && toggleEditBlock(block.id, true)}
                  >
                    {/* Controls (visible on hover or editing) */}
                    <div className={cn(
                      "absolute -right-12 top-0 flex flex-col gap-1 transition-opacity",
                      block.isEditing || "opacity-0 group-hover:opacity-100"
                    )}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                        className="p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:text-primary-600 shadow-sm"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                        className="p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:text-primary-600 shadow-sm"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                        className="p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:text-red-600 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    {block.isEditing ? renderEditor(block) : renderViewer(block)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl transform transition-all scale-100">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Публикация урока</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Как вы хотите сохранить этот урок? Опубликованные уроки сразу видны студентам.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => confirmSave(false)}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-gray-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">Черновик</div>
                    <div className="text-sm text-gray-500">Скрыт от студентов, можно продолжить редактирование</div>
                  </div>
                </div>
                {/* Radio like indicator */}
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-500"></div>
              </button>

              <button
                onClick={() => confirmSave(true)}
                className="flex items-center justify-between p-4 border-2 border-primary-100 dark:border-primary-900/30 bg-primary-50/50 dark:bg-primary-900/10 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">Опубликовать</div>
                    <div className="text-sm text-gray-500">Доступен всем студентам курса</div>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-primary-500 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                </div>
              </button>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 px-4 py-2"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Component
const ToolBtn = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
  >
    <Icon className="w-5 h-5 text-gray-400 group-hover:text-primary-500" />
    {label}
  </button>
);

function Plus({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}

export default LessonBuilder;

