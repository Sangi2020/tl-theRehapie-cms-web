import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Home } from 'lucide-react';
import axiosInstance from '../../config/axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import FAQForm from './FAQForm';
import { toast } from 'react-toastify';
import DeleteConfirmModal from '../../components/ui/modal/DeleteConfirmModal';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [homeFaqs, setHomeFaqs] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editFAQ, setEditFAQ] = useState(null);
  const [mode, setMode] = useState("add");
  const [faqToDelete, setFaqToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true); // Add loading state

  const refreshFAQList = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching FAQs..."); // Debug log
      
      const response = await axiosInstance.get('/qna/get-faqs');
      console.log("API Response:", response.data); // Debug log
      
      const result = response.data;
      if (result.success && result.data) {
        console.log("FAQs received:", result.data); // Debug log
        setFaqs(result.data);
        // Separate home FAQs
        const homeFilteredFaqs = result.data.filter(faq => faq.isHomeFaq);
        console.log("Home FAQs filtered:", homeFilteredFaqs); // Debug log
        setHomeFaqs(homeFilteredFaqs);
      } else {
        console.error("API returned unsuccessful response:", result);
        toast.error('Failed to load FAQs - Invalid response');
        setFaqs([]);
        setHomeFaqs([]);
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      console.error('Error details:', err.response?.data); // More detailed error logging
      toast.error(`Failed to load FAQs: ${err.response?.data?.message || err.message}`);
      setFaqs([]);
      setHomeFaqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFAQList();
  }, [refreshFAQList]);

  const handleAddNewFAQ = () => {
    setEditFAQ(null);
    setMode("add");
    setIsDrawerOpen(true);
  };

  const handleEditFAQ = (faq) => {
    setEditFAQ(faq);
    setMode("edit");
    setIsDrawerOpen(true);
  };

  const handleDeleteFAQ = async (id) => {
    setIsDeleting(true);
    try {
      const response = await axiosInstance.delete(`/qna/delete-faq/${id}`);
      const result = response.data;
      if (result.success) {
        setFaqs(faqs.filter(faq => faq.id !== id));
        setHomeFaqs(homeFaqs.filter(faq => faq.id !== id));
        setFaqToDelete(null);
        toast.success('FAQ deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      toast.error('Failed to delete FAQ');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination } = result;

    if (!destination) return;

    const currentFaqs = activeTab === "home" ? homeFaqs : faqs;
    const reorderedFAQs = Array.from(currentFaqs);
    const [removed] = reorderedFAQs.splice(source.index, 1);
    reorderedFAQs.splice(destination.index, 0, removed);

    const updatedFAQs = reorderedFAQs.map((faq, index) => ({
      ...faq,
      order: index + 1,
    }));

    if (activeTab === "home") {
      setHomeFaqs(updatedFAQs);
    } else {
      setFaqs(updatedFAQs);
    }

    try {
      for (const faq of updatedFAQs) {
        await axiosInstance.put(`/qna/update-faq/${faq.id}`, {
          ...faq,
          order: faq.order,
        });
      }
      toast.success('FAQ order updated successfully');
    } catch (err) {
      console.error('Error updating FAQ order:', err);
      toast.error('Failed to update FAQ order');
      // Revert the changes if API call fails
      refreshFAQList();
    }
  };

  const renderFAQItem = (faq, index) => (
    <Draggable key={faq.id} draggableId={faq.id.toString()} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-base-200 p-4 rounded-lg flex justify-between items-center"
        >
          <div className="flex-1 select-none">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xl font-bold text-accent">{faq.question}</div>
              {faq.isHomeFaq && (
                <div className="badge badge-primary gap-1">
                  <Home className="w-3 h-3" />
                  Home FAQ
                </div>
              )}
            </div>
            <p className="text-base-content">{faq.answer}</p>
            <span className="text-sm opacity-70 ml-2">Order: {faq.order}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="btn btn-sm btn-square btn-ghost"
              onClick={() => handleEditFAQ(faq)}
            >
              <Pencil className="w-6 h-6 text-success" />
            </button>
            <button
              className="btn btn-sm btn-square text-white btn-error"
              onClick={() => setFaqToDelete(faq.id)}
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );

  const currentFaqs = activeTab === "home" ? homeFaqs : faqs;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">Loading FAQs...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="drawer drawer-end">
        <input
          id="faq-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isDrawerOpen}
          onChange={() => setIsDrawerOpen(!isDrawerOpen)}
        />
        <div className="drawer-content">
          <div className="md:flex space-y-2 md:space-y-0 block justify-between items-center mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-neutral-content">FAQ's</h1>
              <div className="flex gap-4 text-sm">
                <p>Total FAQ's: {faqs.length}</p>
                <p>Home FAQ's: {homeFaqs.length}/4</p>
              </div>
            </div>
            <button
              className="btn btn-primary gap-2"
              onClick={handleAddNewFAQ}
            >
              <Plus className="w-5 h-5" />
              Add FAQ
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="tabs tabs-boxed mb-6">
            <button
              className={`tab ${activeTab === "all" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All FAQs ({faqs.length})
            </button>
            <button
              className={`tab ${activeTab === "home" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("home")}
            >
              <Home className="w-4 h-4 mr-1" />
              Home FAQs ({homeFaqs.length})
            </button>
          </div>

          {currentFaqs.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="faq-list">
                {(provided) => (
                  <div
                    className="mx-auto space-y-4"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {currentFaqs.map((faq, index) => renderFAQItem(faq, index))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="w-full h-96 flex justify-center items-center">
              <div className="text-center">
                <p className="text-lg mb-2">
                  {activeTab === "home" 
                    ? "No Home FAQs available" 
                    : "No FAQs available"
                  }
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAddNewFAQ}
                >
                  Add your first FAQ
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="drawer-side">
          <label htmlFor="faq-drawer" className="drawer-overlay"></label>
          <div className="p-4 md:w-[40%] w-full sm:w-1/2 overflow-y-scroll bg-base-100 h-[50vh] text-base-content absolute bottom-4 right-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">
              {mode === "edit" ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>
            <FAQForm
              onFAQCreated={refreshFAQList}
              initialData={editFAQ}
              mode={mode}
              faqs={faqs}
              homeFaqs={homeFaqs}
              setIsDrawerOpen={setIsDrawerOpen}
            />
          </div>
        </div>
      </div>

      {faqToDelete && (
        <DeleteConfirmModal
          isOpen={faqToDelete !== null}
          faqs={faqs}
          onClose={() => setFaqToDelete(null)}
          onConfirm={() => handleDeleteFAQ(faqToDelete)}
          title="Delete FAQ?"
          message="Are you sure you want to delete this FAQ? This action cannot be undone."
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default FAQPage;