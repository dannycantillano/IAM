
export type DynamicButtonConfig<T = any> = {
  titulo?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: (data?: T) => void;
  render?: (ctx: { row: T; index: number }) => React.ReactNode;
};

interface Props {
  buttons: DynamicButtonConfig[];
  containerClassName?: string;
}

export const ModalHeaderButtons = ({
  buttons,
  containerClassName = "ms-auto d-flex px-0 gap-2 py-2",
}: Props) => {
  return (
    <div className={containerClassName}>
      {buttons.map((btn, index) => (
        <button
          key={`dynamic-btn-${index}`}
          onClick={btn.onClick}
          className={`btn btn-sm ${
            btn.className ? btn.className : "btn-primary"
          }`}
          disabled={btn.disabled}
        >
          {btn.titulo}
          {btn.icon}
        </button>
      ))}
    </div>
  );
};
