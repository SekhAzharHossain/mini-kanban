import { useState, useEffect, useRef } from 'react'
import './App.css'

interface Task {
  id: number;
  content: string;
  description: string;
}

interface Column {
  name: string;
  items: Task[];
}

interface Columns {
  [key: string]: Column;
}

function App() {
  const [columns, setColumns] = useState<Columns>(() => {
    const saved = localStorage.getItem('task-columns');
    if (saved) {
      try {
        return JSON.parse(saved) as Columns;
      } catch (err) {
        console.error("Error parsing task-columns from localStorage", err);
      }
    }

    return {
      todos: { name: "Todo", items: [] },
      inProgress: { name: "In Progress", items: [] },
      completed: { name: "Completed", items: [] }
    };
  });

  useEffect(() => {
    localStorage.setItem('task-columns', JSON.stringify(columns));
  }, [columns]);

  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskDesc, setNewTaskDesc] = useState<string>("");
  const activeColumn = ("todos");
  const [draggedItem, setDraggedItem] = useState<{ columnId: string; item: Task } | null>(null);
  let theme: "light" | "dark" = "light";

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const currentTheme=document.documentElement.getAttribute("data-theme")
    const newTheme= currentTheme=== 'dark'?'light':'dark';
    document.documentElement.setAttribute("data-theme",newTheme)
    localStorage.setItem("theme",newTheme)
  };

  useEffect(()=>{
    const saveTheme=localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme",saveTheme)
  },[])

  const addNewTask = () => {
    if (newTaskTitle.trim() === "" || !columns[activeColumn]) return;

    const updatedColumns = { ...columns };
    updatedColumns[activeColumn].items.push({
      id: Date.now(),
      content: newTaskTitle,
      description: newTaskDesc,
    });

    setColumns(updatedColumns);
    setNewTaskTitle("");
    setNewTaskDesc("");
    titleRef.current?.focus();
  };

  const removeTask = (columnId: string, taskId: number) => {
    const updatedColumns = { ...columns };
    updatedColumns[columnId].items = updatedColumns[columnId].items.filter((item) => item.id !== taskId);
    setColumns(updatedColumns);
  };

  const moveTask = (columnId: string, task: Task, direction: "left" | "right") => {
    const keys = Object.keys(columns);
    const currentIndex = keys.indexOf(columnId);
    const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= keys.length) return;

    const newColumnId = keys[newIndex];
    const updatedColumns = { ...columns };

    updatedColumns[columnId].items = updatedColumns[columnId].items.filter((i) => i.id !== task.id);
    updatedColumns[newColumnId].items.push(task);

    setColumns(updatedColumns);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, columnId: string, item: Task) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      removeTask(columnId, item.id);
    }
    if (e.key === 'ArrowRight') {
      moveTask(columnId, item, "right");
    }
    if (e.key === 'ArrowLeft') {
      moveTask(columnId, item, "left");
    }
  };

  const handleDragStart = (columnId: string, item: Task) => {
    setDraggedItem({ columnId, item });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();

    if (!draggedItem) return;

    const { columnId: sourceColumnId, item } = draggedItem;
    if (sourceColumnId === columnId) return;

    const updatedColumns = { ...columns };

    updatedColumns[sourceColumnId].items = updatedColumns[sourceColumnId].items.filter((i) => i.id !== item.id);
    updatedColumns[columnId].items.push(item);

    setColumns(updatedColumns);
    setDraggedItem(null);
  };

  return (
    <div className="app">
      <div className="header">
        <h1 className='topheading'>Mini Kanban Board</h1>
        <button className='themeButton' onClick={toggleTheme}>
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
      </div>
      
      <div className="add-task">
        <input
          ref={titleRef}
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Task title"
          
        />
        <textarea
          value={newTaskDesc}
          onChange={(e) => setNewTaskDesc(e.target.value)}
          placeholder="Task description"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter") addNewTask();
          }}
        />
        <button onClick={addNewTask}>Add</button>
      </div>

      <div className="columns">
        {Object.entries(columns).map(([key, column]) => (
          <div
            key={key}
            className="column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, key)}
          >
            <h2 className='column-heading'>{column.name}</h2>
            {column.items.map((item) => (
              <div
                key={item.id}
                className="task"
                draggable
                tabIndex={0}
                onDragStart={() => handleDragStart(key, item)}
                onKeyDown={(e) => handleKeyDown(e, key, item)}
                aria-label={`Task: ${item.content}`}
                role="button"
              >
                <p className="task-title">{item.content}</p>
                {item.description && <p className="task-desc">{item.description}</p>}
                <button className='delete-button' onClick={() => removeTask(key, item.id)}>❎</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;