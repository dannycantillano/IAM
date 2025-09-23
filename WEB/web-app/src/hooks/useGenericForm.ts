
import { FieldConfig, FieldType } from "@/types/types";
import { useState, useEffect, useMemo, useCallback } from "react";

type FormState<T> = {
    errors: Record<keyof T, string>;
    touched: Record<keyof T, boolean>;
    localDisplay: Record<keyof T, string>;
};

export function useGenericForm<T>(
    data: T,
    setData: React.Dispatch<React.SetStateAction<T>>,
    fields: FieldConfig<T>[],
    show: boolean,
    onSubmit: () => void
) {
    const [errors, setErrors] = useState<FormState<T>["errors"]>({} as Record<keyof T, string>);
    const [touched, setTouched] = useState<FormState<T>["touched"]>({} as Record<keyof T, boolean>);
    const [localDisplay, setLocalDisplay] = useState<FormState<T>["localDisplay"]>({} as Record<keyof T, string>);
    const [wasSubmitted, setWasSubmitted] = useState<boolean>(false);
    const emojiRegex = useMemo(() => /[\p{Extended_Pictographic}]/u, []);

    // Inicialización
    useEffect(() => {
        if (!show) return;
        const initErr = {} as Record<keyof T, string>;
        const initTouch = {} as Record<keyof T, boolean>;
        const initDisp = {} as Record<keyof T, string>;

        fields.forEach(({ key, type }) => {
            const typedKey = key as keyof T;
            initErr[typedKey] = "";
            initTouch[typedKey] = false;
            const raw = data[typedKey];
            if (type === "number") initDisp[typedKey] = raw != null ? String(raw) : "";
            else if (type === "date") initDisp[typedKey] = typeof raw === "string" ? raw.slice(0, 10) : "";
        });

        setErrors(initErr);
        setTouched(initTouch);
        setLocalDisplay(initDisp);
        setWasSubmitted(false);
    }, [show, fields, data]);

    const validate = useCallback(
        (key: keyof T, value: unknown) => {
            const conf = fields.find(f => f.key === key);
            if (!conf) return "";

            let msg = "";

            // Validación personalizada si existe
            if (conf.validate) {
                msg = conf.validate(value);
            } else if (conf.required) {
                const isEmpty =
                    value === undefined ||
                    value === null ||
                    value === "" ||
                    (typeof value === "string" && value.startsWith("error_force_"));

                // 🔥 Aplica mensaje personalizado si el campo está vacío
                if (isEmpty) {
                    if (typeof conf.errorMessage === "function") {
                        msg = conf.errorMessage(value);
                    } else if (typeof conf.errorMessage === "string") {
                        msg = conf.errorMessage;
                    } else {
                        msg = "Este campo es obligatorio";
                    }
                } else {
                    const strVal = String(value ?? "").trim();
                    const type = conf.type ?? "text";

                    switch (type) {
                        case "text":
                        case "textarea":
                            if (!strVal) {
                                msg =
                                    typeof conf.errorMessage === "string"
                                        ? conf.errorMessage
                                        : "Este campo es obligatorio";
                            } else if (emojiRegex.test(strVal)) {
                                msg = "No se permiten emoticones";
                            }
                            break;

                        case "number": {
                            const num = parseFloat(strVal);
                            if (isNaN(num)) {
                                msg = "Ingrese un número válido";
                            } else if (num <= 0) {
                                msg = "El valor debe ser mayor que cero";
                            }
                            break;
                        }

                        case "date":
                            if (!value || isNaN(new Date(String(value)).getTime())) {
                                msg =
                                    typeof conf.errorMessage === "string"
                                        ? conf.errorMessage
                                        : "Debe ingresar una fecha válida";
                            }
                            break;
                    }
                }
            }

            setErrors(prev => ({ ...prev, [key]: msg }));
            return msg;
        },
        [fields, emojiRegex]
    );



    const handleChange = useCallback(
        (key: keyof T, raw: string, type: FieldType) => {
            let newVal: unknown = raw;
            if (type === "number") newVal = parseFloat(raw.replace(/,/g, "")) || "";
            else if (type === "date") newVal = raw;

            setData(prev => ({ ...prev, [key]: newVal } as T));
            if (type === "number" || type === "date") {
                setLocalDisplay(prev => ({ ...prev, [key]: raw }));
            }
        },
        [setData]
    );

    const handleBlur = useCallback(
        (key: keyof T) => {
            setTouched(prev => ({ ...prev, [key]: true }));
            validate(key, data[key]);
        },
        [validate, data]
    );

    const handleSubmitForm = useCallback(() => {
        let hasError = false;
        const newErr = {} as Record<keyof T, string>;
        const newTouch = {} as Record<keyof T, boolean>;

        fields.forEach(f => {
            const key = f.key as keyof T;
            newTouch[key] = true;
            const msg = validate(key, data[key]);
            newErr[key] = msg;
            if (msg) hasError = true;
        });

        setErrors(newErr);
        setTouched(newTouch);
        if (!hasError) onSubmit();
    }, [fields, validate, data, onSubmit]);

    const hasErrors = Object.values(errors).some(e => !!e);

    return {
        errors,
        touched,
        wasSubmitted,
        localDisplay,
        handleChange,
        handleBlur,
        handleSubmit: handleSubmitForm,
        hasErrors,
    };
}
