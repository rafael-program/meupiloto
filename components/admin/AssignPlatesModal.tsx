// app/components/admin/AssignPlatesModal.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Search, UserCheck, UserX, Store, CheckCircle, XCircle } from 'lucide-react';

interface AssignPlatesModalProps {
  operadores: any[];
  plates: any[];
  onSuccess: () => void;
}

export default function AssignPlatesModal({ operadores, plates, onSuccess }: AssignPlatesModalProps) {
  const [selectedOperador, setSelectedOperador] = useState<string>('');
  const [selectedPlates, setSelectedPlates] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const operadorPlates = plates.filter(p => p.operador_id === selectedOperador);
  const availablePlates = plates.filter(p => !p.operador_id);
  
  const filteredPlates = (selectedOperador ? operadorPlates : availablePlates).filter(p =>
    p.plate_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedOperador || selectedPlates.size === 0) return;
    
    setLoading(true);
    setMessage(null);
    
    const adminId = localStorage.getItem('admin_id');
    const results = [];
    
    for (const plateId of selectedPlates) {
      const { error } = await supabase
        .from('plates')
        .update({ 
          operador_id: selectedOperador,
          assigned_at: new Date().toISOString()
        })
        .eq('id', plateId);
      
      if (!error) {
        // Registrar no histórico
        await supabase.from('plate_assignments').insert({
          plate_id: plateId,
          operador_id: selectedOperador,
          assigned_by: adminId,
          assigned_at: new Date().toISOString()
        });
        results.push(true);
      } else {
        results.push(false);
      }
    }
    
    const successCount = results.filter(r => r).length;
    
    if (successCount > 0) {
      setMessage({ 
        type: 'success', 
        text: `${successCount} placa(s) atribuída(s) com sucesso!` 
      });
      setSelectedPlates(new Set());
      onSuccess();
    } else {
      setMessage({ type: 'error', text: 'Erro ao atribuir placas' });
    }
    
    setLoading(false);
  };

  const handleUnassign = async (plateId: string) => {
    if (!confirm('Remover atribuição desta placa?')) return;
    
    const { error } = await supabase
      .from('plates')
      .update({ operador_id: null, assigned_at: null })
      .eq('id', plateId);
    
    if (!error) {
      await supabase.from('plate_assignments').insert({
        plate_id: plateId,
        operador_id: selectedOperador,
        assigned_by: localStorage.getItem('admin_id'),
        unassigned_at: new Date().toISOString()
      });
      onSuccess();
    }
  };

  const togglePlate = (plateId: string) => {
    const newSet = new Set(selectedPlates);
    if (newSet.has(plateId)) {
      newSet.delete(plateId);
    } else {
      newSet.add(plateId);
    }
    setSelectedPlates(newSet);
  };

  const selectedOperadorInfo = operadores.find(o => o.id === selectedOperador);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
        Atribuir Placas a Operadores
      </h2>
      
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px',
          backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#dc2626',
        }}>
          {message.text}
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Coluna Esquerda - Selecionar Operador */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>1. Selecione o Operador</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {operadores.map((op) => (
              <button
                key={op.id}
                onClick={() => {
                  setSelectedOperador(op.id);
                  setSelectedPlates(new Set());
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: selectedOperador === op.id ? '#fef3c7' : 'white',
                  border: `1px solid ${selectedOperador === op.id ? '#f59e0b' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{op.name.charAt(0)}</span>
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontWeight: 'bold' }}>{op.name}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>{op.phone}</p>
                </div>
                <div>
                  <span style={{
                    backgroundColor: '#f3f4f6',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontSize: '12px',
                  }}>
                    {plates.filter(p => p.operador_id === op.id).length} placas
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Coluna Direita - Gerenciar Placas */}
        {selectedOperador && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                Placas de {selectedOperadorInfo?.name}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedPlates.size > 0 && (
                  <button
                    onClick={handleAssign}
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    <UserCheck size={16} />
                    Atribuir ({selectedPlates.size})
                  </button>
                )}
              </div>
            </div>
            
            {/* Busca */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Buscar placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px',
                }}
              />
            </div>
            
            {/* Lista de Placas Disponíveis */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredPlates.map((plate) => (
                <div
                  key={plate.id}
                  onClick={() => togglePlate(plate.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    backgroundColor: selectedPlates.has(plate.id) ? '#fef3c7' : 'white',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Store size={20} color="#6b7280" />
                    <div>
                      <p style={{ fontWeight: 500 }}>{plate.plate_number}</p>
                      <p style={{ fontSize: '11px', color: '#6b7280' }}>
                        Chefe: {plate.boss?.name || 'Não definido'}
                      </p>
                    </div>
                  </div>
                  <div>
                    {selectedPlates.has(plate.id) ? (
                      <CheckCircle size={20} color="#10b981" />
                    ) : plate.operador_id === selectedOperador ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnassign(plate.id);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      >
                        <UserX size={18} />
                      </button>
                    ) : (
                      <div style={{ width: '20px', height: '20px', border: '2px solid #d1d5db', borderRadius: '4px' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}