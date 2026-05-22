import classNames from 'classnames';

type ErrorNotificationProps = {
  errorMessage: string;
  resetError: () => void;
};

export function ErrorNotification({
  errorMessage,
  resetError,
}: ErrorNotificationProps) {
  return (
    <div
      data-cy="ErrorNotification"
      className={classNames(
        'notification is-danger is-light has-text-weight-normal',
        {
          hidden: !errorMessage,
        },
      )}
    >
      <button
        data-cy="HideErrorButton"
        type="button"
        className="delete"
        onClick={resetError}
      />
      {errorMessage}
    </div>
  );
}
