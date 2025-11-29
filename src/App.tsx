import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, Server, Database, Activity, CheckCircle, 
  ArrowRight, Zap, Cpu, Network, Monitor, MousePointer, 
  MoreVertical, FileText, Info, Globe, Layers, ChevronRight, Check, X, Box 
} from 'lucide-react';

// --- TIPOS ---
type Phase = 
  | 'IDLE'           
  | 'PRECHECK'       
  | 'PRECOPY'        
  | 'DIRTY_WORK'     
  | 'DIRTY_SYNC'     
  | 'SWITCHOVER'     
  | 'COMPLETED';     

type ViewMode = 'VCENTER_UI' | 'INFRASTRUCTURE';

interface MemoryBlock {
  id: number;
  status: 'empty' | 'synced' | 'dirty' | 'transferring' | 'locked';
}

const VMotionSimulation = () => {
  // --- ESTADOS GENERALES ---
  const [viewMode, setViewMode] = useState<ViewMode>('VCENTER_UI');
  const [autoPlay, setAutoPlay] = useState(false);
  
  // --- ESTADOS SIMULACIÓN BACKEND ---
  const [phase, setPhase] = useState<Phase>('IDLE');
  const [activeHost, setActiveHost] = useState<'host1' | 'host2'>('host1');
  const [host1Mem, setHost1Mem] = useState<MemoryBlock[]>([]);
  const [host2Mem, setHost2Mem] = useState<MemoryBlock[]>([]);
  
  const [netCheck, setNetCheck] = useState<'pending' | 'checking' | 'ok'>('pending');
  const [storageCheck, setStorageCheck] = useState<'pending' | 'checking' | 'ok'>('pending');
  
  const [statusTitle, setStatusTitle] = useState("Esperando inicio");
  const [statusMessage, setStatusMessage] = useState("El proceso comenzará cuando el administrador confirme la migración.");
  
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- ESTADOS INTERFAZ VCENTER ---
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedDest, setSelectedDest] = useState<string | null>(null);

  // Inicialización
  useEffect(() => {
    resetSim();
  }, []);

  // Efecto Auto-Play
  useEffect(() => {
    if (viewMode === 'INFRASTRUCTURE' && autoPlay) {
      runFullMigrationSequence();
    }
  }, [viewMode, autoPlay]);

  // Logs Scroll
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // LOGS INVERTIDOS (Nuevos arriba)
  const addLog = (msg: string) => {
    setLogs(prev => [`> ${msg}`, ...prev]);
  };

  const resetSim = () => {
    setViewMode('VCENTER_UI');
    setPhase('IDLE');
    setActiveHost('host1');
    setHost1Mem(Array.from({ length: 20 }, (_, i) => ({ id: i, status: 'synced' })));
    setHost2Mem(Array.from({ length: 20 }, (_, i) => ({ id: i, status: 'empty' })));
    setNetCheck('pending');
    setStorageCheck('pending');
    setStatusTitle("Esperando Operador");
    setStatusMessage("Configura la migración en la vista de vCenter para comenzar.");
    setLogs([]); 
    setContextMenu(null);
    setShowWizard(false);
    setWizardStep(1);
    setSelectedDest(null);
    setAutoPlay(false);
  };

  // --- EVENT HANDLERS ---
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleMigrateClick = () => {
    setContextMenu(null);
    setShowWizard(true);
  };

  const handleWizardFinish = () => {
    setShowWizard(false);
    setLogs([]); 
    // Logs iniciales claros para estudiantes
    addLog("Sistema: Tarea de migración recibida.");
    addLog("Administrador: Confirmó migración a Host 192.168.10.6.");
    addLog("--- INICIO DE REGISTRO vMOTION ---");
    setAutoPlay(true);
    setViewMode('INFRASTRUCTURE');
  };

  // --- MOTOR DE SIMULACIÓN (LENTO Y DETALLADO PARA ESTUDIANTES) ---
  const runFullMigrationSequence = async () => {
    await delay(2000);

    // 1. PRE-CHECK
    setPhase('PRECHECK');
    setStatusTitle("PASO 1: Validaciones Previas (Pre-Checks)");
    setStatusMessage("El sistema verifica que el cable de red (vMotion) funcione y que el disco duro sea visible en ambos servidores.");
    
    addLog("Sistema: Verificando que ambos servidores se puedan ver...");
    setNetCheck('checking');
    await delay(3000); 
    setNetCheck('ok');
    addLog("Red: Conexión vMotion OK (VLAN 80 detectada).");

    addLog("Sistema: Verificando acceso al almacenamiento compartido...");
    setStorageCheck('checking');
    await delay(3000);
    setStorageCheck('ok');
    addLog("Disco: Correcto. Ambos servidores ven los archivos de la VM.");
    
    // 2. PRE-COPY
    setPhase('PRECOPY');
    setStatusTitle("PASO 2: Copia Inicial (Mientras funciona)");
    setStatusMessage("Se crea una copia vacía en el destino. Ahora empieza a pasar toda la memoria RAM por la red. La máquina original sigue encendida.");
    addLog("Destino: Preparando espacio para recibir la VM...");
    await delay(2000);
    addLog("Origen: Empezando a enviar toda la memoria RAM...");
    
    const totalBlocks = 20;
    for (let i = 0; i < totalBlocks; i++) {
      setHost1Mem(prev => { const n = [...prev]; n[i].status = 'transferring'; return n; });
      await delay(600); // Lento para explicar
      setHost2Mem(prev => { const n = [...prev]; n[i].status = 'synced'; return n; });
      setHost1Mem(prev => { const n = [...prev]; n[i].status = 'synced'; return n; });
      
      if (i === 12) {
        setStatusTitle("PASO 2b: El Usuario Sigue Trabajando");
        setStatusMessage("¡Ojo! El usuario guardó un archivo mientras copiábamos. Esos datos en memoria cambiaron (se ponen rojos). El sistema toma nota para enviarlos luego.");
        addLog("ALERTA: El usuario modificó datos en memoria RAM.");
        addLog("Sistema: Marcando esos datos para reenviarlos después.");
        setHost1Mem(prev => { const n = [...prev]; [2, 5, 8, 14].forEach(idx => n[idx].status = 'dirty'); return n; });
        setHost2Mem(prev => { const n = [...prev]; [2, 5, 8, 14].forEach(idx => n[idx].status = 'empty'); return n; });
        await delay(5000);
      }
    }

    // 3. DIRTY SYNC
    setPhase('DIRTY_SYNC');
    setStatusTitle("PASO 3: Enviando lo que faltaba");
    setStatusMessage("Ya copiamos casi todo. Ahora enviamos rápidamente solo esos pedacitos rojos (modificados) para que las dos máquinas sean gemelas.");
    addLog("Origen: Enviando solo los últimos cambios (Deltas)...");
    
    const dirtyIndices = [2, 5, 8, 14];
    for (const idx of dirtyIndices) {
      setHost1Mem(prev => { const n = [...prev]; n[idx].status = 'transferring'; return n; });
      await delay(1500);
      setHost2Mem(prev => { const n = [...prev]; n[idx].status = 'synced'; return n; });
      setHost1Mem(prev => { const n = [...prev]; n[idx].status = 'synced'; return n; });
    }
    
    addLog("Sincronización: ¡Listo! Ambas memorias son idénticas.");
    await delay(3000);

    // 4. SWITCHOVER
    setPhase('SWITCHOVER');
    setStatusTitle("PASO 4: El Salto Final (Switchover)");
    setStatusMessage("Se congela la máquina origen menos de un segundo. Se enciende la del destino y se avisa a la red '¡Ahora estoy aquí!'.");
    addLog("Sistema: Pausando máquina virtual por un instante...");
    await delay(4000);
    setActiveHost('host2'); 
    addLog("Sistema: ¡Encendiendo máquina en el servidor destino!");
    addLog("Red: Avisando al switch del cambio de ubicación.");
    setStatusMessage("¡ÉXITO! La VM ya está corriendo en el nuevo servidor.");

    // 5. CLEANUP
    await delay(6000);
    setPhase('COMPLETED');
    setStatusTitle("MIGRACIÓN COMPLETADA");
    setStatusMessage("Todo salió bien. Ahora borramos la copia vieja del servidor origen para no ocupar espacio.");
    addLog("Limpieza: Borrando archivos temporales del servidor viejo...");
    await delay(3000);
    setHost1Mem([]); 
    addLog("Tarea Finalizada: Migración exitosa y sin desconexión.");
    addLog("--- FIN DE REGISTRO ---");
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- RENDERIZADORES UI ---

  // VISTA VCENTER 8.0 REALISTA
  const renderVCenter = () => (
    <div className="bg-[#f5f7fa] min-h-screen flex flex-col font-sans text-[#2d3640]">
      {/* Header vCenter 8 */}
      <div className="bg-[#1e2730] text-white h-[48px] flex items-center justify-between px-4 border-b border-[#444]">
        <div className="flex items-center gap-6">
            <div className="font-semibold text-lg flex items-center gap-2">
               <span className="font-bold">VMware</span> vSphere Client
            </div>
            <div className="text-gray-400 text-sm border-l border-gray-600 pl-4 cursor-pointer hover:text-white transition-colors">Menu</div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-300">
            <span>administrator@riveritatech.local</span>
            <div className="w-6 h-6 rounded-full bg-[#007cbb] flex items-center justify-center text-white font-bold">A</div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Navigator Tree */}
        <div className="w-[280px] bg-white border-r border-gray-300 flex flex-col hidden md:flex">
            <div className="p-3 border-b border-gray-200 bg-[#f1f3f5] text-[11px] font-bold text-gray-600 uppercase tracking-wide">Navigator</div>
            <div className="p-2 overflow-y-auto flex-1 text-[13px] text-[#2d3640]">
                <div className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#e1f0fa] cursor-pointer">
                    <Globe size={14} className="text-gray-500"/> Riveritatech
                </div>
                <div className="ml-4 flex items-center gap-1.5 py-1 px-2 hover:bg-[#e1f0fa] cursor-pointer">
                    <Layers size={14} className="text-gray-500"/> ClusterLab
                </div>
                <div className="ml-8 flex items-center gap-1.5 py-1 px-2 hover:bg-[#e1f0fa] cursor-pointer text-gray-600">
                    <Server size={14}/> 192.168.10.5
                </div>
                <div className="ml-12 flex items-center gap-1.5 bg-[#e1f0fa] border-l-[3px] border-[#007cbb] py-1 px-2 text-[#2d3640] font-medium cursor-pointer">
                    <Monitor size={14} className="text-[#007cbb]"/> CRM-App
                </div>
                <div className="ml-8 flex items-center gap-1.5 py-1 px-2 hover:bg-[#e1f0fa] cursor-pointer text-gray-600">
                    <Server size={14}/> 192.168.10.6
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-[#f5f7fa] relative overflow-hidden" onClick={() => setContextMenu(null)}>
            
            {/* Object Tab Header */}
            <div className="bg-white px-6 pt-5 pb-0 border-b border-gray-300 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                    <div className="bg-[#007cbb] p-2 rounded-sm text-white shadow-sm">
                        <Monitor size={40} strokeWidth={1.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-normal text-[#2d3640]">CRM-App</h1>
                            <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-300">Powered On</span>
                        </div>
                        <div className="flex gap-6 text-[11px] text-gray-600 mt-1">
                            <span className="flex items-center gap-1"><Server size={12}/> Host: <span className="text-[#007cbb] cursor-pointer hover:underline">192.168.10.5</span></span>
                            <span className="flex items-center gap-1"><Cpu size={12}/> CPU: <span className="text-gray-900">2 vCPUs</span></span>
                            <span className="flex items-center gap-1"><Box size={12}/> Memory: <span className="text-gray-900">16 GB</span></span>
                        </div>
                    </div>
                </div>
                
                {/* Tabs vCenter 8 */}
                <div className="flex gap-8 text-[13px] font-medium text-gray-600">
                    <div className="pb-3 border-b-[3px] border-[#007cbb] text-[#007cbb] cursor-pointer">Summary</div>
                    <div className="pb-3 border-b-[3px] border-transparent hover:border-gray-300 cursor-pointer">Monitor</div>
                    <div className="pb-3 border-b-[3px] border-transparent hover:border-gray-300 cursor-pointer">Configure</div>
                    <div className="pb-3 border-b-[3px] border-transparent hover:border-gray-300 cursor-pointer">Permissions</div>
                    <div className="pb-3 border-b-[3px] border-transparent hover:border-gray-300 cursor-pointer">Datastores</div>
                </div>
            </div>

            {/* Summary Content - REALISTA */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-3 gap-6">
                    
                    {/* Panel 1: VM Info */}
                    <div className="col-span-1 bg-white border border-gray-300 rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <div className="px-4 py-2 border-b border-gray-200 bg-[#fafafa] flex justify-between items-center">
                            <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">VM Hardware</h3>
                            <ChevronRight size={14} className="text-gray-400"/>
                        </div>
                        <div className="p-4 space-y-3 text-[13px]">
                             <div className="flex justify-between">
                                <span className="text-gray-500">Guest OS:</span>
                                <span className="text-[#2d3640]">Microsoft Windows Server 2025 (64-bit)</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500">Compatibility:</span>
                                <span className="text-[#2d3640]">ESXi 8.0 U2 and later (VM version 21)</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500">VMware Tools:</span>
                                <span className="text-green-700 flex items-center gap-1"><Check size={12}/> Running (13.0.5)</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500">IP Addresses:</span>
                                <span className="text-[#007cbb] cursor-pointer">192.168.10.100</span>
                             </div>
                        </div>
                    </div>

                    {/* Panel Interactivo */}
                    <div className="col-span-2 bg-white border border-gray-300 rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)] h-[300px] flex flex-col">
                        <div className="px-4 py-2 border-b border-gray-200 bg-[#fafafa] flex justify-between items-center">
                            <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Panel de Administración</h3>
                        </div>
                        <div 
                            className="flex-1 flex flex-col items-center justify-center cursor-context-menu hover:bg-blue-50/30 transition-colors"
                            onContextMenu={handleRightClick}
                        >
                            <div className="border-2 border-dashed border-blue-200 rounded-lg p-8 text-center">
                                <MousePointer size={40} className="mx-auto text-blue-400 mb-2" />
                                <div className="text-lg text-gray-700 font-medium">Zona Interactiva</div>
                                <div className="text-sm text-gray-500">Haz <strong className="text-blue-600">Clic Derecho</strong> aquí para migrar la VM.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Context Menu vCenter 8 Style */}
            {contextMenu && (
                <div 
                    className="absolute bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-gray-300 py-1 w-64 z-50 text-[13px] text-[#2d3640]"
                    style={{ top: contextMenu.y, left: contextMenu.x }} 
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer flex items-center gap-2">Power</div>
                    <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Guest OS</div>
                    <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Snapshots</div>
                    <div className="h-px bg-gray-200 my-1"></div>
                    <div 
                        className="px-4 py-1.5 hover:bg-[#007cbb] hover:text-white cursor-pointer flex justify-between items-center"
                        onClick={handleMigrateClick}
                    >
                        Migrate...
                        <ChevronRight size={14}/>
                    </div>
                    <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Clone...</div>
                    <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Fault Tolerance</div>
                </div>
            )}

            {/* Wizard vMotion 8.0 */}
            {showWizard && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 font-sans">
                    <div className="bg-white rounded-sm shadow-2xl w-[700px] h-[550px] flex flex-col">
                        
                        {/* Title Bar */}
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                            <h2 className="text-xl font-normal text-[#2d3640]">Migrate - CRM-App</h2>
                            <X size={20} className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setShowWizard(false)}/>
                        </div>

                        {/* Wizard Content */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Left Sidebar Steps */}
                            <div className="w-[200px] bg-[#fafafa] border-r border-gray-200 pt-6 px-0 hidden sm:block">
                                <div className={`px-6 py-2 text-[13px] ${wizardStep === 1 ? 'font-bold text-[#2d3640] border-l-[3px] border-[#007cbb] bg-white' : 'text-gray-500'}`}>1. Select migration type</div>
                                <div className={`px-6 py-2 text-[13px] ${wizardStep === 2 ? 'font-bold text-[#2d3640] border-l-[3px] border-[#007cbb] bg-white' : 'text-gray-500'}`}>2. Select compute resource</div>
                                <div className={`px-6 py-2 text-[13px] ${wizardStep === 3 ? 'font-bold text-[#2d3640] border-l-[3px] border-[#007cbb] bg-white' : 'text-gray-500'}`}>3. Review</div>
                            </div>

                            {/* Main Form Area */}
                            <div className="flex-1 p-8 overflow-y-auto bg-white">
                                {wizardStep === 1 && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h3 className="text-lg font-normal text-[#2d3640]">Select a migration type</h3>
                                        <div className="space-y-4">
                                            <label className="flex items-start gap-3 p-4 border border-[#007cbb] bg-[#f5fafe] rounded-sm cursor-pointer ring-1 ring-[#007cbb]">
                                                <div className="mt-0.5"><div className="w-4 h-4 rounded-full border-[5px] border-[#007cbb] bg-white"></div></div>
                                                <div>
                                                    <div className="font-bold text-[#2d3640] text-sm">Change compute resource only</div>
                                                    <div className="text-xs text-gray-600 mt-1">Migrate the virtual machine to another host or cluster (vMotion).</div>
                                                </div>
                                            </label>
                                            <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-sm opacity-60">
                                                <div className="mt-0.5"><div className="w-4 h-4 rounded-full border border-gray-400 bg-white"></div></div>
                                                <div>
                                                    <div className="font-bold text-[#2d3640] text-sm">Change storage only</div>
                                                    <div className="text-xs text-gray-600 mt-1">Migrate the virtual machine's storage (Storage vMotion).</div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 2 && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h3 className="text-lg font-normal text-[#2d3640]">Select destination compute resource</h3>
                                        <div className="border border-gray-300 h-[250px] overflow-y-auto">
                                            <div className="px-2 py-1 text-xs font-bold text-gray-600 bg-[#f1f3f5] border-b">Riveritatech &gt; ClusterLab</div>
                                            <div className="p-1">
                                                <div className="flex items-center gap-2 p-2 text-sm text-gray-400 pl-6">
                                                    <Server size={14}/> 192.168.10.5 (Source)
                                                </div>
                                                <div 
                                                    className={`flex items-center gap-2 p-2 text-sm cursor-pointer pl-6 ${selectedDest === 'host2' ? 'bg-[#cde6f7] text-[#2d3640]' : 'text-[#2d3640] hover:bg-[#e1f0fa]'}`}
                                                    onClick={() => setSelectedDest('host2')}
                                                >
                                                    <Server size={14}/> 192.168.10.6 (Host Destino)
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {selectedDest && (
                                            <div className="bg-[#eaf7ed] border border-[#c4e1cd] p-3 text-sm flex gap-2 items-start text-[#1e522d]">
                                                <CheckCircle size={16} className="mt-0.5 text-green-600"/>
                                                <div>
                                                    <strong>Compatibility checks succeeded.</strong>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {wizardStep === 3 && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h3 className="text-lg font-normal text-[#2d3640]">Review selections</h3>
                                        <div className="border border-gray-300 rounded-sm text-sm">
                                            <div className="grid grid-cols-3 p-3 border-b border-gray-200 bg-[#fafafa]">
                                                <span className="text-gray-600">VM Name</span>
                                                <span className="col-span-2 font-medium">CRM-App</span>
                                            </div>
                                            <div className="grid grid-cols-3 p-3 border-b border-gray-200 bg-white">
                                                <span className="text-gray-600">Target Host</span>
                                                <span className="col-span-2 font-medium">192.168.10.6</span>
                                            </div>
                                            <div className="grid grid-cols-3 p-3 bg-[#fafafa]">
                                                <span className="text-gray-600">vMotion Priority</span>
                                                <span className="col-span-2 font-medium">High</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-[#fafafa]">
                            <button className="px-5 py-1.5 text-[#2d3640] text-[13px] font-medium border border-gray-300 bg-white hover:bg-gray-50 rounded-sm" onClick={() => setShowWizard(false)}>Cancel</button>
                            {wizardStep < 3 ? (
                                <button 
                                    className="px-5 py-1.5 bg-[#007cbb] text-white text-[13px] font-medium rounded-sm hover:bg-[#006194] disabled:opacity-50"
                                    onClick={() => setWizardStep(s => s+1)}
                                    disabled={wizardStep === 2 && !selectedDest}
                                >
                                    Next
                                </button>
                            ) : (
                                <button className="px-5 py-1.5 bg-[#007cbb] text-white text-[13px] font-medium rounded-sm hover:bg-[#006194]" onClick={handleWizardFinish}>Finish</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );

  // VISTA INFRAESTRUCTURA (BACKEND) - SIN CAMBIOS DRÁSTICOS, SOLO TEXTOS
  const renderInfrastructure = () => (
    <div className="min-h-screen bg-[#f0f2f5] p-6 font-sans text-slate-800 animate-in fade-in duration-700 flex flex-col">
      {/* Header Infra */}
      <div className="max-w-7xl mx-auto w-full mb-6 flex justify-between items-center bg-white p-4 rounded shadow-sm border border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase border border-gray-200">Riveritatech Lab</span>
             <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase border border-blue-100">ClusterLab</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-blue-600" />
            Vista Backend: Proceso de vMotion
          </h1>
        </div>
        <button onClick={resetSim} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded text-gray-700 font-medium text-sm transition-colors shadow-sm">
            <RotateCcw size={16}/> Reiniciar Laboratorio
        </button>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-12 gap-6 flex-1">
        
        {/* COLUMNA IZQUIERDA: VISUALIZACIÓN */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* RACK SERVER VISUALIZATION */}
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 relative overflow-hidden min-h-[350px]">
                <div className="flex justify-between items-start gap-12 relative z-10">
                    
                    {/* HOST 1 */}
                    <div className={`flex-1 transition-all duration-700 ${activeHost === 'host1' && phase !== 'COMPLETED' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="bg-gray-100 p-2 rounded-t border border-gray-300 flex justify-between items-center shadow-sm">
                            <span className="font-bold text-gray-700 text-xs flex items-center gap-2">
                                <Server size={14} className="text-gray-500"/> Host Origen
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">192.168.10.5</span>
                        </div>
                        <div className={`bg-[#2c3e50] p-4 rounded-b h-[260px] border-x-2 border-b-2 transition-colors duration-500 relative ${activeHost === 'host1' && phase !== 'COMPLETED' ? 'border-green-500' : 'border-[#2c3e50]'}`}>
                            <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></div>
                            {host1Mem.length > 0 && (
                                <div className="bg-[#34495e] rounded p-4 border border-[#46607a] h-full shadow-inner flex flex-col gap-2">
                                    <div className="flex justify-between text-white text-xs font-mono border-b border-[#46607a] pb-2">
                                        <span className="flex items-center gap-2"><Cpu size={14} className="text-blue-300"/> CRM-App</span>
                                        <span className="text-[9px] bg-green-600 px-1.5 rounded">ACTIVE</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400">Páginas de Memoria (4KB):</div>
                                    <div className="grid grid-cols-5 gap-2 mt-auto">
                                        {host1Mem.map(m => (
                                            <div key={m.id} className={`h-3 rounded-[1px] transition-all duration-300 ${
                                                m.status === 'synced' ? 'bg-green-500 shadow-[0_0_4px_#22c55e]' : 
                                                m.status === 'dirty' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]' : 
                                                m.status === 'transferring' ? 'bg-blue-400' : 
                                                'bg-[#1f2d3a]'
                                            }`}/>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CONEXIONES */}
                    <div className="w-32 flex flex-col items-center justify-center gap-8 py-12 self-center">
                        <div className={`flex flex-col items-center w-full transition-all duration-500 ${netCheck === 'ok' ? 'opacity-100' : 'opacity-20'}`}>
                            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold mb-1"><Network size={14}/> vMotion Net</div>
                            <div className="h-1.5 w-full bg-gray-200 rounded overflow-hidden relative">
                                {(phase === 'PRECOPY' || phase === 'DIRTY_SYNC') && (
                                    <div className="absolute inset-0 bg-blue-500 animate-[moveRight_1s_linear_infinite]"></div>
                                )}
                            </div>
                            <span className="text-[9px] text-gray-400 mt-1 font-mono">10GbE VLAN 80</span>
                        </div>
                        <div className={`flex flex-col items-center w-full transition-all duration-500 ${storageCheck === 'ok' ? 'opacity-100' : 'opacity-20'}`}>
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold mb-1"><Database size={14}/> SAN FC</div>
                            <div className="h-1.5 w-full bg-amber-200 rounded"></div>
                            <span className="text-[9px] text-gray-400 mt-1 font-mono text-center">LUN Zonificada (Compartida)</span>
                        </div>
                    </div>

                    {/* HOST 2 */}
                    <div className={`flex-1 transition-all duration-700 ${activeHost === 'host2' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="bg-gray-100 p-2 rounded-t border border-gray-300 flex justify-between items-center shadow-sm">
                            <span className="font-bold text-gray-700 text-xs flex items-center gap-2">
                                <Server size={14} className="text-gray-500"/> Host Destino
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">192.168.10.6</span>
                        </div>
                        <div className={`bg-[#2c3e50] p-4 rounded-b h-[260px] border-x-2 border-b-2 transition-colors duration-500 relative ${activeHost === 'host2' ? 'border-green-500' : 'border-[#2c3e50]'}`}>
                             <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${activeHost === 'host2' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
                            {host2Mem.length > 0 && phase !== 'IDLE' && (
                                <div className={`bg-[#34495e] rounded p-4 border border-[#46607a] h-full shadow-inner flex flex-col gap-2 transition-opacity ${activeHost === 'host2' ? 'opacity-100' : 'opacity-60 border-dashed'}`}>
                                    <div className="flex justify-between text-white text-xs font-mono border-b border-[#46607a] pb-2">
                                        <span className="flex items-center gap-2"><Cpu size={14} className="text-blue-300"/> {activeHost === 'host2' ? 'CRM-App' : 'Shadow VM'}</span>
                                        {activeHost === 'host2' ? 
                                            <span className="text-[9px] bg-green-600 px-1.5 rounded">ACTIVE</span> : 
                                            <span className="text-[9px] border border-yellow-500 text-yellow-500 px-1.5 rounded">RECEIVING</span>
                                        }
                                    </div>
                                    <div className="text-[10px] text-gray-400">Target Memory:</div>
                                    <div className="grid grid-cols-5 gap-2 mt-auto">
                                        {host2Mem.map(m => (
                                            <div key={m.id} className={`h-3 rounded-[1px] transition-all duration-300 ${m.status === 'synced' ? 'bg-green-500' : 'bg-[#1f2d3a] border border-[#46607a]'}`}/>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRA DE ESTADO (EXPLICACIÓN) */}
            <div className={`p-6 rounded-lg border shadow-sm transition-all duration-500 flex items-start gap-4 ${
                phase === 'COMPLETED' ? 'bg-green-50 border-green-200' : 
                phase === 'SWITCHOVER' ? 'bg-red-50 border-red-200' :
                'bg-white border-blue-200'
            }`}>
                <div className={`p-3 rounded-lg shrink-0 ${
                    phase === 'COMPLETED' ? 'bg-green-100 text-green-600' : 
                    phase === 'SWITCHOVER' ? 'bg-red-100 text-red-600' :
                    phase === 'IDLE' ? 'bg-gray-100 text-gray-500' :
                    'bg-blue-100 text-blue-600'
                }`}>
                    {phase === 'COMPLETED' ? <CheckCircle size={28}/> : 
                     phase === 'SWITCHOVER' ? <Zap size={28}/> :
                     phase === 'IDLE' ? <Info size={28}/> :
                     <Activity size={28} className="animate-spin"/>}
                </div>
                <div>
                    <h2 className={`text-lg font-bold mb-1 ${
                         phase === 'COMPLETED' ? 'text-green-700' : 
                         phase === 'SWITCHOVER' ? 'text-red-700' :
                         'text-blue-800'
                    }`}>
                        {statusTitle}
                    </h2>
                    <p className="text-base text-gray-600 leading-relaxed">
                        {statusMessage}
                    </p>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: LOGS HISTÓRICOS */}
        <div className="col-span-12 lg:col-span-4 flex flex-col h-full">
            <div className="bg-[#1e1e1e] rounded-lg shadow-lg border border-gray-700 flex flex-col h-[600px] font-mono text-xs overflow-hidden">
                <div className="flex justify-between items-center bg-[#252526] p-3 border-b border-gray-700">
                    <span className="font-bold text-gray-400 flex items-center gap-2"><FileText size={14}/> vmkernel.log</span>
                    <span className="flex items-center gap-1 text-[10px] text-green-500"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> LIVE</span>
                </div>
                {/* LOGS: INVERTIDOS (El nuevo arriba) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-[#1e1e1e]">
                    {logs.length === 0 && <span className="text-gray-600 italic">Esperando inicio de operación...</span>}
                    {logs.map((l, i) => (
                        <div key={i} className="text-[#a6e22e] leading-snug break-words border-l-2 border-[#a6e22e] pl-3 py-0.5 animate-in slide-in-from-top-2 duration-300">
                            <span className="text-[#569cd6] block text-[10px] mb-0.5 opacity-70">
                                {new Date().toLocaleTimeString()}
                            </span>
                            {l.replace('> ', '')}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Info Card */}
            <div className="mt-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-xs text-gray-600 space-y-2">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-bold">ID Tarea:</span> <span className="font-mono text-gray-800">vm-803-mig-01</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-bold">Tipo:</span> <span className="font-mono text-gray-800">Compute vMotion</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold">EVC Mode:</span> <span className="font-mono text-gray-800">Intel Cascade Lake</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  return viewMode === 'VCENTER_UI' ? renderVCenter() : renderInfrastructure();
};

export default VMotionSimulation;
