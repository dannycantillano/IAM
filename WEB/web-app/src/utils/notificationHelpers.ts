// notificationHelpers.ts

// (Opcional) Si quieres evitar errores de TS por el toastr global de tu plantilla,
// puedes declarar el símbolo global una vez y seguir usando tus @ts-expect-error.
// declare const toastr: any;

export class notificationHelpers {

    // 🔹 Init estático: se ejecuta una sola vez al cargar el módulo/clase.
    static {
        try {
     
            toastr.options = {
                "closeButton": true,
                "debug": false,
                "newestOnTop": true,
                "progressBar": true,
                "positionClass": "toast-top-right",
                "preventDuplicates": true,
                "showDuration": 300,
                "hideDuration": 0,
                "timeOut": 3000,
                //"onclick": null,
                "showEasing": "swing",
                "hideEasing": "linear",
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut"
                
            };
        } catch { /* no-op si aún no está disponible */ }
    }

    constructor() {
        // ✔ Dejamos tu constructor intacto (por compatibilidad si en algún sitio haces `new notificationHelpers()`)
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "newestOnTop": true,
            "progressBar": true,
            "positionClass": "toast-top-right",
            "preventDuplicates": true,
            "showDuration": 300,
            "hideDuration": 0,
            "timeOut": 3000,
            //"onclick": null,
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
    }

    static errorAlert(mensaje: string) {

        toastr.error(mensaje, "Error");
    }
    static infoAlert(mensaje: string) {

        toastr.info(mensaje, "Información");
    }
    static warningAlert(mensaje: string) {

        toastr.warning(mensaje, "Advertencia");
    }
    static successAlert(mensaje: string) {

        toastr.success(mensaje, "Correcto");
    }
}
