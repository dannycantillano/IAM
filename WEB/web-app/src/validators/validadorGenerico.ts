//Este validador la idea es que se use en cada validador especifico, por ejempplo Valida_DTO_OrsenServicio
export class validadorGenerico {
    static isEmpty(value: any): boolean {
        return value === null || value === undefined || String(value).trim() === '';
    }

    static hasMinLength(value: string, min: number): boolean {
        return value.length >= min;
    }

    static hasMaxLength(value: string, max: number): boolean {
        return value.length <= max;
    }

    static isEmail(value: string): boolean {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value);
    }
    static isCero(value: number): boolean {
        return value == 0
    }

    static isNumeric(value: any): boolean {
        return !isNaN(value);
    }

    static isDate(value: any): boolean {
        return !isNaN(new Date(String(value)).getTime());
    }

    static isValidDate(value: any): boolean {
        if (typeof value === 'string' || value instanceof Date) {
            const date = new Date(value);
            if (isNaN(date.getTime())) return false;
            // Verifica que no sea 1/1/1
            if (
                date.getFullYear() === 1 &&
                date.getMonth() === 0 &&
                date.getDate() === 1
            ) {
                return false;
            }
            return true;
        }
        return false;
    }

    static isPhoneNumber(value: string): boolean {
        const regex = /^\+?\d{1,4}?[-.\s]?(\d{1,3}?[-.\s]?){1,4}\d{1,4}$/;
        return regex.test(value);
    }

    //true si ambas cadenas son iguales.
    static matches(value: string, compare: string): boolean {
        return value === compare;
    }

    static hasNoSpecialChars(value: string): boolean {
        return /^[a-zA-Z0-9\s]*$/.test(value);
    }

    static isEmojiFree(value: string): boolean {
        const emojiRegex = /[\p{Extended_Pictographic}]/u;
        return !emojiRegex.test(value);
    }

    static hasEmojis(value: string): boolean {
        const emojiRegex = /[\p{Extended_Pictographic}]/u;
        return emojiRegex.test(value);
    }

    static onlyTextAllowed(value: string): boolean {
        return !/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/u.test(value);
    }

    static startsWith(value: string, text: string): boolean {
        return value.startsWith(text);
    }

    static isNonNegative(value: number | null | undefined): boolean {
        return value !== null && value !== undefined && value >= 0;
    }
    /**
 * Solo permite dígitos y un único separador decimal (.,).
 * Ej: "10", "10.5", "0.25" => válidos. "1-1-1", "10..5", "1e3" => inválidos.
 */
    static isNumericStrict(value: any, opts?: { allowDecimal?: boolean; maxDecimals?: number }) {
        const allowDecimal = opts?.allowDecimal ?? true;
        const maxDecimals = opts?.maxDecimals ?? undefined;

        if (typeof value === "number") return Number.isFinite(value);
        if (typeof value !== "string") return false;

        const s = value.trim().replace(",", "."); // normalizamos
        const base = allowDecimal
            ? "^[0-9]+(?:\\.[0-9]+)?$"
            : "^[0-9]+$";

        const re = new RegExp(base);
        if (!re.test(s)) return false;

        if (allowDecimal && maxDecimals != null && s.includes(".")) {
            const [, dec] = s.split(".");
            if ((dec ?? "").length > maxDecimals) return false;
        }
        return true;
    }

    /**
     * Detecta patrones raros tipo "1-1-1", "10/5", múltiples símbolos, etc.
     * Útil para dar un mensaje claro de "formato inválido".
     */
    static hasWeirdNumericPattern(value: any) {
        if (typeof value !== "string") return false;
        const s = value.trim();

        // grupos numéricos separados por "-" o "/" => 1-1-1, 10/5
        if (/^\d+(?:[-/]\d+)+$/.test(s)) return true;

        // más de un punto decimal o símbolos no permitidos
        if (/[^0-9.,\s]/.test(s)) return true;            // letras u otros símbolos
        if ((s.match(/[.,]/g) || []).length > 1) return true; // dos decimales

        return false;
    }

}
