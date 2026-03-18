import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleSheetsService } from './services/googleSheets';
import { Client, OrderLog } from './types';
import DashboardView from './components/DashboardView';
import ClientList from './components/ClientList';
import FollowUpModal from './components/FollowUpModal';
import AddClientModal from './components/AddClientModal';
import EditClientModal from './components/EditClientModal';
import ReportView from './components/ReportView';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';



// Wrapper ensuring Layout and Props
const ProtectedRoutes: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await GoogleSheetsService.fetchClients(user || undefined);
      
      // Filter out the Google Sheet header row if it gets returned as data
      const safeClients = Array.isArray(data?.clients) 
        ? data.clients.filter(c => c.id !== "ID" && c.clientName !== "CLIENT NAME") 
        : [];
      
      setClients(safeClients);
      setLogs(Array.isArray(data?.logs) ? data.logs : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleUpdateClient = async (updatedData: Client) => {
    try {
      // Optimistically update the UI to prevent user from thinking the save failed and trying again
      setClients(prev => prev.map(c => c.id === updatedData.id ? { 
        ...c, 
        nextFollowUpDate: updatedData.nextFollowUpDate,
        orderStatus: updatedData.orderStatus,
        remark: updatedData.remark
      } : c));
      setSelectedClient(null);

      await GoogleSheetsService.updateClient(updatedData);
      // Give Google Scripts 3 seconds to fully commit before re-fetching
      setTimeout(() => fetchData(), 3000);
    } catch (err: any) {
      alert("Error saving log: " + err.message);
      fetchData(); // Reset on error
    }
  };

  const handleAddClient = async (newClient: Partial<Client>) => {
    try {
      await GoogleSheetsService.addClient(newClient);
      setTimeout(() => fetchData(), 1000);
      setIsAddingClient(false);
    } catch (err: any) {
      alert("Error adding client: " + err.message);
    }
  };

  const handleEditClient = async (updatedClient: Client) => {
    try {
      await GoogleSheetsService.editClientBasic(updatedClient);
      setTimeout(() => fetchData(), 1000);
      setEditingClient(null);
    } catch (err: any) {
      alert("Error editing client: " + err.message);
    }
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div></div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardView clients={clients} logs={logs} />} />
          <Route 
            path="/clients" 
            element={
              <ClientList 
                clients={clients} 
                onSelectClient={setSelectedClient} 
                onAddNewClient={() => setIsAddingClient(true)} 
                onEditClient={setEditingClient}
                loading={loading} 
              />
            } 
          />
          <Route 
            path="/report" 
            element={
              <ReportView 
                logs={logs} 
                uniqueCrms={Array.from(new Set(clients.map(c => c.crmName).filter(Boolean))).sort()} 
              />
            } 
          />
        </Route>
      </Routes>
      {selectedClient && (
        <FollowUpModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onSave={handleUpdateClient}
        />
      )}
      {isAddingClient && (
        <AddClientModal
          uniqueCrms={Array.from(new Set(clients.map(c => c.crmName).filter(Boolean))).sort()}
          onClose={() => setIsAddingClient(false)}
          onSave={handleAddClient}
        />
      )}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          uniqueCrms={Array.from(new Set(clients.map(c => c.crmName).filter(Boolean))).sort()}
          onClose={() => setEditingClient(null)}
          onSave={handleEditClient}
        />
      )}
    </>
  );
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
