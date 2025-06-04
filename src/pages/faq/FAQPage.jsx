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
  const [pageFaqs, setPageFaqs] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editFAQ, setEditFAQ] = useState(null);
  const [mode, setMode] = useState("add");
  const [faqToDelete, setFaqToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const refreshFAQList = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching FAQs...");

      const response = await axiosInstance.get('/qna/get-faqs');
      console.log("API Response:", response.data);

      const result = response.data;
      if (result.success && result.data) {
        console.log("FAQs received:", result.data);
        setFaqs(result.data);


        const homeFilteredFaqs = result.data
          .filter(faq => faq.isHomeFaq)
          .sort((a, b) => (a.homeOrder || 0) - (b.homeOrder || 0));

        const pageFilteredFaqs = result.data
          .filter(faq => !faq.isHomeFaq)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        console.log("Home FAQs filtered:", homeFilteredFaqs);
        console.log("Page FAQs filtered:", pageFilteredFaqs);
        setHomeFaqs(homeFilteredFaqs);
        setPageFaqs(pageFilteredFaqs);
      } else {
        console.error("API returned unsuccessful response:", result);
        toast.error('Failed to load FAQs - Invalid response');
        setFaqs([]);
        setHomeFaqs([]);
        setPageFaqs([]);
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      console.error('Error details:', err.response?.data);
      toast.error(`Failed to load FAQs: ${err.response?.data?.message || err.message}`);
      setFaqs([]);
      setHomeFaqs([]);
      setPageFaqs([]);
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
        setPageFaqs(pageFaqs.filter(faq => faq.id !== id));
        setFaqToDelete(null);


        setTimeout(() => refreshFAQList(), 100);
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


    if (activeTab === "all") return;

    let currentFaqs, setCurrentFaqs, orderField;

    if (activeTab === "home") {
      currentFaqs = homeFaqs;
      setCurrentFaqs = setHomeFaqs;
      orderField = 'homeOrder';
    } else if (activeTab === "page") {
      currentFaqs = pageFaqs;
      setCurrentFaqs = setPageFaqs;
      orderField = 'order';
    } else {
      return;
    }

    const reorderedFAQs = Array.from(currentFaqs);
    const [removed] = reorderedFAQs.splice(source.index, 1);
    reorderedFAQs.splice(destination.index, 0, removed);

    const updatedFAQs = reorderedFAQs.map((faq, index) => ({
      ...faq,
      [orderField]: index + 1,
    }));

    setCurrentFaqs(updatedFAQs);


    const updatedMainFaqs = faqs.map(faq => {
      const updatedFaq = updatedFAQs.find(updated => updated.id === faq.id);
      return updatedFaq || faq;
    });
    setFaqs(updatedMainFaqs);

    try {
      for (const faq of updatedFAQs) {
        const updateData = {
          ...faq,
          [orderField]: faq[orderField],
        };

        await axiosInstance.put(`/qna/update-faq/${faq.id}`, updateData);
      }
      toast.success(`${activeTab === 'home' ? 'Home' : 'Page'} FAQ order updated successfully`);
    } catch (err) {
      console.error('Error updating FAQ order:', err);
      toast.error('Failed to update FAQ order');
      refreshFAQList();
    }
  };

  const renderFAQItem = (faq, index) => {
    const isDraggable = activeTab !== "all";
    const orderValue = activeTab === "home" ? faq.homeOrder : faq.order;

    const content = (
      <div className="bg-base-200 p-4 rounded-lg">

        <div className="block sm:hidden">
          <div className="flex flex-col space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-accent break-words leading-tight">
                    {faq.question}
                  </h3>
                  {faq.isHomeFaq && (
                    <div className="badge badge-primary gap-1 flex-shrink-0">
                      <Home className="w-3 h-3" />
                      <span className="text-xs">Home FAQ</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-base-content text-sm leading-relaxed break-words">
              {faq.answer}
            </p>
            <div className="flex items-center justify-between">

              {activeTab !== "all" && (
                <span className="text-xs opacity-70">
                  Order: {orderValue || 'N/A'}
                </span>
              )}
              <div className="flex items-center space-x-2">
                <button
                  className="btn btn-sm btn-square btn-ghost"
                  onClick={() => handleEditFAQ(faq)}
                >
                  <Pencil className="w-4 h-4 text-success" />
                </button>
                <button
                  className="btn btn-sm btn-square text-white btn-error"
                  onClick={() => setFaqToDelete(faq.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0 select-none">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-accent break-words leading-tight">
                {faq.question}
              </h3>
              {faq.isHomeFaq && (
                <div className="badge badge-primary gap-1 flex-shrink-0">
                  <Home className="w-3 h-3" />
                  Home FAQ
                </div>
              )}
            </div>
            <p className="text-base-content leading-relaxed break-words mb-2">
              {faq.answer}
            </p>

            {activeTab !== "all" && (
              <span className="text-sm opacity-70">
                Order: {orderValue || 'N/A'}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
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
      </div>
    );

    if (isDraggable) {
      return (
        <Draggable key={faq.id} draggableId={faq.id.toString()} index={index}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              {content}
            </div>
          )}
        </Draggable>
      );
    }

    return <div key={faq.id}>{content}</div>;
  };

  const getCurrentFaqs = () => {
    if (activeTab === "home") return homeFaqs;
    if (activeTab === "page") return pageFaqs;
    return faqs;
  };

  const currentFaqs = getCurrentFaqs();

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">Loading FAQs...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative px-4 sm:px-6 lg:px-8">
      <div className="drawer drawer-end">
        <input
          id="faq-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isDrawerOpen}
          onChange={() => setIsDrawerOpen(!isDrawerOpen)}
        />
        <div className="drawer-content">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-between items-start sm:items-center mb-8">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-content">FAQ's</h1>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                <p>Total FAQ's: {faqs.length}</p>
                <p>Home FAQ's: {homeFaqs.length}/4</p>
                <p>Page FAQ's: {pageFaqs.length}</p>
              </div>
            </div>
            <button
              className="btn btn-primary gap-2 w-full sm:w-auto"
              onClick={handleAddNewFAQ}
            >
              <Plus className="w-5 h-5" />
              Add FAQ
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="tabs tabs-boxed mb-6 w-full overflow-x-auto">
            <button
              className={`tab flex-1 sm:flex-none ${activeTab === "all" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <span className="hidden sm:inline">All FAQs</span>
              <span className="sm:hidden">All</span>
              <span className="ml-1">({faqs.length})</span>
            </button>
            <button
              className={`tab flex-1 sm:flex-none ${activeTab === "home" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("home")}
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Home FAQs</span>
              <span className="sm:hidden">Home</span>
              <span className="ml-1">({homeFaqs.length})</span>
            </button>
            <button
              className={`tab flex-1 sm:flex-none ${activeTab === "page" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("page")}
            >
              <span className="hidden sm:inline">Page FAQs</span>
              <span className="sm:hidden">Page</span>
              <span className="ml-1">({pageFaqs.length})</span>
            </button>
          </div>

          {/* FAQ List */}
          {currentFaqs.length > 0 ? (
            activeTab === "all" ? (

              <div className="mx-auto space-y-4 max-w-full">
                {currentFaqs.map((faq, index) => renderFAQItem(faq, index))}
              </div>
            ) : (
              // DragDropContext for Home and Page tabs
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="faq-list">
                  {(provided) => (
                    <div
                      className="mx-auto space-y-4 max-w-full"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {currentFaqs.map((faq, index) => renderFAQItem(faq, index))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )
          ) : (
            <div className="w-full h-96 flex justify-center items-center">
              <div className="text-center px-4">
                <p className="text-lg mb-2">
                  {activeTab === "home"
                    ? "No Home FAQs available"
                    : activeTab === "page"
                      ? "No Page FAQs available"
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

        <div className="drawer-side z-50">
          <label htmlFor="faq-drawer" className="drawer-overlay"></label>
          <div className="p-4 w-full sm:w-[90%] md:w-[60%] lg:w-[40%] max-w-2xl overflow-y-auto bg-base-100 h-[60vh] sm:h-[50vh] text-base-content absolute bottom-4 right-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">
              {mode === "edit" ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>
            <FAQForm
              onFAQCreated={refreshFAQList}
              initialData={editFAQ}
              mode={mode}
              faqs={faqs}
              homeFaqs={homeFaqs}
              pageFaqs={pageFaqs}
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