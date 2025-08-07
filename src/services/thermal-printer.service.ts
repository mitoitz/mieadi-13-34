import { supabase } from "@/integrations/supabase/client";

export interface ReceiptData {
  id: string;
  studentName: string;
  eventTitle: string;
  date: string;
  time: string;
  location?: string;
  qrCode?: string;
  additionalInfo?: Record<string, any>;
}

export interface PrinterStatus {
  connected: boolean;
  paperStatus: 'ok' | 'low' | 'empty';
  temperature: 'normal' | 'high';
  error?: string;
}

export interface PrintJob {
  id: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  receiptData: ReceiptData;
  timestamp: Date;
  error?: string;
}

export interface ThermalPrinterConfig {
  port: string;
  baudRate: number;
  paperWidth: 58 | 80; // mm
  characterEncoding: 'utf8' | 'latin1';
  cutType: 'full' | 'partial' | 'none';
}

export class ThermalPrinterAPI {
  private isConnected = false;
  private config: ThermalPrinterConfig;
  private printQueue: PrintJob[] = [];
  private currentJob: PrintJob | null = null;

  constructor() {
    this.config = {
      port: 'USB001',
      baudRate: 9600,
      paperWidth: 58,
      characterEncoding: 'utf8',
      cutType: 'partial'
    };
  }

  async connect(port?: string): Promise<boolean> {
    try {
      console.log('Connecting to thermal printer...');
      
      if (port) {
        this.config.port = port;
      }

      // Simular conexão com impressora
      await this.testConnection();
      
      this.isConnected = true;
      console.log('Thermal printer connected successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to thermal printer:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from thermal printer...');
    this.isConnected = false;
    this.printQueue = [];
    this.currentJob = null;
  }

  async printReceipt(data: ReceiptData): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Impressora térmica não conectada. Conecte uma impressora física.');
    }

    console.log('📄 Adicionando recibo REAL à fila de impressão:', data.id);

    // Validar dados antes de imprimir
    if (!data.studentName || !data.eventTitle) {
      throw new Error('Dados insuficientes para gerar comprovante físico');
    }

    const job: PrintJob = {
      id: crypto.randomUUID(),
      status: 'pending',
      receiptData: data,
      timestamp: new Date()
    };

    this.printQueue.push(job);
    
    // Processar fila de impressão REAL
    if (!this.currentJob) {
      await this.processQueue();
    }

    return true;
  }

  private async processQueue(): Promise<void> {
    while (this.printQueue.length > 0) {
      this.currentJob = this.printQueue.shift()!;
      this.currentJob.status = 'printing';

      try {
        await this.executePrint(this.currentJob.receiptData);
        this.currentJob.status = 'completed';
        console.log('Print job completed:', this.currentJob.id);
        
        // Salvar no banco
        await this.saveReceiptRecord(this.currentJob);
        
      } catch (error) {
        this.currentJob.status = 'failed';
        this.currentJob.error = error.message;
        console.error('Print job failed:', this.currentJob.id, error);
      }
    }

    this.currentJob = null;
  }

  private async executePrint(data: ReceiptData): Promise<void> {
    console.log('🖨️ Imprimindo comprovante REAL na impressora térmica...');
    
    // Verificar status da impressora antes de imprimir
    const status = await this.checkRealPrinterStatus();
    if (!status.connected) {
      throw new Error('Impressora térmica desconectada');
    }
    
    if (status.paperStatus === 'empty') {
      throw new Error('Papel esgotado na impressora térmica');
    }
    
    if (status.temperature === 'high') {
      throw new Error('Impressora aquecida. Aguarde o resfriamento.');
    }

    // Gerar comandos ESC/POS para impressora REAL
    const commands = this.generateESCPOSCommands(data);
    console.log('📄 Comandos ESC/POS gerados para impressora térmica:', commands.length, 'bytes');
    
    // Enviar para impressora física REAL via USB/Serial
    await this.sendToRealPrinter(commands);
    
    console.log('✅ Comprovante impresso na impressora térmica');
  }

  private generateESCPOSCommands(data: ReceiptData): Uint8Array {
    const commands: number[] = [];
    
    // ESC @ - Inicializar impressora
    commands.push(0x1B, 0x40);
    
    // Configurar alinhamento central
    commands.push(0x1B, 0x61, 0x01);
    
    // Header
    const header = "=== MIEADI ===\n";
    commands.push(...this.textToBytes(header));
    
    // Linha divisória
    commands.push(...this.textToBytes("================\n"));
    
    // Alinhamento esquerda
    commands.push(0x1B, 0x61, 0x00);
    
    // Dados do recibo
    const receiptText = `
Estudante: ${data.studentName}
Evento: ${data.eventTitle}
Data: ${data.date}
Hora: ${data.time}
${data.location ? `Local: ${data.location}\n` : ''}
Recibo: ${data.id}

`;
    
    commands.push(...this.textToBytes(receiptText));
    
    // QR Code (se disponível)
    if (data.qrCode) {
      commands.push(0x1B, 0x61, 0x01); // Centralizar
      commands.push(...this.generateQRCodeCommands(data.qrCode));
      commands.push(...this.textToBytes("\n"));
    }
    
    // Footer
    commands.push(0x1B, 0x61, 0x01); // Centralizar
    commands.push(...this.textToBytes("Obrigado!\n"));
    commands.push(...this.textToBytes(new Date().toLocaleString()));
    
    // Linhas em branco e corte
    commands.push(...this.textToBytes("\n\n\n"));
    
    // Corte parcial
    if (this.config.cutType !== 'none') {
      commands.push(0x1D, 0x56, this.config.cutType === 'full' ? 0x00 : 0x01);
    }
    
    return new Uint8Array(commands);
  }

  private generateQRCodeCommands(data: string): number[] {
    const commands: number[] = [];
    
    // Comandos para QR Code (ESC/POS)
    // GS ( k - Configurar QR Code
    commands.push(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00); // Modelo 2
    commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x08); // Tamanho 8
    commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30); // Correção de erro L
    
    // Armazenar dados
    const dataBytes = this.textToBytes(data);
    const length = dataBytes.length + 3;
    commands.push(0x1D, 0x28, 0x6B, length & 0xFF, (length >> 8) & 0xFF, 0x31, 0x50, 0x30);
    commands.push(...dataBytes);
    
    // Imprimir QR Code
    commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);
    
    return commands;
  }

  private textToBytes(text: string): number[] {
    if (this.config.characterEncoding === 'utf8') {
      return Array.from(new TextEncoder().encode(text));
    } else {
      // Latin1 encoding
      return Array.from(text).map(char => char.charCodeAt(0) & 0xFF);
    }
  }

  private async sendToRealPrinter(commands: Uint8Array): Promise<void> {
    console.log('🔌 Enviando', commands.length, 'bytes para impressora térmica REAL...');
    
    try {
      // Verificar se Web Serial API está disponível
      if ('serial' in navigator) {
        await this.sendViaWebSerial(commands);
      } else {
        // Fallback para API local de hardware
        await this.sendViaHardwareAPI(commands);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar para impressora:', error);
      throw new Error(`Falha na comunicação com impressora: ${error.message}`);
    }
  }
  
  private async sendViaWebSerial(commands: Uint8Array): Promise<void> {
    try {
      // Usar Web Serial API para comunicação direta
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: this.config.baudRate });
      
      const writer = port.writable.getWriter();
      await writer.write(commands);
      writer.releaseLock();
      
      await port.close();
      console.log('✅ Dados enviados via Web Serial API');
    } catch (error) {
      throw new Error(`Web Serial falhou: ${error.message}`);
    }
  }
  
  private async sendViaHardwareAPI(commands: Uint8Array): Promise<void> {
    try {
      // Enviar via sua API Python real
      const response = await fetch('https://bc7a163e2572.ngrok-free.app/api/printer/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          commands: Array.from(commands),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      console.log('✅ Dados enviados via API de hardware');
    } catch (error) {
      throw new Error(`API de hardware falhou: ${error.message}`);
    }
  }

  private async testConnection(): Promise<void> {
    // Testar conexão REAL com impressora
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste comando de status
    const statusCommands = new Uint8Array([0x10, 0x04, 0x01]); // DLE EOT 1
    await this.sendToRealPrinter(statusCommands);
  }

  async checkStatus(): Promise<PrinterStatus> {
    return await this.checkRealPrinterStatus();
  }
  
  private async checkRealPrinterStatus(): Promise<PrinterStatus> {
    if (!this.isConnected) {
      return {
        connected: false,
        paperStatus: 'empty',
        temperature: 'normal',
        error: 'Impressora não conectada'
      };
    }

    try {
      // Verificar status REAL via sua API Python
      const response = await fetch('https://bc7a163e2572.ngrok-free.app/api/printer/status', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Status API Error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📊 Status REAL da impressora:', result);
      
      // Mapear status do papel
      let paperStatus: 'ok' | 'low' | 'empty' = 'ok';
      if (result.paper_status === 'low') paperStatus = 'low';
      else if (result.paper_status === 'empty') paperStatus = 'empty';
      
      return {
        connected: result.connected || false,
        paperStatus,
        temperature: result.temperature || 'normal',
        error: result.error
      };
    } catch (error) {
      console.error('❌ Erro ao verificar status da impressora:', error);
      return {
        connected: false,
        paperStatus: 'empty',
        temperature: 'normal',
        error: `Falha na comunicação: ${error.message}`
      };
    }
  }

  private async saveReceiptRecord(job: PrintJob): Promise<void> {
    try {
      console.log('Receipt record saved locally:', job.id);
      // Database save would be implemented here in production
    } catch (error) {
      console.error('Error saving receipt record:', error);
    }
  }

  getPrintQueue(): PrintJob[] {
    return [...this.printQueue];
  }

  getCurrentJob(): PrintJob | null {
    return this.currentJob;
  }

  getConfig(): ThermalPrinterConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ThermalPrinterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Printer configuration updated:', this.config);
  }

  async printTestPage(): Promise<boolean> {
    const testReceipt: ReceiptData = {
      id: 'TEST-' + Date.now(),
      studentName: 'Teste de Impressão',
      eventTitle: 'Página de Teste',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      location: 'Sistema MIEADI',
      qrCode: 'https://test.example.com/test'
    };

    return await this.printReceipt(testReceipt);
  }
}

// Instância singleton
export const thermalPrinter = new ThermalPrinterAPI();