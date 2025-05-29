import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import ServiceForm from "./CreateForm";
import ServiceCard from "./ServiceCard";
import axiosInstance from "../../config/axios";

const allowedTitles = ["Manufactures", "Branding", "Digital Marketing"];

function ServiceLayout() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editService, setEditService] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const refreshServiceList = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/service/get-all-services");
      const filtered = response.data.data.filter(service =>
        allowedTitles.includes(service.title)
      );
      setServices(filtered);

      // Auto-open "Manufactures" service
      const defaultService = filtered.find(service => service.title === "Manufactures");
      if (defaultService) {
        setEditService(defaultService);
        setIsDrawerOpen(true);
      }
    } catch (err) {
      setError("Failed to load services");
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshServiceList();
  }, [refreshServiceList]);

  const filteredServices = services.filter(service =>
    service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectService = (service) => {
    setEditService(service);
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-content mb-1">Manage Services</h1>
          <p>Total Editable Services: {filteredServices.length}</p>
        </div>

    </div>
    </div>
  );
}

export default ServiceLayout;
