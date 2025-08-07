import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface BadgeGeneratorProps {
  person: {
    full_name: string;
    cpf: string;
    congregation?: string;
    ministerial_position?: string;
    photo_url?: string;
    gender?: string;
    phone?: string;
    birth_date?: string;
  };
}

export function BadgeGenerator({ person }: BadgeGeneratorProps) {
  const isWoman = person.gender === 'feminino';
  const bgColorFront = isWoman ? '#FF69B4' : '#4169E1'; // Rosa para mulher, azul para homem
  const bgColorBack = isWoman ? '#FFB6C1' : '#87CEEB'; // Tons mais claros para o verso
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Crachá - ${person.full_name}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Arial', sans-serif; 
                background: #f5f5f5;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                padding: 20px;
              }
              .badge {
                width: 400px;
                height: 250px;
                background: ${bgColorFront};
                border-radius: 15px;
                border: 3px solid #0D47A1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                margin-bottom: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                overflow: hidden;
              }
              .badge-back {
                width: 400px;
                height: 250px;
                background: ${bgColorBack};
                border-radius: 15px;
                border: 3px solid #0D47A1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                overflow: hidden;
              }
              .logo {
                position: absolute;
                top: 10px;
                left: 10px;
                width: 60px;
                height: 60px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
                color: white;
              }
              .mieadi-title {
                font-size: 36px;
                font-weight: bold;
                color: #0D47A1;
                text-align: center;
                margin-bottom: 5px;
              }
              .mieadi-subtitle {
                font-size: 12px;
                color: #0D47A1;
                text-align: center;
                margin-bottom: 20px;
                font-weight: bold;
              }
              .photo {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                border: 4px solid #0D47A1;
                object-fit: cover;
                margin-bottom: 10px;
              }
              .initials {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                border: 4px solid #0D47A1;
                background: rgba(255, 255, 255, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 36px;
                font-weight: bold;
                color: #0D47A1;
                margin-bottom: 10px;
              }
              .credential-header {
                background: rgba(255, 255, 255, 0.3);
                padding: 8px 30px;
                border-radius: 20px;
                margin-bottom: 10px;
              }
              .credential-title {
                font-size: 20px;
                font-weight: bold;
                color: #0D47A1;
                text-align: center;
              }
              .position-badge {
                background: rgba(255, 255, 255, 0.3);
                padding: 6px 20px;
                border-radius: 15px;
                margin-bottom: 10px;
              }
              .name {
                font-size: 16px;
                font-weight: bold;
                color: #0D47A1;
                text-align: center;
                margin-bottom: 10px;
              }
              .position {
                font-size: 14px;
                color: #0D47A1;
                text-align: center;
                font-weight: bold;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                width: 100%;
                margin-bottom: 10px;
                padding: 0 20px;
              }
              .info-item {
                background: rgba(255, 255, 255, 0.3);
                padding: 8px 15px;
                border-radius: 10px;
                flex: 1;
                margin: 0 5px;
              }
              .info-label {
                font-size: 10px;
                color: #0D47A1;
                font-weight: bold;
                margin-bottom: 2px;
              }
              .info-value {
                font-size: 12px;
                color: #0D47A1;
                font-weight: bold;
              }
              .back-title {
                font-size: 36px;
                font-weight: bold;
                color: #0D47A1;
                text-align: center;
                margin-bottom: 5px;
              }
              .back-subtitle {
                font-size: 12px;
                color: #0D47A1;
                text-align: center;
                margin-bottom: 30px;
                font-weight: bold;
              }
              .back-name {
                background: rgba(255, 255, 255, 0.3);
                padding: 10px 30px;
                border-radius: 15px;
                margin-bottom: 30px;
                text-align: center;
              }
              .back-name-label {
                font-size: 10px;
                color: #0D47A1;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .back-name-value {
                font-size: 18px;
                color: #0D47A1;
                font-weight: bold;
              }
              .signature-area {
                margin-top: 20px;
                text-align: center;
              }
              .signature-line {
                width: 200px;
                height: 1px;
                background: #0D47A1;
                margin: 20px auto 10px auto;
              }
              .signature-text {
                font-size: 12px;
                color: #0D47A1;
                font-weight: bold;
              }
              @media print {
                body { 
                  background: white;
                  margin: 0;
                  padding: 0;
                }
                .badge, .badge-back {
                  margin: 0;
                  box-shadow: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="badge">
              <div class="logo">M</div>
              <div class="mieadi-title">MIEADI</div>
              <div class="mieadi-subtitle">MINISTÉRIO DE INTEGRAÇÃO ECLESIÁSTICO<br>DA ASSEMBLEDE DEUS EM IMPERATRIZ</div>
              
              ${person.photo_url 
                ? `<img src="${person.photo_url}" alt="${person.full_name}" class="photo" />`
                : `<div class="initials">${person.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>`
              }
              
              <div class="credential-header">
                <div class="credential-title">CREDENCIAL</div>
              </div>
              
              ${person.ministerial_position ? `
                <div class="position-badge">
                  <div class="position">${person.ministerial_position}</div>
                </div>
              ` : ''}
              
              <div class="name">NOME: ${person.full_name}</div>
              
              <div class="info-row">
                <div class="info-item">
                  <div class="info-label">OFÍCIO</div>
                  <div class="info-value">${person.ministerial_position || 'MEMBRO'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">VALIDADE</div>
                  <div class="info-value">30/12/2025</div>
                </div>
              </div>
            </div>
            
            <div class="badge-back">
              <div class="back-title">MIEADI</div>
              <div class="back-subtitle">MINISTÉRIO DE INTEGRAÇÃO ECLESIÁSTICO<br>DA ASSEMBLEDE DEUS EM IMPERATRIZ</div>
              
              <div class="back-name">
                <div class="back-name-label">NOME COMPLETO</div>
                <div class="back-name-value">${person.full_name}</div>
              </div>
              
              <div class="info-row">
                <div class="info-item">
                  <div class="info-label">RG:</div>
                  <div class="info-value">-</div>
                </div>
                <div class="info-item">
                  <div class="info-label">CARTÃO DE MEMBRO</div>
                  <div class="info-value">-</div>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-item">
                  <div class="info-label">CPF</div>
                  <div class="info-value">${person.cpf}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">MATRÍCULA</div>
                  <div class="info-value">0001</div>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-item">
                  <div class="info-label">DATA NASC.:</div>
                  <div class="info-value">${person.birth_date || '-'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">CONTATO</div>
                  <div class="info-value">${person.phone || '-'}</div>
                </div>
              </div>
              
              <div class="signature-area">
                <div class="signature-line"></div>
                <div class="signature-text">JOÃO PEREIRA CARDOSO<br>PRESIDENTE DO MIEADI</div>
              </div>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const previewBgColor = isWoman ? 'bg-gradient-to-br from-pink-400 to-pink-600' : 'bg-gradient-to-br from-blue-500 to-blue-700';
  
  return (
    <div className="space-y-4">
      {/* Preview do Crachá */}
      <Card className={`w-80 h-60 mx-auto ${previewBgColor} text-white relative overflow-hidden`}>
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white/10 to-transparent rounded-t-lg" />
        
        <div className="p-4 h-full flex flex-col items-center relative z-10">
          {/* Header */}
          <div className="text-center mb-2">
            <h3 className="text-xl font-bold text-blue-900">MIEADI</h3>
            <p className="text-xs text-blue-900 font-semibold">MINISTÉRIO DE INTEGRAÇÃO ECLESIÁSTICO<br/>DA ASSEMBLEDE DEUS EM IMPERATRIZ</p>
          </div>
          
          {/* Foto */}
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-900 mb-2 bg-white/10 flex items-center justify-center">
            {person.photo_url ? (
              <img 
                src={person.photo_url} 
                alt={person.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-blue-900 text-lg font-bold">
                {person.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            )}
          </div>
          
          {/* Credencial */}
          <div className="bg-white/30 px-4 py-1 rounded-lg mb-2">
            <p className="text-xs font-bold text-blue-900">CREDENCIAL</p>
          </div>
          
          {/* Nome */}
          <div className="text-center">
            <h4 className="text-sm font-bold mb-1 text-blue-900">
              NOME: {person.full_name}
            </h4>
            
            {/* Informações */}
            <div className="flex justify-between w-full text-xs mb-2">
              <div className="bg-white/30 px-2 py-1 rounded">
                <p className="text-blue-900 font-bold">OFÍCIO</p>
                <p className="text-blue-900 font-bold">{person.ministerial_position || 'MEMBRO'}</p>
              </div>
              <div className="bg-white/30 px-2 py-1 rounded">
                <p className="text-blue-900 font-bold">VALIDADE</p>
                <p className="text-blue-900 font-bold">30/12/2025</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Botão de Impressão */}
      <div className="text-center">
        <button
          onClick={handlePrint}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Imprimir Crachá (Frente e Verso)
        </button>
      </div>
    </div>
  );
}