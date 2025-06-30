import { FileSystemService } from './FileSystemService';
import mockFs from 'mock-fs';

describe('FileSystemService', () => {
    let fileSystemService: FileSystemService;

    beforeEach(() => {
        fileSystemService = new FileSystemService();
        
        // Настраиваем мок файловой системы
        mockFs({
            '/test-workspace': {
                'src': {
                    'index.ts': 'export const main = () => {};',
                    'utils.js': 'export function helper() {}',
                    'types.d.ts': 'export interface User {}',
                    'components': {
                        'Button.tsx': 'export const Button = () => {};',
                        'Modal.vue': '<template></template>'
                    },
                    'ignored.log': 'log content'
                },
                'node_modules': {
                    'react': {
                        'package.json': '{"name": "react"}'
                    }
                },
                '.git': {
                    'config': 'git config'
                },
                'dist': {
                    'bundle.js': 'compiled code'
                },
                'README.md': '# Test Project',
                'package.json': '{"name": "test"}',
                '.env': 'SECRET=value'
            }
        });
    });

    afterEach(() => {
        mockFs.restore();
    });

    describe('readFileContent', () => {
        test('должен читать содержимое файла', async () => {
            const content = await fileSystemService.readFileContent('/test-workspace/src/index.ts');
            expect(content).toBe('export const main = () => {};');
        });

        test('должен бросать ошибку для несуществующего файла', async () => {
            await expect(fileSystemService.readFileContent('/test-workspace/nonexistent.ts'))
                .rejects.toThrow('Ошибка чтения файла');
        });
    });

    describe('buildFileTree', () => {
        test('должен строить дерево файлов с игнорированием системных папок', async () => {
            const tree = await fileSystemService.buildFileTree('/test-workspace');
            
            // Проверяем что системные папки игнорируются
            const dirNames = tree.map(item => item.name);
            expect(dirNames).not.toContain('node_modules');
            expect(dirNames).not.toContain('.git');
            expect(dirNames).not.toContain('dist');
            
            // Проверяем что нужные файлы включены
            expect(dirNames).toContain('src');
            expect(dirNames).toContain('README.md');
            expect(dirNames).toContain('package.json');
        });

        test('должен сортировать директории перед файлами', async () => {
            const tree = await fileSystemService.buildFileTree('/test-workspace');
            
            const srcIndex = tree.findIndex(item => item.name === 'src');
            const readmeIndex = tree.findIndex(item => item.name === 'README.md');
            
            expect(srcIndex).toBeLessThan(readmeIndex);
        });

        test('должен рекурсивно обрабатывать поддиректории', async () => {
            const tree = await fileSystemService.buildFileTree('/test-workspace');
            
            const srcDir = tree.find(item => item.name === 'src');
            expect(srcDir).toBeDefined();
            expect(srcDir!.type).toBe('directory');
            expect(srcDir!.children).toBeDefined();
            
            const childNames = srcDir!.children!.map(child => child.name);
            expect(childNames).toContain('components');
            expect(childNames).toContain('index.ts');
            expect(childNames).toContain('utils.js');
        });

        test('должен игнорировать нетекстовые файлы', async () => {
            const tree = await fileSystemService.buildFileTree('/test-workspace');
            
            const srcDir = tree.find(item => item.name === 'src');
            const childNames = srcDir!.children!.map(child => child.name);
            
            expect(childNames).not.toContain('ignored.log');
        });

        test('должен включать текстовые файлы различных типов', async () => {
            const tree = await fileSystemService.buildFileTree('/test-workspace');
            
            const srcDir = tree.find(item => item.name === 'src');
            const componentsDir = srcDir!.children!.find(child => child.name === 'components');
            const componentFiles = componentsDir!.children!.map(child => child.name);
            
            expect(componentFiles).toContain('Button.tsx');
            expect(componentFiles).toContain('Modal.vue');
        });
    });

    describe('fileExists', () => {
        test('должен возвращать true для существующего файла', async () => {
            const exists = await fileSystemService.fileExists('/test-workspace/README.md');
            expect(exists).toBe(true);
        });

        test('должен возвращать false для несуществующего файла', async () => {
            const exists = await fileSystemService.fileExists('/test-workspace/nonexistent.txt');
            expect(exists).toBe(false);
        });
    });

    describe('saveFile', () => {
        test('должен сохранять файл', async () => {
            await fileSystemService.saveFile('/test-workspace/new-file.txt', 'test content');
            
            const content = await fileSystemService.readFileContent('/test-workspace/new-file.txt');
            expect(content).toBe('test content');
        });

        test('должен перезаписывать существующий файл', async () => {
            await fileSystemService.saveFile('/test-workspace/README.md', 'new content');
            
            const content = await fileSystemService.readFileContent('/test-workspace/README.md');
            expect(content).toBe('new content');
        });
    });

    describe('ensureDirectory', () => {
        test('должен создавать новую директорию', async () => {
            await fileSystemService.ensureDirectory('/test-workspace/new-dir');
            
            const tree = await fileSystemService.buildFileTree('/test-workspace');
            const dirNames = tree.map(item => item.name);
            expect(dirNames).toContain('new-dir');
        });

        test('должен создавать вложенные директории', async () => {
            await fileSystemService.ensureDirectory('/test-workspace/deep/nested/dir');
            
            // Проверяем что можем сохранить файл в новой директории
            await fileSystemService.saveFile('/test-workspace/deep/nested/dir/test.txt', 'test');
            const content = await fileSystemService.readFileContent('/test-workspace/deep/nested/dir/test.txt');
            expect(content).toBe('test');
        });
    });

    describe('shouldIgnoreFile (через buildFileTree)', () => {
        test('должен игнорировать системные файлы и папки', async () => {
            const tree = await fileSystemService.buildFileTree('/test-workspace');
            const allNames = getAllNamesFromTree(tree);
            
            expect(allNames).not.toContain('node_modules');
            expect(allNames).not.toContain('.git');
            expect(allNames).not.toContain('dist');
            expect(allNames).not.toContain('.env');
        });
    });

    describe('isTextFile (через buildFileTree)', () => {
        test('должен включать различные текстовые расширения', async () => {
            // Добавляем файлы с разными расширениями
            mockFs({
                '/test-files': {
                    'script.js': 'js content',
                    'component.tsx': 'tsx content',
                    'style.css': 'css content',
                    'config.json': 'json content',
                    'readme.md': 'md content',
                    'image.png': 'binary content',
                    'video.mp4': 'binary content'
                }
            });
            
            const tree = await fileSystemService.buildFileTree('/test-files');
            const fileNames = tree.map(item => item.name);
            
            expect(fileNames).toContain('script.js');
            expect(fileNames).toContain('component.tsx');
            expect(fileNames).toContain('style.css');
            expect(fileNames).toContain('config.json');
            expect(fileNames).toContain('readme.md');
            expect(fileNames).not.toContain('image.png');
            expect(fileNames).not.toContain('video.mp4');
        });
    });
});

// Вспомогательная функция для получения всех имен из дерева
function getAllNamesFromTree(tree: any[]): string[] {
    const names: string[] = [];
    
    function collectNames(nodes: any[]) {
        for (const node of nodes) {
            names.push(node.name);
            if (node.children) {
                collectNames(node.children);
            }
        }
    }
    
    collectNames(tree);
    return names;
} 