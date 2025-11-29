import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, Server, Activity, AlertTriangle, Zap, 
  Heart, Database, ShieldAlert, CheckCircle, Info, 
  FileText, Power, Monitor, Globe, Layers, ChevronRight, Box, MoreVertical 
} from 'lucide-react';

// --- TIPOS ---
type HAState = 
  | 'HEALTHY'           
  | 'FAILURE_DETECTED'  
  | 'ISOLATION_CHECK'   
  | 'FAILOVER_PLAN'     
  | 'RESTARTING'        
  | 'RECOVERED';        

type ViewMode = 'VCENTER_UI' | 'INFRASTRUCTURE';

interface VM {
  id: string;
  name: string;
  hostId: string;
  status: 'running' | 'failed' | 'booting';
  priority: 'High' | 'Medium' | 'Low';
}

interface Host {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'failed' | 'master' | 'slave';
}

const HighAvailabilitySimulation = () => {
  // --- ESTADOS GENERALES ---
  const [viewMode, setViewMode] = useState<ViewMode>('VCENTER_UI');
  
  // --- ESTADOS SIMULACIÓN ---
  const [haState, setHaState] = useState<HAState>('HEALTHY');
  const [hosts, setHosts] = useState<Host[]>([
    { id: 'h1', name: 'ESXi-01', ip: '192.168.10.5', status: 'master' },
    { id: 'h2', name: 'ESXi-02', ip: '192.168.10.6', status: 'slave' },
    { id: 'h3', name: 'ESXi-03', ip: '192.168.10.7', status: 'slave' },
  ]);

  const [vms, setVms] = useState<VM[]>([
    { id: 'vm1', name: 'AD-Server', hostId: 'h1', status: 'running', priority: 'High' },
    { id: 'vm2', name: 'SQL-DB', hostId: 'h1', status: 'running', priority: 'High' },
    { id: 'vm3', name: 'Web-App', hostId: 'h2', status: 'running', priority: 'Medium' },
    { id: 'vm4', name: 'File-Srv', hostId: 'h2', status: 'running', priority: 'Low' },
    { id: 'vm5', name: 'Print-Srv', hostId: 'h3', status: 'running', priority: 'Low' },
    { id: 'vm6', name: 'Dev-Box', hostId: 'h3', status: 'running', priority: 'Low' },
  ]);

  const [logs, setLogs] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("Clúster protegido. Agentes FDM activos.");
  const [heartbeatActive, setHeartbeatActive] = useState(true);
  
  // UI States
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Inicialización
  useEffect(() => {
    // Scroll logs
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- LÓGICA DE SIMULACIÓN HA ---

  const triggerFailureFromUI = () => {
    setContextMenu(null);
    setViewMode('INFRASTRUCTURE');
    // Pequeño delay para que la transición de vista se sienta natural antes de empezar el caos
    setTimeout(() => simulateFailureSequence(), 1500);
  };

  const simulateFailureSequence = async () => {
    // 0. ESTADO INICIAL EN LOGS
    addLog("--- INICIO DE INCIDENTE ---");
    addLog("Monitor: Host ESXi-01 dejó de responder al ping.");
    
    // 1. FALLO FÍSICO
    await delay(5000); // Tiempo para leer
    setHaState('FAILURE_DETECTED');
    setHeartbeatActive(false); 
    
    setHosts(prev => prev.map(h => h.id === 'h1' ? { ...h, status: 'failed' } : h));
    setVms(prev => prev.map(vm => vm.hostId === 'h1' ? { ...vm, status: 'failed' } : vm));

    setStatusMessage("¡ALERTA CRÍTICA! Se ha perdido contacto total con el Host ESXi-01. Las máquinas virtuales en ese host se han apagado abruptamente.");
    addLog("FDM Master: ¡Pérdida de Heartbeat de red detectada en ESXi-01!");
    addLog("Cluster: Estado degradado. Iniciando protocolos de emergencia.");
    
    await delay(9000); // 9 SEGUNDOS

    // 2. VALIDACIÓN DATASTORE
    setHaState('ISOLATION_CHECK');
    setStatusMessage("El Host Maestro verifica el almacenamiento compartido (Datastore Heartbeat) para confirmar si el host realmente falló o si es solo un problema de cable de red.");
    addLog("HA Master: Comprobando 'Datastore Heartbeat'...");
    addLog("Storage: No se detecta actividad de disco del Host 01.");
    
    await delay(9000); // 9 SEGUNDOS

    // 3. ELECCIÓN MAESTRO & PLAN
    setHosts(prev => prev.map(h => h.id === 'h2' ? { ...h, status: 'master' } : h));
    addLog("FDM Election: ESXi-02 asume el rol de NUEVO MAESTRO.");
    setHaState('FAILOVER_PLAN');
    setStatusMessage("Confirmado: El Host 01 está muerto. El nuevo Maestro (ESXi-02) consulta la lista de VMs afectadas y decide dónde reiniciarlas según la capacidad disponible.");
    addLog("HA Master: Calculando plan de reinicio para VMs afectadas...");
    addLog("Plan: AD-Server (High Priority) -> Host 02");
    addLog("Plan: SQL-DB (High Priority) -> Host 03");
    
    await delay(8000); // 8 SEGUNDOS

    // 4. REINICIO (HA Restart)
    setHaState('RESTARTING');
    setStatusMessage("¡Restablecimiento! VMware HA ordena el encendido inmediato de las VMs en los hosts sobrevivientes. Las VMs de prioridad Alta inician primero.");
    
    setVms(prev => prev.map(vm => {
      if (vm.id === 'vm1') return { ...vm, hostId: 'h2', status: 'booting' }; 
      if (vm.id === 'vm2') return { ...vm, hostId: 'h3', status: 'booting' }; 
      return vm;
    }));
    
    addLog("Task: Power On 'AD-Server' en ESXi-02... Éxito.");
    addLog("Task: Power On 'SQL-DB' en ESXi-03... Éxito.");

    await delay(9000); // 9 SEGUNDOS

    // 5. RECUPERADO
    setHaState('RECOVERED');
    setVms(prev => prev.map(vm => vm.status === 'booting' ? { ...vm, status: 'running' } : vm));
    setStatusMessage("Recuperación completada. Los servicios se han restablecido automáticamente sin intervención humana.");
    addLog("HA: Todas las VMs protegidas están en línea nuevamente.");
    addLog("--- FIN DE INCIDENTE ---");
  };

  const resetSimulation = () => {
    setHaState('HEALTHY');
    setViewMode('VCENTER_UI'); // Volver a la UI principal
    setHosts([
      { id: 'h1', name: 'ESXi-01', ip: '192.168.10.5', status: 'master' },
      { id: 'h2', name: 'ESXi-02', ip: '192.168.10.6', status: 'slave' },
      { id: 'h3', name: 'ESXi-03', ip: '192.168.10.7', status: 'slave' },
    ]);
    setVms([
      { id: 'vm1', name: 'AD-Server', hostId: 'h1', status: 'running', priority: 'High' },
      { id: 'vm2', name: 'SQL-DB', hostId: 'h1', status: 'running', priority: 'High' },
      { id: 'vm3', name: 'Web-App', hostId: 'h2', status: 'running', priority: 'Medium' },
      { id: 'vm4', name: 'File-Srv', hostId: 'h2', status: 'running', priority: 'Low' },
      { id: 'vm5', name: 'Print-Srv', hostId: 'h3', status: 'running', priority: 'Low' },
      { id: 'vm6', name: 'Dev-Box', hostId: 'h3', status: 'running', priority: 'Low' },
    ]);
    setHeartbeatActive(true);
    setLogs([]);
    setStatusMessage("Clúster protegido. Agentes FDM activos.");
  };

  // --- RENDERIZADORES VCENTER ---

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const renderVCenter = () => (
    <div className="bg-[#f5f7fa] min-h-screen flex flex-col font-sans text-[#2d3640]">
      {/* Header vCenter */}
      <div className="bg-[#1e2730] text-white h-[48px] flex items-center justify-between px-4 border-b border-[#444]">
        <div className="flex items-center gap-6">
            <div className="font-semibold text-lg flex items-center gap-2">
               <span className="font-bold">VMware</span> vSphere Client
            </div>
            <div className="text-gray-400 text-sm border-l border-gray-600 pl-4">Menu</div>
        </div>
        <div className="text-xs text-gray-300">administrator@riveritatech.local</div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[280px] bg-white border-r border-gray-300 flex flex-col hidden md:flex">
            <div className="p-3 border-b border-gray-200 bg-[#f1f3f5] text-[11px] font-bold text-gray-600 uppercase">Navigator</div>
            <div className="p-2 overflow-y-auto flex-1 text-[13px] text-[#2d3640]">
                <div className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#e1f0fa] cursor-pointer">
                    <Globe size={14} className="text-gray-500"/> Riveritatech
                </div>
                <div className="ml-4 flex items-center gap-1.5 py-1 px-2 hover:bg-[#e1f0fa] cursor-pointer">
                    <Layers size={14} className="text-gray-500"/> ClusterLab
                </div>
                
                {/* Host 1 (El que fallará) */}
                <div 
                    className="ml-8 flex items-center gap-1.5 py-1 px-2 bg-[#e1f0fa] border-l-[3px] border-[#007cbb] text-[#2d3640] font-medium cursor-context-menu"
                    onContextMenu={handleRightClick}
                >
                    <Server size={14} className="text-[#007cbb]"/> ESXi-01 (192.168.10.5)
                </div>
                <div className="ml-12 flex items-center gap-1.5 py-0.5 px-2 text-gray-600"><Monitor size={12}/> AD-Server</div>
                <div className="ml-12 flex items-center gap-1.5 py-0.5 px-2 text-gray-600"><Monitor size={12}/> SQL-DB</div>

                {/* Otros Hosts CON VMs VISIBLES */}
                <div className="ml-8 flex items-center gap-1.5 py-1 px-2 hover:bg-[#e1f0fa] cursor-pointer text-gray-600 mt-2">
                    <Server size={14}/> ESXi-02 (192.168.10.6)
                </div>
                <div className="ml-12 flex items-center gap-1.5 py-0.5 px-2 text-gray-600"><Monitor size={12}/> Web-App</div>
                <div className="ml-12 flex items-center gap-1.5 py-0.5 px-2 text-gray-600"><Monitor size={12}/> File-Srv</div>

                <div className="ml-8 flex items-center gap-1.5 py-1 px-2 hover:bg-[#e1f0fa] cursor-pointer text-gray-600 mt-2">
                    <Server size={14}/> ESXi-03 (192.168.10.7)
                </div>
                <div className="ml-12 flex items-center gap-1.5 py-0.5 px-2 text-gray-600"><Monitor size={12}/> Print-Srv</div>
                <div className="ml-12 flex items-center gap-1.5 py-0.5 px-2 text-gray-600"><Monitor size={12}/> Dev-Box</div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-[#f5f7fa] relative" onClick={() => setContextMenu(null)}>
            
            {/* Host Header */}
            <div className="bg-white px-6 pt-5 pb-0 border-b border-gray-300 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                    <div className="bg-[#007cbb] p-2 rounded-sm text-white shadow-sm">
                        <Server size={40} strokeWidth={1.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-normal text-[#2d3640]">ESXi-01 (192.168.10.5)</h1>
                            <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded border border-green-200">Connected</span>
                            <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-300">Maintenance Mode: No</span>
                        </div>
                        <div className="flex gap-6 text-[11px] text-gray-600 mt-1">
                            <span className="flex items-center gap-1">Manufacturer: Dell Inc.</span>
                            <span className="flex items-center gap-1">Model: PowerEdge R750</span>
                            <span className="flex items-center gap-1">ESXi Version: 8.0.3</span>
                        </div>
                    </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-8 text-[13px] font-medium text-gray-600">
                    <div className="pb-3 border-b-[3px] border-[#007cbb] text-[#007cbb]">Summary</div>
                    <div className="pb-3 hover:border-gray-300 border-b-[3px] border-transparent cursor-pointer">Monitor</div>
                    <div className="pb-3 hover:border-gray-300 border-b-[3px] border-transparent cursor-pointer">Configure</div>
                    <div className="pb-3 hover:border-gray-300 border-b-[3px] border-transparent cursor-pointer">VMs</div>
                </div>
            </div>

            {/* Summary Body */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-300 rounded-sm p-4 shadow-sm h-64">
                        <h3 className="text-[11px] font-bold text-gray-700 uppercase mb-4 border-b border-gray-100 pb-2">Hardware</h3>
                        <div className="space-y-3 text-[13px]">
                            <div className="flex justify-between"><span className="text-gray-500">Processor:</span> <span>Intel(R) Xeon(R) Gold 6348</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Logical Processors:</span> <span>56</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Memory:</span> <span>512 GB</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Storage:</span> <span>Local + SAN FC</span></div>
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-sm p-8 flex flex-col items-center justify-center text-center shadow-sm h-64">
                        <div className="bg-white p-4 rounded-full mb-3 shadow-md">
                            <Zap size={32} className="text-yellow-500" />
                        </div>
                        <h3 className="text-lg font-bold text-[#2d3640]">Panel de Pruebas HA</h3>
                        <p className="text-sm text-gray-600 mt-2 max-w-xs">
                            Para iniciar el laboratorio, haz <strong>Clic Derecho</strong> en el host <strong>ESXi-01</strong> (en la barra lateral izquierda) y simula un fallo eléctrico.
                        </p>
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div 
                    className="absolute bg-white shadow-xl border border-gray-300 py-1 w-64 z-50 text-[13px] text-[#2d3640]"
                    style={{ top: contextMenu.y, left: contextMenu.x }} 
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Connection</div>
                    <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Maintenance Mode</div>
                    <div className="h-px bg-gray-200 my-1"></div>
                    <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer flex items-center justify-between group">
                        Power <ChevronRight size={14}/>
                    </div>
                    <div 
                        className="px-4 py-1.5 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white cursor-pointer flex items-center gap-2 font-bold"
                        onClick={triggerFailureFromUI}
                    >
                        <Zap size={14}/> Simular Fallo de Energía
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );

  // VISTA INFRAESTRUCTURA (BACKEND)
  const renderInfrastructure = () => (
    <div className="min-h-screen bg-[#f0f2f5] p-6 font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto w-full mb-6 flex justify-between items-center bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase border border-blue-100">Riveritatech Lab</span>
             <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded uppercase border border-green-100">vSphere HA</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldAlert className="text-red-600" />
            Simulador de Alta Disponibilidad (Backend)
          </h1>
        </div>

        {haState === 'RECOVERED' && (
             <button 
                onClick={resetSimulation}
                className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md font-bold shadow-sm"
             >
                <RotateCcw size={18} /> Reiniciar Laboratorio
             </button>
        )}
        {haState !== 'RECOVERED' && haState !== 'HEALTHY' && (
             <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded border border-red-100 animate-pulse font-bold">
                <Activity size={18} className="animate-spin"/> PROCESO HA EN CURSO...
             </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- COLUMNA IZQUIERDA: RACKS --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PANEL ESTADO */}
          <div className={`p-6 rounded-lg border-l-4 shadow-sm transition-all duration-500 bg-white ${
             haState === 'HEALTHY' ? 'border-green-500' :
             haState === 'RECOVERED' ? 'border-blue-500' :
             'border-red-500'
          }`}>
             <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
               {haState === 'HEALTHY' && <span className="text-green-600 flex items-center gap-2"><CheckCircle size={24}/> Clúster Saludable</span>}
               {haState === 'FAILURE_DETECTED' && <span className="text-red-600 flex items-center gap-2"><AlertTriangle size={24}/> Fallo Detectado</span>}
               {haState === 'ISOLATION_CHECK' && <span className="text-orange-600 flex items-center gap-2"><Database size={24}/> Comprobando Discos</span>}
               {haState === 'RESTARTING' && <span className="text-blue-600 flex items-center gap-2"><Zap size={24}/> Reiniciando VMs</span>}
               {haState === 'RECOVERED' && <span className="text-blue-600 flex items-center gap-2"><CheckCircle size={24}/> Recuperación Completa</span>}
             </h3>
             <p className="text-gray-600 text-base leading-relaxed">
               {statusMessage}
             </p>
          </div>

          {/* RACK DE SERVIDORES */}
          <div className="bg-[#e2e8f0] p-8 rounded-xl border border-gray-300 relative min-h-[450px]">
             {/* Heartbeat Lines */}
             {heartbeatActive && (
               <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                  <svg className="w-full h-full opacity-30">
                     <path d="M 200 220 Q 400 50 600 220" fill="none" stroke="green" strokeWidth="3" strokeDasharray="10,5" className="animate-pulse"/>
                     <path d="M 600 220 Q 800 350 950 220" fill="none" stroke="green" strokeWidth="3" strokeDasharray="10,5" className="animate-pulse"/>
                  </svg>
               </div>
             )}

             <div className="grid grid-cols-3 gap-6 relative z-10">
               {hosts.map(host => {
                 const hostVms = vms.filter(vm => vm.hostId === host.id);
                 const isFailed = host.status === 'failed';
                 return (
                    <div key={host.id} className={`relative flex flex-col p-4 rounded-lg border-2 transition-all duration-500 min-h-[300px] bg-white shadow-xl ${
                        isFailed ? 'border-red-500 grayscale opacity-80' : 'border-gray-300'
                    }`}>
                        {/* Host Header */}
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                                <Server size={24} className={isFailed ? "text-red-500" : "text-gray-600"} />
                                <div>
                                    <div className="font-bold text-sm text-gray-800">{host.name}</div>
                                    <div className="text-[10px] text-gray-500">{host.ip}</div>
                                </div>
                            </div>
                            {host.status === 'master' && !isFailed && <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">MASTER</span>}
                            {isFailed && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold animate-ping">FAIL</span>}
                        </div>

                        {/* VMs List */}
                        <div className="flex-1 space-y-2">
                            {hostVms.map(vm => (
                                <div key={vm.id} className={`p-2 rounded border flex justify-between items-center ${
                                    vm.status === 'running' ? 'bg-green-50 border-green-200' :
                                    vm.status === 'failed' ? 'bg-gray-200 border-gray-300 text-gray-400' :
                                    'bg-blue-50 border-blue-300 animate-pulse'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <Monitor size={16} />
                                        <span className="text-xs font-bold">{vm.name}</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${vm.status === 'running' ? 'bg-green-500' : vm.status === 'failed' ? 'bg-gray-400' : 'bg-blue-500'}`}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                 );
               })}
             </div>

             <div className="mt-8 flex justify-center">
                <div className="bg-[#2d3748] text-white px-8 py-3 rounded-full flex items-center gap-3 shadow-lg border-t-4 border-amber-500">
                   <Database size={20} className="text-amber-500"/>
                   <span className="text-sm font-mono">Datastore Compartido (Heartbeat File)</span>
                </div>
             </div>
          </div>
        </div>

        {/* --- COLUMNA DERECHA: LOGS --- */}
        <div className="lg:col-span-1 h-full">
           <div className="bg-[#1e1e1e] rounded-lg shadow-lg border border-gray-700 flex flex-col h-[600px] font-mono text-xs overflow-hidden">
                <div className="flex justify-between items-center bg-[#252526] p-3 border-b border-gray-700">
                    <span className="font-bold text-gray-400 flex items-center gap-2">
                       <FileText size={14}/> fdm.log (Live)
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-green-500">
                       <div className={`w-2 h-2 rounded-full ${heartbeatActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div> 
                       {heartbeatActive ? 'ONLINE' : 'ALERT'}
                    </span>
                </div>
                
                {/* LOGS INVERTIDOS */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-[#1e1e1e]">
                    {logs.map((l, i) => (
                        <div key={i} className={`leading-snug break-words border-l-2 pl-3 py-1 animate-in slide-in-from-top-2 duration-500 ${
                           l.includes("ALERTA") ? "text-red-400 border-red-500 bg-red-900/10" :
                           l.includes("Master") ? "text-blue-300 border-blue-500" :
                           l.includes("Task") ? "text-yellow-300 border-yellow-500" :
                           "text-[#a6e22e] border-[#a6e22e]"
                        }`}>
                            {l}
                        </div>
                    ))}
                </div>
           </div>

           {/* INFO CARD EDUCATIVA */}
           <div className="mt-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                 <Info size={16} className="text-blue-600"/> Conceptos de HA:
              </h4>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                 <li><strong>FDM (Fault Domain Manager):</strong> El agente que corre en cada host para detectar fallos.</li>
                 <li><strong>Datastore Heartbeat:</strong> Si falla la red, el Maestro mira el disco para ver si el host sigue escribiendo.</li>
                 <li><strong>Restart Priority:</strong> Define el orden de encendido (AD y SQL primero).</li>
              </ul>
           </div>
        </div>

      </div>
    </div>
  );

  return viewMode === 'VCENTER_UI' ? renderVCenter() : renderInfrastructure();
};

export default HighAvailabilitySimulation;
