import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axios';
import playNotificationSound from '../../utils/playNotification';

function TestimonialForm({ onTestimonialCreated, initialData, mode, setIsDrawerOpen }) {
  const [testimonial, setTestimonial] = useState({
    text: '',
    author: '',
    position: '',
    TestimonialUrl: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setTestimonial({
        text: initialData.text || '',
        author: initialData.author || '',
        position: initialData.position || '',
        TestimonialUrl: initialData.TestimonialUrl || ''
      });
    } else if (mode === "add") {
      setTestimonial({
        text: '',
        author: '',
        position: '',
        TestimonialUrl: ''
      });
    }
    // Reset errors and submission state
    setErrors({});
    setIsSubmitting(false);
  }, [mode, initialData]);

  const validateField = (name, value) => {
    switch (name) {
      case 'author':
        // Author is optional, but if provided, it should be valid
        if (!value || value.trim() === '') return null;
        return /^[a-zA-Z\s]+$/.test(value) && value.trim().length >= 2
          ? null
          : "Author name must be at least 2 characters long and contain only letters";
      case 'position':
        // Position is optional, but if provided, it should be valid
        if (!value || value.trim() === '') return null;
        return value.trim().length >= 2
          ? null
          : "Position must be at least 2 characters long";
      case 'text': {
        const wordCount = value.trim().split(/\s+/).length;
        return wordCount >= 10 && wordCount <= 110
          ? null
          : "Testimonial must be between 10 and 110 words long";
      }
      case 'TestimonialUrl':
        // URL is optional, but if provided, it should be a valid URL
        if (!value || value.trim() === '') return null;
        try {
          new URL(value);
          return null;
        } catch {
          return "Please enter a valid URL (e.g., https://example.com)";
        }
      default:
        return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate all fields
    const newErrors = {};

    const authorError = validateField('author', testimonial.author);
    if (authorError) newErrors.author = authorError;

    const positionError = validateField('position', testimonial.position);
    if (positionError) newErrors.position = positionError;

    const textError = validateField('text', testimonial.text);
    if (textError) newErrors.text = textError;

    const testimonialUrlError = validateField('TestimonialUrl', testimonial.TestimonialUrl);
    if (testimonialUrlError) newErrors.TestimonialUrl = testimonialUrlError;

    // If there are any errors, set them and prevent submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      let response;
      if (mode === "add") {
        response = await axiosInstance.post("/contents/testimonial", testimonial);
        playNotificationSound()
        toast.success("Testimonial created successfully!");
      } else if (mode === "edit" && initialData) {
        response = await axiosInstance.put(`/contents/testimonial/${initialData.id}`, testimonial);
        toast.success("Testimonial updated successfully!");
      }

      if (onTestimonialCreated) {
        onTestimonialCreated();
      }

      setTestimonial({
        text: '',
        author: '',
        position: '',
        TestimonialUrl: ''
      });
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error handling testimonial:", error);
      const errorMessage = error.response?.data?.message || "Failed to save testimonial. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Author Name
        </label>
        <input
          type="text"
          placeholder="Enter author name"
          className={`input input-bordered w-full ${errors.author ? 'input-error' : ''}`}
          value={testimonial.author}
          onChange={(e) => {
            const newAuthor = e.target.value;
            setTestimonial({ ...testimonial, author: newAuthor });

            // Validate and clear error if valid
            const authorError = validateField('author', newAuthor);
            setErrors(prev => ({
              ...prev,
              author: authorError
            }));
          }}
        />
        {errors.author && <p className="text-error text-sm mt-1">{errors.author}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Position
        </label>
        <input
          type="text"
          placeholder="Enter position"
          className={`input input-bordered w-full ${errors.position ? 'input-error' : ''}`}
          value={testimonial.position}
          onChange={(e) => {
            const newPosition = e.target.value;
            setTestimonial({ ...testimonial, position: newPosition });

            const positionError = validateField('position', newPosition);
            setErrors(prev => ({
              ...prev,
              position: positionError
            }));
          }}
        />
        {errors.position && <p className="text-error text-sm mt-1">{errors.position}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Testimonial URL
        </label>
        <input
          type="url"
          placeholder="Enter testimonial URL"
          className={`input input-bordered w-full ${errors.TestimonialUrl ? 'input-error' : ''}`}
          value={testimonial.TestimonialUrl}
          onChange={(e) => {
            const newUrl = e.target.value;
            setTestimonial({ ...testimonial, TestimonialUrl: newUrl });

            const urlError = validateField('TestimonialUrl', newUrl);
            setErrors(prev => ({
              ...prev,
              TestimonialUrl: urlError
            }));
          }}
        />
        {errors.TestimonialUrl && <p className="text-error text-sm mt-1">{errors.TestimonialUrl}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Testimonial Text <span className="text-error">*</span>
        </label>
        <textarea
          placeholder="Enter testimonial text"
          className={`textarea textarea-bordered w-full ${errors.text ? 'textarea-error' : ''}`}
          rows="4"
          value={testimonial.text}
          onChange={(e) => {
            const newText = e.target.value;
            setTestimonial({ ...testimonial, text: newText });

            // Validate and clear error if valid
            const textError = validateField('text', newText);
            setErrors(prev => ({
              ...prev,
              text: textError
            }));
          }}
        ></textarea>
        {errors.text && <p className="text-error text-sm mt-1">{errors.text}</p>}
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="loading loading-spinner"></span>
            {mode === "add" ? "Creating Testimonial..." : "Updating Testimonial..."}
          </>
        ) : (
          mode === "add" ? "Create Testimonial" : "Update Testimonial"
        )}
      </button>
    </form>
  );
}

export default TestimonialForm;