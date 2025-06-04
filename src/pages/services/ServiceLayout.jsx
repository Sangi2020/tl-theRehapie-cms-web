import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axiosInstance from "../../config/axios";
import { toast } from 'react-toastify';

const allowedTitles = [
  "Manufactures",
  "Distributors",
  "Healthcare  Providers",
];

function ServiceLayout() {
  const [editService, setEditService] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("Manufactures");
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    taglineDescription: "",
    content: "",
    image: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const fetchServiceByTitle = async (title) => {
    try {
      const response = await axiosInstance.get(`/service/get-service-by-title/${title}`);
      return response.data.data;
    } catch (err) {
      console.error(`Error fetching service "${title}":`, err);
      return null;
    }
  };

  useEffect(() => {
    const loadSelectedService = async () => {
      const details = await fetchServiceByTitle(selectedTitle);
      if (details) {
        setEditService(details);
        setFormData({
          title: details.title || "",
          tagline: details.tagline || "",
          taglineDescription: details.taglineDescription || "",
          content: details.content || "",
          image: details.image || "",
        });
        setFormErrors({});
      }
    };
    loadSelectedService();
  }, [selectedTitle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContentChange = (value) => {
    setFormData(prev => ({
      ...prev,
      content: value,
    }));
  };

  const handleSelectService = (title) => {
    setSelectedTitle(title);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.tagline.trim()) errors.tagline = "Tagline is required.";
    if (!formData.taglineDescription.trim()) errors.taglineDescription = "Tagline description is required.";
    if (!formData.content || formData.content === "<p><br></p>") errors.content = "Content cannot be empty.";
    if (!formData.image) errors.image = "Image is required.";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setUploading(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append("title", formData.title);
      dataToSend.append("tagline", formData.tagline);
      dataToSend.append("taglineDescription", formData.taglineDescription);
      dataToSend.append("content", formData.content);
      if (formData.image instanceof File) {
        dataToSend.append("image", formData.image);
      }
      dataToSend.append("servicePoints", JSON.stringify([]));

      const response = await axiosInstance.post(
        "/service/create-or-update-service",
        dataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error("Failed to update service");
      }
    } catch (error) {
      console.error("Failed to update service:", error);
      toast.error("An error occurred during service update.");
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
      }));
    }
  };

  useEffect(() => {
    let objectUrl;
    if (formData.image instanceof File) {
      objectUrl = URL.createObjectURL(formData.image);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [formData.image]);

  return (
    <div className="w-full p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <label className="block text-sm font-bold text-primary mb-2">Select Service</label>
        <select
          value={selectedTitle}
          onChange={(e) => handleSelectService(e.target.value)}
          className="select select-bordered w-full max-w-xs bg-base-100 text-neutral-content border-stroke"
        >
          {allowedTitles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
      </div>

      {editService && (
        <form onSubmit={handleSubmit} className="space-y-6 p-8 rounded-xl bg-base-100 shadow-lg border border-stroke">
          <div>
            <label className="block text-sm font-bold text-neutral-content mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input input-bordered w-full bg-base-200 text-neutral-content"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-content mb-1">Tagline</label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              className="input input-bordered w-full bg-base-200 text-neutral-content"
            />
            {formErrors.tagline && <p className="text-error text-sm mt-1">{formErrors.tagline}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-content mb-1">Tagline Description</label>
            <input
              type="text"
              name="taglineDescription"
              value={formData.taglineDescription}
              onChange={handleChange}
              className="input input-bordered w-full bg-base-200 text-neutral-content"
            />
            {formErrors.taglineDescription && <p className="text-error text-sm mt-1">{formErrors.taglineDescription}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-content mb-1">Content</label>
            <ReactQuill
              value={formData.content}
              onChange={handleContentChange}
              theme="snow"
              className="bg-white text-neutral-content"
            />
            {formErrors.content && <p className="text-error text-sm mt-1">{formErrors.content}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-content mb-1">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input file-input-bordered w-full max-w-xs bg-base-200 text-neutral-content"
            />
            {formErrors.image && <p className="text-error text-sm mt-1">{formErrors.image}</p>}
            {formData.image && (
              <img
                src={
                  formData.image instanceof File
                    ? URL.createObjectURL(formData.image)
                    : formData.image
                }
                alt="Service"
                className="mt-2 max-w-xs rounded-lg border border-stroke"
              />
            )}
          </div>

          <button type="submit" className="btn btn-primary px-6" disabled={uploading}>
            {uploading ? "Updating..." : "Update Service"}
          </button>
        </form>
      )}
    </div>
  );
}

export default ServiceLayout;
