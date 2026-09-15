import base64
import io
import qrcode


def qr_png_base64(value):
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    qr.add_data(str(value))
    qr.make(fit=True)
    buffered = io.BytesIO()
    qr.make_image(fill_color="black", back_color="white").save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()
