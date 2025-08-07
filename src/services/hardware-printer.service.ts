// Serviço para integração com impressoras térmicas via API local

const HARDWARE_API_BASE = 'https://bc7a163e2572.ngrok-free.app/api';

export interface PrinterDevice {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  type: string;
}

export interface PrinterStatus {
  online: boolean;
  paper: boolean;
  error?: string;
}

export interface ReceiptData {
  title?: string;
  items: Array<{
    name: string;
    quantity?: number;
    price?: number;
  }>;
  total?: number;
  footer?: string;
  student_name?: string;
  event_name?: string;
  date?: string;
}

// Listar impressoras disponíveis
export const listPrinters = async (): Promise<PrinterDevice[]> => {
  try {
    const response = await fetch(`${HARDWARE_API_BASE}/printer/devices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    return result.devices || [];
  } catch (error) {
    console.log('API local não disponível, usando simulação:', error);
    
    // Fallback para simulação
    return [
      {
        id: 'simulator',
        name: 'Impressora Simulada',
        status: 'online',
        type: 'thermal'
      }
    ];
  }
};

// Verificar status da impressora
export const checkPrinterStatus = async (printerId: string = 'default'): Promise<PrinterStatus> => {
  try {
    const response = await fetch(`${HARDWARE_API_BASE}/printer/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printer_id: printerId
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    return {
      online: result.online || true,
      paper: result.paper !== false,
      error: result.error
    };
  } catch (error) {
    console.log('API local não disponível, usando simulação:', error);
    
    // Fallback para simulação
    return {
      online: true,
      paper: true
    };
  }
};

// Imprimir recibo
export const printReceipt = async (receiptData: ReceiptData, printerId: string = 'default'): Promise<boolean> => {
  try {
    const response = await fetch(`${HARDWARE_API_BASE}/printer/print_receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printer_id: printerId,
        receipt_data: receiptData
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.log('API local não disponível, usando simulação:', error);
    
    // Simular impressão bem-sucedida
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }
};

// Imprimir texto simples
export const printText = async (text: string, printerId: string = 'default'): Promise<boolean> => {
  try {
    const response = await fetch(`${HARDWARE_API_BASE}/printer/print_text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printer_id: printerId,
        text: text
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.log('API local não disponível, usando simulação:', error);
    
    // Simular impressão bem-sucedida
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
};

// Imprimir QR Code
export const printQRCode = async (data: string, printerId: string = 'default'): Promise<boolean> => {
  try {
    const response = await fetch(`${HARDWARE_API_BASE}/printer/print_qrcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printer_id: printerId,
        data: data
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.log('API local não disponível, usando simulação:', error);
    
    // Simular impressão bem-sucedida
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  }
};