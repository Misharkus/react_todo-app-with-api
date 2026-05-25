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
import { TodoList } from './compontents/TodoList';
import { Errors } from './types/Errors';
import { Footer } from './compontents/Footer';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filterBy, setFilterBy] = useState<Filters>(Filters.all);
  const [errorMessage, setErrorMessage] = useState<Errors>(Errors.Default);
  const [newTitle, setNewTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const newTodoTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage(Errors.UnableLoad))
      .finally();
  }, []);

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
  const isDisabled = completedTodos < 1;
  const isShowHeaderAndFooter = todos.length > 0;
  const activeTodosLength = activeTodos.length;

  const handleEditTodo = (id: number, body: Partial<Todo>) => {
    setProcessingIds(current => [...current, id]);

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
        setErrorMessage(Errors.UnableUpdate);
        throw error;
      })
      .finally(() => {
        setProcessingIds(current => current.filter(item => item !== id));
      });
  };

  const handleDeleteTodo = (id: number) => {
    setProcessingIds(current => [...current, id]);
    deleteTodo(id)
      .then(() => {
        setTodos(current => current.filter(todo => todo.id !== id));
      })
      .catch(() => {
        setErrorMessage(Errors.UnableDelete);
      })
      .finally(() => {
        setProcessingIds(current => current.filter(item => item !== id));
        newTodoTitleRef.current?.focus();
      });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = newTitle.trim();

    if (!normalizedTitle) {
      setErrorMessage(Errors.EmptyTitle);

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
      .catch(() => setErrorMessage(Errors.UnableAdd))
      .finally(() => {
        setTempTodo(null);
        if (newTodoTitleRef.current) {
          newTodoTitleRef.current.disabled = false;
        }

        newTodoTitleRef.current?.focus();
      });
  };
  // React memo and UseCallback де хендлер йде пропсом

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
          {isShowHeaderAndFooter && (
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
              ref={newTodoTitleRef}
            />
          </form>
        </header>

        <TodoList
          todos={filteredTodos}
          waitingTodos={processingIds}
          tempTodo={tempTodo}
          onDelete={handleDeleteTodo}
          onUpdate={handleEditTodo}
        />

        {/* Hide the footer if there are no todos */}
        {isShowHeaderAndFooter && (
          <Footer
            filterBy={filterBy}
            activeTodosLength={activeTodosLength}
            onFilterChange={setFilterBy}
            isDisabled={isDisabled}
            onMassiveDelete={handleMassiveDelete}
          />
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      <ErrorNotification
        errorMessage={errorMessage}
        resetError={() => setErrorMessage(Errors.Default)}
      />
    </div>
  );
};
