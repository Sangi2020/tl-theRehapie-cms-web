import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axiosInstance from "../../config/axios";
import { toast } from "react-toastify";

const allowedTitles = ["Manufactures", "Distributors", "Healthcare  Providers"];

function ServiceLayout() {
  const [theme, setTheme] = useState("light");
  const quillRef = useRef(null);

  const [editService, setEditService] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("Healthcare  Providers");
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    taglineDescription: "",
    content: "",
    image: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTheme(localStorage.getItem("theme") || "light");
    }
  }, []);

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContentChange = (value) => {
    setFormData((prev) => ({
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

      const response = await axiosInstance.post("/service/create-or-update-service", dataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

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
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
    }
  };

  const previewImage = useMemo(() => {
    if (formData.image instanceof File) {
      return URL.createObjectURL(formData.image);
    }
    return formData.image;
  }, [formData.image]);

  useEffect(() => {
    return () => {
      if (formData.image instanceof File) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [formData.image, previewImage]);

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["blockquote", "code-block"],
      ["link"],
      ["clean"],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  const quillFormats = [
    "header",
    "bold", "italic", "underline", "strike",
    "list", "bullet", "indent",
    "link",
    "align", "color", "background", "font",
    "blockquote", "code-block",
  ];

  return (
    <div className="w-full p-6 max-w-7xl mx-auto">
                  <h1 className="text-3xl font-bold text-neutral-content">Services </h1>
                  <div>total service : {allowedTitles.length}</div>

      <div className="mb-6 flex items-center flex-wrap">
        <label className="block text-sm font-bold text-primary ">Select Service</label>
        <div className="relative">
  <div className="flex space-x-2 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-2">
    {allowedTitles.map((title) => (
      <button
        key={title}
        onClick={() => handleSelectService(title)}
        className={`whitespace-nowrap px-4 py-2 rounded-full border snap-start ${
          selectedTitle === title
            ? "bg-primary text-white border-primary"
            : "bg-base-100 text-neutral-content border-stroke"
        } transition duration-300`}
      >
        {title}
      </button>
    ))}
  </div>
</div>

      </div>

      {editService && (
        <form onSubmit={handleSubmit} className="space-y-6 p-8 rounded-xl bg-base-100 shadow-lg border border-stroke">
          {/* Title (Read-only) */}
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

          {/* Tagline */}
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

          {/* Tagline Description */}
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

          {/* Content (Quill Editor) */}
          <div>
            <label className="block text-sm font-bold text-neutral-content mb-1">Content</label>
            <div className={`quill-container ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.content}
                onChange={handleContentChange}
                modules={quillModules}
                formats={quillFormats}
                className={`custom-quill ${formErrors.content ? "quill-error" : ""}`}
                placeholder="Write your post content..."
              />
            </div>
            {formErrors.content && <p className="text-error text-sm mt-1">{formErrors.content}</p>}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-neutral-content mb-1">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input file-input-bordered w-full max-w-xs bg-base-200 text-neutral-content"
            />
            {formErrors.image && <p className="text-error text-sm mt-1">{formErrors.image}</p>}
            {previewImage && (
              <img
                src={previewImage}
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
