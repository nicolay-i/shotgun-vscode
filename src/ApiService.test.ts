import { ApiService } from './ApiService';
import { PromptTemplate, SelectedFile } from './types';

describe('ApiService', () => {
    let apiService: ApiService;

    beforeEach(() => {
        apiService = new ApiService();
    });

    describe('formatPrompt', () => {
        const mockSelectedFiles: SelectedFile[] = [
            {
                path: 'src/test.ts',
                content: 'export const testFunction = () => { return "test"; };'
            },
            {
                path: 'src/utils.ts',
                content: 'export const utilFunction = () => { return "util"; };'
            }
        ];

        test('должен использовать дефолтный системный промпт без шаблона', () => {
            const userPrompt = 'Проанализируй этот код';
            
            // Используем рефлексию для доступа к приватному методу
            const result = (apiService as any).formatPrompt(undefined, userPrompt, mockSelectedFiles);
            
            expect(result.systemPrompt).toBe(
                'Ты — опытный разработчик программного обеспечения. Анализируй код, предлагай улучшения и отвечай на вопросы по коду.'
            );
            
            expect(result.userPrompt).toContain('Проанализируй этот код');
            expect(result.userPrompt).toContain('--- src/test.ts ---');
            expect(result.userPrompt).toContain('export const testFunction');
            expect(result.userPrompt).toContain('--- src/utils.ts ---');
            expect(result.userPrompt).toContain('export const utilFunction');
        });

        test('должен использовать шаблон если предоставлен', () => {
            const template: PromptTemplate = {
                id: '1',
                name: 'Test Template',
                description: 'Test description',
                systemPrompt: 'Ты тестовый ассистент',
                userPrompt: 'Задача: {{ЗАДАЧА}}\nФайлы: {{FILES}}',
                isBuiltIn: true
            };

            const userPrompt = 'Найди баги';
            
            const result = (apiService as any).formatPrompt(template, userPrompt, mockSelectedFiles);
            
            expect(result.systemPrompt).toBe('Ты тестовый ассистент');
            expect(result.userPrompt).toContain('Задача: Найди баги');
            expect(result.userPrompt).toContain('--- src/test.ts ---');
            expect(result.userPrompt).toContain('export const testFunction');
        });

        test('должен корректно заменять плейсхолдеры в шаблоне', () => {
            const template: PromptTemplate = {
                id: '2',
                name: 'Custom Template',
                description: 'Custom description',
                systemPrompt: 'Кастомный системный промпт',
                userPrompt: 'Выполни: {{ЗАДАЧА}}\n\nАнализируй файлы:\n{{FILES}}',
                isBuiltIn: false
            };

            const userPrompt = 'Рефактор кода';
            
            const result = (apiService as any).formatPrompt(template, userPrompt, mockSelectedFiles);
            
            expect(result.systemPrompt).toBe('Кастомный системный промпт');
            expect(result.userPrompt).toMatch(/Выполни: Рефактор кода/);
            expect(result.userPrompt).toMatch(/Анализируй файлы:/);
            expect(result.userPrompt).toContain('--- src/test.ts ---');
            expect(result.userPrompt).toContain('--- src/utils.ts ---');
        });

        test('должен обрабатывать пустой список файлов', () => {
            const userPrompt = 'Общий вопрос';
            
            const result = (apiService as any).formatPrompt(undefined, userPrompt, []);
            
            expect(result.userPrompt).toBe('Общий вопрос\n\nФайлы для анализа:');
        });

        test('должен обрабатывать файлы без содержимого', () => {
            const filesWithoutContent: SelectedFile[] = [
                { path: 'src/empty.ts' }
            ];
            
            const userPrompt = 'Проверь файл';
            
            const result = (apiService as any).formatPrompt(undefined, userPrompt, filesWithoutContent);
            
            expect(result.userPrompt).toContain('--- src/empty.ts ---');
            expect(result.userPrompt).toContain('undefined'); // Содержимое undefined
        });

        test('должен корректно форматировать множественные файлы', () => {
            const manyFiles: SelectedFile[] = [
                { path: 'file1.ts', content: 'content1' },
                { path: 'file2.ts', content: 'content2' },
                { path: 'file3.ts', content: 'content3' }
            ];
            
            const userPrompt = 'Проанализируй все файлы';
            
            const result = (apiService as any).formatPrompt(undefined, userPrompt, manyFiles);
            
            expect(result.userPrompt).toContain('--- file1.ts ---');
            expect(result.userPrompt).toContain('content1');
            expect(result.userPrompt).toContain('--- file2.ts ---');
            expect(result.userPrompt).toContain('content2');
            expect(result.userPrompt).toContain('--- file3.ts ---');
            expect(result.userPrompt).toContain('content3');
        });
    });
}); 