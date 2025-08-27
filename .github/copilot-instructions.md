# Инструкции для ИИ-агентов по этому репозиторию

Кодовая база — VS Code extension с React webview. Цель: собрать контекст файлов из рабочей папки, сформировать промпт по шаблону и отправить в выбранный AI-провайдер; результат можно сохранить в `plans/*.md`.

## Архитектура и поток данных
- Backend: `src/extension.ts` регистрирует команду `ai-assistant.openPanel`; `src/ShotgunPanel.ts` управляет Webview, обрабатывает сообщения, читает файлы, вызывает API и сохраняет ответы.
- Frontend: готовая сборка `webview-ui/build/webview.js` (React + MobX). Взаимодействие с backend через `webview.postMessage`.
- Сообщения Webview → Extension (см. `src/types.ts`, обрабатываются в `ShotgunPanel._handleMessage`):
  - `getFiles`, `getFileContent { filePath }`, `openFile { filePath }`
  - `submitToAI { prompt, selectedFiles, apiConfig, template? }`
  - `generatePayloadPreview { prompt, selectedFiles, apiConfig, template? }`
  - `saveResponse { content, templateName? }`
  - `storeSecret { key, value }`, `loadSecrets {}`
- AI запрос: `ApiService.sendRequest()` → форматирование промпта `formatPrompt()` (шаблоны `{{ЗАДАЧА}}`, `{{FILES}}`) → `ProviderFactory.getProvider(config.provider)` → `providers/*Provider.sendRequest()` → `AiResponse { content, usage? }`.

## Паттерны и соглашения
- Провайдеры AI — Strategy: `IAiProvider.sendRequest(systemPrompt, userPrompt, config)`. Реализации: `OpenAiProvider`, `GeminiProvider`, `OpenRouterProvider`, `CustomProvider`.
- Регистрация провайдера — через `ProviderFactory` (карта `ApiProvider → IAiProvider`). Чтобы добавить провайдера: 1) значение в `ApiProvider` (в `src/types.ts`), 2) класс в `src/providers/`, 3) регистрация в `ProviderFactory`.
- Шаблоны промптов — `src/templates.ts` (`BUILT_IN_TEMPLATES`). Плейсхолдеры: `{{ЗАДАЧА}}`, `{{FILES}}`. Для отладки используется `ApiService.generatePayloadPreview()` (возвращает итоговые `systemPrompt`, `userPrompt`, `payload`).
- Файловая система — `FileSystemService`: строит дерево, игнорируя служебные каталоги (`node_modules`, `.git`, `out`, `build`, `coverage`, и т.д.) и учитывая только текстовые расширения. Чтение контента делается параллельно перед вызовом AI.
- Секреты API — через VS Code SecretStorage (`VsCodeSecretStorageService`). Ключи вида `ai-assistant.apiKey.<provider>` загружаются в `_loadAndSendSecrets()` и отправляются в webview сообщением `secretsLoaded`.
- Сохранение ответа — `saveResponse` создаёт файл в `plans/` именем `<templateName|no-template>_<YYYY-MM-DD_HH-MM-SS>.md` и открывает его в редакторе.

## Интеграции провайдеров
- OpenAI / OpenRouter — POST `/chat/completions` с `messages` и сбором `usage` при наличии.
- Gemini — объединённый prompt (`system + user`) и извлечение `usageMetadata` при наличии.
- Custom API — требует `config.customUrl`; есть валидация URL (запрет `localhost` и приватных диапазонов) в `CustomProvider.validateUrl()`.

## Рабочие процессы
- Сборка/вотч: `pnpm run dev` (параллельно `dev:webview` и `tsc --watch`) или отдельно `pnpm run watch`, `pnpm run dev:webview`.
- Продакшн-сборка: `pnpm run compile` (tsc + `build:webview`). Пакет расширения: `pnpm run package`.
- Отладка: F5 → Extension Development Host → команда “Открыть AI Code Assistant”. Для webview — DevTools (Ctrl+Shift+I).
- В рабочем пространстве есть задачи “npm: dev” и “npm: watch”.

## Типичные доработки
- Новый провайдер: реализуйте `IAiProvider` в `src/providers/FooProvider.ts`; добавьте `Foo` в `ApiProvider`; зарегистрируйте в `ProviderFactory`.
- Новое сообщение webview: добавьте тип в `src/types.ts`, обработчик в `ShotgunPanel._handleMessage`, верните ответ через `webview.postMessage`.
- Новый шаблон: расширьте `BUILT_IN_TEMPLATES` c `systemPrompt`/`userPrompt` и плейсхолдерами.

## Подводные камни
- CSP webview: скрипты только из `webview-ui/build/webview.js`, используется `nonce`.
- Для Custom API нужен публичный HTTPS; локальные и приватные адреса запрещены.
- В `ApiConfig` обязательны `apiKey` и валидная `model`; `customUrl` — опциональна (кроме Custom).
