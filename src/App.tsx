/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  createTodo,
  deleteTodo,
  getTodos,
  patchTodo,
  USER_ID,
} from './api/todos';
import { Filters, Todo } from './types/Todo';
import classNames from 'classnames';
import { ErrorNotification } from './compontents/ErrorNotification';
import { Filter } from './compontents/Filter';
import { TodoList } from './compontents/TodoList';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filterBy, setFilterBy] = useState<Filters>(Filters.all);
  const [errorMessage, setErrorMessage] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [waitingTodos, setWaitingTodos] = useState<number[]>([]);
  // const [formDisabled, setFormDisabled] = useState(false);
  const newTodoTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'))
      .finally();
  }, []);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timerId = setTimeout(() => {
      setErrorMessage('');
    }, 3000);

    return () => clearTimeout(timerId);
  }, [errorMessage]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  function getFilteredTodos(allTodos: Todo[]) {
    let filteredTodos = [...allTodos];

    filteredTodos = filteredTodos.filter(todo => {
      switch (filterBy) {
        case Filters.active:
          return !todo.completed;
        case Filters.completed:
          return todo.completed;
        default:
          return true;
      }
    });

    return filteredTodos;
  }

  function getActiveTodos(allTodos: Todo[]) {
    return allTodos.filter(todo => !todo.completed);
  }

  const filteredTodos = getFilteredTodos(todos);
  const activeTodos = getActiveTodos(todos);
  const isAllCompleted = activeTodos.length === 0;
  const completedTodos = todos.length - activeTodos.length;

  const handleEditTodo = (id: number, body: Partial<Todo>) => {
    setWaitingTodos(current => [...current, id]);

    return patchTodo(id, body)
      .then(newTodo => {
        setTodos(currentTodos =>
          currentTodos.map(todo => {
            if (todo.id === newTodo.id) {
              return newTodo;
            }

            return todo;
          }),
        );
      })
      .catch(error => {
        setErrorMessage('Unable to update a todo');
        throw error;
      })
      .finally(() => {
        setWaitingTodos(current => current.filter(item => item !== id));
      });
  };

  const handleDeleteTodo = (id: number) => {
    setWaitingTodos(current => [...current, id]);
    deleteTodo(id)
      .then(() => {
        setTodos(current => current.filter(todo => todo.id !== id));
      })
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
      })
      .finally(() => {
        setWaitingTodos(current => current.filter(item => item !== id));
        newTodoTitleRef.current?.focus();
      });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = newTitle.trim();

    if (!normalizedTitle) {
      setErrorMessage('Title should not be empty');

      return;
    }

    setTempTodo({
      id: 0,
      title: normalizedTitle,
      completed: false,
      userId: 0,
    });

    if (newTodoTitleRef.current) {
      newTodoTitleRef.current.disabled = true;
    }

    createTodo(normalizedTitle)
      .then(todo => {
        setTodos(current => [...current, todo]);
        setNewTitle('');
      })
      .catch(() => setErrorMessage('Unable to add a todo'))
      .finally(() => {
        setTempTodo(null);
        if (newTodoTitleRef.current) {
          newTodoTitleRef.current.disabled = false;
        }

        newTodoTitleRef.current?.focus();
      });
  };

  const handleMassiveDelete = () => {
    for (const todo of todos) {
      if (todo.completed) {
        handleDeleteTodo(todo.id);
      }
    }
  };

  const handleMassiveEditStatus = () => {
    for (const todo of todos) {
      if (todo.completed === isAllCompleted) {
        handleEditTodo(todo.id, { completed: !isAllCompleted });
      }
    }
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          {todos.length > 0 && (
            <button
              type="button"
              onClick={handleMassiveEditStatus}
              className={classNames('todoapp__toggle-all', {
                active: isAllCompleted,
              })}
              data-cy="ToggleAllButton"
            />
          )}

          {/* Add a todo on form submit */}
          <form onSubmit={handleSubmit}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={event => setNewTitle(event.target.value)}
              autoFocus
              // disabled={formDisabled}
              ref={newTodoTitleRef}
            />
          </form>
        </header>

        <TodoList
          todos={filteredTodos}
          waitingTodos={waitingTodos}
          tempTodo={tempTodo}
          onDelete={handleDeleteTodo}
          onUpdate={handleEditTodo}
        />

        {/* Hide the footer if there are no todos */}
        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {activeTodos.length} items left
            </span>

            {/* Active link should have the 'selected' class */}
            <Filter filterBy={filterBy} onFilterChange={setFilterBy} />

            {/* this button should be disabled if there are no completed todos */}
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              onClick={handleMassiveDelete}
              disabled={completedTodos < 1}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      <ErrorNotification
        errorMessage={errorMessage}
        resetError={() => setErrorMessage('')}
      />
    </div>
  );
};
