

import { useEffect, useState } from 'react';

const THRESHOLD = 120; // píxeles de scroll para “mostrar”

export const Toolbar = ({
  titulo,
  onAdd,
  addButton
}: {
  titulo: string,
  onAdd?: () => void,
  addButton?: boolean
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisible(y > THRESHOLD);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // evalúa estado inicial por si ya hay scroll
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={`toolbar reveal-on-scroll ${visible ? 'is-visible' : ''}`} id="kt_toolbar">
      <div id="kt_toolbar_container" className="container-fluid d-flex flex-stack">
        {/* Visible en móvil */}


        <p className="card-title text-gray-600 fs-3 py-2 m-0"> {titulo}</p>


        {addButton && (
          <div className="d-flex align-items-center py-1">
            <a
              href="#"
              className="btn btn-sm btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#kt_modal_create_app"
              id="kt_toolbar_primary_button"
              onClick={onAdd}
            >
              Agregar
            </a>
          </div>
        )}


      </div>
    </div>
  );
}

