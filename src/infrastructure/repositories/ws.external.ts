import { Client, LocalAuth } from "whatsapp-web.js";
import { image as imageQr } from "qr-image";
import LeadExternal from "../../domain/lead-external.repository";
import fs from "fs";  // Importa explícitamente el módulo fs

class WsTransporter extends Client implements LeadExternal {
  private status = false;

  constructor() {
    super({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,  // Mantener en modo headless
        args: [
          "--no-sandbox",  // Estas opciones son importantes en entornos en la nube como Railway
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",  // Mejora el uso de memoria compartida en contenedores
          "--disable-gpu",  // Desactiva la GPU ya que no es necesaria
          "--disable-software-rasterizer",  // Desactiva el rasterizador de software
        ],
      },
    });

    console.log("Iniciando....");

    this.initialize();

    this.on("ready", () => {
      this.status = true;
      console.log("LOGIN_SUCCESS");
    });

    this.on("auth_failure", () => {
      this.status = false;
      console.log("LOGIN_FAIL");
    });

    // Evento para generar el código QR
    this.on("qr", (qr) => {
      console.log("Escanea el código QR que está en la carpeta tmp");
      this.generateImage(qr);  // Generar imagen del QR y guardarla
    });
  }

  // Enviar mensajes a través de WhatsApp
  async sendMsg(lead: { message: string; phone: string; imageUrl?: string }): Promise<any> {
    try {
      if (!this.status) return Promise.resolve({ error: "WAIT_LOGIN" });
      const { message, phone, imageUrl } = lead;
      let response;
      if (imageUrl) {
        response = await this.sendMessage(`${phone}@c.us`, imageUrl, { caption: message });
      } else {
        response = await this.sendMessage(`${phone}@c.us`, message);
      }
      return { id: response.id.id };
    } catch (e: any) {
      return Promise.resolve({ error: e.message });
    }
  }

  getStatus(): boolean {
    return this.status;
  }

  // Generar imagen del QR y guardarlo en la carpeta tmp
  private generateImage = (base64: string) => {
    const path = `${process.cwd()}/tmp`;  // Asegúrate de que tmp exista en Railway
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);  // Crear la carpeta tmp si no existe
    }
    let qr_svg = imageQr(base64, { type: "svg", margin: 4 });
    qr_svg.pipe(fs.createWriteStream(`${path}/qr.svg`));
    console.log(`⚡ Recuerda que el QR se actualiza cada minuto ⚡`);
    console.log(`⚡ Actualiza F5 el navegador para mantener el mejor QR⚡`);
  };
}

export default WsTransporter;
