import { FileNode, SpecDoc } from '../models';

export const MOCK_TREE: FileNode[] = [
  {
    name: 'src', path: 'src', type: 'dir', children: [
      { name: 'main.ts', path: 'src/main.ts', type: 'file' },
      { name: 'todo.service.ts', path: 'src/todo.service.ts', type: 'file' },
    ],
  },
  { name: 'package.json', path: 'package.json', type: 'file' },
  { name: 'README.md', path: 'README.md', type: 'file' },
];

export const MOCK_FILES: Record<string, string> = {
  'src/main.ts': `import { TodoService } from './todo.service';

const todos = new TodoService();
todos.add('Write the first spec');
console.log(todos.list());
`,
  'src/todo.service.ts': `export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

export class TodoService {
  private items: Todo[] = [];

  add(title: string): Todo {
    const todo = { id: this.items.length + 1, title, done: false };
    this.items.push(todo);
    return todo;
  }

  list(): Todo[] {
    return this.items;
  }
}
`,
  'package.json': `{
  "name": "demo-project",
  "version": "1.0.0"
}
`,
  'README.md': `# Demo project

Ask the agent on the right to change something.
`,
};

export const MOCK_SPECS: SpecDoc[] = [
  {
    kind: 'requirements',
    approved: false,
    content: `# Requirements

## Todo list
**User story:** As a user, I want to add and complete todos so that I can track my work.

### Acceptance criteria
- WHEN the user adds a title THEN the system SHALL store a new todo.
- WHEN the user completes a todo THEN the system SHALL mark it as done.
`,
  },
  {
    kind: 'design',
    approved: false,
    content: `# Design

A single \`TodoService\` keeps todos in memory and exposes add, complete and list.
`,
  },
  {
    kind: 'tasks',
    approved: false,
    content: `# Tasks

- [x] Create the Todo model and TodoService
- [ ] Add a complete(id) method to TodoService
- [ ] Print completed todos in main.ts
`,
  },
];
