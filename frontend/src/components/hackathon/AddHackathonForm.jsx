import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';

function AddHackathonForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        isVirtual: false,
        prize: '',
        eligibility: '',
        registration: '',
        tags: '',
        websiteUrl: '',
        registrationUrl: '',
        imageUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // Validate dates
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('Invalid date format');
            }
            
            if (startDate >= endDate) {
                throw new Error('End date must be after start date');
            }

            // Convert tags string to array
            const tagsArray = formData.tags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag !== '');

            // Prepare data for Firestore
            const hackathonData = {
                ...formData,
                tags: tagsArray,
                startDate: Timestamp.fromDate(startDate),
                endDate: Timestamp.fromDate(endDate),
                createdAt: Timestamp.now()
            };

            // Remove empty fields
            Object.keys(hackathonData).forEach(key => {
                if (hackathonData[key] === '' || hackathonData[key] === null || hackathonData[key] === undefined) {
                    delete hackathonData[key];
                }
            });

            const docRef = await addDoc(collection(db, 'hackathons'), hackathonData);
            setSuccess(true);
            setTimeout(() => {
                navigate(`/hackathon/${docRef.id}`);
            }, 2000);
        } catch (err) {
            console.error('Error adding hackathon:', err);
            setError(err.message || 'Failed to add hackathon');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-[#0C0950]">Add New Hackathon</h2>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    Hackathon added successfully!
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="name" className="block text-[#161179] text-sm font-bold mb-2">Hackathon Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="location" className="block text-[#161179] text-sm font-bold mb-2">Location *</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        />
                    </div>
                </div>
                
                <div className="mb-4">
                    <label htmlFor="description" className="block text-[#161179] text-sm font-bold mb-2">Description *</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows="4"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="startDate" className="block text-[#161179] text-sm font-bold mb-2">Start Date *</label>
                        <input
                            type="datetime-local"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="endDate" className="block text-[#161179] text-sm font-bold mb-2">End Date *</label>
                        <input
                            type="datetime-local"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        />
                    </div>
                </div>
                
                <div className="mb-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            id="isVirtual"
                            name="isVirtual"
                            checked={formData.isVirtual}
                            onChange={handleChange}
                            className="mr-2 h-4 w-4 text-[#261FB3] focus:ring-[#261FB3] border-gray-300 rounded"
                        />
                        <span className="text-[#161179] text-sm font-bold">This is a virtual event</span>
                    </label>
                </div>
                
                <div className="mb-4">
                    <label htmlFor="prize" className="block text-[#161179] text-sm font-bold mb-2">Prize Information</label>
                    <input
                        type="text"
                        id="prize"
                        name="prize"
                        value={formData.prize}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    />
                </div>
                
                <div className="mb-4">
                    <label htmlFor="eligibility" className="block text-[#161179] text-sm font-bold mb-2">Eligibility</label>
                    <textarea
                        id="eligibility"
                        name="eligibility"
                        value={formData.eligibility}
                        onChange={handleChange}
                        rows="2"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    ></textarea>
                </div>
                
                <div className="mb-4">
                    <label htmlFor="registration" className="block text-[#161179] text-sm font-bold mb-2">Registration Information</label>
                    <textarea
                        id="registration"
                        name="registration"
                        value={formData.registration}
                        onChange={handleChange}
                        rows="2"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    ></textarea>
                </div>
                
                <div className="mb-4">
                    <label htmlFor="tags" className="block text-[#161179] text-sm font-bold mb-2">Tags (comma-separated)</label>
                    <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="e.g., AI, Blockchain, Virtual"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label htmlFor="websiteUrl" className="block text-[#161179] text-sm font-bold mb-2">Website URL</label>
                        <input
                            type="url"
                            id="websiteUrl"
                            name="websiteUrl"
                            value={formData.websiteUrl}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="registrationUrl" className="block text-[#161179] text-sm font-bold mb-2">Registration URL</label>
                        <input
                            type="url"
                            id="registrationUrl"
                            name="registrationUrl"
                            value={formData.registrationUrl}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="imageUrl" className="block text-[#161179] text-sm font-bold mb-2">Image URL</label>
                        <input
                            type="url"
                            id="imageUrl"
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        />
                    </div>
                </div>
                
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#261FB3] hover:bg-[#161179] text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition-colors duration-300"
                    >
                        {loading ? 'Adding...' : 'Add Hackathon'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddHackathonForm; 