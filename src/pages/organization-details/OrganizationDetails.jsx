import { Inbox, X } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../../config/axios';
import playNotificationSound from '../../utils/playNotification';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Controller } from 'react-hook-form';
import { useTheme } from '../../context/ThemeContext';

const organizationSchema = yup.object().shape({
  email: yup.string()
    .required('Email is required')
    .email('Enter a valid email address')
    .max(100, 'Email must be at most 100 characters'),
  location: yup.string()
    .required('Location is required')
    .max(200, 'Location must be at most 200 characters'),
  mapUrl: yup.string()
    .required('Map URL is required')
    .url('Enter a valid URL')
    .max(500, 'Map URL must be at most 500 characters')
    .nullable(),
  phone: yup.string()
    .required('Phone number is required')
    .matches(/^\+?[0-9]{10,14}$/, 'Phone number must be 10-14 digits')
});

const OrganizationDetails = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm({
    resolver: yupResolver(organizationSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/organization/settings');
    
        const organizationData = response.data.data;        
        reset({
          email: organizationData.email || '',
          location: organizationData.location || '',
          mapUrl: organizationData.mapUrl || '',
          phone: organizationData.phone || ''
        });
        
        if (organizationData.logo) {
          setLogoPreview(organizationData.logo);
        }
        
        if (organizationData.favicon) {
          setFaviconPreview(organizationData.favicon);
        }
      } catch (error) {
        console.error('Error fetching organization details:', error);
        toast.error('Failed to load organization details');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, []); 

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo size should be less than 5MB');
        return;
      }
      setLogoPreview(URL.createObjectURL(file));
      setLogoFile(file);
    }
  };

  const handleFaviconUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Favicon size should be less than 1MB');
        return;
      }
      setFaviconPreview(URL.createObjectURL(file));
      setFaviconFile(file);
    }
  };

  const handleRemoveLogo = (e) => {
    e.stopPropagation();
    setLogoPreview(null);
    setLogoFile(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleRemoveFavicon = (e) => {
    e.stopPropagation(); // Fixed typo here from stopPropiation to stopPropagation
    setFaviconPreview(null);
    setFaviconFile(null);
    if (faviconInputRef.current) {
      faviconInputRef.current.value = '';
    }
  };

  const onSubmit = async (formData) => {
    setIsLoading(true);
    const submitData = new FormData();
  
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value === undefined ? '' : value);
    });
  
    if (logoFile) submitData.append('logo', logoFile);
    if (faviconFile) submitData.append('favicon', faviconFile);
  
    const toastId = toast.loading('Saving organization details...');
  
    try {
      const response = await axiosInstance.post('/organization/settings', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      playNotificationSound();
      toast.update(toastId, {
        render: 'Organization details saved successfully',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
  
      const updatedData = response.data.data;
      reset({
        email: updatedData.email || '',
        location: updatedData.location || '',
        mapUrl: updatedData.mapUrl || '',
        phone: updatedData.phone || '',
      });
  
      if (updatedData.logo) {
        setLogoPreview(updatedData.logo);
      }
      
      if (updatedData.favicon) {
        setFaviconPreview(updatedData.favicon);
      }
    } catch (error) {
      console.error('Error saving organization details:', error);
      toast.update(toastId, {
        render: error.response?.data?.message || 'Failed to save organization details',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const FormField = ({ 
    label, 
    name, 
    register, 
    control,
    errors, 
    type = 'text', 
    placeholder,
    mandatory = false
  }) => {
    // Get the theme from your context
    const { theme } = useTheme();
    
    const isDarkTheme = theme === "dark";
    
    // Custom dropdown styles based on theme
    const dropdownStyles = {
      backgroundColor: isDarkTheme ? '#1a1a1a' : '#fff', // Ensures full dark theme support
      color: isDarkTheme ? '#fff' : '#000',
      border: `1px solid ${isDarkTheme ? '#444' : '#ccc'}`,
    };
    // Add hover styles for dropdown items
    const dropdownItemStyles = `
  .react-tel-input .flag-dropdown:hover, 
  .react-tel-input .country-list .country:hover,
  .react-tel-input .country-list .country.highlight { 
    background-color: ${isDarkTheme ? '#444' : '#e0e0e0'} !important; 
    color: ${isDarkTheme ? '#fff' : '#000'} !important; /* Ensure visible text color */
  }
`;
    
    return (
      <div className="form-control mb-4">
        <style>{dropdownItemStyles}</style>

        <label className="label">
          <span className="label-text">
            {label} 
            {mandatory && <span className="text-error ml-1">*</span>}
          </span>
        </label>
        
        {name === "phone" ? (
          <div>
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <PhoneInput
                  country={'in'}
                  enableSearch={false}
                  disableSearchIcon={true}
                  value={field.value}
                  onChange={(phone) => field.onChange(phone)}
                  inputProps={{
                    name: field.name,
                    placeholder: placeholder || 'Enter phone number',
                    className: `input input-bordered ${errors[name] ? 'input-error' : ''}`
                  }}
                  containerStyle={{
                    width: '100%'
                  }}
                  buttonStyle={{
                    border: 'none',
                    background: 'transparent',
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                  inputStyle={{
                    width: '100%',
                    height: '50px',
                    paddingLeft: '60px',
                    paddingRight: '16px',
                    borderRadius: 'var(--rounded-btn, 0.5rem)',
                    color: 'currentColor',
                    fontSize: '1rem'
                  }}
                  dropdownStyle={dropdownStyles}
                  containerClass={isDarkTheme ? 'dark-theme-phone' : 'light-theme-phone'}
                />
              )}
            />
            {errors[name] && <span className="text-red-500 text-sm mt-1">{errors[name].message}</span>}
          </div>
        ) : (
          <>
            <input
              type={type}
              placeholder={placeholder}
              className={`input input-bordered ${errors[name] ? 'input-error' : ''} h-[50px] px-4 text-base`}
              {...register(name)}
            />
            {errors[name] && <span className="text-red-500 text-sm mt-1">{errors[name].message}</span>}
          </>
        )}
      </div>
    );
  };
  
  return (
    <div className="p-6 bg-base-100 rounded-lg space-y-6">
      <div className="flex items-center gap-3">
        <Inbox className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-neutral-content">Organization Details</h1>
      </div>
      <div className="bg-base-200 rounded-lg shadow">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload Section */}
            <div className="form-control col-span-1">
              <label className="label">
                <span className="label-text">Logo</span>
              </label>
              <div
                className="border-2 w-full border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-base-100 h-48"
                onClick={() => logoInputRef.current?.click()}
              >
                {!logoPreview ? (
                  <>
                    <Inbox className="h-10 w-10 text-primary mb-2" />
                    <p className="text-neutral-content">Click to upload logo</p>
                    <p className="text-sm text-gray-500">Recommended size: 500x500px</p>
                  </>
                ) : (
                  <div className="relative h-full w-full">
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain rounded-lg" />
                    <button
                      type="button"
                      className="absolute top-2 right-2 btn btn-circle btn-xs btn-error"
                      onClick={handleRemoveLogo}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                />
              </div>
            </div>

            {/* Favicon Upload Section */}
            <div className="form-control col-span-1">
              <label className="label">
                <span className="label-text">Favicon</span>
              </label>
              <div
                className="border-2 w-full border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-base-100 h-48"
                onClick={() => faviconInputRef.current?.click()}
              >
                {!faviconPreview ? (
                  <>
                    <Inbox className="h-10 w-10 text-primary mb-2" />
                    <p className="text-neutral-content">Click to upload favicon</p>
                    <p className="text-sm text-gray-500">Recommended size: 64x64px</p>
                  </>
                ) : (
                  <div className="relative h-full w-full">
                    <img src={faviconPreview} alt="Favicon preview" className="w-full h-full object-contain rounded-lg" />
                    <button
                      type="button"
                      className="absolute top-2 right-2 btn btn-circle btn-xs btn-error"
                      onClick={handleRemoveFavicon}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={faviconInputRef}
                  onChange={handleFaviconUpload}
                />
              </div>
            </div>

            <FormField 
              label="Email" 
              name="email" 
              register={register} 
              errors={errors} 
              placeholder="Ex: your@email.com"
              mandatory={true}
            />

            <FormField 
              label="Phone" 
              name="phone" 
              register={register} 
              control={control}
              errors={errors} 
              placeholder="Ex: 1234567890"
              mandatory={true}
            />

            <FormField 
              label="Location" 
              name="location" 
              register={register} 
              errors={errors} 
              placeholder="Ex: New York, USA"
              mandatory={true}
            />

            <FormField 
              label="Map URL" 
              name="mapUrl" 
              register={register} 
              errors={errors} 
              placeholder="Ex: https://maps.google.com/..."
              mandatory={true}
            />
          </div>
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className={`btn ${isLoading ? 'btn-disabled' : 'btn-primary'} ${
                isLoading ? 'loading' : ''
              }`}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationDetails;